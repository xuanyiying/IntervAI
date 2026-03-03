import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import {
  JobPosting,
  UserProfile,
  Application,
  ApplicationStatus,
  ApplicationMethod,
} from '../interfaces/job-search.interface';
import { JobSearchConfig } from '../config';
import * as fs from 'fs';
import * as path from 'path';

interface FormField {
  selector: string;
  value: string;
  type: 'text' | 'email' | 'phone' | 'file' | 'select' | 'textarea' | 'checkbox';
}

interface ApplicationResult {
  success: boolean;
  application: Application;
  error?: string;
  screenshot?: string;
}

@Injectable()
export class ApplyAgent implements OnModuleDestroy {
  private readonly logger = new Logger(ApplyAgent.name);
  private readonly config: JobSearchConfig['application'];
  private browser: Browser | null = null;
  private activeContexts: BrowserContext[] = [];

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<JobSearchConfig['application']>('jobSearch.application')!;
    this.ensureScreenshotDirectory();
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeBrowser();
    this.logger.log('ApplyAgent destroyed, browser closed');
  }

  async submitApplication(
    job: JobPosting,
    userProfile: UserProfile,
    resumePath: string,
    coverLetterText?: string
  ): Promise<Application> {
    this.logger.log(
      `Starting application process for job: ${job.id} at ${job.company}`
    );

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

    if (job.applicationMethod === ApplicationMethod.EMAIL) {
      return this.handleEmailApplication(application, job, userProfile, coverLetterText);
    }

    if (!job.applicationUrl) {
      application.status = ApplicationStatus.WITHDRAWN;
      application.notes = 'No application URL provided';
      return application;
    }

    try {
      const result = await this.performBrowserApplication(
        job,
        userProfile,
        resumePath,
        coverLetterText
      );

      application.status = result.application.status;
      application.notes = result.application.notes;
      
      if (result.screenshot) {
        application.notes += ` | Screenshot: ${result.screenshot}`;
      }

      if (!result.success && result.error) {
        this.logger.error(`Application failed: ${result.error}`);
      }

      return application;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Application automation failed: ${errorMessage}`);
      
      application.status = ApplicationStatus.WITHDRAWN;
      application.notes = `Failed: ${errorMessage}`;
      
      return application;
    }
  }

  private async performBrowserApplication(
    job: JobPosting,
    userProfile: UserProfile,
    resumePath: string,
    coverLetterText?: string
  ): Promise<ApplicationResult> {
    let page: Page | null = null;
    let context: BrowserContext | null = null;

    try {
      if (!this.browser) {
        this.browser = await this.launchBrowser();
      }

      context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        locale: 'en-US',
      });
      this.activeContexts.push(context);

      page = await context.newPage();
      page.setDefaultTimeout(this.config.timeout);

      await this.navigateToJobPage(page, job.applicationUrl!);
      
      const platform = this.detectPlatform(job.applicationUrl!);
      const result = await this.fillApplicationForm(
        page,
        platform,
        userProfile,
        resumePath,
        coverLetterText
      );

      return result;
    } finally {
      if (page) await page.close().catch(() => {});
      if (context) {
        await context.close().catch(() => {});
        const index = this.activeContexts.indexOf(context);
        if (index > -1) this.activeContexts.splice(index, 1);
      }
    }
  }

  private async launchBrowser(): Promise<Browser> {
    this.logger.debug('Launching browser...');
    
    return chromium.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });
  }

  private async navigateToJobPage(page: Page, url: string): Promise<void> {
    this.logger.debug(`Navigating to: ${url}`);
    
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: this.config.timeout,
    });

    await this.handleCookieConsent(page);
    await this.waitForPageLoad(page);
  }

  private async handleCookieConsent(page: Page): Promise<void> {
    const cookieSelectors = [
      'button:has-text("Accept")',
      'button:has-text("Accept All")',
      'button:has-text("I Accept")',
      'button:has-text("Agree")',
      '[data-testid="cookie-accept"]',
      '#onetrust-accept-btn-handler',
      'button[id*="accept"]',
    ];

    for (const selector of cookieSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          await page.waitForTimeout(500);
          this.logger.debug('Cookie consent handled');
          break;
        }
      } catch {
        // Continue to next selector
      }
    }
  }

  private async waitForPageLoad(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }

  private detectPlatform(url: string): string {
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('indeed.com')) return 'indeed';
    if (url.includes('glassdoor.com')) return 'glassdoor';
    if (url.includes('workday')) return 'workday';
    if (url.includes('greenhouse.io')) return 'greenhouse';
    if (url.includes('lever.co')) return 'lever';
    if (url.includes('smartrecruiters')) return 'smartrecruiters';
    return 'generic';
  }

  private async fillApplicationForm(
    page: Page,
    platform: string,
    userProfile: UserProfile,
    resumePath: string,
    coverLetterText?: string
  ): Promise<ApplicationResult> {
    const application: Application = {
      id: uuidv4(),
      userId: userProfile.userId,
      jobId: '',
      status: ApplicationStatus.SUBMITTED,
      submittedAt: new Date(),
      platform,
      resumeVersion: resumePath,
      coverLetter: coverLetterText,
      lastStatusCheck: new Date(),
      viewCount: 0,
      notes: '',
    };

    try {
      switch (platform) {
        case 'linkedin':
          return await this.fillLinkedInApplication(page, userProfile, resumePath, coverLetterText);
        case 'indeed':
          return await this.fillIndeedApplication(page, userProfile, resumePath, coverLetterText);
        default:
          return await this.fillGenericApplication(page, userProfile, resumePath, coverLetterText);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const screenshot = await this.takeScreenshot(page, 'error');
      
      application.status = ApplicationStatus.WITHDRAWN;
      application.notes = `Error: ${errorMessage}`;
      
      return {
        success: false,
        application,
        error: errorMessage,
        screenshot,
      };
    }
  }

  private async fillLinkedInApplication(
    page: Page,
    userProfile: UserProfile,
    resumePath: string,
    coverLetterText?: string
  ): Promise<ApplicationResult> {
    this.logger.debug('Filling LinkedIn Easy Apply form');

    const application: Application = {
      id: uuidv4(),
      userId: userProfile.userId,
      jobId: '',
      status: ApplicationStatus.SUBMITTED,
      submittedAt: new Date(),
      platform: 'linkedin',
      resumeVersion: resumePath,
      lastStatusCheck: new Date(),
      viewCount: 0,
      notes: '',
    };

    try {
      const easyApplyButton = page.locator('button:has-text("Easy Apply")').first();
      
      if (await easyApplyButton.isVisible({ timeout: 5000 })) {
        await easyApplyButton.click();
        await page.waitForTimeout(1000);

        let hasNext = true;
        let attempts = 0;
        const maxAttempts = 10;

        while (hasNext && attempts < maxAttempts) {
          attempts++;
          
          await this.fillVisibleFields(page, userProfile);
          
          const uploadInput = page.locator('input[type="file"]').first();
          if (await uploadInput.isVisible({ timeout: 1000 }).catch(() => false)) {
            await uploadInput.setInputFiles(resumePath);
            await page.waitForTimeout(1000);
          }

          const nextButton = page.locator('button:has-text("Next"), button:has-text("Review")').first();
          const submitButton = page.locator('button:has-text("Submit")').first();

          if (await submitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            await submitButton.click();
            await page.waitForTimeout(2000);
            hasNext = false;
            
            application.notes = 'Successfully submitted via LinkedIn Easy Apply';
          } else if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            await nextButton.click();
            await page.waitForTimeout(1000);
          } else {
            hasNext = false;
          }
        }
      } else {
        const applyButton = page.locator('button:has-text("Apply")').first();
        if (await applyButton.isVisible({ timeout: 3000 })) {
          await applyButton.click();
          application.notes = 'Redirected to external application page';
          application.status = ApplicationStatus.SUBMITTED;
        }
      }

      return { success: true, application };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      application.status = ApplicationStatus.WITHDRAWN;
      application.notes = `LinkedIn apply failed: ${errorMessage}`;
      
      return { success: false, application, error: errorMessage };
    }
  }

  private async fillIndeedApplication(
    page: Page,
    userProfile: UserProfile,
    resumePath: string,
    coverLetterText?: string
  ): Promise<ApplicationResult> {
    this.logger.debug('Filling Indeed application form');

    const application: Application = {
      id: uuidv4(),
      userId: userProfile.userId,
      jobId: '',
      status: ApplicationStatus.SUBMITTED,
      submittedAt: new Date(),
      platform: 'indeed',
      resumeVersion: resumePath,
      lastStatusCheck: new Date(),
      viewCount: 0,
      notes: '',
    };

    try {
      const applyButton = page.locator('button:has-text("Apply Now"), button:has-text("Apply")').first();
      
      if (await applyButton.isVisible({ timeout: 5000 })) {
        await applyButton.click();
        await page.waitForTimeout(2000);

        await this.fillVisibleFields(page, userProfile);

        const uploadInput = page.locator('input[type="file"]').first();
        if (await uploadInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await uploadInput.setInputFiles(resumePath);
          await page.waitForTimeout(1000);
        }

        const continueButton = page.locator('button:has-text("Continue"), button:has-text("Submit")').first();
        if (await continueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await continueButton.click();
          await page.waitForTimeout(2000);
        }

        application.notes = 'Indeed application submitted';
      }

      return { success: true, application };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      application.status = ApplicationStatus.WITHDRAWN;
      application.notes = `Indeed apply failed: ${errorMessage}`;
      
      return { success: false, application, error: errorMessage };
    }
  }

  private async fillGenericApplication(
    page: Page,
    userProfile: UserProfile,
    resumePath: string,
    coverLetterText?: string
  ): Promise<ApplicationResult> {
    this.logger.debug('Filling generic application form');

    const application: Application = {
      id: uuidv4(),
      userId: userProfile.userId,
      jobId: '',
      status: ApplicationStatus.SUBMITTED,
      submittedAt: new Date(),
      platform: 'generic',
      resumeVersion: resumePath,
      lastStatusCheck: new Date(),
      viewCount: 0,
      notes: '',
    };

    try {
      await this.fillVisibleFields(page, userProfile);

      const uploadInput = page.locator('input[type="file"]').first();
      if (await uploadInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await uploadInput.setInputFiles(resumePath);
        await page.waitForTimeout(1000);
      }

      if (coverLetterText) {
        const coverLetterTextarea = page.locator('textarea[name*="cover"], textarea[id*="cover"]').first();
        if (await coverLetterTextarea.isVisible({ timeout: 1000 }).catch(() => false)) {
          await coverLetterTextarea.fill(coverLetterText);
        }
      }

      application.notes = 'Generic application form filled (manual submission may be required)';
      
      return { success: true, application };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      application.status = ApplicationStatus.WITHDRAWN;
      application.notes = `Generic apply failed: ${errorMessage}`;
      
      return { success: false, application, error: errorMessage };
    }
  }

  private async fillVisibleFields(page: Page, userProfile: UserProfile): Promise<void> {
    const fieldMappings: Array<{ selectors: string[]; value: string; type: string }> = [
      {
        selectors: ['input[name*="name" i]', 'input[id*="name" i]', 'input[placeholder*="name" i]'],
        value: `${userProfile.experience?.[0]?.title || ''}`,
        type: 'text',
      },
      {
        selectors: ['input[name*="email" i]', 'input[id*="email" i]', 'input[type="email"]'],
        value: userProfile.userId,
        type: 'email',
      },
      {
        selectors: ['input[name*="phone" i]', 'input[id*="phone" i]', 'input[type="tel"]'],
        value: '',
        type: 'phone',
      },
    ];

    for (const mapping of fieldMappings) {
      for (const selector of mapping.selectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 500 }).catch(() => false)) {
            await element.fill(mapping.value);
            break;
          }
        } catch {
          // Continue to next selector
        }
      }
    }
  }

  private handleEmailApplication(
    application: Application,
    job: JobPosting,
    userProfile: UserProfile,
    coverLetterText?: string
  ): Application {
    application.status = ApplicationStatus.VIEWED;
    application.notes = 'Application requires email submission. Use EmailService to send application.';
    
    return application;
  }

  private async takeScreenshot(page: Page, prefix: string): Promise<string | undefined> {
    if (!this.config.screenshotOnError) return undefined;

    try {
      const filename = `${prefix}-${Date.now()}.png`;
      const filepath = path.join(this.config.screenshotPath, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      return filepath;
    } catch (error) {
      this.logger.error('Failed to take screenshot:', error);
      return undefined;
    }
  }

  private ensureScreenshotDirectory(): void {
    if (this.config.screenshotOnError) {
      if (!fs.existsSync(this.config.screenshotPath)) {
        fs.mkdirSync(this.config.screenshotPath, { recursive: true });
      }
    }
  }

  private async closeBrowser(): Promise<void> {
    for (const context of this.activeContexts) {
      await context.close().catch(() => {});
    }
    this.activeContexts = [];

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
