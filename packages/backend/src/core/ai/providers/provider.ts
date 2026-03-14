/**
 * AI Provider
 * Unified provider implementation using OpenAI SDK
 * All providers use OpenAI-compatible API
 */

import OpenAI from 'openai';
import { Logger } from '@nestjs/common';
import { PROVIDER_BASE_URLS, DefaultParams } from '../models';
import { AIError, AIErrorCode, AIMessage, ChatOptions, ProviderConfig } from '../types';
import { retry } from '../utils/retry';
import { CircuitBreaker } from '../utils/circuit-breaker';
import { RateLimiter } from '../utils/rate-limiter';

export interface ProviderClient {
  name: string;
  client: OpenAI;
  circuitBreaker: CircuitBreaker;
  rateLimiter: RateLimiter;
}

/**
 * Unified AI Provider
 * Manages OpenAI clients for different providers with circuit breaker and rate limiting
 */
export class AIProvider {
  private readonly logger = new Logger(AIProvider.name);
  private clients: Map<string, ProviderClient> = new Map();

  constructor(configs: Record<string, ProviderConfig>) {
    for (const [name, cfg] of Object.entries(configs)) {
      if (cfg.apiKey) {
        const baseUrl = cfg.baseUrl || PROVIDER_BASE_URLS[name];
        if (!baseUrl) {
          this.logger.warn(`No base URL for provider ${name}, skipping`);
          continue;
        }

        const client = new OpenAI({
          apiKey: cfg.apiKey,
          baseURL: baseUrl,
          timeout: cfg.timeout || DefaultParams.timeout,
          maxRetries: 2,
        });

        const circuitBreaker = new CircuitBreaker(name, {
          failureThreshold: 5,
          successThreshold: 3,
          resetTimeout: 60000,
        });

        const rateLimiter = new RateLimiter(name, {
          tokensPerSecond: cfg.rateLimit?.tokensPerSecond || 10,
          maxTokens: cfg.rateLimit?.maxTokens || 100,
        });

        this.clients.set(name, {
          name,
          client,
          circuitBreaker,
          rateLimiter,
        });

        this.logger.log(`Initialized provider: ${name}`);
      }
    }
  }

  /**
   * Get provider client
   */
  getProviderClient(provider: string): ProviderClient {
    const pc = this.clients.get(provider);
    if (!pc) {
      throw new AIError(
        AIErrorCode.PROVIDER_UNAVAILABLE,
        `Provider ${provider} not configured`,
        undefined,
        false
      );
    }
    return pc;
  }

  /**
   * Get OpenAI client for a provider
   */
  getClient(provider: string): OpenAI {
    return this.getProviderClient(provider).client;
  }

  /**
   * Check if a provider is available
   */
  hasProvider(provider: string): boolean {
    const pc = this.clients.get(provider);
    if (!pc) return false;
    return !pc.circuitBreaker.isOpen();
  }

