import { Module, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PaymentService as CePaymentService } from './payment.service';
import { PrismaModule } from '@/shared/database/prisma.module';

const logger = new Logger('PaymentModuleProxy');

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: 'PAYMENT_SERVICE',
      useClass: CePaymentService,
    },
    {
      provide: CePaymentService,
      useFactory: async (moduleRef: ModuleRef, ce: CePaymentService) => {
        const isOSS = process.env.APP_EDITION === 'oss';
        if (isOSS) {
          return ce;
        }

        try {
          const ee = moduleRef.get('EE_PAYMENT_SERVICE', { strict: false });
          if (ee) {
            logger.log('EE PaymentService active (Injected via ModuleRef)');
            return ee;
          }
        } catch (e) {
          logger.error(
            'CRITICAL: EE Edition enabled but EE_PAYMENT_SERVICE failed to resolve. Falling back to CE.',
            e
          );
        }

        return ce;
      },
      inject: [ModuleRef, 'PAYMENT_SERVICE'],
    },
  ],
  exports: [CePaymentService],
})
export class PaymentModule {}
