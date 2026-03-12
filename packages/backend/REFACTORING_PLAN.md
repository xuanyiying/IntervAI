# Backend 重构计划 (扁平化功能模块版)

## 一、项目背景与迁移目标

### 1.1 项目背景

IntervAI 是一个 AI 驱动的面试准备与简历优化平台，后端采用 NestJS 框架开发。随着业务功能的不断扩展，当前代码库存在以下问题：

**现状问题：**

1. **模块耦合度高** - 业务逻辑与基础设施代码混在一起
2. **职责不清晰** - service 文件过于庞大，包含多种职责
3. **依赖混乱** - 存在循环依赖和过度耦合
4. **难以测试** - 单元测试困难，集成测试覆盖不足
5. **维护成本高** - 新功能开发效率低下，bug 定位困难

**技术栈：**

- 框架：NestJS 10.x
- 数据库：PostgreSQL + Prisma ORM
- 缓存：Redis
- 存储：MinIO / AWS S3 / 阿里云 OSS
- AI：OpenAI / Gemini / 通义千问 / DeepSeek
- 队列：Bull + Redis
- 监控：Sentry + OpenTelemetry

### 1.2 迁移目标

**架构目标：**

```
旧结构:                          新结构:
src/                          src/
  resume/                        modules/
    resume.service.ts             resume/
    resume-optimizer.service.ts     resume.service.ts
    job.service.ts               job/
    ai.service.ts                  job.service.ts
    prisma.service.ts            shared/
    ...                           database/
                                  ai/
                                  cache/
```

**具体目标：**
| 目标 | 指标 | 验证方式 |
|------|------|----------|
| 模块解耦 | 无循环依赖 | `npm run dep-graph` |
| 代码质量 | ESLint 0 错误 | `npm run lint` |
| 类型安全 | TS 0 错误 | `npx tsc --noEmit` |
| 测试覆盖 | ≥80% 覆盖率 | `npm run test:cov` |
| 功能完整 | E2E 测试全通过 | `npm run test:e2e` |
| 性能稳定 | 响应时间无明显下降 | APM 监控 |

---

## 二、架构原则

### 2.1 功能模块优先

- 按业务功能划分模块（Resume、Interview、Job、User等）
- 每个模块扁平化组织，包含 service、controller、dto、entities、interfaces
- 共享基础设施放在模块内部或单独的 shared 模块

### 2.2 NestJS 官方推荐结构

- 简洁扁平，不过度设计
- 模块内聚，职责清晰
- 易于理解和维护

### 2.3 最佳实践

- 模块单一职责，导出服务 ≤ 5个
- 单向依赖，禁止 forwardRef
- 依赖注入，接口隔离

---

## 三、目录结构

