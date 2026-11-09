# Frontend

React 18 SPA，包名 `@interview-ai/frontend`，通过 REST + Socket.IO 与后端通信。

## 技术栈

| 技术                     | 版本        |
| ------------------------ | ----------- |
| React / react-dom        | 18.x        |
| TypeScript               | 5.x         |
| Vite                     | 7.x         |
| Ant Design               | 6.x         |
| React Router             | 6.x         |
| Zustand                  | 4.x         |
| axios / socket.io-client | 1.x / 4.x   |
| i18next / react-i18next  | 25.x / 16.x |
| framer-motion            | 12.x        |
| Vitest                   | 4.x         |

## 目录结构

```
src/
├── components/        # 可复用 UI 组件（含 ResumeBuilder、MyResumes、各类卡片）
├── config/            # axios、主题、应用与 CDN 配置
├── ee/                # 商业版页面（定价、订阅等）
├── hooks/             # 自定义 hooks（useChatSocket、useInterviewSocket 等）
├── layouts/           # AppLayout、Sidebar
├── locales/           # zh-CN.json、en-US.json
├── pages/             # admin/、auth/、legal/、user/ 四类页面
├── router/            # createBrowserRouter 路由与权限控制
├── services/          # REST API 服务层
├── stores/            # Zustand stores
├── styles/、types/、utils/
└── vite.config.ts     # dev server、代理、Vitest 配置
```

`config/axios.ts` 使用 `VITE_API_BASE_URL || '/api/v1'` 作为 baseURL，自动注入 `auth_token` 与 `traceparent`，统一处理 401 / 403 / 429。

## 路由（与 `src/router/index.tsx` 一致）

| 分类                 | 路径                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 公开                 | `/login`、`/register`、`/oauth/callback`、`/verify-email`、`/forgot-password`、`/reset-password`、`/terms-of-service`、`/privacy-policy` |
| 主布局               | `/`（我的简历）、`/resumes`、`/resume-builder`、`/profile`、`/settings`、`/account/usage`、`/interview`、`/pitch-perfect`                |
| 管理员（需 `ADMIN`） | `/admin/prompts`、`/admin/models`、`/admin/users`                                                                                        |
| EE 条件路由          | `/pricing`、`/subscription`、`/account/subscription`、`/payment/success`、`/payment/cancel`                                              |

EE 路由由 `VITE_APP_EDITION !== 'oss'` 决定；后端 `APP_EDITION=oss` 时前端也应设置 `VITE_APP_EDITION=oss` 以隐藏订阅页面。

## 状态管理

`src/stores/`：`authStore`、`resumeStore`、`jobStore`、`optimizationStore`、`conversationStore`、`interviewStore`、`generateStore`、`uiStore`。

## 快速开始

```bash
# 在仓库根目录安装依赖，并复制环境变量
pnpm install
cp packages/frontend/.env.example packages/frontend/.env

# 开发（也可在 packages/frontend 内执行）
pnpm --filter @interview-ai/frontend start:dev   # 或 pnpm dev:frontend
pnpm --filter @interview-ai/frontend typecheck
pnpm --filter @interview-ai/frontend test
pnpm --filter @interview-ai/frontend test:coverage
pnpm --filter @interview-ai/frontend build
pnpm --filter @interview-ai/frontend preview
```

dev server 端口 5173，`/api` 与 `/socket.io` 代理到 `http://localhost:3001`（见 `vite.config.ts`）；若后端 `PORT` 不是 3001，需同步调整代理目标或设置 `VITE_API_BASE_URL`。

## 环境变量

`VITE_API_BASE_URL`、`VITE_BACKEND_URL`、`VITE_GOOGLE_OAUTH_ENABLED`、`VITE_GITHUB_OAUTH_ENABLED`、`VITE_APP_EDITION`、`VITE_APP_ID`、`VITE_OSS_PUBLIC_ENDPOINT`、`VITE_STRIPE_*`、`VITE_PADDLE_*`，以及 `VITE_CDN_URL`、`VITE_HTTP_TIMEOUT_MS` / `VITE_UPLOAD_TIMEOUT_MS` / `VITE_PARSE_TIMEOUT_MS`。完整示例见 `.env.example`；`.env.production` 中的支付值目前是占位符。

## 说明

- 国际化资源为 `src/locales/zh-CN.json`、`en-US.json`，入口 `src/i18n.ts`。
- `vite-plugin-pwa` 已安装，但 `vite.config.ts` 中明确为构建性能禁用，当前构建不产出 Service Worker。
- 项目根目录的 `intervai-mockup.html` 是静态界面效果图，不参与构建。

## 相关文档

- [系统架构](../../docs/architecture/system-architecture.md) · [环境配置指南](../../docs/guide/environment-setup.md) · [后端 README](../backend/README.md)
