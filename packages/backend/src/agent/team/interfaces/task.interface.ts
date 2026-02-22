export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

export enum TaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

export enum TaskType {
  RESUME_ANALYSIS = 'resume_analysis',
  JD_ANALYSIS = 'jd_analysis',
  CONTENT_GENERATION = 'content_generation',
  RAG_QUERY = 'rag_query',
  VALIDATION = 'validation',
  OPTIMIZATION = 'optimization',
  COORDINATION = 'coordination',
}

export interface TaskInput {
  type: TaskType;
  data: Record<string, any>;
  context?: Record<string, any>;
}

export interface TaskOutput {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  metadata?: Record<string, any>;
}

export interface Task {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  input: TaskInput;
  output?: TaskOutput;
  parentId?: string;
  childTaskIds: string[];
  assignedAgentId?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  deadline?: Date;
  metadata?: Record<string, any>;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  output?: TaskOutput;
  executionTimeMs: number;
  agentId: string;
  error?: Error;
  retryable: boolean;
}

export interface TaskDecomposition {
  parentTask: Task;
  subTasks: Task[];
  dependencies: Map<string, string[]>;
  executionOrder: string[];
}

export interface TaskQueue {
  enqueue(task: Task): Promise<void>;
  dequeue(): Promise<Task | undefined>;
  peek(): Promise<Task | undefined>;
  size(): Promise<number>;
  clear(): Promise<void>;
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  condition?: (results: Map<string, TaskResult>) => boolean;
}
