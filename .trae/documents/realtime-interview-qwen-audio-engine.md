# 接入 qwen-audio-3.1-realtime 实时语音面试引擎

## Context

当前实时面试语音链路为三段式管线：paraformer-realtime-v2 ASR → 正则判断问题 → LLM 流式文本 → cosyvoice 整段合成 MP3，延迟高（答案要等 LLM 跑完再合成整段音频）、无法打断。用户要求将 DashScope 的 **qwen-audio-3.1-realtime** 端到端实时语音模型接入两个场景：

- **辅助面试（assist）**：实时听写面试官提问 + AI 文字释义（仅文本输出，不播语音）
- **模拟面试语音通话（VoiceInterviewCall，/interview）**：模型直接扮演面试官，全双工语音对话（语音输出）

已确认的决策：
1. 语音通话模拟面试也一起改（前端改 PCM 流式采集）
2. 辅助面试 AI 回答仅文本（modalities text-only）；模拟面试语音通话有语音输出
3. 默认 realtime 引擎 + 失败自动回退现有管线，前端无感切换

**Qwen-Audio Realtime 协议**（已核实阿里云官方文档）：
- `wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=<model>`，Header `Authorization: Bearer <DASHSCOPE_API_KEY>`
- 客户端事件：`session.update`（配置 instructions/voice/音频格式/turn_detection）、`input_audio_buffer.append`（base64 PCM，20-40ms 帧）、`input_audio_buffer.commit`、`response.create`、`response.cancel`
- 服务端事件：`session.created/updated`、`input_audio_buffer.speech_started/stopped`、`conversation.item.input_audio_transcription.delta/.completed`（用户语音转写）、`response.audio_transcript.delta/.done`（AI 文本）、`response.audio.delta/.done`（AI 音频 PCM）、`response.done`（含 cancelled 状态）
- turn_detection：`server_vad`（自动轮次+自动打断取消当前响应）/ `smart_turn`（语义过滤"嗯啊"）/ `null`（push-to-talk）
- server_vad 模式下模型播报期间检测到用户说话会自动取消响应（原生支持打断）

## 实施步骤

### 1. 后端：QwenRealtimeService（新文件）

`packages/backend/src/features/voice/qwen-realtime.service.ts`

