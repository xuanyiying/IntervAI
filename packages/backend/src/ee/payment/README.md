# Payment 模块（EE）

商业版支付集成，位于 `src/ee/payment/`，支持 Stripe 与 Paddle 两个 provider。`APP_EDITION=oss` 时 `app.module.ts` 不加载 `ee/` 模块，此时使用 `modules/payment` 的 OSS 实现，本模块不生效。

## 目录结构

```
payment/
├── providers/                   # stripe-payment.provider.ts、paddle-payment.provider.ts
├── interfaces/                  # payment-provider.interface.ts
├── dto/
├── payment.controller.ts
├── payment.service.ts
└── payment.module.ts
```

## API 端点

控制器前缀为 `payments`，实际路径带全局前缀 `/api/v1`：

```
POST /api/v1/payments/create-checkout-session   # 创建结账会话
GET  /api/v1/payments/subscription             # 当前订阅
POST /api/v1/payments/cancel-subscription      # 取消订阅
GET  /api/v1/payments/billing-history          # 账单历史
POST /api/v1/payments/webhook                  # Stripe Webhook
POST /api/v1/payments/webhook/paddle           # Paddle Webhook
```

前端定价与订阅页面在 `packages/frontend/src/ee/`，由 `VITE_APP_EDITION` 控制是否注册路由。

## 配置

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
PADDLE_API_KEY=...
PADDLE_WEBHOOK_SECRET=...
```

前端对应 `VITE_STRIPE_PUBLISHABLE_KEY`、`VITE_STRIPE_PRICE_*`、`VITE_PADDLE_CLIENT_TOKEN`、`VITE_PADDLE_PRICE_*`（示例值目前是占位符）。

## 当前限制

- `payment.service.ts` 中 `updateSubscription`、`processRefund`、`getPaymentMethods` 对部分 provider 明确抛出 `not implemented`；账单 / 退款能力尚未完整。
- 订阅状态变更写入 `SubscriptionEvent` 等 Prisma 模型，Webhook 需正确配置签名校验密钥。
- 请勿按旧文档描述认定所有操作都已实现事务补偿。

## 相关文档

- [后端 README](../../../README.md) · [系统架构](../../../../../docs/architecture/system-architecture.md)
