import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AIEngine } from './ai.engine';
import { AIService } from './ai.service';
import { ConfigService } from '@nestjs/config';

describe('AIEngine', () => {
  let engine: AIEngine;

  const mockAIService = {
    executeSkill: jest.fn(),
    chat: jest.fn(),
    embed: jest.fn(),
    getModel: jest.fn().mockReturnValue('test-model'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-model'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIEngine,
        { provide: AIService, useValue: mockAIService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    engine = module.get<AIEngine>(AIEngine);
  });

  describe('generateChatCompletion', () => {
    it('should return chat completion content', async () => {
      mockAIService.chat.mockResolvedValue({
        content: 'Hello, how can I help you?',
        model: 'test-model',
        provider: 'test-provider',
        usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
      });

      const result = await engine.generateChatCompletion([
        { role: 'user', content: 'Hi' },
      ]);

      expect(result).toBe('Hello, how can I help you?');
    });
  });

  describe('generate', () => {
    it('should generate text from a prompt', async () => {
      mockAIService.chat.mockResolvedValue({
        content: 'Generated text',
        model: 'test-model',
        provider: 'test-provider',
        usage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 },
      });

      const result = await engine.generate('Tell me about React');

      expect(result).toBe('Generated text');
      expect(mockAIService.chat).toHaveBeenCalledWith(
        'test-model',
        [{ role: 'user', content: 'Tell me about React' }],
        undefined
      );
    });
  });

  describe('generateEmbedding', () => {
    it('should generate embedding', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      mockAIService.embed.mockResolvedValue(mockEmbedding);

      const result = await engine.generateEmbedding('test text');

      expect(result).toEqual(mockEmbedding);
    });
  });
});
