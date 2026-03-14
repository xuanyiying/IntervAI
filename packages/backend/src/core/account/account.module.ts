import { Module } from '@nestjs/common';
import { PrismaModule } from '@/shared/database/prisma.module';
import { PaymentModule } from '@/core/payment/payment.module';
import { QuotaModule } from '@/core/quota/quota.module';
import { AIModule } from '@/core/ai/ai.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [PrismaModule, PaymentModule, QuotaModule, AIModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule { }
