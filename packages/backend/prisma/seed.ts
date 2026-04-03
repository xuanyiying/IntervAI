import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import 'reflect-metadata';
import 'tsconfig-paths/register';
import { seedAdmin } from './seeds/seed-admin';
import { seedKnowledgeBase } from './seeds/seed-knowledge-base';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const startTime = Date.now();
  console.log('🌱 Starting database seeding...');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    await seedAdmin(prisma);

    await seedKnowledgeBase(prisma);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `\n✨ Database seeding completed successfully in ${duration}s!`
    );
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

main();
