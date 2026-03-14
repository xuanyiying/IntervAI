import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { DegradationService } from './degradation.service';
import { RedisModule } from '@/shared/cache/redis.module';
import { PrismaModule } from '@/shared/database/prisma.module';
import { AIEngine } from './ai.engine';

// Utils
import { UsageTrackerService } from './utils/usage-tracker.service';

// Skills Engine
import {
  SkillRegistry,
  SkillLoader,
  SkillMarkdownParser,
  SkillInstallerService,
} from './skills';

/**
 * AI Module
 * Simplified AI module with unified AIService and skill engine
 *
 * Architecture:
 * - AIService: Unified AI service with multi-provider support
 *   - Supports 6 AI providers: OpenAI, DeepSeek, Qwen, Gemini, Ollama, SiliconCloud
 *   - Simple model configuration via environment variables
 *   - Built-in retry logic with circuit breaker
 *   - Rate limiting per provider
 *   - Skill extension system
 *   - Usage tracking and cost monitoring
 *
 * - DegradationService: Provides fallback when AI services are unavailable
 *
 * - AIEngine: Backward-compatible facade that uses AIService internally
 *
 * - UsageTrackerService: Tracks AI usage for cost monitoring and analytics
 *
 * - SkillRegistry: Central registry for all skills
 * - SkillLoader: Loads skills from directories and files
 * - SkillMarkdownParser: Parses Markdown skill definitions
 * - SkillInstallerService: Install skills from network sources
 *
 * Skills Directory Structure:
 * - skills/                    # User skills directory
 *   ├── resume-analyzer.md     # Markdown skill definition
 *   ├── jd-matcher.md
 *   └── ...
 * - skills/builtin/            # Built-in skills
 *   └── ...
 *
 * Production Features:
 * - Circuit breaker pattern for fault tolerance
 * - Token bucket rate limiting
 * - Exponential backoff retry with jitter
 * - Usage tracking with database persistence
 * - Redis caching for usage statistics
 * - Markdown-based skill definitions
 * - Network skill installation
 */
@Global()
@Module({
  imports: [ConfigModule, RedisModule, PrismaModule],
  providers: [
    // Core AI services
    AIService,
    DegradationService,
    AIEngine,

    // Usage tracking
    UsageTrackerService,

    // Skills Engine
    SkillRegistry,
    SkillMarkdownParser,
    SkillLoader,
    SkillInstallerService,
  ],
  exports: [
    AIService,
    DegradationService,
    AIEngine,
    UsageTrackerService,
    // Skills Engine
    SkillRegistry,
    SkillLoader,
    SkillInstallerService,
  ],
})
export class AIModule implements OnModuleInit {
  constructor(private readonly skillLoader: SkillLoader) { }

  async onModuleInit(): Promise<void> {
    // Initialize skill loader
    await this.skillLoader.initialize();
  }
}
