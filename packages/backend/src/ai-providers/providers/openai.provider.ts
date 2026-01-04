/**
 * OpenAI AI Provider
 * Implements AIProvider interface for OpenAI models
 */

import { OpenAIConfig } from '@/ai-providers/interfaces/model-config.interface';
import { ModelInfo } from '../interfaces';
import { BaseOpenAIProvider } from '../utils/base-openai.provider';

/**
 * OpenAI Provider Implementation
 */
export class OpenAIProvider extends BaseOpenAIProvider {
  readonly name = 'openai';

  constructor(config: OpenAIConfig) {
    super('OpenAI', {
      endpoint: config.endpoint || 'https://api.openai.com/v1',
      apiKey: config.apiKey,
      timeout: config.timeout,
      organization: config.organization,
    });
  }

  /**
   * Get model info
   */
  async getModelInfo(modelName: string): Promise<ModelInfo> {
    if (this.modelInfoCache.has(modelName)) {
      return this.modelInfoCache.get(modelName)!;
    }

    // Default model info for common OpenAI models
    const defaultInfo: ModelInfo = {
      name: modelName,
      provider: this.name,
      contextWindow: 128000, // Default for GPT-4o/Turbo
      costPerInputToken: 0.005 / 1000,
      costPerOutputToken: 0.015 / 1000,
      latency: 1000,
      successRate: 0.99,
      isAvailable: true,
    };

    if (modelName.includes('gpt-3.5')) {
      defaultInfo.contextWindow = 16385;
      defaultInfo.costPerInputToken = 0.0005 / 1000;
      defaultInfo.costPerOutputToken = 0.0015 / 1000;
    } else if (modelName.includes('gpt-4o-mini')) {
      defaultInfo.contextWindow = 128000;
      defaultInfo.costPerInputToken = 0.00015 / 1000;
      defaultInfo.costPerOutputToken = 0.0006 / 1000;
    }

    this.modelInfoCache.set(modelName, defaultInfo);
    return defaultInfo;
  }
}
