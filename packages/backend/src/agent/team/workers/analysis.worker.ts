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

const ANALYSIS_WORKER_ID = 'analysis-worker-001';

@Injectable()
export class AnalysisWorker extends BaseWorkerAgent {
  readonly id = ANALYSIS_WORKER_ID;
  readonly role = AgentRole.ANALYSIS_WORKER;
  readonly maxConcurrentTasks = 3;

  readonly capabilities: AgentCapability[] = [
    {
      name: 'resume_analysis',
      description: 'Analyze resume content and extract key information',
      inputSchema: {
        type: 'object',
        properties: {
          resumeContent: { type: 'string' },
        },
      },
    },
    {
      name: 'jd_analysis',
      description: 'Analyze job description and extract requirements',
      inputSchema: {
        type: 'object',
        properties: {
          jobDescription: { type: 'string' },
        },
      },
    },
    {
      name: 'skill_extraction',
      description: 'Extract and categorize skills from text',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
        },
      },
    },
    {
      name: 'keyword_matching',
      description: 'Match keywords between resume and JD',
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
    this.logger.log(`Analysis Worker executing task: ${task.id}`);
    this.status = AgentRole.ANALYSIS_WORKER
      ? (AgentRole.ANALYSIS_WORKER as any)
      : 'busy';
    this.currentTaskCount++;

    const startTime = Date.now();

    try {
      let result: Record<string, any>;

      switch (task.type) {
        case TaskType.RESUME_ANALYSIS:
          result = await this.analyzeResume(task.input.data);
          break;

        case TaskType.JD_ANALYSIS:
          result = await this.analyzeJobDescription(task.input.data);
          break;

        default:
          result = await this.analyzeGeneric(task.input.data);
      }

      const taskResult = this.createSuccessResult(
        task,
        result,
        Date.now() - startTime
      );

      await this.reportResult(taskResult);
      this.status = 'idle' as any;

      return taskResult;
    } catch (error) {
      const taskResult = this.createErrorResult(
        task,
        error instanceof Error ? error : new Error(String(error)),
        Date.now() - startTime
      );

      await this.reportResult(taskResult);
      this.status = 'idle' as any;

      return taskResult;
    }
  }

  private async analyzeResume(
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const { resumeContent } = data;

    if (!resumeContent) {
      throw new Error('Resume content is required');
    }

    const prompt = `Analyze the following resume and extract key information.

Resume Content:
${resumeContent}

Provide analysis in JSON format with:
{
  "personalInfo": { name, email, phone, location },
  "summary": "brief professional summary",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "company": "company name",
      "position": "job title",
      "duration": "time period",
      "highlights": ["achievement1", "achievement2"]
    }
  ],
  "education": [
    {
      "institution": "school name",
      "degree": "degree type",
      "field": "field of study",
      "year": "graduation year"
    }
  ],
  "strengths": ["strength1", "strength2", ...],
  "areasForImprovement": ["area1", "area2", ...],
  "overallScore": 0-100
}

Return JSON only.`;

    const response = await this.aiEngineService.call(
      {
        model: '',
        prompt,
        temperature: 0.3,
        maxTokens: 1500,
      },
      data.userId || 'system',
      ScenarioType.AGENT_RESPONSE_ANALYSIS
    );

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        rawAnalysis: response.content,
        parseError: 'Failed to parse analysis result',
      };
    }
  }

  private async analyzeJobDescription(
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const { jobDescription } = data;

    if (!jobDescription) {
      throw new Error('Job description is required');
    }

    const prompt = `Analyze the following job description and extract key requirements.

Job Description:
${jobDescription}

Provide analysis in JSON format with:
{
  "title": "job title",
  "company": "company name",
  "location": "job location",
  "employmentType": "full-time/part-time/contract",
  "requiredSkills": ["skill1", "skill2", ...],
  "preferredSkills": ["skill1", "skill2", ...],
  "responsibilities": ["resp1", "resp2", ...],
  "qualifications": ["qual1", "qual2", ...],
  "experience": {
    "min": 0,
    "max": 10,
    "level": "junior/mid/senior"
  },
  "salary": {
    "min": 0,
    "max": 0,
    "currency": "USD"
  },
  "keywords": ["keyword1", "keyword2", ...],
  "industry": "industry name"
}

Return JSON only.`;

    const response = await this.aiEngineService.call(
      {
        model: '',
        prompt,
        temperature: 0.3,
        maxTokens: 1200,
      },
      data.userId || 'system',
      ScenarioType.AGENT_RESPONSE_ANALYSIS
    );

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        rawAnalysis: response.content,
        parseError: 'Failed to parse analysis result',
      };
    }
  }

  private async analyzeGeneric(
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const prompt = `Analyze the following data and extract relevant information.

Data:
${JSON.stringify(data, null, 2)}

Provide a structured analysis with key findings, patterns, and insights.
Return as JSON.`;

    const response = await this.aiEngineService.call(
      {
        model: '',
        prompt,
        temperature: 0.3,
        maxTokens: 1000,
      },
      data.userId || 'system',
      ScenarioType.AGENT_RESPONSE_ANALYSIS
    );

    try {
      return JSON.parse(response.content);
    } catch {
      return { analysis: response.content };
    }
  }
}
