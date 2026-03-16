import 'dotenv/config';
import 'reflect-metadata';
import 'tsconfig-paths/register';
import { PrismaClient } from '@prisma/client';
import { seedAdmin } from './seeds/seed-admin';
// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  const startTime = Date.now();
  console.log('🌱 Starting database seeding...');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    // 1. Seed Admin User
    await seedAdmin(prisma);

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

// Execute seeding
main();
