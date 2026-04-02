# 实时面试辅助功能 - 实现计划

## 项目概述
在现有的面试系统基础上，新增"实时面试辅助"功能，帮助用户在真实线上面试中获得实时答案生成和语音支持。复用现有的 InterviewSession 和 InterviewMessage 模型，角色转换：系统扮演面试者，用户扮演面试官。

---

## [ ] 任务 1: 后端服务 - 创建 RealtimeInterviewService 核心服务
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建 RealtimeInterviewService 服务
  - 实现会话管理（创建、结束、获取状态）- 复用 InterviewSession 模型，添加 type 字段区分模拟面试/实时辅助
  - 实现问题识别和答案生成逻辑
  - 集成现有 AIService 和流式输出功能
  - 角色反转：USER 角色是面试官提问，ASSISTANT 角色是面试者回答
- **Success Criteria**:
  - 服务正常运行
  - 能够创建会话并生成实时答案
  - 支持流式输出答案
- **Test Requirements**:
  - `programmatic` TR-1.1: 创建新的实时面试会话 API 测试
  - `programmatic` TR-1.2: 提交问题并获取答案 API 测试
  - `programmatic` TR-1.3: 答案流式输出验证
  - `human-judgement` TR-1.4: 答案质量符合预期（基于用户简历和JD）

---

## [ ] 任务 2: 后端 WebSocket - 创建 RealtimeInterviewGateway
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**: 
  - 创建 RealtimeInterviewGateway
  - 支持实时音频流传输
  - 集成语音识别（ASR）识别面试官问题
  - 集成语音合成（TTS）播放答案
  - 实现问题和答案的实时推送
- **Success Criteria**:
  - WebSocket 连接正常建立
  - 可以通过语音识别问题
  - 可以实时接收流式答案
  - 可以播放答案语音
- **Test Requirements**:
  - `programmatic` TR-2.1: WebSocket 连接认证测试
  - `programmatic` TR-2.2: 语音识别功能测试
  - `programmatic` TR-2.3: 答案流式推送测试
  - `human-judgement` TR-2.4: 实时响应延迟可接受（<2秒）

---

## [ ] 任务 3: 后端 Controller 和 DTO
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**: 
  - 创建 RealtimeInterviewController
  - 定义必要的 DTO（创建会话、上传简历JD、配置参数等）
  - 实现 REST API 端点
- **Success Criteria**:
  - 所有 API 端点正常工作
  - 请求验证通过
  - 错误处理正确
- **Test Requirements**:
  - `programmatic` TR-3.1: 所有 API 端点的单元测试
  - `programmatic` TR-3.2: 集成测试验证完整流程

---

## [ ] 任务 4: 后端模块集成
- **Priority**: P0
- **Depends On**: 任务 1, 2, 3
- **Description**: 
  - 创建 RealtimeInterviewModule
  - 导入必要的依赖（PrismaModule, AIModule, VoiceModule, RedisModule等）
  - 集成到主应用模块
- **Success Criteria**:
  - 模块成功导入和初始化
  - 服务正常启动
- **Test Requirements**:
  - `programmatic` TR-4.1: 应用成功启动
  - `programmatic` TR-4.2: 模块依赖注入正确

---

## [ ] 任务 5: 提示词工程 - 面试者角色提示词
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**: 
  - 创建实时面试辅助的系统提示词 - 面试者角色
  - 优化提示词以提供更好的答案质量
  - 支持根据简历和JD定制答案
  - 支持不同的回答风格（简洁/详细/专业等）
- **Success Criteria**:
  - 提示词能生成高质量的面试答案
  - 答案基于用户简历和目标JD
- **Test Requirements**:
  - `human-judgement` TR-5.1: 答案质量评估
  - `human-judgement` TR-5.2: 答案风格多样性验证

---

## [ ] 任务 6: 前端服务层 - API 集成
- **Priority**: P1
- **Depends On**: 任务 3
- **Description**: 
  - 创建 realtime-interview-service.ts
  - 定义类型接口
  - 实现与后端 API 的通信
  - 实现 WebSocket 客户端连接
- **Success Criteria**:
  - 前端可以成功调用后端 API
  - WebSocket 连接正常
- **Test Requirements**:
  - `programmatic` TR-6.1: API 服务函数测试
  - `programmatic` TR-6.2: WebSocket 连接测试

---

## [ ] 任务 7: 前端状态管理和 Hooks
- **Priority**: P1
- **Depends On**: 任务 6
- **Description**: 
  - 创建 useRealtimeInterview hook
  - 创建相关状态管理（Zustand store）
  - 管理会话状态、音频状态、流式答案状态
- **Success Criteria**:
  - 状态管理正确
  - 组件间数据同步正常
- **Test Requirements**:
  - `programmatic` TR-7.1: Hook 功能测试
  - `programmatic` TR-7.2: 状态同步测试

---

## [ ] 任务 8: 前端页面 - 实时面试辅助界面
- **Priority**: P1
- **Depends On**: 任务 7
- **Description**: 
  - 创建 RealtimeInterviewPage.tsx
  - 实现会话创建和配置界面（上传简历、JD、设置偏好）
  - 实现实时面试界面（问题输入、答案流式显示、语音控制）
  - 集成语音录制和播放功能
  - 添加到路由配置
- **Success Criteria**:
  - 页面可以正常访问
  - UI 交互流畅
  - 实时功能正常工作
- **Test Requirements**:
  - `human-judgement` TR-8.1: UI 美观且易用
  - `programmatic` TR-8.2: 页面路由正常
  - `human-judgement` TR-8.3: 实时答案显示流畅

---

## [ ] 任务 9: 文档和国际化
- **Priority**: P2
- **Depends On**: 任务 8
- **Description**: 
  - 添加中文和英文的国际化文本
  - 更新相关文档
- **Success Criteria**:
  - 界面文本支持中英文切换
  - 文档完整
- **Test Requirements**:
  - `human-judgement` TR-9.1: 国际化文本验证
  - `human-judgement` TR-9.2: 文档完整性检查

---

## 关键技术决策
1. **复用现有组件**: 尽可能复用现有的 InterviewGateway、VoiceService、AIService、InterviewSession、InterviewMessage
2. **WebSocket 架构**: 扩展现有的 Socket.io 架构，新增 namespace 或复用现有
3. **流式输出**: 直接利用 AIService 已有的 stream 方法
4. **语音处理**: 复用 AlibabaVoiceService 的 ASR 和 TTS 功能
5. **数据模型**: 复用 InterviewSession 和 InterviewMessage，通过添加 metadata 或类型字段区分

## 角色转换说明
- **原模拟面试**: ASSISTANT 是面试官提问，USER 是面试者回答
- **新实时辅助**: USER 是面试官输入问题（或语音识别），ASSISTANT 是面试者生成答案

## 风险评估
- 实时语音识别的准确性：依赖第三方服务，可能有延迟或错误
- 网络延迟：影响实时体验
- 用户隐私：需要明确告知用户数据使用方式

## 后续优化方向
1. 支持多种语言识别
2. 答案个性化优化
3. 历史答案回顾和整理
4. 面试表现分析
