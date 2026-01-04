/**
 * DeepSeek AI Provider
 * Implements AIProvider interface for DeepSeek models
 * DeepSeek API is compatible with OpenAI API
 */

import { ModelInfo } from '@/ai-providers/interfaces';
import { DeepSeekConfig } from '@/ai-providers/interfaces/model-config.interface';
import { BaseOpenAIProvider } from '../utils/base-openai.provider';

/**
 * DeepSeek Provider Implementation
 */
export class DeepSeekProvider extends BaseOpenAIProvider {
  readonly name = 'deepseek';

  constructor(config: DeepSeekConfig) {
    super('DeepSeek', {
      endpoint: config.endpoint || 'https://api.deepseek.com',
      apiKey: config.apiKey,
      timeout: config.timeout,
    });
  }

  /**
   * Get model info
   */
  async getModelInfo(modelName: string): Promise<ModelInfo> {
    if (this.modelInfoCache.has(modelName)) {
      return this.modelInfoCache.get(modelName)!;
    }

    // Default model info for DeepSeek models
    const defaultInfo: ModelInfo = {
      name: modelName,
      provider: this.name,
      contextWindow: 32000, // Default context window
      costPerInputToken: 0, // Placeholder
      costPerOutputToken: 0, // Placeholder
      latency: 1000,
      successRate: 0.99,
      isAvailable: true,
    };

    if (modelName === 'deepseek-chat') {
      defaultInfo.contextWindow = 32000;
      defaultInfo.costPerInputToken = 0.00014 / 1000; // $0.14 per 1M tokens
      defaultInfo.costPerOutputToken = 0.00028 / 1000; // $0.28 per 1M tokens
    } else if (modelName === 'deepseek-coder') {
      defaultInfo.contextWindow = 32000;
      defaultInfo.costPerInputToken = 0.00014 / 1000;
      defaultInfo.costPerOutputToken = 0.00028 / 1000;
    }

    this.modelInfoCache.set(modelName, defaultInfo);
    return defaultInfo;
  }
}
