import { Module, Logger } from '@nestjs/common';
import { InvitationService as CeInvitationService } from './invitation.service';
import { PrismaModule } from '@/shared/database/prisma.module';
import { RedisModule } from '@/shared/cache/redis.module';
import { PrismaService } from '@/shared/database/prisma.service';
import { RedisService } from '@/shared/cache/redis.service';

const logger = new Logger('InvitationModuleProxy');

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    {
      provide: CeInvitationService,
      useFactory: (prisma: PrismaService, redis: RedisService) => {
        const isEE = process.env.APP_EDITION !== 'oss';
        if (isEE) {
          try {
            /* eslint-disable @typescript-eslint/no-var-requires */
            const { InvitationService: EeInvitationService } = require('../../ee/invitation/invitation.service');
            logger.log('EE InvitationService active');
            return new EeInvitationService(prisma, redis);
          } catch (e) {
            logger.warn('Failed to load EE InvitationService, falling back to CE');
            return new CeInvitationService();
          }
        }
        return new CeInvitationService();
      },
      inject: [PrismaService, RedisService],
    },
  ],
  exports: [CeInvitationService],
})
export class InvitationModule {}
