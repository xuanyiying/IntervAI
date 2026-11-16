import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {
  getPlans(): unknown[] {
    return [];
  }

  async createPayment(
    _userId: string,
    _planId: string,
    _provider: 'alipay' | 'wechat'
  ): Promise<unknown> {
    throw new Error('Payment is not available in OSS edition');
  }

  async getOrderStatus(_userId: string, _orderNo: string): Promise<unknown> {
    return null;
  }

  async getUserSubscription(_userId: string): Promise<any> {
    return null;
  }

  async getBillingHistory(_userId: string): Promise<any[]> {
    return [];
  }

  async handleNotify(
    _provider: 'alipay' | 'wechat',
    _headers: Record<string, string | string[] | undefined>,
    _rawBody: Buffer
  ): Promise<void> {}
}
