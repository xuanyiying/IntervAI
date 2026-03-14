# Interview AI Backend

NestJS backend service for the Interview AI platform.

## 📁 项目结构

```
src/
├── common/             # 公共模块
│   ├── decorators/     # 自定义装饰器
│   ├── exceptions/     # 异常处理
│   ├── filters/        # 异常过滤器
│   ├── guards/         # 认证守卫
│   ├── interceptors/   # 拦截器
│   ├── middleware/     # 中间件
│   ├── pipes/          # 管道
│   └── utils/          # 工具函数
├── core/               # 核心业务模块
│   ├── account/        # 账户管理
│   ├── ai/             # AI 服务 & Skills 引擎
│   │   ├── providers/  # AI 提供商实现
│   │   ├── skills/     # Skills 引擎
│   │   ├── utils/      # 熔断器、限流器、用量追踪
│   │   ├── memory/     # 对话记忆
│   │   └── queue/      # 异步队列
│   ├── auth/           # 认证模块 (JWT/OAuth)
│   ├── backup/         # 备份服务
│   ├── chat/           # WebSocket 实时通信
│   ├── conversation/   # 对话管理
│   ├── health/         # 健康检查
│   ├── invitation/     # 邀请码管理
│   ├── payment/        # 支付集成 (Stripe/Paddle)
│   ├── quota/          # 配额管理
│   ├── storage/        # 文件存储 (S3/OSS/MinIO)
│   └── user/           # 用户管理
├── features/           # 功能模块
│   ├── interview/      # 面试模拟
│   ├── job/            # 职位管理
│   ├── job-search/     # 职位搜索自动化
│   ├── resume/         # 简历优化
│   └── tasks/          # 后台任务
└── e2e/                # 端到端测试
```

## 🤖 Skills 引擎

Skills 引擎是一个可插拔的 AI 能力扩展系统。

### 目录结构

```
packages/backend/
├── src/core/ai/skills/         # Skills 引擎
│   ├── skill.interface.ts      # 核心接口
│   ├── skill-registry.ts       # 注册与执行
│   ├── skill-loader.ts         # 从目录加载
│   ├── skill-markdown-parser.ts # Markdown 解析
│   └── skill-installer.service.ts # 远程安装
│
└── skills/                     # 具体 Skills
    ├── resume-analyzer.md      # 简历解析
    ├── jd-matcher.md           # JD 匹配
    ├── interview-prep.md       # 面试准备
    ├── job-scraper.md          # 职位抓取
    └── answer-evaluator.md     # 答案评估
```

### Skill 定义格式

```markdown
---
name: skill-name
version: 1.0.0
description: Skill description
author: Author Name
tags: [tag1, tag2]
inputs:
  inputName:
    type: string
    required: true
    description: Input description
outputs:
  type: object
---

# System Prompt

Your skill's prompt template goes here...
```

### 使用方式

```typescript
// 执行 Skill
const result = await aiService.executeSkill('resume-analyzer', {
  resumeText: '...',
  targetJob: 'Software Engineer'
}, userId);

// 获取所有 Skills
const skills = aiService.getSkills();
```

## 🗄️ 数据库模型

| 模型                                  | 说明       |
| ------------------------------------- | ---------- |
| `User`                                | 用户账户   |
| `Session`/`Account`                   | OAuth 会话 |
| `Resume`                              | 简历文件   |
| `Job`                                 | 职位信息   |
| `Optimization`                        | 优化结果   |
| `InterviewSession`/`InterviewMessage` | 面试模拟   |
| `Conversation`/`Message`              | 对话历史   |
| `ModelConfig`/`PromptTemplate`        | AI 配置    |
| `UsageRecord`/`PerformanceMetrics`    | 使用统计   |

## 🚀 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### 安装

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 初始化数据库
npx prisma generate
npx prisma migrate dev

# 启动开发服务
pnpm dev
```

### API 文档

启动后访问: <http://localhost:3000/api/docs>

## 🔧 核心模块说明

### AI Service (`core/ai/`)

统一 AI 调用入口，支持：

- **多模型提供商**: OpenAI, DeepSeek, Qwen, Gemini, Ollama, SiliconCloud
- **Skills 引擎**: 可插拔的 AI 能力扩展
- **熔断器**: 故障容错
- **限流器**: 请求速率控制
- **用量追踪**: 成本和用量监控

**关键文件**:

- `ai.service.ts` - 统一 AI 调用入口
- `providers/provider.ts` - 提供商抽象
- `skills/skill-registry.ts` - Skill 注册与执行
- `utils/circuit-breaker.ts` - 熔断器实现

### Skills Engine (`core/ai/skills/`)

可插拔的 AI 能力系统：

- `skill.interface.ts` - 核心接口定义
- `skill-registry.ts` - Skill 注册与执行
- `skill-loader.ts` - 从目录加载 Skills
- `skill-markdown-parser.ts` - 解析 Markdown 格式
- `skill-installer.service.ts` - 从远程安装 Skills

### Resume (`features/resume/`)

简历处理核心：

- 文件上传与解析 (PDF/DOCX)
- AI 内容分析 (通过 resume-analyzer skill)
- 版本控制
- 去重检测 (MD5)

### Interview (`features/interview/`)

AI 面试模拟：

- 问题生成 (通过 interview-prep skill)
- 实时对话
- 评分与反馈 (通过 answer-evaluator skill)

## 🧪 测试

```bash
# 单元测试
pnpm test

# 测试覆盖率
pnpm test:cov

# E2E 测试
pnpm test:e2e
```

E2E 测试文件位于 `src/e2e/`：

- `complete-flow.e2e.spec.ts` - 完整用户流程
- `interview-flow.e2e.spec.ts` - 面试模块
- `security-and-errors.e2e.spec.ts` - 安全测试

## 📊 监控

- **健康检查**: `GET /api/v1/health`
- **Prometheus 指标**: `/metrics`
- **Grafana 面板**: `grafana/` 目录

## 🔌 AI 提供商

| 提供商       | 模型                              |
| ------------ | --------------------------------- |
| OpenAI       | GPT-4o, GPT-4-turbo, GPT-3.5-turbo |
| DeepSeek     | deepseek-chat, deepseek-coder     |
| Qwen         | qwen-turbo, qwen-plus, qwen-max   |
| Gemini       | gemini-pro, gemini-1.5-pro        |
| Ollama       | 本地模型                          |
| SiliconCloud | 开源模型                          |

## 📖 更多文档

- [系统架构](../../docs/architecture/system-architecture.md)
- [API 规范](./docs/)
- [部署指南](../../deployment/README.md)