```
src/
├── main.ts
├── app.module.ts
│
├── modules/                           # 功能模块
│   │
│   ├── resume/                        # 简历模块
│   │   ├── resume.module.ts
│   │   ├── resume.service.ts
│   │   ├── resume.controller.ts
│   │   ├── resume-optimizer.service.ts
│   │   ├── resume-optimizer.controller.ts
│   │   ├── resume-parser.service.ts
│   │   ├── pdf-generation.service.ts
│   │   ├── pdf-generation.controller.ts
│   │   ├── match-analysis.service.ts
│   │   ├── match-analysis.controller.ts
│   │   ├── templates.controller.ts
│   │   ├── dto/
│   │   │   ├── create-resume.dto.ts
│   │   │   ├── update-resume.dto.ts
│   │   │   └── upload-resume.dto.ts
│   │   ├── entities/
│   │   │   └── resume.entity.ts
│   │   └── interfaces/
│   │       ├── resume.interface.ts
│   │       └── match-score.interface.ts
│   │
│   ├── interview/                     # 面试模块
│   │   ├── interview.module.ts
│   │   ├── interview.service.ts
│   │   ├── interview.controller.ts
│   │   ├── interview.gateway.ts
│   │   ├── session.service.ts
│   │   ├── question-generator.service.ts
│   │   ├── answer-evaluator.service.ts
│   │   ├── answer-evaluation.processor.ts
│   │   ├── report.service.ts
│   │   ├── persona.service.ts
│   │   ├── persona.controller.ts
│   │   ├── dto/
│   │   │   ├── create-session.dto.ts
│   │   │   ├── send-message.dto.ts
│   │   │   └── end-session.dto.ts
│   │   ├── entities/
│   │   │   ├── session.entity.ts
│   │   │   └── question.entity.ts
│   │   └── interfaces/
│   │       └── interview.interface.ts
│   │
│   ├── job/                           # 职位模块
│   │   ├── job.module.ts
│   │   ├── job.service.ts
│   │   ├── job.controller.ts
│   │   ├── job-parser.service.ts
│   │   ├── job-matcher.service.ts
│   │   ├── dto/
│   │   ├── entities/
│   │   │   └── job.entity.ts
│   │   └── interfaces/
│   │       └── job.interface.ts
│   │
│   ├── job-search/                    # 求职搜索模块
│   │   ├── job-search.module.ts
│   │   ├── job-search.service.ts
│   │   ├── job-search.controller.ts
│   │   ├── agents/
│   │   │   ├── scraper.agent.ts
│   │   │   ├── parser.agent.ts
│   │   │   ├── matcher.agent.ts
│   │   │   ├── apply.agent.ts
│   │   │   ├── tracker.agent.ts
│   │   │   └── coach.agent.ts
│   │   ├── services/
│   │   │   ├── job-aggregation.service.ts
│   │   │   ├── application-tracking.service.ts
│   │   │   └── interview-prep.service.ts
│   │   ├── dto/
│   │   └── interfaces/
│   │       └── job-search.interface.ts
│   │
│   ├── agent/                         # Agent模块
│   │   ├── agent.module.ts
│   │   ├── agent.controller.ts
│   │   ├── services/
│   │   │   ├── agent-orchestrator.service.ts
│   │   │   ├── agentic.service.ts
│   │   │   ├── cache-manager.service.ts
│   │   │   └── batch-processor.service.ts
│   │   ├── agents/
│   │   │   ├── strategist.agent.ts
│   │   │   ├── strategist.controller.ts
│   │   │   ├── role-play.agent.ts
│   │   │   ├── role-play.controller.ts
│   │   │   ├── pitch-perfect.agent.ts
│   │   │   ├── pitch-perfect.controller.ts
│   │   │   └── resume-optimizer.agent.ts
│   │   ├── tools/
│   │   │   ├── rag-retrieval.tool.ts
│   │   │   ├── jd-analyzer.tool.ts
│   │   │   ├── resume-parser.tool.ts
│   │   │   └── keyword-matcher.tool.ts
│   │   ├── team/
│   │   │   ├── leader.agent.ts
│   │   │   ├── team-orchestrator.service.ts
│   │   │   ├── team-task.service.ts
│   │   │   ├── team.controller.ts
│   │   │   ├── team.gateway.ts
│   │   │   └── workers/
│   │   │       ├── analysis.worker.ts
│   │   │       ├── generation.worker.ts
│   │   │       ├── retrieval.worker.ts
│   │   │       └── validation.worker.ts
│   │   ├── workflow/
│   │   │   ├── workflow.orchestrator.ts
│   │   │   └── lcel-workflow.orchestrator.ts
│   │   ├── controllers/
│   │   │   ├── agent-management.controller.ts
│   │   │   ├── agent-metrics.controller.ts
│   │   │   ├── agent-session.controller.ts
│   │   │   └── knowledge-base.controller.ts
│   │   ├── dto/
│   │   │   └── knowledge-base.dto.ts
│   │   └── interfaces/
│   │       ├── agent.interface.ts
│   │       ├── tool.interface.ts
│   │       └── workflow.interface.ts
│   │
│   ├── rag/                           # RAG模块
│   │   ├── rag.module.ts
│   │   ├── rag.service.ts
│   │   ├── rag.controller.ts
│   │   ├── document-processor.service.ts
│   │   ├── context-compressor.service.ts
│   │   ├── knowledge-base.service.ts
│   │   ├── embedding.service.ts
│   │   ├── vector-db.service.ts
│   │   ├── dto/
│   │   └── interfaces/
│   │       └── rag.interface.ts
│   │
│   ├── user/                          # 用户模块
│   │   ├── user.module.ts
│   │   ├── user.service.ts
│   │   ├── user.controller.ts
│   │   ├── admin.controller.ts
│   │   ├── user-notifications.controller.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   ├── forgot-password.dto.ts
│   │   │   ├── reset-password.dto.ts
│   │   │   ├── verify-email.dto.ts
│   │   │   └── user-response.dto.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── guards/
│   │   │   ├── roles.guard.ts
│   │   │   └── admin.guard.ts
│   │   └── decorators/
│   │       └── roles.decorator.ts
│   │
│   ├── auth/                          # 认证模块
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── google-auth.guard.ts
│   │   │   └── github-auth.guard.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── google.strategy.ts
│   │   │   └── github.strategy.ts
│   │   ├── interfaces/
│   │   │   └── jwt-payload.interface.ts
│   │   └── auth.constants.ts
│   │
│   ├── account/                       # 账户模块
│   │   ├── account.module.ts
│   │   ├── account.service.ts
│   │   └── account.controller.ts
│   │
│   ├── payment/                       # 支付模块
│   │   ├── payment.module.ts
│   │   ├── payment.service.ts
│   │   ├── payment.controller.ts
│   │   ├── providers/
│   │   │   ├── stripe.provider.ts
│   │   │   └── paddle.provider.ts
│   │   ├── dto/
│   │   │   ├── create-checkout-session.dto.ts
│   │   │   └── subscription-response.dto.ts
│   │   └── interfaces/
│   │       └── payment-provider.interface.ts
│   │
│   ├── chat/                          # 聊天模块
│   │   ├── chat.module.ts
│   │   ├── chat.gateway.ts
│   │   ├── chat.service.ts
│   │   ├── chat-intent.service.ts
│   │   ├── scene-analysis.service.ts
│   │   └── redis-io.adapter.ts
│   │
│   ├── voice/                         # 语音模块
│   │   ├── voice.module.ts
│   │   ├── voice.service.ts
│   │   ├── voice.controller.ts
│   │   └── dto/
│   │       └── voice.dto.ts
│   │
│   ├── quota/                         # 配额模块
│   │   ├── quota.module.ts
│   │   ├── quota.service.ts
│   │   └── quota.controller.ts
│   │
│   ├── conversation/                  # 对话模块
│   │   ├── conversation.module.ts
│   │   ├── conversation.service.ts
│   │   ├── conversation.controller.ts
│   │   └── conversation-context.service.ts
│   │
│   ├── invitation/                    # 邀请模块
│   │   ├── invitation.module.ts
│   │   ├── invitation.service.ts
│   │   └── invitation.controller.ts
│   │
│   ├── backup/                        # 备份模块
│   │   ├── backup.module.ts
│   │   ├── backup.service.ts
│   │   └── backup.controller.ts
│   │
│   └── email/                         # 邮件模块
│       ├── email.module.ts
│       ├── email.service.ts
│       └── templates/
│           ├── verification.hbs
│           └── reset-password.hbs
│
├── shared/                            # 共享模块
│   │
│   ├── ai/                            # AI共享模块
│   │   ├── ai.module.ts
│   │   ├── ai-engine.service.ts
│   │   ├── ai-engine.spec.ts
│   │   ├── degradation.service.ts
│   │   ├── langchain-adapter.service.ts
│   │   ├── queue/
│   │   │   ├── ai-queue.module.ts
│   │   │   ├── ai-queue.service.ts
│   │   │   └── ai-queue.processor.ts
│   │   └── interfaces/
│   │       └── ai.interface.ts
│   │
│   ├── ai-provider/                   # AI提供商模块
│   │   ├── ai-provider.module.ts
│   │   ├── ai-provider.factory.ts
│   │   ├── providers/
│   │   │   ├── openai.provider.ts
│   │   │   ├── gemini.provider.ts
│   │   │   ├── qwen.provider.ts
│   │   │   ├── deepseek.provider.ts
│   │   │   ├── ollama.provider.ts
│   │   │   └── siliconcloud.provider.ts
│   │   ├── config/
│   │   │   ├── model-config.service.ts
│   │   │   ├── prompt-template.manager.ts
│   │   │   └── predefined-templates.ts
│   │   ├── selector/
│   │   │   ├── model.selector.ts
│   │   │   ├── model.registry.ts
│   │   │   └── scenario-mapping.service.ts
│   │   ├── tracking/
│   │   │   └── usage-tracker.service.ts
│   │   ├── monitoring/
│   │   │   └── performance-monitor.service.ts
│   │   ├── logging/
│   │   │   └── ai-logger.ts
│   │   ├── security/
│   │   │   └── security.service.ts
│   │   ├── utils/
│   │   │   ├── encryption.service.ts
│   │   │   └── retry-handler.ts
│   │   ├── controllers/
│   │   │   ├── ai.controller.ts
│   │   │   ├── model-admin.controller.ts
│   │   │   └── prompt-admin.controller.ts
│   │   ├── dto/
│   │   │   ├── call-ai.dto.ts
│   │   │   └── upsert-model-config.dto.ts
│   │   └── interfaces/
│   │       ├── ai-provider.interface.ts
│   │       ├── model.interface.ts
│   │       └── prompt-template.interface.ts
│   │
│   ├── database/                      # 数据库模块
│   │   ├── database.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── cache/                         # 缓存模块
│   │   ├── cache.module.ts
│   │   └── redis.service.ts
│   │
│   ├── storage/                       # 存储模块
│   │   ├── storage.module.ts
│   │   ├── storage.service.ts
│   │   ├── direct-upload.service.ts
│   │   ├── storage.controller.ts
│   │   ├── providers/
│   │   │   ├── aliyun-oss.provider.ts
│   │   │   ├── aws-s3.provider.ts
│   │   │   └── minio.provider.ts
│   │   ├── config/
│   │   │   └── oss.config.ts
│   │   ├── dto/
│   │   │   ├── upload-file.dto.ts
│   │   │   ├── direct-upload.dto.ts
│   │   │   └── chunk-upload.dto.ts
│   │   ├── services/
│   │   │   └── chunk-upload-session.service.ts
│   │   └── interfaces/
│   │       └── storage.interface.ts
│   │
│   ├── file-parser/                   # 文件解析模块
│   │   ├── file-parser.module.ts
│   │   ├── file-parser.service.ts
│   │   └── parsers/
│   │       ├── pdf.parser.ts
│   │       ├── docx.parser.ts
│   │       └── text.parser.ts
│   │
│   ├── audio/                         # 音频模块
│   │   ├── audio.module.ts
│   │   ├── transcription.service.ts
│   │   └── synthesis.service.ts
│   │
│   ├── queue/                         # 队列模块
│   │   ├── queue.module.ts
│   │   └── queue.service.ts
│   │
│   └── shared.module.ts               # 共享模块聚合
│
├── common/                            # 公共模块
│   ├── common.module.ts
│   │
│   ├── decorators/
│   │   ├── cache.decorator.ts
│   │   └── validate-file.decorator.ts
│   │
│   ├── filters/
│   │   ├── all-exceptions.filter.ts
│   │   └── http-exception.filter.ts
│   │
│   ├── guards/
│   │   ├── roles.guard.ts
│   │   └── admin.guard.ts
│   │
│   ├── interceptors/
│   │   └── monitoring.interceptor.ts
│   │
│   ├── middleware/
│   │   ├── performance.middleware.ts
│   │   └── request-logging.middleware.ts
│   │
│   ├── pipes/
│   │   └── validation.pipe.ts
│   │
│   ├── exceptions/
│   │   ├── app.exception.ts
│   │   ├── authentication.exception.ts
│   │   ├── authorization.exception.ts
│   │   ├── business-logic.exception.ts
│   │   ├── conflict.exception.ts
│   │   ├── external-service.exception.ts
│   │   ├── resource-not-found.exception.ts
│   │   ├── validation.exception.ts
│   │   └── error-codes.ts
│   │
│   ├── validators/
│   │   └── file-upload.validator.ts
│   │
│   └── utils/
│       ├── sanitizer.ts
│       └── query-optimizer.ts
│
├── config/                            # 配置
│   ├── config.module.ts
│   ├── ai.config.ts
│   ├── database.config.ts
│   └── performance.config.ts
│
├── health/                            # 健康检查
│   ├── health.module.ts
│   └── health.controller.ts
│
├── monitoring/                        # 监控
│   ├── monitoring.module.ts
│   ├── monitoring.service.ts
│   ├── monitoring.filter.ts
│   ├── monitoring.guard.ts
│   ├── monitoring.interceptor.ts
│   ├── metrics.controller.ts
│   ├── metrics.service.ts
│   ├── alerting.controller.ts
│   ├── alerting.service.ts
│   └── otel.ts
│
├── logger/                            # 日志
│   ├── logger.module.ts
│   ├── logger.config.ts
│   └── error-logger.service.ts
│
├── tasks/                             # 定时任务
│   ├── tasks.module.ts
│   └── cleanup.task.ts
│
├── types/                             # 类型定义
│   ├── index.ts
│   ├── ai.ts
│   ├── resume.ts
│   ├── interview.ts
│   ├── job.ts
│   └── payment.ts
│
└── prisma/                            # Prisma配置
    ├── prisma.module.ts
    ├── schema.prisma
    ├── seed.ts
    ├── migrations/
    └── seeds/
```

