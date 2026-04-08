import { CommonModule } from '@/common/common.module';
import {
  CacheControlMiddleware,
  PerformanceMiddleware,
  RequestSizeLimitMiddleware,
} from '@/common/middleware/performance.middleware';
import { RequestLoggingMiddleware } from '@/common/middleware/request-logging.middleware';
import { AccountModule } from '@/core/account/account.module';
import { ChatModule } from '@/core/chat/chat.module';
import { ConversationModule } from '@/core/conversation/conversation.module';
import { HealthModule } from '@/core/health/health.module';
import { QuotaModule } from '@/core/quota/quota.module';
import { UserModule } from '@/core/user/user.module';
import { AgentsModule } from '@/features/agents/agents.module';
import { InterviewModule } from '@/features/interview/interview.module';
import { JobSearchModule } from '@/features/job-search';
import { JobModule } from '@/features/job/job.module';
import { ResumeModule } from '@/features/resume/resume.module';
import { TasksModule } from '@/features/tasks/tasks.module';
import { VoiceModule } from '@/features/voice/voice.module';
import { RedisModule } from '@/shared/cache/redis.module';
import { PrismaModule } from '@/shared/database/prisma.module';
import { loggerConfig } from '@/shared/logger/logger.config';
import { LoggerModule } from '@/shared/logger/logger.module';
import { MonitoringModule } from '@/shared/monitoring/monitoring.module';
import { EmailModule } from '@/shared/notification/email.module';
import { BullModule } from '@nestjs/bull';
import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AIModule } from './core/ai/ai.module';

import { StorageModule } from '@/core/storage/storage.module';
import { AuthModule } from './core/auth/auth.module';

const isOSS = process.env.APP_EDITION === 'oss';
const logger = new Logger('AppModule');

/**
 * Robustly load Enterprise Edition module if available and requested.
 * Using require() here is necessary for compile-time exclusion of the EE directory in OSS builds.
 */
function getEeModule() {
  if (isOSS) return [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { EeModule } = require('./ee/ee.module');
    logger.log('Enterprise Edition detected and loaded');
    return [EeModule];
  } catch (error) {
    logger.error('CRITICAL: Commercial edition requested but EeModule could not be loaded. Ensure that the "src/ee" directory is present and EeModule is correctly exported.');
    return [];
  }
}

const dynamicEeModule = getEeModule();

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
    AIModule,
    ChatModule,
    JobSearchModule,
    AccountModule,
    VoiceModule,
    AgentsModule,
    ...dynamicEeModule,
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
