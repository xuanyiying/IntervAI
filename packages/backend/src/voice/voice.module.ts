import { Module } from '@nestjs/common';
import { AlibabaVoiceService } from './voice.service';
import { VoiceController } from './voice.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VoiceController],
  providers: [AlibabaVoiceService],
  exports: [AlibabaVoiceService],
})
export class VoiceModule {}
