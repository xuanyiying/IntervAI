# 安全策略

## 报告漏洞

请勿在公开 Issue 中披露漏洞。通过仓库的私有漏洞报告渠道（GitHub Security Advisories）或直接联系维护者，附复现步骤、影响范围与受影响版本，修复发布后再公开披露。

## 当前版本

各 `package.json` 版本均为 `1.0.0`；以 `main` 分支与最新 Release 为准，旧版本不提供安全更新。

## 已入库凭据（最高优先级）

历史提交 `1ccfbeb54` 曾包含 `.env`、`.env.production`、`.env.docker` 与 `deployment/config/ssl/udefined.cc.key` 等 TLS 私钥 / 证书。当前已取消证书文件的 git 跟踪并把 `**/config/ssl/*.key|pem|crt|csr` 加入 `.gitignore`，项目也保留了本地 `.env`；但**忽略规则不会清除历史记录**，这些凭据必须视为已泄露：

1. 轮换 TLS 证书、数据库 / Redis / MinIO 口令、`JWT_SECRET`、OAuth 与支付凭据、所有 AI Provider Key。
2. 用 `git filter-repo` / `git filter-branch` 清理历史，并强制更新远端与所有 clone。
3. 检查 CI Secrets、部署主机 `.env.production` 与备份文件是否也使用了同一批密钥。

## 代码中的防护措施（按实际生效情况）

| 层面         | 实现位置与现状                                                                                                                                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 传输与请求头 | `main.ts:25-26` 请求体上限 4 MB；`:81-103` Helmet（CSP/HSTS 硬编码）；`:118` CORS **只读 `CORS_ORIGIN`**，`FRONTEND_URL` 不参与                                                                                                                    |
| 输入校验     | 全局 `ValidationPipe`；`common/validators/file-upload.validator.ts` 10 MB 上限与类型白名单（硬编码，`MAX_FILE_SIZE` / `ALLOWED_FILE_TYPES` 未读取）                                                                                                |
| 认证         | `passport-jwt`（`JWT_SECRET` / `JWT_EXPIRES_IN`）+ `JwtAuthGuard`；Google / GitHub OAuth。`jwt.strategy.ts:17` 与 `auth.module.ts` 仍有 `'your-secret-key'` 兜底值，生产必须显式设置 `JWT_SECRET`（prod compose 已用 `:?` 强制校验）               |
| 授权         | `RolesGuard` + `@Roles(Role.ADMIN)` 保护 `/admin/*` 与前端管理页                                                                                                                                                                                   |
| 限流         | `app.module.ts:63-68` 配置 100 次 / 60 秒，但**未挂载 `APP_GUARD`**，仅 `modules/user/controllers/user.controller.ts:130` 局部生效；`RATE_LIMIT_*` 无读取                                                                                                         |
| 运维端点     | `metrics` / `alerts` controller 无鉴权（`MonitoringGuard` 恒 `return true`），且 `alerting.controller.ts` 含 `POST` 创建 / 解决告警；`Caddyfile` 已对公网返回 403，但内网 `backend:3000` 仍可直接调用                                              |
| API 文档     | `main.ts:173` 无条件 `SwaggerModule.setup('api/docs')`；`Caddyfile` 已阻断公网 `/api/docs*`，非生产环境仍应自行限制                                                                                                                                |
| 日志与审计   | Winston 请求日志中间件（`app.module.ts`）、`AuditLog` 模型                                                                                                                                                                                         |
| AI 密钥      | 运行时 Provider 密钥来自环境变量（`OPENAI_API_KEY`、`DEEPSEEK_API_KEY` 等，见 `modules/ai/services/ai.service.ts`）；`ModelConfig.apiKey` 只是管理端元数据，按明文存储（`admin.controller.ts` 与 `scripts/manage-model-config.ts` 一致），请勿填入真实生产密钥 |

## 部署注意事项

- 生产必填变量见 [部署与运维](../../deployment/README.md)；不要依赖示例弱口令：`compose` 中 MinIO 默认 `minioadmin`，必须在 `.env.production` 覆盖；`redis:latest` / `minio/minio:latest` 建议锁定版本。
- Caddy 负责自动 HTTPS、SPA 反代，并在公网阻断 `/api/v1/metrics*`、`/api/v1/alerts*`、`/api/docs*`；`:80` 返回 426。
- **未被运行时读取的变量**：`ENCRYPTION_KEY`、`STORAGE_PROVIDER`、`AWS_*`、`CHROMA_DB_URL`、`BETTER_AUTH_URL`、`CSP_ENABLED`、`FORCE_HTTPS`、`HSTS_*`、`JWT_REFRESH_*`、`RATE_LIMIT_*`、`MAX_FILE_SIZE`、`ALLOWED_FILE_TYPES`、`DATABASE_POOL_*` 等。Helmet / Caddy / Throttler / 文件校验的实际值都是硬编码，设置这些变量不会产生加固效果。
- `deployment/config/ssl/` 下的遗留证书未被 Caddy 使用，可在轮换后删除。
- 定期执行 `pnpm audit` 并关注 `.github/dependabot.yml` 的依赖更新 PR；当前 CI 没有 CodeQL / Trivy / `npm audit` 步骤。