---

## 四、模块依赖关系

### 4.1 依赖图

```
┌─────────────────────────────────────────────────────────────────┐
│                        AppModule                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   modules/ (功能模块)                    │    │
│  │                                                          │    │
│  │  Resume  Interview  Job  JobSearch  Agent  RAG  User    │    │
│  │  Auth    Payment    Chat Voice     Quota   Conversation │    │
│  │                                                          │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    shared/ (共享模块)                    │    │
│  │                                                          │    │
│  │  AI    AIProvider    Database    Cache    Storage       │    │
│  │  FileParser    Audio    Queue                            │    │
│  │                                                          │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     common/ (公共模块)                   │    │
│  │                                                          │    │
│  │  Decorators  Filters  Guards  Interceptors  Middleware  │    │
│  │  Pipes       Exceptions  Validators  Utils              │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     其他模块                             │    │
│  │                                                          │    │
│  │  Config    Health    Monitoring    Logger    Tasks      │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

依赖方向: modules → shared → common (单向，无循环)
```

### 4.2 模块导入示例

```typescript
// modules/resume/resume.module.ts
@Module({
  imports: [
    // Shared
    SharedModule.AI,
    SharedModule.Database,
    SharedModule.Cache,
    SharedModule.Storage,
    SharedModule.FileParser,

    // 其他功能模块
    AgentModule,
    RAGModule,
  ],
  controllers: [
    ResumeController,
    ResumeOptimizerController,
    PdfGenerationController,
    TemplatesController,
    MatchAnalysisController,
  ],
  providers: [
    ResumeService,
    ResumeOptimizerService,
    ResumeParserService,
    PdfGenerationService,
    MatchAnalysisService,
  ],
  exports: [ResumeService, ResumeParserService, ResumeOptimizerService],
})
export class ResumeModule {}
```

