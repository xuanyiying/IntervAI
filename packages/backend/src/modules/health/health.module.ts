import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { MonitoringModule } from '@/infrastructure/monitoring/monitoring.module';

@Module({
  imports: [MonitoringModule],
  controllers: [HealthController],
})
export class HealthModule {}
