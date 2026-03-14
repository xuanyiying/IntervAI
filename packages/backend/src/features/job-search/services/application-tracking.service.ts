import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { JobPosting, UserProfile, Application, ApplicationStatus } from '../interfaces/job-search.interface';
import { ApplicationStatus as PrismaApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationTrackingService {
  private readonly logger = new Logger(ApplicationTrackingService.name);

  constructor(
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

    const coverLetterText = this.generateCoverLetter(job, userProfile);

    // Create application record
    const savedApplication = await this.prisma.application.create({
      data: {
        userId: userProfile.userId,
        jobId: job.id,
        status: 'SUBMITTED',
        platform: job.platform || 'manual',
        applicationUrl: job.applicationUrl,
        resumeVersion: baseResumePath,
        coverLetter: coverLetterText,
        notes: `Applied to ${job.title} at ${job.company}`,
        metadata: {
          submittedAt: new Date().toISOString(),
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

    // Parse status from content (simplified logic)
    const newStatus = this.parseStatusFromContent(content);

    const savedApplication = await this.updateApplicationStatus(
      applicationId,
      newStatus,
      source,
      content
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

    const content = `${emailSubject}\n${emailBody}`;
    const newStatus = this.parseStatusFromContent(content);

    const savedApplication = await this.updateApplicationStatus(
      applicationId,
      newStatus,
      'email',
      `From: ${senderEmail}\n${content}`
    );

    return savedApplication;
  }

  private parseStatusFromContent(content: string): ApplicationStatus {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('offer') || lowerContent.includes('congratulations')) {
      return ApplicationStatus.OFFER;
    }
    if (lowerContent.includes('interview') && lowerContent.includes('schedule')) {
      return ApplicationStatus.INTERVIEW_REQUESTED;
    }
    if (lowerContent.includes('rejected') || lowerContent.includes('unfortunately')) {
      return ApplicationStatus.REJECTED;
    }
    if (lowerContent.includes('review') || lowerContent.includes('considering')) {
      return ApplicationStatus.UNDER_REVIEW;
    }
    if (lowerContent.includes('viewed') || lowerContent.includes('seen')) {
      return ApplicationStatus.VIEWED;
    }

    return ApplicationStatus.SUBMITTED;
  }

  private generateCoverLetter(job: JobPosting, userProfile: UserProfile): string {
    return `Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With my background and skills, I believe I would be a valuable addition to your team.

${userProfile.skills.slice(0, 5).join(', ')}

I look forward to discussing how I can contribute to ${job.company}.

Best regards`;
  }

  private async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    source: string,
    notes?: string
  ): Promise<Application> {
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: this.mapStatus(status),
        notes: notes ? { set: notes } : undefined,
        metadata: {
          update: {
            lastUpdate: new Date().toISOString(),
            updateSource: source,
          },
        },
      },
    });

    return this.mapToApplication(updated);
  }

  private mapToApplication(prismaApp: any): Application {
    return {
      id: prismaApp.id,
      userId: prismaApp.userId,
      jobId: prismaApp.jobId,
      status: this.reverseMapStatus(prismaApp.status),
      platform: prismaApp.platform,
      applicationUrl: prismaApp.applicationUrl,
      resumeVersion: prismaApp.resumeVersion,
      coverLetter: prismaApp.coverLetter,
      notes: prismaApp.notes,
      submittedAt: prismaApp.createdAt,
      lastStatusCheck: prismaApp.updatedAt,
      viewCount: 0,
    };
  }

  async getApplications(userId: string): Promise<Application[]> {
    const applications = await this.prisma.application.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return applications.map(app => this.mapToApplication(app));
  }

  async getApplication(applicationId: string, userId: string): Promise<Application | null> {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
    });

    return application ? this.mapToApplication(application) : null;
  }
}
