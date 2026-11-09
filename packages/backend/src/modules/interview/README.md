# Interview 模块

AI 驱动的模拟面试，位于 `src/modules/interview/`，提供题目生成、文字会话、实时语音会话、答案评估与报告。

## 目录结构

```
interview/
├── controllers/                 # /interview REST、声纹、面试官人格
├── gateways/                    # Socket.IO /interview、/realtime-interview
├── services/
│   ├── interview.service.ts             # Facade，代理到子服务
│   ├── interview-ai.service.ts          # AI 调用（音频转录走 DashScope ASR）
│   ├── question-generator.service.ts    # 题目生成
│   ├── interview-question.service.ts    # 题目查询
│   ├── interview-session.service.ts     # 会话生命周期与答案评估
│   ├── interview-report.service.ts      # 报告生成
│   ├── interviewer-persona.service.ts   # 面试官人格
│   └── *.spec.ts
├── dto/                         # 请求 DTO
├── interfaces/                  # answer-evaluation.types.ts
└── interview.module.ts
```

`InterviewService` 是 Facade，实际逻辑拆分在 `InterviewSessionService`、`QuestionGeneratorService`、`InterviewQuestionService` 等子服务中。

## 关联的 Skills

题目生成使用 `interview-question-generator`，答案评估使用 `answer-evaluator`，面试准备与实时辅助分别有 `interview-prep`、`interview-assistant` 定义（见 [Skills 引擎](../../../../../docs/technical/skills-engine.md)）。实时语音由 `modules/voice/services/qwen-realtime.service.ts` 与 `REALTIME_INTERVIEW_ENGINE`（`auto` / `realtime` / `pipeline`）控制，依赖 `DASHSCOPE_API_KEY` 与 `QWEN_REALTIME_*` 配置。

## 数据模型

`InterviewSession`、`InterviewMessage`、`InterviewQuestion`、`InterviewerPersona`，以及声纹相关的 `Voice`、`SpeakerProfile`。

## 相关文档

- [后端 README](../../../README.md) · [系统架构](../../../../../docs/architecture/system-architecture.md) · [环境变量示例](../../../.env.example)
