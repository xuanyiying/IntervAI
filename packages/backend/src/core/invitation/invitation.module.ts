import { Module, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InvitationService as CeInvitationService } from './invitation.service';
import { PrismaModule } from '@/shared/database/prisma.module';
import { RedisModule } from '@/shared/cache/redis.module';

const logger = new Logger('InvitationModuleProxy');

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    CeInvitationService,
    {
      provide: CeInvitationService,
      useFactory: async (moduleRef: ModuleRef, ce: CeInvitationService) => {
        const isOSS = process.env.APP_EDITION === 'oss';
        if (isOSS) {
          return ce;
        }

        try {
          const ee = moduleRef.get('EE_INVITATION_SERVICE', { strict: false });
          if (ee) {
            logger.log('EE InvitationService active (Injected via ModuleRef)');
            return ee;
          }
        } catch (e) {
          logger.error('CRITICAL: EE Edition enabled but EE_INVITATION_SERVICE failed to resolve. Falling back to CE.', e);
        }

        return ce;
      },
      inject: [ModuleRef, CeInvitationService],
    },
  ],
  exports: [CeInvitationService],
})
export class InvitationModule {}
