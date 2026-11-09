# CLAUDE.md

本文件为 AI 编码助手提供仓库内的操作指引，内容与当前代码对齐。面向人类的说明见 [README.md](./README.md) 与 [docs/README.md](./docs/README.md)。

## 项目概览

IntervAI 是 AI 驱动的简历优化与模拟面试平台，pnpm 9 + Turborepo monorepo，3 个 workspace：

- `@interview-ai/backend`：NestJS 10 + Prisma 7 + PostgreSQL + Redis + Socket.IO
- `@interview-ai/frontend`：React 18 + Vite 7 + Ant Design 6 + Zustand
- `@interview-ai/verification`：Jest 接口验证测试

## 常用命令

在仓库根目录执行（脚本定义在根与子包各自的 `package.json` 中）：

```bash
pnpm install
pnpm dev                     # concurrently 启动前后端
pnpm dev:backend             # nest start --watch
pnpm dev:frontend            # vite
pnpm build:backend           # nest build
pnpm build:frontend          # vite build
pnpm test                    # turbo run test
pnpm test:parallel           # pnpm -r --parallel run test
pnpm lint / pnpm lint:fix / pnpm typecheck / pnpm format / pnpm format:check
```

根目录没有 `pnpm build`、`pnpm start:prod` 脚本；E2E 入口在 backend 包内（`test:e2e`）。Prisma 脚本在 backend 包内：

```bash
pnpm --filter @interview-ai/backend prisma:generate
pnpm --filter @interview-ai/backend prisma:migrate   # prisma migrate dev
pnpm --filter @interview-ai/backend prisma:studio
pnpm --filter @interview-ai/backend prisma:seed
pnpm --filter @interview-ai/backend test:cov
pnpm --filter @interview-ai/backend test:e2e        # E2E，需 PostgreSQL + Redis
pnpm --filter @interview-ai/frontend test:coverage
```

基础服务：`docker compose -f deployment/docker-compose.yml up -d`（PostgreSQL 16、Redis 7、MinIO、Jaeger），也可用 `make infra-up`。部署入口为根目录 `deploy.sh`（`pnpm run deploy:app` / `make prod` 均可调用；`pnpm deploy` 是 pnpm 内置命令，勿用），参数见 [deployment/README.md](./deployment/README.md)；本地初始化可用 `pnpm --filter @interview-ai/backend setup`。

端口：前端 5173；后端 `PORT`（默认 3000）；`vite.config.ts` 的 dev 代理默认指向 `http://localhost:3000`，可用 `VITE_PROXY_TARGET` 覆盖，改端口时需同步 `VITE_API_BASE_URL`。

## 后端结构（`packages/backend/src/`）

按 NestJS 领域模块组织，顶层职责单一：

