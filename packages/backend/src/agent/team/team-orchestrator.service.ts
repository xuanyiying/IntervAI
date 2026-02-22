import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { RedisService } from '@/redis/redis.service';
import { LeaderAgent } from './leader.agent';
import {
  AnalysisWorker,
  GenerationWorker,
  RetrievalWorker,
  ValidationWorker,
} from './workers';
import { MessageQueueService } from './communication/message-queue.service';
import { TeamMonitorService } from './monitoring/team-monitor.service';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskResult,
  AgentRole,
  AgentMessage,
  MessageType,
  MessagePriority,
  AgentInfo,
} from '@/agent/team/interfaces';

@Injectable()
export class TeamOrchestratorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TeamOrchestratorService.name);
  private isInitialized = false;
  private taskCounter = 0;

  constructor(
    private readonly leaderAgent: LeaderAgent,
    private readonly analysisWorker: AnalysisWorker,
    private readonly generationWorker: GenerationWorker,
    private readonly retrievalWorker: RetrievalWorker,
    private readonly validationWorker: ValidationWorker,
    private readonly messageQueueService: MessageQueueService,
    private readonly teamMonitorService: TeamMonitorService,
    private readonly redisService: RedisService
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing Team Orchestrator...');
    await this.initializeTeam();
    this.isInitialized = true;
    this.logger.log('Team Orchestrator initialized successfully');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down Team Orchestrator...');
    await this.shutdownTeam();
    this.logger.log('Team Orchestrator shut down complete');
  }

  private async initializeTeam(): Promise<void> {
    await this.leaderAgent.initialize();
    this.logger.log('Leader Agent initialized');

    await this.analysisWorker.initialize();
    this.leaderAgent.registerWorkerAgent(
      this.getAgentInfo(this.analysisWorker)
    );
    this.logger.log('Analysis Worker initialized');

    await this.generationWorker.initialize();
    this.leaderAgent.registerWorkerAgent(
      this.getAgentInfo(this.generationWorker)
    );
    this.logger.log('Generation Worker initialized');

    await this.retrievalWorker.initialize();
    this.leaderAgent.registerWorkerAgent(
      this.getAgentInfo(this.retrievalWorker)
    );
    this.logger.log('Retrieval Worker initialized');

    await this.validationWorker.initialize();
    this.leaderAgent.registerWorkerAgent(
      this.getAgentInfo(this.validationWorker)
    );
    this.logger.log('Validation Worker initialized');

    await this.setupMessageHandlers();
    this.logger.log('Message handlers configured');
  }

  private async shutdownTeam(): Promise<void> {
    this.leaderAgent.stopHeartbeat();
    this.analysisWorker.stopHeartbeat();
    this.generationWorker.stopHeartbeat();
    this.retrievalWorker.stopHeartbeat();
    this.validationWorker.stopHeartbeat();
  }

  private getAgentInfo(worker: any): AgentInfo {
    return {
      id: worker.id,
      role: worker.role,
      status: worker.getStatus(),
      capabilities: worker.capabilities,
      maxConcurrentTasks: worker.maxConcurrentTasks,
      currentTaskCount: worker.currentTaskCount || 0,
      lastHeartbeat: new Date(),
    };
  }

  private async setupMessageHandlers(): Promise<void> {
    await this.messageQueueService.subscribe(
      this.analysisWorker.id,
      async (message: AgentMessage) => {
        if (message.type === MessageType.TASK_ASSIGNMENT) {
          const task = message.payload.task as Task;
          const result = await this.analysisWorker.execute(task);
          await this.reportResult(result);
        }
      }
    );

    await this.messageQueueService.subscribe(
      this.generationWorker.id,
      async (message: AgentMessage) => {
        if (message.type === MessageType.TASK_ASSIGNMENT) {
          const task = message.payload.task as Task;
          const result = await this.generationWorker.execute(task);
          await this.reportResult(result);
        }
      }
    );

    await this.messageQueueService.subscribe(
      this.retrievalWorker.id,
      async (message: AgentMessage) => {
        if (message.type === MessageType.TASK_ASSIGNMENT) {
          const task = message.payload.task as Task;
          const result = await this.retrievalWorker.execute(task);
          await this.reportResult(result);
        }
      }
    );

    await this.messageQueueService.subscribe(
      this.validationWorker.id,
      async (message: AgentMessage) => {
        if (message.type === MessageType.TASK_ASSIGNMENT) {
          const task = message.payload.task as Task;
          const result = await this.validationWorker.execute(task);
          await this.reportResult(result);
        }
      }
    );
  }

  private async reportResult(result: TaskResult): Promise<void> {
    await this.redisService.set(
      `task:result:${result.taskId}`,
      JSON.stringify(result),
      3600
    );

    const message: AgentMessage = {
      id: `result-${Date.now()}`,
      type: MessageType.TASK_RESULT,
      priority: MessagePriority.HIGH,
      senderId: result.agentId,
      receiverId: this.leaderAgent.id,
      payload: { result },
      timestamp: new Date(),
    };

    await this.messageQueueService.publish(message);
  }

  async submitTask(
    type: TaskType,
    data: Record<string, any>,
    priority: TaskPriority = TaskPriority.MEDIUM,
    metadata?: Record<string, any>
  ): Promise<Task> {
    const task: Task = {
      id: this.generateTaskId(),
      type,
      priority,
      status: TaskStatus.PENDING,
      input: {
        type,
        data,
      },
      childTaskIds: [],
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      metadata,
    };

    await this.redisService.set(`task:${task.id}`, JSON.stringify(task), 7200);

    this.logger.log(`Task ${task.id} submitted: ${type}`);

    return task;
  }

  async executeTask(task: Task): Promise<TaskResult> {
    this.logger.log(`Executing task ${task.id}`);

    task.status = TaskStatus.IN_PROGRESS;
    task.startedAt = new Date();
    await this.redisService.set(`task:${task.id}`, JSON.stringify(task), 7200);

    try {
      const result = await this.leaderAgent.execute(task);

      task.status = result.success ? TaskStatus.COMPLETED : TaskStatus.FAILED;
      task.completedAt = new Date();
      task.output = result.output;

      await this.redisService.set(
        `task:${task.id}`,
        JSON.stringify(task),
        7200
      );

      await this.teamMonitorService.logAgentEvent(
        this.leaderAgent.id,
        result.success ? 'task_completed' : 'task_failed',
        { taskId: task.id, executionTime: result.executionTimeMs }
      );

      return result;
    } catch (error) {
      task.status = TaskStatus.FAILED;
      task.completedAt = new Date();
      task.output = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };

      await this.redisService.set(
        `task:${task.id}`,
        JSON.stringify(task),
        7200
      );

      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTimeMs: 0,
        agentId: this.leaderAgent.id,
        retryable: true,
      };
    }
  }

  async getTaskStatus(taskId: string): Promise<Task | null> {
    const data = await this.redisService.get(`task:${taskId}`);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }

  async getTaskResult(taskId: string): Promise<TaskResult | null> {
    const data = await this.redisService.get(`task:result:${taskId}`);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = await this.getTaskStatus(taskId);
    if (!task) {
      return false;
    }

    if (
      task.status === TaskStatus.COMPLETED ||
      task.status === TaskStatus.FAILED
    ) {
      return false;
    }

    task.status = TaskStatus.CANCELLED;
    await this.redisService.set(`task:${taskId}`, JSON.stringify(task), 7200);

    this.logger.log(`Task ${taskId} cancelled`);

    return true;
  }

  async getTeamStatus(): Promise<{
    leader: any;
    workers: any[];
    metrics: any;
  }> {
    const summary = await this.teamMonitorService.getTeamSummary();

    return {
      leader: {
        id: this.leaderAgent.id,
        status: this.leaderAgent.getStatus(),
        activeTasks: this.leaderAgent.getActiveTaskCount(),
        queueLength: this.leaderAgent.getQueueLength(),
      },
      workers: summary.agents.map((agent) => ({
        id: agent.id,
        role: agent.role,
        status: agent.status,
        currentTaskCount: agent.currentTaskCount,
      })),
      metrics: summary.metrics,
    };
  }

  async scaleWorkers(role: AgentRole, count: number): Promise<void> {
    this.logger.log(`Scaling ${role} workers to ${count}`);

    this.logger.warn(
      'Dynamic worker scaling is not fully implemented. Worker count is static.'
    );
  }

  private generateTaskId(): string {
    this.taskCounter++;
    return `task-${Date.now()}-${this.taskCounter.toString().padStart(6, '0')}`;
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    agents: Array<{ id: string; healthy: boolean }>;
    messageQueue: boolean;
  }> {
    const agents = await this.teamMonitorService.getAllAgents();
    const agentHealth = await Promise.all(
      agents.map(async (agent) => {
        const health = await this.teamMonitorService.getAgentHealth(agent.id);
        return {
          id: agent.id,
          healthy: health?.isHealthy ?? false,
        };
      })
    );

    const allHealthy = agentHealth.every((a) => a.healthy);

    return {
      healthy: allHealthy && this.isInitialized,
      agents: agentHealth,
      messageQueue: true,
    };
  }
}
