/**
 * Rate Limiter
 * Token bucket algorithm for rate limiting
 */

import { Logger } from '@nestjs/common';

export interface RateLimiterConfig {
  tokensPerSecond: number;
  maxTokens: number;
  refillIntervalMs: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  tokensPerSecond: 10,
  maxTokens: 100,
  refillIntervalMs: 1000,
};

export class RateLimiter {
  private readonly logger = new Logger(RateLimiter.name);
  private tokens: number;
  private lastRefillTime: number;
  private readonly config: RateLimiterConfig;

  constructor(
    private readonly name: string,
    config: Partial<RateLimiterConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tokens = this.config.maxTokens;
    this.lastRefillTime = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    const tokensToAdd = Math.floor(
      (elapsed / this.config.refillIntervalMs) * this.config.tokensPerSecond
    );

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.tokens + tokensToAdd, this.config.maxTokens);
      this.lastRefillTime = now;
    }
  }

  canConsume(tokens: number = 1): boolean {
    this.refill();
    return this.tokens >= tokens;
  }

  consume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    this.logger.warn(
      `Rate limiter [${this.name}] rejected request (tokens: ${this.tokens}, needed: ${tokens})`
    );
    return false;
  }

  async waitForTokens(tokens: number = 1, timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (this.consume(tokens)) {
        return true;
      }

      const waitTime = Math.ceil(
        ((tokens - this.tokens) / this.config.tokensPerSecond) * 1000
      );
      await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 1000)));
    }

    return false;
  }

  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  getWaitTime(tokens: number = 1): number {
    this.refill();

    if (this.tokens >= tokens) {
      return 0;
    }

    const tokensNeeded = tokens - this.tokens;
    return Math.ceil((tokensNeeded / this.config.tokensPerSecond) * 1000);
  }
}
