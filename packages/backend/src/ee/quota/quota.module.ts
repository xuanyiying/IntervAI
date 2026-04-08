import { Module } from '@nestjs/common';
import { QuotaService } from './quota.service';
import { QuotaController } from './quota.controller';
import { RedisModule } from '@/shared/cache/redis.module';
import { PrismaModule } from '@/shared/database/prisma.module';

@Module({
  imports: [RedisModule, PrismaModule],
  providers: [
    QuotaService,
    { provide: 'EE_QUOTA_SERVICE', useExisting: QuotaService },
  ],
  controllers: [QuotaController],
  exports: [QuotaService, 'EE_QUOTA_SERVICE'],
})
export class QuotaModule {}
