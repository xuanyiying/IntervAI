import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentService } from '@/payment/payment.service';
import { QuotaService } from '@/quota/quota.service';
import { UsageTrackerService } from '@/ai-providers/tracking';

type UsageQuery = { start?: string; end?: string };

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly quotaService: QuotaService,
    private readonly usageTrackerService: UsageTrackerService
  ) {}

  async getSubscription(userId: string) {
    const [current, billingHistory, subscriptionEvents] = await Promise.all([
      this.paymentService.getUserSubscription(userId).catch(() => null),
      this.paymentService.getBillingHistory(userId),
      this.prisma.subscriptionEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    return {
      current: current
        ? {
            ...current,
            expiresAt: current.expiresAt ? new Date(current.expiresAt).toISOString() : undefined,
            currentPeriodEnd: current.currentPeriodEnd
              ? new Date(current.currentPeriodEnd).toISOString()
              : undefined,
          }
        : null,
      subscriptionRecords: subscriptionEvents.map((e) => ({
        id: e.id,
        provider: e.provider,
        externalSubscriptionId: e.externalSubscriptionId,
        tier: e.tier,
        status: e.status,
        action: e.action,
        effectiveAt: e.effectiveAt.toISOString(),
        expiresAt: e.expiresAt ? e.expiresAt.toISOString() : null,
        createdAt: e.createdAt.toISOString(),
      })),
      billingHistory: billingHistory.map((b) => ({
        ...b,
        date: b.date instanceof Date ? b.date.toISOString() : new Date(b.date).toISOString(),
      })),
    };
  }

  async getUsage(userId: string, query: UsageQuery) {
    const { startDate, endDate } = await this.resolveUsagePeriod(userId, query);

    const [ai, quota, dailySeries] = await Promise.all([
      this.usageTrackerService.getUserUsageStats(userId, startDate, endDate),
      this.quotaService.getQuotaInfo(userId),
      this.getDailySeries(userId, startDate, endDate),
    ]);

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      ai: {
        totalCalls: ai.totalCalls,
        successfulCalls: ai.successfulCalls,
        failedCalls: ai.failedCalls,
        totalCost: ai.totalCost,
        totalInputTokens: ai.totalInputTokens,
        totalOutputTokens: ai.totalOutputTokens,
        averageLatency: ai.averageLatency,
      },
      quota: {
        ...quota,
        optimizationsResetAt: quota.optimizationsResetAt.toISOString(),
        pdfGenerationsResetAt: quota.pdfGenerationsResetAt.toISOString(),
      },
      dailySeries,
    };
  }

  private parseIsoDate(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${field} date`);
    }
    return date;
  }

  private async resolveUsagePeriod(userId: string, query: UsageQuery) {
    if (query.start && query.end) {
      const startDate = this.parseIsoDate(query.start, 'start');
      const endDate = this.parseIsoDate(query.end, 'end');
      if (startDate > endDate) {
        throw new BadRequestException('start must be <= end');
      }
      return { startDate, endDate };
    }

    const subscription = await this.paymentService
      .getUserSubscription(userId)
      .catch(() => null);

    const endDate = subscription?.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd)
      : subscription?.expiresAt
        ? new Date(subscription.expiresAt)
        : new Date();

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);

    return { startDate, endDate };
  }

  private formatDateKey(date: Date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async getDailySeries(userId: string, startDate: Date, endDate: Date) {
    const records = await this.prisma.usageRecord.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        timestamp: true,
        cost: true,
      },
    });

    const byDay = new Map<string, { totalCalls: number; totalCost: number }>();

    for (const r of records) {
      const key = this.formatDateKey(r.timestamp);
      const current = byDay.get(key) || { totalCalls: 0, totalCost: 0 };
      byDay.set(key, {
        totalCalls: current.totalCalls + 1,
        totalCost: Math.round((current.totalCost + r.cost) * 10000) / 10000,
      });
    }

    const series: { date: string; totalCalls: number; totalCost: number }[] =
      [];
    const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
    const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

    while (cursor <= end) {
      const key = this.formatDateKey(cursor);
      const entry = byDay.get(key) || { totalCalls: 0, totalCost: 0 };
      series.push({ date: key, ...entry });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return series;
  }
}

