import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '@/redis/redis.service';
import { AgentRole, AgentStatus, AgentInfo } from '@/agent/team';

const MONITORING_INTERVAL = 10000;
const HEALTH_CHECK_INTERVAL = 30000;
const AGENT_TIMEOUT = 60000;

export interface TeamMetrics {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  errorAgents: number;
  totalTasksProcessed: number;
  totalTasksFailed: number;
  averageTaskDuration: number;
  queueDepth: number;
  timestamp: Date;
}

export interface AgentHealthStatus {
  agentId: string;
  role: AgentRole;
  status: AgentStatus;
  isHealthy: boolean;
  lastHeartbeat: Date;
  currentTaskCount: number;
  completedTasks: number;
  failedTasks: number;
  errorRate: number;
}

@Injectable()
export class TeamMonitorService implements OnModuleInit {
  private readonly logger = new Logger(TeamMonitorService.name);
  private monitoringInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsHistory: TeamMetrics[] = [];
  private readonly maxHistorySize = 100;

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Team Monitor Service initialized');
    this.startMonitoring();
    this.startHealthChecks();
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics().catch((error) => {
        this.logger.error(
          `Failed to collect metrics: ${error instanceof Error ? error.message : String(error)}`
        );
      });
    }, MONITORING_INTERVAL);
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks().catch((error) => {
        this.logger.error(
          `Health check failed: ${error instanceof Error ? error.message : String(error)}`
        );
      });
    }, HEALTH_CHECK_INTERVAL);
  }

  async collectMetrics(): Promise<TeamMetrics> {
    const agentKeys = await this.redisService.keys('agent:info:*');
    const heartbeatKeys = await this.redisService.keys('agent:heartbeat:*');

    let totalAgents = 0;
    let activeAgents = 0;
    let idleAgents = 0;
    let errorAgents = 0;
    let totalTasksProcessed = 0;
    let totalTasksFailed = 0;
    const totalDuration = 0;
    const taskCount = 0;

    for (const key of heartbeatKeys) {
      try {
        const data = await this.redisService.get(key);
        if (data) {
          const heartbeat = JSON.parse(data);
          totalAgents++;

          if (heartbeat.status === AgentStatus.BUSY) {
            activeAgents++;
          } else if (heartbeat.status === AgentStatus.IDLE) {
            idleAgents++;
          } else if (heartbeat.status === AgentStatus.ERROR) {
            errorAgents++;
          }

          totalTasksProcessed += heartbeat.completedTasks || 0;
          totalTasksFailed += heartbeat.failedTasks || 0;
        }
      } catch (e) {
        this.logger.warn(`Failed to parse heartbeat data from ${key}`);
      }
    }

    const queueDepth = await this.getTotalQueueDepth();

    const metrics: TeamMetrics = {
      totalAgents,
      activeAgents,
      idleAgents,
      errorAgents,
      totalTasksProcessed,
      totalTasksFailed,
      averageTaskDuration: taskCount > 0 ? totalDuration / taskCount : 0,
      queueDepth,
      timestamp: new Date(),
    };

    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }

    await this.redisService.set(
      'team:metrics:latest',
      JSON.stringify(metrics),
      300
    );

    return metrics;
  }

  async performHealthChecks(): Promise<AgentHealthStatus[]> {
    const heartbeatKeys = await this.redisService.keys('agent:heartbeat:*');
    const healthStatuses: AgentHealthStatus[] = [];
    const now = Date.now();

    for (const key of heartbeatKeys) {
      try {
        const data = await this.redisService.get(key);
        if (data) {
          const heartbeat = JSON.parse(data);
          const lastHeartbeat = new Date(heartbeat.timestamp);
          const timeSinceLastHeartbeat = now - lastHeartbeat.getTime();

          const isHealthy = timeSinceLastHeartbeat < AGENT_TIMEOUT;

          const totalTasks =
            (heartbeat.completedTasks || 0) + (heartbeat.failedTasks || 0);
          const errorRate =
            totalTasks > 0 ? (heartbeat.failedTasks || 0) / totalTasks : 0;

          const healthStatus: AgentHealthStatus = {
            agentId: heartbeat.agentId,
            role: heartbeat.role,
            status: heartbeat.status,
            isHealthy,
            lastHeartbeat,
            currentTaskCount: heartbeat.currentTaskCount || 0,
            completedTasks: heartbeat.completedTasks || 0,
            failedTasks: heartbeat.failedTasks || 0,
            errorRate,
          };

          healthStatuses.push(healthStatus);

          if (!isHealthy) {
            this.logger.warn(
              `Agent ${heartbeat.agentId} is unhealthy - last heartbeat ${Math.round(timeSinceLastHeartbeat / 1000)}s ago`
            );
          }

          await this.redisService.set(
            `agent:health:${heartbeat.agentId}`,
            JSON.stringify(healthStatus),
            300
          );
        }
      } catch (e) {
        this.logger.warn(`Failed to perform health check for ${key}`);
      }
    }

    return healthStatuses;
  }

  private async getTotalQueueDepth(): Promise<number> {
    const queueKeys = await this.redisService.keys('message:queue:*');
    let totalDepth = 0;

    for (const key of queueKeys) {
      try {
        const depth = await this.redisService.zcard(key);
        totalDepth += depth;
      } catch (e) {
        this.logger.warn(`Failed to get queue depth for ${key}`);
      }
    }

    return totalDepth;
  }

  async getAgentInfo(agentId: string): Promise<AgentInfo | null> {
    const data = await this.redisService.get(`agent:info:${agentId}`);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }

  async getAllAgents(): Promise<AgentInfo[]> {
    const keys = await this.redisService.keys('agent:info:*');
    const agents: AgentInfo[] = [];

    for (const key of keys) {
      const data = await this.redisService.get(key);
      if (data) {
        try {
          agents.push(JSON.parse(data));
        } catch (e) {
          this.logger.warn(`Failed to parse agent info from ${key}`);
        }
      }
    }

    return agents;
  }

  getMetricsHistory(): TeamMetrics[] {
    return [...this.metricsHistory];
  }

  async getLatestMetrics(): Promise<TeamMetrics | null> {
    const data = await this.redisService.get('team:metrics:latest');
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }

  async getAgentHealth(agentId: string): Promise<AgentHealthStatus | null> {
    const data = await this.redisService.get(`agent:health:${agentId}`);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }

  async logAgentEvent(
    agentId: string,
    event: string,
    details?: Record<string, any>
  ): Promise<void> {
    const logEntry = {
      agentId,
      event,
      details,
      timestamp: new Date(),
    };

    await this.redisService.lpush(
      `agent:logs:${agentId}`,
      JSON.stringify(logEntry)
    );

    await this.redisService.ltrim(`agent:logs:${agentId}`, 0, 99);

    this.logger.debug(`Agent ${agentId} event: ${event}`);
  }

  async getAgentLogs(agentId: string, limit: number = 50): Promise<any[]> {
    const logs = await this.redisService.lrange(
      `agent:logs:${agentId}`,
      0,
      limit - 1
    );

    return logs.map((log: string) => {
      try {
        return JSON.parse(log);
      } catch {
        return { raw: log };
      }
    });
  }

  async getTeamSummary(): Promise<{
    metrics: TeamMetrics | null;
    agents: AgentInfo[];
    healthStatuses: AgentHealthStatus[];
  }> {
    const [metrics, agents] = await Promise.all([
      this.getLatestMetrics(),
      this.getAllAgents(),
    ]);

    const healthStatuses = await Promise.all(
      agents.map((agent) => this.getAgentHealth(agent.id))
    );

    return {
      metrics,
      agents,
      healthStatuses: healthStatuses.filter(
        (h) => h !== null
      ) as AgentHealthStatus[],
    };
  }

  onModuleDestroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}
