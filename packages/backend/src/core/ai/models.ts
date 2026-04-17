export const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  ollama: 'http://localhost:11434/v1',
  siliconcloud: 'https://api.siliconflow.cn/v1',
  openrouter: 'https://openrouter.ai/api/v1',
};

export const AI_MODEL =
  process.env.AI_MODEL || 'openrouter:deepseek/deepseek-chat';
