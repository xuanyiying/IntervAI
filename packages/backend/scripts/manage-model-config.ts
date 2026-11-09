#!/usr/bin/env ts-node
/**
 * ModelConfig 管理 CLI（与 admin.controller.ts 的 /admin/models 使用同一张表）
 *
 * 用法（在 packages/backend 目录下）：
 *   pnpm model-config list
 *   pnpm model-config show <name>
 *   pnpm model-config add <name> <provider> <apiKey>
 *   pnpm model-config enable <name>
 *   pnpm model-config disable <name>
 *   pnpm model-config delete <name>
 *   pnpm model-config status
 *
 * 根目录调用：pnpm --filter @interview-ai/backend model-config <command>
 *
 * 需要 DATABASE_URL（见 .env.example）。
 * 注意：运行时 AI Provider 密钥来自环境变量（OPENAI_API_KEY、DEEPSEEK_API_KEY 等，
 * 见 modules/ai/services/ai.service.ts）；ModelConfig.apiKey 目前只作为管理端元数据，按明文存储，
 * 与管理后台写入方式一致，请勿在其中填入真实生产密钥。
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is required (see packages/backend/.env.example)'
  );
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

function maskKey(value: string): string {
  return value.length > 8
    ? `${value.slice(0, 4)}...${value.slice(-4)}`
    : '****';
}

async function listConfigs() {
  const configs = await prisma.modelConfig.findMany({
    orderBy: [{ provider: 'asc' }, { name: 'asc' }],
  });

  console.log('\n📋 Model Configurations:\n');
  console.log(
    'Name'.padEnd(25),
    'Provider'.padEnd(15),
    'Active'.padEnd(10),
    'Endpoint'
  );
  console.log('─'.repeat(80));

  for (const config of configs) {
    const status = config.isActive ? '✅ Yes' : '❌ No';
    console.log(
      config.name.padEnd(25),
      config.provider.padEnd(15),
      status.padEnd(10),
      config.endpoint || 'default'
    );
  }

  console.log(`\nTotal: ${configs.length} configurations\n`);
}

async function addConfig(name: string, provider: string, apiKey: string) {
  const config = await prisma.modelConfig.create({
    data: {
      name,
      provider,
      apiKey,
      defaultTemperature: 0.7,
      defaultMaxTokens: 2000,
      costPerInputToken: 0,
      costPerOutputToken: 0,
      rateLimitPerMinute: 0,
      rateLimitPerDay: 0,
      isActive: true,
    },
  });

  console.log(`✅ Added model configuration: ${config.name}`);
}

async function enableConfig(name: string) {
  await prisma.modelConfig.update({
    where: { name },
    data: { isActive: true },
  });

  console.log(`✅ Enabled model configuration: ${name}`);
}

async function disableConfig(name: string) {
  await prisma.modelConfig.update({
    where: { name },
    data: { isActive: false },
  });

  console.log(`❌ Disabled model configuration: ${name}`);
}

async function deleteConfig(name: string) {
  await prisma.modelConfig.delete({
    where: { name },
  });

  console.log(`🗑️  Deleted model configuration: ${name}`);
}

async function showStatus() {
  const configs = await prisma.modelConfig.findMany();
  const activeCount = configs.filter((c) => c.isActive).length;
  const inactiveCount = configs.length - activeCount;

  const providers = [...new Set(configs.map((c) => c.provider))];

  console.log('\n📊 Configuration Status:\n');
  console.log(`Total Configurations: ${configs.length}`);
  console.log(`Active: ${activeCount}`);
  console.log(`Inactive: ${inactiveCount}`);
  console.log(`\nProviders: ${providers.join(', ')}`);

  console.log('\n📈 By Provider:\n');
  for (const provider of providers) {
    const providerConfigs = configs.filter((c) => c.provider === provider);
    const activeProviderConfigs = providerConfigs.filter((c) => c.isActive);
    console.log(
      `  ${provider}: ${activeProviderConfigs.length}/${providerConfigs.length} active`
    );
  }
  console.log();
}

async function showConfig(name: string) {
  const config = await prisma.modelConfig.findUnique({
    where: { name },
  });

  if (!config) {
    console.error(`❌ Configuration not found: ${name}`);
    return;
  }

  console.log('\n📄 Configuration Details:\n');
  console.log(`Name: ${config.name}`);
  console.log(`Provider: ${config.provider}`);
  console.log(`Endpoint: ${config.endpoint || 'default'}`);
  console.log(`Temperature: ${config.defaultTemperature}`);
  console.log(`Max Tokens: ${config.defaultMaxTokens}`);
  console.log(`Cost (Input): $${config.costPerInputToken}/1K tokens`);
  console.log(`Cost (Output): $${config.costPerOutputToken}/1K tokens`);
  console.log(
    `Rate Limit: ${config.rateLimitPerMinute}/min, ${config.rateLimitPerDay}/day`
  );
  console.log(`Active: ${config.isActive ? '✅ Yes' : '❌ No'}`);
  console.log(`API Key: ${maskKey(config.apiKey)}`);
  console.log(`Created: ${config.createdAt.toISOString()}`);
  console.log(`Updated: ${config.updatedAt.toISOString()}`);
  console.log();
}

const USAGE = [
  'Model Configuration Management CLI',
  '',
  'Usage (from packages/backend):',
  '  pnpm model-config list                          - List all configurations',
  '  pnpm model-config show <name>                   - Show configuration details',
  '  pnpm model-config add <name> <provider> <key>   - Add new configuration',
  '  pnpm model-config enable <name>                 - Enable configuration',
  '  pnpm model-config disable <name>                - Disable configuration',
  '  pnpm model-config delete <name>                 - Delete configuration',
  '  pnpm model-config status                        - Show status summary',
];

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'list':
        await listConfigs();
        break;

      case 'add':
        if (args.length < 4) {
          console.error('Usage: pnpm model-config add <name> <provider> <key>');
          process.exit(1);
        }
        await addConfig(args[1], args[2], args[3]);
        break;

      case 'enable':
        if (args.length < 2) {
          console.error('Usage: pnpm model-config enable <name>');
          process.exit(1);
        }
        await enableConfig(args[1]);
        break;

      case 'disable':
        if (args.length < 2) {
          console.error('Usage: pnpm model-config disable <name>');
          process.exit(1);
        }
        await disableConfig(args[1]);
        break;

      case 'delete':
        if (args.length < 2) {
          console.error('Usage: pnpm model-config delete <name>');
          process.exit(1);
        }
        await deleteConfig(args[1]);
        break;

      case 'status':
        await showStatus();
        break;

      case 'show':
        if (args.length < 2) {
          console.error('Usage: pnpm model-config show <name>');
          process.exit(1);
        }
        await showConfig(args[1]);
        break;

      default:
        console.log(USAGE.join('\n'));
        break;
    }
  } catch (error) {
    console.error(
      'Error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