---

## 五、服务迁移映射

### 5.1 文件迁移

| 原路径                                         | 新路径                                      |
| ---------------------------------------------- | ------------------------------------------- |
| `resume/`                                      | `modules/resume/`                           |
| `interview/`                                   | `modules/interview/`                        |
| `job/`                                         | `modules/job/`                              |
| `job-search/`                                  | `modules/job-search/`                       |
| `agent/`                                       | `modules/agent/`                            |
| `user/`                                        | `modules/user/`                             |
| `auth/`                                        | `modules/auth/`                             |
| `account/`                                     | `modules/account/`                          |
| `payment/`                                     | `modules/payment/`                          |
| `chat/`                                        | `modules/chat/`                             |
| `voice/`                                       | `modules/voice/`                            |
| `quota/`                                       | `modules/quota/`                            |
| `conversation/`                                | `modules/conversation/`                     |
| `invitation/`                                  | `modules/invitation/`                       |
| `backup/`                                      | `modules/backup/`                           |
| `email/`                                       | `modules/email/`                            |
| `ai/`                                          | `shared/ai/`                                |
| `ai-providers/`                                | `shared/ai-provider/`                       |
| `prisma/`                                      | `shared/database/`                          |
| `redis/`                                       | `shared/cache/`                             |
| `storage/`                                     | `shared/storage/`                           |
| `skills/`                                      | `modules/agent/agents/` (合并)              |
| `agent/services/rag.service.ts`                | `modules/rag/rag.service.ts`                |
| `agent/services/embedding.service.ts`          | `modules/rag/embedding.service.ts`          |
| `agent/services/vector-db.service.ts`          | `modules/rag/vector-db.service.ts`          |
| `agent/services/document-processor.service.ts` | `modules/rag/document-processor.service.ts` |
| `agent/services/context-compressor.service.ts` | `modules/rag/context-compressor.service.ts` |

