import { BillingRecord, SubscriptionDetails } from './payment-service';
import { SubscriptionTier, SubscriptionStatus } from '../types';
import axios from '../config/axios';

export type SubscriptionAction =
  | 'create'
  | 'renew'
  | 'upgrade'
  | 'downgrade'
  | 'cancel';

export interface SubscriptionRecord {
  id: string;
  provider: 'stripe' | 'paddle' | 'manual';
  externalSubscriptionId?: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  action: SubscriptionAction;
  effectiveAt: string;
  expiresAt?: string | null;
  createdAt: string;
}

export interface AccountSubscriptionResponse {
  current: SubscriptionDetails | null;
  subscriptionRecords: SubscriptionRecord[];
  billingHistory: BillingRecord[];
}

export interface UsagePeriod {
  start: string;
  end: string;
}

export interface AiUsageSummary {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  averageLatency: number;
}

export interface QuotaSummary {
  tier: SubscriptionTier;
  optimizationsUsed: number;
  optimizationsLimit: number;
  optimizationsResetAt: string;
  pdfGenerationsUsed: number;
  pdfGenerationsLimit: number;
  pdfGenerationsResetAt: string;
  canOptimize: boolean;
  canGeneratePdf: boolean;
}

export interface DailyUsagePoint {
  date: string;
  totalCalls: number;
  totalCost: number;
}

export interface AccountUsageResponse {
  period: UsagePeriod;
  ai: AiUsageSummary;
  quota: QuotaSummary;
  dailySeries: DailyUsagePoint[];
}

export const accountService = {
  getSubscription: async (): Promise<AccountSubscriptionResponse> => {
    const response = await axios.get('/account/subscription');
    return response.data;
  },
  getUsage: async (params?: {
    start?: string;
    end?: string;
  }): Promise<AccountUsageResponse> => {
    const response = await axios.get('/account/usage', { params });
    return response.data;
  },
};

