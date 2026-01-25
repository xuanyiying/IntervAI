import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { AIProvidersModule } from '../ai-providers/ai-providers.module';
import { RedisModule } from '../redis/redis.module';
import { QuotaModule } from '../quota/quota.module';
import { VoiceModule } from '../voice/voice.module';
import { InterviewQuestionService } from './services/interview-question.service';
import { InterviewSessionService } from './services/interview-session.service';
import { InterviewGateway } from './interview.gateway';
import { QuestionGeneratorService } from './services/question-generator.service';
import { AnswerEvaluationService } from './services/answer-evaluation.service';
import { EvaluationProcessor } from './processors/evaluation.processor';

@Module({
  imports: [
    PrismaModule,
    AIModule,
    AIProvidersModule,
    RedisModule,
    QuotaModule,
    VoiceModule,
    BullModule.registerQueue({
      name: 'interview-evaluation',
    }),
  ],
  providers: [
    InterviewService,
    InterviewQuestionService,
    InterviewSessionService,
    InterviewGateway,
    QuestionGeneratorService,
    AnswerEvaluationService,
    EvaluationProcessor,
  ],
  controllers: [InterviewController],
  exports: [InterviewService],
})
export class InterviewModule {}
