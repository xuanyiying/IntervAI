import { SubscriptionTier } from '@prisma/client';

export enum BillingPeriod {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum PaymentOrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CLOSED = 'CLOSED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentProviderName {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
}

export const PAYMENT_ORDER_EXPIRE_MINUTES = 15;

/**
 * 计划目录是服务端唯一价格事实来源：金额单位为分（CNY），
 * 前端只传 planId，禁止由客户端提交金额。
 */
export interface PaymentPlan {
  planId: string;
  tier: SubscriptionTier;
  period: BillingPeriod;
  amount: number;
  currency: 'CNY';
  title: string;
}

export const PAYMENT_PLANS: Record<string, PaymentPlan> = {
  pro_monthly: {
    planId: 'pro_monthly',
    tier: SubscriptionTier.PRO,
    period: BillingPeriod.MONTHLY,
    amount: 1900,
    currency: 'CNY',
    title: 'Pro 月度会员',
  },
  pro_yearly: {
    planId: 'pro_yearly',
    tier: SubscriptionTier.PRO,
    period: BillingPeriod.YEARLY,
    amount: 19000,
    currency: 'CNY',
    title: 'Pro 年度会员',
  },
  enterprise_monthly: {
    planId: 'enterprise_monthly',
    tier: SubscriptionTier.ENTERPRISE,
    period: BillingPeriod.MONTHLY,
    amount: 9900,
    currency: 'CNY',
    title: 'Enterprise 月度会员',
  },
  enterprise_yearly: {
    planId: 'enterprise_yearly',
    tier: SubscriptionTier.ENTERPRISE,
    period: BillingPeriod.YEARLY,
    amount: 99000,
    currency: 'CNY',
    title: 'Enterprise 年度会员',
  },
};

export function getPaymentPlan(planId: string): PaymentPlan | undefined {
  return PAYMENT_PLANS[planId];
}
