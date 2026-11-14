import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserService } from './services/user.service';
import {
  UserController,
  UserHistoryController,
} from './controllers/user.controller';
import { UserNotificationsController } from './controllers/user-notifications.controller';
import { AdminController } from './controllers/admin.controller';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { EmailModule } from '@/infrastructure/notification/email.module';
import { InvitationModule } from '@/modules/invitation/invitation.module';
import { RedisModule } from '@/infrastructure/cache/redis.module';
import { AuthModule } from '@/modules/auth/auth.module';

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
export class UserModule {}
