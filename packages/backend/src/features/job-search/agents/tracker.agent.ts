import { Injectable, Logger } from '@nestjs/common';
import {
  Application,
  ApplicationStatus,
} from '../interfaces/job-search.interface';

@Injectable()
export class TrackerAgent {
  private readonly logger = new Logger(TrackerAgent.name);

  /**
   * Simulates tracking an application status by analyzing incoming "emails" or status updates
   */
  async processUpdate(
    application: Application,
    updateContent: string,
    source: string // e.g., 'email', 'linkedin_scraper'
  ): Promise<Application> {
    this.logger.log(
      `Processing update for application ${application.id} from ${source}`
    );

    application.lastStatusCheck = new Date();

    // MVP NLP simulation via keyword matching
    const content = updateContent.toLowerCase();

    let newStatus = application.status;
    let newNote = '';

    if (
      content.includes('interview') ||
      content.includes('schedule') ||
      content.includes('availability')
    ) {
      newStatus = ApplicationStatus.INTERVIEW_REQUESTED;
      newNote = `Interview requested via ${source}`;
    } else if (
      content.includes('offer') ||
      content.includes('congratulations')
    ) {
      newStatus = ApplicationStatus.OFFER;
      newNote = `Offer extended via ${source}`;
    } else if (
      content.includes('regret') ||
      content.includes('not moving forward') ||
      content.includes('other candidates')
    ) {
      newStatus = ApplicationStatus.REJECTED;
      newNote = `Rejected via ${source}`;
    } else if (content.includes('viewed') || content.includes('downloaded')) {
      newStatus = ApplicationStatus.VIEWED;
      application.viewCount = (application.viewCount || 0) + 1;
      newNote = `Application viewed via ${source}`;
    } else {
      newStatus = ApplicationStatus.UNDER_REVIEW;
      newNote = `Application update received but status unclear via ${source}`;
    }

    application.status = newStatus;

    const timestampAndNote = `[${new Date().toISOString()}] ${newNote}`;
    application.notes = application.notes
      ? `${application.notes}\n${timestampAndNote}`
      : timestampAndNote;

    return application;
  }
}
