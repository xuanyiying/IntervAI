import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageController } from './controllers/storage.controller';
import { StorageService } from './services/storage.service';
import { DirectUploadService } from './services/direct-upload.service';
import { ChunkUploadSessionService } from './services/chunk-upload-session.service';
import { OssConfigService } from './config/oss.config';
import { OssFactory } from './adapters/oss.factory';

import { FILE_UPLOAD_CONFIG } from '@/common/validators/file-upload.validator';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { RedisModule } from '@/infrastructure/cache/redis.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: FILE_UPLOAD_CONFIG.MAX_FILE_SIZE,
      },
    }),
  ],
  controllers: [StorageController],
  providers: [
    StorageService,
    DirectUploadService,
    ChunkUploadSessionService,
    OssConfigService,
    OssFactory,
  ],
  exports: [StorageService, DirectUploadService, OssConfigService],
})
export class StorageModule {}
