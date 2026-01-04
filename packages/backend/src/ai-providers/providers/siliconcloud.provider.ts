/**
 * SiliconCloud AI Provider
 * Implements AIProvider interface for SiliconCloud models
 * SiliconCloud API is compatible with OpenAI API
 */

import { ModelInfo } from '@/ai-providers/interfaces';
import { SiliconCloudConfig } from '@/ai-providers/interfaces/model-config.interface';
import { BaseOpenAIProvider } from '../utils/base-openai.provider';

/**
 * SiliconCloud Provider Implementation
 */
export class SiliconCloudProvider extends BaseOpenAIProvider {
  readonly name = 'siliconcloud';

  constructor(config: SiliconCloudConfig) {
    super('SiliconCloud', {
      endpoint: config.endpoint || 'https://api.siliconflow.cn/v1',
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

    // Default model info for SiliconCloud models
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

    // Common SiliconCloud models
    if (modelName.includes('DeepSeek-V3')) {
      defaultInfo.contextWindow = 64000;
      defaultInfo.costPerInputToken = 0.002 / 1000;
      defaultInfo.costPerOutputToken = 0.002 / 1000;
    } else if (modelName.includes('Qwen2.5-72B')) {
      defaultInfo.contextWindow = 32000;
      defaultInfo.costPerInputToken = 0.004 / 1000;
      defaultInfo.costPerOutputToken = 0.004 / 1000;
    }

    this.modelInfoCache.set(modelName, defaultInfo);
    return defaultInfo;
  }
}
