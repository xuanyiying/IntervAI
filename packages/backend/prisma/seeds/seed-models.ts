import { PrismaClient } from '@prisma/client';

const QWEN_API_KEY = process.env.QWEN_API_KEY || '';

/**
 * AI Model Configurations
 * Based on Qwen (DashScope) and Ollama (Local)
 */
const MODELS = [
  // ============ Qwen (DashScope) Series ============
  {
    name: 'qwen3-max-preview',
    provider: 'qwen',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: QWEN_API_KEY,
    defaultTemperature: 0.7,
    defaultMaxTokens: 4000,
    costPerInputToken: 0.000001,
    costPerOutputToken: 0.000003,
    rateLimitPerMinute: 100,
    rateLimitPerDay: 50000,
  },
  {
    name: 'qwen-turbo',
    provider: 'qwen',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: QWEN_API_KEY,
    defaultTemperature: 0.7,
    defaultMaxTokens: 32768,
    costPerInputToken: 0.00001,
    costPerOutputToken: 0.00002,
    rateLimitPerMinute: 100,
    rateLimitPerDay: 50000,
  },
  {
    name: 'text-embedding-v3',
    provider: 'qwen',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: QWEN_API_KEY,
    defaultTemperature: 0,
    defaultMaxTokens: 8192,
    costPerInputToken: 0.00001,
    costPerOutputToken: 0,
    rateLimitPerMinute: 100,
    rateLimitPerDay: 50000,
  },
  {
    name: 'qwen3-coder-flash',
    provider: 'qwen',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: QWEN_API_KEY,
    defaultTemperature: 0.1,
    defaultMaxTokens: 4000,
    costPerInputToken: 0.000001,
    costPerOutputToken: 0.000003,
    rateLimitPerMinute: 100,
    rateLimitPerDay: 50000,
  },
  {
    name: 'deepseek-v3.2',
    provider: 'qwen',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: QWEN_API_KEY,
    defaultTemperature: 0.7,
    defaultMaxTokens: 4000,
    costPerInputToken: 0.00001,
    costPerOutputToken: 0.00003,
    rateLimitPerMinute: 60,
    rateLimitPerDay: 10000,
  },
  {
    name: 'kimi-k2-thinking',
    provider: 'qwen',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: QWEN_API_KEY,
    defaultTemperature: 0.7,
    defaultMaxTokens: 8000,
    costPerInputToken: 0.000015,
    costPerOutputToken: 0.000045,
    rateLimitPerMinute: 30,
    rateLimitPerDay: 5000,
  },
  {
    name: 'Moonshot-Kimi-K2-Instruct',
    provider: 'qwen',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: QWEN_API_KEY,
    defaultTemperature: 0.7,
    defaultMaxTokens: 8000,
    costPerInputToken: 0.00001,
    costPerOutputToken: 0.00003,
    rateLimitPerMinute: 30,
    rateLimitPerDay: 5000,
  },
  {
    name: 'llama-4-maverick-17b-128e-instruct',
    provider: 'qwen',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: QWEN_API_KEY,
    defaultTemperature: 0.7,
    defaultMaxTokens: 4000,
    costPerInputToken: 0.000005,
    costPerOutputToken: 0.000015,
    rateLimitPerMinute: 60,
    rateLimitPerDay: 10000,
  },
  {
    name: 'glm-4.7',
    provider: 'qwen',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: QWEN_API_KEY,
    defaultTemperature: 0.7,
    defaultMaxTokens: 4000,
    costPerInputToken: 0.00002,
    costPerOutputToken: 0.00004,
    rateLimitPerMinute: 60,
    rateLimitPerDay: 10000,
  },
  // ============ Ollama (Local) Series ============
  {
    name: 'deepseek-r1:1.5b',
    provider: 'ollama',
    endpoint: 'http://localhost:11434/v1',
    apiKey: 'local',
    defaultTemperature: 0.7,
    defaultMaxTokens: 4000,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    rateLimitPerMinute: 1000,
    rateLimitPerDay: 1000000,
  },
];

/**
 * Seeds the ModelConfig table with predefined AI models.
 * Supports incremental updates via upsert.
 */
export async function seedModelConfigs(prisma: PrismaClient) {
  console.log('🚀 Seeding AI model configurations...');
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const modelData of MODELS) {
    try {
      const result = await prisma.modelConfig.upsert({
        where: { name: modelData.name },
        update: {
          ...modelData,
          isActive: true,
        },
        create: {
          ...modelData,
          isActive: true,
        },
      });

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        console.log(`✅ Created model: ${modelData.name}`);
        created++;
      } else {
        console.log(`🔄 Updated model: ${modelData.name}`);
        updated++;
      }
    } catch (error) {
      console.error(`❌ Error processing model ${modelData.name}:`, error);
      failed++;
    }
  }

  console.log(`\n📊 Model Configs Summary:`);
  console.log(`   ✅ Created: ${created}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   ❌ Failed:  ${failed}`);
  console.log(`   📝 Total:   ${MODELS.length}\n`);
}
