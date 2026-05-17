<p align="center">
  <img src="./docs/assets/brand/interview-ai-logo-256.png" alt="Interview AI Logo" width="180"/>
</p>

<p align="center">
  <strong>基于大模型驱动的智能化面试准备与简历优化平台</strong>
</p>

<p align="center">
  <a href="https://github.com/yiying/ai-resume/actions/workflows/ci.yml">
    <img src="https://github.com/yiying/ai-resume/actions/workflows/ci.yml/badge.svg" alt="Build Status"/>
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/>
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node.js Version"/>
  </a>
</p>

<p align="center">
  <a href="#zh-cn">简体中文</a> · <a href="#en">English</a>
</p>

<a id="zh-cn"></a>

## 简体中文

### 项目简介

Interview AI 是一站式智能求职辅助平台，聚焦简历优化与模拟面试闭环。系统通过多模型协作、结构化评估与可视化反馈，帮助候选人快速识别差距、提升表达质量并完成投递准备。

### 功能特性

- 简历解析、结构化评估与高质量改写建议
- 面试模拟与问题生成，支持实时反馈与评分
- 多模型与多云存储支持（OpenAI、DeepSeek、Qwen、AWS/OSS/MinIO）
- 实时会话与版本追踪，支持 PDF 导出与对比
- 完整的监控、告警与审计日志体系

### 界面预览

项目运行后的实际效果图包含以下页面：

| 分类 | 页面 | 说明 |
|------|------|------|
| **认证模块** | 登录页、注册页 | 用户身份验证 |
| **核心功能** | 主页/对话、我的简历、简历构建器 | 简历管理与优化 |
| **面试准备** | AI 面试精灵、模拟面试、履历点睛、面试预测 | 全方位面试准备 |
| **用户中心** | 个人中心、设置、使用量、团队、Agent 指标 | 用户管理 |
| **管理后台** | 用户管理、模型管理、提示词管理、知识库、系统设置 | 管理员功能 |

**查看效果图：**

```bash
# 直接打开效果图预览文件
open intervai-mockup.html
```

或访问项目预览：`intervai-mockup.html`（项目根目录下）

### 安装指南

1. 安装依赖

```bash
pnpm install
```

2. 配置环境变量

```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

3. 生成 Prisma 客户端并迁移数据库

```bash
pnpm --filter @interview-ai/backend prisma:generate
pnpm --filter @interview-ai/backend prisma:migrate
```

### 使用说明

```bash
pnpm dev
```

- 前端: http://localhost:5173
- 后端: http://localhost:3000
- Swagger: http://localhost:3000/api/docs

生产构建：

```bash
pnpm build:backend
pnpm build:frontend
```

### 贡献指南

欢迎提交 Issue 与 Pull Request。请先阅读 [环境配置与开发指南](./docs/guide/environment-setup.md)。

### 许可证信息

本项目采用 [MIT License](./LICENSE) 开源。

<a id="en"></a>

## English

### Project Overview

Interview AI is an end-to-end career acceleration platform focused on resume optimization and interview readiness. It combines multi-model reasoning, structured evaluation, and actionable feedback to help candidates identify gaps, improve storytelling, and deliver stronger applications.

### Features

- Resume parsing, scoring, and rewrite guidance
- Interview simulation with question generation and real-time feedback
- Multi-provider AI and multi-cloud storage support
- Conversation history, versioning, and PDF export
- Full observability stack with metrics, alerts, and audit logs

### Installation

1. Install dependencies

```bash
pnpm install
```

2. Configure environment variables

```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

3. Generate Prisma client and run migrations

```bash
pnpm --filter @interview-ai/backend prisma:generate
pnpm --filter @interview-ai/backend prisma:migrate
```

### Usage

```bash
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/api/docs

Production build:

```bash
pnpm build:backend
pnpm build:frontend
```

### Contributing

Issues and pull requests are welcome. Please read the [environment setup guide](./docs/guide/environment-setup.md) first.

### License

Licensed under the [MIT License](./LICENSE).
