import { Task, TaskResult } from './task.interface';

export enum AgentRole {
  LEADER = 'leader',
  ANALYSIS_WORKER = 'analysis_worker',
  GENERATION_WORKER = 'generation_worker',
  RETRIEVAL_WORKER = 'retrieval_worker',
  VALIDATION_WORKER = 'validation_worker',
}

export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  OFFLINE = 'offline',
}

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
}

export interface AgentInfo {
  id: string;
  role: AgentRole;
  status: AgentStatus;
  capabilities: AgentCapability[];
  maxConcurrentTasks: number;
  currentTaskCount: number;
  lastHeartbeat: Date;
  completedTasks?: number;
  failedTasks?: number;
  metadata?: Record<string, any>;
}

export interface AgentState {
  agentId: string;
  role: AgentRole;
  status: AgentStatus;
  currentTaskId?: string;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class BaseAgent {
  abstract readonly id: string;
  abstract readonly role: AgentRole;
  abstract readonly capabilities: AgentCapability[];

  abstract initialize(): Promise<void>;
  abstract execute(task: Task): Promise<TaskResult>;
  abstract getStatus(): AgentStatus;
  abstract heartbeat(): Promise<void>;
}
