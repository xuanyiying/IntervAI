# CI/CD 工作流

`.github/workflows/` 中实际只有 3 个 workflow。仓库没有 `security.yml`、`pr-checks.yml`，也没有 CodeQL / Trivy / `npm audit` 任务。

## `ci.yml` — CI

**触发**：push 到 `main` / `develop`，或针对这两个分支的 PR。

| Job        | 主要步骤                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lint`     | pnpm 9 + Node 20，`pnpm install --frozen-lockfile`，`pnpm run lint`                                                                                                               |
| `backend`  | services：`postgres:15-alpine`、`redis:7-alpine`；注入 `DATABASE_URL`、`REDIS_*`、`JWT_SECRET`、AI / OSS 相关变量；`prisma:generate` → `prisma migrate deploy` → `test` → `build` |
| `frontend` | `VITE_API_BASE_URL=http://localhost:3000/api/v1`；`typecheck` → `test` → `build`                                                                                                  |

分支保护中要求的状态检查名即 `lint`、`backend`、`frontend`。CI 不构建或推送 Docker 镜像。注意 CI 的 PostgreSQL 是 15，而本地 `deployment/docker-compose.yml` 是 16；`release.yml` 使用 Node 18，只有 `ci.yml` 使用 Node 20。

## `deploy.yml` — 部署

**触发**：push 到 `main`、push `v*` tag、`workflow_dispatch`（必填 `environment`，默认 `staging`，可选 staging / production）。

主要步骤：

1. Buildx 登录 `ghcr.io`，`docker/metadata-action` 生成镜像元数据；镜像名由 `Resolve image references` 步骤统一转为小写（GHCR 要求），tag 为版本号（tag 触发）或 `latest`（分支触发），另附 `sha-<short>`。
2. 用 `packages/backend/Dockerfile`、`packages/frontend/Dockerfile` 构建并推送两个镜像。
3. 创建 GitHub Deployment。
4. 部署条件：手动选 `staging` → staging 步骤；手动选 `production`、`push main`、`push v*` tag → production 步骤。
5. SSH 到目标主机执行 `docker compose --env-file .env.production -f deployment/docker-compose.prod.yml pull backend frontend` 与 `up -d`，远端通过 `BACKEND_IMAGE` / `FRONTEND_IMAGE` 使用刚推送的镜像；compose 中两个服务都定义了 `image`，因此 `pull` 有效。
6. 更新 Deployment 状态（不再写入 `example.com` 占位 URL），`notify` job 通过 Slack 发送结果。

需要配置 9 个自定义 Secret：`DEPLOY_KEY_STAGING`、`DEPLOY_HOST_STAGING`、`DEPLOY_USER_STAGING`、`DEPLOY_PATH_STAGING`、`DEPLOY_KEY_PRODUCTION`、`DEPLOY_HOST_PRODUCTION`、`DEPLOY_USER_PRODUCTION`、`DEPLOY_PATH_PRODUCTION`、`SLACK_WEBHOOK_URL`。目标主机必须有 `.env.production`。

## `release.yml` — 发版

**触发**：push `v*` tag。

| Job                 | 内容                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `create-release`    | 创建 GitHub Release（`actions/create-release@v1`）                                                                       |
| `build-and-push`    | 构建并推送两个镜像                                                                                                       |
| `publish-artifacts` | pnpm 9 + Node 18，`build:backend` / `build:frontend`，打包 `dist/` 为 tar.gz 并上传（`actions/upload-release-asset@v1`） |
| `notify-release`    | Slack 通知                                                                                                               |

`actions/create-release@v1`、`actions/upload-release-asset@v1` 均为已归档的旧 Action，建议迁移到 `softprops/action-gh-release` 或 `gh release create`。

## `dependabot.yml`

npm / docker / github-actions 三类依赖每周检查；`reviewers` 目前仍是占位值 `your-github-username`。

## 本地等价命令

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build:backend
pnpm build:frontend
```

也可不经过 CI，直接用根目录 `deploy.sh` 部署，详见 [部署与运维](../../deployment/README.md)。
