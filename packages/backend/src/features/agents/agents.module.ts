import { Module } from '@nestjs/common';
import { AIModule } from '@/core/ai/ai.module';
import { PitchPerfectService } from './services/pitch-perfect.service';
import { PitchPerfectController } from './controllers/pitch-perfect.controller';
import { CareerToolsService } from './services/career-tools.service';
import { CareerToolsController } from './controllers/career-tools.controller';

@Module({
  imports: [AIModule],
  controllers: [PitchPerfectController, CareerToolsController],
  providers: [PitchPerfectService, CareerToolsService],
  exports: [PitchPerfectService, CareerToolsService],
})
export class AgentsModule {}
