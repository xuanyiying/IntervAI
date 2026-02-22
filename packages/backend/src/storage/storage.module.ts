import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { DirectUploadService } from './direct-upload.service';
import { ChunkUploadSessionService } from './services/chunk-upload-session.service';
import { OssConfigService } from './config/oss.config';
import { OssFactory } from './providers/oss.factory';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/redis/redis.module';
import { FILE_UPLOAD_CONFIG } from '@/common/validators/file-upload.validator';

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
