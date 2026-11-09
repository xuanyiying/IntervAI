# 文档中心

本目录只保留与当前代码一致的说明文档。一次性提案、历史评审、旧版 Agent 架构文档已从仓库移除（如需查阅请通过 Git 历史找回）。

## 架构与技术参考

| 文档                                              | 内容                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| [系统架构](./architecture/system-architecture.md) | 分层结构、后端模块、API / WebSocket、数据层、AI 与部署构成        |
| [Skills 引擎](./technical/skills-engine.md)       | Skill 定义格式、加载与执行流程、12 个内置技能、扩展方式与已知限制 |

## 开发指南

| 文档                                               | 内容                                                   |
| -------------------------------------------------- | ------------------------------------------------------ |
| [环境配置与开发指南](./guide/environment-setup.md) | 依赖服务、环境变量、迁移、启动与常用命令               |
| [CI/CD 工作流](./guide/workflows.md)               | `ci.yml`、`deploy.yml`、`release.yml` 的触发条件与任务 |
| [监控策略](./guide/monitoring.md)                  | 实际可用的健康检查、指标、告警端点与配置               |
| [安全策略](./guide/security.md)                    | 鉴权、请求防护、密钥管理与漏洞报告                     |
| [分支保护规则](./guide/branch-protection.md)       | `main` 分支建议规则与 CI 状态检查名称                  |

## 各模块文档

- [部署与运维](../deployment/README.md) — `deploy.sh`、compose、Caddy、数据库脚本
- [后端 README](../packages/backend/README.md) · [前端 README](../packages/frontend/README.md)
- [验证测试](../tests/verification/README.md) · [后端 E2E 测试](../packages/backend/test/e2e/README.md)
- 模块级说明：[存储](../packages/backend/src/modules/storage/README.md) · [支付（EE）](../packages/backend/src/ee/payment/README.md) · [面试](../packages/backend/src/modules/interview/README.md)

## 根目录

- [项目 README](../README.md) · [贡献指南](../CONTRIBUTING.md) · [CLAUDE.md](../CLAUDE.md)（AI 编码助手指引）

## 非文档类 Markdown

以下 `.md` 由程序读取或由评测工具生成，请勿按说明文档维护：

- `packages/backend/skills/*.md`：运行时 AI 技能定义（YAML frontmatter + prompt）
- `packages/backend/skills-eval/*/SKILL.md` 与 `evals/eval.yaml`：评测用例
- `packages/backend/skills-eval/*-workspace/**`：`skill-up` 生成产物（已被 `.gitignore` 忽略）
- `.github/ISSUE_TEMPLATE/`、`.github/pull_request_template.md`：Issue / PR 模板
