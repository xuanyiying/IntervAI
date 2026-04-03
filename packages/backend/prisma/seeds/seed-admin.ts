import { PrismaClient, Role, SubscriptionTier } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedAdmin(prisma: PrismaClient) {
  const adminEmail = 'admin@acejob.tech';
  const adminPassword = 'tech.2025!';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, updating role...');
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: Role.ADMIN,
        passwordHash: hashedPassword,
      },
    });
    console.log('Admin user updated.');
  } else {
    console.log('Creating admin user...');
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        username: 'System Admin',
        role: Role.ADMIN,
        subscriptionTier: SubscriptionTier.ENTERPRISE,
        emailVerified: true,
        isActive: true,
      },
    });
    console.log('Admin user created.');
  }

  console.log(`
    Admin Credentials:
    Email: ${adminEmail}
    Password: ${adminPassword}
  `);

  const testEmail = 'test@intervai.com';
  const testPassword = 'test123';
  const testHashedPassword = await bcrypt.hash(testPassword, 10);

  const existingTest = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (existingTest) {
    console.log('Test user already exists, updating...');
    await prisma.user.update({
      where: { email: testEmail },
      data: {
        passwordHash: testHashedPassword,
      },
    });
    console.log('Test user updated.');
  } else {
    console.log('Creating test user...');
    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: testHashedPassword,
        username: 'Test User',
        role: Role.USER,
        subscriptionTier: SubscriptionTier.FREE,
        emailVerified: true,
        isActive: true,
      },
    });
    console.log('Test user created.');
  }

  console.log(`
    Test User Credentials:
    Email: ${testEmail}
    Password: ${testPassword}
  `);
}
