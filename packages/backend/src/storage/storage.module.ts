import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { DirectUploadService } from './direct-upload.service';
import { ChunkUploadSessionService } from './services/chunk-upload-session.service';
import { OssConfigService } from './config/oss.config';
import { OssFactory } from './providers/oss.factory';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
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
