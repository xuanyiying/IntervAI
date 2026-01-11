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
   * Health check - SiliconCloud might not support /models endpoint,
   * so we try a simple user information or model check if possible,
   * or fall back to a minimal completion check.
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try models.list first as it's standard
      await this.client.models.list();
      return true;
    } catch (error: any) {
      // If 404, SiliconFlow might not support /models, try a minimal check
      if (error?.status === 404 || error?.message?.includes('404')) {
        try {
          // Try a simple request to check if the API key and endpoint are valid
          // Using a very small request to minimize cost/latency
          await this.client.chat.completions.create({
            model: 'deepseek-ai/DeepSeek-V3', // Use a standard model known to be on SiliconCloud
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 1,
          });
          return true;
        } catch (innerError) {
          this.logger.warn(
            `SiliconCloud health check failed even with fallback: ${
              innerError instanceof Error
                ? innerError.message
                : String(innerError)
            }`
          );
          return false;
        }
      }

      this.logger.warn(
        `SiliconCloud health check failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
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
