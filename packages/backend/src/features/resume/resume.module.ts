import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ResumeService } from './services/resume.service';
import { ResumeOptimizerService } from './services/resume-optimizer.service';
import { PdfGenerationService } from './services/pdf-generation.service';
import { MatchAnalysisService } from './services/match-analysis.service';
import { ResumeParserService } from './services/resume-parser.service';
import { ResumeAIService } from './services/resume-ai.service';
import { ResumeController } from './controllers/resume.controller';
import { ResumeOptimizerController } from './controllers/resume-optimizer.controller';
import { PdfGenerationController } from './controllers/pdf-generation.controller';
import { TemplatesController } from './controllers/templates.controller';
import { MatchAnalysisController } from './controllers/match-analysis.controller';
import { PrismaModule } from '@/shared/database/prisma.module';
import { AIModule } from '@/core/ai/ai.module';
import { AIQueueModule } from '@/core/ai/queue/ai-queue.module';
import { StorageModule } from '@/core/storage/storage.module';
import { QuotaModule } from '@/core/quota/quota.module';
import { FILE_UPLOAD_CONFIG } from '@/common/validators/file-upload.validator';
import { BullModule } from '@nestjs/bull';
import { PdfProcessor } from './processors/pdf.processor';

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
    BullModule.registerQueue({
      name: 'pdf_queue',
    }),
  ],
  providers: [
    ResumeService,
    ResumeOptimizerService,
    PdfGenerationService,
    MatchAnalysisService,
    ResumeParserService,
    ResumeAIService,
    PdfProcessor,
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
    MatchAnalysisService,
    PdfGenerationService,
    ResumeParserService,
    ResumeAIService,
  ],
})
export class ResumeModule {}
