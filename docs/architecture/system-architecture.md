# 系统架构

本文描述当前代码的实际结构（NestJS 10 + Prisma 7 后端、React 18 + Vite 7 前端、Skills 引擎驱动的 AI 能力）。旧版「三 Agent + LangChain Workflow」架构已从代码中移除，相关文档不再保留。

## 1. 总体构成

```mermaid
graph TB
    Browser[浏览器 / SPA] --> Caddy[Caddy 反向代理（生产）]
    Caddy --> Static[前端静态资源]
    Caddy --> API[NestJS API :3000]
    Browser -. dev .-> Vite[Vite :5173]
    Vite -. /api, /socket.io 代理 .-> API
    API --> Core[core / features / ee / shared 模块]
    Core --> Skills[Skills 引擎]
    Skills --> AIService[AIService]
    AIService --> Providers[OpenAI 兼容 Provider]
    Core --> DB[(PostgreSQL 16)]
    Core --> Redis[(Redis 7 / Bull)]
    Core --> OSS[(MinIO / S3 / 阿里云 OSS)]
    API <--> WS[Socket.IO /chat /interview /realtime-interview]
```

仓库为 pnpm 9 + Turborepo monorepo，workspace 为 `packages/backend`、`packages/frontend`、`tests/verification`。根 `package.json` 提供 `dev`（`concurrently` 启动前后端）、`build:backend` / `build:frontend`、`test`（`turbo run test`）、`lint`、`typecheck`、`format` 等脚本。

## 2. 后端（`packages/backend`）

### 目录分层

