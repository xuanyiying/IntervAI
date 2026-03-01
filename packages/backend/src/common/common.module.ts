import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { RolesGuard, AdminGuard } from './guards';
import { ValidationPipe } from './pipes/validation.pipe';
import { MonitoringModule } from '@/shared/monitoring/monitoring.module';
import { loggerConfig } from '@/shared/logger/logger.config';

@Global()
@Module({
  imports: [WinstonModule.forRoot(loggerConfig), MonitoringModule],
  providers: [
    HttpExceptionFilter,
    {
      provide: APP_FILTER,
      useExisting: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    RolesGuard,
    AdminGuard,
    ValidationPipe,
  ],
  exports: [HttpExceptionFilter, RolesGuard, AdminGuard, ValidationPipe],
})
export class CommonModule {}
