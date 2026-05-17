import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { InterviewerPersonaController } from './interviewer-persona.controller';
import { InterviewAssistantController } from './interview-assistant.controller';
import { PrismaModule } from '@/shared/database/prisma.module';
import { AIModule } from '@/core/ai/ai.module';
import { PromptsModule } from '@/core/prompts/prompts.module';
import { RedisModule } from '@/shared/cache/redis.module';
import { QuotaModule } from '@/core/quota/quota.module';
import { VoiceModule } from '../voice/voice.module';
import { StorageModule } from '@/core/storage/storage.module';
import { ResumeModule } from '../resume/resume.module';
import { InterviewQuestionService } from './services/interview-question.service';
import { InterviewSessionService } from './services/interview-session.service';
import { InterviewerPersonaService } from './services/interviewer-persona.service';
import { InterviewGateway } from './interview.gateway';
import { RealtimeInterviewGateway } from './realtime-interview.gateway';
import { QuestionGeneratorService } from './services/question-generator.service';
import { AnswerEvaluationService } from './services/answer-evaluation.service';
import { EvaluationProcessor } from './processors/evaluation.processor';
import { InterviewReportService } from './services/interview-report.service';
import { InterviewAIService } from './services/interview-ai.service';

import { AuthModule } from '@/core/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AIModule,
    PromptsModule,
    RedisModule,
    QuotaModule,
    VoiceModule,
    StorageModule,
    AuthModule,
    ResumeModule,
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
    RealtimeInterviewGateway,
    QuestionGeneratorService,
    AnswerEvaluationService,
    EvaluationProcessor,
    InterviewReportService,
    InterviewAIService,
  ],
  controllers: [
    InterviewController,
    InterviewerPersonaController,
    InterviewAssistantController,
  ],
  exports: [InterviewService, InterviewerPersonaService, InterviewAIService],
})
export class InterviewModule {}
