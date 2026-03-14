此任务不涉及创建或新增技能，暂无可用技能适配，直接提交完整实施方案供确认。

# 总体目标
- 前端在大列表与流式场景下显著降本增效，稳定 60 FPS、降低内存占用与重绘；页面可维护性提升。
- 后端在 AI 调用、WebSocket、队列与数据库查询上降低 P95/P99 时延、提升吞吐与可扩展性。
- 建立端到端可观测性（日志+指标+分布式追踪），并改善安全治理与配置管理。
- 将测试覆盖率后端提升至 ≥70%，前端至 ≥60%，新增关键 E2E 流程测试。

# 前端性能与可维护性
1) Chat 列表虚拟化与滚动策略
- 引入虚拟列表库（react-virtual / rc-virtual-list），仅渲染视区附近消息项。
- 限定“滚动到底部”触发条件：仅在新增尾部消息或流式分片时触发；加载历史不强制滚动。
- 参考当前实现：简单列表渲染与强制滚动 [ChatList.tsx](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/pages/ChatPage/components/ChatList.tsx#L36-L45) 与 [L94-L148](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/pages/ChatPage/components/ChatList.tsx#L94-L148)。

2) ChatPage 拆分与状态优化
- 进一步下沉业务逻辑至 hooks/services，减少页面体积与重绘；现有 hooks 已具雏形 [useChatItems.ts](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/pages/ChatPage/hooks/useChatItems.ts), [useResumeUpload.ts](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/pages/ChatPage/hooks/useResumeUpload.ts)。
- 对 MessageContent 进行 memo，延迟重型内容（Markdown/附件）解析。
- 使用选择器从 Zustand store 读取，避免无关状态变更触发全量重渲染。
- 目标文件：页面入口现有 376 行 [ChatPage/index.tsx](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/pages/ChatPage/index.tsx)。

