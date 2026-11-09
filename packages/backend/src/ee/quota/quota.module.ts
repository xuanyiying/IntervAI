import { Module } from '@nestjs/common';
import { QuotaService } from './services/quota.service';
import { QuotaController } from './controllers/quota.controller';
import { RedisModule } from '@/infrastructure/cache/redis.module';
import { PrismaModule } from '@/infrastructure/database/prisma.module';

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
