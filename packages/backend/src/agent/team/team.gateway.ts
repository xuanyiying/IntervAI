import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TeamOrchestratorService } from './team-orchestrator.service';
import { TeamMonitorService } from './monitoring/team-monitor.service';
import { TaskType, TaskStatus, TaskPriority } from '@/agent/team/interfaces';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';

export interface TaskProgressEvent {
  taskId: string;
  status: TaskStatus;
  progress: number;
  message: string;
  subtaskResults?: any[];
  timestamp: number;
}

export interface TeamStatusEvent {
  healthy: boolean;
  activeAgents: number;
  queueDepth: number;
  timestamp: number;
}

@WebSocketGateway({
  namespace: '/team',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@Injectable()
export class TeamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TeamGateway.name);
  private authenticatedClients = new Map<string, string>();
  private userSubscriptions = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => TeamOrchestratorService))
    private readonly teamOrchestrator: TeamOrchestratorService,
    private readonly teamMonitor: TeamMonitorService
  ) {}

  async handleConnection(client: Socket) {
    this.logger.debug(
      `Team gateway client attempting to connect: ${client.id}`
    );

    try {
      const token = this.extractToken(client);

      if (!token) {
        client.emit('error', {
          type: 'error',
          message: 'Authentication required',
          timestamp: Date.now(),
        });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      const userId = payload.sub;

      if (!userId) {
        client.emit('error', {
          type: 'error',
          message: 'Invalid token',
          timestamp: Date.now(),
        });
        client.disconnect();
        return;
      }

      this.authenticatedClients.set(client.id, userId);

      if (!this.userSubscriptions.has(userId)) {
        this.userSubscriptions.set(userId, new Set());
      }
      this.userSubscriptions.get(userId)!.add(client.id);

      client.join(`user:${userId}`);
      client.join('team:status');

      this.logger.log(
        `Team gateway client connected: ${client.id}, userId: ${userId}`
      );

      client.emit('connected', {
        type: 'system',
        message: 'Connected to team gateway',
        timestamp: Date.now(),
      });

      const status = await this.teamOrchestrator.getTeamStatus();
      client.emit('team:status', {
        healthy: status.metrics !== null,
        activeAgents: status.metrics?.activeAgents || 0,
        queueDepth: status.metrics?.queueDepth || 0,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.warn(
        `Team gateway client ${client.id} auth failed: ${error instanceof Error ? error.message : 'Unknown'}`
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.authenticatedClients.get(client.id);

    if (userId) {
      const userSubs = this.userSubscriptions.get(userId);
      if (userSubs) {
        userSubs.delete(client.id);
        if (userSubs.size === 0) {
          this.userSubscriptions.delete(userId);
        }
      }
    }

    this.authenticatedClients.delete(client.id);
    this.logger.debug(`Team gateway client disconnected: ${client.id}`);
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const authHeader = client.handshake.headers?.authorization;
    if (authHeader) {
      return authHeader.replace(/^Bearer\s+/i, '');
    }

    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  @SubscribeMessage('task:submit')
  async handleSubmitTask(
    @MessageBody()
    data: {
      type: TaskType;
      data: Record<string, any>;
      priority?: TaskPriority;
    },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId) {
      client.emit('error', {
        message: 'Not authenticated',
        timestamp: Date.now(),
      });
      return;
    }

    try {
      this.emitToUser(userId, 'task:progress', {
        taskId: 'pending',
        status: TaskStatus.PENDING,
        progress: 0,
        message: '正在提交任务...',
        timestamp: Date.now(),
      });

      const task = await this.teamOrchestrator.submitTask(
        data.type,
        { ...data.data, userId },
        data.priority || TaskPriority.MEDIUM
      );

      this.emitToUser(userId, 'task:progress', {
        taskId: task.id,
        status: TaskStatus.QUEUED,
        progress: 10,
        message: '任务已提交，等待处理...',
        timestamp: Date.now(),
      });

      this.executeTaskWithProgress(task.id, userId);
    } catch (error) {
      this.emitToUser(userId, 'task:error', {
        message:
          error instanceof Error ? error.message : 'Task submission failed',
        timestamp: Date.now(),
      });
    }
  }

  private async executeTaskWithProgress(taskId: string, userId: string) {
    try {
      const task = await this.teamOrchestrator.getTaskStatus(taskId);
      if (!task) return;

      this.emitToUser(userId, 'task:progress', {
        taskId,
        status: TaskStatus.IN_PROGRESS,
        progress: 20,
        message: 'Leader Agent 正在分解任务...',
        timestamp: Date.now(),
      });

      const result = await this.teamOrchestrator.executeTask(task);

      if (result.success) {
        this.emitToUser(userId, 'task:complete', {
          taskId,
          status: TaskStatus.COMPLETED,
          progress: 100,
          message: '任务完成',
          output: result.output,
          executionTimeMs: result.executionTimeMs,
          timestamp: Date.now(),
        });
      } else {
        this.emitToUser(userId, 'task:error', {
          taskId,
          status: TaskStatus.FAILED,
          message: result.error?.message || 'Task failed',
          retryable: result.retryable,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      this.emitToUser(userId, 'task:error', {
        taskId,
        status: TaskStatus.FAILED,
        message:
          error instanceof Error ? error.message : 'Task execution failed',
        timestamp: Date.now(),
      });
    }
  }

  @SubscribeMessage('task:status')
  async handleGetTaskStatus(
    @MessageBody() data: { taskId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId) return;

    try {
      const task = await this.teamOrchestrator.getTaskStatus(data.taskId);
      const result = await this.teamOrchestrator.getTaskResult(data.taskId);

      client.emit('task:status', {
        task,
        result,
        timestamp: Date.now(),
      });
    } catch (error) {
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Failed to get task status',
        timestamp: Date.now(),
      });
    }
  }

  @SubscribeMessage('task:cancel')
  async handleCancelTask(
    @MessageBody() data: { taskId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId) return;

    try {
      const cancelled = await this.teamOrchestrator.cancelTask(data.taskId);

      client.emit('task:cancelled', {
        taskId: data.taskId,
        success: cancelled,
        message: cancelled ? 'Task cancelled' : 'Cannot cancel task',
        timestamp: Date.now(),
      });
    } catch (error) {
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Failed to cancel task',
        timestamp: Date.now(),
      });
    }
  }

  @SubscribeMessage('team:status')
  async handleGetTeamStatus(@ConnectedSocket() client: Socket) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId) return;

    try {
      const status = await this.teamOrchestrator.getTeamStatus();
      const health = await this.teamOrchestrator.healthCheck();

      client.emit('team:status', {
        ...status,
        healthy: health.healthy,
        timestamp: Date.now(),
      });
    } catch (error) {
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Failed to get team status',
        timestamp: Date.now(),
      });
    }
  }

  @SubscribeMessage('team:metrics')
  async handleGetTeamMetrics(@ConnectedSocket() client: Socket) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId) return;

    try {
      const metrics = await this.teamMonitor.getLatestMetrics();
      const history = this.teamMonitor.getMetricsHistory();

      client.emit('team:metrics', {
        current: metrics,
        history: history.slice(-20),
        timestamp: Date.now(),
      });
    } catch (error) {
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Failed to get metrics',
        timestamp: Date.now(),
      });
    }
  }

  public emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  public broadcastTeamStatus(status: TeamStatusEvent) {
    this.server.to('team:status').emit('team:status', status);
  }

  public broadcastTaskProgress(progress: TaskProgressEvent) {
    this.server.emit('task:progress', progress);
  }
}
