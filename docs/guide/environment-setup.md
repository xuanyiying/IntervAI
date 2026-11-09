# 环境配置与开发指南

## 1. 环境要求

| 依赖     | 版本 / 说明                                                                         |
| -------- | ----------------------------------------------------------------------------------- |
| Node.js  | `>= 18`（根 `package.json` 的 `engines`）；`ci.yml` 用 Node 20，`release.yml` 用 18 |
| pnpm     | `>= 9`（`packageManager: pnpm@9.0.0`）                                              |
| Docker   | Docker Engine + Compose v2（`docker compose`，非旧式 `docker-compose`）             |
| 基础服务 | PostgreSQL 16、Redis 7、MinIO、Jaeger（本地 compose 提供；CI 的 PG 是 15）          |

## 2. 启动基础服务

在仓库根目录执行：

```bash
docker compose -f deployment/docker-compose.yml up -d
```

该 compose 只包含基础设施，不含 backend / frontend 容器：

| 服务       | 端口                 |
| ---------- | -------------------- |
| PostgreSQL | 5432                 |
| Redis      | 6379                 |
| MinIO      | 9000（Console 9001） |
| Jaeger     | 16686 / 4317 / 4318  |

停止服务：`docker compose -f deployment/docker-compose.yml down`。

## 3. 安装与配置

```bash
pnpm install

cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

- **后端实际读取**：`DATABASE_URL`、`REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD`、`JWT_SECRET` / `JWT_EXPIRES_IN`、`CORS_ORIGIN`、`FRONTEND_URL`、`APP_EDITION`、`AI_MODEL` / `AI_EMBEDDING_MODEL`、`OPENAI_API_KEY` / `DEEPSEEK_API_KEY` / `QWEN_API_KEY` / `GEMINI_API_KEY` / `SILICONCLOUD_API_KEY` / `OPENROUTER_API_KEY` / `OLLAMA_BASE_URL`、`DASHSCOPE_API_KEY`、`OSS_TYPE` 与 `OSS_*`、`GOOGLE_*` / `GITHUB_*`、`LOG_LEVEL`、`SENTRY_DSN`、`OTEL_ENABLE` / `OTEL_OTLP_URL`。`packages/backend/.env.example` 是起步清单，生产所需的完整变量见 [部署与运维](../../deployment/README.md)。
- **前端实际读取**：`VITE_API_BASE_URL`（默认 `/api/v1`）、`VITE_APP_EDITION`（控制 EE 路由）、`VITE_PADDLE_CLIENT_TOKEN` 与价格 ID。`VITE_BACKEND_URL`、`VITE_GOOGLE_OAUTH_ENABLED`、`VITE_GITHUB_OAUTH_ENABLED`、`VITE_STRIPE_PUBLISHABLE_KEY` 目前在 `src` 中没有读取点。
- **死变量**：`ENCRYPTION_KEY`、`STORAGE_PROVIDER`、`CSP_ENABLED`、`RATE_LIMIT_*` 等未被运行时读取，配置不生效。
- 根目录 `.env` 由项目保留；根 `.env.example`、`.env.production.example`、`.env.docker`、`.env.production` 已从工作区移除，生产配置不再有示例文件，请按部署文档手工创建 `.env.production`。

> **端口一致性**：后端默认 `PORT=3000`（`main.ts` 与 `.env.example` 一致），但 `vite.config.ts` 的 dev 代理把 `/api` 和 `/socket.io` 指向 `http://localhost:3001`，而 `packages/frontend/.env.example` 又让 `VITE_API_BASE_URL` 直连 `http://localhost:3000/api/v1`。三处需统一：要么把后端 `PORT` 设为 3001，要么把 Vite 代理目标改成 3000。

## 4. 数据库

Prisma 脚本定义在 backend 包内，可在根目录用 `--filter` 调用，或 `cd packages/backend` 后直接执行：

```bash
pnpm --filter @interview-ai/backend prisma:generate   # 生成 Prisma Client
pnpm --filter @interview-ai/backend prisma:migrate    # 本地开发：prisma migrate dev
pnpm --filter @interview-ai/backend prisma:studio
pnpm --filter @interview-ai/backend prisma:seed
```

生产 / CI / `make migrate` 使用非交互的 `pnpm --filter @interview-ai/backend exec prisma migrate deploy`；容器内由镜像自带的 Prisma 7 CLI 执行 `prisma migrate deploy`。迁移文件位于 `packages/backend/prisma/migrations/`。

## 5. 启动与验证

```bash
pnpm dev                  # 同时启动前后端（concurrently）
pnpm dev:backend          # 仅后端（nest start --watch）
pnpm dev:frontend         # 仅前端（vite）
```

- 前端：<http://localhost:5173>
- 后端：`PORT` 指定，默认 3000；API 前缀 `/api/v1`
- Swagger：<http://localhost:3000/api/docs>（路径不受 API 前缀影响）
- 健康检查：<http://localhost:3000/health>

## 6. 构建与检查

```bash
pnpm build:backend        # nest build → packages/backend/dist
pnpm build:frontend       # vite build → packages/frontend/dist
pnpm typecheck            # turbo run typecheck
pnpm lint                 # turbo run lint
pnpm lint:fix
pnpm format               # prettier --write packages/**
pnpm format:check
pnpm test                 # turbo run test（依赖 ^build）
pnpm test:parallel        # pnpm -r --parallel run test
```

根目录**没有** `pnpm build`、`pnpm start:prod` 脚本；包名是 `@interview-ai/backend` / `@interview-ai/frontend`，`--filter backend` 之类的简写无法匹配。

```bash
pnpm --filter @interview-ai/backend test              # Jest
pnpm --filter @interview-ai/backend test:cov
pnpm --filter @interview-ai/frontend test             # Vitest
pnpm --filter @interview-ai/frontend test:coverage
pnpm --filter @interview-ai/verification test         # Jest 验证系统
```

后端 `jest.config.js` 的 `testRegex` 会匹配 `.e2e.spec.ts`，所以 `pnpm test` **也会执行 E2E 用例**，本地需要运行中的 PostgreSQL 与 Redis。只跑 E2E 可用 `pnpm --filter @interview-ai/backend test -- --testPathPattern=e2e`；仓库没有 `test:e2e` 脚本。

## 7. 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：`feat`、`fix`、`docs`、`refactor`、`test`、`chore` 等。提交前执行 `pnpm lint`、`pnpm typecheck`、`pnpm test`，详见 [贡献指南](../../CONTRIBUTING.md)。