### 5.2 AIEngine 拆分

| 原方法                  | 新位置                | 新服务                 |
| ----------------------- | --------------------- | ---------------------- |
| `extractTextFromFile()` | `shared/file-parser/` | `FileParserService`    |
| `parseResumeContent()`  | `modules/resume/`     | `ResumeParserService`  |
| `parseJobDescription()` | `modules/job/`        | `JobParserService`     |
| `transcribeAudio()`     | `shared/audio/`       | `TranscriptionService` |
| `generateContent()`     | `shared/ai/`          | `AIEngineService`      |

---

## 六、重构步骤

### Phase 1: Shared 层重构 (1周) ✅ 已完成

- [x] 创建 `shared/` 目录结构
- [x] 迁移 `prisma/` → `shared/database/`
- [x] 迁移 `redis/` → `shared/cache/`
- [x] 创建 `shared/ai/` (基础结构)
- [x] 迁移 `storage/` → `shared/storage/`
- [x] 创建 `SharedModule`

### Phase 2: Common 层重构 (0.5周) ✅ 已完成

- [x] 整理 `common/` 目录
- [x] 创建 `common/guards/` 目录
- [x] 创建 `common/interceptors/` 目录
- [x] 创建 `common/pipes/` 目录
- [x] 更新 `CommonModule`

