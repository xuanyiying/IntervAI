import { Module } from '@nestjs/common';
import { PrismaModule } from '@/shared/database/prisma.module';
import { AIModule } from '@/core/ai/ai.module';
import { RedisModule } from '@/shared/cache/redis.module';
import { QuotaModule } from '@/core/quota/quota.module';
import { VoiceModule } from '../voice/voice.module';
import { StorageModule } from '@/core/storage/storage.module';
import { AuthModule } from '@/core/auth/auth.module';
import { RealtimeInterviewService } from './services/realtime-interview.service';
import { RealtimeInterviewController } from './realtime-interview.controller';
import { RealtimeInterviewGateway } from './realtime-interview.gateway';

@Module({
  imports: [
    PrismaModule,
    AIModule,
    RedisModule,
    QuotaModule,
    VoiceModule,
    StorageModule,
    AuthModule,
  ],
  providers: [RealtimeInterviewService, RealtimeInterviewGateway],
  controllers: [RealtimeInterviewController],
  exports: [RealtimeInterviewService],
})
export class RealtimeInterviewModule {}
