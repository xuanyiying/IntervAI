import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@/redis/redis.service';
import { v4 as uuidv4 } from 'uuid';
import { FileType } from '@/storage/interfaces/storage.interface';

export interface ChunkUploadSession {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  fileType: FileType;
  category: string;
  ossKey: string;
  totalChunks: number;
  uploadedChunks: Set<number>;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ChunkUploadSessionService {
  private readonly logger = new Logger(ChunkUploadSessionService.name);
  private readonly SESSION_PREFIX = 'chunk_upload_session:';
  private readonly SESSION_EXPIRE_TIME = 7200; // 2 hours in seconds

  constructor(private redisService: RedisService) {}

  /**
   * Create a new chunk upload session
   */
  async createSession(
    userId: string,
    fileName: string,
    fileSize: number,
    contentType: string,
    fileType: FileType,
    category: string,
    ossKey: string,
    totalChunks: number,
    metadata?: Record<string, unknown>
  ): Promise<ChunkUploadSession> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_EXPIRE_TIME * 1000);

    const session: ChunkUploadSession = {
      id: sessionId,
      userId,
      fileName,
      fileSize,
      contentType,
      fileType,
      category,
      ossKey,
      totalChunks,
      uploadedChunks: new Set(),
      status: 'pending',
      createdAt: now,
      expiresAt,
      metadata,
    };

    const key = this.getSessionKey(sessionId);
    const sessionData = this.serializeSession(session);

    await this.redisService.set(
      key,
      JSON.stringify(sessionData),
      this.SESSION_EXPIRE_TIME
    );

    this.logger.log(`Chunk upload session created: ${sessionId}`);
    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ChunkUploadSession | null> {
    const key = this.getSessionKey(sessionId);
    const data = await this.redisService.get(key);

    if (!data) {
      return null;
    }

    return this.deserializeSession(JSON.parse(data));
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    status: ChunkUploadSession['status']
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = status;
    const key = this.getSessionKey(sessionId);
    const sessionData = this.serializeSession(session);

    await this.redisService.set(
      key,
      JSON.stringify(sessionData),
      this.SESSION_EXPIRE_TIME
    );

    this.logger.log(`Session ${sessionId} status updated to: ${status}`);
  }

  /**
   * Mark chunk as uploaded
   */
  async markChunkUploaded(
    sessionId: string,
    chunkIndex: number
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.uploadedChunks.add(chunkIndex);
    const key = this.getSessionKey(sessionId);
    const sessionData = this.serializeSession(session);

    await this.redisService.set(
      key,
      JSON.stringify(sessionData),
      this.SESSION_EXPIRE_TIME
    );
  }

  /**
   * Get upload progress
   */
  async getProgress(sessionId: string): Promise<{
    sessionId: string;
    totalChunks: number;
    uploadedChunks: number;
    progress: number;
    status: string;
  } | null> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    const uploadedCount = session.uploadedChunks.size;
    const progress = Math.round((uploadedCount / session.totalChunks) * 100);

    return {
      sessionId,
      totalChunks: session.totalChunks,
      uploadedChunks: uploadedCount,
      progress,
      status: session.status,
    };
  }

  /**
   * Check if all chunks are uploaded
   */
  async isUploadComplete(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    return session.uploadedChunks.size === session.totalChunks;
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = this.getSessionKey(sessionId);
    await this.redisService.del(key);
    this.logger.log(`Session deleted: ${sessionId}`);
  }

  /**
   * Cleanup expired sessions (should be called periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    // Redis automatically expires keys based on TTL, so this is mainly for logging
    this.logger.log('Expired sessions cleaned up by Redis TTL');
    return 0;
  }

  /**
   * Private helper methods
   */

  private getSessionKey(sessionId: string): string {
    return `${this.SESSION_PREFIX}${sessionId}`;
  }

  private serializeSession(
    session: ChunkUploadSession
  ): Record<string, unknown> {
    return {
      id: session.id,
      userId: session.userId,
      fileName: session.fileName,
      fileSize: session.fileSize,
      contentType: session.contentType,
      fileType: session.fileType,
      category: session.category,
      ossKey: session.ossKey,
      totalChunks: session.totalChunks,
      uploadedChunks: Array.from(session.uploadedChunks),
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      metadata: session.metadata,
    };
  }

  private deserializeSession(
    data: Record<string, unknown>
  ): ChunkUploadSession {
    return {
      id: data.id as string,
      userId: data.userId as string,
      fileName: data.fileName as string,
      fileSize: data.fileSize as number,
      contentType: data.contentType as string,
      fileType: data.fileType as FileType,
      category: data.category as string,
      ossKey: data.ossKey as string,
      totalChunks: data.totalChunks as number,
      uploadedChunks: new Set(data.uploadedChunks as number[]),
      status: data.status as ChunkUploadSession['status'],
      createdAt: new Date(data.createdAt as string),
      expiresAt: new Date(data.expiresAt as string),
      metadata: data.metadata as Record<string, unknown>,
    };
  }
}
