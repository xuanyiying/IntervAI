/**
 * Qwen (Alibaba) AI Provider
 * Implements AIProvider interface for Alibaba's Qwen models
 * Uses DashScope's OpenAI-compatible API
 */

import { ModelInfo } from '@/ai-providers/interfaces';
import { QwenConfig } from '@/ai-providers/interfaces/model-config.interface';
import { BaseOpenAIProvider } from '../utils/base-openai.provider';

/**
 * Qwen Provider Implementation
 */
export class QwenProvider extends BaseOpenAIProvider {
  readonly name = 'qwen';

  constructor(config: QwenConfig) {
    // DashScope OpenAI compatible endpoint: https://dashscope.aliyuncs.com/compatible-mode/v1
    super('Qwen', {
      endpoint:
        config.endpoint || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
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

    // Define model information
    const modelInfoMap: Record<string, ModelInfo> = {
      'qwen-max': {
        name: 'qwen-max',
        provider: this.name,
        contextWindow: 8000,
        costPerInputToken: 0.02 / 1000, // $0.02 per 1K tokens
        costPerOutputToken: 0.06 / 1000, // $0.06 per 1K tokens
        latency: 2000, // Average latency in ms
        successRate: 0.99,
        isAvailable: true,
      },
      'qwen-plus': {
        name: 'qwen-plus',
        provider: this.name,
        contextWindow: 4000,
        costPerInputToken: 0.008 / 1000, // $0.008 per 1K tokens
        costPerOutputToken: 0.02 / 1000, // $0.02 per 1K tokens
        latency: 1500,
        successRate: 0.98,
        isAvailable: true,
      },
      'qwen-turbo': {
        name: 'qwen-turbo',
        provider: this.name,
        contextWindow: 4000,
        costPerInputToken: 0.002 / 1000, // $0.002 per 1K tokens
        costPerOutputToken: 0.006 / 1000, // $0.006 per 1K tokens
        latency: 1000,
        successRate: 0.97,
        isAvailable: true,
      },
      'qwen-long': {
        name: 'qwen-long',
        provider: this.name,
        contextWindow: 30000,
        costPerInputToken: 0.01 / 1000, // $0.01 per 1K tokens
        costPerOutputToken: 0.03 / 1000, // $0.03 per 1K tokens
        latency: 3000,
        successRate: 0.98,
        isAvailable: true,
      },
    };

    const modelInfo = modelInfoMap[modelName] || {
      name: modelName,
      provider: this.name,
      contextWindow: 8000,
      costPerInputToken: 0,
      costPerOutputToken: 0,
      latency: 2000,
      successRate: 0.99,
      isAvailable: true,
    };

    this.modelInfoCache.set(modelName, modelInfo);
    return modelInfo;
  }
}
