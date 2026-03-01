import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupTask } from './cleanup.task';
import { StorageModule } from '@/core/storage/storage.module';
import { RedisModule } from '@/shared/cache/redis.module';
import { BackupModule } from '@/core/backup/backup.module';
import { ResumeModule } from '@/features/resume/resume.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ResumeModule,
    StorageModule,
    RedisModule,
    BackupModule,
  ],
  providers: [CleanupTask],
})
export class TasksModule {}
