# 验证清单

## PitchPerfect Skill 定义（Task 1）
- [x] `packages/backend/skills/pitch-perfect.md` 文件存在且格式正确
- [x] YAML frontmatter 格式正确（name, version, inputs, outputs）
- [x] inputs 包含 resumeData(object, required), jobDescription(string, required), style(enum), duration(enum)
- [x] outputs 定义与前端 PitchPerfectAgentOutput 类型匹配
- [x] Prompt 包含中英双语、风格适配、时长控制、关键词匹配指南

## PitchPerfect 后端 API（Task 2）
- [x] `packages/backend/src/features/agents/agents.module.ts` 存在并正确导入 AIModule
- [x] `packages/backend/src/features/agents/dto/pitch-perfect.dto.ts` 包含 GeneratePitchDto 和 RefinePitchDto
- [x] `packages/backend/src/features/agents/services/pitch-perfect.service.ts` 存在
  - [x] generatePitch() 方法调用 `this.aiService.executeSkill('pitch-perfect', ...)`
  - [x] refinePitch() 方法可正常工作
- [x] `packages/backend/src/features/agents/controllers/pitch-perfect.controller.ts` 存在
  - [x] POST /agents/pitch-perfect/generate 端点存在
  - [x] POST /agents/pitch-perfect/refine 端点存在
  - [x] 两个端点都使用 JwtAuthGuard
  - [x] 两个端点都有 @Throttle 限流装饰器
- [x] `app.module.ts` 已导入 AgentsModule

## 简历优化 AI 增强（Task 3）
- [x] `resume-optimizer.service.ts` 中 AI 增强建议代码已取消注释
- [x] AI 调用使用 `this.aiService.executeSkill('resume-writer', ...)` 方式
- [x] AI 调用有 try-catch 降级处理
- [x] 添加了 `parseAISuggestions()` 和 `mapSuggestionType()` 辅助方法

## 单元测试（Task 4）
- [x] `packages/backend/src/features/resume/services/resume-optimizer.service.spec.ts` 存在
  - [x] calculateMatchScore 测试覆盖
  - [x] generateSuggestions 测试覆盖
  - [x] applySuggestion 测试覆盖
  - [x] parseAISuggestions 测试覆盖
- [x] `packages/backend/src/features/interview/services/interview-session.service.spec.ts` 存在
  - [x] startSession 测试覆盖
  - [x] submitAnswer 测试覆盖
  - [x] handleMessage 测试覆盖
- [x] `packages/backend/src/features/agents/services/pitch-perfect.service.spec.ts` 存在
  - [x] generatePitch 测试覆盖
  - [x] refinePitch 测试覆盖
  - [x] parsePitchOutput 测试覆盖

## 构建验证（Task 5）
- [x] `pnpm --filter @interview-ai/backend build` 执行成功，无编译错误
- [x] `pnpm --filter @interview-ai/frontend build` 执行成功，无编译错误
