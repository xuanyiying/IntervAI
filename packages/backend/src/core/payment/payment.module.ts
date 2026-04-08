import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentService as CePaymentService } from './payment.service';
import { PrismaModule } from '@/shared/database/prisma.module';
import { PrismaService } from '@/shared/database/prisma.service';

const logger = new Logger('PaymentModuleProxy');

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    {
      provide: CePaymentService,
      useFactory: (config: ConfigService, prisma: PrismaService) => {
        const isEE = process.env.APP_EDITION !== 'oss';
        if (isEE) {
          try {
            /* eslint-disable @typescript-eslint/no-var-requires */
            const { PaymentService: EePaymentService } = require('../../ee/payment/payment.service');
            const { StripePaymentProvider } = require('../../ee/payment/providers/stripe-payment.provider');
            const { PaddlePaymentProvider } = require('../../ee/payment/providers/paddle-payment.provider');
            
            const stripe = new StripePaymentProvider(config, prisma);
            const paddle = new PaddlePaymentProvider(config, prisma);
            
            logger.log('EE PaymentService active (Stripe + Paddle)');
            return new EePaymentService(prisma, stripe, paddle);
          } catch (e) {
            logger.warn('Failed to load EE PaymentService, falling back to CE');
            return new CePaymentService();
          }
        }
        return new CePaymentService();
      },
      inject: [ConfigService, PrismaService],
    },
  ],
  exports: [CePaymentService],
})
export class PaymentModule {}
