import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '@/core/ai/ai.service';
import {
  Application,
  JobPosting,
  UserProfile,
} from '../interfaces/job-search.interface';

export interface StudyTopic {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  resources: string[];
}

export interface StudyMilestone {
  id: string;
  title: string;
  description: string;
  topics: StudyTopic[];
  deadline?: Date;
}

export interface StudyPlan {
  id: string;
  userId: string;
  jobId: string;
  milestones: StudyMilestone[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  interviewDate?: Date;
}

@Injectable()
export class InterviewPrepService {
  private readonly logger = new Logger(InterviewPrepService.name);

  private studyPlans: Map<string, StudyPlan> = new Map();

  constructor(private readonly aiService: AIService) { }

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

    const plan = await this.generatePlan(
      application.userId,
      job,
      userProfile,
      interviewDate,
      daysUntilInterview
    );

    return plan;
  }

  async generatePlan(
    userId: string,
    job: JobPosting,
    userProfile: UserProfile,
    interviewDate?: Date,
    daysUntilInterview?: number
  ): Promise<StudyPlan> {
    const result = await this.aiService.executeSkill(
      'interview-prep',
      {
        jobDescription: `${job.title} at ${job.company}\n\n${job.description}`,
        resumeText: userProfile.skills?.join(', ') || '',
        interviewType: 'technical',
      },
      userId
    );

    const planId = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const plan: StudyPlan = {
      id: planId,
      userId,
      jobId: job.id,
      milestones: [],
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      interviewDate,
    };

    if (result.success && result.data) {
      const data = result.data as any;
      if (data.practiceSchedule) {
        plan.milestones = data.practiceSchedule.map((day: any, index: number) => ({
          id: `milestone-${index}`,
          title: day.focus || `Day ${day.day}`,
          description: day.focus || '',
          topics: (day.exercises || []).map((exercise: string, exIndex: number) => ({
            id: `topic-${index}-${exIndex}`,
            title: exercise,
            description: exercise,
            completed: false,
            priority: 'medium' as const,
            estimatedHours: 1,
            resources: [],
          })),
        }));
      }
    }

    this.studyPlans.set(plan.id, plan);
    return plan;
  }

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
    plan.updatedAt = new Date();
    return plan;
  }

  getPlan(planId: string): StudyPlan | undefined {
    return this.studyPlans.get(planId);
  }

  getUserPlans(userId: string): StudyPlan[] {
    return Array.from(this.studyPlans.values()).filter(
      (plan) => plan.userId === userId
    );
  }

  getJobPlans(jobId: string): StudyPlan[] {
    return Array.from(this.studyPlans.values()).filter(
      (plan) => plan.jobId === jobId
    );
  }

  deletePlan(planId: string): boolean {
    return this.studyPlans.delete(planId);
  }
}
