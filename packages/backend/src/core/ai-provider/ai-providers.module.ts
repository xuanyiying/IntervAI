/**
 * AI Providers Module
 * NestJS module for AI provider integration
 * Requirements: 2.1, 2.2
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { ModelConfigService } from './config';
import { PromptTemplateManager } from '@/core/ai-provider/config';
import { PromptVersionManager } from '@/core/ai-provider/config';
import { AIProviderFactory } from '@/core/ai-provider/factory';
import { UsageTrackerService } from '@/core/ai-provider/tracking';
import { PerformanceMonitorService } from '@/core/ai-provider/monitoring';
import { SecurityService } from '@/core/ai-provider/security';
import { AILogger } from '@/core/ai-provider/logging/ai-logger';
import { AIEngineService } from '@/core/ai-provider/ai-engine.service';
import { AIController } from '@/core/ai-provider/ai.controller';
import { PromptAdminController } from '@/core/ai-provider/prompt-admin.controller';
import { ModelAdminController } from '@/core/ai-provider/model-admin.controller';
import { EncryptionService } from './utils/encryption.service';
import { PrismaModule } from '@/shared/database/prisma.module';
import { loggerConfig } from '@/shared/logger/logger.config';
import {
  ScenarioModelMappingService,
  ModelRegistry,
  ModelSelector,
  StrategyConfig,
  DEFAULT_STRATEGY_CONFIG,
} from '@/core/ai-provider/selector';

@Module({
  imports: [ConfigModule, PrismaModule, WinstonModule.forRoot(loggerConfig)],
  controllers: [AIController, PromptAdminController, ModelAdminController],
  providers: [
    ModelConfigService,
    AIProviderFactory,
    PromptTemplateManager,
    PromptVersionManager,
    UsageTrackerService,
    PerformanceMonitorService,
    SecurityService,
    AILogger,
    ScenarioModelMappingService,
    ModelRegistry,
    ModelSelector,
    {
      provide: StrategyConfig,
      useValue: DEFAULT_STRATEGY_CONFIG,
    },
    AIEngineService,
    EncryptionService,
  ],
  exports: [
    ModelConfigService,
    AIProviderFactory,
    PromptTemplateManager,
    PromptVersionManager,
    UsageTrackerService,
    PerformanceMonitorService,
    SecurityService,
    AILogger,
    ScenarioModelMappingService,
    ModelRegistry,
    ModelSelector,
    StrategyConfig,
    AIEngineService,
    EncryptionService,
  ],
})
export class AIProvidersModule {}
