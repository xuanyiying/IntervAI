import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { StripePaymentProvider } from './providers/stripe-payment.provider';
import { PaddlePaymentProvider } from './providers/paddle-payment.provider';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [PaymentController],
  providers: [PaymentService, StripePaymentProvider, PaddlePaymentProvider],
  exports: [PaymentService],
})
export class PaymentModule {}
