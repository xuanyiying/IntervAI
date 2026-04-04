# 四大核心功能上线修复 Spec

## Why

经过全项目深度代码审查，发现四大核心功能存在 3 个阻塞/严重问题导致无法上线：
1. **P0 致命**：自我介绍（PitchPerfect/履历点睛）前端 UI 完整但**后端 API 完全缺失**，调用 `/agents/pitch-perfect/generate` 直接返回 404
2. **P1 严重**：简历优化的 AI 增强建议生成代码被注释掉，仅靠规则引擎输出低质量通用建议
3. **P1 严重**：全部四个模块零测试覆盖，生产环境无回归保障

## What Changes

- 新增 `skills/pitch-perfect.md` Skill 定义文件（复用项目现有 Skills 引擎）
- 新增 `features/agents/` 目录，包含轻量级 PitchPerfect Controller/Service，直接调用 `aiService.executeSkill('pitch-perfect', ...)`
- 取消 `resume-optimizer.service.ts` 中 AI 增强建议的注释，接入 `resume-writer` skill
- 为四个核心模块补充关键单元测试（Service 层）

## Impact

- Affected specs: 无（全新修复）
- Affected code:
  - `packages/backend/skills/pitch-perfect.md` — 新建 Skill 定义
  - `packages/backend/src/features/agents/` — 新建轻量级 Controller/Service（直接调用 Skills 引擎）
  - `packages/backend/src/features/resume/services/resume-optimizer.service.ts` — 取消注释 + 增强
  - `packages/backend/src/app.module.ts` — 注册 AgentsModule
  - `packages/backend/src/features/resume/*.spec.ts` — 新建测试
  - `packages/backend/src/features/interview/*.spec.ts` — 新建测试

---

## ADDED Requirements

### Requirement: PitchPerfect Skill 定义

系统 SHALL 提供 `pitch-perfect` Skill 定义，供 AIService.executeSkill() 调用。

#### Skill 输入定义

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| resumeData | object | 是 | 解析后的简历数据（ParsedResumeData） |
| jobDescription | string | 是 | 目标职位描述 |
| style | string | 否 | 风格：technical/managerial/sales，默认 technical |
| duration | number | 否 | 时长：30 或 60 秒，默认 30 |

#### Skill 输出定义

```typescript
{
  introduction: string,           // 生成的自我介绍文本
  highlights: string[],           // 关键亮点列表
  keywordOverlap: {
    matched: string[],            // 已匹配的关键词
    missing: string[],            // 缺失的关键词
    overlapPercentage: number     // 匹配百分比
  },
  suggestions: string[]           // 改进建议
}
```

### Requirement: PitchPerfect 后端 API

系统 SHALL 提供自我介绍生成端点，直接调用 Skills 引擎。

#### Scenario: 生成自我介绍

- **WHEN** 前端发送 `POST /agents/pitch-perfect/generate` 携带 `{ resumeData, jobDescription, style, duration }`
- **THEN** 后端调用 `aiService.executeSkill('pitch-perfect', inputs, userId)`
- **AND** 返回 `PitchPerfectAgentOutput` 格式数据

#### Scenario: 迭代微调自我介绍

- **WHEN** 前端发送 `POST /agents/pitch-perfect/refine` 携带 `{ currentIntroduction, feedback }`
- **THEN** 后端构建 refinement prompt 并调用 AI 生成优化版本
- **AND** 返回 `{ refinedIntroduction: string }`

### Requirement: 简历优化 AI 增强建议恢复

系统 SHALL 恢复并增强简历优化中的 AI 驱动建议生成能力。

#### Scenario: AI 增强建议生成

- **WHEN** 调用 `generateSuggestions()` 方法
- **THEN** 除规则引擎外，同时调用 `aiService.executeSkill('resume-writer', ...)` 生成高质量优化建议
- **AND** AI 调用失败时优雅降级为纯规则建议

### Requirement: 核心模块测试覆盖

系统 SHALL 为四个核心功能的 Service 层提供基础单元测试。

---

## MODIFIED Requirements

### Requirement: ResumeOptimizerService.generateSuggestions()

修改前：仅使用规则引擎生成建议，AI 增强部分被注释。
修改后：规则引擎 + AI (`resume-writer` skill) 合并输出，AI 失败时自动降级。

### Requirement: AppModule 模块注册

修改前：未注册 AgentsModule。
修改后：新增导入 AgentsModule（轻量级，仅包含 PitchPerfect 相关）。

---

## REMOVED Requirements

无
