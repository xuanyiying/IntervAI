import { Module } from '@nestjs/common';
import { AlibabaVoiceService } from './services/voice.service';
import { StreamingAsrService } from './services/streaming-asr.service';
import { QwenRealtimeService } from './services/qwen-realtime.service';
import { SpeakerVerifyService } from './services/speaker-verify.service';
import { VoiceController } from './controllers/voice.controller';
import { PrismaModule } from '@/infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VoiceController],
  providers: [
    AlibabaVoiceService,
    StreamingAsrService,
    QwenRealtimeService,
    SpeakerVerifyService,
  ],
  exports: [
    AlibabaVoiceService,
    StreamingAsrService,
    QwenRealtimeService,
    SpeakerVerifyService,
  ],
})
export class VoiceModule {}
