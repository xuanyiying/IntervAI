# 部署与运维

IntervAI 使用 Docker Compose + Caddy 部署，入口为仓库根目录 `deploy.sh`（也可 `pnpm run deploy:app` 或 `make prod`）。`pnpm deploy` 是 pnpm 内置的 workspace 命令，不会执行本项目脚本。本文件是部署的主说明，[CI/CD 工作流](../docs/guide/workflows.md) 与 [监控策略](../docs/guide/monitoring.md) 补充 CI 与可观测性细节。

> **安全提示（部署前必读）**：历史提交（`1ccfbeb54`）曾包含 `.env`、`.env.production`、`.env.docker` 以及 `deployment/config/ssl/` 下的 TLS 私钥。当前已取消证书文件的 git 跟踪并修正 `.gitignore`，但**历史记录中的凭据仍视为已泄露**：必须轮换证书、数据库/Redis/MinIO 口令、OAuth 与支付凭据，并按需用 `git filter-repo` 清理历史。按项目约定保留本地 `.env`，不自动修改任何 `.env*` 文件。

## 目录结构

```
deploy.sh                            # 统一部署入口
deployment/
├── docker-compose.yml               # 开发基础设施（无应用容器）
├── docker-compose.prod.yml          # 生产全量服务
├── config/                          # caddy、postgres、redis、ssl 及监控组件配置
├── scripts/
│   ├── utils.sh                     # 日志、环境加载、命令检查
│   └── manage-db.sh                 # backup | restore | list | migrate
├── backups/postgres/                # 数据库备份（空目录，clone 后需 mkdir -p）
└── logs/                            # 应用/Caddy 日志（同上）
```

`config/` 下另有 `prometheus/`、`grafana/`、`loki/`、`promtail/`、`alertmanager/` 配置文件，但 **`docker-compose.prod.yml` 当前没有任何监控服务编排（连注释也没有）**，需要时须自行编写 compose 服务。`config/ssl/` 下是遗留的自签名证书文件，Caddy 使用自动 HTTPS，不读取该目录。

> 已清理的一次性脚本：`check-backend-status.sh`、`diagnose-backend.sh`、`quick-fix-backend.sh`、`rollback.sh`、`start-monitoring.sh`、根 `scripts/host-backup.sh`，以及 `packages/backend/scripts/` 下的 `seed-qwen-models.ts`、`check-admin-role.ts`。它们无入口引用且引用了不存在的 compose 文件 / 旧 Prisma 用法。

## 环境变量（生产）

仓库不再维护 `.env.production.example`。生产配置请创建根 `.env.production`，或把下列变量导出到进程环境；`deploy.sh` 在文件缺失时只告警并继续使用进程环境。`docker-compose.prod.yml` 中 `JWT_SECRET` 使用 `:?` 强制校验，缺失时 Compose 直接报错。

| 类别     | 变量                                                                                                                                                            | 说明                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 站点     | `DOMAIN`、`LETSENCRYPT_EMAIL`、`ACME_CA`                                                                                                                        | Caddy 自动申请/续期证书；`ACME_CA` 默认 Let's Encrypt 生产端点                    |
| 数据库   | `POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`                                                                                                             | compose 内拼出 `DATABASE_URL`，后端也直接读 `DATABASE_URL`                        |
| 缓存     | `REDIS_PASSWORD`                                                                                                                                                | `REDIS_HOST` / `REDIS_PORT` 在 compose 内固定为 `redis:6379`                      |
| 鉴权     | `JWT_SECRET`、`JWT_EXPIRES_IN`、`APP_EDITION`                                                                                                                   | `APP_EDITION=oss` 停用 EE 模块；`JWT_SECRET` 无安全默认值                         |
| 站点地址 | `CORS_ORIGIN`、`FRONTEND_URL`                                                                                                                                   | 后端 CORS 只读 `CORS_ORIGIN`；OAuth 回调与支付跳转用 `FRONTEND_URL`               |
| AI       | `AI_MODEL`、`AI_EMBEDDING_MODEL`                                                                                                                                | `provider:model` 格式，默认 `deepseek:deepseek-chat` / `siliconcloud:BAAI/bge-m3` |
| AI 密钥  | `OPENAI_API_KEY`、`DEEPSEEK_API_KEY`、`QWEN_API_KEY`、`GEMINI_API_KEY`、`SILICONCLOUD_API_KEY`、`OPENROUTER_API_KEY`、`OLLAMA_BASE_URL`、`DASHSCOPE_API_KEY`    | 见 `modules/ai/services/ai.service.ts` 与 `modules/voice/`；全部已注入 backend 容器          |
| 对象存储 | `OSS_TYPE`、`OSS_ENDPOINT`、`OSS_ACCESS_KEY`、`OSS_SECRET_KEY`、`OSS_BUCKET`、`OSS_REGION`、`OSS_APP_ID`、`OSS_PUBLIC_ENDPOINT`、`OSS_PATH_STYLE`、`OSS_SECURE` | `OSS_TYPE` 取 `MINIO` / `S3` / `OSS`，默认 `MINIO`                                |
| OAuth    | `GOOGLE_*`、`GITHUB_*`                                                                                                                                          | 未配置时对应登录方式不可用                                                        |
| 可观测性 | `LOG_LEVEL`、`SENTRY_DSN`、`OTEL_ENABLE`、`OTEL_OTLP_URL`                                                                                                       | 见 [监控策略](../docs/guide/monitoring.md)                                        |
| 镜像     | `BACKEND_IMAGE`、`FRONTEND_IMAGE`                                                                                                                               | CI 部署时覆盖；本地构建默认 `intervai/backend:local`、`intervai/frontend:local`   |

