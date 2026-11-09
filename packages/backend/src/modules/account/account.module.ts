import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { QuotaModule } from '@/modules/quota/quota.module';
import { AIModule } from '@/modules/ai/ai.module';
import { AccountController } from './controllers/account.controller';
import { AccountService } from './services/account.service';

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
