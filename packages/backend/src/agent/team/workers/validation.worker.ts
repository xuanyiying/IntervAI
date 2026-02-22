import { Injectable } from '@nestjs/common';
import { AIEngineService } from '@/ai-providers/ai-engine.service';
import { RedisService } from '@/redis/redis.service';
import { ScenarioType } from '@/ai-providers/interfaces/model.interface';
import { AgentRole, AgentCapability } from '@/agent/team';
import { Task, TaskResult, TaskType } from '@/agent/team';
import { BaseWorkerAgent } from '@/agent/team';

const VALIDATION_WORKER_ID = 'validation-worker-001';

@Injectable()
export class ValidationWorker extends BaseWorkerAgent {
  readonly id = VALIDATION_WORKER_ID;
  readonly role = AgentRole.VALIDATION_WORKER;
  readonly maxConcurrentTasks = 4;

  readonly capabilities: AgentCapability[] = [
    {
      name: 'quality_check',
      description: 'Validate quality of generated content',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          criteria: { type: 'array' },
        },
      },
    },
    {
      name: 'scoring',
      description: 'Score content against benchmarks',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          rubric: { type: 'object' },
        },
      },
    },
    {
      name: 'consistency_check',
      description: 'Check consistency across multiple pieces of content',
      inputSchema: {
        type: 'object',
        properties: {
          contents: { type: 'array' },
        },
      },
    },
    {
      name: 'fact_verification',
      description: 'Verify factual claims in content',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          claims: { type: 'array' },
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
    this.logger.log(`Validation Worker executing task: ${task.id}`);
    this.currentTaskCount++;

    const startTime = Date.now();

    try {
      let result: Record<string, any>;

      switch (task.type) {
        case TaskType.VALIDATION:
          result = await this.validateContent(task.input.data);
          break;

        default:
          result = await this.performGenericValidation(task.input.data);
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

  private async validateContent(
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const { content, criteria, type } = data;

    const prompt = `Validate the following content against quality criteria.

Content:
${content}

Validation Criteria:
${criteria ? criteria.join('\n') : this.getDefaultCriteria(type)}

Provide validation result in JSON format:
{
  "isValid": true/false,
  "overallScore": 0-100,
  "criteria": [
    {
      "name": "criterion name",
      "passed": true/false,
      "score": 0-100,
      "feedback": "specific feedback"
    }
  ],
  "issues": [
    {
      "severity": "error/warning/info",
      "message": "issue description",
      "location": "where in content",
      "suggestion": "how to fix"
    }
  ],
  "recommendations": ["rec1", "rec2"],
  "passedChecks": number,
  "failedChecks": number
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
        isValid: false,
        error: 'Failed to parse validation result',
        rawResponse: response.content,
      };
    }
  }

  private async performGenericValidation(
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const { content, rules } = data;

    const issues: any[] = [];
    let score = 100;

    if (rules?.maxLength && content.length > rules.maxLength) {
      issues.push({
        severity: 'warning',
        message: `Content exceeds maximum length of ${rules.maxLength}`,
        currentLength: content.length,
      });
      score -= 10;
    }

    if (rules?.minLength && content.length < rules.minLength) {
      issues.push({
        severity: 'error',
        message: `Content is below minimum length of ${rules.minLength}`,
        currentLength: content.length,
      });
      score -= 20;
    }

    if (rules?.requiredKeywords) {
      const missingKeywords = rules.requiredKeywords.filter(
        (kw: string) => !content.toLowerCase().includes(kw.toLowerCase())
      );
      if (missingKeywords.length > 0) {
        issues.push({
          severity: 'warning',
          message: 'Missing required keywords',
          missingKeywords,
        });
        score -= missingKeywords.length * 5;
      }
    }

    return {
      isValid: issues.filter((i) => i.severity === 'error').length === 0,
      overallScore: Math.max(0, score),
      issues,
      metadata: {
        validatedAt: new Date(),
        contentLength: content.length,
      },
    };
  }

  private getDefaultCriteria(type?: string): string {
    const criteriaMap: Record<string, string> = {
      resume: `
- Clear and professional formatting
- Quantifiable achievements
- Relevant skills highlighted
- No spelling or grammar errors
- Consistent tense and voice
- Appropriate length (1-2 pages)
      `,
      cover_letter: `
- Professional greeting and closing
- Clear introduction of purpose
- Relevant experience highlighted
- Specific company/role references
- Call to action included
- Appropriate length (3-4 paragraphs)
      `,
      default: `
- Clear and coherent content
- No spelling or grammar errors
- Appropriate tone and style
- Relevant information included
      `,
    };

    return criteriaMap[type || 'default'] || criteriaMap.default;
  }

  async scoreContent(
    content: string,
    rubric: Record<string, number>
  ): Promise<Record<string, any>> {
    const prompt = `Score the following content against the provided rubric.

Content:
${content}

Rubric:
${JSON.stringify(rubric, null, 2)}

Provide scoring in JSON format:
{
  "totalScore": 0-100,
  "dimensions": [
    {
      "name": "dimension name",
      "score": 0-100,
      "weight": 0-1,
      "justification": "brief explanation"
    }
  ],
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "overallFeedback": "comprehensive feedback"
}

Return JSON only.`;

    const response = await this.aiEngineService.call(
      {
        model: '',
        prompt,
        temperature: 0.3,
        maxTokens: 1000,
      },
      'system',
      ScenarioType.AGENT_RESPONSE_ANALYSIS
    );

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        totalScore: 0,
        error: 'Failed to parse scoring result',
      };
    }
  }
}
