import { AIService } from '@/core/ai/ai.service';
import { Injectable, Logger } from '@nestjs/common';
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
  category?: string;
}

export interface StudyMilestone {
  id: string;
  title: string;
  description: string;
  topics: StudyTopic[];
  deadline?: Date;
  day?: number;
  estimatedHours?: number;
}

export interface MockInterviewQuestion {
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
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
  totalDays: number;
  estimatedTotalHours: number;
  prioritySkillGaps: string[];
  mockInterviewQuestions: MockInterviewQuestion[];
}

@Injectable()
export class InterviewPrepService {
  private readonly logger = new Logger(InterviewPrepService.name);

  private studyPlans: Map<string, StudyPlan> = new Map();

  constructor(private readonly aiService: AIService) {}

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
    _interviewDate?: Date,
    _daysUntilInterview?: number
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
    const totalDays = _daysUntilInterview || 7;

    const plan: StudyPlan = {
      id: planId,
      userId,
      jobId: job.id,
      milestones: [],
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      interviewDate: _interviewDate,
      totalDays,
      estimatedTotalHours: 0,
      prioritySkillGaps: [],
      mockInterviewQuestions: [],
    };

    if (result.success && result.data) {
      const data = result.data as any;

      // Extract skill gaps
      if (data.skillGaps) {
        plan.prioritySkillGaps = data.skillGaps.map((gap: any) =>
          typeof gap === 'string' ? gap : gap.skill
        );
      }

      // Extract mock interview questions
      if (data.mockInterviewQuestions) {
        plan.mockInterviewQuestions = data.mockInterviewQuestions.map(
          (q: any) => ({
            question: q.question || q,
            difficulty: q.difficulty || 'medium',
            category: q.category,
          })
        );
      }

      // Build milestones from practice schedule
      if (data.practiceSchedule) {
        plan.milestones = data.practiceSchedule.map(
          (day: any, index: number) => {
            const topics = (day.exercises || []).map(
              (exercise: any, exIndex: number) => ({
                id: `topic-${index}-${exIndex}`,
                title: typeof exercise === 'string' ? exercise : exercise.title,
                description:
                  typeof exercise === 'string'
                    ? exercise
                    : exercise.description || exercise.title,
                completed: false,
                priority: (exercise.priority || 'medium') as
                  | 'high'
                  | 'medium'
                  | 'low',
                estimatedHours: exercise.estimatedHours || 1,
                resources: exercise.resources || [],
                category: exercise.category || 'general',
              })
            );

            const milestoneHours = topics.reduce(
              (sum: number, t: StudyTopic) => sum + t.estimatedHours,
              0
            );

            return {
              id: `milestone-${index}`,
              title: day.focus || `Day ${day.day || index + 1}`,
              description: day.focus || '',
              topics,
              day: day.day || index + 1,
              estimatedHours: milestoneHours,
            };
          }
        );

        // Calculate total hours
        plan.estimatedTotalHours = plan.milestones.reduce(
          (sum: number, m: StudyMilestone) => sum + (m.estimatedHours || 0),
          0
        );
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
