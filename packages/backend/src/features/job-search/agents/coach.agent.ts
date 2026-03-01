import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { JobPosting, UserProfile } from '../interfaces/job-search.interface';
import { AIEngine } from '../../../core/ai/ai.engine';
import { PromptScenario } from '../../../core/ai-provider/interfaces/prompt-template.interface';

// ─── Domain Types ─────────────────────────────────────────────────────────────

export enum TopicCategory {
  TECHNICAL_SKILLS = 'TECHNICAL_SKILLS',
  BEHAVIORAL_QUESTIONS = 'BEHAVIORAL_QUESTIONS',
  COMPANY_RESEARCH = 'COMPANY_RESEARCH',
  INDUSTRY_KNOWLEDGE = 'INDUSTRY_KNOWLEDGE',
  CODING_PRACTICE = 'CODING_PRACTICE',
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
}

export enum PriorityLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface PracticeQuestion {
  question: string;
  hint?: string;
  category: TopicCategory;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DailyMilestone {
  day: number;
  date: Date;
  title: string;
  topics: PrepTopic[];
  estimatedHours: number;
}

export interface PrepTopic {
  id: string;
  category: TopicCategory;
  title: string;
  description: string;
  priority: PriorityLevel;
  estimatedMinutes: number;
  practiceQuestions: PracticeQuestion[];
  resources: string[];
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  userId: string;
  jobId: string;

  // Job context
  jobTitle: string;
  company: string;
  interviewDate?: Date;

  // Plan structure
  totalDays: number;
  milestones: DailyMilestone[];
  prioritySkillGaps: string[];

  // Overall mock questions
  mockInterviewQuestions: PracticeQuestion[];

  // Metadata
  generatedAt: Date;
  estimatedTotalHours: number;
  progress: number; // 0–1
}

// ─── CoachAgent ────────────────────────────────────────────────────────────────

@Injectable()
export class CoachAgent {
  private readonly logger = new Logger(CoachAgent.name);

  constructor(
    @Optional() @Inject(AIEngine) private readonly aiEngine?: AIEngine
  ) {}

  /**
   * Try to generate an LLM-enhanced description for a topic.
   * Falls back to the provided default description on any failure.
   */
  private async enrichWithLLM(
    topicTitle: string,
    job: JobPosting,
    defaultDescription: string
  ): Promise<string> {
    if (!this.aiEngine) return defaultDescription;

    try {
      const prompt = `You are an elite career coach. Write a concise, actionable 3-4 sentence study guide for the preparation topic "${topicTitle}" for a candidate interviewing for the "${job.title}" role at ${job.company}. Focus on what to study and how to practice. Be specific to the role. Do NOT use markdown. Output plain text only.`;
      const result = await this.aiEngine.generateContent(
        PromptScenario.INTERVIEW_PREPARATION,
        {
          question: prompt,
          job_description: job.description ?? '',
          resume_content: '',
          experience_description: '',
        },
        { variant: 'general', language: 'en' }
      );
      return result && result.trim().length > 10
        ? result.trim()
        : defaultDescription;
    } catch (err) {
      this.logger.warn(
        `LLM enrichment failed for "${topicTitle}", using template fallback`
      );
      return defaultDescription;
    }
  }

  /**
   * Generates a personalized N-day interview preparation study plan
   * based on the JobPosting and UserProfile.
   */
  async generateStudyPlan(
    userId: string,
    job: JobPosting,
    userProfile: UserProfile,
    interviewDate?: Date,
    daysUntilInterview?: number
  ): Promise<StudyPlan> {
    const days = daysUntilInterview ?? this.calcDaysUntil(interviewDate);
    const actualDays = Math.max(1, Math.min(14, days)); // clamp 1–14

    this.logger.log(
      `Generating ${actualDays}-day study plan for user ${userId} targeting ${job.title} @ ${job.company}`
    );

    // 1. Identify skill gaps against preferred skills
    const userSkillNames = userProfile.skills.map((s) => s.name.toLowerCase());
    const jobSkills = job.preferredSkills ?? [];
    const skillGaps = jobSkills.filter(
      (s) => !userSkillNames.includes(s.toLowerCase())
    );

    // 2. Build daily milestones
    const milestones = this.buildMilestones(
      actualDays,
      job,
      skillGaps,
      userProfile
    );

    // 3. Generate top mock interview questions
    const mockQuestions = this.generateMockQuestions(job, skillGaps);

    const totalHours = milestones.reduce((acc, m) => acc + m.estimatedHours, 0);

    const plan: StudyPlan = {
      id: uuidv4(),
      userId,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      interviewDate,
      totalDays: actualDays,
      milestones,
      prioritySkillGaps: skillGaps.slice(0, 5),
      mockInterviewQuestions: mockQuestions,
      generatedAt: new Date(),
      estimatedTotalHours: totalHours,
      progress: 0,
    };

    this.logger.log(
      `Study plan generated: ${plan.id} (${actualDays} days, ~${totalHours}h total)`
    );

    return plan;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private calcDaysUntil(date?: Date): number {
    if (!date) return 7;
    const diff = date.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private buildMilestones(
    totalDays: number,
    job: JobPosting,
    skillGaps: string[],
    user: UserProfile
  ): DailyMilestone[] {
    const milestones: DailyMilestone[] = [];
    const today = new Date();

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() + day - 1);

      const topics = this.getTopicsForDay(day, totalDays, job, skillGaps, user);
      const estimatedHours = topics.reduce(
        (acc, t) => acc + t.estimatedMinutes / 60,
        0
      );

      milestones.push({
        day,
        date,
        title: this.getDayTitle(day, totalDays),
        topics,
        estimatedHours: Math.round(estimatedHours * 10) / 10,
      });
    }

    return milestones;
  }

