import { Injectable, Logger } from '@nestjs/common';
import { User, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { Cacheable } from '@/common/decorators/cache.decorator';
import { ResourceNotFoundException } from '@/common/exceptions/resource-not-found.exception';
import { ErrorCode } from '@/common/exceptions/error-codes';

@Injectable()
export class UserService {
  cleanUserCache(userId: string) {
    const key = `user:profile:${userId}`;
    this.redisService.del(key).catch((err) => {
      this.logger.error(`Failed to clean user cache: ${err.message}`);
    });
  }
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService
  ) {}

  /**
   * Delete user account
   * Requirement 1.4: Delete all associated data
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ResourceNotFoundException(
        ErrorCode.USER_NOT_FOUND,
        'User not found'
      );
    }

    // Cascade delete will handle related records
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Update user subscription
   */
  async updateSubscription(
    userId: string,
    tier: SubscriptionTier
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ResourceNotFoundException(
        ErrorCode.USER_NOT_FOUND,
        'User not found'
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        subscriptionExpiresAt:
          tier !== SubscriptionTier.FREE
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
            : null,
      },
    });
  }

  /**
   * Find user by ID
   */
  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'user:profile',
    keyGenerator: (userId: string) => `user:profile:${userId}`,
  })
  async findById(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    console.log(
      '🔍 [User Service] User from database:',
      JSON.stringify(
        {
          userId: user?.id,
          email: user?.email,
          role: user?.role,
          roleType: typeof user?.role,
        },
        null,
        2
      )
    );
    if (!user) {
      throw new ResourceNotFoundException(
        ErrorCode.USER_NOT_FOUND,
        'User not found'
      );
    }
    return user;
  }

  /**
   * Export user data for GDPR compliance
   * Requirement 1.4: Provide data export functionality
   */
  async exportUserData(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ResourceNotFoundException(
        ErrorCode.USER_NOT_FOUND,
        'User not found'
      );
    }

    // Fetch all user-related data
    const [resumes, jobs, optimizations, generatedPdfs] = await Promise.all([
      this.prisma.resume.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          version: true,
          isPrimary: true,
          createdAt: true,
          updatedAt: true,
          parsedData: true,
        },
      }),
      this.prisma.job.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          jobDescription: true,
          requirements: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.optimization.findMany({
        where: { userId },
        select: {
          id: true,
          resumeId: true,
          jobId: true,
          matchScore: true,
          suggestions: true,
          status: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      this.prisma.generatedPDF.findMany({
        where: { userId },
        select: {
          id: true,
          templateId: true,
          downloadCount: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        subscriptionTier: user.subscriptionTier,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      resumes,
      jobs,
      optimizations,
      generatedPdfs,
      exportedAt: new Date(),
    };
  }

  /**
   * Get user activity history
   */
  async getUserHistory(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Fetch various user activities
    const [
      resumes,
      jobs,
      optimizations,
      generatedPdfs,
      conversations,
      interviewSessions,
      totalCount,
    ] = await Promise.all([
      this.prisma.resume.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.job.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          company: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.optimization.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          completedAt: true,
          resume: {
            select: {
              title: true,
            },
          },
          job: {
            select: {
              title: true,
              company: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.generatedPDF.findMany({
        where: { userId },
        select: {
          id: true,
          templateId: true,
          createdAt: true,
          downloadCount: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.conversation.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          messageCount: true,
          createdAt: true,
          lastMessageAt: true,
        },
        orderBy: { lastMessageAt: 'desc' },
        take: 5,
      }),
      this.prisma.interviewSession.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          score: true,
          startTime: true,
          endTime: true,
        },
        orderBy: { startTime: 'desc' },
        take: 5,
      }),
      this.prisma.optimization.count({ where: { userId } }),
    ]);

    // Transform into activity feed format
    const activities = optimizations.map((opt) => ({
      id: opt.id,
      type: 'optimization',
      status: opt.status,
      resumeTitle: opt.resume.title,
      jobTitle: opt.job.title,
      company: opt.job.company,
      createdAt: opt.createdAt,
      completedAt: opt.completedAt,
    }));

    return {
      data: activities,
      total: totalCount,
      page,
      limit,
      summary: {
        totalResumes: resumes.length,
        totalJobs: jobs.length,
        totalOptimizations: totalCount,
        totalPdfs: generatedPdfs.length,
        totalConversations: conversations.length,
        totalInterviews: interviewSessions.length,
      },
      recentResumes: resumes,
      recentJobs: jobs,
      recentPdfs: generatedPdfs,
      recentConversations: conversations,
      recentInterviews: interviewSessions,
    };
  }
}
