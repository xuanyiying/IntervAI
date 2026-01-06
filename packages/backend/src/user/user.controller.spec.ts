import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SubscriptionTier, Role } from '@prisma/client';
import { ResourceNotFoundException } from '../common/exceptions/resource-not-found.exception';
import { ErrorCode } from '../common/exceptions/error-codes';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

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
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('logout', () => {
    it('should return success message', async () => {
      const req = { user: { id: 'user-1' } };
      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser as any);

      const result = await controller.logout(req);

      expect(userService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ message: 'Successfully logged out' });
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

      await expect(controller.logout(req)).rejects.toThrow(
        ResourceNotFoundException
      );
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
});
