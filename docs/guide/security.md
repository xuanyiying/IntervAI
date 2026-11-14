# 安全策略

## 报告漏洞

请勿在公开 Issue 中披露漏洞。通过仓库的私有漏洞报告渠道（GitHub Security Advisories）或直接联系维护者，附复现步骤、影响范围与受影响版本，修复发布后再公开披露。

## 当前版本

各 `package.json` 版本均为 `1.0.0`；以 `main` 分支与最新 Release 为准，旧版本不提供安全更新。

## 已入库凭据（最高优先级）

历史提交（起点 `1ccfbeb54`）曾把真实凭据写入版本库。`.gitignore` 与取消跟踪**不会清除历史记录**，因此下列文件的全部历史 blob 都必须视为已泄露。实测受影响范围远大于最初记录：

| 文件                                          | 历史 blob 数 | 泄露内容                                                                                             |
| --------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| `packages/backend/.env`                       | 94           | `GITHUB_CLIENT_SECRET`、`OPENROUTER_API_KEY`、`SILICON_FLOW_API_KEY`、`QWEN_API_KEY`、`JWT_SECRET`、OSS AK/SK、`REDIS_PASSWORD` |
| `.env.production.example`                     | 23           | 生产口令与 Provider Key                                                                              |
| `.env.production`                             | 16           | 同上                                                                                                 |
| `packages/backend/tencent.env`                | 14           | 腾讯云凭据                                                                                           |
| `packages/backend/.env.ai-providers.example`  | 14           | 真实 `sk-` 前缀 Provider Key（并非占位符）                                                           |
| `deployment/config/ssl/udefined.cc.key`       | 11           | TLS 私钥                                                                                             |
| `.env.docker`                                 | 8            | 容器编排口令                                                                                         |

`packages/backend/.env.example`、根 `.env`、`packages/frontend/.env.example`、`packages/frontend/src/.env` 经逐 blob 核对**只含占位符**（`osspassword`、`sk_test_…`、`whsec_…`、`NODE_ENV=development`），予以保留；`udefined.cc_bundle.pem` / `.crt` / `.csr` 不含私钥。

### 源码中硬编码的密钥（仅按文件名扫描会漏掉）

对全部 110,477 个 blob 做内容级扫描后，另发现 2 个真实密钥**硬编码在 `.ts` 源文件里**，不在任何 `.env` 路径下：

| 密钥                        | 出现位置                                                                                             | 处理                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| OpenRouter `sk-or-v1-…`（73 字符） | `packages/backend/scripts/openrouter.ts`（**HEAD 仍在跟踪**）、`src/common/openrouter.ts`（已删除） | 脚本改为读 `OPENROUTER_API_KEY`，缺失即抛错；历史全部脱敏 |
| Provider `sk-97b…`（35 字符）      | `prisma/seeds/seed-models.ts`（已删除）                                                              | 历史全部脱敏                                               |

e2e / spec 中的 `SecurePassword123!`、`AnotherPassword123!`、`sk-test-api-key`、`hashed-password`、`jwt-token` 等经逐条核对均为**合成测试夹具**，不是真实凭据，保留不动。

> 教训：只按 `.env` / `*.key` / `*.pem` 文件名扫描会漏掉硬编码在源码里的密钥，必须做 blob 内容级扫描。

### 已执行的历史清理

用 `git filter-repo` 对**全部 16 个远端分支**的完整历史一次性执行：

- `--invert-paths` 删除上表 7 个文件；
- `--replace-text` 把上述 2 个真实密钥字面量替换为 `REDACTED_SECRET`（保留文件本身，只脱敏内容）。

结果：215 → 214 commits（一个提交因内容清空被剪除）。校验：`main` 末端 tree 与清理前**仅差 `scripts/openrouter.ts` 一个文件**（即脱敏），其余 15 个分支的 tree 差异**仅为被删文件**，无任何代码丢失。清理后重跑内容级扫描，真实密钥命中数为 **0**。

