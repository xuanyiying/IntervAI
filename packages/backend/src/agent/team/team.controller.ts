import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TeamOrchestratorService } from '../team/team-orchestrator.service';
import { TeamMonitorService } from '../team/monitoring/team-monitor.service';
import { TaskType, TaskPriority, TaskStatus } from '@/agent/team/interfaces';

export interface SubmitTaskDto {
  type: TaskType;
  data: Record<string, any>;
  priority?: TaskPriority;
  metadata?: Record<string, any>;
}

export interface TaskResponse {
  taskId: string;
  status: TaskStatus;
  message: string;
}

export interface TeamStatusResponse {
  healthy: boolean;
  agents: Array<{
    id: string;
    role: string;
    status: string;
    currentTaskCount: number;
  }>;
  metrics: {
    totalAgents: number;
    activeAgents: number;
    totalTasksProcessed: number;
    queueDepth: number;
  } | null;
}

@Controller('agents/team')
@UseGuards(JwtAuthGuard)
export class TeamController {
  private readonly logger = new Logger(TeamController.name);

  constructor(
    private readonly teamOrchestrator: TeamOrchestratorService,
    private readonly teamMonitor: TeamMonitorService
  ) {}

  @Post('tasks')
  async submitTask(
    @Body() dto: SubmitTaskDto,
    @Request() req: { user: { id: string } }
  ): Promise<TaskResponse> {
    try {
      this.logger.log(`User ${req.user.id} submitting task: ${dto.type}`);

      const task = await this.teamOrchestrator.submitTask(
        dto.type,
        { ...dto.data, userId: req.user.id },
        dto.priority || TaskPriority.MEDIUM,
        dto.metadata
      );

      return {
        taskId: task.id,
        status: task.status,
        message: 'Task submitted successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to submit task: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to submit task',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('tasks/execute')
  async submitAndExecuteTask(
    @Body() dto: SubmitTaskDto,
    @Request() req: { user: { id: string } }
  ): Promise<any> {
    try {
      this.logger.log(`User ${req.user.id} executing task: ${dto.type}`);

      const task = await this.teamOrchestrator.submitTask(
        dto.type,
        { ...dto.data, userId: req.user.id },
        dto.priority || TaskPriority.MEDIUM,
        dto.metadata
      );

      const result = await this.teamOrchestrator.executeTask(task);

      return {
        taskId: result.taskId,
        success: result.success,
        output: result.output,
        executionTimeMs: result.executionTimeMs,
        error: result.error?.message,
      };
    } catch (error) {
      this.logger.error(
        `Failed to execute task: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to execute task',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('tasks/:taskId')
  async getTaskStatus(
    @Param('taskId') taskId: string,
    @Request() req: { user: { id: string } }
  ): Promise<any> {
    try {
      const task = await this.teamOrchestrator.getTaskStatus(taskId);

      if (!task) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: `Task ${taskId} not found`,
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        taskId: task.id,
        type: task.type,
        status: task.status,
        priority: task.priority,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        output: task.output,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(
        `Failed to get task status: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to get task status',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('tasks/:taskId/result')
  async getTaskResult(
    @Param('taskId') taskId: string,
    @Request() req: { user: { id: string } }
  ): Promise<any> {
    try {
      const result = await this.teamOrchestrator.getTaskResult(taskId);

      if (!result) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: `Result for task ${taskId} not found`,
          },
          HttpStatus.NOT_FOUND
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(
        `Failed to get task result: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to get task result',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('tasks/:taskId/cancel')
  async cancelTask(
    @Param('taskId') taskId: string,
    @Request() req: { user: { id: string } }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const cancelled = await this.teamOrchestrator.cancelTask(taskId);

      if (!cancelled) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message:
              'Cannot cancel task - task may not exist or already completed',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Task cancelled successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(
        `Failed to cancel task: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to cancel task',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status')
  async getTeamStatus(): Promise<TeamStatusResponse> {
    try {
      const status = await this.teamOrchestrator.getTeamStatus();

      return {
        healthy: status.metrics !== null,
        agents: status.workers.map((w) => ({
          id: w.id,
          role: w.role,
          status: w.status,
          currentTaskCount: w.currentTaskCount,
        })),
        metrics: status.metrics,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get team status: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to get team status',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  async healthCheck(): Promise<{
    healthy: boolean;
    agents: Array<{ id: string; healthy: boolean }>;
    messageQueue: boolean;
  }> {
    try {
      return await this.teamOrchestrator.healthCheck();
    } catch (error) {
      this.logger.error(
        `Health check failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        healthy: false,
        agents: [],
        messageQueue: false,
      };
    }
  }

  @Get('metrics')
  async getTeamMetrics(): Promise<any> {
    try {
      const metrics = await this.teamMonitor.getLatestMetrics();
      const history = this.teamMonitor.getMetricsHistory();

      return {
        current: metrics,
        history: history.slice(-10),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get metrics: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to get metrics',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('agents')
  async getAllAgents(): Promise<any> {
    try {
      const agents = await this.teamMonitor.getAllAgents();
      const healthStatuses = await Promise.all(
        agents.map((agent) => this.teamMonitor.getAgentHealth(agent.id))
      );

      return agents.map((agent, index) => ({
        id: agent.id,
        role: agent.role,
        status: agent.status,
        capabilities: agent.capabilities.map((c) => c.name),
        maxConcurrentTasks: agent.maxConcurrentTasks,
        currentTaskCount: agent.currentTaskCount,
        health: healthStatuses[index],
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get agents: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to get agents',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('agents/:agentId/logs')
  async getAgentLogs(
    @Param('agentId') agentId: string,
    @Query('limit') limitStr: string = '50'
  ): Promise<any[]> {
    try {
      const limit = Math.min(parseInt(limitStr, 10) || 50, 100);
      return await this.teamMonitor.getAgentLogs(agentId, limit);
    } catch (error) {
      this.logger.error(
        `Failed to get agent logs: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to get agent logs',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
