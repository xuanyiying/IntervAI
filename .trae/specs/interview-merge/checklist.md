# Interview 模块合并与清理 Checklist

## Gateway 合并验证
- [x] realtime-interview.gateway.ts 已更新使用 InterviewSessionService
- [x] 两个 namespace（/interview 和 /realtime-interview）保持向后兼容

## Service 合并验证
- [x] interview-session.service.ts 包含 streamAnswer 方法
- [x] realtime-interview.service.ts 已删除

## 模块依赖验证
- [x] interview.module.ts 已添加 RealtimeInterviewGateway
- [x] app.module.ts 已移除 RealtimeInterviewModule
- [x] 所有依赖注入正确配置

## 文件清理验证
- [x] realtime-interview.controller.ts 已删除
- [x] realtime-interview.service.ts 已删除
- [x] realtime-interview.module.ts 已删除
- [x] create-realtime-session.dto.ts 已删除
- [x] send-realtime-question.dto.ts 已删除

## 构建验证
- [x] 后端构建通过 (`pnpm --filter @interview-ai/backend build`)
- [x] 前端构建通过 (`pnpm --filter @interview-ai/frontend build`)
