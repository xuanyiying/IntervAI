import { Injectable, Logger } from '@nestjs/common';
import { CoachAgent, StudyPlan } from '../agents/coach.agent';
import { ApplicationTrackingService } from './application-tracking.service';
import {
  Application,
  ApplicationStatus,
  JobPosting,
  UserProfile,
} from '../interfaces/job-search.interface';

@Injectable()
export class InterviewPrepService {
  private readonly logger = new Logger(InterviewPrepService.name);

  // In a production system, study plans would be persisted in DB.
  // For MVP, we keep them in memory.
  private studyPlans: Map<string, StudyPlan> = new Map();

  constructor(
    private readonly coachAgent: CoachAgent,
    private readonly trackingService: ApplicationTrackingService
  ) {}

  /**
   * Called when an application moves to INTERVIEW_REQUESTED status.
   * Instantly triggers the CoachAgent to build a personalized study plan.
   */
  async onInterviewDetected(
    application: Application,
    job: JobPosting,
    userProfile: UserProfile,
    interviewDate?: Date,
    daysUntilInterview?: number
  ): Promise<StudyPlan> {
    this.logger.log(
      `[Coach] Interview detected for application ${application.id} — generating study plan`
    );

    const plan = await this.coachAgent.generateStudyPlan(
      application.userId,
      job,
      userProfile,
      interviewDate,
      daysUntilInterview
    );

    this.studyPlans.set(plan.id, plan);
    return plan;
  }

  /**
   * Manually trigger the coach for a given user + job combo.
   */
  async generatePlan(
    userId: string,
    job: JobPosting,
    userProfile: UserProfile,
    interviewDate?: Date,
    daysUntilInterview?: number
  ): Promise<StudyPlan> {
    const plan = await this.coachAgent.generateStudyPlan(
      userId,
      job,
      userProfile,
      interviewDate,
      daysUntilInterview
    );
    this.studyPlans.set(plan.id, plan);
    return plan;
  }

  /**
   * Mark a topic as completed and update plan progress.
   */
  completeTopic(planId: string, topicId: string): StudyPlan {
    const plan = this.studyPlans.get(planId);
    if (!plan) throw new Error(`Study plan ${planId} not found`);

    let totalTopics = 0;
    let completedTopics = 0;

    for (const milestone of plan.milestones) {
      for (const topic of milestone.topics) {
        totalTopics++;
        if (topic.id === topicId) topic.completed = true;
        if (topic.completed) completedTopics++;
      }
    }

    plan.progress = totalTopics > 0 ? completedTopics / totalTopics : 0;
    return plan;
  }

  /** Retrieve a plan by ID */
  getPlan(planId: string): StudyPlan | undefined {
    return this.studyPlans.get(planId);
  }

  /** Get all plans for a user */
  getUserPlans(userId: string): StudyPlan[] {
    return [...this.studyPlans.values()].filter((p) => p.userId === userId);
  }
}
