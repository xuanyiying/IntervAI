import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { StripePaymentProvider } from './providers/stripe-payment.provider';
import { PaddlePaymentProvider } from './providers/paddle-payment.provider';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionTier } from '@prisma/client';

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
    providerName: 'stripe' | 'paddle' = 'stripe',
    options?: { tier?: SubscriptionTier }
  ) {
    const provider = this.getProvider(providerName);
    return provider.createCheckoutSession(userId, priceId, options);
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

  /**
   * Update subscription to a new plan
   */
  async updateSubscription(userId: string, newPriceId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const providerName = user.subscriptionProvider || 'stripe';
    const provider = this.getProvider(providerName);

    if (!provider.updateSubscription) {
      this.logger.warn(
        `updateSubscription not implemented for ${providerName}`
      );
      throw new BadRequestException(
        `Subscription update not supported for ${providerName}`
      );
    }

    // Use transaction to ensure data consistency if we were updating local state here directly
    // Ideally, we wait for webhook to update local state, but we might want to log the attempt
    return this.prisma.$transaction(async (tx) => {
      // 1. Call provider to update subscription
      const result = await provider.updateSubscription!(userId, newPriceId);

      // 2. Optimistically update local state or log the action
      // We don't update subscriptionTier immediately, we let webhook handle it for source of truth
      // But we can log an event
      await tx.user.update({
        where: { id: userId },
        data: {
          // Optional: You might want to set a flag like 'subscriptionUpdatePending'
        },
      });

      this.logger.log(`Subscription update initiated for user ${userId}`);
      return result;
    });
  }

  /**
   * Process a refund for a transaction
   */
  async processRefund(userId: string, transactionId: string, amount?: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const providerName = user.subscriptionProvider || 'stripe';
    const provider = this.getProvider(providerName);

    if (!provider.processRefund) {
      this.logger.warn(`processRefund not implemented for ${providerName}`);
      throw new BadRequestException(
        `Refund processing not supported for ${providerName}`
      );
    }

    this.logger.log(
      `Processing refund for user ${userId}, transaction ${transactionId}`
    );

    return this.prisma.$transaction(async (_tx) => {
      const result = await provider.processRefund!(
        userId,
        transactionId,
        amount
      );

      // Log the refund action securely
      // In a real app, you would have a Refund or Transaction table to update
      // For now, we assume this is sufficient validation that the DB is alive before calling external
      // or we can update user status if full refund implies cancellation

      return result;
    });
  }

  /**
   * Get user's saved payment methods
   */
  async getPaymentMethods(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const providerName = user.subscriptionProvider || 'stripe';
    const provider = this.getProvider(providerName);

    if (!provider.getPaymentMethods) {
      this.logger.debug(
        `getPaymentMethods not implemented for ${providerName}`
      );
      return [];
    }

    return provider.getPaymentMethods(userId);
  }
}
