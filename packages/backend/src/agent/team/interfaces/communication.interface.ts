export enum MessageType {
  TASK_ASSIGNMENT = 'task_assignment',
  TASK_RESULT = 'task_result',
  STATUS_UPDATE = 'status_update',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error',
  COORDINATION = 'coordination',
  BROADCAST = 'broadcast',
  REQUEST = 'request',
  RESPONSE = 'response',
}

export enum MessagePriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4,
}

export interface AgentMessage {
  id: string;
  type: MessageType;
  priority: MessagePriority;
  senderId: string;
  receiverId?: string;
  payload: Record<string, any>;
  correlationId?: string;
  timestamp: Date;
  ttl?: number;
  metadata?: Record<string, any>;
}

export interface MessageQueue {
  publish(message: AgentMessage): Promise<void>;
  subscribe(
    agentId: string,
    handler: (message: AgentMessage) => Promise<void>
  ): Promise<void>;
  unsubscribe(agentId: string): Promise<void>;
  getMessages(agentId: string): Promise<AgentMessage[]>;
  ack(messageId: string): Promise<void>;
}

export interface CommunicationProtocol {
  sendMessage(message: AgentMessage): Promise<void>;
  broadcast(message: AgentMessage): Promise<void>;
  request(
    targetAgentId: string,
    payload: Record<string, any>,
    timeout?: number
  ): Promise<AgentMessage>;
  respond(
    originalMessage: AgentMessage,
    response: Record<string, any>
  ): Promise<void>;
}

export interface CoordinationMessage {
  type:
    | 'task_start'
    | 'task_complete'
    | 'task_failed'
    | 'resource_request'
    | 'resource_release'
    | 'sync'
    | 'checkpoint';
  taskId: string;
  agentId: string;
  data?: Record<string, any>;
  timestamp: Date;
}

export interface ErrorRecoveryStrategy {
  type: 'retry' | 'reassign' | 'fallback' | 'abort';
  maxAttempts: number;
  backoffMs: number;
  fallbackAgentId?: string;
}

export interface CommunicationStats {
  messagesSent: number;
  messagesReceived: number;
  averageLatency: number;
  errorRate: number;
  lastMessageAt?: Date;
}
