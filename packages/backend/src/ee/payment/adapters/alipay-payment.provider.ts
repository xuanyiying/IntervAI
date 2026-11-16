import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlipaySdk } from 'alipay-sdk';
import * as querystring from 'node:querystring';
import {
  CreatePaymentInput,
  CreatePaymentResult,
  ChannelPaymentQuery,
  NotifyVerification,
  RefundInput,
  PaymentProvider,
} from '../interfaces/payment-provider.interface';
import { PaymentProviderName } from '../constants/payment.constants';

const SUCCESS_TRADE_STATUS = ['TRADE_SUCCESS', 'TRADE_FINISHED'];

function yuanFromCents(amount: number): string {
  return (amount / 100).toFixed(2);
}

@Injectable()
export class AlipayPaymentProvider implements PaymentProvider {
  readonly name = PaymentProviderName.ALIPAY;
  private readonly logger = new Logger(AlipayPaymentProvider.name);
  private readonly alipay: AlipaySdk | null = null;
  private readonly appId: string | null = null;

  constructor(private configService: ConfigService) {
    const appId = this.configService.get<string>('ALIPAY_APP_ID');
    const privateKey = this.configService.get<string>('ALIPAY_PRIVATE_KEY');
    const alipayPublicKey = this.configService.get<string>(
      'ALIPAY_ALIPAY_PUBLIC_KEY'
    );

    if (appId && privateKey && alipayPublicKey) {
      this.appId = appId;
      this.alipay = new AlipaySdk({
        appId,
        privateKey,
        signType: 'RSA2',
        keyType: 'PKCS8',
        alipayPublicKey,
        gateway:
          this.configService.get<string>('ALIPAY_GATEWAY') ||
          'https://openapi.alipay.com/gateway.do',
      });
    } else {
      this.logger.warn(
        '支付宝支付未配置（需要 ALIPAY_APP_ID / ALIPAY_PRIVATE_KEY / ALIPAY_ALIPAY_PUBLIC_KEY）'
      );
    }
  }

  isConfigured(): boolean {
    return !!this.alipay;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.alipay) {
      throw new BadRequestException('支付宝支付未配置');
    }

    // 电脑网站支付：GET 形式直接返回收银台跳转 URL，页面内自带扫码与打开 App 入口
    const payUrl = this.alipay.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      bizContent: {
        out_trade_no: input.orderNo,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: yuanFromCents(input.amount),
        subject: input.subject,
        timeout_express: '15m',
      },
      notify_url: input.notifyUrl,
      return_url: input.returnUrl,
    });

    return { payUrl };
  }

  async verifyNotify(
    _headers: Record<string, string | string[] | undefined>,
    rawBody: Buffer
  ): Promise<NotifyVerification> {
    if (!this.alipay || !this.appId) {
      throw new BadRequestException('支付宝支付未配置');
    }

    // 异步通知为 form-urlencoded，用 querystring 保持扁平字符串结构
    const params = querystring.parse(rawBody.toString('utf8')) as Record<
      string,
      string
    >;

    if (!params.sign || !params.out_trade_no) {
      throw new BadRequestException('支付宝回调参数不完整');
    }

    const verified = this.alipay.checkNotifySign(params);
    if (!verified) {
      this.logger.warn('支付宝回调验签失败');
      throw new BadRequestException('支付宝回调验签失败');
    }

    if (params.app_id !== this.appId) {
      throw new BadRequestException('支付宝回调 app_id 不匹配');
    }

    if (!SUCCESS_TRADE_STATUS.includes(params.trade_status)) {
      throw new BadRequestException(
        `支付宝交易状态非成功: ${params.trade_status}`
      );
    }

    const paidAmount = Math.round(parseFloat(params.total_amount) * 100);
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      throw new BadRequestException('支付宝回调金额无效');
    }

    return {
      orderNo: params.out_trade_no,
      channelTradeNo: params.trade_no,
      paidAmount,
    };
  }

  async queryOrder(orderNo: string): Promise<ChannelPaymentQuery> {
    if (!this.alipay) {
      throw new BadRequestException('支付宝支付未配置');
    }

    const result = await this.alipay.exec('alipay.trade.query', {
      bizContent: { out_trade_no: orderNo },
    });

    if (result.code !== '10000') {
      // ACQ.TRADE_NOT_EXIST 表示用户尚未在收银台提交支付
      return { paid: false };
    }

    const status = result.tradeStatus || result.trade_status;
    return {
      paid: SUCCESS_TRADE_STATUS.includes(status),
      channelTradeNo: result.tradeNo || result.trade_no,
    };
  }

  async refund(
    input: RefundInput
  ): Promise<{ success: boolean; refundId?: string }> {
    if (!this.alipay) {
      throw new BadRequestException('支付宝支付未配置');
    }

    const result = await this.alipay.exec('alipay.trade.refund', {
      bizContent: {
        out_trade_no: input.orderNo,
        refund_amount: yuanFromCents(input.amount),
        out_request_no: `${input.orderNo}R`,
        refund_reason: input.reason || '用户申请退款',
      },
    });

    if (result.code !== '10000') {
      throw new BadRequestException(
        `支付宝退款失败: ${result.subCode || result.sub_code || result.msg}`
      );
    }

    const changed = result.fundChange || result.fund_change;
    return { success: changed === 'Y' };
  }
}