参照 [streaming-asr.service.ts](file:///Users/yiying/dev-app/IntervAI/packages/backend/src/features/voice/streaming-asr.service.ts) 的 ws 客户端模式封装（`ws` 库已在用）：

- `isAvailable()`：`DASHSCOPE_API_KEY` 存在即可用
- `createSession(callbacks, options): QwenRealtimeSession`
  - callbacks：`onPartial(text)`（input_audio_transcription.delta）、`onSentenceEnd(text)`（input_audio_transcription.completed）、`onAnswerDelta(text)`（response.audio_transcript.delta）、`onAnswerDone()`（response.done）、`onAnswerAudio(base64Pcm)`（response.audio.delta）、`onError(msg)`、`onClosed()`
  - options：`{ instructions, voice, outputAudio: boolean, sampleRate=16000, turnDetection='server_vad' }`
- `QwenRealtimeSession`：`sendAudio(buffer)`（→ input_audio_buffer.append base64）、`cancelResponse()`（→ response.cancel）、`finish()`（flush + close）、`close()`
- `session.update` 配置：instructions、voice、`input_audio_format: pcm16/16kHz`、`output_audio_format: pcm16/24kHz`（具体字段名以 fun-audiochat-client-events 文档为准）、`turn_detection: { type: 'server_vad' }`；assist 模式传 text-only（若协议不支持 modalities 字段，则保留音频输出但 gateway 不下发音频，仅消费 transcript）
- 语音映射 helper：cosyvoice voiceId → qwen 实时音色（映射表 + env 默认值）
- 单测：用 `ws` 起本地 mock WS server 验证事件解析/下发

### 2. 后端：会话指令构建

[interview-session.service.ts](file:///Users/yiying/dev-app/IntervAI/packages/backend/src/features/interview/services/interview-session.service.ts) 新增两个方法（复用 `streamAnswer` L839-880 的 resume/job 提取逻辑与 `promptService`）：

- `buildAssistInstructions(sessionId, userId)`：interview-assistant skill 提示词要点 + 简历/JD 上下文 + 约束（只在面试官提问时输出参考答案要点、简洁分点、跟随会话语言）
- `buildMockInterviewerInstructions(sessionId, userId)`：复用 `getInterviewMockPrompts` 的 system/context + 会话问题列表（逐题提问、简短过渡语、不暴露 AI 身份、全部问题问完后输出结束语）

### 3. 后端：/realtime-interview 网关接入 realtime 引擎

[realtime-interview.gateway.ts](file:///Users/yiying/dev-app/IntervAI/packages/backend/src/features/interview/realtime-interview.gateway.ts)：

- `LiveStreamState` 增加 `engine: 'asr' | 'realtime'` 与 `rt?: QwenRealtimeSession`
- `start_stream` 分支逻辑（channel='interviewer' 且 autoAnswer=true 且 env 允许时）→ realtime 引擎：
  - `onPartial` → `transcription_partial`；`onSentenceEnd` → `resolveSpeaker`（声纹逻辑保留）→ `transcription` + `question_detected`（替代原 `looksLikeQuestion` 正则，判断交给模型 instructions）+ transcriptParts 记录
  - `onAnswerDelta` → `answer_chunk`；`onAnswerDone` → `answer_complete`；**音频不下发**（assist 仅文本）
  - 持久化逻辑（finalizeChannelStream 的 transcript 入库）保持不变
- `audio_data` 事件：realtime 引擎时 `state.rt.sendAudio(chunk)`；录音、声纹 PCM tail 逻辑不变
- **回退**：env `REALTIME_INTERVIEW_ENGINE`（`auto` 默认 | `realtime` | `pipeline`）；创建失败（握手 401/ws error）→ 自动降级创建 paraformer ASR session 并 emit `asr_error` 提示；运行中断开 → 同样降级
- `autoAnswer=false` 或 channel='self' → 保持 paraformer 路径（字幕/纯转写场景用便宜模型，不浪费 realtime 成本）
- 手动 `send_question` / `detect_question` / `end_audio` 旧事件路径不动

### 4. 后端：/interview 网关（语音通话模拟面试）realtime 模式

[interview.gateway.ts](file:///Users/yiying/dev-app/IntervAI/packages/backend/src/features/interview/interview.gateway.ts) 新增事件（旧 `audio_chunk`/`end_audio` 保留作管线回退）：

- `voice_start { sessionId }`：创建 realtime 会话，instructions = `buildMockInterviewerInstructions`，`outputAudio: true`，voice 来自 session.voiceId 映射
- `voice_audio { sessionId, audio(base64 PCM16k) }`：转发模型；同时累积服务端录音（PCM → 复用 buildWav，将 buildWav 抽到 `features/voice/wav.util.ts` 共享）
- `voice_stop { sessionId }`：finish 会话 → `finalizeRecording`（WAV 上传 + transcript/recordingUrl 入库）→ 将完整对话（input transcription = 用户回答、response transcript = 面试官提问）写入 Message 表
- 事件下发：`ai_response`（response.audio_transcript.delta 聚合或直接透传 delta）、`ai_audio_chunk`（response.audio.delta base64 PCM24k）、`ai_audio_stop`（response.done）、`transcription`（用户语音 completed）
- 回退：voice_start 失败 → emit error 并提示前端走旧 audio_chunk 流程

### 5. 前端：流式 PCM 播放 + 语音通话采集改造

- [utils/pcm.ts](file:///Users/yiying/dev-app/IntervAI/packages/frontend/src/utils/pcm.ts) 新增 `PcmStreamPlayer`：AudioContext(24kHz) + AudioBuffer 调度队列，`playChunk(base64)` / `stop()`（打断清队列）
- [VoiceInterviewCall.tsx](file:///Users/yiying/dev-app/IntervAI/packages/frontend/src/components/VoiceInterviewCall.tsx)：
  - 采集改为 AudioContext + ScriptProcessor → `floatTo16BitBase64`（16kHz，复制 AssistModeView/MockModeView 已有模式），新事件 `voice_start`/`voice_audio`/`voice_stop`
  - 播放接 `ai_audio_chunk` → PcmStreamPlayer；`ai_audio_stop` 停止
  - **回声门控**：AI 播报期间暂停发送 PCM（`ai_speaking` 状态门），用户说话（按键/检测到本地音量）→ `stop()` 播放 + 发 `response.cancel` 由服务端转发，恢复发送
  - 保留旧 `audio_chunk`/`end_audio` 代码路径作为回退分支（后端报错时切换）
- [useInterviewSocket.ts](file:///Users/yiying/dev-app/IntervAI/packages/frontend/src/hooks/useInterviewSocket.ts)：新增 `onAiAudioChunk`/`onAiAudioStop` 回调与 `startVoiceStream`/`sendVoiceAudio`/`stopVoiceStream` 方法；AssistModeView/MockModeView 无需改动（事件契约未变）

### 6. 配置与文档

- [voice.module.ts](file:///Users/yiying/dev-app/IntervAI/packages/backend/src/features/voice/voice.module.ts) 注册 QwenRealtimeService
- [.env.example](file:///Users/yiying/dev-app/IntervAI/packages/backend/.env.example) 新增：`QWEN_REALTIME_AUDIO_MODEL`（默认 `qwen-audio-3.1-realtime`，按账号模型列表可调）、`QWEN_REALTIME_URL`（默认官方 wss 端点）、`QWEN_REALTIME_VOICE`（默认音色）、`REALTIME_INTERVIEW_ENGINE=auto`

## 验证

1. **构建**：`pnpm --filter @interview-ai/backend build` + `pnpm --filter @interview-ai/frontend build`
2. **单测**：QwenRealtimeService 事件解析（本地 mock WS server）；gateway 引擎选择/回退逻辑（jest，`pnpm --filter @interview-ai/backend test -- --testPathPattern "interview|voice"`）
3. **手动 E2E**（需 DASHSCOPE_API_KEY）：
   - 启动 `pnpm dev`，进入辅助面试 → 共享标签页音频 → 验证 `transcription_partial`/`transcription`/`answer_chunk` 仍正常且答案为文本、无音频播放
   - 语音通话模拟面试 → 说一段话 → 验证 AI 语音流式播出、说话可打断（播放停止、模型取消当前响应）
   - 断网/错 Key 场景：改错 QWEN_REALTIME_URL 重启 → 验证自动回退旧管线，功能不中断
   - 结束通话 → 验证录音 WAV 与 transcript 已入库（Prisma Studio 查看）

## 风险与说明

- `modalities` text-only 字段与 3.1 realtime 音色名需在实现时以官方 client-events 文档核对（协议字段在 session.update 中，若不支持 text-only 则 assist 不下发音频、成本略增）
- realtime 引擎下辅助面试无法再做说话人区分的"防误答"（声纹只能修正字幕标注，模型已自动应答）——单通道 tab 音频采集场景影响有限，文档中说明
- 模拟面试 realtime 模式下 per-answer 评分改为通话结束后基于完整 transcript 评估（现有 complete 流程复用）