| 目录                        | 内容                                                                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.ts` / `app.module.ts` | 启动入口、根模块与全局中间件装配                                                                                                                                                                  |
| `modules/`                  | 全部业务功能模块：account、agents、ai、auth、chat、conversation、health、interview、invitation、job、payment、prompts、quota、resume、storage、user、voice                                |
| `infrastructure/`           | 基础设施模块：cache、config、database、logger、monitoring、notification                                                                                                                             |
| `common/`                   | 横切关注点：decorators、exceptions、filters、guards、interceptors、middleware、pipes、utils、validators                                                                                             |
| `ee/`                       | 商业版 payment / quota，由 `APP_EDITION` 控制整体加载                                                                                                                                                |
| `types/`                    | 跨模块共享的纯类型定义                                                                                                                                                                            |

- 模块内统一以 `<name>.module.ts` 为入口，实现按职责分到 `controllers/`、`services/`、`dto/`、`interfaces/`、`guards/`、`gateways/`、`constants/`、`utils/`、`adapters/` 等；`*.spec.ts` 与被测文件同目录。
- 跨模块引用统一用 `@/` 别名，模块内部用相对路径；E2E 用例在 `packages/backend/test/e2e/`，Prisma 生成物与调试脚本不放在 `src/`。
- `main.ts`：全局前缀 `API_PREFIX || '/api/v1'`（`health` 与 `/` 排除）、Helmet、CORS、`ValidationPipe`、`Throttler`（100 次 / 60 秒）、Swagger `/api/docs`、Socket.IO Redis adapter。
- 鉴权：`passport-jwt` + `JwtAuthGuard`，管理员路由叠加 `RolesGuard`；Google / GitHub OAuth。
- `APP_EDITION=oss` 时不加载 `ee/` 模块，支付 / 配额回退到 OSS 实现。
- 数据层：Prisma 7（`@prisma/adapter-pg`），schema 与迁移在 `prisma/`；Redis 用于缓存、Bull 队列与 Socket.IO adapter；对象存储用 `OSS_TYPE`（`MINIO` / `S3` / `OSS`）。
- WebSocket 命名空间：`/chat`、`/interview`、`/realtime-interview`。
- 两个包都用 `@/` 路径别名指向各自 `src/`。

## AI 与 Skills

- `modules/ai/constants/models.ts` 定义 7 个 OpenAI 兼容 `PROVIDER_BASE_URLS`：`openai`、`deepseek`、`qwen`、`gemini`、`ollama`、`siliconcloud`、`openrouter`。
- 默认 `AI_MODEL=deepseek:deepseek-chat`，`AI_EMBEDDING_MODEL=siliconcloud:BAAI/bge-m3`。
- Skills 引擎在 `src/modules/ai/skills/`：`skill-registry.ts`、`skill-loader.ts`、`skill-markdown-parser.ts`、`skill-installer.service.ts`；接口契约在 `src/modules/ai/interfaces/`（`skill.interface.ts`、`skill-package.interface.ts`）。`AiModule.onModuleInit()` 加载 `skills/*.md`（默认 `process.cwd()/skills`，可用 `SKILLS_DIR` 覆盖）。
- `packages/backend/skills/` 下 12 个技能：`resume-analyzer`、`resume-writer`、`jd-matcher`、`job-parser`、`interview-prep`、`interview-assistant`、`interview-question-generator`、`answer-evaluator`、`pitch-perfect`、`career-advisor`、`skill-analyzer`、`salary-analyzer`。
- 调用方式：`aiService.executeSkill(name, inputs, userId)`；`aiService.getSkills()` 列出技能。
- `skill-installer.service.ts` 仅远程 URL 安装可用；NPM / GitHub / YAML 加载标注为 `not implemented`。
- `skills-eval/` 是评测用例与生成产物，不参与运行时加载。完整说明见 [docs/technical/skills-engine.md](./docs/technical/skills-engine.md)。

### 新增 Skill

在 `packages/backend/skills/` 新建 Markdown 文件，YAML frontmatter 至少包含 `name`、`version`、`description`、`tags`、`inputs`，正文作为 prompt 模板：

```markdown
---
name: my-skill
version: 1.0.0
description: Skill description
tags: [example]
inputs:
  inputName:
    type: string
    required: true
    description: Input description
outputs:
  type: object
---

# System Prompt

Your prompt here: {{inputName}}
```

模板支持 `{{inputName}}`、`{{#if key}}...{{/if}}`；对象 / 数组输入按 JSON 注入；输入类型做严格 `typeof` 校验。启动时自动加载。

## 前端结构（`packages/frontend/src/`）

按 feature 分层，依赖方向固定为 `app → ee → features → shared`（箭头表示允许依赖的方向）。

- `app/`：`main.tsx`（`index.html` 指向 `/src/app/main.tsx`）、`App.tsx`（ConfigProvider）、`router.tsx`（`createBrowserRouter`，管理路由要求 `ADMIN` 角色，EE 路由由 `VITE_APP_EDITION !== 'oss'` 控制）、`global.css`（设计令牌）、`layouts/`（AppLayout / Sidebar）。
- `features/<domain>/`：`admin`、`auth`、`billing`、`interview`、`legal`、`pitch-perfect`、`resume`、`user`。域内统一 `api/`、`components/`、`hooks/`、`stores/`、`pages/`、`utils/`、`types.ts`；`index.ts` 只暴露跨域公共 API。
- `shared/`：无业务归属的复用层 —— `ui/`（原子组件）、`components/`、`lib/`（axios、i18n、upload-service）、`config/`、`utils/`、`types/`、`stores/`（仅 uiStore）、`styles/`、`locales/`（`zh-CN.json`、`en-US.json`）。
- `ee/`：企业版扩展（PricingPage、GlobalQuotaListener），与 feature 分层正交，由版本开关控制。`assets/`：静态资源。

约定：

- 目录用 kebab-case；React 组件文件 `PascalCase.tsx`；其余 `.ts` 用 kebab-case；样式与组件同名且同目录；测试 `*.test.ts(x)` 与被测文件同目录；公共目录提供 `index.ts` barrel。
- 跨目录导入一律用 `@/` 别名（CSS、动态 `import()`、`vi.mock()` 同样适用），仅同目录可用 `./`。`packages/frontend/.eslintrc.json` 的 `no-restricted-imports` 强制拦截旧技术分层路径、`../..` 深层相对路径，以及 `shared` / `features` 对上层的反向依赖。
- `shared/lib/axios.ts`：`baseURL = VITE_API_BASE_URL || '/api/v1'`，注入 `auth_token` 与 `traceparent`，处理 401 / 403 / 429；401 通过 `setUnauthorizedHandler` 由 auth feature 注册状态清理，避免 shared 反向依赖 feature。
- 格式化工具在 `shared/utils/format.ts`、语言归一化在 `shared/utils/language.ts`，不与 i18n 实例混放；领域类型归各 feature 的 `types.ts`，共享 DTO 在 `shared/types/`。
- `vite-plugin-pwa` 已安装但为构建性能禁用；测试用 Vitest，入口配置为 `vitest.setup.ts`。

## 环境变量

- 后端示例：`packages/backend/.env.example`（`DATABASE_URL`、`REDIS_*`、`JWT_SECRET`、`AI_MODEL` / `AI_EMBEDDING_MODEL`、各 `*_API_KEY`、`OSS_TYPE` / `OSS_*`、`APP_EDITION`、`CORS_ORIGIN` 等）。
- 前端示例：`packages/frontend/.env.example`（`VITE_API_BASE_URL`、`VITE_APP_EDITION`、Paddle 前端键）；`VITE_BACKEND_URL`、OAuth 开关、`VITE_STRIPE_PUBLISHABLE_KEY` 当前无代码读取点。
- 部署：根目录 `.env`（项目保留）/ `.env.production`，不再维护 `.env.production.example`；完整必填变量见 [deployment/README.md](./deployment/README.md)。`ENCRYPTION_KEY`、`STORAGE_PROVIDER`、`CSP_ENABLED`、`RATE_LIMIT_*` 等均为未被读取的死变量。
- 监控 / 可观测性：`SENTRY_DSN`、`OTEL_ENABLE`、`OTEL_OTLP_URL`、`LOG_LEVEL`、`ALERT_WEBHOOK_URL`、`SLACK_WEBHOOK_URL` 有效；`infrastructure/monitoring/config/monitoring.config.ts` 的 `getMonitoringConfig()` 无调用点，见 [docs/guide/monitoring.md](./docs/guide/monitoring.md)。

## 开发注意

- 修改 API 时同步 Swagger 装饰器与文档；全局前缀为 `/api/v1`，`/health` 不受前缀影响，指标 / 告警为 `/api/v1/metrics`、`/api/v1/alerts`。
- 提交遵循 Conventional Commits，CI job 为 `lint`、`backend`、`frontend`（见 [docs/guide/workflows.md](./docs/guide/workflows.md)）。
- E2E 用例在 `test/e2e/`，需要 PostgreSQL + Redis，通过 `pnpm --filter @interview-ai/backend test:e2e` 运行；默认 `pnpm test` 只跑 `src/` 内的单元测试。
- 已知不一致：`.env.example` 端口 3000 与 Vite 代理 3001、`monitoring.config.ts` 为死配置、`ThrottlerModule` 未全局挂载、Swagger 生产未关闭、JWT 有默认兜底密钥。详见 [docs/architecture/system-architecture.md](./docs/architecture/system-architecture.md)。