**不要配置的死变量**：`ENCRYPTION_KEY`、`STORAGE_PROVIDER`、`AWS_*`、`CHROMA_DB_URL`、`BETTER_AUTH_URL`、`CSP_ENABLED`、`FORCE_HTTPS`、`HSTS_*`、`JWT_REFRESH_*`、`RATE_LIMIT_*`、`MAX_FILE_SIZE`、`ALLOWED_FILE_TYPES` 等均未被运行时代码读取，设置它们不会生效。Helmet / Caddy / Throttler 的值目前是硬编码。

## 部署命令

```bash
pnpm run deploy:app                    # 等价 bash deploy.sh
./deploy.sh                            # 默认 dev
./deploy.sh --env dev --skip-pull      # 不拉取代码
./deploy.sh --env prod                 # 生产部署
./deploy.sh --env prod --skip-build    # 跳过镜像构建
./deploy.sh --env prod -s "backend frontend"   # 仅指定服务
./deploy.sh --env prod --backup        # 部署前备份数据库
./deploy.sh --help

make help                              # 查看 Makefile 封装的常用命令
make dev                               # 起基础设施 + 本地 pnpm dev
make prod                              # 等同 ./deploy.sh --env prod
```

| 参数                    | 说明                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `-e, --env <dev\|prod>` | 默认 `dev`；dev 用 `.env` + `docker-compose.yml`，prod 用 `.env.production` + `docker-compose.prod.yml` |
| `-s, --services <list>` | 只构建 / 启动指定服务                                                                                   |
| `--skip-build`          | 跳过 `docker compose build --no-cache`                                                                  |
| `--skip-pull`           | 跳过 `git pull origin main`                                                                             |
| `--ssl`                 | 兼容参数，仅打印提示；HTTPS 由 Caddy 自动配置                                                           |
| `--backup`              | 在参数解析阶段调用 `manage-db.sh backup`，并传入当前 `--env`                                            |

流程：`--backup`（若指定）→ 加载 `utils.sh` →（可选）`git pull` → Compose v2 检查 → `dc build` → `dc up -d` → **仅 prod** 执行 `dc run --rm backend prisma migrate deploy` → 健康检查。dev 的 compose 只有基础设施，不启动应用容器、不跑容器内迁移，健康检查只验证 `postgres` / `redis` 容器状态。`dc()` 在 env 文件存在时自动附加 `--env-file`。

## 服务与端口

| 服务       | dev compose         | prod compose                              |
| ---------- | ------------------- | ----------------------------------------- |
| PostgreSQL | 5432                | 仅 `127.0.0.1:5432`                       |
| Redis      | 6379                | 仅 `127.0.0.1:6379`                       |
| MinIO      | 9000 / 9001         | 内网 9000                                 |
| Jaeger     | 16686 / 4317 / 4318 | —                                         |
| backend    | —                   | 内网 3000，`node dist/main`               |
| frontend   | —                   | 静态文件卷 `frontend_dist`，由 Caddy 提供 |
| caddy      | —                   | 80 / 443 / 443 udp                        |

backend / frontend 均同时定义了 `build` 与 `image`：本地 `deploy.sh` 构建 `intervai/*:local`，CI 通过 `BACKEND_IMAGE` / `FRONTEND_IMAGE` 覆盖为 GHCR 镜像。prod 的 `redis:latest`、`minio/minio:latest` 未固定版本，生产建议锁定 tag。

## HTTPS 与反向代理（Caddy）

`deployment/config/caddy/Caddyfile` 在 `{$DOMAIN}` 站点内：

