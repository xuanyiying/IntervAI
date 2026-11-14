import { CommonModule } from '@/common/common.module';
import {
  CacheControlMiddleware,
  PerformanceMiddleware,
  RequestSizeLimitMiddleware,
} from '@/common/middleware/performance.middleware';
import { RequestLoggingMiddleware } from '@/common/middleware/request-logging.middleware';
import { RedisModule } from '@/infrastructure/cache/redis.module';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { loggerConfig } from '@/infrastructure/logger/config/logger.config';
import { LoggerModule } from '@/infrastructure/logger/logger.module';
import { MonitoringModule } from '@/infrastructure/monitoring/monitoring.module';
import { EmailModule } from '@/infrastructure/notification/email.module';
import { AccountModule } from '@/modules/account/account.module';
import { PitchPerfectModule } from '@/modules/pitch-perfect/pitch-perfect.module';
import { AIModule } from '@/modules/ai/ai.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ChatModule } from '@/modules/chat/chat.module';
import { ConversationModule } from '@/modules/conversation/conversation.module';
import { HealthModule } from '@/modules/health/health.module';
import { InterviewModule } from '@/modules/interview/interview.module';
import { JobModule } from '@/modules/job/job.module';
import { QuotaModule } from '@/modules/quota/quota.module';
import { ResumeModule } from '@/modules/resume/resume.module';
import { StorageModule } from '@/modules/storage/storage.module';
import { UserModule } from '@/modules/user/user.module';
import { VoiceModule } from '@/modules/voice/voice.module';
import { BullModule } from '@nestjs/bull';
import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
    logger.error(
      'CRITICAL: Commercial edition requested but EeModule could not be loaded. Ensure that the "src/ee" directory is present and EeModule is correctly exported.'
    );
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
    InterviewModule,
    QuotaModule,
    MonitoringModule,
    EmailModule,
    AIModule,
    ChatModule,
    AccountModule,
    VoiceModule,
    PitchPerfectModule,
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
  providers: [
    AppService,
    // 全局限流守卫：所有路由默认 100 次 / 60 秒，个别端点可用 @Throttle 覆盖
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
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
