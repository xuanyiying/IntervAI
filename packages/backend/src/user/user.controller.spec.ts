import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthService } from '@/auth/auth.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { SubscriptionTier, Role } from '@prisma/client';
import { ResourceNotFoundException } from '../common/exceptions/resource-not-found.exception';
import { ErrorCode } from '../common/exceptions/error-codes';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let authService: AuthService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    role: Role.USER,
    subscriptionTier: SubscriptionTier.FREE,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findById: jest.fn(),
            cleanUserCache: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            generateAuthResponse: jest.fn(),
            register: jest.fn(),
            login: jest.fn(),
            verifyEmail: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'FRONTEND_URL') return 'http://localhost:5173';
              if (key === 'CORS_ORIGIN') return 'http://localhost:5173';
              return null;
            }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('logout', () => {
    it('should return success message', async () => {
      const req = { user: { id: 'user-1' } };

      const result = await controller.logout(req);

      expect(userService.cleanUserCache).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ message: 'Successfully logged out' });
    });
  });

  describe('getCurrentUser', () => {
    it('should return user info from database', async () => {
      const req = { user: { id: 'user-1' } };
      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser as any);

      const result = await controller.getCurrentUser(req);

      expect(userService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        role: mockUser.role,
        subscriptionTier: mockUser.subscriptionTier,
        emailVerified: mockUser.emailVerified,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        lastLoginAt: mockUser.lastLoginAt,
      });
    });

    it('should throw ResourceNotFoundException if user does not exist', async () => {
      const req = { user: { id: 'non-existent' } };
      jest
        .spyOn(userService, 'findById')
        .mockRejectedValue(
          new ResourceNotFoundException(
            ErrorCode.USER_NOT_FOUND,
            'User not found'
          )
        );

      await expect(controller.getCurrentUser(req)).rejects.toThrow(
        ResourceNotFoundException
      );
    });
  });

  describe('googleAuthRedirect', () => {
    it('should redirect to frontend with token on success', async () => {
      const req = { user: mockUser };
      const res = { redirect: jest.fn() };
      const mockAuthResponse = { accessToken: 'mock-token', user: mockUser };

      jest
        .spyOn(authService, 'generateAuthResponse')
        .mockReturnValue(mockAuthResponse as any);

      await controller.googleAuthRedirect(req, res);

      expect(authService.generateAuthResponse).toHaveBeenCalledWith(mockUser);
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:5173/oauth/callback?token=mock-token'
      );
    });

    it('should redirect to frontend with error on failure', async () => {
      const req = { user: mockUser };
      const res = { redirect: jest.fn() };

      jest.spyOn(authService, 'generateAuthResponse').mockImplementation(() => {
        throw new Error('Auth failed');
      });

      await controller.googleAuthRedirect(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:5173/oauth/callback?error=Auth%20failed'
      );
    });
  });
});
