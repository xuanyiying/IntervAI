import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@/shared/database/prisma.module';
import { RedisModule } from '@/shared/cache/redis.module';
import { HealthModule } from '@/core/health/health.module';
import { UserModule } from '@/core/user/user.module';
import { ResumeModule } from '@/features/resume/resume.module';
import { JobModule } from '@/features/job/job.module';
import { TasksModule } from '@/features/tasks/tasks.module';
import { InterviewModule } from '@/features/interview/interview.module';
import { CommonModule } from '@/common/common.module';
import { QuotaModule } from '@/core/quota/quota.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { MonitoringModule } from '@/shared/monitoring/monitoring.module';
import { ConversationModule } from '@/core/conversation/conversation.module';
import { EmailModule } from '@/shared/notification/email.module';
import { PaymentModule } from './core/payment/payment.module';
import { AIModule } from './core/ai/ai.module';
import { InvitationModule } from './core/invitation/invitation.module';
import { ChatModule } from '@/core/chat/chat.module';
import { JobSearchModule } from '@/features/job-search';
import { AccountModule } from '@/core/account/account.module';
import { VoiceModule } from '@/features/voice/voice.module';
import { loggerConfig } from '@/shared/logger/logger.config';
import {
  PerformanceMiddleware,
  CacheControlMiddleware,
  RequestSizeLimitMiddleware,
} from '@/common/middleware/performance.middleware';
import { RequestLoggingMiddleware } from '@/common/middleware/request-logging.middleware';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './core/auth/auth.module';
import { StorageModule } from '@/core/storage/storage.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    WinstonModule.forRoot(loggerConfig),
    LoggerModule,
    CommonModule,
    PrismaModule,
    RedisModule,
    HealthModule,
    UserModule,
    AuthModule,
    ConversationModule,
    ResumeModule,
    JobModule,
    StorageModule,
    TasksModule,
    InterviewModule,
    QuotaModule,
    MonitoringModule,
    EmailModule,
    PaymentModule,
    AIModule, // Unified AI module with skills system
    InvitationModule,
    ChatModule,
    JobSearchModule,
    AccountModule,
    VoiceModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
    consumer
      .apply(
        RequestSizeLimitMiddleware,
        PerformanceMiddleware,
        CacheControlMiddleware
      )
      .forRoutes('*');
  }
}
