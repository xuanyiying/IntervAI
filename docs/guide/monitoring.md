# 监控与告警

本文只描述代码中实际生效的能力。`deployment/docker-compose.prod.yml` **没有任何监控服务编排**（Prometheus / Grafana / Loki 等连注释都没有）；`deployment/config/` 下虽有对应的配置目录，但需要自行编写 compose 服务才能启用。

## HTTP 端点

`main.ts` 对全局前缀 `/api/v1` 只排除 `health` 与 `/`：

| 端点                                                                                    | 来源                                                                                  | 说明                                                                                            |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `GET /health`                                                                           | `modules/health/controllers/health.controller.ts:18`、`app.controller.ts:10`（重复定义，仅一处生效） | 健康检查；`/health/live`、`/health/ready` 因排除规则只匹配精确路径，实际落在 `/api/v1/health/*` |
| `GET /api/v1/metrics`                                                                   | `infrastructure/monitoring/controllers/metrics.controller.ts`                                             | prom-client 指标                                                                                |
| `GET /api/v1/alerts`、`GET severity/:severity`、`GET :id`、`POST :id/resolve`、`POST /` | `infrastructure/monitoring/controllers/alerting.controller.ts`                                            | 告警查询、创建与解决                                                                            |

这些 controller 没有 `JwtAuthGuard`；`main.ts` 挂载的 `MonitoringGuard` 恒 `return true`（用于埋点，不做鉴权）。`deployment/config/caddy/Caddyfile` 已对公网把 `/api/v1/metrics*`、`/api/v1/alerts*`、`/api/docs*` 返回 403，内网仍可通过 `backend:3000` 直接访问。`Caddyfile` 的 `/health` 已改为反代后端真实端点，不再是静态 200；`deploy.sh` 生产探活也改为直连 backend 容器。

## 实际生效的配置

`infrastructure/monitoring/config/monitoring.config.ts` 中的 `getMonitoringConfig()` **全仓库无调用点**，是一份死配置：其中 `METRICS_PORT`（9090）、`METRICS_PATH`（`/metrics`）、`HEALTH_CHECK_*`、各类阈值都未生效，也没有独立 9090 HTTP 服务；指标实际由上面的 controller 提供。真正被读取的变量分散在：

| 变量                                                                                      | 读取位置                                                                                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `SENTRY_DSN`、`SENTRY_TRACES_SAMPLE_RATE`                                                 | `main.ts:47-63`、`infrastructure/monitoring/services/monitoring.service.ts`                                                   |
| `OTEL_ENABLE`、`OTEL_OTLP_URL`                                                            | `infrastructure/monitoring/utils/otel.ts`（默认 `http://localhost:4318/v1/traces`）                                        |
| `LOG_LEVEL`                                                                               | `infrastructure/logger/config/logger.config.ts`                                                                             |
| `ALERT_WEBHOOK_URL`、`SLACK_WEBHOOK_URL`、`ALERT_EMAIL_ENABLED`、`ALERT_EMAIL_RECIPIENTS` | `infrastructure/monitoring/services/alerting.service.ts`（webhook / Slack 真实 `axios.post`；邮件分支仅打印日志，未实现发送） |

生产 compose 已注入 `LOG_LEVEL`、`SENTRY_DSN`、`OTEL_ENABLE`、`OTEL_OTLP_URL`；告警相关变量需按需自行注入。

## 应用内实现

- `main.ts` 接入 Winston、Sentry、全局监控拦截器与 `MonitoringGuard`；请求日志中间件在 `app.module.ts` 中注册，记录全部请求。
- 慢请求判断在 `infrastructure/monitoring/interceptors/monitoring.interceptor.ts` 中硬编码 `duration > 2000`（非请求日志中间件，也非配置项）。
- `modules/ai/services/usage-tracker.service.ts` 只写 `UsageRecord`；`AICallLog`、`AIRetryLog`、`AIDegradationLog` 虽在 `prisma/schema.prisma` 中定义，但当前无写入代码。
- `ThrottlerModule` 在 `app.module.ts:62-67` 配置为 100 次 / 60 秒，但**没有挂载 `APP_GUARD`**，仅 `modules/user/controllers/user.controller.ts:130` 局部使用 `ThrottlerGuard`，因此全局限流并未生效。`RATE_LIMIT_*` 等变量在运行时代码中无读取。

## 自建监控栈

若需要 Prometheus / Grafana / Loki，请基于 `deployment/config/prometheus/`、`grafana/`、`loki/`、`promtail/`、`alertmanager/` 中的配置自行在 `docker-compose.prod.yml` 添加服务，并确认内存预算；仓库不再提供单独的监控启动脚本。同时建议为 `metrics` / `alerts` controller 增加鉴权，不要只依赖网关阻断。
