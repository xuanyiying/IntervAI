## 调整点（根据你最新反馈）
- **不展示存储占用**：`/account/usage` 页面不显示“存储已用/限额”，后端 `/api/v1/account/usage` 也不再返回 storage 统计字段。
- **前端新功能必须国际化**：菜单与两个新页面所有新增文案全部走 `t()`，并补齐 i18n 词条。

## 前端实现计划
1. **替换 pricing → account（带二级菜单）**
   - 在 [AppLayout.tsx:L76-L104](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/layouts/AppLayout.tsx#L76-L104) 将 `pricing` 替换为 `account`，并用 antd menu item 的 `children` 做二级菜单：
     - `account`（父项）
       - `subscription` → `navigate('/account/subscription')`
       - `usage` → `navigate('/account/usage')`
   - 触发方式：沿用头像下拉 `trigger={['click']}`，移动端点击同样可用。

2. **新增路由**（[router/index.tsx](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/router/index.tsx#L34-L238)）
   - 新增受保护路由：
     - `/account/subscription` → `AccountSubscriptionPage`
     - `/account/usage` → `AccountUsagePage`

3. **新增前端 service 与类型**
   - 新增 `account-service.ts`：
     - `getSubscription()` → `GET /account/subscription`
     - `getUsage(params?)` → `GET /account/usage?start&end`
   - 新增响应类型（或复用现有 types 目录结构）：确保字段可被页面严格类型化。

4. **/account/subscription 页面**
   - 内容（全部国际化）：
     - 当前计划：tier、状态、续费日期（currentPeriodEnd/expiresAt）、是否取消于期末
     - 订阅变更记录：升级/降级/取消（来自后端 subscriptionRecords）
     - 账单历史：来自后端 billingHistory
   - 复用策略：尽量复用现有 [SubscriptionManagementPage.tsx](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/pages/SubscriptionManagementPage.tsx#L1-L178) 的展示/交互（取消订阅、账单列表），再补一个“订阅记录”区块。

5. **/account/usage 页面（不含存储）**
   - 内容（全部国际化）：
     - 本计费周期 AI 使用：调用次数、成功/失败、token、成本、平均延迟
     - 配额使用：优化次数、PDF 次数（used/limit/resetAt）
     - 趋势图：用纯 SVG 折线/柱状（不引入新依赖），展示近 14/30 天 calls 或 cost

6. **国际化落地**
   - 为新增菜单与页面补齐 i18n keys（示例）：
     - `menu.account`, `menu.account_subscription`, `menu.account_usage`
     - `account.subscription.title`, `account.subscription.current_plan`, `account.subscription.records`, `account.subscription.billing_history`
     - `account.usage.title`, `account.usage.ai_usage`, `account.usage.quota`, `account.usage.trend`, `common.loading`, `common.retry`
   - 所有新文案禁止硬编码；允许 `t(key, fallback)` 作为兜底。

## 后端实现计划
1. **新增 AccountController（/api/v1/account）**
   - 新建 `AccountModule + AccountController + AccountService`
   - Controller：`@Controller('account')` + `@UseGuards(JwtAuthGuard)`，从 `req.user.id` 取当前用户（模式参考 [payment.controller.ts](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/payment/payment.controller.ts#L1-L109)）。

2. **实现 GET /api/v1/account/subscription**
   - 返回：
     - `current`：来自 `PaymentService.getUserSubscription`（[payment.service.ts:L33-L52](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/payment/payment.service.ts#L33-L52)）
     - `billingHistory`：来自 `PaymentService.getBillingHistory`（[payment.service.ts:L65-L77](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/payment/payment.service.ts#L65-L77)）
     - `subscriptionRecords`：来自新建的订阅历史表（见下一条）

3. **订阅历史数据模型（满足升级/降级/取消记录）**
   - Prisma 新增 `SubscriptionEvent/Record` 表：`userId/provider/tier/status/effectiveAt/expiresAt/action/metadata/createdAt...`
   - 在 webhook/取消/更新订阅等入口写入记录，保证“订阅记录功能”可追溯。
   - 同步修正：当前 Stripe `checkout.session.completed` 里硬编码把 tier 设为 `PRO`（[stripe-payment.provider.ts:L273-L281](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/payment/providers/stripe-payment.provider.ts#L273-L281)），会导致订阅记录不准确。实现时会一并改为：
     - 通过 checkout session metadata 或请求体传递 tier，并在 webhook 落库。

4. **实现 GET /api/v1/account/usage（不含存储）**
   - 默认周期：
     - 有订阅周期信息则按当前周期；否则默认最近 30 天
   - 返回：
     - `ai`：`UsageTrackerService.getUserUsageStats(userId, start, end)`（[usage-tracker.service.ts:L654-L717](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/ai-providers/tracking/usage-tracker.service.ts#L654-L717)）
     - `quota`：`QuotaService.getQuotaInfo(userId)`（[quota.service.ts:L216-L271](file:///Users/yiying/dev-app/ai-resume/packages/backend/src/quota/quota.service.ts#L216-L271)）
     - `dailySeries`：服务端按天聚合（用于前端趋势图）

## 错误处理与安全
- 所有 `/account/*` 端点均 `JwtAuthGuard`，只允许访问 `req.user.id` 的数据。
- 日期 query 参数做校验：非法返回 400。
- 前端使用 antd `Alert` 显示错误，并提供重试按钮。

## 验证方式
- 前端：`npm run typecheck`，并手测：头像菜单→Account→两个子页→数据渲染。
- 后端：为 AccountService/Controller 写单元测试（mock Prisma/PaymentService/UsageTrackerService/QuotaService），覆盖未登录 401、登录后仅本人数据。

## 你需要确认的点
- 工程既定前缀为 `/api/v1`，所以我将实现：
  - 后端：`GET /api/v1/account/subscription`、`GET /api/v1/account/usage`
  - 前端：请求路径写 `/account/...`（axios baseURL 会自动拼成 `/api/v1/...`）

确认后我就开始编码落地（前后端 + Prisma 迁移 + UI/国际化 + 端到端联调）。