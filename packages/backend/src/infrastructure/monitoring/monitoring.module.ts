import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { MonitoringService } from './services/monitoring.service';
import { MetricsService } from './services/metrics.service';
import { AlertingService } from './services/alerting.service';
import { MetricsController } from './controllers/metrics.controller';
import { AlertingController } from './controllers/alerting.controller';
import { MonitoringInterceptor } from './interceptors/monitoring.interceptor';
import { MonitoringExceptionFilter } from './filters/monitoring.filter';
import { MonitoringGuard } from './guards/monitoring.guard';
import { PrismaModule } from '@/infrastructure/database/prisma.module';

/**
 * Monitoring Module
 * Requirement 10.5, 12.6: Application Performance Monitoring, Error Tracking, Alerting
 * Provides APM, metrics collection, error tracking, and alerting capabilities
 */
@Module({
  imports: [WinstonModule, PrismaModule],
  controllers: [MetricsController, AlertingController],
  providers: [
    MonitoringService,
    MetricsService,
    AlertingService,
    MonitoringInterceptor,
    MonitoringExceptionFilter,
    MonitoringGuard,
  ],
  exports: [
    MonitoringService,
    MetricsService,
    AlertingService,
    MonitoringInterceptor,
    MonitoringExceptionFilter,
    MonitoringGuard,
  ],
})
export class MonitoringModule {}
