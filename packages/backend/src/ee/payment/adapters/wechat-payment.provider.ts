import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  createDecipheriv,
  createSign,
  createVerify,
  randomBytes,
  type KeyObject,
  createPublicKey,
} from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  CreatePaymentInput,
  CreatePaymentResult,
  ChannelPaymentQuery,
  NotifyVerification,
  RefundInput,
  PaymentProvider,
} from '../interfaces/payment-provider.interface';
import { PaymentProviderName } from '../constants/payment.constants';

const WXPAY_API_BASE = 'https://api.mch.weixin.qq.com';

function rfc3339Cn(date: Date): string {
  // 微信要求 RFC3339 且示例为东八区偏移，如 2018-06-08T10:34:56+08:00
  return new Date(date.getTime() + 8 * 3600 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, '+08:00');
}

function normalizePrivateKey(raw: string): string {
  if (raw.includes('-----BEGIN')) {
    return raw.replace(/\\n/g, '\n');
  }
  // 兼容传 apiclient_key.pem 文件路径
  try {
    return readFileSync(raw, 'utf8');
  } catch {
    return raw;
  }
}

interface WxpayNotifyHeaders {
  timestamp?: string | string[];
  nonce?: string | string[];
  signature?: string | string[];
  serial?: string | string[];
  [key: string]: string | string[] | undefined;
}

@Injectable()
export class WechatPaymentProvider implements PaymentProvider {
  readonly name = PaymentProviderName.WECHAT;
  private readonly logger = new Logger(WechatPaymentProvider.name);
  private readonly appid: string | null = null;
  private readonly mchid: string | null = null;
  private readonly serialNo: string | null = null;
  private readonly privateKeyPem: string | null = null;
  private readonly apiv3Key: string | null = null;
  private platformCerts = new Map<string, KeyObject>();
  private certsFetchedAt = 0;

  constructor(private configService: ConfigService) {
    const appid = this.configService.get<string>('WECHAT_PAY_APP_ID');
    const mchid = this.configService.get<string>('WECHAT_PAY_MCH_ID');
    const serialNo = this.configService.get<string>('WECHAT_PAY_SERIAL_NO');
    const privateKey = this.configService.get<string>('WECHAT_PAY_PRIVATE_KEY');
    const apiv3Key = this.configService.get<string>('WECHAT_PAY_APIV3_KEY');

    if (appid && mchid && serialNo && privateKey && apiv3Key) {
      this.appid = appid;
      this.mchid = mchid;
      this.serialNo = serialNo;
      this.privateKeyPem = normalizePrivateKey(privateKey);
      this.apiv3Key = apiv3Key;
    } else {
      this.logger.warn(
        '微信支付未配置（需要 WECHAT_PAY_APP_ID / MCH_ID / SERIAL_NO / PRIVATE_KEY / APIV3_KEY）'
      );
    }
  }

