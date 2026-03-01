import { Module } from '@nestjs/common';
import { PrismaModule } from '@/shared/database/prisma.module';
import { PaymentModule } from '@/features/payment/payment.module';
import { QuotaModule } from '@/core/quota/quota.module';
import { AIProvidersModule } from '@/core/ai-provider/ai-providers.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [PrismaModule, PaymentModule, QuotaModule, AIProvidersModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
