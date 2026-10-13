import { Module } from '@nestjs/common';
import { AlibabaVoiceService } from './voice.service';
import { StreamingAsrService } from './streaming-asr.service';
import { QwenRealtimeService } from './qwen-realtime.service';
import { SpeakerVerifyService } from './speaker-verify.service';
import { VoiceController } from './voice.controller';
import { PrismaModule } from '@/shared/database/prisma.module';

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
