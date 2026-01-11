/**
 * Unified Chat WebSocket Gateway
 * Handles all chat messages, intent recognition, and AI operations
 */

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
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { ChatIntentService } from './chat-intent.service';
import { MessageRole } from '@prisma/client';

export interface ChatMessage {
  conversationId: string;
  content: string;
  attachments?: any[];
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  type: 'message' | 'chunk' | 'done' | 'error' | 'typing' | 'system';
  messageId?: string;
  content?: string;
  role?: MessageRole;
  timestamp: number;
  metadata?: Record<string, any>;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private authenticatedClients = new Map<string, string>(); // clientId -> userId
  private userSockets = new Map<string, Set<string>>(); // userId -> Set<clientId>
  private activeStreams = new Map<string, boolean>(); // clientId -> isStreaming

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly chatIntentService: ChatIntentService
  ) {}

  /**
   * Handle client connection with JWT authentication
   */
  async handleConnection(client: Socket) {
    this.logger.debug(`Client attempting to connect: ${client.id}`);

    try {
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: No token`);
        client.emit('error', {
          type: 'error',
          message: 'Authentication required',
          timestamp: Date.now(),
        });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub || payload.userId;

      if (!userId) {
        this.logger.warn(`Client ${client.id} rejected: Invalid token`);
        client.emit('error', {
          type: 'error',
          message: 'Invalid token',
          timestamp: Date.now(),
        });
        client.disconnect();
        return;
      }

      // Store authenticated client
      this.authenticatedClients.set(client.id, userId);

      // Track user's sockets for multi-device support
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join user's personal room
      client.join(`user:${userId}`);

      this.logger.log(`Client connected: ${client.id}, userId: ${userId}`);

      // Send connection success
      client.emit('connected', {
        type: 'system',
        content: 'Connected to chat server',
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.warn(
        `Client ${client.id} auth failed: ${error instanceof Error ? error.message : 'Unknown'}`
      );
      client.emit('error', {
        type: 'error',
        message: 'Authentication failed',
        timestamp: Date.now(),
      });
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userId = this.authenticatedClients.get(client.id);

    if (userId) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }

    this.authenticatedClients.delete(client.id);
    this.activeStreams.delete(client.id);
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  /**
   * Extract JWT token from socket handshake
   */
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

  /**
   * Handle incoming chat message
   * This is the main entry point for all user messages
   */
  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: ChatMessage,
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);

    if (!userId) {
      client.emit('error', {
        type: 'error',
        message: 'Not authenticated',
        timestamp: Date.now(),
      });
      return;
    }

    const { conversationId, content, attachments, metadata } = data;

    if (!conversationId || !content?.trim()) {
      client.emit('error', {
        type: 'error',
        message: 'Invalid message',
        timestamp: Date.now(),
      });
      return;
    }

    try {
      // 1. Save user message to database
      const userMessage = await this.prisma.message.create({
        data: {
          conversationId,
          userId,
          role: MessageRole.USER,
          content: content.trim(),
          attachments: attachments || [],
          metadata: metadata || {},
        },
      });

      // Update conversation
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
        },
      });

      // 2. Broadcast user message to all user's devices
      this.emitToUser(userId, 'message', {
        type: 'message',
        messageId: userMessage.id,
        content: userMessage.content,
        role: MessageRole.USER,
        timestamp: userMessage.createdAt.getTime(),
        metadata: userMessage.metadata as Record<string, any>,
      });

      // 3. Send typing indicator
      this.emitToUser(userId, 'typing', {
        type: 'typing',
        content: 'AI is thinking...',
        timestamp: Date.now(),
      });

      // 4. Process intent and generate response
      this.activeStreams.set(client.id, true);

      await this.chatIntentService.processMessage(
        userId,
        conversationId,
        content,
        metadata,
        // Callback for streaming chunks
        (chunk: ChatResponse) => {
          if (this.activeStreams.get(client.id)) {
            this.emitToUser(userId, chunk.type, chunk);
          }
        },
        // Callback for completion
        async (
          finalContent: string,
          responseMetadata?: Record<string, any>
        ) => {
          if (!this.activeStreams.get(client.id)) return;

          // Save assistant message
          const assistantMessage = await this.prisma.message.create({
            data: {
              conversationId,
              userId,
              role: MessageRole.ASSISTANT,
              content: finalContent,
              metadata: responseMetadata || {},
            },
          });

          // Update conversation
          await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
              lastMessageAt: new Date(),
              messageCount: { increment: 1 },
            },
          });

          // Send done signal
          this.emitToUser(userId, 'done', {
            type: 'done',
            messageId: assistantMessage.id,
            content: finalContent,
            role: MessageRole.ASSISTANT,
            timestamp: assistantMessage.createdAt.getTime(),
            metadata: responseMetadata,
          });

          this.activeStreams.delete(client.id);
        }
      );
    } catch (error) {
      this.logger.error(
        `Message handling failed: ${error instanceof Error ? error.message : String(error)}`
      );
      client.emit('error', {
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to process message',
        timestamp: Date.now(),
      });
      this.activeStreams.delete(client.id);
    }
  }

  /**
   * Handle file upload notification
   */
  @SubscribeMessage('file_uploaded')
  async handleFileUploaded(
    @MessageBody()
    data: { conversationId: string; resumeId: string; filename: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId) return;

    // Notify about file upload
    this.emitToUser(userId, 'system', {
      type: 'system',
      content: `文件 "${data.filename}" 已上传，正在解析...`,
      timestamp: Date.now(),
      metadata: { resumeId: data.resumeId },
    });
  }

  /**
   * Handle resume parsed notification
   */
  @SubscribeMessage('resume_parsed')
  async handleResumeParsed(
    @MessageBody()
    data: { conversationId: string; resumeId: string; parsedContent: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId) return;

    // Store parsed content in user's session for later use
    await this.chatIntentService.storeUserResumeContent(
      userId,
      data.resumeId,
      data.parsedContent
    );

    this.emitToUser(userId, 'system', {
      type: 'system',
      content: '简历解析完成！您可以说"优化简历"来优化您的简历内容。',
      timestamp: Date.now(),
      metadata: { resumeId: data.resumeId, action: 'resume_ready' },
    });
  }

  /**
   * Handle cancellation request
   */
  @SubscribeMessage('cancel')
  handleCancel(@ConnectedSocket() client: Socket) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId) return;

    this.activeStreams.set(client.id, false);

    this.emitToUser(userId, 'cancelled', {
      type: 'system',
      content: 'Operation cancelled',
      timestamp: Date.now(),
    });
  }

  /**
   * Join a conversation room
   */
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId) return;

    // Verify user owns this conversation
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: data.conversationId, userId },
    });

    if (conversation) {
      client.join(`conversation:${data.conversationId}`);
      this.logger.debug(
        `Client ${client.id} joined conversation ${data.conversationId}`
      );
    }
  }

  /**
   * Emit to all of a user's connected devices
   * Public method to allow other services to send messages to users
   */
  public emitToUser(userId: string, event: string, data: ChatResponse) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
