const net = require('net');
const { PrismaClient } = require('@prisma/client');

console.log('--- Test 1: Raw TCP Connection ---');
const socket = new net.Socket();
socket.setTimeout(5000);

socket.on('connect', () => {
  console.log('✅ TCP Connection successful to 150.158.20.143:5432');
  socket.destroy();
  testPrisma();
});

socket.on('timeout', () => {
  console.log('❌ TCP Connection timed out');
  socket.destroy();
});

socket.on('error', (err) => {
  console.log('❌ TCP Connection failed:', err.message);
});

socket.connect(5432, '150.158.20.143');

async function testPrisma(urlOverride, label) {
  const url =
    urlOverride ||
    'postgresql://postgres:secure_postgres_2025@150.158.20.143:5432/resume_optimizer?schema=public';
  console.log(`\n--- Test 2: Prisma Connection (${label || 'Default'}) ---`);
  console.log(`URL: ${url}`);

  const prisma = new PrismaClient({
    datasources: { db: { url } },
    log: ['info', 'warn', 'error'],
  });

  try {
    await prisma.$connect();
    console.log(`✅ Prisma Connection successful (${label || 'Default'})`);
  } catch (e) {
    console.error(
      `❌ Prisma Connection failed (${label || 'Default'}):`,
      e.message.split('\n')[0]
    );
  } finally {
    await prisma.$disconnect();
  }
}

socket.on('connect', async () => {
  console.log('✅ TCP Connection successful to 150.158.20.143:5432');
  socket.destroy();

  // Run variants sequentially
  await testPrisma(undefined, 'Default');
  await testPrisma(
    'postgresql://postgres:secure_postgres_2025@150.158.20.143:5432/resume_optimizer?schema=public&sslmode=no-verify',
    'SSL no-verify'
  );
  await testPrisma(
    'postgresql://postgres:secure_postgres_2025@150.158.20.143:5432/resume_optimizer?schema=public&sslmode=prefer',
    'SSL prefer'
  );
  await testPrisma(
    'postgresql://postgres:secure_postgres_2025@150.158.20.143:5432/resume_optimizer?schema=public&sslmode=require',
    'SSL require'
  );
  await testPrisma(
    'postgresql://postgres:secure_postgres_2025@150.158.20.143:5432/resume_optimizer?schema=public&sslmode=disable',
    'SSL disable'
  );
});
