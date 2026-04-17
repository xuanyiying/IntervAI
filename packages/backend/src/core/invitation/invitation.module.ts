import { RedisModule } from '@/shared/cache/redis.module';
import { PrismaModule } from '@/shared/database/prisma.module';
import { Logger, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InvitationService as CeInvitationService } from './invitation.service';

const logger = new Logger('InvitationModuleProxy');

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    {
      provide: 'INVITATION_SERVICE',
      useClass: CeInvitationService,
    },
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
          logger.error(
            'CRITICAL: EE Edition enabled but EE_INVITATION_SERVICE failed to resolve. Falling back to CE.',
            e
          );
        }

        return ce;
      },
      inject: [ModuleRef, 'INVITATION_SERVICE'],
    },
  ],
  exports: [CeInvitationService],
})
export class InvitationModule {}
