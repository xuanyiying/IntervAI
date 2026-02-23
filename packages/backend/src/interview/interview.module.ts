import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { InterviewerPersonaController } from './interviewer-persona.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { AIProvidersModule } from '../ai-providers/ai-providers.module';
import { RedisModule } from '../redis/redis.module';
import { QuotaModule } from '../quota/quota.module';
import { VoiceModule } from '../voice/voice.module';
import { StorageModule } from '../storage/storage.module';
import { InterviewQuestionService } from './services/interview-question.service';
import { InterviewSessionService } from './services/interview-session.service';
import { InterviewerPersonaService } from './services/interviewer-persona.service';
import { InterviewGateway } from './interview.gateway';
import { QuestionGeneratorService } from './services/question-generator.service';
import { AnswerEvaluationService } from './services/answer-evaluation.service';
import { EvaluationProcessor } from './processors/evaluation.processor';
import { InterviewReportService } from './services/interview-report.service';

import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AIModule,
    AIProvidersModule,
    RedisModule,
    QuotaModule,
    VoiceModule,
    StorageModule,
    AuthModule,
    BullModule.registerQueue({
      name: 'interview-evaluation',
    }),
  ],
  providers: [
    InterviewService,
    InterviewQuestionService,
    InterviewSessionService,
    InterviewerPersonaService,
    InterviewGateway,
    QuestionGeneratorService,
    AnswerEvaluationService,
    EvaluationProcessor,
    InterviewReportService,
  ],
  controllers: [InterviewController, InterviewerPersonaController],
  exports: [InterviewService, InterviewerPersonaService],
})
export class InterviewModule {}
