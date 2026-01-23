import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { PaymentModule } from '@/payment/payment.module';
import { QuotaModule } from '@/quota/quota.module';
import { AIProvidersModule } from '@/ai-providers/ai-providers.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [PrismaModule, PaymentModule, QuotaModule, AIProvidersModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}

