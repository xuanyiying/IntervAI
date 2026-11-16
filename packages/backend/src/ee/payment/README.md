# Payment 模块（EE）

商业版支付集成，位于 `src/ee/payment/`，支持 **支付宝（电脑网站支付）** 与 **微信支付（Native 扫码）** 两条国内渠道，均为一次性收款模式：月付/年付按单笔订单收款，到期后用户手动续费（不依赖渠道的周期扣款/委托代扣签约）。`APP_EDITION=oss` 时 `app.module.ts` 不加载 `ee/` 模块，此时使用 `modules/payment` 的 OSS 桩实现，本模块不生效。

Stripe / Paddle 通道已于 2026-11 移除，相关用户字段、依赖与环境变量一并清理。

## 架构

```
payment/
├── adapters/                      # alipay-payment.provider.ts、wechat-payment.provider.ts
├── interfaces/                    # payment-provider.interface.ts（createPayment / verifyNotify / queryOrder / refund）
├── constants/                     # 计划目录（服务端唯一价格事实来源）与订单状态
├── controllers/payment.controller.ts
├── services/payment.service.ts
├── dto/
└── payment.module.ts
```

- 价格由 `constants/payment.constants.ts` 的 `PAYMENT_PLANS` 定义（单位：分，CNY），前端只传 `planId`，**金额不允许由客户端提交**。
- 订单落库于 `payment_orders` 表（`PaymentOrder` 模型），回调入账使用 `PENDING → PAID` 的 `updateMany` 抢占实现幂等。
- 支付成功后：延长 `subscriptionExpiresAt`（在未到期余额上叠加一个月/一年）、更新 `subscriptionTier` 与 `subscriptionProvider`，并写入 `subscription_events` 审计。

## API 端点

控制器前缀为 `payments`，实际路径带全局前缀 `/api/v1`：

```
GET  /api/v1/payments/plans                # 计划目录（公开）
POST /api/v1/payments/orders               # 创建支付订单（登录）
GET  /api/v1/payments/orders/:orderNo      # 查询订单状态（登录；含渠道侧兜底查询）
GET  /api/v1/payments/subscription         # 当前订阅
GET  /api/v1/payments/billing-history      # 账单历史（读取已支付/已退款订单）
POST /api/v1/payments/notify/alipay        # 支付宝异步通知（应答 success/fail 文本）
POST /api/v1/payments/notify/wechat        # 微信 APIv3 回调（应答 JSON SUCCESS/FAIL）
```

回调需要原始报文：`main.ts` 在 `bodyParser: false` 模式下通过 `verify` 回调将原始 body 写入 `req.rawBody`，微信验签依赖它，改动解析器时必须保留该行为。

## 渠道实现要点

- **支付宝**（官方 `alipay-sdk`）：`alipay.trade.page.pay` GET 跳转收银台；异步通知使用 SDK `checkNotifySign` 验签并校验 `app_id`、`trade_status`、金额（`total_amount` 元 → 分）。
- **微信**（手写 APIv3 客户端，axios + node:crypto）：请求用商户私钥 SHA256withRSA 签名；回调验签使用平台证书（`/v3/certificates` 拉取 + APIv3 密钥 AES-256-GCM 解密缓存），`TRANSACTION.SUCCESS` 事件解密 resource 后校验 `mchid`、`trade_state`、金额。

## 配置

```env
# 支付宝（密钥模式）
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=            # PKCS8 应用私钥
ALIPAY_ALIPAY_PUBLIC_KEY=      # 支付宝公钥
ALIPAY_GATEWAY=                # 可选，默认正式网关；沙箱见 .env.example

# 微信支付 APIv3
WECHAT_PAY_APP_ID=
WECHAT_PAY_MCH_ID=
WECHAT_PAY_SERIAL_NO=          # 商户 API 证书序列号
WECHAT_PAY_PRIVATE_KEY=        # apiclient_key.pem 内容或路径
WECHAT_PAY_APIV3_KEY=

PAYMENT_NOTIFY_BASE_URL=       # 回调公网基址，缺省 http://localhost:3000/api/v1
```

渠道未配置时 `isConfigured()` 为 false，创建订单会返回 400。前端无需支付密钥；定价展示与计划 ID 映射见 `packages/frontend/src/ee/pages/marketing/PricingPage.tsx`，支付宝为收银台跳转，微信用 antd `QRCode` 展示 `code_url` 并轮询订单状态。

## 当前限制

- 订阅取消（cancel-subscription）端点已随一次性收款模式移除；会员到期自动降级。
- 退款能力在 Provider 层实现（`alipay.trade.refund` / `/v3/refund/domestic/refunds`），尚未暴露管理端 API。
- 本地开发时支付宝/微信回调无法到达 localhost，可用 `getOrderStatus` 的渠道兜底查询验证支付结果。

## 相关文档

- [后端 README](../../../README.md) · [系统架构](../../../../../docs/architecture/system-architecture.md)
