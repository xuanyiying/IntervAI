import { Module } from '@nestjs/common';
import { AIModule } from '@/modules/ai/ai.module';
import { PitchPerfectService } from './services/pitch-perfect.service';
import { PitchPerfectController } from './controllers/pitch-perfect.controller';

@Module({
  imports: [AIModule],
  controllers: [PitchPerfectController],
  providers: [PitchPerfectService],
  exports: [PitchPerfectService],
})
export class PitchPerfectModule {}
