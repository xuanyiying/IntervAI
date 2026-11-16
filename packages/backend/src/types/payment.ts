/**
 * Payment related types
 */

/**
 * 订阅状态（与支付宝 / 微信订单及订阅事件记录对齐）
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED',
  TRIALING = 'TRIALING',
  UNPAID = 'UNPAID',
}

/**
 * Status of a billing record (invoice)
 */
export enum BillingStatus {
  PAID = 'PAID',
  OPEN = 'OPEN',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE',
  DRAFT = 'DRAFT',
}
