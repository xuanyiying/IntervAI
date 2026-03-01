import { Injectable, Logger } from '@nestjs/common';
import { ApplyAgent } from '../agents/apply.agent';
import { TrackerAgent } from '@/features/job-search';
import { JobPosting, UserProfile, Application } from '@/features/job-search';

@Injectable()
export class ApplicationTrackingService {
  private readonly logger = new Logger(ApplicationTrackingService.name);

  // In a real application, you'd inject a Database Repository to save Applications
  // For MVP, we will keep them in memory for the current session or return them to the controller
  private mockApplicationsDB: Map<string, Application> = new Map();

  constructor(
    private readonly applyAgent: ApplyAgent,
    private readonly trackerAgent: TrackerAgent
  ) {}

  /**
   * Orchestrates the process of applying to a job
   */
  async applyToJob(
    job: JobPosting,
    userProfile: UserProfile,
    baseResumePath: string
  ): Promise<Application> {
    this.logger.log(
      `Initiating application for user ${userProfile.userId} to job ${job.title} at ${job.company}`
    );

    // In a full implementation, we would call the ResumeOptimizerService here
    // to generate a tailored resume specifically for this job description.
    // MVP: Use the base resume path
    const tailoredResumePath = baseResumePath;

    // Generate a cover letter
    const coverLetterText = `Dear Hiring Manager at ${job.company},\n\nI am very interested in the ${job.title} position...`;

    // Apply via ApplyAgent
    const application = await this.applyAgent.submitApplication(
      job,
      userProfile,
      tailoredResumePath,
      coverLetterText
    );

    // Save to our mock DB
    this.mockApplicationsDB.set(application.id, application);

    return application;
  }

  /**
   * Process an incoming tracking update
   */
  async receiveTrackingUpdate(
    applicationId: string,
    content: string,
    source: string
  ): Promise<Application> {
    const application = this.mockApplicationsDB.get(applicationId);

    if (!application) {
      throw new Error(`Application with ID ${applicationId} not found.`);
    }

    const updatedApplication = await this.trackerAgent.processUpdate(
      application,
      content,
      source
    );

    // Save updated back to DB
    this.mockApplicationsDB.set(updatedApplication.id, updatedApplication);

    return updatedApplication;
  }

  /**
   * Get an application by ID
   */
  getApplication(applicationId: string): Application | undefined {
    return this.mockApplicationsDB.get(applicationId);
  }

  /**
   * Get all applications for a user
   */
  getUserApplications(userId: string): Application[] {
    const results: Application[] = [];
    for (const app of this.mockApplicationsDB.values()) {
      if (app.userId === userId) {
        results.push(app);
      }
    }
    return results;
  }
}
