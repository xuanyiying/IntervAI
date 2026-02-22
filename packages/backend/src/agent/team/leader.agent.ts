import { Injectable, Logger } from '@nestjs/common';
import { AIEngineService } from '@/ai-providers/ai-engine.service';
import { RedisService } from '@/redis/redis.service';
import { ScenarioType } from '@/ai-providers/interfaces/model.interface';
import {
  Task,
  TaskType,
  TaskStatus,
  TaskPriority,
  TaskDecomposition,
  TaskResult,
  AgentMessage,
  MessageType,
  MessagePriority,
  ErrorRecoveryStrategy,
  AgentRole,
  AgentStatus,
  AgentInfo,
  AgentCapability,
} from '@/agent/team/interfaces';

const LEADER_AGENT_ID = 'leader-agent-001';
const HEARTBEAT_INTERVAL = 30000;

@Injectable()
export class LeaderAgent {
  private readonly logger = new Logger(LeaderAgent.name);
  private status: AgentStatus = AgentStatus.IDLE;
  private workerAgents: Map<string, AgentInfo> = new Map();
  private taskQueue: Task[] = [];
  private activeTasks: Map<string, Task> = new Map();
  private taskResults: Map<string, TaskResult> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;

  readonly id = LEADER_AGENT_ID;
  readonly role = AgentRole.LEADER;

  readonly capabilities: AgentCapability[] = [
    {
      name: 'task_decomposition',
      description: 'Decompose complex tasks into subtasks',
    },
    {
      name: 'resource_allocation',
      description: 'Allocate tasks to appropriate worker agents',
    },
    {
      name: 'progress_monitoring',
      description: 'Monitor task execution progress',
    },
    {
      name: 'result_aggregation',
      description: 'Aggregate results from worker agents',
    },
    {
      name: 'error_recovery',
      description: 'Handle errors and implement recovery strategies',
    },
  ];

  constructor(
    private readonly aiEngineService: AIEngineService,
    private readonly redisService: RedisService
  ) {}

  async initialize(): Promise<void> {
    this.logger.log('Initializing Leader Agent...');
    await this.loadWorkerAgents();
    this.startHeartbeat();
    this.status = AgentStatus.IDLE;
    this.logger.log('Leader Agent initialized successfully');
  }

  async execute(task: Task): Promise<TaskResult> {
    this.logger.log(`Leader Agent executing task: ${task.id}`);
    this.status = AgentStatus.BUSY;

    try {
      const decomposition = await this.decomposeTask(task);
      this.logger.debug(
        `Task decomposed into ${decomposition.subTasks.length} subtasks`
      );

      const assignmentPlan = await this.createAssignmentPlan(decomposition);
      this.logger.debug('Assignment plan created');

      await this.assignTasksToWorkers(assignmentPlan);

      const results = await this.monitorAndCollectResults(decomposition);

      const aggregatedResult = await this.aggregateResults(
        task,
        results,
        decomposition
      );

      this.status = AgentStatus.IDLE;
      return aggregatedResult;
    } catch (error) {
      this.status = AgentStatus.ERROR;
      this.logger.error(
        `Leader Agent execution failed: ${error instanceof Error ? error.message : String(error)}`
      );

      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTimeMs: 0,
        agentId: this.id,
        retryable: true,
      };
    }
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  async heartbeat(): Promise<void> {
    const heartbeatData = {
      agentId: this.id,
      role: this.role,
      status: this.status,
      timestamp: new Date(),
      activeTaskCount: this.activeTasks.size,
      queuedTaskCount: this.taskQueue.length,
    };

    await this.redisService.set(
      `agent:heartbeat:${this.id}`,
      JSON.stringify(heartbeatData),
      HEARTBEAT_INTERVAL / 1000 + 10
    );
  }