16 个分支已用 `--force-with-lease` 强制推送，远端 `main` 现为 `019552984`。经 GitHub API 复核：新 `main` 上上述文件全部 404，`scripts/openrouter.ts` 内容为 `REDACTED_SECRET`。

### 仍未清除的部分（必须知道）

GitHub 的 `refs/pull/<N>/head` 与 `refs/pull/<N>/merge` 是**只读引用，force push 分支无法改写**。实测 48 个 PR 引用中有 **29 个 head 曾指向含上述凭据的旧提交**。force push 后复核结果：

- **12 个 OPEN PR**：head 引用随分支自动更新，已确认不再返回凭据文件（抽查 #37、#12 均为 404）；
- **17 个已关闭 / 已合并 PR**：引用冻结，**已确认仍公开返回 `.env`**（抽查 #30、#10、#2 均仍可下载）；
- 另有 7 个 head SHA 来自 fork 或已删除分支，同样冻结。

因此**仅靠 force push 无法彻底清除本仓库的凭据暴露**。要真正闭环，需任选其一：

1. 联系 GitHub Support，请求清理 PR refs 与缓存视图（保留 Issue / PR / Star，推荐）；
2. 将仓库转为 private，立即阻断公开访问（引用仍在，只是不再公开）；
3. 删除并重建仓库（最彻底，但会丢失 Issue / PR / Star / Watch）。

### 必须完成的动作

1. **轮换全部已暴露凭据**——清理历史不等于撤销泄露，这些密钥在公开仓库中已存在很久，必须假定已被抓取：GitHub OAuth Client Secret、`JWT_SECRET`、`QWEN_API_KEY` / `DASHSCOPE_API_KEY`、**OpenRouter（`sk-or-v1-…`，曾硬编码在 HEAD 的脚本里）**、SiliconFlow、Ollama、腾讯云、PostgreSQL / Redis / MinIO / MySQL 口令、TLS 证书与私钥、Stripe（若曾填真实值）。
2. `JWT_SECRET` **不得复用 `your-secret-key`**——它正是旧代码的兜底值，等同于公开已知。
3. 检查 CI Secrets、部署主机 `.env.production` 与数据库备份是否复用了同一批密钥。
4. 所有协作者必须重新 clone 或 `git fetch && git reset --hard origin/<branch>`；**从旧历史 push 会把凭据重新引入远端**。本地仓库执行过 `reset --mixed` 后，旧提交仍留在 reflog 与对象库中（不会被 `git push --all/--mirror` 推送，但可被显式检出）；确认无误后建议重新 clone 一份干净副本。

## 代码中的防护措施（按实际生效情况）

