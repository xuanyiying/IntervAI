import 'dotenv/config';
import 'tsconfig-paths/register';
import { PrismaClient } from '@prisma/client';
import { seedAdmin } from './seeds/seed-admin';
import { seedModelConfigs } from './seeds/seed-models';
import { seedPromptsTemplates } from './seeds/seed-prompts';
import { seedKnowledgeBase } from './seeds/seed-knowledge-base';
import { seedResumeTemplates } from './seeds/seed-resume-templates';

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  const startTime = Date.now();
  console.log('🌱 Starting database seeding...');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    // 1. Seed Admin User
    await seedAdmin(prisma);

    // 2. Seed Model Configurations
    await seedModelConfigs(prisma);

    // 3. Seed Prompt Templates
    await seedPromptsTemplates(prisma);

    // 4. Seed Knowledge Base
    await seedKnowledgeBase(prisma);

    // 5. Seed Resume Templates
    await seedResumeTemplates(prisma);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ Database seeding completed successfully in ${duration}s!`);
  } catch (e) {
    console.error('\n❌ Error during database seeding:');
    if (e instanceof Error) {
      console.error(e.message);
      console.error(e.stack);
    } else {
      console.error(e);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute seeding
main();
