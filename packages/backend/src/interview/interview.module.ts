import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { AIProvidersModule } from '../ai-providers/ai-providers.module';
import { RedisModule } from '../redis/redis.module';
import { QuotaModule } from '../quota/quota.module';
import { InterviewQuestionService } from './services/interview-question.service';
import { InterviewSessionService } from './services/interview-session.service';
import { AnswerEvaluationService } from './services/answer-evaluation.service';
import { EvaluationProcessor } from './processors/evaluation.processor';

@Module({
  imports: [
    PrismaModule,
    AIModule,
    AIProvidersModule,
    RedisModule,
    QuotaModule,
    BullModule.registerQueue({
      name: 'interview-evaluation',
    }),
  ],
  providers: [
    InterviewService,
    InterviewQuestionService,
    InterviewSessionService,
    AnswerEvaluationService,
    EvaluationProcessor,
  ],
  controllers: [InterviewController],
  exports: [InterviewService],
})
export class InterviewModule {}
