import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './services/payment.service';
import { PaymentController } from './controllers/payment.controller';
import { PrismaModule } from '@/infrastructure/database/prisma.module';

import { AlipayPaymentProvider } from './adapters/alipay-payment.provider';
import { WechatPaymentProvider } from './adapters/wechat-payment.provider';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    AlipayPaymentProvider,
    WechatPaymentProvider,
    { provide: 'EE_PAYMENT_SERVICE', useExisting: PaymentService },
  ],
  exports: [PaymentService, 'EE_PAYMENT_SERVICE'],
})
export class PaymentModule {}
