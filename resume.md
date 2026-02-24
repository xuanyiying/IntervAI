

## 版本一：全栈工程师方向

### **IntervAI - AI 智能求职辅助平台**

**项目角色**: 全栈开发工程师 (独立负责架构设计与核心开发)

**项目描述**:
从 0 到 1 构建一站式智能求职 SaaS 平台，集成简历优化与模拟面试功能。采用 Monorepo 架构，独立完成前后端架构设计、AI Agent 系统开发及生产环境部署。

**技术栈**:
`NestJS` `React 18` `TypeScript` `Prisma` `PostgreSQL` `Redis` `LangChain` `Docker` `Nginx`

**核心贡献**:

**后端架构**
- 设计并实现基于 LangChain 的多 Agent 协作系统，包含策略分析、角色扮演、表达优化三层 Agent 架构
- 构建多模型路由层，支持 OpenAI/DeepSeek/Qwen 动态切换与降级策略，API 成本降低 70%
- 基于 BullMQ + Redis 实现异步任务队列，AI 密集型任务解耦处理，API 响应时间降低 60%
- 实现检索增强生成 (RAG) 系统，结合 pgvector 向量数据库提供语义搜索能力

**前端开发**
- 基于 React 18 + Zustand 构建响应式 SPA，实现简历可视化编辑器与实时面试对话界面
- 集成 WebSocket 实现实时通信，支持语音/文字双模态交互
- 配置 Vite 构建优化，代码分割 + Tree Shaking，首屏加载时间 < 2s

**工程化与部署**
- 搭建完整 CI/CD 流程，实现一键部署与数据库热备份恢复
- 配置 Prometheus + Grafana + Sentry 监控告警体系，生产环境综合评分 88/100
- 实现 JWT + OAuth 双重认证、RBAC 权限控制、API 密钥加密存储

**量化成果**:
- 测试覆盖 1656+ 用例，核心模块覆盖率 100%
- 缓存命中率 85%+，系统支持水平扩展
- 完整安全防护体系，通过 XSS/SQL 注入/文件上传安全检测

---

## 版本二：后端工程师方向

### **IntervAI - AI 智能求职辅助平台后端系统**

**项目角色**: 后端开发工程师 (负责核心架构设计与开发)

**项目描述**:
设计并实现 AI 驱动的智能求职平台后端系统，聚焦多 Agent 协作、LLM 集成、高并发处理与企业级安全架构。

**技术栈**:
`NestJS` `TypeScript` `Prisma` `PostgreSQL` `Redis` `BullMQ` `LangChain` `ChromaDB` `Docker`

**核心职责与成果**:

**AI Agent 系统架构**
- 设计三层 Agent 协作架构：StrategistAgent (策略分析) → RolePlayAgent (角色扮演) → PitchPerfectAgent (表达优化)
- 基于 LangChain LCEL 构建工作流编排器，支持顺序/并行/条件执行模式，实现复杂 AI 任务编排
- 开发自愈式 JSON 修复逻辑 + Zod Schema 校验，解决 LLM 输出不稳定问题，数据结构准确率 100%

**多模型集成与成本优化**
- 构建统一 AI Provider 抽象层，支持 OpenAI/Gemini/DeepSeek/Qwen/Ollama 多模型无缝切换
- 实现分层模型策略 (成本优化/质量优化) + Redis 多级缓存，API 调用成本降低 70%
- 开发 Token 使用追踪与配额管理系统，支持按小时/按月混合限流策略

**高并发与性能优化**
- 基于 BullMQ + Redis 实现异步任务队列，AI 密集型任务 (简历解析/优化) 后台处理，API 响应时间降低 60%
- 设计分层缓存体系 (Redis 300-3600s TTL + Nginx 静态缓存)，缓存命中率 85%+
- 配置数据库连接池优化、慢查询监控 (1s 阈值)、核心表索引全覆盖

**RAG 检索增强系统**
- 集成 ChromaDB/pgvector 向量数据库，实现简历与 JD 语义相似度匹配
- 开发 Embedding 服务 + 文档处理管道，支持知识库检索增强生成
- 实现上下文压缩服务，减少 Token 消耗 40%

**安全与合规**
- 实现 JWT 无状态认证 + OAuth (Google/GitHub) 集成
- 部署 RBAC 角色权限控制，API 密钥 AES-256-GCM 加密存储
- 配置全局输入验证、XSS/SQL 注入防护、文件上传安全校验、请求速率限制

**工程化实践**:
- 编写单元测试 + 集成测试 + E2E 测试，测试用例 1656+，核心模块覆盖率 100%
- 配置 OpenTelemetry 链路追踪 + Sentry 错误监控 + Prometheus 指标采集
- 生产环境评估综合得分 88/100，通过安全、性能、稳定性全维度验证

---

## 选择建议

| 岗位类型 | 推荐版本 | 突出重点 |
|---------|---------|---------|
| **全栈工程师** | 版本一 | 端到端交付能力、架构设计思维、前后端技术广度 |
| **后端工程师** | 版本二 | 系统架构深度、AI/LLM 集成经验、高并发处理能力 |
| **Node.js 工程师** | 版本二 | NestJS 框架熟练度、TypeScript 工程实践、微服务架构 |
| **AI 应用工程师** | 版本二 | LangChain 实战经验、Agent 系统设计、RAG 架构 |