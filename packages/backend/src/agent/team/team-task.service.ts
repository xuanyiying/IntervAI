import { Injectable, Logger, Optional } from '@nestjs/common';
import { TeamOrchestratorService } from './team-orchestrator.service';
import { TaskType, TaskPriority, TaskResult } from '@/agent/team/interfaces';

export interface ComplexTaskRequest {
  userId: string;
  taskType: ComplexTaskType;
  resumeContent?: string;
  jobDescription?: string;
  additionalContext?: Record<string, any>;
}

export enum ComplexTaskType {
  FULL_RESUME_OPTIMIZATION = 'full_resume_optimization',
  INTERVIEW_PREPARATION = 'interview_preparation',
  CAREER_TRANSITION_ANALYSIS = 'career_transition_analysis',
  COMPETITIVE_ANALYSIS = 'competitive_analysis',
}

export interface ComplexTaskResult {
  success: boolean;
  data?: {
    analysis?: any;
    suggestions?: any;
    retrievedContext?: any;
    validation?: any;
    finalOutput?: any;
  };
  executionTimeMs: number;
  error?: string;
}

@Injectable()
export class TeamTaskService {
  private readonly logger = new Logger(TeamTaskService.name);
  private enabled: boolean = true;

  constructor(
    @Optional() private readonly teamOrchestrator: TeamOrchestratorService
  ) {
    this.logger.log('TeamTaskService initialized');
  }

  isEnabled(): boolean {
    return this.enabled && !!this.teamOrchestrator;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.logger.log(`TeamTaskService enabled: ${enabled}`);
  }

