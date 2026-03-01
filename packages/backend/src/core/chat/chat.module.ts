/**
 * Chat Module
 * Provides unified WebSocket chat functionality
 */

import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatIntentService } from './chat-intent.service';
import { SceneAnalysisService } from './scene-analysis.service';
import { PrismaModule } from '@/shared/database/prisma.module';
import { AIProvidersModule } from '@/core/ai-provider/ai-providers.module';
import { RedisModule } from '@/shared/cache/redis.module';
import { ResumeModule } from '@/features/resume/resume.module';
import { AgentModule } from '@/core/agent/agent.module';

@Module({
  imports: [
    PrismaModule,
    AIProvidersModule,
    RedisModule,
    forwardRef(() => ResumeModule),
    forwardRef(() => AgentModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
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
