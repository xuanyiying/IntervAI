/**
 * Model Configuration
 * Simplified model configuration with environment variable overrides
 */

/**
 * Predefined provider base URLs
 */
export const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  ollama: 'http://localhost:11434/v1',
  siliconcloud: 'https://api.siliconflow.cn/v1',
};

/**
 * Default model configurations
 * Can be overridden via environment variables
 */
export const Models = {
  // Default chat model
  Chat: process.env.AI_CHAT_MODEL || 'openai:gpt-4o-mini',

  // Pro chat model (for complex tasks)
  ChatPro: process.env.AI_CHAT_PRO_MODEL || 'openai:gpt-4o',

  // Embedding model
  Embedding: process.env.AI_EMBEDDING_MODEL || 'openai:text-embedding-3-small',

  // Resume optimization model
  ResumeOptimization: process.env.AI_RESUME_MODEL || 'openai:gpt-4o',

  // Interview chat model
  InterviewChat: process.env.AI_INTERVIEW_MODEL || 'openai:gpt-4o-mini',

  // Job matching model
  JobMatching: process.env.AI_JOB_MATCH_MODEL || 'openai:gpt-4o-mini',

  // Agent model for complex reasoning
  AgentReasoning: process.env.AI_AGENT_MODEL || 'openai:gpt-4o',

  // Alias models for backward compatibility
  Default: process.env.AI_CHAT_MODEL || 'openai:gpt-4o-mini',
  ResumeParser: process.env.AI_RESUME_MODEL || 'openai:gpt-4o',
  JobParser: process.env.AI_JOB_MATCH_MODEL || 'openai:gpt-4o-mini',
  Optimization: process.env.AI_RESUME_MODEL || 'openai:gpt-4o',
  InterviewPrep: process.env.AI_INTERVIEW_MODEL || 'openai:gpt-4o-mini',
} as const;

/**
 * Default model parameters
 */
export const DefaultParams = {
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  timeout: 120000, // 2 minutes
} as const;

/**
 * Model cost information (per 1K tokens)
 */
export const ModelCosts: Record<string, { input: number; output: number }> = {
  // OpenAI models
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'text-embedding-3-small': { input: 0.00002, output: 0 },
  'text-embedding-3-large': { input: 0.00013, output: 0 },

  // DeepSeek models
  'deepseek-chat': { input: 0.00014, output: 0.00028 },
  'deepseek-reasoner': { input: 0.00055, output: 0.00219 },

  // Qwen models (approximate)
  'qwen-turbo': { input: 0.0003, output: 0.0006 },
  'qwen-plus': { input: 0.0008, output: 0.002 },
  'qwen-max': { input: 0.002, output: 0.006 },

  // Default for unknown models
  default: { input: 0.001, output: 0.002 },
};

/**
 * Get cost for a model
 */
export function getModelCost(modelName: string): { input: number; output: number } {
  // Extract model name without provider prefix
  const name = modelName.includes(':') ? modelName.split(':')[1] : modelName;

  // Look up cost, fall back to default
  return ModelCosts[name] || ModelCosts.default;
}
