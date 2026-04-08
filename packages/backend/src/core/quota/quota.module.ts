import { Module, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { QuotaService as CeQuotaService } from './quota.service';
import { PrismaModule } from '@/shared/database/prisma.module';
import { RedisModule } from '@/shared/cache/redis.module';

const logger = new Logger('QuotaModuleProxy');

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    CeQuotaService, // Register the CE version for internal use and as fallback
    {
      provide: CeQuotaService, // Use CE class as public token
      useFactory: async (moduleRef: ModuleRef, ce: CeQuotaService) => {
        const isOSS = process.env.APP_EDITION === 'oss';
        if (isOSS) {
          return ce;
        }

        try {
          // Late bound EE service discovery using string token
          // This avoids direct imports of EE code in the core bundle
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
      inject: [ModuleRef, CeQuotaService],
    },
  ],
  exports: [CeQuotaService],
})
export class QuotaModule {}
