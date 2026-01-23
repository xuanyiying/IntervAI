import { AccountService } from './account.service';
import { SubscriptionTier } from '@prisma/client';

describe('AccountService', () => {
  const createService = (overrides?: Partial<any>) => {
    const prisma = {
      subscriptionEvent: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      usageRecord: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      ...(overrides?.prisma || {}),
    };

    const paymentService = {
      getUserSubscription: jest.fn().mockResolvedValue({
        tier: SubscriptionTier.FREE,
        expiresAt: null,
      }),
      getBillingHistory: jest.fn().mockResolvedValue([]),
      ...(overrides?.paymentService || {}),
    };

    const quotaService = {
      getQuotaInfo: jest.fn().mockResolvedValue({
        tier: SubscriptionTier.FREE,
        optimizationsUsed: 1,
        optimizationsLimit: 10,
        optimizationsResetAt: new Date('2026-01-02T00:00:00.000Z'),
        pdfGenerationsUsed: 0,
        pdfGenerationsLimit: 5,
        pdfGenerationsResetAt: new Date('2026-01-03T00:00:00.000Z'),
        canOptimize: true,
        canGeneratePdf: true,
      }),
      ...(overrides?.quotaService || {}),
    };

    const usageTrackerService = {
      getUserUsageStats: jest.fn().mockResolvedValue({
        totalCalls: 2,
        successfulCalls: 2,
        failedCalls: 0,
        totalCost: 0.01,
        totalInputTokens: 100,
        totalOutputTokens: 200,
        averageLatency: 123,
        modelBreakdown: new Map(),
      }),
      ...(overrides?.usageTrackerService || {}),
    };

    return {
      service: new AccountService(
        prisma as any,
        paymentService as any,
        quotaService as any,
        usageTrackerService as any
      ),
      prisma,
      paymentService,
      quotaService,
      usageTrackerService,
    };
  };

  it('getSubscription maps events and billing history', async () => {
    const { service, prisma, paymentService } = createService({
      prisma: {
        subscriptionEvent: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'evt-1',
              userId: 'u1',
              provider: 'stripe',
              externalSubscriptionId: 'sub_1',
              tier: SubscriptionTier.PRO,
              status: 'ACTIVE',
              action: 'upgrade',
              effectiveAt: new Date('2026-01-01T00:00:00.000Z'),
              expiresAt: new Date('2026-02-01T00:00:00.000Z'),
              metadata: null,
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
            },
          ]),
        },
      },
      paymentService: {
        getBillingHistory: jest.fn().mockResolvedValue([
          {
            id: 'inv_1',
            amount: 19,
            currency: 'usd',
            status: 'PAID',
            date: new Date('2026-01-01T00:00:00.000Z'),
            pdfUrl: 'https://example.com/inv.pdf',
          },
        ]),
      },
    });

    const result = await service.getSubscription('u1');

    expect(paymentService.getBillingHistory).toHaveBeenCalled();
    expect(prisma.subscriptionEvent.findMany).toHaveBeenCalled();
    expect(result.subscriptionRecords).toHaveLength(1);
    expect(result.billingHistory).toHaveLength(1);
    expect(result.subscriptionRecords[0].tier).toBe(SubscriptionTier.PRO);
    expect(result.billingHistory[0].date).toContain('2026-01-01');
  });

  it('getUsage returns quota + daily series in requested range', async () => {
    const { service, prisma } = createService({
      prisma: {
        usageRecord: {
          findMany: jest.fn().mockResolvedValue([
            {
              timestamp: new Date('2026-01-01T01:00:00.000Z'),
              cost: 0.01,
            },
            {
              timestamp: new Date('2026-01-02T01:00:00.000Z'),
              cost: 0.02,
            },
          ]),
        },
      },
    });

    const result = await service.getUsage('u1', {
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-01-02T23:59:59.000Z',
    });

    expect(prisma.usageRecord.findMany).toHaveBeenCalled();
    expect(result.period.start).toBe('2026-01-01T00:00:00.000Z');
    expect(result.dailySeries).toHaveLength(2);
    expect(result.dailySeries[0].date).toBe('2026-01-01');
    expect(result.dailySeries[0].totalCalls).toBe(1);
    expect(result.dailySeries[1].totalCalls).toBe(1);
  });
});
