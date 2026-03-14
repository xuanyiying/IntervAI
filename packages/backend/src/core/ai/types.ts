/**
 * AI Module Types
 * Simplified type definitions for the unified AI service
 */

/**
 * AI Message structure for chat completions
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * AI Result structure
 */
export interface AIResult {
  content: string;
  usage: {
    input: number;
    output: number;
    total?: number;
  };
  model?: string;
  provider?: string;
}

/**
 * Chat options
 */
export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  userId?: string;
  responseFormat?: { type: 'text' | 'json_object' };
  metadata?: Record<string, unknown>;
}

/**
 * Stream options
 */
export interface StreamOptions extends ChatOptions {
  onChunk?: (chunk: string) => void;
}

/**
 * Embedding options
 */
export interface EmbedOptions {
  userId?: string;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  rateLimit?: {
    tokensPerSecond?: number;
    maxTokens?: number;
  };
}

/**
 * Model information
 */
export interface ModelInfo {
  name: string;
  provider: string;
  contextWindow: number;
  costPerInputToken: number;
  costPerOutputToken: number;
  isAvailable: boolean;
}

/**
 * Usage record for tracking
 */
export interface UsageRecord {
  userId: string;
  model: string;
  provider: string;
  scenario?: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latency: number;
  success: boolean;
}

/**
 * AI Error codes
 */
export enum AIErrorCode {
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  INVALID_REQUEST = 'INVALID_REQUEST',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * AI Error class
 */
export class AIError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string,
    public readonly cause?: Error,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIError';
  }
}
