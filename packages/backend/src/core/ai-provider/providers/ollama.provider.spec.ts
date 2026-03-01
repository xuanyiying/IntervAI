/**
 * Ollama Provider Tests
 * Tests for Ollama AI provider implementation
 * **Feature: multi-llm-provider-integration, Property 1: 多提供商支持**
 * **Validates: Requirements 1.5, 9.1, 9.2, 9.3, 9.4, 9.6**
 */
import { OllamaProvider } from './ollama.provider';
import { OllamaConfig } from '../interfaces/model-config.interface';
import { AIRequest } from '../interfaces';
import OpenAI from 'openai';

jest.mock('openai');
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('OllamaProvider', () => {
  let provider: OllamaProvider;
  let config: OllamaConfig;
  let mockOpenAI: any;

  beforeEach(() => {
    config = {
      apiKey: 'dummy-key',
      baseUrl: 'http://localhost:11434',
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

    provider = new OllamaProvider(config);
  });

  describe('Provider Initialization', () => {
    it('should initialize with correct name', () => {
      expect(provider.name).toBe('ollama');
    });

    it('should initialize with provided configuration', () => {
      expect(provider).toBeDefined();
    });
  });

  describe('call method', () => {
    it('should successfully call Ollama API and return formatted response', async () => {
      const request: AIRequest = {
        model: 'llama2',
        prompt: 'What is 2+2?',
        temperature: 0.5,
        maxTokens: 100,
      };

      const mockResponse = {
        id: 'req-123',
        model: 'llama2',
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
        model: 'llama2',
        provider: 'ollama',
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

    it('should use default temperature if not provided', async () => {
      const request: AIRequest = {
        model: 'mistral',
        prompt: 'Test prompt',
      };

      const mockResponse = {
        id: 'req-123',
        model: 'mistral',
        choices: [
          {
            message: { content: 'Response', role: 'assistant' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 3,
          total_tokens: 8,
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await provider.call(request);

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      expect(callArgs.temperature).toBe(0.7);
    });

    it('should handle API errors and convert to AIError', async () => {
      const request: AIRequest = {
        model: 'llama2',
        prompt: 'Test',
      };

      const error = new Error('Connection refused');
      mockOpenAI.chat.completions.create.mockRejectedValue(error);

      await expect(provider.call(request)).rejects.toThrow();
    }, 10000);

    it('should include system prompt in request', async () => {
      const request: AIRequest = {
        model: 'llama2',
        prompt: 'User prompt',
        systemPrompt: 'You are a helpful assistant.',
      };

      const mockResponse = {
        id: 'req-123',
        model: 'llama2',
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

      await provider.call(request);

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages[0].content).toBe('You are a helpful assistant.');
    });
  });

  describe('stream method', () => {
    it('should stream responses from Ollama API', async () => {
      const request: AIRequest = {
        model: 'llama2',
        prompt: 'Stream test',
      };

      const mockStream = (async function* () {
        yield {
          model: 'llama2',
          choices: [{ delta: { content: 'Hello' } }],
        };
        yield {
          model: 'llama2',
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
        data: [{ id: 'llama2' }, { id: 'mistral' }],
      });

      const models = await provider.listModels();
      expect(models).toEqual(['llama2', 'mistral']);
    });
  });
});
