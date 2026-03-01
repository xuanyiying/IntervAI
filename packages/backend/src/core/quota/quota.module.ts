import { Module } from '@nestjs/common';
import { QuotaService } from './quota.service';
import { QuotaController } from './quota.controller';
import { RedisModule } from '@/shared/cache/redis.module';
import { PrismaModule } from '@/shared/database/prisma.module';

@Module({
  imports: [RedisModule, PrismaModule],
  providers: [QuotaService],
  controllers: [QuotaController],
  exports: [QuotaService],
})
export class QuotaModule {}
