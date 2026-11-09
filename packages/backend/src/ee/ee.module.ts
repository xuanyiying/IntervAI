import { Module } from '@nestjs/common';
import { PaymentModule } from './payment/payment.module';
import { QuotaModule } from './quota/quota.module';

@Module({
  imports: [PaymentModule, QuotaModule],
  exports: [PaymentModule, QuotaModule],
})
export class EeModule {}
