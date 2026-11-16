import {
  SubscriptionTier,
  SubscriptionStatus,
  BillingStatus,
} from '@/shared/types';
import axios from '@/shared/lib/axios';

export type PaymentChannel = 'alipay' | 'wechat';

export interface PaymentPlan {
  planId: string;
  tier: SubscriptionTier;
  period: 'MONTHLY' | 'YEARLY';
  amount: number;
  currency: 'CNY';
  title: string;
}

export interface SubscriptionDetails {
  tier: SubscriptionTier;
  status?: SubscriptionStatus;
  expiresAt?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string;
}

export interface BillingRecord {
  id: string;
  amount: number;
  currency: string;
  status: BillingStatus;
  date: string;
  pdfUrl: string;
}

export interface CreateOrderResult {
  orderNo: string;
  provider: PaymentChannel;
  planId: string;
  tier: SubscriptionTier;
  amount: number;
  currency: string;
  expiredAt: string;
  payUrl?: string;
  codeUrl?: string;
}

export interface OrderStatusResult {
  orderNo: string;
  provider: PaymentChannel;
  planId: string;
  tier: SubscriptionTier;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'CLOSED' | 'REFUNDED';
  paidAt?: string;
  expiredAt?: string;
}

export const paymentService = {
  getPlans: async (): Promise<PaymentPlan[]> => {
    const response = await axios.get('/payments/plans');
    return response.data;
  },

  createOrder: async (
    planId: string,
    provider: PaymentChannel
  ): Promise<CreateOrderResult> => {
    const response = await axios.post('/payments/orders', {
      planId,
      provider,
    });
    return response.data;
  },

  getOrderStatus: async (orderNo: string): Promise<OrderStatusResult> => {
    const response = await axios.get(`/payments/orders/${orderNo}`);
    return response.data;
  },

  getUserSubscription: async (): Promise<SubscriptionDetails> => {
    const response = await axios.get('/payments/subscription');
    return response.data;
  },

  getBillingHistory: async (): Promise<BillingRecord[]> => {
    const response = await axios.get('/payments/billing-history');
    return response.data;
  },
};
