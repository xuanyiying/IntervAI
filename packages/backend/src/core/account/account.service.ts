import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { QuotaService } from '@/core/quota/quota.service';
import { AIService } from '@/core/ai/ai.service';

// EE-only: imported lazily so OSS builds don't blow up if not loaded
type IPaymentService = {
  getUserSubscription: (userId: string) => Promise<any>;
  getBillingHistory: (userId: string) => Promise<any[]>;
};

const PAYMENT_SERVICE = 'PAYMENT_SERVICE';

type UsageQuery = { start?: string; end?: string };

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly paymentService: IPaymentService | null,
    private readonly quotaService: QuotaService,
    private readonly aiService: AIService
  ) {}

  async getSubscription(userId: string) {
    const [current, billingHistory, subscriptionEvents] = await Promise.all([
      this.paymentService?.getUserSubscription(userId).catch(() => null) ??
        Promise.resolve(null),
      this.paymentService?.getBillingHistory(userId) ?? Promise.resolve([]),
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
            expiresAt: current.expiresAt
              ? new Date(current.expiresAt).toISOString()
              : undefined,
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
        date:
          b.date instanceof Date
            ? b.date.toISOString()
            : new Date(b.date).toISOString(),
      })),
    };
  }

  async getUsage(userId: string, query: UsageQuery) {
    const { startDate, endDate } = await this.resolveUsagePeriod(userId, query);

    const periodDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodDays);

    const [ai, quota, dailySeries, prevAi] = await Promise.all([
      this.aiService.getUsageStats(userId, startDate, endDate),
      this.quotaService.getQuotaInfo(userId),
      this.getDailySeries(userId, startDate, endDate),
      this.aiService.getUsageStats(userId, prevStartDate, prevEndDate),
    ]);

    const calcChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

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
      comparison: {
        totalCallsChange: calcChange(ai.totalCalls, prevAi.totalCalls),
        totalCostChange: calcChange(ai.totalCost, prevAi.totalCost),
        inputTokensChange: calcChange(
          ai.totalInputTokens,
          prevAi.totalInputTokens
        ),
        outputTokensChange: calcChange(
          ai.totalOutputTokens,
          prevAi.totalOutputTokens
        ),
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

    const subscription = this.paymentService
      ? await this.paymentService.getUserSubscription(userId).catch(() => null)
      : null;

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
    const cursor = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate()
      )
    );
    const end = new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate()
      )
    );

    while (cursor <= end) {
      const key = this.formatDateKey(cursor);
      const entry = byDay.get(key) || { totalCalls: 0, totalCost: 0 };
      series.push({ date: key, ...entry });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return series;
  }
}
