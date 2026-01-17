import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionTier } from '@prisma/client';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ResourceNotFoundException } from '@/common/exceptions/resource-not-found.exception';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    username: 'testuser',
    phone: '+1234567890',
    avatarUrl: null,
    subscriptionTier: SubscriptionTier.FREE,
    subscriptionExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    isActive: true,
    emailVerified: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            resume: {
              findMany: jest.fn(),
            },
            job: {
              findMany: jest.fn(),
            },
            optimization: {
              findMany: jest.fn(),
            },
            generatedPDF: {
              findMany: jest.fn(),
            },
            conversation: {
              findMany: jest.fn(),
            },
            interviewSession: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteAccount', () => {
    it('should delete user account successfully', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.delete as jest.Mock).mockResolvedValue(mockUser);

      await service.deleteAccount('user-1');

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteAccount('nonexistent-user')).rejects.toThrow(
        ResourceNotFoundException
      );
    });
  });

  describe('updateSubscription', () => {
    it('should update user subscription to PRO', async () => {
      const updatedUser = {
        ...mockUser,
        subscriptionTier: SubscriptionTier.PRO,
        subscriptionExpiresAt: expect.any(Date),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateSubscription(
        'user-1',
        SubscriptionTier.PRO
      );

      expect(result.subscriptionTier).toBe(SubscriptionTier.PRO);
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('should set subscriptionExpiresAt to null for FREE tier', async () => {
      const updatedUser = {
        ...mockUser,
        subscriptionTier: SubscriptionTier.FREE,
        subscriptionExpiresAt: null,
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        subscriptionTier: SubscriptionTier.PRO,
      });
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateSubscription(
        'user-1',
        SubscriptionTier.FREE
      );

      expect(result.subscriptionExpiresAt).toBeNull();
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateSubscription('nonexistent-user', SubscriptionTier.PRO)
      ).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('nonexistent-user')).rejects.toThrow(
        ResourceNotFoundException
      );
    });
  });

  describe('exportUserData', () => {
    it('should export all user data successfully', async () => {
      const mockResumes = [
        {
          id: 'resume-1',
          title: 'Resume 1',
          version: 1,
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          parsedData: { name: 'John Doe' },
        },
      ];

      const mockJobs = [
        {
          id: 'job-1',
          title: 'Software Engineer',
          company: 'Tech Corp',
          location: 'San Francisco',
          jobDescription: 'We are hiring...',
          requirements: 'Requirements...',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockOptimizations = [
        {
          id: 'opt-1',
          resumeId: 'resume-1',
          jobId: 'job-1',
          matchScore: { overall: 85 },
          suggestions: [],
          status: 'COMPLETED',
          createdAt: new Date(),
          completedAt: new Date(),
        },
      ];

      const mockPdfs = [
        {
          id: 'pdf-1',
          templateId: 'template-1',
          downloadCount: 2,
          createdAt: new Date(),
        },
      ];

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.resume.findMany as jest.Mock).mockResolvedValue(
        mockResumes
      );
      (prismaService.job.findMany as jest.Mock).mockResolvedValue(mockJobs);
      (prismaService.optimization.findMany as jest.Mock).mockResolvedValue(
        mockOptimizations
      );
      (prismaService.generatedPDF.findMany as jest.Mock).mockResolvedValue(
        mockPdfs
      );

      const result = await service.exportUserData('user-1');

      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe('test@example.com');
      expect(result.resumes).toEqual(mockResumes);
      expect(result.jobs).toEqual(mockJobs);
      expect(result.optimizations).toEqual(mockOptimizations);
      expect(result.generatedPdfs).toEqual(mockPdfs);
      expect(result.exportedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.exportUserData('nonexistent-user')).rejects.toThrow(
        ResourceNotFoundException
      );
    });

    it('should return empty arrays if user has no data', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.resume.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.job.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.optimization.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.generatedPDF.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.exportUserData('user-1');

      expect(result.resumes).toEqual([]);
      expect(result.jobs).toEqual([]);
      expect(result.optimizations).toEqual([]);
      expect(result.generatedPdfs).toEqual([]);
    });
  });
});
