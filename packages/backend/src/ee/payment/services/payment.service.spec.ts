import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AlipayPaymentProvider } from '../adapters/alipay-payment.provider';
import { WechatPaymentProvider } from '../adapters/wechat-payment.provider';
import { PrismaService } from '@/infrastructure/database/services/prisma.service';
import { SubscriptionTier } from '@prisma/client';

const createMockProvider = (name: 'alipay' | 'wechat') => ({
  name,
  isConfigured: jest.fn().mockReturnValue(true),
  createPayment: jest
    .fn()
    .mockResolvedValue(
      name === 'alipay'
        ? { payUrl: 'https://pay' }
        : { codeUrl: 'weixin://wxpay' }
    ),
  verifyNotify: jest.fn(),
  queryOrder: jest.fn().mockResolvedValue({ paid: false }),
  refund: jest.fn(),
});

describe('PaymentService', () => {
  let service: PaymentService;
  let alipayProvider: ReturnType<typeof createMockProvider>;
  let wechatProvider: ReturnType<typeof createMockProvider>;
  let prisma: any;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    subscriptionTier: SubscriptionTier.FREE,
    subscriptionExpiresAt: null,
    subscriptionProvider: null,
  };

  const pendingOrder = {
    id: 'order-1',
    orderNo: 'IV20261115120000000001',
    userId: 'user-id',
    provider: 'alipay',
    planId: 'pro_monthly',
    tier: SubscriptionTier.PRO,
    period: 'MONTHLY',
    amount: 1900,
    currency: 'CNY',
    status: 'PENDING',
    channelTradeNo: null,
    subject: 'Pro 月度会员',
    paidAt: null,
    expiredAt: new Date(Date.now() + 10 * 60 * 1000),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    alipayProvider = createMockProvider('alipay');
    wechatProvider = createMockProvider('wechat');

    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn(),
      },
      paymentOrder: {
        create: jest.fn().mockResolvedValue({ ...pendingOrder }),
        findUnique: jest.fn().mockResolvedValue({ ...pendingOrder }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      subscriptionEvent: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: AlipayPaymentProvider, useValue: alipayProvider },
        { provide: WechatPaymentProvider, useValue: wechatProvider },
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlans', () => {
    it('returns catalog with server-side prices', () => {
      const plans = service.getPlans() as any[];
      expect(plans.map((p) => p.planId)).toEqual([
        'pro_monthly',
        'pro_yearly',
        'enterprise_monthly',
        'enterprise_yearly',
      ]);
      expect(plans.every((p) => p.amount > 0 && p.currency === 'CNY')).toBe(
        true
      );
    });
  });

  describe('createPayment', () => {
    it('creates a pending order and returns alipay pay url', async () => {
      const result: any = await service.createPayment(
        'user-id',
        'pro_monthly',
        'alipay'
      );

      expect(result.orderNo).toMatch(/^IV\d{14}\d{6}$/);
      expect(result.amount).toBe(1900);
      expect(result.payUrl).toBe('https://pay');
      expect(prisma.paymentOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-id',
            provider: 'alipay',
            tier: SubscriptionTier.PRO,
            status: 'PENDING',
            amount: 1900,
          }),
        })
      );
      expect(alipayProvider.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNo: result.orderNo,
          amount: 1900,
          notifyUrl: expect.stringContaining('/payments/notify/alipay'),
        })
      );
    });

    it('returns wechat code url', async () => {
      prisma.paymentOrder.create.mockResolvedValue({
        ...pendingOrder,
        provider: 'wechat',
      });

      const result: any = await service.createPayment(
        'user-id',
        'pro_yearly',
        'wechat'
      );

      expect(result.codeUrl).toBe('weixin://wxpay');
    });

    it('throws for unknown plan', async () => {
      await expect(
        service.createPayment('user-id', 'fake_plan', 'alipay')
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when provider is not configured', async () => {
      alipayProvider.isConfigured.mockReturnValue(false);
      await expect(
        service.createPayment('user-id', 'pro_monthly', 'alipay')
      ).rejects.toThrow(BadRequestException);
    });

    it('closes the order when provider fails', async () => {
      alipayProvider.createPayment.mockRejectedValue(new Error('gateway down'));

      await expect(
        service.createPayment('user-id', 'pro_monthly', 'alipay')
      ).rejects.toThrow(BadRequestException);

      expect(prisma.paymentOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'CLOSED' },
        })
      );
    });
  });

  describe('getOrderStatus', () => {
    it('queries the channel and marks paid when callback is delayed', async () => {
      alipayProvider.queryOrder.mockResolvedValue({
        paid: true,
        channelTradeNo: '20261115xxx',
      });

      const result: any = await service.getOrderStatus(
        'user-id',
        pendingOrder.orderNo
      );

      expect(result.status).toBe('PAID');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subscriptionTier: SubscriptionTier.PRO,
          }),
        })
      );
    });

    it('keeps pending status when channel reports unpaid', async () => {
      const result: any = await service.getOrderStatus(
        'user-id',
        pendingOrder.orderNo
      );

      expect(result.status).toBe('PENDING');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('does not query channel for expired orders', async () => {
      prisma.paymentOrder.findUnique.mockResolvedValue({
        ...pendingOrder,
        expiredAt: new Date(Date.now() - 60 * 1000),
      });

      const result: any = await service.getOrderStatus(
        'user-id',
        pendingOrder.orderNo
      );

      expect(alipayProvider.queryOrder).not.toHaveBeenCalled();
      expect(result.status).toBe('PENDING');
    });

    it('forbids access to other users orders', async () => {
      await expect(
        service.getOrderStatus('someone-else', pendingOrder.orderNo)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('handleNotify', () => {
    it('marks order paid and extends subscription', async () => {
      alipayProvider.verifyNotify.mockResolvedValue({
        orderNo: pendingOrder.orderNo,
        channelTradeNo: 'trade-1',
        paidAmount: 1900,
      });

      const result = await service.handleNotify('alipay', {}, Buffer.from(''));

      expect(result).toEqual({
        orderNo: pendingOrder.orderNo,
        status: 'PAID',
        duplicate: false,
      });
      expect(prisma.paymentOrder.updateMany).toHaveBeenCalledWith({
        where: { id: pendingOrder.id, status: 'PENDING' },
        data: expect.objectContaining({ status: 'PAID' }),
      });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-id' },
          data: expect.objectContaining({
            subscriptionTier: SubscriptionTier.PRO,
            subscriptionProvider: 'alipay',
          }),
        })
      );
      expect(prisma.subscriptionEvent.create).toHaveBeenCalled();
    });

    it('renews on top of an existing active subscription', async () => {
      alipayProvider.verifyNotify.mockResolvedValue({
        orderNo: pendingOrder.orderNo,
        channelTradeNo: 'trade-1',
        paidAmount: 1900,
      });
      const futureExpiry = new Date('2027-01-01T00:00:00.000Z');
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        subscriptionTier: SubscriptionTier.PRO,
        subscriptionExpiresAt: futureExpiry,
      });

      await service.handleNotify('alipay', {}, Buffer.from(''));

      const update = prisma.user.update.mock.calls[0][0];
      expect(update.data.subscriptionExpiresAt.getUTCMonth()).toBe(1); // 2027-02-01
      expect(prisma.subscriptionEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'renew' }),
        })
      );
    });

    it('rejects notifications whose amount differs from the order', async () => {
      alipayProvider.verifyNotify.mockResolvedValue({
        orderNo: pendingOrder.orderNo,
        channelTradeNo: 'trade-1',
        paidAmount: 1,
      });

      await expect(
        service.handleNotify('alipay', {}, Buffer.from(''))
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('is idempotent for repeated callbacks', async () => {
      alipayProvider.verifyNotify.mockResolvedValue({
        orderNo: pendingOrder.orderNo,
        channelTradeNo: 'trade-1',
        paidAmount: 1900,
      });
      prisma.paymentOrder.findUnique.mockResolvedValue({
        ...pendingOrder,
        status: 'PAID',
      });

      const result = await service.handleNotify('alipay', {}, Buffer.from(''));

      expect(result.duplicate).toBe(true);
      expect(prisma.paymentOrder.updateMany).not.toHaveBeenCalled();
    });

    it('does not write when another callback already claimed the order', async () => {
      alipayProvider.verifyNotify.mockResolvedValue({
        orderNo: pendingOrder.orderNo,
        channelTradeNo: 'trade-1',
        paidAmount: 1900,
      });
      prisma.paymentOrder.updateMany.mockResolvedValue({ count: 0 });

      await service.handleNotify('alipay', {}, Buffer.from(''));

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('getUserSubscription', () => {
    it('returns active status while subscription has not expired', async () => {
      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: SubscriptionTier.PRO,
        subscriptionExpiresAt: new Date(Date.now() + 86400000),
        subscriptionProvider: 'alipay',
      });

      const result = await service.getUserSubscription('user-id');
      expect(result.status).toBe('ACTIVE');
      expect(result.tier).toBe(SubscriptionTier.PRO);
    });

    it('omits status after expiry', async () => {
      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: SubscriptionTier.PRO,
        subscriptionExpiresAt: new Date(Date.now() - 86400000),
        subscriptionProvider: 'alipay',
      });

      const result = await service.getUserSubscription('user-id');
      expect(result.status).toBeUndefined();
    });
  });

  describe('getBillingHistory', () => {
    it('maps paid and refunded orders to billing records', async () => {
      prisma.paymentOrder.findMany.mockResolvedValue([
        {
          orderNo: 'IV1',
          amount: 1900,
          currency: 'CNY',
          status: 'PAID',
          paidAt: new Date('2026-11-01T00:00:00.000Z'),
          createdAt: new Date('2026-11-01T00:00:00.000Z'),
        },
        {
          orderNo: 'IV2',
          amount: 9900,
          currency: 'CNY',
          status: 'REFUNDED',
          paidAt: new Date('2026-10-01T00:00:00.000Z'),
          createdAt: new Date('2026-10-01T00:00:00.000Z'),
        },
      ]);

      const records = await service.getBillingHistory('user-id');

      expect(records).toHaveLength(2);
      expect(records[0]).toMatchObject({
        id: 'IV1',
        amount: 19,
        currency: 'cny',
      });
      expect(records[1].status).toBe('VOID');
    });
  });
});