| 目录                            | 职责                                                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/main.ts`、`src/app.module.ts` | 启动入口与根模块装配                                                                                                                                                                            |
| `src/modules/`                  | 全部业务功能模块，按领域划分：account、agents、ai、auth、chat、conversation、health、interview、invitation、job、payment、prompts、quota、resume、storage、user、voice                        |
| `src/infrastructure/`           | 基础设施模块：cache、config、database、logger、monitoring、notification                                                                                                                             |
| `src/common/`                   | 横切关注点：decorators、exceptions、filters、guards、interceptors、middleware、pipes、utils、validators                                                                                             |
| `src/ee/`                       | 商业版实现（payment、quota），由 `APP_EDITION` 控制整体加载，便于 OSS 构建裁切                                                                                                                       |
| `src/types/`                    | 跨模块共享的纯类型定义                                                                                                                                                                            |
| `test/e2e/`                     | supertest E2E 用例，独立于 `src/` 单元测试                                                                                                                                                          |
| `prisma/`                       | `schema.prisma`、`migrations/`、`seed.ts`                                                                                                                                                           |
| `skills/`                       | 12 个运行时 AI 技能定义                                                                                                                                                                           |

模块内统一按职责分子目录（`controllers/`、`services/`、`dto/`、`interfaces/`、`guards/`、`gateways/`、`constants/`、`utils/`、`adapters/` 等），`*.spec.ts` 与被测文件同目录；跨模块引用统一使用 `@/` 别名，避免跨层相对路径。Prisma 生成物、E2E 用例与调试脚本不放在 `src/` 内。

### HTTP 与实时通道

- `main.ts` 设置全局前缀 `API_PREFIX || '/api/v1'`，并对 `health`、`/` 等路径排除前缀；监听 `PORT || 3000`。
- Swagger 挂在 `/api/docs`；请求体上限 4 MB；启用 Helmet、CORS、全局 `ValidationPipe`、`Throttler`（默认 100 次 / 60 秒）。
- 主要控制器前缀：`auth`、`user`、`user/notifications`、`admin`、`account`、`conversations`、`quota`、`payments`、`storage`、`metrics`、`alerts`，以及 `jobs`、`interview`、`interview/voiceprint`、`interviewer-personas`、`voices`、`agents/pitch-perfect`、`resumes`、`optimizations`、`match-analysis`、`generate`、`templates`。
- Socket.IO 网关：`/chat`、`/interview`、`/realtime-interview`，可配置 Redis adapter。
- 鉴权：`passport-jwt`（`JWT_SECRET`、`JWT_EXPIRES_IN`）+ `JwtAuthGuard`，管理员路由叠加 `RolesGuard`；Google / GitHub OAuth 策略读取 `GOOGLE_*` / `GITHUB_*`。
- `APP_EDITION=oss` 时 `app.module.ts` 跳过 `ee/` 模块加载，`modules/payment`、`modules/quota` 等回退到 OSS 实现（配额为放通 stub）。

### 数据层

- Prisma 7（`schema.prisma` 的 datasource 为 `postgresql`，连接串由 `DATABASE_URL` 通过 `prisma.config.ts` 提供），运行时用 `@prisma/adapter-pg` 的 `PrismaPg` 适配器。
- 迁移位于 `prisma/migrations/`，本地 `prisma migrate dev`，CI 与部署使用 `prisma migrate deploy`；seed 在 `prisma/seed.ts`、`prisma/seeds/seed-admin.ts`。
- 主要模型：`User`、`Session` / `Account` / `Verification`、`Resume` / `ResumeVersion`、`Job`、`Optimization`、`GeneratedPDF`、`Template`、`InterviewSession` / `InterviewMessage` / `InterviewQuestion` / `InterviewerPersona`、`Conversation` / `Message`、`ModelConfig`、`PromptTemplate` / `PromptTemplateVersion`、`UsageRecord`、`Storage`、`AuditLog` 及若干 AI 日志表。
- Redis 用于缓存、Bull 队列与 Socket.IO adapter；文件对象存储由 `OSS_TYPE`（`MINIO` / `S3` / `OSS`）选择 provider，实现见 `modules/storage/adapters/`。

### AI 层

- `modules/ai/constants/models.ts` 定义 7 个 `PROVIDER_BASE_URLS`：`openai`、`deepseek`、`qwen`、`gemini`、`ollama`、`siliconcloud`、`openrouter`，统一走 OpenAI 兼容 SDK。
- 默认文本模型 `AI_MODEL=deepseek:deepseek-chat`，默认向量模型 `AI_EMBEDDING_MODEL=siliconcloud:BAAI/bge-m3`。
- Skills 引擎在 `modules/ai/skills/`，从 `skills/*.md` 加载能力；简历分析、JD 匹配、面试出题与评估等业务服务通过 `aiService.executeSkill(...)` 调用。详见 [Skills 引擎](../technical/skills-engine.md)。

## 3. 前端（`packages/frontend`）

- React 18 + Vite 7 + Ant Design 6 + React Router 6（`createBrowserRouter`）+ Zustand 4，测试用 Vitest。
- `src/config/axios.ts` 的 `baseURL` 为 `VITE_API_BASE_URL || '/api/v1'`，请求拦截注入 `auth_token` 与 `traceparent`，统一处理 401 / 403 / 429。
- 公开路由：`/login`、`/register`、`/oauth/callback`、`/verify-email`、`/forgot-password`、`/reset-password`、`/terms-of-service`、`/privacy-policy`。
- 主布局路由：`/`（我的简历）、`/resumes`、`/resume-builder`、`/profile`、`/settings`、`/account/usage`、`/interview`、`/pitch-perfect`、`/admin/prompts`、`/admin/models`、`/admin/users`（后三个要求 `ADMIN` 角色）。
- EE 路由（`/pricing`、`/subscription`、`/account/subscription`、`/payment/*`）由 `VITE_APP_EDITION !== 'oss'` 条件注册，对应前端 `src/ee/` 页面。
- 国际化资源为 `src/locales/zh-CN.json`、`en-US.json`；`vite-plugin-pwa` 已安装但在 `vite.config.ts` 中禁用。
- dev server 端口 5173，`/api` 与 `/socket.io` 代理到 `http://localhost:3000`（可用 `VITE_PROXY_TARGET` 覆盖）。

## 4. 部署与可观测性

- `deployment/docker-compose.yml`：开发基础设施（PostgreSQL、Redis、MinIO、Jaeger），不含应用容器。
- `deployment/docker-compose.prod.yml`：postgres、redis、minio、backend、frontend（静态文件卷）、caddy；没有任何备份或 Prometheus / Grafana / Loki 服务编排，`deployment/config/` 下只有对应的配置文件。
- Caddy 处理自动 HTTPS、`/api/*` 与 `/socket.io/*` 反代及 SPA fallback；详见 [部署文档](../../deployment/README.md)。
- 应用端点：`/health`（健康检查，不受全局前缀影响）、`/api/v1/metrics`（prom-client）、`/api/v1/alerts`（告警）；日志用 Winston，可选 Sentry / OpenTelemetry，配置见 [监控策略](../guide/monitoring.md)。
- CI：`.github/workflows/ci.yml` 运行 `lint`、`backend`、`frontend` 三个 job，详见 [CI/CD](../guide/workflows.md)。

## 5. 当前代码中的已知不一致

文档按代码现状记录，以下问题需在改代码时一并处理：

1. 实时语音与流式 ASR 依赖 `DASHSCOPE_API_KEY`；未配置时 `/realtime-interview` 的 `start_stream` 与 `/interview` 的 `voice_start` 直接返回降级错误，辅助面试只剩文字兜底路径。
2. 可观测性：`monitoring.config.ts` 的 `getMonitoringConfig()` 无调用点、`METRICS_PORT/PATH` 无独立服务；`dependabot.yml` 的 reviewers 为占位值；prod compose 的 `POSTGRES_MAX_CONNECTIONS` 等非官方镜像变量无效。
3. 前端 `VITE_BACKEND_URL`、OAuth 开关、`VITE_STRIPE_PUBLISHABLE_KEY` 等变量无代码读取点。
4. 后端 lint 仍有 678 处 `@typescript-eslint/no-explicit-any` warning，而 `lint` 脚本为 `--max-warnings 0`，因此 CI 的 `lint` job 仍会失败。这是有意保留的历史类型债（消除它需要跨 124 个文件的类型重构）。前端 lint 已为 0 warning。
5. 历史凭据已用 `git filter-repo` 从全部 16 个分支清除（7 个 `.env`/私钥文件删除 + 2 个硬编码在 `.ts` 里的真实密钥脱敏），并已 force push，远端 `main` 为 `019552984`。但 **GitHub 的 `refs/pull/*` 只读引用无法被 force push 改写**：17 个已关闭/合并 PR 仍公开返回旧凭据文件，需联系 GitHub Support 清理或转私有。**所有已暴露密钥仍须在各服务商轮换**。详见 [安全策略](../guide/security.md)。
6. `main` 干净（685 文件）且 `.gitignore` 已忽略 `.pnpm-store/`，但 8 个侧分支（6 dependabot + 2 `trae/solo-agent-*`）各跟踪 9.6 万–10.3 万个文件含包缓存，使仓库达 403 MB；关闭过期 PR 并删分支即可瘦身。GitHub 另回报默认分支有 168 个依赖漏洞（5 critical / 55 high）。
7. Jest 结束后不自动退出（存在未关闭的异步句柄），不影响断言结果，但 CI 需依赖超时或 `--forceExit`。

### 5.1 已修复项（备查）

- 运行时基线统一到 Node 22：`@prisma/dev` 依赖纯 ESM 的 `zeptomatch`，Node 20 下 `prisma generate` 抛 `ERR_REQUIRE_ESM`；`undici@8`（经 `cheerio` 引入，`engines: >=22.19.0`）需要 `worker_threads.markAsUncloneable`，Node 20 缺失会导致 `JobModule` 在启动时崩溃。两个 Dockerfile、`ci.yml`、`release.yml`、根 `engines` 与 `.nvmrc` 均已对齐。
- `ThrottlerModule` 已通过 `APP_GUARD` 全局挂载；`main.ts` 设置 `trust proxy = 1`，使限流按真实客户端 IP 而非 Caddy 容器 IP 计数（否则 100 次/60 秒会退化为全站共享配额）。
- `main.ts` 的 Swagger 改为生产默认关闭（需 `ENABLE_SWAGGER=true` 才暴露），并启用 `enableShutdownHooks()` 以在 SIGTERM 时排水 Bull / Prisma / Socket.IO。
- `jwt.strategy.ts`、`auth.module.ts`、`chat.module.ts` 的 `'your-secret-key'` 兜底值已移除，改用 `configService.getOrThrow('JWT_SECRET')`，缺失即启动失败。
- 版本对齐：`ci.yml` 的 PostgreSQL 升到 16 与 compose 一致；prod compose 的 `redis:7-alpine`、`minio/minio:RELEASE.2025-04-08T15-41-24Z` 已锁版本。
- `release.yml` 已弃用归档的 `actions/create-release@v1` / `upload-release-asset@v1`，改用 runner 自带的 `gh release create` / `gh release upload`。
- edition 一致性：frontend Dockerfile 增加 `ARG/ENV VITE_APP_EDITION`（默认 `oss`），prod compose 透传 `APP_EDITION`，`.env.example` 补上该变量，避免 OSS 部署仍渲染调用 `/payments/*` 的 EE 页面。
- `packages/backend/scripts/openrouter.ts` 中硬编码的 OpenRouter 密钥已移除，改为读 `OPENROUTER_API_KEY` 且缺失即抛错；历史中的同一密钥已脱敏。
