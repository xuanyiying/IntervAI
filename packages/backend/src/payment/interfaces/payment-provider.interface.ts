import { SubscriptionTier } from '@prisma/client';
import Stripe from 'stripe';

export interface SubscriptionDetails {
  tier: SubscriptionTier;
  expiresAt: Date | null;
  status?: Stripe.Subscription.Status | string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: Date;
}

export interface BillingRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: Date;
  pdfUrl: string;
}

export interface PaymentProvider {
  createCheckoutSession(
    userId: string,
    priceId: string
  ): Promise<{ url?: string; transactionId?: string }>;
  handleWebhook(signature: string, payload: Buffer | any): Promise<void>;
  getUserSubscription(userId: string): Promise<SubscriptionDetails>;
  cancelSubscription(userId: string): Promise<any>;
  getBillingHistory(userId: string): Promise<BillingRecord[]>;
}
