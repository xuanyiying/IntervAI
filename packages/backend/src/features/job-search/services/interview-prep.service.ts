import { AIService } from '@/core/ai/ai.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  Application,
  JobPosting,
  MockInterviewQuestion,
  StudyMilestone,
  StudyPlan,
  StudyTopic,
  UserProfile,
} from '../interfaces/job-search.interface';

@Injectable()
export class InterviewPrepService {
  private readonly logger = new Logger(InterviewPrepService.name);

  constructor(
    private readonly aiService: AIService,
    private readonly prisma: PrismaService
  ) { }

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

    const totalDays = _daysUntilInterview || 7;

    const dbPlan = await this.prisma.studyPlan.create({
      data: {
        userId,
        jobId: job.id,
        milestones: [],
        progress: 0,
        interviewDate: _interviewDate,
        totalDays,
        estimatedTotalHours: 0,
        prioritySkillGaps: [],
        mockInterviewQuestions: [],
      },
    });

    if (result.success && result.data) {
      const data = result.data as any;
      const prioritySkillGaps = data.skillGaps
        ? data.skillGaps.map((gap: any) =>
          typeof gap === 'string' ? gap : gap.skill
        )
        : [];

      const mockInterviewQuestions = data.mockInterviewQuestions
        ? data.mockInterviewQuestions.map((q: any) => ({
          question: q.question || q,
          difficulty: q.difficulty || 'medium',
          category: q.category,
        }))
        : [];

      const milestones: any[] = [];
      if (data.practiceSchedule) {
        for (const day of data.practiceSchedule) {
          const topics: StudyTopic[] = (day.exercises || []).map(
            (exercise: any, exIndex: number) => ({
              id: `topic-${day.day || 0}-${exIndex}`,
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

          milestones.push({
            id: `milestone-${day.day || milestones.length}`,
            title: day.focus || `Day ${day.day || milestones.length + 1}`,
            description: day.focus || '',
            topics,
            day: day.day || milestones.length + 1,
            estimatedHours: milestoneHours,
          });
        }
      }

      const estimatedTotalHours = milestones.reduce(
        (sum: number, m: StudyMilestone) => sum + (m.estimatedHours || 0),
        0
      );

      await this.prisma.studyPlan.update({
        where: { id: dbPlan.id },
        data: {
          milestones,
          prioritySkillGaps,
          mockInterviewQuestions,
          estimatedTotalHours,
        },
      });

      return {
        id: dbPlan.id,
        userId,
        jobId: job.id,
        milestones,
        progress: 0,
        createdAt: dbPlan.createdAt,
        updatedAt: dbPlan.updatedAt,
        interviewDate: _interviewDate,
        totalDays,
        estimatedTotalHours,
        prioritySkillGaps,
        mockInterviewQuestions,
      };
    }

    return {
      id: dbPlan.id,
      userId,
      jobId: job.id,
      milestones: [],
      progress: 0,
      createdAt: dbPlan.createdAt,
      updatedAt: dbPlan.updatedAt,
      interviewDate: _interviewDate,
      totalDays,
      estimatedTotalHours: 0,
      prioritySkillGaps: [],
      mockInterviewQuestions: [],
    };
  }

  async completeTopic(planId: string, topicId: string): Promise<StudyPlan> {
    const dbPlan = await this.prisma.studyPlan.findUnique({
      where: { id: planId },
    });
    if (!dbPlan) throw new Error(`Study plan ${planId} not found`);

    const milestones: any[] = (dbPlan.milestones as any[]) || [];
    let totalTopics = 0;
    let completedTopics = 0;

    for (const milestone of milestones) {
      for (const topic of milestone.topics) {
        totalTopics++;
        if (topic.id === topicId) topic.completed = true;
        if (topic.completed) completedTopics++;
      }
    }

    const progress = totalTopics > 0 ? completedTopics / totalTopics : 0;

    await this.prisma.studyPlan.update({
      where: { id: planId },
      data: { milestones, progress },
    });

    return {
      id: dbPlan.id,
      userId: dbPlan.userId,
      jobId: dbPlan.jobId,
      milestones,
      progress,
      createdAt: dbPlan.createdAt,
      updatedAt: new Date(),
      interviewDate: dbPlan.interviewDate ?? undefined,
      totalDays: dbPlan.totalDays,
      estimatedTotalHours: dbPlan.estimatedTotalHours,
      prioritySkillGaps: (dbPlan.prioritySkillGaps as string[]) || [],
      mockInterviewQuestions:
        (dbPlan.mockInterviewQuestions as unknown as MockInterviewQuestion[]) || [],
    };
  }

  async getPlan(planId: string): Promise<StudyPlan | null> {
    const dbPlan = await this.prisma.studyPlan.findUnique({
      where: { id: planId },
    });
    if (!dbPlan) return null;

    return {
      id: dbPlan.id,
      userId: dbPlan.userId,
      jobId: dbPlan.jobId,
      milestones: (dbPlan.milestones as any[]) || [],
      progress: dbPlan.progress,
      createdAt: dbPlan.createdAt,
      updatedAt: dbPlan.updatedAt,
      interviewDate: dbPlan.interviewDate ?? undefined,
      totalDays: dbPlan.totalDays,
      estimatedTotalHours: dbPlan.estimatedTotalHours,
      prioritySkillGaps: (dbPlan.prioritySkillGaps as string[]) || [],
      mockInterviewQuestions:
        (dbPlan.mockInterviewQuestions as unknown as MockInterviewQuestion[]) || [],
    };
  }

  async getUserPlans(userId: string): Promise<StudyPlan[]> {
    const dbPlans = await this.prisma.studyPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return dbPlans.map((p) => ({
      id: p.id,
      userId: p.userId,
      jobId: p.jobId,
      milestones: (p.milestones as any[]) || [],
      progress: p.progress,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      interviewDate: p.interviewDate ?? undefined,
      totalDays: p.totalDays,
      estimatedTotalHours: p.estimatedTotalHours,
      prioritySkillGaps: (p.prioritySkillGaps as string[]) || [],
      mockInterviewQuestions:
        (p.mockInterviewQuestions as unknown as MockInterviewQuestion[]) || [],
    }));
  }

  async deletePlan(planId: string): Promise<void> {
    await this.prisma.studyPlan.delete({ where: { id: planId } });
  }
}
