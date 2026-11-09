# Backend

NestJS 10 API，使用 Prisma 7 + PostgreSQL、Redis、Socket.IO，以及基于 Markdown 的 Skills 引擎。包名 `@interview-ai/backend`。

## 目录结构

```
packages/backend/
├── src/
│   ├── main.ts / app.module.ts   # 启动与模块注册
│   ├── modules/                  # 业务功能模块（按领域划分）
│   ├── infrastructure/           # cache、config、database、logger、monitoring、notification
│   ├── common/                   # guards、decorators、filters、interceptors、middleware、validators
│   ├── ee/                       # 商业版 payment、quota
│   └── types/                    # 跨模块共享类型
├── test/e2e/                     # supertest E2E 用例（jest.e2e.config.js）
├── prisma/                       # schema.prisma、migrations/、seed.ts
├── skills/                       # 12 个运行时技能定义（见 docs/technical/skills-engine.md）
├── skills-eval/                  # 技能评测用例（不参与运行时加载）
├── prompts/                      # 实时面试提示词模板
├── generated/                    # Prisma 生成物（不参与编译）
├── Dockerfile
└── .env.example
```

`src/modules/` 下按领域划分：account、agents、ai、auth、backup、chat、conversation、health、interview、invitation、job、payment、prompts、quota、resume、storage、user、voice。每个模块以 `<name>.module.ts` 为入口，实现按职责归入 `controllers/`、`services/`、`dto/`、`interfaces/`、`guards/`、`gateways/`、`constants/`、`utils/`、`adapters/` 等目录，`*.spec.ts` 与被测文件同目录；跨模块引用统一使用 `@/` 别名。

`APP_EDITION=oss` 时 `app.module.ts` 不加载 `ee/` 模块，`modules/payment`、`modules/quota` 等回退到 OSS 实现。

## 快速开始

```bash
# 在仓库根目录
pnpm install
docker compose -f deployment/docker-compose.yml up -d
cp .env.example .env    # 在 packages/backend 目录内执行，按需修改 DATABASE_URL 等
pnpm --filter @interview-ai/backend prisma:generate
pnpm --filter @interview-ai/backend prisma:migrate
pnpm --filter @interview-ai/backend start:dev
```

也可 `cd packages/backend` 后直接执行 `pnpm dev` / `pnpm prisma:generate` / `pnpm prisma:migrate`。后端端口由 `PORT` 决定（默认 3000）。

常用脚本：`build`（`nest build`）、`start:prod`（`node dist/main`）、`lint`、`test`（Jest 单元测试）、`test:e2e`（E2E）、`test:cov`、`prisma:studio`、`prisma:seed`。

- `setup`：执行 `scripts/setup.sh`，安装 workspace 依赖、复制 `.env`，可选启动基础设施并执行 Prisma 迁移。
- `model-config`：执行 `scripts/manage-model-config.ts`，管理 `ModelConfig`（需要 `DATABASE_URL`；用法见文件头注释）。
- `docker:up` / `docker:down` / `docker:logs`：操作根目录 `deployment/docker-compose.yml`。

> 旧的 `seed:models` 与一次性播种 / 调试脚本已移除。ModelConfig 的管理入口是 `pnpm model-config` 或管理后台 `/admin/models`；运行时 AI 密钥来自环境变量，见 [安全策略](../../docs/guide/security.md)。

## API

- 全局前缀 `API_PREFIX || '/api/v1'`；`health` 与 `/` 被排除
- Swagger：`/api/docs`
- 健康检查：`GET /health`；指标与告警：`/api/v1/metrics`、`/api/v1/alerts`
- 主要控制器：`auth`、`user`、`user/notifications`、`admin`、`account`、`conversations`、`backup`、`quota`、`payments`、`storage`、`jobs`、`interview`、`interview/voiceprint`、`interviewer-personas`、`voices`、`agents/pitch-perfect`、`resumes`、`optimizations`、`match-analysis`、`generate`、`templates`
- WebSocket 命名空间：`/chat`、`/interview`、`/realtime-interview`
- 鉴权：JWT（`JWT_SECRET` / `JWT_EXPIRES_IN`）+ `JwtAuthGuard`，管理员路由叠加 `RolesGuard`；Google / GitHub OAuth

## AI 能力

`modules/ai/constants/models.ts` 通过 OpenAI 兼容接口支持 7 个 provider：`openai`、`deepseek`、`qwen`、`gemini`、`ollama`、`siliconcloud`、`openrouter`。默认 `AI_MODEL=deepseek:deepseek-chat`、`AI_EMBEDDING_MODEL=siliconcloud:BAAI/bge-m3`。

Skills 引擎位于 `modules/ai/skills/`：`skill-registry`、`skill-loader`、`skill-markdown-parser`、`skill-installer.service` 等，启动时从 `skills/*.md`（或 `SKILLS_DIR`）加载 12 个技能，业务服务用 `aiService.executeSkill(name, inputs, userId)` 调用。完整说明见 [Skills 引擎](../../docs/technical/skills-engine.md)。

## 数据与存储

- Prisma schema 含 `User`、`Session`/`Account`/`Verification`、`Resume`/`ResumeVersion`、`Job`、`Optimization`、`GeneratedPDF`、`Template`、`InterviewSession`/`InterviewMessage`/`InterviewQuestion`、`Conversation`/`Message`、`ModelConfig`、`PromptTemplate`、`UsageRecord`、`Storage`、`AuditLog` 及 AI 调用日志等模型。
- Redis 用于缓存、Bull 队列与 Socket.IO adapter。
- 对象存储由 `OSS_TYPE` 选择 provider（`modules/storage/adapters/` 下 `aws-s3`、`aliyun-oss`、`minio`），分片 / 预签名直传见 `modules/storage/services/direct-upload.service.ts`；模块文档见 [storage/README.md](./src/modules/storage/README.md)。

## 测试

```bash
pnpm --filter @interview-ai/backend test        # 仅 src/ 内的单元测试
pnpm --filter @interview-ai/backend test:cov
pnpm --filter @interview-ai/backend test:e2e    # E2E，需 PostgreSQL + Redis
```

单元测试用 `jest.config.js`（`rootDir: src`），E2E 用 `jest.e2e.config.js`（`test/e2e/**/*.e2e.spec.ts`），两者互不干扰；测试编译配置为 `tsconfig.spec.json`。详见 [E2E README](./test/e2e/README.md)。

## 相关文档

- [系统架构](../../docs/architecture/system-architecture.md) · [Skills 引擎](../../docs/technical/skills-engine.md)
- [部署与运维](../../deployment/README.md) · [环境变量示例](./.env.example)
- [面试模块](./src/modules/interview/README.md) · [支付模块（EE）](./src/ee/payment/README.md)
