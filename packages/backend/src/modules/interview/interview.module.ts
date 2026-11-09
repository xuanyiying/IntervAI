import { Module } from '@nestjs/common';
import { InterviewService } from './services/interview.service';
import { InterviewController } from './controllers/interview.controller';
import { InterviewerPersonaController } from './controllers/interviewer-persona.controller';
import { InterviewVoiceprintController } from './controllers/interview-voiceprint.controller';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { AIModule } from '@/modules/ai/ai.module';
import { PromptsModule } from '@/modules/prompts/prompts.module';
import { RedisModule } from '@/infrastructure/cache/redis.module';
import { QuotaModule } from '@/modules/quota/quota.module';
import { VoiceModule } from '@/modules/voice/voice.module';
import { StorageModule } from '@/modules/storage/storage.module';
import { ResumeModule } from '@/modules/resume/resume.module';
import { InterviewQuestionService } from './services/interview-question.service';
import { InterviewSessionService } from './services/interview-session.service';
import { InterviewerPersonaService } from './services/interviewer-persona.service';
import { InterviewGateway } from './gateways/interview.gateway';
import { RealtimeInterviewGateway } from './gateways/realtime-interview.gateway';
import { QuestionGeneratorService } from './services/question-generator.service';
import { InterviewReportService } from './services/interview-report.service';
import { InterviewAIService } from './services/interview-ai.service';

import { AuthModule } from '@/modules/auth/auth.module';

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
  ],
  providers: [
    InterviewService,
    InterviewQuestionService,
    InterviewSessionService,
    InterviewerPersonaService,
    InterviewGateway,
    RealtimeInterviewGateway,
    QuestionGeneratorService,
    InterviewReportService,
    InterviewAIService,
  ],
  controllers: [
    InterviewController,
    InterviewerPersonaController,
    InterviewVoiceprintController,
  ],
  exports: [InterviewService, InterviewerPersonaService, InterviewAIService],
})
export class InterviewModule {}
