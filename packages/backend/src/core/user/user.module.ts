import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserService } from './user.service';
import { UserController, UserHistoryController } from './user.controller';
import { UserNotificationsController } from './user-notifications.controller';
import { AdminController } from './admin.controller';
import { PrismaModule } from '@/shared/database/prisma.module';
import { EmailModule } from '@/shared/notification/email.module';
import { InvitationModule } from '@/core/invitation/invitation.module';
import { RedisModule } from '@/shared/cache/redis.module';
import { AuthModule } from '@/core/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    InvitationModule,
    RedisModule,
    ConfigModule,
    AuthModule,
  ],
  controllers: [
    UserController,
    UserHistoryController,
    UserNotificationsController,
    AdminController,
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
