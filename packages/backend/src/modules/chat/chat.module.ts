/**
 * Chat Module
 * Provides unified WebSocket chat functionality
 */

import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatIntentService } from './services/chat-intent.service';
import { SceneAnalysisService } from './services/scene-analysis.service';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { AIModule } from '@/modules/ai/ai.module';
import { RedisModule } from '@/infrastructure/cache/redis.module';
import { ResumeModule } from '@/modules/resume/resume.module';

@Module({
  imports: [
    PrismaModule,
    AIModule,
    RedisModule,
    forwardRef(() => ResumeModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ChatGateway, ChatIntentService, SceneAnalysisService],
  exports: [ChatGateway, ChatIntentService, SceneAnalysisService],
})
export class ChatModule {}
