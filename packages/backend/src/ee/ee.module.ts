import { Module } from '@nestjs/common';
import { PaymentModule } from './payment/payment.module';
import { QuotaModule } from './quota/quota.module';
import { InvitationModule } from './invitation/invitation.module';

@Module({
  imports: [PaymentModule, QuotaModule, InvitationModule],
  exports: [PaymentModule, QuotaModule, InvitationModule],
})
export class EeModule {}
