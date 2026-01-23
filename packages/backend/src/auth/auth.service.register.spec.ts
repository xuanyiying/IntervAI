import { AuthService } from './auth.service';
import { SubscriptionTier, Role } from '@prisma/client';

describe('AuthService.register', () => {
  it('registers successfully without invitationCode and with agreement', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    } as any;

    const jwtService = {
      sign: jest.fn().mockReturnValue('access-token'),
    } as any;

    const emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    } as any;

    const invitationService = {
      validateCode: jest.fn(),
      markAsUsed: jest.fn(),
    } as any;

    const redisService = {} as any;

    const now = new Date('2026-01-01T00:00:00.000Z');
    const createdUser = {
      id: 'user_1',
      email: 'test@adsfsda.com',
      passwordHash: 'hash',
      username: 'tests',
      phone: null,
      subscriptionTier: SubscriptionTier.FREE,
      isActive: true,
      emailVerified: false,
      verificationToken: 'token',
      role: Role.USER,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      avatarUrl: null,
    };

    prisma.user.create.mockResolvedValue(createdUser);

    const service = new AuthService(
      prisma,
      jwtService,
      emailService,
      invitationService,
      redisService
    );

    const result = await service.register({
      username: 'tests',
      email: 'test@adsfsda.com',
      password: 'adsfadaff',
      agreement: true,
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      user: {
        id: createdUser.id,
        email: createdUser.email,
        username: createdUser.username ?? undefined,
        subscriptionTier: createdUser.subscriptionTier,
        emailVerified: createdUser.emailVerified,
        role: createdUser.role,
        createdAt: createdUser.createdAt,
      },
    });

    expect(invitationService.validateCode).not.toHaveBeenCalled();
    expect(invitationService.markAsUsed).not.toHaveBeenCalled();
  });
});

