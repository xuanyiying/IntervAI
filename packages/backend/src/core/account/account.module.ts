import { Module } from '@nestjs/common';
import { PrismaModule } from '@/shared/database/prisma.module';
import { QuotaModule } from '@/core/quota/quota.module';
import { AIModule } from '@/core/ai/ai.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

/**
 * AccountModule
 *
 * Uses the OSS noop QuotaModule from core/. In EE mode EeModule's
 * QuotaModule takes precedence globally. Payment features are only
 * available when EeModule is loaded (non-OSS mode).
 */
@Module({
  imports: [PrismaModule, QuotaModule, AIModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
