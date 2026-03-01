# Payment 模块 (支付集成)

支付服务模块，支持 Stripe 和 Paddle 双渠道，提供统一的订阅管理接口。

## 目录结构

```
payment/
├── dto/                    # 数据传输对象
├── interfaces/             # 接口定义
│   └── payment-provider.interface.ts
├── providers/              # 支付提供商实现
│   ├── stripe-payment.provider.ts
│   └── paddle-payment.provider.ts
├── payment.controller.ts   # API 控制器
├── payment.module.ts       # 模块配置
└── payment.service.ts      # 核心服务
```

## 支持的功能

| 功能         | Stripe | Paddle |
| ------------ | ------ | ------ |
| 创建结账会话 | ✅     | ✅     |
| 订阅管理     | ✅     | ✅     |
| 取消订阅     | ✅     | ✅     |
| 升级/降级    | ✅     | ✅     |
| 退款处理     | ✅     | ✅     |
| 账单历史     | ✅     | ✅     |
| Webhook 处理 | ✅     | ✅     |

## API 端点

```
POST   /payment/checkout          # 创建结账会话
GET    /payment/subscription      # 获取当前订阅
DELETE /payment/subscription      # 取消订阅
PATCH  /payment/subscription      # 更新订阅
POST   /payment/refund            # 申请退款
GET    /payment/billing-history   # 账单历史
POST   /payment/webhook/stripe    # Stripe Webhook
POST   /payment/webhook/paddle    # Paddle Webhook
```

## 配置

```env
# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Paddle
PADDLE_VENDOR_ID=xxx
PADDLE_API_KEY=xxx
PADDLE_PUBLIC_KEY=xxx
```

## 使用示例

```typescript
import { PaymentService } from './payment.service';

// 创建结账会话
const session = await this.paymentService.createCheckoutSession(
  userId,
  'price_pro_monthly',
  'stripe'
);

// 获取订阅状态
const subscription = await this.paymentService.getUserSubscription(userId);

// 取消订阅
await this.paymentService.cancelSubscription(userId);
```

## 数据模型

用户订阅信息存储在 `User` 表中：

- `subscriptionProvider`: 'stripe' | 'paddle'
- `stripeCustomerId`: Stripe 客户ID
- `stripeSubscriptionId`: Stripe 订阅ID
- `subscriptionStatus`: 订阅状态

## Webhook 处理

系统自动处理以下 Webhook 事件：

- `checkout.session.completed` - 完成支付
- `customer.subscription.updated` - 订阅更新
- `customer.subscription.deleted` - 订阅取消
- `invoice.payment_failed` - 支付失败

## 事务控制

支付相关操作（如订阅更新、退款）均已实现事务控制，确保本地数据库更新与远程 API 调用的一致性。采用 "Remote Call -> Local Update" 策略，并在本地更新失败时进行补偿或记录。