  /**
   * Get list of configured providers
   */
  getProviderNames(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Get available providers (not in circuit open state)
   */
  getAvailableProviders(): string[] {
    return Array.from(this.clients.entries())
      .filter(([_, pc]) => !pc.circuitBreaker.isOpen())
      .map(([name]) => name);
  }

  /**
   * Chat completion
   */
  async chat(
    provider: string,
    model: string,
    messages: AIMessage[],
    options?: ChatOptions
  ): Promise<{ content: string; usage: { prompt_tokens: number; completion_tokens: number } }> {
    const pc = this.getProviderClient(provider);

    if (pc.circuitBreaker.isOpen()) {
      throw new AIError(
        AIErrorCode.PROVIDER_UNAVAILABLE,
        `Provider ${provider} circuit breaker is open`,
        undefined,
        false
      );
    }

    if (!pc.rateLimiter.consume()) {
      const waitTime = pc.rateLimiter.getWaitTime();
      throw new AIError(
        AIErrorCode.RATE_LIMIT,
        `Rate limit exceeded for ${provider}. Retry after ${waitTime}ms`,
        undefined,
        true
      );
    }

    return this.executeWithRetry(pc, async () => {
      const response = await pc.client.chat.completions.create({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? DefaultParams.temperature,
        max_tokens: options?.maxTokens ?? DefaultParams.maxTokens,
        top_p: options?.topP ?? DefaultParams.topP,
        stop: options?.stopSequences,
        response_format: options?.responseFormat,
        stream: false,
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        throw new AIError(
          AIErrorCode.UNKNOWN_ERROR,
          'Empty response from AI',
          undefined,
          true
        );
      }

      pc.circuitBreaker.recordSuccess();

      return {
        content: choice.message.content,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
        },
      };
    });
  }

  /**
   * Stream chat completion
   */
  async *stream(
    provider: string,
    model: string,
    messages: AIMessage[],
    options?: ChatOptions
  ): AsyncGenerator<string> {
    const pc = this.getProviderClient(provider);

    if (pc.circuitBreaker.isOpen()) {
      throw new AIError(
        AIErrorCode.PROVIDER_UNAVAILABLE,
        `Provider ${provider} circuit breaker is open`,
        undefined,
        false
      );
    }

    if (!pc.rateLimiter.consume()) {
      const waitTime = pc.rateLimiter.getWaitTime();
      throw new AIError(
        AIErrorCode.RATE_LIMIT,
        `Rate limit exceeded for ${provider}. Retry after ${waitTime}ms`,
        undefined,
        true
      );
    }

    try {
      const stream = await pc.client.chat.completions.create({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? DefaultParams.temperature,
        max_tokens: options?.maxTokens ?? DefaultParams.maxTokens,
        top_p: options?.topP ?? DefaultParams.topP,
        stop: options?.stopSequences,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }

      pc.circuitBreaker.recordSuccess();
    } catch (error) {
      pc.circuitBreaker.recordFailure();
      this.mapAndThrowError(error, provider);
    }
  }

  /**
   * Generate embedding
   */
  async embed(
    provider: string,
    model: string,
    text: string
  ): Promise<number[]> {
    const pc = this.getProviderClient(provider);

    if (pc.circuitBreaker.isOpen()) {
      throw new AIError(
        AIErrorCode.PROVIDER_UNAVAILABLE,
        `Provider ${provider} circuit breaker is open`,
        undefined,
        false
      );
    }

    return this.executeWithRetry(pc, async () => {
      const response = await pc.client.embeddings.create({
        model,
        input: text,
      });

      pc.circuitBreaker.recordSuccess();

      return response.data[0].embedding;
    });
  }

  /**
   * Health check for a provider
   */
  async healthCheck(provider: string): Promise<boolean> {
    try {
      const pc = this.getProviderClient(provider);
      await pc.client.models.list();
      return true;
    } catch (error) {
      this.logger.warn(
        `Health check failed for ${provider}: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  /**
   * Get provider stats
   */
  getProviderStats(provider: string): {
    circuitState: string;
    availableTokens: number;
  } | null {
    const pc = this.clients.get(provider);
    if (!pc) return null;

    return {
      circuitState: pc.circuitBreaker.getState(),
      availableTokens: pc.rateLimiter.getAvailableTokens(),
    };
  }

  /**
   * Reset circuit breaker for a provider
   */
  resetCircuitBreaker(provider: string): void {
    const pc = this.clients.get(provider);
    if (pc) {
      pc.circuitBreaker.reset();
      this.logger.log(`Circuit breaker reset for ${provider}`);
    }
  }

  /**
   * Execute with retry and error handling
   */
  private async executeWithRetry<T>(
    pc: ProviderClient,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      return await retry(fn, {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      });
    } catch (error) {
      pc.circuitBreaker.recordFailure();
      this.mapAndThrowError(error, pc.name);
    }
  }

  /**
   * Map errors to AIError
   */
  private mapAndThrowError(error: unknown, provider: string): never {
    if (error instanceof AIError) {
      throw error;
    }

    const err = error as Error & { status?: number; code?: string };
    const message = err.message || String(error);

    if (err.status === 429 || message.includes('rate limit')) {
      throw new AIError(
        AIErrorCode.RATE_LIMIT,
        `Rate limit exceeded for ${provider}`,
        err,
        true
      );
    }

    if (err.status === 408 || message.includes('timeout')) {
      throw new AIError(
        AIErrorCode.TIMEOUT,
        `Request timeout for ${provider}`,
        err,
        true
      );
    }

    if (err.status === 401 || err.status === 403) {
      throw new AIError(
        AIErrorCode.PROVIDER_UNAVAILABLE,
        `Authentication failed for ${provider}`,
        err,
        false
      );
    }

    if (err.status && err.status >= 500) {
      throw new AIError(
        AIErrorCode.PROVIDER_UNAVAILABLE,
        `Provider ${provider} error: ${message}`,
        err,
        true
      );
    }

    throw new AIError(
      AIErrorCode.UNKNOWN_ERROR,
      message,
      err,
      false
    );
  }
}
