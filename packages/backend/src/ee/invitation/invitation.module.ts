import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { PrismaModule } from '@/shared/database/prisma.module';
import { RedisModule } from '@/shared/cache/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [InvitationController],
  providers: [
    InvitationService,
    { provide: 'EE_INVITATION_SERVICE', useExisting: InvitationService },
  ],
  exports: [InvitationService, 'EE_INVITATION_SERVICE'],
})
export class InvitationModule {}
