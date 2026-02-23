import { Logger } from '@nestjs/common';
import { RedisService } from '@/redis/redis.service';
import {
  AgentRole,
  AgentStatus,
  AgentCapability,
  Task,
  TaskResult,
} from '@/agent/team/interfaces';

const HEARTBEAT_INTERVAL = 30000;

export abstract class BaseWorkerAgent {
  protected readonly logger: Logger;
  protected status: AgentStatus = AgentStatus.IDLE;
  protected currentTaskCount = 0;
  protected completedTasks = 0;
  protected failedTasks = 0;
  protected heartbeatInterval?: ReturnType<typeof setInterval>;

  abstract readonly id: string;
  abstract readonly role: AgentRole;
  abstract readonly capabilities: AgentCapability[];
  abstract readonly maxConcurrentTasks: number;

  constructor(protected readonly redisService: RedisService) {
    this.logger = new Logger(this.constructor.name);
  }

  async initialize(): Promise<void> {
    this.logger.log(`Initializing ${this.constructor.name}...`);
    await this.register();
    this.startHeartbeat();
    this.status = AgentStatus.IDLE;
    this.logger.log(`${this.constructor.name} initialized successfully`);
  }

  abstract execute(task: Task): Promise<TaskResult>;

  getStatus(): AgentStatus {
    return this.status;
  }

  async heartbeat(): Promise<void> {
    const heartbeatData = {
      agentId: this.id,
      role: this.role,
      status: this.status,
      currentTaskCount: this.currentTaskCount,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      timestamp: new Date(),
    };

    await this.redisService.set(
      `agent:heartbeat:${this.id}`,
      JSON.stringify(heartbeatData),
      HEARTBEAT_INTERVAL / 1000 + 10
    );
  }

  protected async register(): Promise<void> {
    const agentInfo = {
      id: this.id,
      role: this.role,
      status: this.status,
      capabilities: this.capabilities,
      maxConcurrentTasks: this.maxConcurrentTasks,
      currentTaskCount: this.currentTaskCount,
      lastHeartbeat: new Date(),
    };

    await this.redisService.set(
      `agent:info:${this.id}`,
      JSON.stringify(agentInfo),
      3600
    );
  }

  protected startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat().catch((error) => {
        this.logger.error(
          `Heartbeat failed: ${error instanceof Error ? error.message : String(error)}`
        );
      });
    }, HEARTBEAT_INTERVAL);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  protected async reportResult(result: TaskResult): Promise<void> {
    await this.redisService.set(
      `task:result:${result.taskId}`,
      JSON.stringify(result),
      3600
    );
  }

  protected createSuccessResult(
    task: Task,
    data: Record<string, any>,
    executionTimeMs: number
  ): TaskResult {
    this.completedTasks++;
    this.currentTaskCount--;

    return {
      taskId: task.id,
      success: true,
      output: {
        success: true,
        data,
      },
      executionTimeMs,
      agentId: this.id,
      retryable: false,
    };
  }

  protected createErrorResult(
    task: Task,
    error: Error,
    executionTimeMs: number,
    retryable: boolean = true
  ): TaskResult {
    this.failedTasks++;
    this.currentTaskCount--;

    return {
      taskId: task.id,
      success: false,
      error,
      executionTimeMs,
      agentId: this.id,
      retryable,
    };
  }
}
