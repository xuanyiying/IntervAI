import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Application,
  ApplicationStatus,
} from '../interfaces/job-search.interface';
import { JobSearchConfig } from '../config';

interface StatusPattern {
  patterns: RegExp[];
  status: ApplicationStatus;
  priority: number;
}

interface TrackingUpdate {
  applicationId: string;
  source: string;
  content: string;
  timestamp: Date;
  detectedStatus?: ApplicationStatus;
}

@Injectable()
export class TrackerAgent {
  private readonly logger = new Logger(TrackerAgent.name);
  private readonly config: JobSearchConfig['tracking'];
  private readonly statusPatterns: StatusPattern[];

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<JobSearchConfig['tracking']>('jobSearch.tracking')!;
    this.statusPatterns = this.initializeStatusPatterns();
  }

  async processUpdate(
    application: Application,
    updateContent: string,
    source: string
  ): Promise<Application> {
    this.logger.log(
      `Processing update for application ${application.id} from ${source}`
    );

    application.lastStatusCheck = new Date();

    const detectedStatus = this.detectStatusFromContent(updateContent);
    const note = this.generateNote(detectedStatus, source, updateContent);

    if (detectedStatus !== application.status) {
      const previousStatus = application.status;
      application.status = detectedStatus;
      
      this.logger.log(
        `Application ${application.id} status changed: ${previousStatus} -> ${detectedStatus}`
      );
    }

    if (detectedStatus === ApplicationStatus.VIEWED) {
      application.viewCount = (application.viewCount || 0) + 1;
    }

    const timestampAndNote = `[${new Date().toISOString()}] ${note}`;
    application.notes = application.notes
      ? `${application.notes}\n${timestampAndNote}`
      : timestampAndNote;

    return application;
  }

  processEmailUpdate(
    application: Application,
    emailSubject: string,
    emailBody: string,
    senderEmail: string
  ): Application {
    this.logger.debug(
      `Processing email update for application ${application.id} from ${senderEmail}`
    );

    const combinedContent = `${emailSubject} ${emailBody}`;
    const detectedStatus = this.detectStatusFromContent(combinedContent);
    const note = this.generateNote(detectedStatus, `email:${senderEmail}`, combinedContent);

    application.lastStatusCheck = new Date();

    if (detectedStatus !== application.status) {
      const previousStatus = application.status;
      application.status = detectedStatus;
      
      this.logger.log(
        `Application ${application.id} status changed via email: ${previousStatus} -> ${detectedStatus}`
      );
    }

    if (detectedStatus === ApplicationStatus.VIEWED) {
      application.viewCount = (application.viewCount || 0) + 1;
    }

    const timestampAndNote = `[${new Date().toISOString()}] ${note}`;
    application.notes = application.notes
      ? `${application.notes}\n${timestampAndNote}`
      : timestampAndNote;

    return application;
  }

  processApiUpdate(
    application: Application,
    apiData: Record<string, any>,
    platform: string
  ): Application {
    this.logger.debug(
      `Processing API update for application ${application.id} from ${platform}`
    );

    const status = this.mapApiStatus(apiData.status, platform);
    const content = apiData.message || apiData.note || `Status update from ${platform}`;

    application.lastStatusCheck = new Date();

    if (status && status !== application.status) {
      const previousStatus = application.status;
      application.status = status;
      
      this.logger.log(
        `Application ${application.id} status changed via API: ${previousStatus} -> ${status}`
      );
    }

    if (apiData.viewCount !== undefined) {
      application.viewCount = apiData.viewCount;
    }

    if (apiData.responseTime !== undefined) {
      application.responseTime = apiData.responseTime;
    }

    const timestampAndNote = `[${new Date().toISOString()}] API Update from ${platform}: ${content}`;
    application.notes = application.notes
      ? `${application.notes}\n${timestampAndNote}`
      : timestampAndNote;

    return application;
  }

  private detectStatusFromContent(content: string): ApplicationStatus {
    const normalizedContent = content.toLowerCase();
    
    const matchedPatterns: Array<{ status: ApplicationStatus; priority: number }> = [];

    for (const patternConfig of this.statusPatterns) {
      for (const pattern of patternConfig.patterns) {
        if (pattern.test(normalizedContent)) {
          matchedPatterns.push({
            status: patternConfig.status,
            priority: patternConfig.priority,
          });
          break;
        }
      }
    }

    if (matchedPatterns.length === 0) {
      return ApplicationStatus.UNDER_REVIEW;
    }

    matchedPatterns.sort((a, b) => b.priority - a.priority);
    return matchedPatterns[0].status;
  }

  private generateNote(
    status: ApplicationStatus,
    source: string,
    content: string
  ): string {
    const statusMessages: Record<ApplicationStatus, string> = {
      [ApplicationStatus.SUBMITTED]: 'Application submitted',
      [ApplicationStatus.VIEWED]: 'Application viewed by employer',
      [ApplicationStatus.UNDER_REVIEW]: 'Application under review',
      [ApplicationStatus.INTERVIEW_REQUESTED]: 'Interview requested',
      [ApplicationStatus.INTERVIEW_COMPLETED]: 'Interview completed',
      [ApplicationStatus.OFFER]: 'Offer received',
      [ApplicationStatus.REJECTED]: 'Application rejected',
      [ApplicationStatus.WITHDRAWN]: 'Application withdrawn',
    };

    let note = `${statusMessages[status] || 'Status update'} via ${source}`;

    const extractedInfo = this.extractRelevantInfo(content);
    if (extractedInfo) {
      note += ` - ${extractedInfo}`;
    }

    return note;
  }

  private extractRelevantInfo(content: string): string | null {
    const patterns = [
      {
        regex: /interview.*?(?:on|at|scheduled for)\s+([a-zA-Z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?(?:\s+at\s+\d{1,2}:\d{2}\s*(?:am|pm)?)?)/i,
        label: 'Interview',
      },
      {
        regex: /offer.*?\$([0-9,]+(?:\.[0-9]{2})?)/i,
        label: 'Offer amount',
      },
      {
        regex: /position.*?:\s*([^\n.]+)/i,
        label: 'Position',
      },
    ];

    for (const { regex, label } of patterns) {
      const match = content.match(regex);
      if (match) {
        return `${label}: ${match[1].trim()}`;
      }
    }

    return null;
  }

  private mapApiStatus(apiStatus: string, platform: string): ApplicationStatus | null {
    const platformMappings: Record<string, Record<string, ApplicationStatus>> = {
      linkedin: {
        'APPLIED': ApplicationStatus.SUBMITTED,
        'VIEWED': ApplicationStatus.VIEWED,
        'IN_REVIEW': ApplicationStatus.UNDER_REVIEW,
        'INTERVIEW': ApplicationStatus.INTERVIEW_REQUESTED,
        'OFFERED': ApplicationStatus.OFFER,
        'REJECTED': ApplicationStatus.REJECTED,
        'WITHDRAWN': ApplicationStatus.WITHDRAWN,
      },
      indeed: {
        'applied': ApplicationStatus.SUBMITTED,
        'viewed': ApplicationStatus.VIEWED,
        'employer_responded': ApplicationStatus.INTERVIEW_REQUESTED,
        'interviewing': ApplicationStatus.INTERVIEW_REQUESTED,
        'offer': ApplicationStatus.OFFER,
        'rejected': ApplicationStatus.REJECTED,
        'withdrawn': ApplicationStatus.WITHDRAWN,
      },
      glassdoor: {
        'submitted': ApplicationStatus.SUBMITTED,
        'reviewed': ApplicationStatus.VIEWED,
        'phone_screen': ApplicationStatus.INTERVIEW_REQUESTED,
        'interview': ApplicationStatus.INTERVIEW_REQUESTED,
        'offer': ApplicationStatus.OFFER,
        'rejected': ApplicationStatus.REJECTED,
      },
    };

    const mapping = platformMappings[platform.toLowerCase()];
    if (mapping && apiStatus) {
      return mapping[apiStatus] || null;
    }

    return null;
  }

  private initializeStatusPatterns(): StatusPattern[] {
    return [
      {
        patterns: [
          /\boffer\b/i,
          /\bcongratulations?\b/i,
          /\bwelcome\s+(?:to\s+the\s+team|aboard)\b/i,
          /\bwe\s+are\s+pleased\s+to\s+offer\b/i,
          /\bemployment\s+offer\b/i,
          /\bjob\s+offer\b/i,
        ],
        status: ApplicationStatus.OFFER,
        priority: 100,
      },
      {
        patterns: [
          /\binterview\b/i,
          /\bschedule\s+(?:an?\s+)?(?:interview|call|meeting)\b/i,
          /\bavailability\s+for\s+(?:an?\s+)?(?:interview|call)\b/i,
          /\bphone\s+screen\b/i,
          /\btechnical\s+(?:interview|assessment)\b/i,
          /\bonsite\b/i,
          /\bvideo\s+(?:call|interview)\b/i,
          /\bzoom\s+(?:call|meeting|interview)\b/i,
          /\bteams\s+meeting\b/i,
          /\bgoogle\s+meet\b/i,
        ],
        status: ApplicationStatus.INTERVIEW_REQUESTED,
        priority: 90,
      },
      {
        patterns: [
          /\binterview\s+(?:completed|done|finished)\b/i,
          /\bthank\s+you\s+for\s+(?:your\s+time|coming\s+in)\b/i,
          /\bwe\s+(?:will\s+)?(?:be\s+in\s+touch|follow\s+up)\b/i,
          /\bdecision\s+(?:soon|next\s+week)\b/i,
        ],
        status: ApplicationStatus.INTERVIEW_COMPLETED,
        priority: 85,
      },
      {
        patterns: [
          /\breject(ed)?\b/i,
          /\bnot\s+(?:moving\s+forward|proceeding|selected)\b/i,
          /\bthank\s+you\s+for\s+your\s+interest\b/i,
          /\bwe\s+have\s+decided\s+to\s+(?:go\s+with|pursue)\b/i,
          /\bposition\s+has\s+been\s+filled\b/i,
          /\bwe\s+are\s+unable\s+to\s+proceed\b/i,
          /\bregret\s+to\s+inform\b/i,
          /\bwe\s+have\s+chosen\s+another\b/i,
          /\bbetter\s+suited\s+candidates?\b/i,
        ],
        status: ApplicationStatus.REJECTED,
        priority: 80,
      },
      {
        patterns: [
          /\bviewed\b/i,
          /\bdownloaded\s+(?:your\s+)?resume\b/i,
          /\bopened\s+(?:your\s+)?application\b/i,
          /\breviewed\s+(?:your\s+)?(?:profile|application)\b/i,
        ],
        status: ApplicationStatus.VIEWED,
        priority: 70,
      },
      {
        patterns: [
          /\bunder\s+review\b/i,
          /\bbeing\s+reviewed\b/i,
          /\bin\s+review\b/i,
          /\bprocessing\b/i,
          /\bassessment\b/i,
        ],
        status: ApplicationStatus.UNDER_REVIEW,
        priority: 60,
      },
    ];
  }

  shouldTriggerFollowUp(application: Application): boolean {
    if (application.status === ApplicationStatus.OFFER || 
        application.status === ApplicationStatus.REJECTED ||
        application.status === ApplicationStatus.WITHDRAWN) {
      return false;
    }

    const daysSinceLastCheck = this.getDaysSince(application.lastStatusCheck);
    
    switch (application.status) {
      case ApplicationStatus.SUBMITTED:
        return daysSinceLastCheck >= 7;
      case ApplicationStatus.VIEWED:
        return daysSinceLastCheck >= 5;
      case ApplicationStatus.UNDER_REVIEW:
        return daysSinceLastCheck >= 10;
      case ApplicationStatus.INTERVIEW_REQUESTED:
        return daysSinceLastCheck >= 3;
      case ApplicationStatus.INTERVIEW_COMPLETED:
        return daysSinceLastCheck >= 7;
      default:
        return false;
    }
  }

  private getDaysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
