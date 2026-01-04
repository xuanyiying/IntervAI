/**
 * Ollama AI Provider
 * Implements AIProvider interface for local Ollama deployments
 * Uses Ollama's OpenAI-compatible API
 */

import { ModelInfo } from '@/ai-providers/interfaces';
import { OllamaConfig } from '@/ai-providers/interfaces/model-config.interface';
import { BaseOpenAIProvider } from '../utils/base-openai.provider';

/**
 * Ollama Provider Implementation
 */
export class OllamaProvider extends BaseOpenAIProvider {
  readonly name = 'ollama';
  private availableModels: string[] = [];
  private lastModelsRefresh: number = 0;
  private readonly modelsRefreshInterval: number = 60000; // 1 minute

  constructor(config: OllamaConfig) {
    let baseUrl = config.baseUrl || 'http://localhost:11434';
    // Remove trailing slash and /api or /v1 if present to prevent double paths
    baseUrl = baseUrl.replace(/\/$/, '').replace(/\/api$/, '').replace(/\/v1$/, '');
    
    super('Ollama', {
      endpoint: `${baseUrl}/v1`,
      apiKey: config.apiKey || 'ollama', // Ollama doesn't require API key but we need a placeholder
      timeout: config.timeout,
    });
  }

  /**
   * Health check for Ollama provider
   */
  async healthCheck(): Promise<boolean> {
    try {
      this.logger.debug('Performing Ollama health check');
      // Use the OpenAI models list endpoint for health check
      await this.client.models.list();
      this.logger.log('Ollama provider health check passed');
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Ollama provider health check failed: ${errorMessage}. This is expected if Ollama is not running locally.`
      );
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      this.logger.debug('Listing available Ollama models');

      const now = Date.now();
      if (
        this.availableModels.length === 0 ||
        now - this.lastModelsRefresh > this.modelsRefreshInterval
      ) {
        const response = await this.client.models.list();
        this.availableModels = response.data.map((m) => m.id);
        this.lastModelsRefresh = now;
      }

      return this.availableModels;
    } catch (error) {
      this.logger.error(
        `Failed to list Ollama models: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(modelName: string): Promise<ModelInfo> {
    // Check cache first
    if (this.modelInfoCache.has(modelName)) {
      return this.modelInfoCache.get(modelName)!;
    }

    const modelInfo: ModelInfo = {
      name: modelName,
      provider: this.name,
      contextWindow: 4096, // Default context window for most open models
      costPerInputToken: 0, // Ollama is free (local)
      costPerOutputToken: 0, // Ollama is free (local)
      latency: 2000, // Average latency in ms
      successRate: 0.95,
      isAvailable: true,
    };

    // Cache the model info
    this.modelInfoCache.set(modelName, modelInfo);

    return modelInfo;
  }
}
