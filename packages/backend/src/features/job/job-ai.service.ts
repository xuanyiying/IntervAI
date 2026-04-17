import { ParsedJobDescription } from '@/types';
import { AIService } from '@/core/ai/ai.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JobAIService {
  private readonly logger = new Logger(JobAIService.name);
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
   * Parse job description using job-parser skill
   */
  async parseJobDescription(
    content: string,
    userId: string
  ): Promise<ParsedJobDescription> {
    this.logger.log('Parsing job description via job-parser skill');

    try {
      const data = await this.executeSkillWithRetry(
        'job-parser',
        { rawJob: { description: content } },
        userId,
        {
          fallback: async () => {
            this.logger.warn(
              'Using rule-based parsing as fallback for job description'
            );
            return this.basicParseJobDescription(content);
          },
        }
      );

      return data as ParsedJobDescription;
    } catch (error) {
      this.logger.error('Error parsing job description:', error);
      throw new Error(
        `Failed to parse job description: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private basicParseJobDescription(content: string): ParsedJobDescription {
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return {
      title: lines[0] || '',
      company: '',
      location: '',
      requiredSkills: [],
      preferredSkills: [],
      responsibilities: [],
      keywords: [],
      salaryRange: '',
      experienceYears: 0,
      educationLevel: 'bachelor',
      description: content,
    };
  }

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
}