### Phase 3: 功能模块重构 (3周) 🔄 进行中

#### Week 1: Resume + Interview + Job ✅ 已完成

- [x] 迁移 `resume/` → `modules/resume/`
  - [x] resume.service.ts
  - [x] resume-optimizer.service.ts
  - [x] pdf-generation.service.ts
  - [x] match-analysis.service.ts
  - [x] 所有控制器和 DTO
- [x] 迁移 `interview/` → `modules/interview/`
  - [x] interview.service.ts
  - [x] interview-session.service.ts
  - [x] question-generator.service.ts
  - [x] 所有控制器和 DTO
- [x] 迁移 `job/` → `modules/job/`
  - [x] job.service.ts
  - [x] job.controller.ts
- [ ] 拆分 `AIEngine` 方法到各模块 (待完成)

#### Week 2: Agent + RAG + JobSearch 🔄 进行中

- [x] 迁移 `agent/` → `modules/agent/` (结构已创建)
  - [x] agent.module.ts
  - [x] services/index.ts
  - [x] tools/index.ts
  - [x] agents/index.ts
  - [x] controllers/index.ts
  - [x] workflows/index.ts
  - [x] team/index.ts
  - [ ] 实际服务文件迁移 (待完成)
- [ ] 创建 `modules/rag/` 并迁移 RAG 服务
- [ ] 迁移 `job-search/` → `modules/job-search/`
- [ ] 合并 `skills/` 到 `modules/agent/agents/`

