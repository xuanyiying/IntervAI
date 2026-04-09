import {
  InterviewDifficulty,
  InterviewQuestion,
  InterviewQuestionType,
} from '@/types';
import { AIService } from '@/core/ai/ai.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InterviewAIService {
  private readonly logger = new Logger(InterviewAIService.name);
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 1000;

  constructor(
    private aiService: AIService,
    private configService: ConfigService
  ) {}

  private get aiModel(): string {
    return this.aiService.getModel() || this.configService.get('AI_MODEL') || 'openrouter:deepseek/deepseek-chat';
  }

  /**
   * Generate interview questions using interview-question-generator skill
   */
  async generateInterviewQuestions(
    jobDescription: string,
    resumeContent: string,
    count: number = 10,
    userId: string,
  ): Promise<InterviewQuestion[]> {
    this.logger.log(
      `Generating interview questions via interview-question-generator skill (count: ${count})`
    );

    try {
      const data = await this.executeSkillWithRetry(
        'interview-question-generator',
        {
          jobDescription,
          resumeText: resumeContent,
          count,
          difficulty: 'mixed',
        },
        userId,
        {
          fallback: async () => {
            this.logger.warn('Using template-based questions as fallback');
            return this.generateTemplateQuestions(jobDescription, count);
          }
        }
      );

      const questions = data?.questions || [];

      if (!Array.isArray(questions)) {
        return [];
      }

      return questions.map((q: any) => ({
        questionType: q.category || q.questionType || 'behavioral',
        question: q.question,
        suggestedAnswer: q.sampleAnswer?.example || q.suggestedAnswer || q.context || '',
        tips: Array.isArray(q.tips) ? q.tips : [q.tips].filter(Boolean),
        difficulty: q.difficulty || 'medium',
      }));
    } catch (error) {
      this.logger.error('Error generating interview questions:', error);
      throw new Error(`Failed to generate interview questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateTemplateQuestions(_jobDescription: string, count: number = 10): InterviewQuestion[] {
    const templates = [
      { questionType: InterviewQuestionType.BEHAVIORAL, question: 'Tell me about a challenging project you worked on.', suggestedAnswer: '', tips: ['Use STAR method'], difficulty: InterviewDifficulty.MEDIUM },
      { questionType: InterviewQuestionType.TECHNICAL, question: 'Describe your experience with relevant technologies.', suggestedAnswer: '', tips: ['Be specific about your role'], difficulty: InterviewDifficulty.MEDIUM },
      { questionType: InterviewQuestionType.SITUATIONAL, question: 'How do you handle tight deadlines?', suggestedAnswer: '', tips: ['Provide examples'], difficulty: InterviewDifficulty.EASY },
      { questionType: InterviewQuestionType.BEHAVIORAL, question: 'Describe a time when you had to learn a new technology quickly.', suggestedAnswer: '', tips: ['Focus on learning process'], difficulty: InterviewDifficulty.MEDIUM },
      { questionType: InterviewQuestionType.TECHNICAL, question: 'What is your approach to debugging complex issues?', suggestedAnswer: '', tips: ['Show systematic approach'], difficulty: InterviewDifficulty.HARD },
    ];

    return templates.slice(0, count).map((t, i) => ({
      ...t,
      id: `template_q_${i}`,
      createdAt: new Date(),
      optimizationId: ''
    }));
  }

  /**
   * Chat with AI interviewer
   */
  async chatWithInterviewer(
    context: string,
    message: string,
    history: Array<{ role: string; content: string }>
  ): Promise<string> {
    const systemPrompt = `You are an experienced interviewer. ${context}
    
Conduct a professional interview. Ask follow-up questions, probe for details, and provide constructive feedback.
Be encouraging but thorough. Keep responses concise and focused.`;

    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user', content: message },
      ];

    const result = await this.aiService.chat(this.aiModel, messages, {
      temperature: 0.7,
    });
    return result.content;
  }

  /**
   * Transcribe audio (placeholder - requires Whisper API integration)
   */
  async transcribeAudio(_audioBuffer: Buffer): Promise<string> {
    this.logger.log('Transcribing audio...');
    const result = await this.aiService.chat(
      this.aiModel,
      [
        {
          role: 'system',
          content:
            'You are a transcription assistant. The user will provide audio context.',
        },
        {
          role: 'user',
          content:
            'Please transcribe the following audio content. (Note: This is a placeholder - actual transcription requires Whisper API integration)',
        },
      ],
      { temperature: 0.3 }
    );
    return result.content;
  }

  private async executeSkillWithRetry(
    skillName: string,
    inputs: Record<string, any>,
    userId: string,
    options?: { fallback?: () => Promise<any> }
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
          this.logger.warn(
            `Retry ${attempt}/${this.maxRetries} for skill "${skillName}" after ${delay}ms`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await this.aiService.executeSkill(skillName, inputs, userId);

        if (!result.success) {
          const errorCode = result.error?.code || 'UNKNOWN_ERROR';
          const errorMessage = result.error?.message || 'Skill execution failed';
          lastError = new Error(`[${errorCode}] ${errorMessage}`);

          if (this.isTransientError(errorCode) && attempt < this.maxRetries - 1) {
            this.logger.warn(
              `Skill "${skillName}" transient error (attempt ${attempt + 1}/${this.maxRetries}): ${errorMessage}`
            );
            continue;
          }

          if (options?.fallback) {
            this.logger.warn(
              `Skill "${skillName}" permanent error (${errorCode}), using fallback immediately`
            );
            return options.fallback();
          }

          throw lastError;
        }

        if (!result.data) {
          if (options?.fallback && attempt < this.maxRetries - 1) {
            this.logger.warn(
              `Skill "${skillName}" returned empty data (attempt ${attempt + 1}/${this.maxRetries}), retrying...`
            );
            continue;
          }

          if (options?.fallback) {
            this.logger.warn(
              `Skill "${skillName}" returned no data after all retries, using fallback`
            );
            return options.fallback();
          }
          throw new Error('Skill returned no data');
        }

        return result.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (this.isNetworkError(lastError) && attempt < this.maxRetries - 1) {
          this.logger.warn(
            `Network error for skill "${skillName}" (attempt ${attempt + 1}/${this.maxRetries}): ${lastError.message}`
          );
          continue;
        }

        if (options?.fallback) {
          this.logger.warn(
            `Skill "${skillName}" error after attempts, using fallback: ${lastError.message}`
          );
          try {
            return await options.fallback();
          } catch (fallbackError) {
            this.logger.error(`Fallback also failed for skill "${skillName}":`, fallbackError);
            throw lastError;
          }
        }

        throw lastError;
      }
    }

    if (options?.fallback && lastError) {
      this.logger.warn(
        `Skill "${skillName}" exhausted all retries, using fallback as last resort`
      );
      try {
        return await options.fallback();
      } catch (fallbackError) {
        this.logger.error(`Fallback also failed for skill "${skillName}":`, fallbackError);
        throw lastError;
      }
    }

    throw lastError || new Error('Skill execution failed');
  }

  private isTransientError(errorCode: string): boolean {
    const transientErrors = [
      'RATE_LIMIT_EXCEEDED',
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
      'PROVIDER_OVERLOADED',
    ];
    return transientErrors.includes(errorCode);
  }

  private isNetworkError(error: Error): boolean {
    const networkPatterns = [
      /network/i,
      /timeout/i,
      /ECONNREFUSED/i,
      /ECONNRESET/i,
      /ETIMEDOUT/i,
      /fetch failed/i,
      /socket hang up/i,
    ];
    return networkPatterns.some(pattern => pattern.test(error.message));
  }
}
