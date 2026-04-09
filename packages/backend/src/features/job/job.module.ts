import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { JobAIService } from './job-ai.service';
import { PrismaModule } from '@/shared/database/prisma.module';
import { AIModule } from '../../core/ai/ai.module';

@Module({
  imports: [PrismaModule, AIModule],
  providers: [JobService, JobAIService],
  controllers: [JobController],
  exports: [JobService, JobAIService],
})
export class JobModule {}
