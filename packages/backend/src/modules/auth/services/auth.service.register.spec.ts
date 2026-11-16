import { AuthService } from './auth.service';
import { SubscriptionTier, Role } from '@prisma/client';

const createdUser = {
  id: 'user_1',
  email: 'test@adsfsda.com',
  passwordHash: 'hash',
  username: 'tests',
  phone: null,
  subscriptionTier: SubscriptionTier.FREE,
  isActive: true,
  emailVerified: false,
  role: Role.USER,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastLoginAt: null,
  avatarUrl: null,
};

function buildService(emailBehavior: 'resolve' | 'hang' | 'reject') {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(createdUser),
      update: jest.fn().mockResolvedValue(createdUser),
    },
  } as any;

  const jwtService = {
    sign: jest.fn().mockReturnValue('access-token'),
  } as any;

  const sendVerificationEmail =
    emailBehavior === 'hang'
      ? jest.fn().mockReturnValue(new Promise(() => {}))
      : emailBehavior === 'reject'
        ? jest.fn().mockRejectedValue(new Error('SMTP down'))
        : jest.fn().mockResolvedValue(undefined);
  const sendPasswordResetEmail =
    emailBehavior === 'hang'
      ? jest.fn().mockReturnValue(new Promise(() => {}))
      : emailBehavior === 'reject'
        ? jest.fn().mockRejectedValue(new Error('SMTP down'))
        : jest.fn().mockResolvedValue(undefined);
  const emailService = {
    sendVerificationEmail,
    sendPasswordResetEmail,
  } as any;

  const invitationService = {
    validateCode: jest.fn(),
    markAsUsed: jest.fn(),
  } as any;

  const redisService = {
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(undefined),
  } as any;

  const service = new AuthService(
    prisma,
    jwtService,
    emailService,
    invitationService,
    redisService
  );

  return {
    service,
    prisma,
    emailService,
    invitationService,
    redisService,
  };
}

const registerDto = {
  username: 'tests',
  email: 'test@adsfsda.com',
  password: 'adsfadaff',
  agreement: true,
};

// Rejects if register has not settled within the deadline, so a blocking
// implementation fails fast instead of hanging the suite.
function withDeadline<T>(promise: Promise<T>, ms = 1000): Promise<T> {
  let timer: NodeJS.Timeout;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('register blocked on email send')),
      ms
    );
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

describe('AuthService.register', () => {
  it('registers successfully without invitationCode and with agreement', async () => {
    const { service, invitationService } = buildService('resolve');

    const result = await service.register(registerDto);

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

  it('returns the auth response even when the verification email hangs', async () => {
    const { service, emailService, redisService } = buildService('hang');

    const result = await withDeadline(service.register(registerDto));

    expect(result.accessToken).toBe('access-token');
    expect(redisService.set).toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      createdUser.email,
      expect.any(String),
      createdUser.username
    );
  });

  it('still registers when the verification email fails', async () => {
    const { service } = buildService('reject');

    const result = await withDeadline(service.register(registerDto));

    expect(result.accessToken).toBe('access-token');
  });
});

describe('AuthService.forgotPassword', () => {
  it('returns even when the reset email hangs', async () => {
    const { service, prisma, emailService, redisService } =
      buildService('hang');
    prisma.user.findUnique.mockResolvedValue(createdUser);

    await withDeadline(service.forgotPassword(createdUser.email));

    expect(redisService.set).toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      createdUser.email,
      expect.any(String),
      createdUser.username
    );
  });
});
