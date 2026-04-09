import { RedisModule } from '@/shared/cache/redis.module';
import { PrismaModule } from '@/shared/database/prisma.module';
import { Logger, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { QuotaService as CeQuotaService } from './quota.service';

const logger = new Logger('QuotaModuleProxy');

@Module({
  imports: [PrismaModule, RedisModule],
   providers: [
    {
      provide: 'QUOTA_SERVICE',
      useClass: CeQuotaService,
    },
    {
      provide: CeQuotaService,
      useFactory: async (moduleRef: ModuleRef, ce: CeQuotaService) => {
        const isOSS = process.env.APP_EDITION === 'oss';
        if (isOSS) {
          return ce;
        }

        try {
          const ee = moduleRef.get('EE_QUOTA_SERVICE', { strict: false });
          if (ee) {
            logger.log('EE QuotaService active (Injected via ModuleRef)');
            return ee;
          }
        } catch (e) {
          logger.error('CRITICAL: EE Edition enabled but EE_QUOTA_SERVICE failed to resolve. Falling back to CE.', e);
        }

        return ce;
      },
      inject: [ModuleRef, 'QUOTA_SERVICE'],
    },
  ],
  exports: [CeQuotaService],
})
export class QuotaModule { }