  private getDayTitle(day: number, total: number): string {
    if (day === 1) return '🚀 Kickoff – Company & Role Research';
    if (day === total) return '🎯 Final Day – Full Mock Interview Run-through';
    const phase = day / total;
    if (phase < 0.35) return `📚 Day ${day} – Technical Deep-Dive`;
    if (phase < 0.65) return `💬 Day ${day} – Behavioral & Situational Prep`;
    if (phase < 0.85) return `🧠 Day ${day} – Mock Interview Practice`;
    return `🔄 Day ${day} – Review & Consolidation`;
  }

  private getTopicsForDay(
    day: number,
    total: number,
    job: JobPosting,
    skillGaps: string[],
    user: UserProfile
  ): PrepTopic[] {
    const topics: PrepTopic[] = [];
    const phase = day / total;

    if (day === 1) {
      // Day 1: always company research + role analysis
      topics.push(
        this.buildTopic(
          TopicCategory.COMPANY_RESEARCH,
          `Research ${job.company}`,
          `Study ${job.company}'s mission, products, recent news, and culture. Understand what makes them unique and how you can contribute.`,
          PriorityLevel.HIGH,
          60,
          [
            {
              question: `Why do you want to work at ${job.company}?`,
              difficulty: 'easy',
              category: TopicCategory.COMPANY_RESEARCH,
            },
            {
              question: `How does ${job.company}'s product/service differentiate from competitors?`,
              difficulty: 'medium',
              category: TopicCategory.COMPANY_RESEARCH,
            },
          ],
          [
            `${job.company} official website`,
            'LinkedIn company page',
            'Glassdoor reviews',
            'Crunchbase profile',
          ]
        )
      );
      topics.push(
        this.buildTopic(
          TopicCategory.INDUSTRY_KNOWLEDGE,
          `Analyze the ${job.title} JD`,
          `Read the full job description carefully. Highlight required vs. preferred skills. Map each to your experience.`,
          PriorityLevel.HIGH,
          45,
          [
            {
              question: `Walk me through how your background aligns with the ${job.title} role.`,
              difficulty: 'medium',
              category: TopicCategory.INDUSTRY_KNOWLEDGE,
            },
          ],
          [
            'LinkedIn job description',
            'Similar job postings for market comparison',
          ]
        )
      );
    } else if (phase < 0.4) {
      // Early phase: technical skills
      const gap =
        skillGaps[day % Math.max(skillGaps.length, 1)] ??
        job.preferredSkills?.[0] ??
        'core technical skills';
      topics.push(
        this.buildTopic(
          TopicCategory.TECHNICAL_SKILLS,
          `Deep-dive: ${gap}`,
          `Study and practice ${gap}. Focus on fundamentals, common patterns, and edge cases interviewers typically probe.`,
          PriorityLevel.HIGH,
          90,
          [
            {
              question: `Explain how ${gap} works under the hood.`,
              difficulty: 'hard',
              category: TopicCategory.TECHNICAL_SKILLS,
            },
            {
              question: `What are the trade-offs of using ${gap} vs alternatives?`,
              difficulty: 'medium',
              category: TopicCategory.TECHNICAL_SKILLS,
            },
          ],
          [
            `${gap} official documentation`,
            'YouTube tutorials',
            'LeetCode / HackerRank tagged problems',
          ]
        )
      );
      if (day % 2 === 0) {
        topics.push(
          this.buildTopic(
            TopicCategory.CODING_PRACTICE,
            'Coding Practice Session',
            `Solve 2-3 algorithmic problems relevant to ${job.title}. Focus on data structures, time/space complexity, and clear code communication.`,
            PriorityLevel.MEDIUM,
            75,
            [
              {
                question:
                  'Describe your approach to solving an unfamiliar algorithmic problem in an interview.',
                difficulty: 'medium',
                category: TopicCategory.CODING_PRACTICE,
              },
            ],
            ['LeetCode (Easy → Medium)', 'NeetCode.io roadmap']
          )
        );
      }
    } else if (phase < 0.7) {
      // Mid phase: behavioral + situational
      topics.push(
        this.buildTopic(
          TopicCategory.BEHAVIORAL_QUESTIONS,
          'STAR Method Behavioral Practice',
          `Prepare 2-3 STAR stories from your past experience. Focus on leadership, conflict resolution, and impact.`,
          PriorityLevel.HIGH,
          60,
          [
            {
              question:
                'Tell me about a time you disagreed with your manager. How did you handle it?',
              difficulty: 'medium',
              category: TopicCategory.BEHAVIORAL_QUESTIONS,
            },
            {
              question: 'Describe your greatest professional achievement.',
              difficulty: 'easy',
              category: TopicCategory.BEHAVIORAL_QUESTIONS,
            },
            {
              question:
                'Tell me about a time you made a mistake. How did you recover?',
              difficulty: 'hard',
              category: TopicCategory.BEHAVIORAL_QUESTIONS,
            },
          ],
          ['Amazon Leadership Principles', 'STAR method guide']
        )
      );
    } else if (phase < 0.9) {
      // Late phase: mock interviews
      topics.push(
        this.buildTopic(
          TopicCategory.SYSTEM_DESIGN,
          `System Design: ${job.title} scenario`,
          `Practice designing a real-world system relevant to ${job.title}. Focus on scalability, trade-offs, and communication.`,
          PriorityLevel.HIGH,
          90,
          [
            {
              question: `Design a core component of ${job.company}'s system at scale.`,
              difficulty: 'hard',
              category: TopicCategory.SYSTEM_DESIGN,
            },
          ],
          [
            'System Design Primer (GitHub)',
            'Designing Data-Intensive Applications (book)',
          ]
        )
      );
    } else {
      // Final day: full run-through
      topics.push(
        this.buildTopic(
          TopicCategory.BEHAVIORAL_QUESTIONS,
          'Final Mock Interview Run-through',
          `Do a timed, full-format mock interview. Cover all categories: behavioral, technical, situational, and questions for the interviewer.`,
          PriorityLevel.HIGH,
          120,
          [
            {
              question: 'Tell me about yourself.',
              difficulty: 'easy',
              category: TopicCategory.BEHAVIORAL_QUESTIONS,
            },
            {
              question: 'Why are you leaving your current role?',
              difficulty: 'medium',
              category: TopicCategory.BEHAVIORAL_QUESTIONS,
            },
            {
              question: 'Where do you see yourself in 3 years?',
              difficulty: 'medium',
              category: TopicCategory.BEHAVIORAL_QUESTIONS,
            },
            {
              question: 'Do you have questions for us?',
              difficulty: 'easy',
              category: TopicCategory.BEHAVIORAL_QUESTIONS,
            },
          ],
          ['Glassdoor interview reviews for ' + job.company]
        )
      );
    }

    return topics;
  }