  async executeFullResumeOptimization(
    request: ComplexTaskRequest
  ): Promise<ComplexTaskResult> {
    this.logger.log(
      `Executing full resume optimization for user ${request.userId}`
    );

    if (!this.isEnabled()) {
      return this.createDisabledResult();
    }

    try {
      const task = await this.teamOrchestrator.submitTask(
        TaskType.OPTIMIZATION,
        {
          userId: request.userId,
          resumeContent: request.resumeContent,
          jobDescription: request.jobDescription,
          context: request.additionalContext,
        },
        TaskPriority.HIGH,
        { complexTaskType: ComplexTaskType.FULL_RESUME_OPTIMIZATION }
      );

      const result = await this.teamOrchestrator.executeTask(task);

      return this.transformResult(result);
    } catch (error) {
      this.logger.error(
        `Full resume optimization failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        success: false,
        executionTimeMs: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async executeInterviewPreparation(
    request: ComplexTaskRequest
  ): Promise<ComplexTaskResult> {
    this.logger.log(
      `Executing interview preparation for user ${request.userId}`
    );

    if (!this.isEnabled()) {
      return this.createDisabledResult();
    }

    try {
      const subtasks = await Promise.all([
        this.teamOrchestrator.submitTask(
          TaskType.RESUME_ANALYSIS,
          {
            userId: request.userId,
            resumeContent: request.resumeContent,
          },
          TaskPriority.HIGH
        ),
        this.teamOrchestrator.submitTask(
          TaskType.JD_ANALYSIS,
          {
            userId: request.userId,
            jobDescription: request.jobDescription,
          },
          TaskPriority.HIGH
        ),
      ]);

      const results = await Promise.all(
        subtasks.map((task) => this.teamOrchestrator.executeTask(task))
      );

      const analysisData = {
        resumeAnalysis: results[0]?.output?.data,
        jdAnalysis: results[1]?.output?.data,
      };

      const generationTask = await this.teamOrchestrator.submitTask(
        TaskType.CONTENT_GENERATION,
        {
          userId: request.userId,
          contentType: 'interview_questions',
          analysisData,
          context: request.additionalContext,
        },
        TaskPriority.MEDIUM
      );

      const generationResult =
        await this.teamOrchestrator.executeTask(generationTask);

      const validationTask = await this.teamOrchestrator.submitTask(
        TaskType.VALIDATION,
        {
          userId: request.userId,
          content: generationResult?.output?.data,
          type: 'interview_questions',
        },
        TaskPriority.LOW
      );

      const validationResult =
        await this.teamOrchestrator.executeTask(validationTask);

      const totalExecutionTime =
        results.reduce((sum, r) => sum + (r?.executionTimeMs || 0), 0) +
        (generationResult?.executionTimeMs || 0) +
        (validationResult?.executionTimeMs || 0);

      return {
        success: true,
        data: {
          analysis: analysisData,
          suggestions: generationResult?.output?.data,
          validation: validationResult?.output?.data,
          finalOutput: generationResult?.output?.data,
        },
        executionTimeMs: totalExecutionTime,
      };
    } catch (error) {
      this.logger.error(
        `Interview preparation failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        success: false,
        executionTimeMs: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async executeCareerTransitionAnalysis(
    request: ComplexTaskRequest
  ): Promise<ComplexTaskResult> {
    this.logger.log(
      `Executing career transition analysis for user ${request.userId}`
    );

    if (!this.isEnabled()) {
      return this.createDisabledResult();
    }

    try {
      const analysisTask = await this.teamOrchestrator.submitTask(
        TaskType.RESUME_ANALYSIS,
        {
          userId: request.userId,
          resumeContent: request.resumeContent,
          analysisType: 'career_transition',
        },
        TaskPriority.HIGH
      );

      const analysisResult =
        await this.teamOrchestrator.executeTask(analysisTask);

      const ragTask = await this.teamOrchestrator.submitTask(
        TaskType.RAG_QUERY,
        {
          userId: request.userId,
          query: `career transition skills from ${request.additionalContext?.currentField || 'current'} to ${request.additionalContext?.targetField || 'target field'}`,
          topK: 5,
        },
        TaskPriority.MEDIUM
      );

      const ragResult = await this.teamOrchestrator.executeTask(ragTask);

      const generationTask = await this.teamOrchestrator.submitTask(
        TaskType.CONTENT_GENERATION,
        {
          userId: request.userId,
          contentType: 'career_transition_plan',
          resumeAnalysis: analysisResult?.output?.data,
          retrievedContext: ragResult?.output?.data,
          targetField: request.additionalContext?.targetField,
        },
        TaskPriority.MEDIUM
      );

      const generationResult =
        await this.teamOrchestrator.executeTask(generationTask);

      const totalExecutionTime =
        (analysisResult?.executionTimeMs || 0) +
        (ragResult?.executionTimeMs || 0) +
        (generationResult?.executionTimeMs || 0);

      return {
        success: true,
        data: {
          analysis: analysisResult?.output?.data,
          retrievedContext: ragResult?.output?.data,
          suggestions: generationResult?.output?.data,
          finalOutput: generationResult?.output?.data,
        },
        executionTimeMs: totalExecutionTime,
      };
    } catch (error) {
      this.logger.error(
        `Career transition analysis failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        success: false,
        executionTimeMs: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async executeCompetitiveAnalysis(
    request: ComplexTaskRequest
  ): Promise<ComplexTaskResult> {
    this.logger.log(
      `Executing competitive analysis for user ${request.userId}`
    );

    if (!this.isEnabled()) {
      return this.createDisabledResult();
    }

    try {
      const tasks = await Promise.all([
        this.teamOrchestrator.submitTask(
          TaskType.RESUME_ANALYSIS,
          {
            userId: request.userId,
            resumeContent: request.resumeContent,
            analysisType: 'skill_extraction',
          },
          TaskPriority.HIGH
        ),
        this.teamOrchestrator.submitTask(
          TaskType.JD_ANALYSIS,
          {
            userId: request.userId,
            jobDescription: request.jobDescription,
            analysisType: 'requirement_extraction',
          },
          TaskPriority.HIGH
        ),
      ]);

      const results = await Promise.all(
        tasks.map((task) => this.teamOrchestrator.executeTask(task))
      );

      const generationTask = await this.teamOrchestrator.submitTask(
        TaskType.CONTENT_GENERATION,
        {
          userId: request.userId,
          contentType: 'competitive_analysis',
          resumeAnalysis: results[0]?.output?.data,
          jdAnalysis: results[1]?.output?.data,
        },
        TaskPriority.MEDIUM
      );

      const generationResult =
        await this.teamOrchestrator.executeTask(generationTask);

      const validationTask = await this.teamOrchestrator.submitTask(
        TaskType.VALIDATION,
        {
          userId: request.userId,
          content: generationResult?.output?.data,
          type: 'competitive_analysis',
        },
        TaskPriority.LOW
      );

      const validationResult =
        await this.teamOrchestrator.executeTask(validationTask);

      const totalExecutionTime =
        results.reduce((sum, r) => sum + (r?.executionTimeMs || 0), 0) +
        (generationResult?.executionTimeMs || 0) +
        (validationResult?.executionTimeMs || 0);

      return {
        success: true,
        data: {
          analysis: {
            resume: results[0]?.output?.data,
            jd: results[1]?.output?.data,
          },
          suggestions: generationResult?.output?.data,
          validation: validationResult?.output?.data,
          finalOutput: generationResult?.output?.data,
        },
        executionTimeMs: totalExecutionTime,
      };
    } catch (error) {
      this.logger.error(
        `Competitive analysis failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        success: false,
        executionTimeMs: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private transformResult(result: TaskResult): ComplexTaskResult {
    return {
      success: result.success,
      data: result.output?.data,
      executionTimeMs: result.executionTimeMs,
      error: result.error?.message,
    };
  }

  private createDisabledResult(): ComplexTaskResult {
    return {
      success: false,
      executionTimeMs: 0,
      error: 'Team task service is disabled or not available',
    };
  }

  async getTaskStatus(taskId: string): Promise<any> {
    if (!this.isEnabled()) {
      return null;
    }
    return this.teamOrchestrator.getTaskStatus(taskId);
  }

  async cancelTask(taskId: string): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }
    return this.teamOrchestrator.cancelTask(taskId);
  }
}
