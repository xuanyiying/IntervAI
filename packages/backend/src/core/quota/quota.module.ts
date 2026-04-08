import { Module, Logger } from '@nestjs/common';
import { QuotaService as CeQuotaService } from './quota.service';
import { PrismaModule } from '@/shared/database/prisma.module';
import { RedisModule } from '@/shared/cache/redis.module';
import { PrismaService } from '@/shared/database/prisma.service';
import { RedisService } from '@/shared/cache/redis.service';

const logger = new Logger('QuotaModuleProxy');

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    {
      provide: CeQuotaService,
      useFactory: (redis: RedisService, prisma: PrismaService) => {
        const isEE = process.env.APP_EDITION !== 'oss';
        if (isEE) {
          try {
            /* eslint-disable @typescript-eslint/no-var-requires */
            const { QuotaService: EeQuotaService } = require('../../ee/quota/quota.service');
            logger.log('EE QuotaService active');
            return new EeQuotaService(redis, prisma);
          } catch (e) {
            logger.warn('Failed to load EE QuotaService, falling back to CE');
            return new CeQuotaService();
          }
        }
        return new CeQuotaService();
      },
      inject: [RedisService, PrismaService],
    },
  ],
  exports: [CeQuotaService],
})
export class QuotaModule {}
