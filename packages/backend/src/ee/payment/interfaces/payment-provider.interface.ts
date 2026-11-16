import { SubscriptionStatus, BillingStatus } from '@/types';
import { PaymentProviderName } from '../constants/payment.constants';

export interface SubscriptionDetails {
  tier: import('@prisma/client').SubscriptionTier;
  expiresAt: Date | null;
  status?: SubscriptionStatus;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: Date;
}

export interface BillingRecord {
  id: string;
  amount: number;
  currency: string;
  status: BillingStatus;
  date: Date;
  pdfUrl: string;
}

export interface CreatePaymentInput {
  orderNo: string;
  amount: number;
  subject: string;
  notifyUrl: string;
  returnUrl: string;
  expiredAt: Date;
}

export interface CreatePaymentResult {
  payUrl?: string;
  codeUrl?: string;
}

export interface ChannelPaymentQuery {
  paid: boolean;
  channelTradeNo?: string;
}

export interface NotifyVerification {
  orderNo: string;
  channelTradeNo: string;
  paidAmount: number;
}

export interface RefundInput {
  orderNo: string;
  channelTradeNo: string;
  amount: number;
  total: number;
  reason?: string;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  isConfigured(): boolean;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyNotify(
    headers: Record<string, string | string[] | undefined>,
    rawBody: Buffer
  ): Promise<NotifyVerification>;
  queryOrder(orderNo: string): Promise<ChannelPaymentQuery>;
  refund(input: RefundInput): Promise<{ success: boolean; refundId?: string }>;
}
