import { Injectable } from '@nestjs/common';
import { AIEngineService } from '@/ai-providers/ai-engine.service';
import { RedisService } from '@/redis/redis.service';
import { ScenarioType } from '@/ai-providers/interfaces/model.interface';
import {
  AgentRole,
  AgentCapability,
  Task,
  TaskResult,
  TaskType,
} from '@/agent/team/interfaces';
import { BaseWorkerAgent } from './base.worker';

const GENERATION_WORKER_ID = 'generation-worker-001';

@Injectable()
export class GenerationWorker extends BaseWorkerAgent {
  readonly id = GENERATION_WORKER_ID;
  readonly role = AgentRole.GENERATION_WORKER;
  readonly maxConcurrentTasks = 2;

  readonly capabilities: AgentCapability[] = [
    {
      name: 'content_generation',
      description: 'Generate optimized content for resumes and profiles',
      inputSchema: {
        type: 'object',
        properties: {
          contentType: { type: 'string' },
          context: { type: 'object' },
        },
      },
    },
    {
      name: 'optimization_suggestions',
      description: 'Generate suggestions for improvement',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          targetType: { type: 'string' },
        },
      },
    },
    {
      name: 'interview_questions',
      description: 'Generate interview questions based on context',
      inputSchema: {
        type: 'object',
        properties: {
          resumeContent: { type: 'string' },
          jobDescription: { type: 'string' },
        },
      },
    },
    {
      name: 'cover_letter',
      description: 'Generate cover letter content',
      inputSchema: {
        type: 'object',
        properties: {
          resumeContent: { type: 'string' },
          jobDescription: { type: 'string' },
        },
      },
    },
  ];

  constructor(
    private readonly aiEngineService: AIEngineService,
    redisService: RedisService
  ) {
    super(redisService);
  }

  async execute(task: Task): Promise<TaskResult> {
    this.logger.log(`Generation Worker executing task: ${task.id}`);
    this.currentTaskCount++;

    const startTime = Date.now();

    try {
      let result: Record<string, any>;

      switch (task.type) {
        case TaskType.CONTENT_GENERATION:
          result = await this.generateContent(task.input.data);
          break;

        case TaskType.OPTIMIZATION:
          result = await this.generateOptimization(task.input.data);
          break;

        default:
          result = await this.generateGeneric(task.input.data);
      }

      const taskResult = this.createSuccessResult(
        task,
        result,
        Date.now() - startTime
      );

      await this.reportResult(taskResult);

      return taskResult;
    } catch (error) {
      const taskResult = this.createErrorResult(
        task,
        error instanceof Error ? error : new Error(String(error)),
        Date.now() - startTime
      );

      await this.reportResult(taskResult);

      return taskResult;
    }
  }

  private async generateContent(
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const { contentType, context, resumeContent, jobDescription } = data;

    let prompt: string;

    switch (contentType) {
      case 'resume_summary':
        prompt = this.buildSummaryPrompt(resumeContent, jobDescription);
        break;

      case 'experience_bullet':
        prompt = this.buildExperienceBulletPrompt(context);
        break;

      case 'cover_letter':
        prompt = this.buildCoverLetterPrompt(resumeContent, jobDescription);
        break;

      case 'interview_answers':
        prompt = this.buildInterviewAnswersPrompt(context);
        break;

      default:
        prompt = this.buildGenericGenerationPrompt(data);
    }

    const response = await this.aiEngineService.call(
      {
        model: '',
        prompt,
        temperature: 0.7,
        maxTokens: 1500,
      },
      data.userId || 'system',
      ScenarioType.AGENT_INTRODUCTION_GENERATION
    );

    return {
      contentType,
      content: response.content,
      metadata: {
        generatedAt: new Date(),
        tokensUsed: response.usage?.outputTokens || 0,
      },
    };
  }

  private async generateOptimization(
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const { content, targetType, jobDescription } = data;

    const prompt = `You are a professional resume optimization expert. Analyze the following content and provide specific, actionable optimization suggestions.

Content to optimize:
${content}

Target: ${targetType || 'General improvement'}
${jobDescription ? `Target Job Description:\n${jobDescription}` : ''}

Provide optimization suggestions in JSON format:
{
  "overallScore": 0-100,
  "suggestions": [
    {
      "section": "section name",
      "issue": "description of issue",
      "suggestion": "specific improvement suggestion",
      "priority": "high/medium/low",
      "example": "example of improved content"
    }
  ],
  "keywords": {
    "present": ["keyword1", "keyword2"],
    "missing": ["keyword3", "keyword4"]
  },
  "improvedContent": "fully improved version of the content"
}

Return JSON only.`;

    const response = await this.aiEngineService.call(
      {
        model: '',
        prompt,
        temperature: 0.5,
        maxTokens: 2000,
      },
      data.userId || 'system',
      ScenarioType.AGENT_INTRODUCTION_GENERATION
    );

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        suggestions: response.content,
        parseError: 'Failed to parse optimization result',
      };
    }
  }

  private async generateGeneric(
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const prompt = `Generate content based on the following requirements:

${JSON.stringify(data, null, 2)}

Provide high-quality, professional content.`;

    const response = await this.aiEngineService.call(
      {
        model: '',
        prompt,
        temperature: 0.7,
        maxTokens: 1500,
      },
      data.userId || 'system',
      ScenarioType.AGENT_INTRODUCTION_GENERATION
    );

    return {
      content: response.content,
      metadata: {
        generatedAt: new Date(),
      },
    };
  }

  private buildSummaryPrompt(
    resumeContent: string,
    jobDescription?: string
  ): string {
    return `Write a compelling professional summary for a resume.

Resume Content:
${resumeContent}

${jobDescription ? `Target Job Description:\n${jobDescription}` : ''}

Requirements:
- 3-5 sentences
- Highlight key achievements and skills
- Tailored to the target role
- Use action verbs
- Quantify achievements where possible

Provide the summary only, no additional text.`;
  }

  private buildExperienceBulletPrompt(context: any): string {
    return `Transform the following work experience into impactful resume bullet points.

Context:
${JSON.stringify(context, null, 2)}

Requirements:
- Start with strong action verbs
- Include quantifiable results
- Follow STAR format (Situation, Task, Action, Result)
- 3-5 bullet points

Provide bullet points only, one per line, starting with •`;
  }

  private buildCoverLetterPrompt(
    resumeContent: string,
    jobDescription: string
  ): string {
    return `Write a professional cover letter based on the resume and job description.

Resume:
${resumeContent}

Job Description:
${jobDescription}

Requirements:
- Professional tone
- 3-4 paragraphs
- Highlight relevant experience
- Show enthusiasm for the role
- Include a call to action

Provide the cover letter only.`;
  }

  private buildInterviewAnswersPrompt(context: any): string {
    return `Generate suggested answers for interview questions.

Context:
${JSON.stringify(context, null, 2)}

Provide:
1. The question
2. A structured answer using STAR format
3. Key points to emphasize
4. Common pitfalls to avoid`;
  }

  private buildGenericGenerationPrompt(data: any): string {
    return `Generate professional content based on the following:

${JSON.stringify(data, null, 2)}

Provide high-quality, well-structured content.`;
  }
}