3) 网络与流式性能
- 限制 WebSocket 客户端事件频率，合并分片更新；合理设置 debounce 与 requestAnimationFrame 批次渲染。
- Axios/上传操作超时改为运行时可配置，替代硬编码 120s [axios.ts](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/config/axios.ts#L5-L11)。

# 后端性能与可扩展性
1) WebSocket 横向扩展
- 将默认 IoAdapter 替换为 Redis 适配器，确保多实例下房间与广播一致；现状仅默认适配 [main.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/main.ts#L16-L22)。
- 负载均衡层启用黏性会话（Nginx/Ingress）；前端代理已转发 /socket.io。

2) 队列并发与限速治理
- 为 ai-processing 处理器设置并发（如 concurrency=4~8），并按峰值调整 limiter（当前 10/min）[ai-queue.module.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/ai/queue/ai-queue.module.ts#L11-L16), [ai-queue.processor.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/ai/queue/ai-queue.processor.ts#L21-L139)。
- 写入/批处理路径使用 createMany，替代循环逐条写 [interview-question.service.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/interview/services/interview-question.service.ts#L77-L92)。

3) 限流分组与配额
- 将昂贵端点归为“AI 分组”，施加更严限流（ThrottlerGuard + named groups），区分免费/订阅等级。
- 端点参考：AI 调用与面试生成 [ai.controller.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/ai-providers/ai.controller.ts#L40-L79), [interview.controller.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/interview/interview.controller.ts#L43-L72#L111-L142)。

4) Agent/工作流性能
- 利用缓存命中与降级策略，完善 LCELWorkflow 的流式与链式执行，增加粒度监控；关键逻辑见 [lcel-workflow.orchestrator.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/agent/workflows/lcel-workflow.orchestrator.ts#L37-L106#L167-L274)。

# 数据库查询与索引优化
1) 复合索引补齐（优先）
- 针对 where userId + orderBy 时间 的列表端点补充复合索引：Resume/Job/Optimization/GeneratedPDF/InterviewSession/Conversation 等。
- 示例：Conversation 新增 @@index([userId, lastMessageAt])；Optimization 新增 @@index([userId, createdAt])。
- 参考查询使用点：[user.service.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/user/user.service.ts#L211-L306), [resume-optimizer.service.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/resume/services/resume-optimizer.service.ts#L262-L269)。

2) 模糊搜索索引
- User 的 email/username 模糊搜索使用 GIN + pg_trgm 原生索引；Prisma Migrate 中加入 SQL 迁移。
- 管理端查询参考：[admin.controller.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/user/admin.controller.ts#L53-L85)。

3) 批量写入与清理任务
- 批量写入使用 createMany；清理任务保持异步后台执行，避免用户请求路径线性增长 [storage.service.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/storage/storage.service.ts#L390-L419)。

# 可观测性与分布式追踪
1) OpenTelemetry 引入
- 后端接入 OTel SDK，启用 HTTP/Nest、Prisma、Redis、Bull、Socket.IO 自动注入。
- 导出到 OTLP（Tempo/Jaeger）并在 Grafana 关联；当前无 OTel 代码 [综述](file:///Users/yiying/dev-app/ai-resume/docs/review/03_performance_and_quality.md#L58-L65)。
- 与现有 Sentry、Prometheus、Winston 共存：Sentry 继续负责错误告警；Prometheus 暴露指标；Winston 结构化日志。
- 现有监控框架参考：[monitoring.interceptor.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/monitoring/monitoring.interceptor.ts), [metrics.service.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/monitoring/metrics.service.ts), [main.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/main.ts#L14-L66)。

2) 端到端关联
- 前端在请求头携带 W3C traceparent；后端提取并继续链路，WebSocket 握手亦附带。
- 为关键业务（上传→解析→优化→会话推送）补充自定义 span 与属性。

# 安全与隐私
1) 对象存储加密
- 在 S3/OSS PutObject 显式启用服务端加密（SSE/SSE-KMS），避免仅依赖桶默认加密；现状未设置 [aws-s3.provider.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/storage/providers/aws-s3.provider.ts#L54-L85)。
- MinIO 移除公共读策略，统一私有桶 + 预签名访问；现状存在公共策略 [minio.provider.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/storage/providers/minio.provider.ts#L99-L185)。

2) 数据库加密
- 保持传输层 TLS 与 pg_hba 限制；静态加密由基础设施（加密卷/RDS）提供 [postgresql.conf](file:///Users/yiying/dev-app/ai-resume/deployment/config/postgres/postgresql.conf#L86-L95), [pg_hba.conf](file:///Users/yiying/dev-app/ai-resume/deployment/config/postgres/pg_hba.conf#L1-L25)。
- 应用层敏感字段继续使用 AES-256-GCM 加密（已实现）[encryption.service.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/ai-providers/utils/encryption.service.ts#L1-L20)。

# 质量保障与测试
1) 后端 E2E 场景补齐
- 上传→解析→优化→消息推送的全链路 E2E 测试（含队列与 WebSocket 流）。
- 现有 E2E 位置与运行：[e2e/complete-flow.e2e.spec.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/e2e/complete-flow.e2e.spec.ts), [README](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/e2e/README.md#L98-L116)。

2) 前端交互测试
- Chat 流式与上传交互的组件测试与页面测试，模拟 WebSocket 事件与流式分片；Vitest 现已配置 [vite.config.ts](file:///Users/yiying/dev-app/ai-resume/packages/frontend/vite.config.ts#L99-L120)。

3) 覆盖率目标
- 后端 ≥70%，前端 ≥60%；在 CI 中启用覆盖率门槛与报告上传。

# 静态分析与类型安全
- 后端恢复 noImplicitAny=true，逐步消减 any 热点；优先核心服务与控制器（如 ai.controller、conversation.service）[静态现状](file:///Users/yiying/dev-app/ai-resume/packages/backend/tsconfig.json#L3-L27)。
- ESLint 对 any 升级为 error（后端），前端维持适度宽松但关键模块禁用 any。
- DTO/响应类型完善与 Zod/类验证统一，减少隐式 any 与运行期风险。

# 配置治理与硬编码消解
- 将 AI 超时/重试与监控阈值统一移入 ConfigService，环境变量驱动；前端通过 VITE_* 或运行时配置端点获取。
- 提示词模板仅走 DB，禁用源码 fallback；保留种子脚本 [seed-prompts.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/prisma/seeds/seed-prompts.ts)。

# 实施顺序与验证
1) 快速收益（Week 1）
- Chat 虚拟化与滚动修复；Axios/上传超时改配置。
- 队列并发与 limiter 调整；部分 createMany 改造。
- 索引第一批：userId+时间复合索引（Resume/Job/Optimization/GeneratedPDF/InterviewSession/Conversation）。

2) 稳定扩展（Week 2）
- Redis WebSocket 适配器；Throttler 分组与配额；OTel 基础接入。
- S3/OSS 显式 SSE；MinIO 公共读移除。

3) 质量完善（Week 3）
- E2E 与交互测试补齐，覆盖达标；后端 noImplicitAny 逐步恢复；静态规则强化。

4) 验证与回归
- 指标：Prometheus P95/P99、QPS、错误率对比；追踪：OTel 跨服务 span 完整性；日志：慢请求与异常下降。
- 数据库：EXPLAIN ANALYZE 验证索引命中；观察 CPU/IO。

# 风险与回滚
- 虚拟列表与滚动：在特性开关下灰度；异常时回退简单列表。
- Redis 适配器：保持默认 IoAdapter 可回退；负载均衡黏性问题通过配置验证。
- 索引迁移：使用并发安全的 CONCURRENTLY 建索；必要时临时关闭写入热点后迁移。
- OTel：在独立环境试运行，导出到独立后端（Tempo/Jaeger）避免影响生产。

确认后我将分批提交改动与测试，所有变更均附带度量与回归验证，确保性能与质量指标按目标达成。