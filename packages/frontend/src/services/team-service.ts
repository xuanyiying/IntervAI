import axios from '../config/axios';

export interface TeamStatus {
  healthy: boolean;
  agents: AgentInfo[];
  metrics: TeamMetrics | null;
}

export interface AgentInfo {
  id: string;
  role: string;
  status: string;
  currentTaskCount: number;
}

export interface TeamMetrics {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  errorAgents: number;
  totalTasksProcessed: number;
  totalTasksFailed: number;
  averageTaskDuration: number;
  queueDepth: number;
  timestamp: string;
}

export interface AgentHealth {
  agentId: string;
  role: string;
  status: string;
  isHealthy: boolean;
  lastHeartbeat: string;
  currentTaskCount: number;
  completedTasks: number;
  failedTasks: number;
  errorRate: number;
}

export interface TaskStatus {
  id: string;
  type: string;
  status: string;
  priority: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  output?: any;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  output?: any;
  executionTimeMs: number;
  agentId: string;
  error?: string;
  retryable: boolean;
}

export interface SubmitTaskRequest {
  type: string;
  data: Record<string, any>;
  priority?: number;
  metadata?: Record<string, any>;
}

export const teamService = {
  getTeamStatus: async (): Promise<TeamStatus> => {
    const response = await axios.get('/agents/team/status');
    return response.data;
  },

  getHealth: async (): Promise<{
    healthy: boolean;
    agents: Array<{ id: string; healthy: boolean }>;
    messageQueue: boolean;
  }> => {
    const response = await axios.get('/agents/team/health');
    return response.data;
  },

  getMetrics: async (): Promise<{
    current: TeamMetrics | null;
    history: TeamMetrics[];
  }> => {
    const response = await axios.get('/agents/team/metrics');
    return response.data;
  },

  getAgents: async (): Promise<any[]> => {
    const response = await axios.get('/agents/team/agents');
    return response.data;
  },

  getAgentLogs: async (agentId: string, limit: number = 50): Promise<any[]> => {
    const response = await axios.get(`/agents/team/agents/${agentId}/logs`, {
      params: { limit },
    });
    return response.data;
  },

  submitTask: async (
    request: SubmitTaskRequest
  ): Promise<{ taskId: string; status: string; message: string }> => {
    const response = await axios.post('/agents/team/tasks', request);
    return response.data;
  },

  executeTask: async (request: SubmitTaskRequest): Promise<TaskResult> => {
    const response = await axios.post('/agents/team/tasks/execute', request);
    return response.data;
  },

  getTaskStatus: async (taskId: string): Promise<TaskStatus> => {
    const response = await axios.get(`/agents/team/tasks/${taskId}`);
    return response.data;
  },

  getTaskResult: async (taskId: string): Promise<TaskResult> => {
    const response = await axios.get(`/agents/team/tasks/${taskId}/result`);
    return response.data;
  },

  cancelTask: async (
    taskId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post(`/agents/team/tasks/${taskId}/cancel`);
    return response.data;
  },
};
