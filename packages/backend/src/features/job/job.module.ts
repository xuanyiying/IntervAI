import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { PrismaModule } from '@/shared/database/prisma.module';
import { AIModule } from '../../core/ai/ai.module';

@Module({
  imports: [PrismaModule, AIModule],
  providers: [JobService],
  controllers: [JobController],
  exports: [JobService],
})
export class JobModule {}
