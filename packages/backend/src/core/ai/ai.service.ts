/**
 * AI Service
 * Unified AI service with simplified API
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from './providers/provider';
import { Models, getModelCost } from './models';
import {
  AIMessage,
  AIResult,
  ChatOptions,
  StreamOptions,
  EmbedOptions,
  AIError,
  AIErrorCode,
} from './types';
import { UsageTrackerService, UsageStats } from './utils/usage-tracker.service';
import { SkillRegistry, SkillContext, SkillResult } from './skills';

/**
 * Unified AI Service
 * Provides simplified access to AI capabilities
 */
@Injectable()
export class AIService implements OnModuleInit {
  private readonly logger = new Logger(AIService.name);
  private provider!: AIProvider;

  constructor(
    private configService: ConfigService,
    private skillRegistry: SkillRegistry,
    private usageTracker: UsageTrackerService
  ) { }

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing AI Service');

    this.provider = new AIProvider({
      openai: {
        apiKey: this.configService.get('OPENAI_API_KEY', ''),
      },
      deepseek: {
        apiKey: this.configService.get('DEEPSEEK_API_KEY', ''),
      },
      qwen: {
        apiKey: this.configService.get('QWEN_API_KEY', ''),
      },
      gemini: {
        apiKey: this.configService.get('GEMINI_API_KEY', ''),
      },
      ollama: {
        apiKey: 'ollama',
        baseUrl: this.configService.get('OLLAMA_BASE_URL', 'http://localhost:11434/v1'),
      },
      siliconcloud: {
        apiKey: this.configService.get('SILICONCLOUD_API_KEY', ''),
      },
    });

    const providers = this.provider.getProviderNames();
    this.logger.log(`Available providers: ${providers.join(', ')}`);

    this.logger.log('AI Service initialized');
  }

  /**
   * Chat completion
   */
  async chat(
    model: string,
    messages: AIMessage[],
    options?: ChatOptions
  ): Promise<AIResult> {
    const startTime = Date.now();
    const [provider, modelName] = this.parseModel(model);

    try {
      const response = await this.provider.chat(provider, modelName, messages, options);

      const cost = this.calculateCost(
        modelName,
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      );

      if (options?.userId) {
        await this.trackUsage({
          userId: options.userId,
          model: modelName,
          provider,
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          cost,
          latency: Date.now() - startTime,
          success: true,
        });
      }

      return {
        content: response.content,
        usage: {
          input: response.usage.prompt_tokens,
          output: response.usage.completion_tokens,
        },
        model: modelName,
        provider,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const err = error as Error;

      this.logger.error(`Chat failed: ${err.message}`);

      if (options?.userId) {
        await this.trackUsage({
          userId: options.userId,
          model: modelName,
          provider,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          latency,
          success: false,
          errorMessage: err.message,
        });
      }

      throw error;
    }
  }

  /**
   * Stream chat completion
   */
  async *stream(
    model: string,
    messages: AIMessage[],
    options?: StreamOptions
  ): AsyncGenerator<string> {
    const [provider, modelName] = this.parseModel(model);

    try {
      for await (const chunk of this.provider.stream(provider, modelName, messages, options)) {
        if (options?.onChunk) {
          options.onChunk(chunk);
        }
        yield chunk;
      }
    } catch (error) {
      this.logger.error(
        `Stream failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Stream from a single prompt
   */
  async *streamPrompt(
    prompt: string,
    options?: StreamOptions & { model?: string }
  ): AsyncGenerator<string> {
    const model = options?.model || Models.Chat;
    yield* this.stream(model, [{ role: 'user', content: prompt }], options);
  }

  /**
   * Generate embedding
   */
  async embed(
    model: string,
    text: string,
    options?: EmbedOptions
  ): Promise<number[]> {
    const [provider, modelName] = this.parseModel(model);

    try {
      const embedding = await this.provider.embed(provider, modelName, text);
      return embedding;
    } catch (error) {
      this.logger.error(
        `Embedding failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Generate completion from system and user prompts
   */
  async generate(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    options?: ChatOptions
  ): Promise<string> {
    const result = await this.chat(
      model,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options
    );
    return result.content;
  }

  /**
   * Execute a skill by name
   */
  async executeSkill(name: string, inputs: Record<string, any>, userId: string): Promise<SkillResult> {
    const ctx: SkillContext = {
      ai: this,
      inputs,
      userId,
    };

    return this.skillRegistry.execute(name, ctx);
  }

  /**
   * Get list of available skills
   */
  getSkills(): Array<{ name: string; description: string; version: string }> {
    return this.skillRegistry.getDefinitions().map((def) => ({
      name: def.name,
      description: def.description,
      version: def.version,
    }));
  }

  /**
   * Check if a skill exists
   */
  hasSkill(name: string): boolean {
    return this.skillRegistry.has(name);
  }

  /**
   * Check if a provider is available
   */
  hasProvider(provider: string): boolean {
    return this.provider.hasProvider(provider);
  }

  /**
   * Get available providers
   */
  getProviders(): string[] {
    return this.provider.getProviderNames();
  }

  /**
   * Get providers that are not in circuit open state
   */
  getAvailableProviders(): string[] {
    return this.provider.getAvailableProviders();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const provider of this.provider.getProviderNames()) {
      results[provider] = await this.provider.healthCheck(provider);
    }
    return results;
  }

  /**
   * Get provider statistics
   */
  getProviderStats(provider: string): { circuitState: string; availableTokens: number } | null {
    return this.provider.getProviderStats(provider);
  }

  /**
   * Reset circuit breaker for a provider
   */
  resetCircuitBreaker(provider: string): void {
    this.provider.resetCircuitBreaker(provider);
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageStats> {
    return this.usageTracker.getUsageStats(userId, startDate, endDate);
  }

  /**
   * Get daily usage
   */
  async getDailyUsage(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; calls: number; tokens: number; cost: number }>> {
    return this.usageTracker.getDailyUsage(userId, startDate, endDate);
  }

  /**
   * Get model usage breakdown
   */
  async getModelUsage(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, { calls: number; tokens: number; cost: number }>> {
    return this.usageTracker.getModelUsage(userId, startDate, endDate);
  }

  /**
   * Get monthly cost
   */
  async getMonthlyCost(userId: string, year: number, month: number): Promise<number> {
    return this.usageTracker.getMonthlyCost(userId, year, month);
  }

  // Private methods

  private parseModel(model: string): [string, string] {
    const idx = model.indexOf(':');
    if (idx === -1) {
      throw new AIError(
        AIErrorCode.INVALID_REQUEST,
        `Invalid model format: ${model}. Expected "provider:model"`,
        undefined,
        false
      );
    }
    return [model.slice(0, idx), model.slice(idx + 1)];
  }

  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costs = getModelCost(model);
    return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
  }

  private async trackUsage(record: {
    userId: string;
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    latency: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await this.usageTracker.trackUsage(record);
    } catch (error) {
      this.logger.warn(
        `Failed to track usage: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
