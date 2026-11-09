# 贡献指南

欢迎提交 Issue 与 Pull Request。本指南只描述仓库中实际可用的流程与命令。

## 环境准备

- Node.js >= 18、pnpm >= 9
- PostgreSQL 16、Redis 7（可用 `docker compose -f deployment/docker-compose.yml up -d` 启动，含 MinIO 与 Jaeger）
- Docker Compose v2

```bash
git clone https://github.com/xuanyiying/IntervAI.git
cd IntervAI
pnpm install
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
pnpm --filter @interview-ai/backend prisma:generate
pnpm --filter @interview-ai/backend prisma:migrate
pnpm dev
```

更完整的说明见 [环境配置与开发指南](./docs/guide/environment-setup.md)。

## 开发流程

1. 从 `main` 创建分支：`git checkout -b feat/xxx`
2. 修改代码并补充测试
3. 提交前在本地验证：

```bash
pnpm lint            # ESLint
pnpm typecheck       # turbo run typecheck
pnpm test            # turbo run test（backend Jest、frontend Vitest、verification Jest）
pnpm format:check    # Prettier 检查
```

4. 按需分别运行：`pnpm --filter @interview-ai/backend test:cov`、`pnpm --filter @interview-ai/frontend test:coverage`、`pnpm --filter @interview-ai/verification test`
5. 构建校验：`pnpm build:backend`、`pnpm build:frontend`（根目录没有 `pnpm build` 脚本）
6. 推送并创建 PR，填写 `.github/pull_request_template.md`，关联 Issue

CI（`.github/workflows/ci.yml`）在 push / PR 到 `main`、`develop` 时运行 `lint`、`backend`、`frontend` 三个 job；分支保护建议见 [分支保护规则](./docs/guide/branch-protection.md)。

## 代码规范

- 使用 TypeScript，遵循现有 ESLint / Prettier 配置（`pnpm lint:fix`、`pnpm format`）
- 后端遵循 NestJS 的 module / controller / service 分层，使用 DTO 做入参校验，新增能力优先考虑 `packages/backend/skills/` 下的 Skill 定义（格式见 [Skills 引擎](./docs/technical/skills-engine.md)）
- 前端使用函数组件 + hooks，状态放 Zustand store，UI 优先使用 Ant Design 6 组件
- 新增或修改 API 时同步更新 Swagger 装饰器与相关文档
- 不提交 `.env`、密钥或生成产物（见 `.gitignore`）

## 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：`<type>(<scope>): <subject>`，常用类型为 `feat`、`fix`、`docs`、`refactor`、`test`、`chore`。

```
feat(interview): add voiceprint verification

Closes #123
```

## 报告问题

在 [GitHub Issues](https://github.com/xuanyiying/IntervAI/issues) 提交，缺陷请使用 `.github/ISSUE_TEMPLATE/bug_report.md` 模板并附复现步骤与环境信息。安全漏洞请勿公开提交 Issue，参考 [安全策略](./docs/guide/security.md)。
