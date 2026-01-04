/**
 * Qwen Provider Tests
 * Tests for Qwen AI provider implementation
 * **Feature: multi-llm-provider-integration, Property 1: 多提供商支持**
 * **Validates: Requirements 1.1, 2.2, 2.3, 2.4, 2.5, 2.6**
 */

import { QwenProvider } from './qwen.provider';
import { QwenConfig } from '../interfaces/model-config.interface';
import { AIRequest } from '../interfaces';
import { AIError } from '../utils/ai-error';
import OpenAI from 'openai';

jest.mock('openai');
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('QwenProvider', () => {
  let provider: QwenProvider;
  let config: QwenConfig;
  let mockOpenAI: any;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      defaultTemperature: 0.7,
      defaultMaxTokens: 2000,
      timeout: 30000,
    };

    // Reset mocks
    jest.clearAllMocks();

    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
      models: {
        list: jest.fn(),
      },
    };

    MockedOpenAI.mockImplementation(() => mockOpenAI as any);

    provider = new QwenProvider(config);
  });

  describe('Provider Initialization', () => {
    it('should initialize with correct name', () => {
      expect(provider.name).toBe('qwen');
    });

    it('should initialize with provided configuration', () => {
      expect(provider).toBeDefined();
    });
  });

  describe('call method', () => {
    it('should successfully call Qwen API and return formatted response', async () => {
      const request: AIRequest = {
        model: 'qwen-max',
        prompt: 'What is 2+2?',
        temperature: 0.5,
        maxTokens: 100,
      };

      const mockResponse = {
        id: 'req-123',
        model: 'qwen-max',
        choices: [
          {
            message: { content: 'The answer is 4.', role: 'assistant' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const response = await provider.call(request);

      expect(response).toEqual({
        content: 'The answer is 4.',
        model: 'qwen-max',
        provider: 'qwen',
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
        },
        finishReason: 'stop',
        metadata: {
          requestId: 'req-123',
        },
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });
  });

  describe('stream method', () => {
    it('should stream responses from Qwen API', async () => {
      const request: AIRequest = {
        model: 'qwen-max',
        prompt: 'Stream test',
      };

      const mockStream = (async function* () {
        yield {
          model: 'qwen-max',
          choices: [{ delta: { content: 'Hello' } }],
        };
        yield {
          model: 'qwen-max',
          choices: [{ delta: { content: ' world' } }],
        };
      })();

      mockOpenAI.chat.completions.create.mockResolvedValue(mockStream);

      const chunks: string[] = [];
      for await (const chunk of provider.stream(request)) {
        chunks.push(chunk.content);
      }

      expect(chunks).toContain('Hello');
      expect(chunks).toContain(' world');
    });
  });

  describe('healthCheck', () => {
    it('should return true if API is healthy', async () => {
      mockOpenAI.models.list.mockResolvedValue({ data: [] });
      const healthy = await provider.healthCheck();
      expect(healthy).toBe(true);
    });

    it('should return false if API is unhealthy', async () => {
      mockOpenAI.models.list.mockRejectedValue(new Error('API Error'));
      const healthy = await provider.healthCheck();
      expect(healthy).toBe(false);
    });
  });

  describe('listModels', () => {
    it('should return list of model IDs', async () => {
      mockOpenAI.models.list.mockResolvedValue({
        data: [{ id: 'qwen-max' }, { id: 'qwen-plus' }],
      });

      const models = await provider.listModels();
      expect(models).toEqual(['qwen-max', 'qwen-plus']);
    });
  });

  describe('getModelInfo', () => {
    it('should return correct info for known models', async () => {
      const modelInfo = await provider.getModelInfo('qwen-max');

      expect(modelInfo.name).toBe('qwen-max');
      expect(modelInfo.provider).toBe('qwen');
      expect(modelInfo.contextWindow).toBe(8000);
      expect(modelInfo.isAvailable).toBe(true);
    });
  });

  describe('Property 1: Multi-provider support', () => {
    it('should implement all required AIProvider interface methods', () => {
      expect(typeof provider.call).toBe('function');
      expect(typeof provider.stream).toBe('function');
      expect(typeof provider.healthCheck).toBe('function');
      expect(typeof provider.listModels).toBe('function');
      expect(typeof provider.getModelInfo).toBe('function');
    });

    it('should have correct provider name', () => {
      expect(provider.name).toBe('qwen');
    });

    it('should return AIResponse with correct structure', async () => {
      const request: AIRequest = {
        model: 'qwen-max',
        prompt: 'Test',
      };

      const mockResponse = {
        id: 'req-123',
        model: 'qwen-max',
        choices: [
          {
            message: { content: 'Response', role: 'assistant' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const response = await provider.call(request);

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('model');
      expect(response).toHaveProperty('provider');
      expect(response).toHaveProperty('usage');
      expect(response).toHaveProperty('finishReason');
      expect(response.provider).toBe('qwen');
    });
  });
});