#### Week 3: 其他功能模块

- [ ] 迁移 `user/` → `modules/user/`
- [ ] 迁移 `auth/` → `modules/auth/`
- [ ] 迁移 `chat/` → `modules/chat/`
- [ ] 迁移其他模块

### Phase 4: 清理与验证 (1周)

- [ ] 删除旧目录
- [ ] 更新所有导入路径
- [ ] 运行测试
- [ ] 修复类型错误
- [ ] 性能验证

---

## 七、风险评估与应对措施

### 7.1 技术风险

| 风险         | 可能性 | 影响 | 应对措施                                 |
| ------------ | ------ | ---- | ---------------------------------------- |
| 循环依赖     | 中     | 高   | 使用 `npm-run-all` 检测；重构为单向依赖  |
| 破坏现有功能 | 高     | 高   | 保留旧路径兼容；分批迁移；E2E 测试验证   |
| 类型错误     | 高     | 中   | 分阶段编译检查；修复所有 TS 错误后再合并 |
| 性能下降     | 低     | 高   | 性能基准测试；APM 监控                   |
| 迁移中断     | 中     | 高   | 文档化迁移步骤；回滚方案                 |

### 7.2 项目风险

| 风险     | 可能性 | 影响 | 应对措施                       |
| -------- | ------ | ---- | ------------------------------ |
| 时间延误 | 中     | 中   | 预留缓冲时间；优先完成核心模块 |
| 资源不足 | 低     | 中   | 明确里程碑；定期同步进度       |
| 需求变更 | 中     | 低   | 灵活设计；最小化改动           |

### 7.3 应急回滚方案

```bash
# 如需回滚，执行以下步骤：
1. git stash push -m "pre-refactor-backup"
2. git checkout main
3. # 开发新功能或修复问题
4. # 验证通过后
5. git stash pop
```

---

## 八、资源需求

### 8.1 人力资源

| 角色       | 数量 | 主要任务           |
| ---------- | ---- | ------------------ |
| 后端开发   | 2    | 模块迁移、测试     |
| 架构师     | 1    | 方案设计、代码审查 |
| 测试工程师 | 1    | E2E 测试编写       |

### 8.2 环境需求

| 环境   | 规格   | 用途               |
| ------ | ------ | ------------------ |
| 开发   | 4核8G  | 本地开发           |
| 测试   | 8核16G | CI/CD 自动化测试   |
| 预发布 | 8核16G | 集成测试、性能测试 |

### 8.3 工具/依赖

- Git (版本控制)
- Docker (容器化)
- Jest (单元测试)
- Playwright (E2E 测试)
- ESLint + Prettier (代码规范)
- Dependabot (依赖更新)

---

## 九、质量保障方案

### 9.1 代码规范

```bash
# 代码检查
npm run lint

# 类型检查
npx tsc --noEmit

# 格式化
npm run format
```

### 9.2 测试策略

| 测试类型 | 覆盖率目标 | 工具                |
| -------- | ---------- | ------------------- |
| 单元测试 | ≥80%       | Jest                |
| 集成测试 | ≥50%       | Jest + TestDatabase |
| E2E 测试 | 核心流程   | Playwright          |

### 9.3 CI/CD 流程

```
Pull Request → Lint → TypeCheck → UnitTest → Build → E2E → Deploy
     ↓           ↓         ↓          ↓         ↓      ↓
   必须通过   必须通过   必须通过   必须通过   必须通过 可选
```

### 9.4 监控与告警

- **APM**: OpenTelemetry + Grafana
- **日志**: Winston + ELK Stack
- **告警**: Sentry + Slack

---

## 十、验收标准

### 10.1 架构验收

| 标准       | 指标                | 验证方式     |
| ---------- | ------------------- | ------------ |
| 模块扁平化 | 功能模块独立        | 目录结构审查 |
| 共享模块   | 独立可复用          | 模块导出审查 |
| 无循环依赖 | 0 forwardRef        | 依赖图检查   |
| 服务数量   | 导出 ≤5 个服务/模块 | 代码审查     |

