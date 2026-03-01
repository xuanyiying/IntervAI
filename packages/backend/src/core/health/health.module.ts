import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { MonitoringModule } from '@/shared/monitoring/monitoring.module';

@Module({
  imports: [MonitoringModule],
  controllers: [HealthController],
})
export class HealthModule {}
