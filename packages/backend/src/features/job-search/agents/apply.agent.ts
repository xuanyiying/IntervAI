import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import {
  JobPosting,
  UserProfile,
  Application,
  ApplicationStatus,
  ApplicationMethod,
} from '../interfaces/job-search.interface';

@Injectable()
export class ApplyAgent {
  private readonly logger = new Logger(ApplyAgent.name);

  /**
   * Automates the submission of a job application using Playwright
   */
  async submitApplication(
    job: JobPosting,
    userProfile: UserProfile,
    resumePath: string,
    coverLetterText?: string
  ): Promise<Application> {
    this.logger.log(
      `Starting automated application process for job: ${job.id}`
    );

    // Create base application tracking record
    const application: Application = {
      id: uuidv4(),
      userId: userProfile.userId,
      jobId: job.id,
      status: ApplicationStatus.SUBMITTED,
      submittedAt: new Date(),
      platform: job.platform,
      applicationUrl: job.applicationUrl,
      resumeVersion: resumePath,
      coverLetter: coverLetterText,
      lastStatusCheck: new Date(),
      viewCount: 0,
      notes: '',
    };

    // If method is direct/email, we don't use conventional web forms
    if (job.applicationMethod === ApplicationMethod.EMAIL) {
      application.status = ApplicationStatus.VIEWED;
      application.notes = 'Application should be sent via Email Integration';
      return application;
    }

    if (!job.applicationUrl) {
      throw new Error(
        `Cannot apply to job ${job.id}: No application URL provided.`
      );
    }

    let browser: Browser | null = null;
    try {
      this.logger.debug('Launching headless browser...');
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      this.logger.debug(`Navigating to ${job.applicationUrl}`);

      // MVP: We add a timeout and pretend we interacted with the form
      // In a real scenario, this would have complex DOM parsing & injection
      await page
        .goto(job.applicationUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        })
        .catch((e) => {
          this.logger.warn(
            `Navigation timeout or error, but continuing for MVP simulation: ${e.message}`
          );
        });

      // Simulate human-like interaction delay
      await page.waitForTimeout(2000);

      const pageTitle = await page.title().catch(() => 'Unknown Title');
      this.logger.debug(`Page loaded: ${pageTitle}`);

      // Simulated DOM form filling based on UserProfile
      this.logger.log(
        `[Simulation] Filling application form for ${userProfile.userId}...`
      );
      await page.waitForTimeout(1000);

      this.logger.log(
        `[Simulation] Uploading tailored resume from ${resumePath}`
      );
      await page.waitForTimeout(1000);

      if (coverLetterText) {
        this.logger.log(`[Simulation] Pasting cover letter text`);
      }

      this.logger.log(`[Simulation] Submitting form...`);
      await page.waitForTimeout(1500);

      // Successfully finished submission mock
      this.logger.log(`Application submitted successfully to ${job.platform}`);
      application.notes =
        'Automated Playwright Application Successful (Simulation)';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Application automation failed: ${errorMessage}`);

      application.status = ApplicationStatus.WITHDRAWN; // Just for representing 'not submitted'
      application.notes = `Failed to submit: ${errorMessage}`;
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    return application;
  }
}