### 10.2 代码质量

| 标准       | 指标   | 验证方式            |
| ---------- | ------ | ------------------- |
| 测试覆盖率 | ≥80%   | `npm run test:cov`  |
| ESLint     | 0 错误 | `npm run lint`      |
| TypeScript | 0 错误 | `npx tsc --noEmit`  |
| 代码重复   | ≤3%    | `npm run dep-check` |

### 10.3 功能验收

| 标准       | 指标                | 验证方式           |
| ---------- | ------------------- | ------------------ |
| E2E 测试   | 100% 通过           | `npm run test:e2e` |
| API 兼容性 | 无破坏性变更        | 回归测试           |
| 性能       | 响应时间 P99 ≤500ms | APM 监控           |

### 10.4 运维验收

| 标准     | 指标     | 验证方式      |
| -------- | -------- | ------------- |
| 启动时间 | ≤30s     | 容器启动日志  |
| 内存使用 | ≤500MB   | 容器监控      |
| 健康检查 | 全部通过 | `GET /health` |

---

## 十一、时间规划

| 阶段      | 内容                 | 时间      | 里程碑    |
| --------- | -------------------- | --------- | --------- |
| Phase 1   | Shared 层重构        | 1周       | ✅ 完成   |
| Phase 2   | Common 层重构        | 0.5周     | ✅ 完成   |
| Phase 3.1 | Resume+Interview+Job | 1周       | ✅ 完成   |
| Phase 3.2 | Agent+RAG+JobSearch  | 1周       | 🔄 进行中 |
| Phase 3.3 | 其他功能模块         | 1周       | 待开始    |
| Phase 4   | 清理与验证           | 1周       | 待开始    |
| **总计**  |                      | **5.5周** |           |

---

## 十二、模块结构规范

### 12.1 功能模块标准结构

```
modules/
└── {module-name}/
    ├── {module-name}.module.ts      # 模块定义
    ├── {module-name}.service.ts     # 主服务
    ├── {module-name}.controller.ts  # 主控制器
    ├── {sub-service}.service.ts     # 子服务
    ├── {sub-service}.controller.ts  # 子控制器
    ├── dto/                         # 数据传输对象
    │   ├── create-{entity}.dto.ts
    │   └── update-{entity}.dto.ts
    └── interfaces/                  # 接口
        └── {module}.interface.ts
```

### 12.2 共享模块标准结构

```
shared/
└── {module-name}/
    ├── {module-name}.module.ts      # 模块定义
    ├── {module-name}.service.ts     # 服务
    ├── providers/                   # 提供者(如有)
    ├── dto/                         # DTO(如有)
    └── interfaces/                  # 接口(如有)
```

### 12.3 复杂模块结构

对于较复杂的模块（如 agent），可以添加子目录：

```
modules/
└── agent/
    ├── agent.module.ts
    ├── services/                    # 服务目录
    ├── agents/                      # Agent目录
    ├── tools/                       # 工具目录
    ├── team/                        # 团队目录
    ├── workflow/                    # 工作流目录
    ├── controllers/                 # 控制器目录
    ├── dto/
    └── interfaces/
```

---

## 十三、后续维护

### 13.1 新增模块指南

1. 创建 `modules/{module-name}/` 目录
2. 创建 `{module-name}.module.ts`
3. 导入依赖的 shared 模块
4. 导出服务供其他模块使用
5. 在 `app.module.ts` 中注册

### 13.2 更新依赖

当需要更新共享模块时：

1. 在 `shared/` 中进行修改
2. 运行测试确保兼容性
3. 发布新版本
4. 更新依赖模块

### 13.3 监控与优化

- 定期运行 `npm run dep-graph` 检查依赖
- 使用 `npm audit` 检查安全漏洞
- 定期更新依赖版本

---

**文档版本**: 1.0
**最后更新**: 2026-03-01
**维护人**: Backend Team
