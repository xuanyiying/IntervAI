import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ApplyAgent } from '../agents/apply.agent';
import { TrackerAgent } from '../agents/tracker.agent';
import { PrismaService } from '@/shared/database/prisma.service';
import { JobPosting, UserProfile, Application, ApplicationStatus } from '../interfaces/job-search.interface';
import { ApplicationStatus as PrismaApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationTrackingService {
  private readonly logger = new Logger(ApplicationTrackingService.name);

  constructor(
    private readonly applyAgent: ApplyAgent,
    private readonly trackerAgent: TrackerAgent,
    private readonly prisma: PrismaService
  ) { }

  private mapStatus(status: ApplicationStatus): PrismaApplicationStatus {
    const mapping: Record<ApplicationStatus, PrismaApplicationStatus> = {
      [ApplicationStatus.SUBMITTED]: 'SUBMITTED',
      [ApplicationStatus.VIEWED]: 'VIEWED',
      [ApplicationStatus.UNDER_REVIEW]: 'UNDER_REVIEW',
      [ApplicationStatus.INTERVIEW_REQUESTED]: 'INTERVIEW_REQUESTED',
      [ApplicationStatus.INTERVIEW_COMPLETED]: 'INTERVIEW_COMPLETED',
      [ApplicationStatus.OFFER]: 'OFFER',
      [ApplicationStatus.REJECTED]: 'REJECTED',
      [ApplicationStatus.WITHDRAWN]: 'WITHDRAWN',
    };
    return mapping[status];
  }

  private reverseMapStatus(status: PrismaApplicationStatus): ApplicationStatus {
    const mapping: Record<PrismaApplicationStatus, ApplicationStatus> = {
      SUBMITTED: ApplicationStatus.SUBMITTED,
      VIEWED: ApplicationStatus.VIEWED,
      UNDER_REVIEW: ApplicationStatus.UNDER_REVIEW,
      INTERVIEW_REQUESTED: ApplicationStatus.INTERVIEW_REQUESTED,
      INTERVIEW_COMPLETED: ApplicationStatus.INTERVIEW_COMPLETED,
      OFFER: ApplicationStatus.OFFER,
      REJECTED: ApplicationStatus.REJECTED,
      WITHDRAWN: ApplicationStatus.WITHDRAWN,
    };
    return mapping[status];
  }

  async applyToJob(
    job: JobPosting,
    userProfile: UserProfile,
    baseResumePath: string
  ): Promise<Application> {
    this.logger.log(
      `Initiating application for user ${userProfile.userId} to job ${job.title} at ${job.company}`
    );

    const existingApplication = await this.prisma.application.findFirst({
      where: { userId: userProfile.userId, jobId: job.id },
    });

    if (existingApplication) {
      this.logger.warn(`User ${userProfile.userId} has already applied to job ${job.id}`);
      return this.mapToApplication(existingApplication);
    }

    const tailoredResumePath = baseResumePath;
    const coverLetterText = this.generateCoverLetter(job, userProfile);

    const applicationResult = await this.applyAgent.submitApplication(
      job,
      userProfile,
      tailoredResumePath,
      coverLetterText
    );

    const savedApplication = await this.prisma.application.create({
      data: {
        userId: userProfile.userId,
        jobId: job.id,
        status: this.mapStatus(applicationResult.status),
        platform: applicationResult.platform,
        applicationUrl: applicationResult.applicationUrl,
        resumeVersion: applicationResult.resumeVersion,
        coverLetter: applicationResult.coverLetter,
        notes: applicationResult.notes,
        metadata: {
          submittedAt: applicationResult.submittedAt,
        },
      },
    });

    this.logger.log(`Application ${savedApplication.id} saved to database`);

    return this.mapToApplication(savedApplication);
  }

  async receiveTrackingUpdate(
    applicationId: string,
    content: string,
    source: string
  ): Promise<Application> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found.`);
    }

    const mappedApplication = this.mapToApplication(application);
    const updatedApplication = await this.trackerAgent.processUpdate(
      mappedApplication,
      content,
      source
    );

    const savedApplication = await this.updateApplicationStatus(
      applicationId,
      updatedApplication.status,
      source,
      updatedApplication.notes
    );

    return savedApplication;
  }

  async processEmailUpdate(
    applicationId: string,
    emailSubject: string,
    emailBody: string,
    senderEmail: string
  ): Promise<Application> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found.`);
    }

    const mappedApplication = this.mapToApplication(application);
    const updatedApplication = this.trackerAgent.processEmailUpdate(
      mappedApplication,
      emailSubject,
      emailBody,
      senderEmail
    );

    const savedApplication = await this.updateApplicationStatus(
      applicationId,
      updatedApplication.status,
      `email:${senderEmail}`,
      updatedApplication.notes
    );

    return savedApplication;
  }

  async processApiUpdate(
    applicationId: string,
    apiData: Record<string, any>,
    platform: string
  ): Promise<Application> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found.`);
    }

    const mappedApplication = this.mapToApplication(application);
    const updatedApplication = this.trackerAgent.processApiUpdate(
      mappedApplication,
      apiData,
      platform
    );

    const savedApplication = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: this.mapStatus(updatedApplication.status),
        notes: updatedApplication.notes,
        viewCount: updatedApplication.viewCount,
        responseTime: updatedApplication.responseTime,
        lastStatusCheck: new Date(),
      },
    });

    return this.mapToApplication(savedApplication);
  }

  async getApplication(applicationId: string): Promise<Application> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found.`);
    }

    return this.mapToApplication(application);
  }

  async getUserApplications(params: {
    userId: string;
    status?: ApplicationStatus[];
    skip?: number;
    take?: number;
  }): Promise<Application[]> {
    const applications = await this.prisma.application.findMany({
      skip: params.skip,
      take: params.take,
      where: {
        userId: params.userId,
        ...(params.status && params.status.length > 0
          ? { status: { in: params.status.map((s) => this.mapStatus(s)) } }
          : {}),
      },
      include: { job: true },
      orderBy: { submittedAt: 'desc' },
    });

    return applications.map((app) => this.mapToApplication(app));
  }

  async updateApplicationNotes(
    applicationId: string,
    notes: string
  ): Promise<Application> {
    const application = await this.prisma.application.update({
      where: { id: applicationId },
      data: { notes, lastStatusCheck: new Date() },
    });
    return this.mapToApplication(application);
  }

  async withdrawApplication(applicationId: string): Promise<Application> {
    const application = await this.updateApplicationStatus(
      applicationId,
      ApplicationStatus.WITHDRAWN,
      'user',
      'Application withdrawn by user'
    );
    return application;
  }

  async getApplicationStats(userId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    recentActivity: number;
  }> {
    const [total, statusStats, recentCount] = await Promise.all([
      this.prisma.application.count({ where: { userId } }),
      this.prisma.application.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { userId },
      }),
      this.prisma.application.count({
        where: {
          userId,
          lastStatusCheck: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const stat of statusStats) {
      byStatus[stat.status] = stat._count.id;
    }

    return { total, byStatus, recentActivity: recentCount };
  }

  async checkFollowUps(): Promise<Application[]> {
    const applications = await this.prisma.application.findMany({
      take: 1000,
      include: { job: true },
    });

    const needsFollowUp: Application[] = [];

    for (const app of applications) {
      const mappedApp = this.mapToApplication(app);
      if (this.trackerAgent.shouldTriggerFollowUp(mappedApp)) {
        needsFollowUp.push(mappedApp);
      }
    }

    return needsFollowUp;
  }

  private async updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    source?: string,
    notes?: string
  ): Promise<Application> {
    const current = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!current) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    const mappedNewStatus = this.mapStatus(newStatus);
    const previousStatus = current.status as PrismaApplicationStatus;

    const [updated] = await this.prisma.$transaction([
      this.prisma.application.update({
        where: { id: applicationId },
        data: {
          status: mappedNewStatus,
          lastStatusCheck: new Date(),
        },
      }),
      this.prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          previousStatus,
          newStatus: mappedNewStatus,
          source,
          notes,
        },
      }),
    ]);

    return this.mapToApplication(updated);
  }

  private generateCoverLetter(job: JobPosting, userProfile: UserProfile): string {
    const userName = userProfile.experience?.[0]?.title || 'Applicant';
    return `Dear Hiring Manager at ${job.company},

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With my background in ${userProfile.experience?.[0]?.title || 'relevant field'} and skills in ${userProfile.skills.slice(0, 5).join(', ')}, I believe I would be a valuable addition to your team.

I am excited about the opportunity to contribute to ${job.company}'s success and would welcome the chance to discuss how my experience aligns with your needs.

Best regards,
${userName}`;
  }

  private mapToApplication(app: any): Application {
    return {
      id: app.id,
      userId: app.userId,
      jobId: app.jobId,
      status: this.reverseMapStatus(app.status as PrismaApplicationStatus),
      submittedAt: app.submittedAt,
      platform: app.platform || undefined,
      applicationUrl: app.applicationUrl || undefined,
      resumeVersion: app.resumeVersion || undefined,
      coverLetter: app.coverLetter || undefined,
      lastStatusCheck: app.lastStatusCheck,
      viewCount: app.viewCount,
      responseTime: app.responseTime || undefined,
      notes: app.notes || undefined,
      job: app.job ? {
        id: app.job.id,
        title: app.job.title,
        company: app.job.company,
        location: app.job.location || undefined,
        platform: app.job.platform,
      } as JobPosting : undefined,
    };
  }
}
