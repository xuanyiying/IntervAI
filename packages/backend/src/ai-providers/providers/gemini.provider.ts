/**
 * Google Gemini AI Provider
 * Implements AIProvider interface for Google Gemini models
 */

import { ModelInfo } from '../interfaces';
import { GeminiConfig } from '@/ai-providers/interfaces/model-config.interface';
import { BaseOpenAIProvider } from '../utils/base-openai.provider';

/**
 * Gemini Provider Implementation
 * Uses Google's OpenAI-compatible API
 */
export class GeminiProvider extends BaseOpenAIProvider {
  readonly name = 'gemini';

  constructor(config: GeminiConfig) {
    super('Gemini', {
      endpoint:
        config.endpoint ||
        'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: config.apiKey,
      timeout: config.timeout,
    });
  }

  /**
   * Get model information
   */
  async getModelInfo(modelName: string): Promise<ModelInfo> {
    // Check cache first
    if (this.modelInfoCache.has(modelName)) {
      return this.modelInfoCache.get(modelName)!;
    }

    // Default values for Gemini models
    const modelInfo: ModelInfo = {
      name: modelName,
      provider: this.name,
      contextWindow: modelName.includes('1.5') ? 1000000 : 32768,
      costPerInputToken: 0, // Placeholder, actual costs vary
      costPerOutputToken: 0,
      latency: 1500,
      successRate: 0.98,
      isAvailable: true,
    };

    // Cache the model info
    this.modelInfoCache.set(modelName, modelInfo);
    return modelInfo;
  }
}
