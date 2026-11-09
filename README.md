<p align="center">
  <img src="./docs/assets/brand/logo.svg" alt="IntervAI Logo" width="120"/>
</p>

# IntervAI

AI 驱动的简历优化与模拟面试平台。仓库为 pnpm 9 + Turborepo monorepo，包含 3 个 workspace：`@interview-ai/backend`、`@interview-ai/frontend`、`@interview-ai/verification`。

[![CI](https://github.com/xuanyiying/IntervAI/actions/workflows/ci.yml/badge.svg)](https://github.com/xuanyiying/IntervAI/actions/workflows/ci.yml)

## 功能概览

| 领域       | 当前实现                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 简历       | 文件上传与解析（PDF / DOCX / TXT）、`Resume` / `ResumeVersion` 版本管理、JD 匹配分析、AI 优化建议、PDF 导出                                                                    |
| 面试       | 按简历与职位生成问题、文字与实时语音会话、答案评估、面试报告、面试人格（InterviewerPersona）、声纹                                                                             |
| AI 能力    | Skills 引擎，`packages/backend/skills/` 下 12 个 Markdown 定义的技能；7 家 OpenAI 兼容提供商（`openai`、`deepseek`、`qwen`、`gemini`、`ollama`、`siliconcloud`、`openrouter`） |
| 账户与权限 | JWT（passport-jwt）、Google / GitHub OAuth、`RolesGuard` 管理员路由、用量与配额；`APP_EDITION=oss` 时停用 EE 支付与订阅                                                        |
| 实时通信   | Socket.IO 命名空间 `/chat`、`/interview`、`/realtime-interview`                                                                                                                |
| 存储       | `OSS_TYPE` 切换 MinIO、AWS S3、阿里云 OSS，支持分片与预签名直传                                                                                                                |
| 可观测性   | `/health`、`/api/v1/metrics`、`/api/v1/alerts`，Winston / Sentry / OpenTelemetry                                                                                               |

## 技术栈

| 层   | 技术                                                                                |
| ---- | ----------------------------------------------------------------------------------- |
| 工程 | pnpm 9、Turborepo 2、TypeScript 5、ESLint + Prettier                                |
| 后端 | NestJS 10（Express）、Prisma 7 + PostgreSQL、Redis + Bull、Socket.IO、Swagger、Jest |
| 前端 | React 18、Vite 7、Ant Design 6、React Router 6、Zustand 4、axios、Vitest            |
| 部署 | Docker Compose、Caddy（自动 HTTPS）、GitHub Actions                                 |

## 目录结构

```
IntervAI/
├── packages/
│   ├── backend/           # NestJS API、Prisma schema/migrations、skills、skills-eval
│   └── frontend/          # React SPA
├── deployment/            # compose 文件、Caddy 与各服务配置、运维脚本
├── docs/                  # 架构、技术参考与开发指南
├── tests/verification/    # 独立验证测试 workspace
├── deploy.sh              # 统一部署入口
├── Makefile               # 常用命令封装（make help）
└── .github/workflows/     # ci.yml、deploy.yml、release.yml
```

## 快速开始

环境要求：Node.js >= 18、pnpm >= 9、Docker + Docker Compose v2。

```bash
# 1. 安装依赖
pnpm install

# 2. 启动基础服务（PostgreSQL 16、Redis 7、MinIO、Jaeger）
docker compose -f deployment/docker-compose.yml up -d

# 3. 配置环境变量
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env

# 4. 生成 Prisma 客户端并执行迁移（脚本定义在 backend 包内）
pnpm --filter @interview-ai/backend prisma:generate
pnpm --filter @interview-ai/backend prisma:migrate

# 5. 启动开发环境
pnpm dev
```

- 前端：<http://localhost:5173>
- 后端：`PORT` 决定，默认 3000（见 `packages/backend/.env`）
- Swagger：<http://localhost:3000/api/docs>
- API 全局前缀 `/api/v1`（`API_PREFIX` 可覆盖）；`main.ts` 仅排除 `health` 与 `/`，故健康检查为 `/health`，指标 / 告警为 `/api/v1/metrics`、`/api/v1/alerts`

> **端口一致性**：`packages/frontend/vite.config.ts` 的 dev 代理默认指向 `http://localhost:3000`，与后端 `PORT=3000` 及 `VITE_API_BASE_URL=http://localhost:3000/api/v1` 一致。修改后端端口时，用 `VITE_PROXY_TARGET` 覆盖代理目标，并同步 `VITE_API_BASE_URL`。

## 常用命令

| 命令                                                | 说明                                |
| --------------------------------------------------- | ----------------------------------- |
| `pnpm dev`                                          | 用 `concurrently` 同时启动前后端    |
| `pnpm dev:backend` / `pnpm dev:frontend`            | 单独启动                            |
| `pnpm build:backend` / `pnpm build:frontend`        | 生产构建（根目录没有 `pnpm build`） |
| `pnpm test` / `pnpm test:parallel`                  | `turbo run test` / 各包并行测试     |
| `pnpm lint` / `pnpm lint:fix` / `pnpm typecheck`    | 静态检查                            |
| `pnpm format` / `pnpm format:check`                 | Prettier 格式化（仅 `packages/**`） |
| `pnpm --filter @interview-ai/backend prisma:studio` | Prisma Studio                       |
| `pnpm run deploy:app` / `./deploy.sh --env prod`    | 部署（参数见部署文档）              |
| `make help` / `make dev` / `make backup`            | Makefile 封装的常用命令             |

后端测试用 Jest（`pnpm --filter @interview-ai/backend test`），E2E 用 `pnpm --filter @interview-ai/backend test:e2e`（需要运行中的 PostgreSQL 与 Redis），前端用 Vitest（`pnpm --filter @interview-ai/frontend test`），验证系统用 Jest（`pnpm --filter @interview-ai/verification test`）。后端 `test/e2e/` 下的 E2E 用例独立于 `src/` 内的单元测试。

## 文档索引

- [文档中心](./docs/README.md) — 架构、Skills 引擎、开发指南的完整索引
- [环境配置与开发指南](./docs/guide/environment-setup.md)
- [系统架构](./docs/architecture/system-architecture.md) · [Skills 引擎](./docs/technical/skills-engine.md)
- [CI/CD](./docs/guide/workflows.md) · [监控](./docs/guide/monitoring.md) · [安全](./docs/guide/security.md) · [分支保护](./docs/guide/branch-protection.md)
- [部署与运维](./deployment/README.md)
- [后端](./packages/backend/README.md) · [前端](./packages/frontend/README.md) · [验证测试](./tests/verification/README.md)
- [贡献指南](./CONTRIBUTING.md) · [CLAUDE.md](./CLAUDE.md)（AI 编码助手指引）

`packages/backend/skills/*.md` 是运行时加载的技能定义，`packages/backend/skills-eval/` 是评测用例与产物，均不是说明文档。

## 部署

使用根目录 `deploy.sh`（默认 dev 环境），生产环境使用 `.env.production` + `deployment/docker-compose.prod.yml`，由 Caddy 提供自动 HTTPS。详见 [部署文档](./deployment/README.md)。

## English

IntervAI is a pnpm/Turborepo monorepo for AI-assisted resume optimization and mock interviews: a NestJS 10 + Prisma 7 backend, a React 18 + Vite 7 frontend, and a Jest-based verification suite. AI capabilities are defined as Markdown "skills" in `packages/backend/skills/` and routed through OpenAI-compatible providers.

Quick start: `pnpm install` → `docker compose -f deployment/docker-compose.yml up -d` → copy `packages/backend/.env.example` and `packages/frontend/.env.example` to `.env` → `pnpm --filter @interview-ai/backend prisma:generate` → `pnpm --filter @interview-ai/backend prisma:migrate` → `pnpm dev`. Frontend runs on `http://localhost:5173`, API on `/api/v1`, Swagger on `/api/docs`. See the [documentation index](./docs/README.md) for details.

## 许可证

[MIT](./LICENSE)
