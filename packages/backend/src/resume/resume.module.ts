import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ResumeService } from './services/resume.service';
import { ResumeOptimizerService } from './services/resume-optimizer.service';
import { PdfGenerationService } from './services/pdf-generation.service';
import { MatchAnalysisService } from './services/match-analysis.service';
import { ResumeController } from './controllers/resume.controller';
import { ResumeOptimizerController } from './controllers/resume-optimizer.controller';
import { PdfGenerationController } from './controllers/pdf-generation.controller';
import { TemplatesController } from './controllers/templates.controller';
import { MatchAnalysisController } from './controllers/match-analysis.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { AIQueueModule } from '../ai/queue/ai-queue.module';
import { StorageModule } from '../storage/storage.module';
import { QuotaModule } from '../quota/quota.module';
import { AIProvidersModule } from '../ai-providers/ai-providers.module';
import { AgentModule } from '../agent/agent.module';
import { FILE_UPLOAD_CONFIG } from '@/common/validators/file-upload.validator';

@Module({
  imports: [
    PrismaModule,
    AIModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: FILE_UPLOAD_CONFIG.MAX_FILE_SIZE,
      },
    }),
    StorageModule,
    forwardRef(() => AIQueueModule),
    QuotaModule,
    AIProvidersModule,
    forwardRef(() => AgentModule),
  ],
  providers: [
    ResumeService,
    ResumeOptimizerService,
    PdfGenerationService,
    MatchAnalysisService,
  ],
  controllers: [
    ResumeController,
    ResumeOptimizerController,
    PdfGenerationController,
    TemplatesController,
    MatchAnalysisController,
  ],
  exports: [
    ResumeService,
    ResumeOptimizerService,
    PdfGenerationService,
    MatchAnalysisService,
  ],
})
export class ResumeModule {}