- `/api/v1/resumes/upload` 单独反代并放宽读写超时到 120s；`/socket.io/*` 与其余 `/api/*` 反代到 `backend:3000`。
- `/health` 反代到后端真实的 `/health`（不再返回静态 200）；`:80` 恒返回 `426 HTTPS required`。
- `/api/v1/metrics*`、`/api/v1/alerts*`、`/api/docs*` 对公网返回 403；应用内这些端点无鉴权，内网仍可通过 `backend:3000` 访问。
- 静态资源从 `frontend_dist` 卷提供，`try_files {path} /index.html` 做 SPA fallback。

证书由 Caddy 自动申请与续期：

```bash
# .env.production
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com
```

```bash
docker compose --env-file .env.production -f deployment/docker-compose.prod.yml logs -f caddy
docker compose --env-file .env.production -f deployment/docker-compose.prod.yml exec caddy caddy validate --config /etc/caddy/Caddyfile
```

## 健康检查

`deploy.sh --env prod` 先直连 backend 容器执行 `curl -fsS http://localhost:3000/health`（重试 12 次），失败则打印 `backend` 日志并退出；后端通过后再探测 `https://${DOMAIN}/health`，公网失败只告警，避免 DNS/证书问题误判部署失败。frontend 容器的 `/health.sh` 检查 `/app/dist/index.html` 是否存在；Caddy 容器用 `caddy validate` 自检。

## 数据库与运维

`manage-db.sh` 优先使用外部传入的 `DEPLOY_ENV=dev|prod`，否则按 `.env.production` / `.env` 自动判定；`deploy.sh --backup` 会传入当前环境，避免 dev 部署误操作生产库。备份写入 `deployment/backups/postgres/`（与 compose 的 `./backups/postgres` 卷一致），保留 7 天，可用 `BACKUP_RETENTION_DAYS` 覆盖。dev 的 `migrate` 走本地 `pnpm --filter @interview-ai/backend exec prisma migrate deploy`，prod 走 backend 容器内的 `prisma migrate deploy`。

```bash
make backup
make restore FILE=interview_ai_20261107_120000.sql.gz
make list-backups
make migrate

bash deployment/scripts/manage-db.sh backup
bash deployment/scripts/manage-db.sh list
bash deployment/scripts/manage-db.sh restore <backup_file>
bash deployment/scripts/manage-db.sh migrate
```

运维命令统一使用 Compose v2，并显式带上 `--env-file`（否则 `${DOMAIN}`、`${POSTGRES_*}` 等会解析为空）：

```bash
docker compose --env-file .env.production -f deployment/docker-compose.prod.yml ps
docker compose --env-file .env.production -f deployment/docker-compose.prod.yml logs -f backend
docker compose --env-file .env.production -f deployment/docker-compose.prod.yml restart caddy
docker compose --env-file .env.production -f deployment/docker-compose.prod.yml down
```

## CI 部署

`.github/workflows/deploy.yml` 在 push `main` / `v*` tag 或手动触发时构建并推送 backend / frontend 镜像到 GHCR，然后通过 SSH 在目标主机执行：

```bash
docker compose --env-file .env.production -f deployment/docker-compose.prod.yml pull backend frontend
docker compose --env-file .env.production -f deployment/docker-compose.prod.yml up -d
```

需要配置的仓库 Secrets：`DEPLOY_KEY_STAGING/HOST/USER/PATH_*`、`DEPLOY_KEY_PRODUCTION/HOST/USER/PATH_*`、`SLACK_WEBHOOK_URL`；远端必须已有 `.env.production`。详见 [CI/CD 工作流](../docs/guide/workflows.md)。

## 已知问题

1. 历史提交中的凭据与私钥需轮换并清理 git 历史（见开头安全提示）；`deployment/config/ssl/` 现有证书文件已取消跟踪但保留在磁盘。
2. `deployment/backups/postgres/`、`deployment/logs/`（含 `logs/caddy`）为空目录且被 `.gitignore` 忽略，clone 后需 `mkdir -p` 才能挂载。
3. `docker-compose.prod.yml` 中 `POSTGRES_MAX_CONNECTIONS` / `POSTGRES_SHARED_BUFFERS` 不是 `postgres:16` 官方镜像变量；`redis.conf` 已挂载但 service command 未引用。
4. prod compose 的 `redis:latest` / `minio/minio:latest` 未锁版本；MinIO 默认口令需在 `.env.production` 中覆盖。
5. Caddy 虽已阻断公网访问运维端点与 Swagger，应用内 `metrics` / `alerts` controller 仍无鉴权；`main.ts` 在非生产环境外也无条件启用 Swagger，JWT 存在 `'your-secret-key'` 兜底值。见 [安全策略](../docs/guide/security.md)。
