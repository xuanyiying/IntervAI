# Tasks

- [x] Task 1: 创建 PitchPerfect Skill 定义文件
  - [x] 1.1 在 `packages/backend/skills/pitch-perfect.md` 创建 Skill 定义，复用项目现有 Skills 引擎格式
  - [x] 1.2 定义 YAML frontmatter：name=pitch-perfect, version=1.0.0, inputs(resumeData/jobDescription/style/duration), outputs(PitchPerfectAgentOutput)
  - [x] 1.3 编写中英双语 prompt，包含：自我介绍结构指南、风格适配(technical/managerial/sales)、时长控制(30s/60s)、关键词匹配、亮点提炼
  - [x] 1.4 输出 JSON 格式与前端 PitchPerfectAgentOutput 类型完全匹配

- [x] Task 2: 创建 PitchPerfect 后端 API（轻量级，直接调用 Skills 引擎）
  - [x] 2.1 创建 `packages/backend/src/features/agents/agents.module.ts` — 导入 AIModule, PrismaModule，注册 PitchPerfectService
  - [x] 2.2 创建 `packages/backend/src/features/agents/dto/pitch-perfect.dto.ts` — GeneratePitchDto, RefinePitchDto（与前端 agent-service.ts 参数一致）
  - [x] 2.3 创建 `packages/backend/src/features/agents/services/pitch-perfect.service.ts`
    - `generatePitch()`: 调用 `this.aiService.executeSkill('pitch-perfect', { resumeData, jobDescription, style, duration }, userId)` → 解析 JSON 返回
    - `refinePitch()`: 构建 refinement prompt → 调用 `this.aiService.generate()` → 返回优化文本
  - [x] 2.4 创建 `packages/backend/src/features/agents/controllers/pitch-perfect.controller.ts`
    - `POST /agents/pitch-perfect/generate` — JwtAuthGuard + @Throttle({ default: { limit: 10, ttl: 60000 } })
    - `POST /agents/pitch-perfect/refine` — JwtAuthGuard + @Throttle
  - [x] 2.5 在 `app.module.ts` 中导入 AgentsModule

- [x] Task 3: 恢复简历优化 AI 增强建议（P1 修复）
  - [x] 3.1 取消 `resume-optimizer.service.ts` 第351-378行被注释的 AI 增强建议代码
  - [x] 3.2 修改代码：将注释中的旧 API 替换为 `this.aiService.executeSkill('resume-writer', { resumeData, jobData }, userId)`
  - [x] 3.3 添加 try-catch 包装，AI 调用失败时降级为纯规则建议（不阻塞主流程）
  - [x] 3.4 添加 `parseAISuggestions()` 和 `mapSuggestionType()` 辅助方法

- [x] Task 4: 补充核心模块单元测试（P1 修复）
  - [x] 4.1 创建 `packages/backend/src/features/resume/services/resume-optimizer.service.spec.ts`
    - 测试 calculateMatchScore：覆盖技能匹配/经验匹配/教育匹配/关键词覆盖
    - 测试 generateSuggestions：验证 AI 调用 + 规则引擎合并
    - 测试 applySuggestion：验证建议应用后简历数据正确更新
  - [x] 4.2 创建 `packages/backend/src/features/interview/services/interview-session.service.spec.ts`
    - 测试 startSession：验证会话创建/配额检查/问题加载
    - 测试 submitAnswer：验证答案保存/下一题返回
    - 测试 handleMessage：验证 ASSIST/MOCK 双模式响应
  - [x] 4.3 创建 `packages/backend/src/features/agents/services/pitch-perfect.service.spec.ts`
    - 测试 generatePitch：验证 skill 调用和 JSON 解析
    - 测试 refinePitch：验证 refinement prompt 构建

- [x] Task 5: 构建验证
  - [x] 5.1 运行 `pnpm --filter @interview-ai/backend build` 确认后端构建成功
  - [x] 5.2 运行 `pnpm --filter @interview-ai/frontend build` 确认前端构建成功

# Task Dependencies
- [Task 2] depends on [Task 1] — Service 依赖 Skill 定义文件存在才能正确调用
- [Task 3] is independent — 可与 Task 1/2 并行执行
- [Task 4] depends on [Task 2, Task 3] — 测试依赖被测代码完成
- [Task 5] depends on [Task 1, Task 2, Task 3, Task 4]

# Parallel Execution Strategy
- **Wave 1 (并行)**: Task 1 + Task 3 — Skill 定义和简历优化修复无依赖，可同时进行
- **Wave 2**: Task 2 — 依赖 Task 1 完成
- **Wave 3**: Task 4 — 依赖 Task 2 和 Task 3
- **Wave 4**: Task 5 — 最终验证
