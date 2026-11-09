/**
 * AI Module - Index file
 * Exports all AI module components and types
 */

// Core services
export { AIService } from './services/ai.service';
export * from './services/degradation.service';

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
} from './interfaces/types';

// Models
export { PROVIDER_BASE_URLS } from './constants/models';

// Provider
export { AIProvider, ProviderClient } from './adapters/provider';

// Memory
export {
  Memory,
  MemoryProvider,
  RedisMemory,
  RedisMemoryProvider,
  InMemoryMemory,
} from './memory/redis-memory';

// AIEngine - backward compatible facade
export { AIEngine } from './services/ai.engine';

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
export { Skill, SkillContext } from './interfaces/skill.interface';
