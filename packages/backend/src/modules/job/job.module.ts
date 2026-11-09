import { Module } from '@nestjs/common';
import { JobService } from './services/job.service';
import { JobController } from './controllers/job.controller';
import { JobAIService } from './services/job-ai.service';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { AIModule } from '@/modules/ai/ai.module';

@Module({
  imports: [PrismaModule, AIModule],
  providers: [JobService, JobAIService],
  controllers: [JobController],
  exports: [JobService, JobAIService],
})
export class JobModule {}
