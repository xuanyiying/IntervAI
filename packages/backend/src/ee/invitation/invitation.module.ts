import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { PrismaModule } from '@/shared/database/prisma.module';
import { RedisModule } from '@/shared/cache/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [InvitationController],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {}
