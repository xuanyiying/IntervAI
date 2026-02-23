import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { RedisService } from '@/redis/redis.service';
import {
  AgentMessage,
  MessageType,
  MessagePriority,
  CommunicationStats,
} from '@/agent/team/interfaces';
const MAX_QUEUE_SIZE = 1000;
const DEADLOCK_CHECK_INTERVAL = 5000;

@Injectable()
export class MessageQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessageQueueService.name);
  private subscribers: Map<string, (message: AgentMessage) => Promise<void>> =
    new Map();
  private stats: Map<string, CommunicationStats> = new Map();
  private processingLocks: Map<string, boolean> = new Map();
  private deadlockCheckInterval?: NodeJS.Timeout;

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Message Queue Service initialized');
    this.startDeadlockDetection();
  }

  onModuleDestroy(): void {
    if (this.deadlockCheckInterval) {
      clearInterval(this.deadlockCheckInterval);
    }
  }

  async publish(message: AgentMessage): Promise<void> {
    if (!message.receiverId) {
      await this.broadcast(message);
      return;
    }

    const queueKey = `message:queue:${message.receiverId}`;
    const queueSize = await this.getQueueSize(message.receiverId);

    if (queueSize >= MAX_QUEUE_SIZE) {
      this.logger.warn(
        `Message queue full for agent ${message.receiverId}, dropping message ${message.id}`
      );
      throw new Error(`Message queue full for agent ${message.receiverId}`);
    }

    const priority = message.priority || MessagePriority.NORMAL;
    const score = this.calculateScore(priority, message.timestamp);

    await this.redisService.zadd(queueKey, score, JSON.stringify(message));

    if (message.ttl) {
      await this.redisService.expire(queueKey, message.ttl);
    }

    this.updateStats(message.senderId, 'sent');

    this.logger.debug(
      `Published message ${message.id} to agent ${message.receiverId}`
    );
  }

  async subscribe(
    agentId: string,
    handler: (message: AgentMessage) => Promise<void>
  ): Promise<void> {
    this.subscribers.set(agentId, handler);
    this.logger.log(`Agent ${agentId} subscribed to message queue`);

    this.startProcessing(agentId);
  }

  async unsubscribe(agentId: string): Promise<void> {
    this.subscribers.delete(agentId);
    this.processingLocks.delete(agentId);
    this.logger.log(`Agent ${agentId} unsubscribed from message queue`);
  }

  async getMessages(agentId: string): Promise<AgentMessage[]> {
    const queueKey = `message:queue:${agentId}`;
    const messages = await this.redisService.zrange(queueKey, 0, -1);

    return messages
      .map((msg: string) => {
        try {
          return JSON.parse(msg) as AgentMessage;
        } catch {
          return null;
        }
      })
      .filter((msg): msg is AgentMessage => msg !== null);
  }

  async ack(messageId: string, agentId: string): Promise<void> {
    const queueKey = `message:queue:${agentId}`;
    const messages = await this.redisService.zrange(queueKey, 0, -1);

    for (const msg of messages) {
      try {
        const parsed: AgentMessage = JSON.parse(msg);
        if (parsed.id === messageId) {
          await this.redisService.zrem(queueKey, msg);
          this.logger.debug(`Acknowledged message ${messageId}`);
          break;
        }
      } catch (e) {
        this.logger.warn(`Failed to parse message for ack: ${msg}`);
      }
    }
  }

  async broadcast(message: AgentMessage): Promise<void> {
    const agents = Array.from(this.subscribers.keys());

    for (const agentId of agents) {
      if (agentId !== message.senderId) {
        const broadcastMessage: AgentMessage = {
          ...message,
          id: `${message.id}-broadcast-${agentId}`,
          receiverId: agentId,
        };
        await this.publish(broadcastMessage);
      }
    }

    this.logger.debug(
      `Broadcast message ${message.id} to ${agents.length} agents`
    );
  }

  async request(
    targetAgentId: string,
    payload: Record<string, any>,
    senderId: string,
    timeout: number = 30000
  ): Promise<AgentMessage> {
    const correlationId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const message: AgentMessage = {
      id: correlationId,
      type: MessageType.REQUEST,
      priority: MessagePriority.HIGH,
      senderId,
      receiverId: targetAgentId,
      payload,
      correlationId,
      timestamp: new Date(),
    };

    await this.publish(message);

    return this.waitForResponse(correlationId, timeout);
  }

  async respond(
    originalMessage: AgentMessage,
    response: Record<string, any>,
    senderId: string
  ): Promise<void> {
    const responseMessage: AgentMessage = {
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: MessageType.RESPONSE,
      priority: MessagePriority.HIGH,
      senderId,
      receiverId: originalMessage.senderId,
      payload: response,
      correlationId: originalMessage.correlationId,
      timestamp: new Date(),
    };

    await this.publish(responseMessage);
  }

  private async getQueueSize(agentId: string): Promise<number> {
    const queueKey = `message:queue:${agentId}`;
    return this.redisService.zcard(queueKey);
  }

  private calculateScore(priority: MessagePriority, timestamp: Date): number {
    const now = Date.now();
    const messageTime = new Date(timestamp).getTime();
    const age = (now - messageTime) / 1000;

    return priority * 1000000 - age;
  }

  private async startProcessing(agentId: string): Promise<void> {
    const processLoop = async () => {
      while (this.subscribers.has(agentId)) {
        if (this.processingLocks.get(agentId)) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }

        this.processingLocks.set(agentId, true);

        try {
          const queueKey = `message:queue:${agentId}`;
          const messages = await this.redisService.zrange(queueKey, 0, 0);

          if (messages.length > 0) {
            const message: AgentMessage = JSON.parse(messages[0]);
            const handler = this.subscribers.get(agentId);

            if (handler) {
              try {
                await handler(message);
                await this.ack(message.id, agentId);
                this.updateStats(agentId, 'received');
              } catch (error) {
                this.logger.error(
                  `Error processing message ${message.id}: ${error instanceof Error ? error.message : String(error)}`
                );
              }
            }
          }
        } catch (error) {
          this.logger.error(
            `Error in processing loop for ${agentId}: ${error instanceof Error ? error.message : String(error)}`
          );
        } finally {
          this.processingLocks.set(agentId, false);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };

    processLoop().catch((error) => {
      this.logger.error(
        `Processing loop failed for ${agentId}: ${error instanceof Error ? error.message : String(error)}`
      );
    });
  }

  private async waitForResponse(
    correlationId: string,
    timeout: number
  ): Promise<AgentMessage> {
    const startTime = Date.now();
    const responseKey = `message:response:${correlationId}`;

    while (Date.now() - startTime < timeout) {
      const response = await this.redisService.get(responseKey);

      if (response) {
        await this.redisService.del(responseKey);
        return JSON.parse(response);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(`Request timeout for correlation ID ${correlationId}`);
  }

  private updateStats(agentId: string, type: 'sent' | 'received'): void {
    const stats = this.stats.get(agentId) || {
      messagesSent: 0,
      messagesReceived: 0,
      averageLatency: 0,
      errorRate: 0,
    };

    if (type === 'sent') {
      stats.messagesSent++;
    } else {
      stats.messagesReceived++;
    }

    stats.lastMessageAt = new Date();
    this.stats.set(agentId, stats);
  }

  getStats(agentId: string): CommunicationStats | undefined {
    return this.stats.get(agentId);
  }

  private startDeadlockDetection(): void {
    this.deadlockCheckInterval = setInterval(() => {
      for (const [agentId, isLocked] of this.processingLocks) {
        if (isLocked) {
          this.logger.warn(`Potential deadlock detected for agent ${agentId}`);
        }
      }
    }, DEADLOCK_CHECK_INTERVAL);
  }

  async clearQueue(agentId: string): Promise<void> {
    const queueKey = `message:queue:${agentId}`;
    await this.redisService.del(queueKey);
    this.logger.log(`Cleared message queue for agent ${agentId}`);
  }
}