  private buildTopic(
    category: TopicCategory,
    title: string,
    description: string,
    priority: PriorityLevel,
    estimatedMinutes: number,
    practiceQuestions: PracticeQuestion[],
    resources: string[]
  ): PrepTopic {
    return {
      id: uuidv4(),
      category,
      title,
      description,
      priority,
      estimatedMinutes,
      practiceQuestions,
      resources,
      completed: false,
    };
  }

  private generateMockQuestions(
    job: JobPosting,
    skillGaps: string[]
  ): PracticeQuestion[] {
    const questions: PracticeQuestion[] = [
      {
        question:
          'Tell me about yourself and why you are interested in this role.',
        difficulty: 'easy',
        category: TopicCategory.BEHAVIORAL_QUESTIONS,
      },
      {
        question: `What excites you most about working at ${job.company}?`,
        difficulty: 'easy',
        category: TopicCategory.COMPANY_RESEARCH,
      },
      {
        question: `Walk me through a project where you used ${job.preferredSkills?.[0] ?? 'your core skills'}.`,
        difficulty: 'medium',
        category: TopicCategory.TECHNICAL_SKILLS,
      },
      {
        question:
          'Describe a time you had to deliver work under tight deadline pressure.',
        difficulty: 'medium',
        category: TopicCategory.BEHAVIORAL_QUESTIONS,
      },
      {
        question:
          'How would you approach onboarding onto a new codebase / domain?',
        difficulty: 'medium',
        category: TopicCategory.BEHAVIORAL_QUESTIONS,
      },
    ];

    // Add skill-gap-specific mock questions
    skillGaps.slice(0, 3).forEach((skill) => {
      questions.push({
        question: `We use ${skill} heavily. Describe your experience and how you'd ramp up quickly.`,
        difficulty: 'hard',
        category: TopicCategory.TECHNICAL_SKILLS,
        hint: `Be honest about your current level. Show a clear learning plan and past examples of fast ramp-up.`,
      });
    });

    return questions;
  }
}
