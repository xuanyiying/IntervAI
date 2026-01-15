import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupTask } from './cleanup.task';
import { ResumeModule } from '../resume/resume.module';
import { StorageModule } from '../storage/storage.module';
import { RedisModule } from '../redis/redis.module';
import { BackupModule } from '../backup/backup.module';

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
