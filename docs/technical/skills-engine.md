# Skills 引擎

Skills 引擎把 AI 能力定义为带 YAML frontmatter 的 Markdown 文件，服务启动时自动扫描加载，业务服务通过 `aiService.executeSkill()` 调用。它是当前 AI 架构的唯一扩展机制；旧版 LangChain 三 Agent / Workflow 已不在代码中。

## 代码位置

```
packages/backend/
├── src/modules/ai/
│   ├── skills/                          # 技能引擎实现
│   │   ├── index.ts                     # 导出
│   │   ├── skill-registry.ts            # 注册、查找、执行
│   │   ├── skill-loader.ts              # 目录扫描与加载
│   │   ├── skill-markdown-parser.ts     # frontmatter + 模板解析
│   │   └── skill-installer.service.ts   # 远程安装
│   └── interfaces/                      # 模块公开契约
│       ├── skill.interface.ts           # SkillDefinition / 输入输出类型
│       └── skill-package.interface.ts   # 技能包结构
└── skills/                              # 12 个 .md 技能定义
```

`AiModule.onModuleInit()` 调用 `skillLoader.initialize()` 完成启动加载。加载目录默认为 `process.cwd()/skills`，可用 `SKILLS_DIR` 覆盖；相关变量还有 `BUILTIN_SKILLS_DIR`、`ENABLE_REMOTE_SKILLS`、`CACHE_SKILLS`。

## 12 个内置技能

| 技能文件                          | 用途                    | 主要调用方                                                 |
| --------------------------------- | ----------------------- | ---------------------------------------------------------- |
| `resume-analyzer.md`              | 简历解析与结构化评估    | `modules/resume/services/resume-ai.service.ts`            |
| `resume-writer.md`                | 优化后的简历内容生成    | 简历优化链路                                               |
| `jd-matcher.md`                   | JD 与简历匹配分析       | `modules/resume/services/match-analysis.service.ts`       |
| `job-parser.md`                   | 职位文本结构化          | `modules/job/services/job-ai.service.ts`                           |
| `interview-question-generator.md` | 按简历 / 职位生成面试题 | `modules/interview/services/interview-ai.service.ts`      |
| `interview-prep.md`               | 面试准备材料            | 面试准备链路                                               |
| `interview-assistant.md`          | 面试过程中的实时辅助    | 实时面试网关相关链路                                       |
| `answer-evaluator.md`             | 答案评分与反馈          | `modules/interview/services/interview-session.service.ts` |
| `pitch-perfect.md`                | 自我介绍 / 电梯演讲     | `modules/agents/services/pitch-perfect.service.ts`        |
| `career-advisor.md`               | 职业发展建议            | 对话意图链路                                               |
| `skill-analyzer.md`               | 技能差距分析            | `modules/chat/services/chat-intent.service.ts`                         |
| `salary-analyzer.md`              | 薪资分析与谈判建议      | 对话意图链路                                               |

## 定义格式

```markdown
---
name: my-skill
version: 1.0.0
description: 技能说明
author: Your Name
tags: [resume, analysis]
maxTokens: 2000
inputs:
  resumeText:
    type: string
    required: true
    description: 简历正文
outputs:
  type: object
---

# System Prompt

请分析以下简历：{{resumeText}}
```

- frontmatter 由 `skill-markdown-parser.ts` 解析，正文作为 prompt 模板。
- 模板支持 `{{inputName}}` 变量替换、`{{#if key}}...{{/if}}` 条件块（key 为空或假值时整块移除），对象 / 数组输入按 JSON 注入。
- 输入类型做严格 `typeof` 校验：声明为 `object` 的参数必须传对象，不能传 JSON 字符串。

## 执行流程

1. Loader 扫描目录中的 `.md`，Parser 解析 frontmatter 与 prompt，Registry 按 `name` 注册。
2. 业务服务调用 `aiService.executeSkill(name, inputs, userId)`。
3. Registry 校验必填输入并渲染模板，通过 `ai.chat` 调用选定模型；`AI_MODEL` 决定默认模型（`provider:model` 格式）。
4. 结果返回业务服务，用量与调用日志进入 `UsageRecord` / `AICallLog` 等表。

```typescript
const result = await aiService.executeSkill(
  'resume-analyzer',
  { resumeText: '...', targetJob: 'Software Engineer' },
  userId
);
const skills = aiService.getSkills();
```

## 扩展与限制

- `skill-installer.service.ts` 目前仅远程 URL 安装可用；NPM 安装、GitHub 安装、YAML 技能加载在代码中明确标注为 `not implemented`，请勿在文档中写成已支持。
- `skills/` 下没有 `builtin/` 子目录（代码里仍有相关常量字符串），新增技能直接放入 `skills/`。
- `packages/backend/skills-eval/` 是独立的评测用例（`*/SKILL.md` + `evals/eval.yaml`），`*-workspace/` 为 `skill-up` 生成产物且已被 `.gitignore` 忽略，不参与运行时加载。
- `packages/backend/Dockerfile` 已在构建阶段执行 `cp -r packages/backend/skills /app/deploy/skills`，运行时镜像工作目录 `/app` 下即为 `skills/`，与 `skill-loader.ts` 的默认加载路径一致。

## 相关文档

- [系统架构](../architecture/system-architecture.md)
- [后端 README](../../packages/backend/README.md)