| 层面         | 实现位置与现状                                                                                                                                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 传输与请求头 | `main.ts:30-31` 请求体上限 4 MB；`:87` Helmet（CSP/HSTS 硬编码）；`:123-124` CORS **只读 `CORS_ORIGIN`**，`FRONTEND_URL` 不参与                                                                                                                    |
| 输入校验     | 全局 `ValidationPipe`；`common/validators/file-upload.validator.ts` 10 MB 上限与类型白名单（硬编码，`MAX_FILE_SIZE` / `ALLOWED_FILE_TYPES` 未读取）                                                                                                |
| 认证         | `passport-jwt`（`JWT_SECRET` / `JWT_EXPIRES_IN`）+ `JwtAuthGuard`；Google / GitHub OAuth。`jwt.strategy.ts:17`、`auth.module.ts:26`、`chat.module.ts:26` 均改为 `configService.getOrThrow<string>('JWT_SECRET')`，**缺失即启动失败**，不再有 `'your-secret-key'` 兜底值               |
| 授权         | `RolesGuard` + `@Roles(Role.ADMIN)` 保护 `/admin/*` 与前端管理页                                                                                                                                                                                   |
| 限流         | `app.module.ts:63-68` 配置 100 次 / 60 秒，并在 `:117-120` 通过 `APP_GUARD` **全局挂载 `ThrottlerGuard`**；`main.ts:28` 设 `trust proxy: 1`，使 `req.ip` 取 Caddy 覆写的真实客户端 IP（否则全站共享同一配额）。`RATE_LIMIT_*` 仍无读取点                                         |
| 运维端点     | `metrics` / `alerts` controller 无鉴权（`MonitoringGuard` 恒 `return true`），且 `alerting.controller.ts` 含 `POST` 创建 / 解决告警；`Caddyfile` 已对公网返回 403，但内网 `backend:3000` 仍可直接调用                                              |
| API 文档     | `main.ts:162-180` 生产默认关闭，需显式 `ENABLE_SWAGGER=true` 才 `SwaggerModule.setup('api/docs')`；`Caddyfile` 另在公网阻断 `/api/docs*`                                                                                                                                |
| 日志与审计   | Winston 请求日志中间件（`app.module.ts`）、`AuditLog` 模型                                                                                                                                                                                         |
| AI 密钥      | 运行时 Provider 密钥来自环境变量（`OPENAI_API_KEY`、`DEEPSEEK_API_KEY` 等，见 `modules/ai/services/ai.service.ts`）；`ModelConfig.apiKey` 只是管理端元数据，按明文存储（`admin.controller.ts` 与 `scripts/manage-model-config.ts` 一致），请勿填入真实生产密钥 |

## 部署注意事项

- 生产必填变量见 [部署与运维](../../deployment/README.md)；不要依赖示例弱口令：`compose` 中 MinIO 默认 `minioadmin`，必须在 `.env.production` 覆盖。镜像已全部锁定版本（`postgres:16`、`redis:7-alpine`、`minio/minio:RELEASE.2025-04-08T15-41-24Z`、`caddy:2-alpine`），不再使用 `latest`。
- Caddy 负责自动 HTTPS、SPA 反代，并在公网阻断 `/api/v1/metrics*`、`/api/v1/alerts*`、`/api/docs*`；`:80` 返回 426。
- **未被运行时读取的变量**：`ENCRYPTION_KEY`、`STORAGE_PROVIDER`、`AWS_*`、`CHROMA_DB_URL`、`BETTER_AUTH_URL`、`CSP_ENABLED`、`FORCE_HTTPS`、`HSTS_*`、`JWT_REFRESH_*`、`RATE_LIMIT_*`、`MAX_FILE_SIZE`、`ALLOWED_FILE_TYPES`、`DATABASE_POOL_*` 等。Helmet / Caddy / Throttler / 文件校验的实际值都是硬编码，设置这些变量不会产生加固效果。
- `deployment/config/ssl/` 下的遗留证书未被 Caddy 使用，可在轮换后删除。
- 定期执行 `pnpm audit` 并关注 `.github/dependabot.yml` 的依赖更新 PR；当前 CI 没有 CodeQL / Trivy / `npm audit` 步骤。**force push 时 GitHub 回报默认分支存在 168 个依赖漏洞（5 critical / 55 high / 90 moderate / 18 low）**，见仓库 Security → Dependabot，上生产前必须先处理 critical 与 high。
- **`.pnpm-store/` 存在于 8 个侧分支**：`main` 本身是干净的（685 个文件），且 `.gitignore:17` 已忽略 `.pnpm-store/`；但 6 个 dependabot 分支与 2 个 `trae/solo-agent-*` 分支各自跟踪了 96,167–103,353 个文件（含 145 个 >1 MB 的包缓存 blob，uncompressed 约 629 MB），这是仓库膨胀到 403 MB 的主因。内容为公开 npm 包缓存，不含凭据。这些分支多为过期 PR / agent 快照，**关闭对应 PR 并删除分支**即可让后续 `git gc` 大幅瘦身；另有 `packages/backend/models/*.onnx`（约 28 MB 说话人识别模型）建议改用 Git LFS 或外部下载。
