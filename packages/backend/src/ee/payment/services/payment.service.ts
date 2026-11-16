import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'node:crypto';
import { PrismaService } from '@/infrastructure/database/services/prisma.service';
import { SubscriptionTier, PaymentOrder } from '@prisma/client';
import {
  PaymentProvider,
  SubscriptionDetails,
  BillingRecord,
} from '../interfaces/payment-provider.interface';
import { AlipayPaymentProvider } from '../adapters/alipay-payment.provider';
import { WechatPaymentProvider } from '../adapters/wechat-payment.provider';
import {
  PaymentProviderName,
  PaymentOrderStatus,
  BillingPeriod,
  PAYMENT_PLANS,
  getPaymentPlan,
  PAYMENT_ORDER_EXPIRE_MINUTES,
} from '../constants/payment.constants';
import { BillingStatus, SubscriptionStatus } from '@/types';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private alipayProvider: AlipayPaymentProvider,
    private wechatProvider: WechatPaymentProvider,
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  private getProvider(providerName: string): PaymentProvider {
    if (providerName === PaymentProviderName.ALIPAY) return this.alipayProvider;
    if (providerName === PaymentProviderName.WECHAT) return this.wechatProvider;
    throw new BadRequestException(`不支持的支付渠道: ${providerName}`);
  }

  getPlans() {
    return Object.values(PAYMENT_PLANS);
  }

  async createPayment(userId: string, planId: string, providerName: string) {
    const plan = getPaymentPlan(planId);
    if (!plan) {
      throw new BadRequestException(`未知购买计划: ${planId}`);
    }

    const provider = this.getProvider(providerName);
    if (!provider.isConfigured()) {
      throw new BadRequestException(
        `支付渠道 ${provider.name} 未配置，请检查服务端环境变量`
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const expiredAt = new Date(
      Date.now() + PAYMENT_ORDER_EXPIRE_MINUTES * 60 * 1000
    );
    const order = await this.prisma.paymentOrder.create({
      data: {
        orderNo: this.generateOrderNo(),
        userId,
        provider: provider.name,
        planId: plan.planId,
        tier: plan.tier,
        period: plan.period,
        amount: plan.amount,
        currency: plan.currency,
        status: PaymentOrderStatus.PENDING,
        subject: plan.title,
        expiredAt,
      },
    });

    try {
      const result = await provider.createPayment({
        orderNo: order.orderNo,
        amount: order.amount,
        subject: order.subject || plan.title,
        notifyUrl: this.getNotifyUrl(provider.name),
        returnUrl: this.getReturnUrl(),
        expiredAt,
      });

      if (!result.payUrl && !result.codeUrl) {
        throw new Error('支付渠道未返回支付凭据');
      }

      return {
        orderNo: order.orderNo,
        provider: provider.name,
        planId: plan.planId,
        tier: plan.tier,
        amount: order.amount,
        currency: order.currency,
        expiredAt,
        ...result,
      };
    } catch (error: any) {
      this.logger.error(
        `创建支付失败 orderNo=${order.orderNo} provider=${provider.name}: ${error.message}`
      );
      await this.prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: PaymentOrderStatus.CLOSED },
      });
      throw new BadRequestException(`发起支付失败: ${error.message}`);
    }
  }

  async getOrderStatus(userId: string, orderNo: string) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { orderNo },
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.userId !== userId) throw new ForbiddenException('无权访问该订单');

    if (order.status === PaymentOrderStatus.PENDING && !this.isExpired(order)) {
      // 回调可能延迟，主动向渠道查询一次
      try {
        const provider = this.getProvider(order.provider);
        const channel = await provider.queryOrder(order.orderNo);
        if (channel.paid) {
          await this.markOrderPaid(order, channel.channelTradeNo ?? null);
          return this.toOrderStatus({
            ...order,
            status: PaymentOrderStatus.PAID,
            channelTradeNo: channel.channelTradeNo ?? null,
          });
        }
      } catch (error: any) {
        this.logger.warn(
          `渠道订单查询失败 orderNo=${order.orderNo}: ${error.message}`
        );
      }
    }

    return this.toOrderStatus(order);
  }

  async handleNotify(
    providerName: string,
    headers: Record<string, string | string[] | undefined>,
    rawBody: Buffer
  ): Promise<{ orderNo: string; status: string; duplicate: boolean }> {
    const provider = this.getProvider(providerName);

    const verified = await provider.verifyNotify(headers, rawBody);
    const order = await this.prisma.paymentOrder.findUnique({
      where: { orderNo: verified.orderNo },
    });
    if (!order) {
      throw new NotFoundException(`回调订单不存在: ${verified.orderNo}`);
    }
    if (verified.paidAmount !== order.amount) {
      this.logger.error(
        `回调金额不一致 orderNo=${order.orderNo}: 期望 ${order.amount} 分，回调 ${verified.paidAmount} 分`
      );
      throw new BadRequestException('回调金额与订单不一致');
    }

    if (order.status !== PaymentOrderStatus.PENDING) {
      return { orderNo: order.orderNo, status: order.status, duplicate: true };
    }

    await this.markOrderPaid(order, verified.channelTradeNo);
    return {
      orderNo: order.orderNo,
      status: PaymentOrderStatus.PAID,
      duplicate: false,
    };
  }

  /**
   * 幂等落账：事务内只有抢到 PENDING → PAID 的那次更新会继续写入
   * 用户订阅与订阅事件，重复回调直接跳过。
   */
  private async markOrderPaid(
    order: PaymentOrder,
    channelTradeNo: string | null
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.paymentOrder.updateMany({
        where: { id: order.id, status: PaymentOrderStatus.PENDING },
        data: {
          status: PaymentOrderStatus.PAID,
          channelTradeNo,
          paidAt: new Date(),
        },
      });
      if (claimed.count === 0) return false;

      const user = await tx.user.findUnique({ where: { id: order.userId } });
      if (!user) throw new BadRequestException('User not found');

      const now = new Date();
      const base =
        user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
          ? user.subscriptionExpiresAt
          : now;
      const expiresAt = this.addPeriod(base, order.period);

      await tx.user.update({
        where: { id: order.userId },
        data: {
          subscriptionTier: order.tier,
          subscriptionExpiresAt: expiresAt,
          subscriptionProvider: order.provider,
        },
      });

      const tierRank = (t: SubscriptionTier) =>
        t === SubscriptionTier.FREE ? 0 : t === SubscriptionTier.PRO ? 1 : 2;
      const beforeTier = user.subscriptionTier;
      const action =
        tierRank(beforeTier) === tierRank(order.tier)
          ? 'renew'
          : tierRank(beforeTier) < tierRank(order.tier)
            ? 'upgrade'
            : 'downgrade';

      await tx.subscriptionEvent.create({
        data: {
          userId: order.userId,
          provider: order.provider,
          externalSubscriptionId: channelTradeNo || order.orderNo,
          tier: order.tier,
          status: 'ACTIVE',
          action,
          effectiveAt: now,
          expiresAt,
          metadata: {
            orderNo: order.orderNo,
            planId: order.planId,
            amount: order.amount,
          },
        },
      });

      this.logger.log(
        `订单支付完成 orderNo=${order.orderNo} user=${order.userId} tier=${order.tier} 至 ${expiresAt.toISOString()}`
      );
      return true;
    });

    if (!updated) {
      this.logger.log(`回调重复，订单已处理 orderNo=${order.orderNo}`);
    }
  }

  async getUserSubscription(userId: string): Promise<SubscriptionDetails> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        subscriptionProvider: true,
      },
    });
    if (!user) throw new BadRequestException('User not found');

    const now = new Date();
    const active =
      !!user.subscriptionExpiresAt && user.subscriptionExpiresAt > now;

    return {
      tier: user.subscriptionTier,
      expiresAt: user.subscriptionExpiresAt,
      status: active ? SubscriptionStatus.ACTIVE : undefined,
      currentPeriodEnd: active ? user.subscriptionExpiresAt! : undefined,
    };
  }

  async getBillingHistory(userId: string): Promise<BillingRecord[]> {
    const orders = await this.prisma.paymentOrder.findMany({
      where: {
        userId,
        status: { in: [PaymentOrderStatus.PAID, PaymentOrderStatus.REFUNDED] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return orders.map((order) => ({
      id: order.orderNo,
      amount: order.amount / 100,
      currency: order.currency.toLowerCase(),
      status:
        order.status === PaymentOrderStatus.REFUNDED
          ? BillingStatus.VOID
          : BillingStatus.PAID,
      date: order.paidAt || order.createdAt,
      pdfUrl: '',
    }));
  }

  private isExpired(order: PaymentOrder): boolean {
    return !!order.expiredAt && order.expiredAt.getTime() <= Date.now();
  }

  private toOrderStatus(order: PaymentOrder) {
    return {
      orderNo: order.orderNo,
      provider: order.provider,
      planId: order.planId,
      tier: order.tier,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      paidAt: order.paidAt,
      expiredAt: order.expiredAt,
    };
  }

  private generateOrderNo(): string {
    const now = new Date();
    const pad = (n: number, len = 2) => String(n).padStart(len, '0');
    const ts =
      now.getFullYear() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());
    return `IV${ts}${randomInt(0, 1000000).toString().padStart(6, '0')}`;
  }

  private addPeriod(base: Date, period: string): Date {
    const next = new Date(base);
    if (period === BillingPeriod.YEARLY) {
      next.setFullYear(next.getFullYear() + 1);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    return next;
  }

  private getNotifyUrl(providerName: string): string {
    const base =
      this.configService.get<string>('PAYMENT_NOTIFY_BASE_URL') ||
      `http://localhost:${this.configService.get<number>('PORT') || 3000}${
        this.configService.get<string>('API_PREFIX') || '/api/v1'
      }`;
    return `${base}/payments/notify/${providerName}`;
  }

  private getReturnUrl(): string {
    const frontend =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    return `${frontend}/payment/success`;
  }
}
