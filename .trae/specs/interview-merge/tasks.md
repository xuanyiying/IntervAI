# Tasks

- [x] Task 1: 合并后端 Gateway — 统一 interview.gateway.ts 支持 mock 和 assist 模式
  - [x] 1.1 更新 realtime-interview.gateway.ts 使用 InterviewSessionService
  - [x] 1.2 保持两个 namespace（/interview 和 /realtime-interview）向后兼容

- [x] Task 2: 合并后端 Service — 将 realtime-interview.service.ts 能力合并到 interview-session.service.ts
  - [x] 2.1 在 interview-session.service.ts 中添加 streamAnswer 方法
  - [x] 2.2 删除 realtime-interview.service.ts

- [x] Task 3: 更新模块依赖 — 确保合并后的服务正确注册
  - [x] 3.1 更新 interview.module.ts，添加 RealtimeInterviewGateway
  - [x] 3.2 更新 app.module.ts，移除 RealtimeInterviewModule
  - [x] 3.3 确保所有依赖注入正确

- [x] Task 4: 清理废弃文件
  - [x] 4.1 删除 `/packages/backend/src/features/interview/realtime-interview.controller.ts`
  - [x] 4.2 删除 `/packages/backend/src/features/interview/realtime-interview.gateway.ts`（保留，已更新使用 InterviewSessionService）
  - [x] 4.3 删除 `/packages/backend/src/features/interview/services/realtime-interview.service.ts`
  - [x] 4.4 删除 `/packages/backend/src/features/interview/realtime-interview.module.ts`
  - [x] 4.5 删除 `/packages/backend/src/features/interview/dto/create-realtime-session.dto.ts`
  - [x] 4.6 删除 `/packages/backend/src/features/interview/dto/send-realtime-question.dto.ts`

- [x] Task 5: 验证构建通过
  - [x] 5.1 运行 `pnpm --filter @interview-ai/backend build` 确认构建成功
  - [x] 5.2 运行 `pnpm --filter @interview-ai/frontend build` 确认前端构建成功

# Task Dependencies
- [Task 2] depends on [Task 1] — Service 合并依赖 Gateway 事件定义
- [Task 3] depends on [Task 1, Task 2] — 模块依赖更新在代码合并后
- [Task 4] depends on [Task 3] — 清理废弃文件在依赖更新后
- [Task 5] depends on [Task 1, Task 2, Task 3, Task 4]