  private async decomposeTask(task: Task): Promise<TaskDecomposition> {
    this.logger.debug(`Decomposing task: ${task.id}`);

    const prompt = `You are a task decomposition expert. Analyze the following task and break it down into smaller, executable subtasks.

Task Type: ${task.type}
Task Input: ${JSON.stringify(task.input, null, 2)}
Task Priority: ${task.priority}

Available Worker Types:
- analysis_worker: For resume analysis, JD analysis, skill extraction
- generation_worker: For content generation, optimization suggestions
- retrieval_worker: For RAG queries, knowledge base retrieval
- validation_worker: For quality checks, scoring, validation

Return a JSON object with:
{
  "subtasks": [
    {
      "type": "resume_analysis | jd_analysis | content_generation | rag_query | validation | optimization",
      "description": "Brief description",
      "priority": 1-4,
      "dependencies": ["array of subtask indices this depends on"],
      "assignedWorkerType": "analysis_worker | generation_worker | retrieval_worker | validation_worker"
    }
  ],
  "executionOrder": ["array of subtask indices in execution order"]
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
      const parsed = JSON.parse(response.content);
      const subTasks: Task[] = parsed.subtasks.map(
        (st: any, index: number) => ({
          id: `${task.id}-sub-${index}`,
          type: this.mapTaskType(st.type),
          priority: st.priority || TaskPriority.MEDIUM,
          status: TaskStatus.PENDING,
          input: {
            type: this.mapTaskType(st.type),
            data: task.input.data,
            context: { parentTaskId: task.id, description: st.description },
          },
          parentId: task.id,
          childTaskIds: [],
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
          metadata: {
            assignedWorkerType: st.assignedWorkerType,
            dependencies: st.dependencies || [],
          },
        })
      );

      const dependencies = new Map<string, string[]>();
      parsed.subtasks.forEach((st: any, index: number) => {
        const subtaskId = subTasks[index].id;
        const deps = (st.dependencies || []).map(
          (depIndex: number) => subTasks[depIndex].id
        );
        dependencies.set(subtaskId, deps);
      });

      const executionOrder = (parsed.executionOrder || []).map(
        (idx: number) => subTasks[idx].id
      );

      return {
        parentTask: task,
        subTasks,
        dependencies,
        executionOrder,
      };
    } catch (parseError) {
      this.logger.warn(
        `Failed to parse decomposition, using fallback: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
      return this.createFallbackDecomposition(task);
    }
  }

  private mapTaskType(type: string): TaskType {
    const typeMap: Record<string, TaskType> = {
      resume_analysis: TaskType.RESUME_ANALYSIS,
      jd_analysis: TaskType.JD_ANALYSIS,
      content_generation: TaskType.CONTENT_GENERATION,
      rag_query: TaskType.RAG_QUERY,
      validation: TaskType.VALIDATION,
      optimization: TaskType.OPTIMIZATION,
    };
    return typeMap[type] || TaskType.COORDINATION;
  }

  private createFallbackDecomposition(task: Task): TaskDecomposition {
    const subTasks: Task[] = [
      {
        id: `${task.id}-sub-0`,
        type: TaskType.RESUME_ANALYSIS,
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        input: {
          type: TaskType.RESUME_ANALYSIS,
          data: task.input.data,
        },
        parentId: task.id,
        childTaskIds: [],
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        metadata: { assignedWorkerType: 'analysis_worker' },
      },
      {
        id: `${task.id}-sub-1`,
        type: TaskType.CONTENT_GENERATION,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        input: {
          type: TaskType.CONTENT_GENERATION,
          data: task.input.data,
        },
        parentId: task.id,
        childTaskIds: [],
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        metadata: { assignedWorkerType: 'generation_worker' },
      },
    ];

    const dependencies = new Map<string, string[]>();
    dependencies.set(subTasks[1].id, [subTasks[0].id]);

    return {
      parentTask: task,
      subTasks,
      dependencies,
      executionOrder: [subTasks[0].id, subTasks[1].id],
    };
  }

  private async createAssignmentPlan(
    decomposition: TaskDecomposition
  ): Promise<Map<string, string>> {
    const plan = new Map<string, string>();

    for (const subtask of decomposition.subTasks) {
      const workerType =
        subtask.metadata?.assignedWorkerType || 'analysis_worker';
      const worker = this.selectBestWorker(workerType);

      if (worker) {
        plan.set(subtask.id, worker.id);
      } else {
        this.logger.warn(`No available worker for task ${subtask.id}`);
      }
    }

    return plan;
  }

  private selectBestWorker(workerType: string): AgentInfo | null {
    const candidates = Array.from(this.workerAgents.values()).filter(
      (agent) =>
        agent.role === this.mapWorkerRole(workerType) &&
        agent.status === AgentStatus.IDLE &&
        agent.currentTaskCount < agent.maxConcurrentTasks
    );

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => {
      const loadDiff = a.currentTaskCount - b.currentTaskCount;
      if (loadDiff !== 0) return loadDiff;
      return (b.completedTasks || 0) - (a.completedTasks || 0);
    });

    return candidates[0];
  }

  private mapWorkerRole(type: string): AgentRole {
    const roleMap: Record<string, AgentRole> = {
      analysis_worker: AgentRole.ANALYSIS_WORKER,
      generation_worker: AgentRole.GENERATION_WORKER,
      retrieval_worker: AgentRole.RETRIEVAL_WORKER,
      validation_worker: AgentRole.VALIDATION_WORKER,
    };
    return roleMap[type] || AgentRole.ANALYSIS_WORKER;
  }

  private async assignTasksToWorkers(plan: Map<string, string>): Promise<void> {
    for (const [taskId, workerId] of plan) {
      const task = this.activeTasks.get(taskId);
      if (!task) continue;

      const message: AgentMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: MessageType.TASK_ASSIGNMENT,
        priority: MessagePriority.HIGH,
        senderId: this.id,
        receiverId: workerId,
        payload: { task },
        timestamp: new Date(),
      };

      await this.redisService.publish(
        `agent:channel:${workerId}`,
        JSON.stringify(message)
      );

      task.status = TaskStatus.ASSIGNED;
      task.assignedAgentId = workerId;
      this.activeTasks.set(taskId, task);

      this.logger.debug(`Assigned task ${taskId} to worker ${workerId}`);
    }
  }

  private async monitorAndCollectResults(
    decomposition: TaskDecomposition
  ): Promise<Map<string, TaskResult>> {
    const results = new Map<string, TaskResult>();
    const timeout = 60000;
    const startTime = Date.now();

    while (results.size < decomposition.subTasks.length) {
      if (Date.now() - startTime > timeout) {
        this.logger.warn('Task monitoring timeout reached');
        break;
      }

      for (const subtask of decomposition.subTasks) {
        if (results.has(subtask.id)) continue;

        const resultKey = `task:result:${subtask.id}`;
        const resultData = await this.redisService.get(resultKey);

        if (resultData) {
          try {
            const result: TaskResult = JSON.parse(resultData);
            results.set(subtask.id, result);
            this.logger.debug(`Collected result for task ${subtask.id}`);
          } catch (e) {
            this.logger.warn(`Failed to parse result for task ${subtask.id}`);
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return results;
  }

  private async aggregateResults(
    parentTask: Task,
    results: Map<string, TaskResult>,
    decomposition: TaskDecomposition
  ): Promise<TaskResult> {
    this.logger.log('Aggregating results from worker agents');

    const successfulResults = Array.from(results.values()).filter(
      (r) => r.success
    );
    const failedResults = Array.from(results.values()).filter(
      (r) => !r.success
    );

    if (failedResults.length > 0) {
      this.logger.warn(`${failedResults.length} subtasks failed`);
    }

    const aggregatedData: Record<string, any> = {};

    for (const [taskId, result] of results) {
      if (result.success && result.output?.data) {
        const subtask = decomposition.subTasks.find((t) => t.id === taskId);
        if (subtask) {
          aggregatedData[subtask.type] = result.output.data;
        }
      }
    }

    const totalExecutionTime = Array.from(results.values()).reduce(
      (sum, r) => sum + r.executionTimeMs,
      0
    );

    return {
      taskId: parentTask.id,
      success: successfulResults.length === decomposition.subTasks.length,
      output: {
        success: successfulResults.length === decomposition.subTasks.length,
        data: aggregatedData,
        metadata: {
          totalSubtasks: decomposition.subTasks.length,
          successfulSubtasks: successfulResults.length,
          failedSubtasks: failedResults.length,
        },
      },
      executionTimeMs: totalExecutionTime,
      agentId: this.id,
      retryable: failedResults.length > 0,
    };
  }

  async handleError(
    taskId: string,
    error: Error,
    strategy: ErrorRecoveryStrategy
  ): Promise<void> {
    this.logger.error(`Handling error for task ${taskId}: ${error.message}`);

    const task = this.activeTasks.get(taskId);
    if (!task) {
      this.logger.warn(`Task ${taskId} not found for error handling`);
      return;
    }

    switch (strategy.type) {
      case 'retry':
        if (task.retryCount < strategy.maxAttempts) {
          task.retryCount++;
          task.status = TaskStatus.RETRYING;
          this.taskQueue.push(task);
          this.logger.log(
            `Retrying task ${taskId} (attempt ${task.retryCount})`
          );
        }
        break;

      case 'reassign':
        if (strategy.fallbackAgentId) {
          task.assignedAgentId = strategy.fallbackAgentId;
          task.status = TaskStatus.PENDING;
          this.taskQueue.push(task);
          this.logger.log(
            `Reassigning task ${taskId} to ${strategy.fallbackAgentId}`
          );
        }
        break;

      case 'fallback':
        this.logger.log(`Using fallback for task ${taskId}`);
        break;

      case 'abort':
        task.status = TaskStatus.FAILED;
        this.logger.error(`Aborting task ${taskId}`);
        break;
    }
  }

  private async loadWorkerAgents(): Promise<void> {
    const keys = await this.redisService.keys('agent:info:*');

    for (const key of keys) {
      const data = await this.redisService.get(key);
      if (data) {
        try {
          const agentInfo: AgentInfo = JSON.parse(data);
          this.workerAgents.set(agentInfo.id, agentInfo);
        } catch (e) {
          this.logger.warn(`Failed to load agent info from ${key}`);
        }
      }
    }

    this.logger.log(`Loaded ${this.workerAgents.size} worker agents`);
  }

  registerWorkerAgent(agentInfo: AgentInfo): void {
    this.workerAgents.set(agentInfo.id, agentInfo);
    this.logger.log(
      `Registered worker agent: ${agentInfo.id} (${agentInfo.role})`
    );
  }

  unregisterWorkerAgent(agentId: string): void {
    this.workerAgents.delete(agentId);
    this.logger.log(`Unregistered worker agent: ${agentId}`);
  }

  private startHeartbeat(): void {
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

  getWorkerStats(): Map<string, AgentInfo> {
    return new Map(this.workerAgents);
  }

  getQueueLength(): number {
    return this.taskQueue.length;
  }

  getActiveTaskCount(): number {
    return this.activeTasks.size;
  }
}