  isConfigured(): boolean {
    return !!this.privateKeyPem;
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new BadRequestException('微信支付未配置');
    }
  }

  private async request<T = Record<string, any>>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, any>
  ): Promise<T> {
    this.assertConfigured();

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = randomBytes(16).toString('hex');
    const bodyStr = body ? JSON.stringify(body) : '';
    const message = `${method}\n${path}\n${timestamp}\n${nonce}\n${bodyStr}\n`;

    const signature = createSign('RSA-SHA256')
      .update(message, 'utf8')
      .sign(this.privateKeyPem!, 'base64');

    const authorization =
      `WECHATPAY2-SHA256withRSA mchid="${this.mchid}",nonce_str="${nonce}",` +
      `signature="${signature}",timestamp="${timestamp}",serial_no="${this.serialNo}"`;

    try {
      const response = await axios.request<T>({
        method,
        url: `${WXPAY_API_BASE}${path}`,
        data: bodyStr || undefined,
        headers: {
          Authorization: authorization,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error: any) {
      const data = error?.response?.data;
      const detail = data?.code
        ? `${data.code}: ${data.message || ''}`
        : error.message;
      this.logger.error(`微信支付 API 请求失败 ${method} ${path}: ${detail}`);
      throw new Error(`微信支付 API 请求失败: ${detail}`);
    }
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const result = await this.request<{ code_url: string }>(
      'POST',
      '/v3/pay/transactions/native',
      {
        appid: this.appid,
        mchid: this.mchid,
        description: input.subject,
        out_trade_no: input.orderNo,
        time_expire: rfc3339Cn(input.expiredAt),
        notify_url: input.notifyUrl,
        amount: { total: input.amount, currency: 'CNY' },
      }
    );

    if (!result.code_url) {
      throw new Error('微信支付未返回二维码 code_url');
    }
    return { codeUrl: result.code_url };
  }

  async queryOrder(orderNo: string): Promise<ChannelPaymentQuery> {
    const result = await this.request<{
      trade_state: string;
      transaction_id?: string;
    }>(
      'GET',
      `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}?mchid=${this.mchid}`
    );

    return {
      paid: result.trade_state === 'SUCCESS',
      channelTradeNo: result.transaction_id,
    };
  }

  async refund(
    input: RefundInput
  ): Promise<{ success: boolean; refundId?: string }> {
    const result = await this.request<{
      refund_id: string;
      status: string;
    }>('POST', '/v3/refund/domestic/refunds', {
      out_trade_no: input.orderNo,
      out_refund_no: `${input.orderNo}R`,
      reason: input.reason || '用户申请退款',
      amount: {
        refund: input.amount,
        total: input.total,
        currency: 'CNY',
      },
    });

    return {
      success: ['SUCCESS', 'PROCESSING'].includes(result.status),
      refundId: result.refund_id,
    };
  }

  async verifyNotify(
    headers: Record<string, string | string[] | undefined>,
    rawBody: Buffer
  ): Promise<NotifyVerification> {
    this.assertConfigured();

    const wxHeaders = headers as unknown as WxpayNotifyHeaders;
    const first = (v: string | string[] | undefined): string =>
      Array.isArray(v) ? v[0] : v || '';
    const timestamp = first(wxHeaders['wechatpay-timestamp']);
    const nonce = first(wxHeaders['wechatpay-nonce']);
    const signature = first(wxHeaders['wechatpay-signature']);
    const serial = first(wxHeaders['wechatpay-serial']);

    if (!timestamp || !nonce || !signature || !serial) {
      throw new BadRequestException('微信支付回调缺少签名头');
    }

    const bodyStr = rawBody.toString('utf8');
    const publicKey = await this.getPlatformPublicKey(serial);
    const message = `${timestamp}\n${nonce}\n${bodyStr}\n`;
    const valid = createVerify('RSA-SHA256')
      .update(message, 'utf8')
      .verify(publicKey, signature, 'base64');

    if (!valid) {
      this.logger.warn(`微信支付回调验签失败 serial=${serial}`);
      throw new BadRequestException('微信支付回调验签失败');
    }

    const body = JSON.parse(bodyStr) as {
      event_type: string;
      resource: {
        ciphertext: string;
        nonce: string;
        associated_data?: string;
      };
    };

    if (body.event_type !== 'TRANSACTION.SUCCESS') {
      throw new BadRequestException(`忽略微信回调事件: ${body.event_type}`);
    }

    const resource = JSON.parse(this.decryptResource(body.resource)) as {
      out_trade_no: string;
      transaction_id: string;
      trade_state: string;
      mchid: string;
      amount: { total: number };
    };

    if (resource.mchid !== this.mchid) {
      throw new BadRequestException('微信支付回调 mchid 不匹配');
    }
    if (resource.trade_state !== 'SUCCESS') {
      throw new BadRequestException(
        `微信交易状态非成功: ${resource.trade_state}`
      );
    }

    return {
      orderNo: resource.out_trade_no,
      channelTradeNo: resource.transaction_id,
      paidAmount: resource.amount.total,
    };
  }

  private decryptResource(resource: {
    ciphertext: string;
    nonce: string;
    associated_data?: string;
  }): string {
    const ciphertext = Buffer.from(resource.ciphertext, 'base64');
    const authTag = ciphertext.subarray(ciphertext.length - 16);
    const encrypted = ciphertext.subarray(0, ciphertext.length - 16);

    const decipher = createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.apiv3Key!, 'utf8'),
      Buffer.from(resource.nonce, 'utf8')
    );
    decipher.setAuthTag(authTag);
    if (resource.associated_data) {
      decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'));
    }

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }

  private async getPlatformPublicKey(serial: string): Promise<KeyObject> {
    const cached = this.platformCerts.get(serial);
    if (cached) return cached;

    // 证书有 12h+ 的轮换周期，未知序列号时重新拉取平台证书
    if (Date.now() - this.certsFetchedAt > 60 * 1000) {
      await this.refreshPlatformCerts();
    }

    const key = this.platformCerts.get(serial);
    if (!key) {
      throw new BadRequestException(`未找到微信支付平台证书 serial=${serial}`);
    }
    return key;
  }

  private async refreshPlatformCerts(): Promise<void> {
    const result = await this.request<{
      data: Array<{
        serial_no: string;
        encrypt_certificate: {
          nonce: string;
          associated_data: string;
          ciphertext: string;
        };
      }>;
    }>('GET', '/v3/certificates');

    const next = new Map<string, KeyObject>();
    for (const cert of result.data || []) {
      const pem = this.decryptResource({
        ciphertext: cert.encrypt_certificate.ciphertext,
        nonce: cert.encrypt_certificate.nonce,
        associated_data: cert.encrypt_certificate.associated_data,
      });
      next.set(cert.serial_no, createPublicKey(pem));
    }

    if (next.size === 0) {
      throw new Error('微信支付平台证书列表为空');
    }

    this.platformCerts = next;
    this.certsFetchedAt = Date.now();
    this.logger.log(`已更新微信支付平台证书 ${next.size} 张`);
  }
}
