/**
 * AI Module - Index file
 * Exports all AI module components and types
 */

// Core services
export { AIService } from './ai.service';
export * from './degradation.service';

// Module
export * from './ai.module';

// Types
export {
  AIMessage,
  AIResult,
  ChatOptions,
  StreamOptions,
  EmbedOptions,
  AIError,
  AIErrorCode,
  UsageRecord,
  ModelInfo,
  ProviderConfig,
} from './types';

// Models
export { Models, getModelCost, PROVIDER_BASE_URLS } from './models';

// Provider
export { AIProvider, ProviderClient } from './providers/provider';

// Memory
export { Memory, MemoryProvider, RedisMemory, RedisMemoryProvider, InMemoryMemory } from './memory/redis-memory';

// AIEngine - backward compatible facade
export { AIEngine } from './ai.engine';

// Utils
export {
  retry,
  createRetryWrapper,
  CircuitBreaker,
  CircuitState,
  RateLimiter,
  UsageTrackerService,
  UsageStats,
  DailyUsage,
} from './utils';

// Skills
export { Skill, SkillContext } from './skills/skill.interface';
