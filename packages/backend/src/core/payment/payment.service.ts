import { Injectable } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';

@Injectable()
export class PaymentService {
  async createCheckoutSession(
    _userId: string,
    _priceId: string,
    _provider: 'stripe' | 'paddle',
    _options?: { tier?: SubscriptionTier; metadata?: Record<string, any> }
  ): Promise<{ url: string }> {
    return { url: '/payment/success' };
  }

  async getUserSubscription(_userId: string): Promise<any> {
    return null;
  }

  async cancelSubscription(_userId: string): Promise<void> {}

  async getBillingHistory(_userId: string): Promise<any[]> {
    return [];
  }

  async handleWebhook(
    _signature: string,
    _payload: Buffer,
    _provider: 'stripe' | 'paddle'
  ): Promise<void> {}
}
