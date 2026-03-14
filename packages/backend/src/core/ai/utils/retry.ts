/**
 * Retry utility
 * Exponential backoff retry logic
 */

import { Logger } from '@nestjs/common';
import { AIError, AIErrorCode } from '../types';

const logger = new Logger('Retry');

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  if (error instanceof AIError) {
    return error.retryable;
  }

  // Check for common retryable error patterns
  const message = error.message.toLowerCase();
  const retryablePatterns = [
    'rate limit',
    'timeout',
    'timed out',
    'connection',
    'network',
    'econnreset',
    'econnrefused',
    '429',
    '503',
    '502',
    '500',
  ];

  return retryablePatterns.some(pattern => message.includes(pattern));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const jitter = Math.random() * 0.3 * delay; // 0-30% jitter
  return Math.min(delay + jitter, config.maxDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultConfig, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      const shouldRetry = isRetryableError(lastError);
      if (!shouldRetry || attempt >= finalConfig.maxRetries) {
        logger.error(
          `Operation failed after ${attempt + 1} attempts: ${lastError.message}`
        );
        throw lastError;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, finalConfig);

      logger.warn(
        `Attempt ${attempt + 1}/${finalConfig.maxRetries + 1} failed. Retrying in ${Math.round(delay)}ms...`
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached
  throw lastError || new Error('Unknown error during retry');
}

/**
 * Create a retry wrapper with fixed configuration
 */
export function createRetryWrapper(config: Partial<RetryConfig> = {}) {
  return <T>(fn: () => Promise<T>): Promise<T> => retry(fn, config);
}
