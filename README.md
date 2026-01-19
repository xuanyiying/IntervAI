# 🚀 Interview AI | 智能求职辅助平台

<p align="center">
  <img src="https://raw.githubusercontent.com/yiying/ai-resume/main/docs/assets/logo.png" alt="Interview AI Logo" width="200"/>
</p>

<p align="center">
  <strong>基于大模型驱动的智能化面试准备与简历优化 SaaS 平台</strong>
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

---

## 📖 项目概述

**Interview AI** 致力于解决求职过程中的"信息差"与"准备不足"两大痛点。通过深度集成 LLM (GPT-4, DeepSeek, Qwen)，我们为用户提供全流程的智能化服务：从简历的深度解析与优化，到针对性的模拟面试演练，再到详细的面试复盘报告。

👉 **[查看完整功能特性 (Features)](./FEATURES.md)**
👉 **[查看项目路线图 (Roadmap)](./ROADMAP.md)**

---

## 📚 文档中心

### 🛠️ 快速上手
- **[环境配置与开发指南](./docs/guide/environment-setup.md)**: 本地开发环境搭建、依赖安装与启动命令。
- **[Agent 使用指南](./docs/guide/agent-user-guide.md)**: 面向最终用户的 AI Agent 功能使用说明。

### 🚢 部署与运维
- **[生产环境部署](./docs/guide/deployment.md)**: 生产环境部署方案 (Docker Compose)、SSL 配置与自动化脚本说明。
- **[Agent 部署指南](./docs/guide/agent-deployment.md)**: Agent 系统的独立部署与扩容策略。
- **[监控体系搭建](./docs/guide/monitoring.md)**: 基于 Prometheus + Grafana 的全链路监控配置。
- **[Agent 专项监控](./docs/guide/agent-monitoring.md)**: 针对 AI 交互与 Token 消耗的专项监控。
- **[安全指南](./docs/guide/security.md)**: 安全策略与最佳实践。

### 📐 架构与设计
- **[系统架构图](./docs/architecture/system-architecture.md)**: 宏观架构设计、技术栈选型与数据流向。
- **[业务流程设计](./docs/design/business-flow.md)**: 核心业务链路 (简历解析、模拟面试) 的时序与交互逻辑。
- **[商业模式与逻辑](./docs/design/business-model.md)**: Freemium 模式设计、配额管理与核心价值主张。

### 🔧 技术细节
- **[API 接口文档]**: 本地启动后访问 `http://localhost:3000/api/docs` 查看完整 Swagger 文档。
- **[Agent 设计](./docs/architecture/agent-design.md)**: AI Agent 的工作流编排与 RAG 实现细节。
- **[模拟面试模块](./docs/technical/interview-module.md)**: 面试会话管理、状态机与评分系统的技术实现。
- **[实现总结](./docs/architecture/implementation-summary.md)**: 关键功能点的代码实现摘要。

### 📊 项目报告
- **[优化完成报告 (2026-01-17)](./docs/reports/optimization-complete-2026-01-17.md)**: 最近一次系统优化的详细记录。
- **[优化实施细节](./docs/reports/optimization-implementation.md)**: 优化过程中的具体技术调整。

---

## 🛠️ 技术栈概览

- **Backend**: NestJS, TypeScript, PostgreSQL, Prisma, Redis, BullMQ
- **Frontend**: React 18, Vite, Ant Design 5, Zustand, TailwindCSS
- **AI / LLM**: LangChain, OpenAI API, Ollama (Local LLM)
- **DevOps**: Docker, Docker Compose, GitHub Actions

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！在贡献代码前，请确保阅读 [开发指南](./docs/guide/environment-setup.md)。

## 📄 开源协议

本项目采用 [MIT License](./LICENSE) 开源。
