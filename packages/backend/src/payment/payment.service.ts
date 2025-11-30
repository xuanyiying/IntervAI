import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { StripePaymentProvider } from './providers/stripe-payment.provider';
import { PaddlePaymentProvider } from './providers/paddle-payment.provider';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private stripeProvider: StripePaymentProvider,
    private paddleProvider: PaddlePaymentProvider,
    private prisma: PrismaService
  ) {}

  private getProvider(providerName: string = 'stripe'): PaymentProvider {
    if (providerName === 'paddle') {
      return this.paddleProvider;
    }
    return this.stripeProvider;
  }

  async createCheckoutSession(
    userId: string,
    priceId: string,
    providerName: 'stripe' | 'paddle' = 'stripe'
  ) {
    const provider = this.getProvider(providerName);
    return provider.createCheckoutSession(userId, priceId);
  }

  async getUserSubscription(userId: string) {
    // We need to check which provider has the active subscription
    // Or we can check the user record to see which provider is set
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // If user has a specific provider set for subscription, use it
    if (user.subscriptionProvider === 'paddle') {
      return this.paddleProvider.getUserSubscription(userId);
    } else if (
      user.subscriptionProvider === 'stripe' ||
      user.stripeSubscriptionId
    ) {
      return this.stripeProvider.getUserSubscription(userId);
    }

    // Default to checking both or just returning default (free)
    // If no active subscription, return default from Stripe provider (it handles defaults)
    return this.stripeProvider.getUserSubscription(userId);
  }

  async cancelSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (user.subscriptionProvider === 'paddle') {
      return this.paddleProvider.cancelSubscription(userId);
    } else {
      return this.stripeProvider.cancelSubscription(userId);
    }
  }

  async getBillingHistory(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    // Ideally we should aggregate history from both if user switched
    // For now, let's return history from the current provider or both
    const stripeHistory = await this.stripeProvider.getBillingHistory(userId);
    const paddleHistory = await this.paddleProvider.getBillingHistory(userId);

    return [...stripeHistory, ...paddleHistory].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  }

  async handleWebhook(
    signature: string,
    payload: any,
    providerName: 'stripe' | 'paddle'
  ) {
    const provider = this.getProvider(providerName);
    return provider.handleWebhook(signature, payload);
  }
}
