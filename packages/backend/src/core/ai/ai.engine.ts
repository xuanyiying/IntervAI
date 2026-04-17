/**
 * AI Engine - Generic AI Operations
 *
 * Provides generic AI capabilities (chat, embedding, skill execution)
 * that are not tied to any specific business domain.
 *
 * Domain-specific logic lives in respective feature modules:
 * - JobAIService (job module) - job description parsing
 * - InterviewAIService (interview module) - interview questions, chat, transcription
 * - ResumeAIService (resume module) - resume parsing, optimization
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService } from './ai.service';

@Injectable()
export class AIEngine {
  private readonly logger = new Logger(AIEngine.name);
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 1000;

  constructor(
    private aiService: AIService,
    private configService: ConfigService
  ) {}

  private get aiModel(): string {
    return (
      this.aiService.getModel() ||
      this.configService.get('AI_MODEL') ||
      'openrouter:deepseek/deepseek-chat'
    );
  }

  /**
   * Execute skill with retry logic and error handling
   */
  private async executeSkillWithRetry(
    skillName: string,
    inputs: Record<string, any>,
    userId: string,
    options?: { fallback?: () => Promise<any> }
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
          this.logger.warn(
            `Retry ${attempt}/${this.maxRetries} for skill "${skillName}" after ${delay}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const result = await this.aiService.executeSkill(
          skillName,
          inputs,
          userId
        );

        if (!result.success) {
          const errorCode = result.error?.code || 'UNKNOWN_ERROR';
          const errorMessage =
            result.error?.message || 'Skill execution failed';
          lastError = new Error(`[${errorCode}] ${errorMessage}`);

          if (this.isTransientError(errorCode) && attempt < this.maxRetries) {
            this.logger.warn(
              `Skill "${skillName}" transient error (attempt ${attempt + 1}): ${errorMessage}`
            );
            continue;
          }

          if (options?.fallback) {
            this.logger.warn(
              `Skill "${skillName}" permanent error (${errorCode}), using fallback immediately`
            );
            return options.fallback();
          }

          throw lastError;
        }

        if (!result.data) {
          if (options?.fallback && attempt < this.maxRetries) {
            this.logger.warn(
              `Skill "${skillName}" returned empty data (attempt ${attempt + 1}), retrying...`
            );
            continue;
          }

          if (options?.fallback) {
            this.logger.warn(
              `Skill "${skillName}" returned no data after all retries, using fallback`
            );
            return options.fallback();
          }
          throw new Error('Skill returned no data');
        }

        return result.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (this.isNetworkError(lastError) && attempt < this.maxRetries) {
          this.logger.warn(
            `Network error for skill "${skillName}" (attempt ${attempt + 1}): ${lastError.message}`
          );
          continue;
        }

        if (options?.fallback) {
          this.logger.warn(
            `Skill "${skillName}" error after attempts, using fallback: ${lastError.message}`
          );
          try {
            return await options.fallback();
          } catch (fallbackError) {
            this.logger.error(
              `Fallback also failed for skill "${skillName}":`,
              fallbackError
            );
            throw lastError;
          }
        }

        throw lastError;
      }
    }

    if (options?.fallback && lastError) {
      this.logger.warn(
        `Skill "${skillName}" exhausted all retries, using fallback as last resort`
      );
      try {
        return await options.fallback();
      } catch (fallbackError) {
        this.logger.error(
          `Fallback also failed for skill "${skillName}":`,
          fallbackError
        );
        throw lastError;
      }
    }

    throw lastError || new Error('Skill execution failed');
  }

  private isTransientError(errorCode: string): boolean {
    const transientErrors = [
      'RATE_LIMIT_EXCEEDED',
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
      'PROVIDER_OVERLOADED',
    ];
    return transientErrors.includes(errorCode);
  }

  private isNetworkError(error: Error): boolean {
    const networkPatterns = [
      /network/i,
      /timeout/i,
      /ECONNREFUSED/i,
      /ECONNRESET/i,
      /ETIMEDOUT/i,
      /fetch failed/i,
      /socket hang up/i,
    ];
    return networkPatterns.some((pattern) => pattern.test(error.message));
  }

  // ==================== Generic AI ====================

  async generateEmbedding(text: string): Promise<number[]> {
    return this.aiService.embed(this.aiModel, text);
  }

  async generateChatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const result = await this.aiService.chat(this.aiModel, messages, options);
    return result.content;
  }

  async generate(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const result = await this.aiService.chat(
      this.aiModel,
      [{ role: 'user', content: prompt }],
      options
    );
    return result.content;
  }
}
