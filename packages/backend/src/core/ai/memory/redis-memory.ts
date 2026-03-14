/**
 * Redis Memory Implementation
 * Persistent conversation memory using Redis
 */

import { Memory, MemoryEntry, MemoryProvider } from './memory.interface';

// Re-export interfaces for convenience
export { Memory, MemoryEntry, MemoryProvider };

/**
 * Redis client interface (subset of ioredis)
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: any[]): Promise<void>;
  del(key: string): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  lpush(key: string, ...values: string[]): Promise<number>;
  ltrim(key: string, start: number, stop: number): Promise<void>;
  llen(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

/**
 * Redis Memory implementation
 */
export class RedisMemory implements Memory {
  private readonly key: string;
  private readonly redis: RedisClient;
  private readonly ttl: number; // Time to live in seconds

  constructor(redis: RedisClient, key: string, ttl: number = 3600) {
    this.redis = redis;
    this.key = key;
    this.ttl = ttl;
  }

  async add(message: MemoryEntry): Promise<void> {
    const entry = JSON.stringify({
      ...message,
      timestamp: message.timestamp || new Date(),
    });

    await this.redis.lpush(this.key, entry);
    await this.redis.expire(this.key, this.ttl);
  }

  async getAll(): Promise<MemoryEntry[]> {
    const entries = await this.redis.lrange(this.key, 0, -1);
    return entries.map(e => JSON.parse(e)).reverse();
  }

  async getLast(n: number): Promise<MemoryEntry[]> {
    const entries = await this.redis.lrange(this.key, 0, n - 1);
    return entries.map(e => JSON.parse(e)).reverse();
  }

  async clear(): Promise<void> {
    await this.redis.del(this.key);
  }

  async size(): Promise<number> {
    return this.redis.llen(this.key);
  }
}

/**
 * Redis Memory Provider
 */
export class RedisMemoryProvider implements MemoryProvider {
  private readonly redis: RedisClient;
  private readonly ttl: number;
  private readonly prefix: string;

  constructor(redis: RedisClient, options?: { ttl?: number; prefix?: string }) {
    this.redis = redis;
    this.ttl = options?.ttl || 3600;
    this.prefix = options?.prefix || 'ai:memory:';
  }

  create(key: string): Memory {
    return new RedisMemory(this.redis, `${this.prefix}${key}`, this.ttl);
  }

  async clear(key: string): Promise<void> {
    await this.redis.del(`${this.prefix}${key}`);
  }
}

/**
 * In-memory fallback implementation
 * Used when Redis is not available
 */
export class InMemoryMemory implements Memory {
  private entries: MemoryEntry[] = [];

  async add(message: MemoryEntry): Promise<void> {
    this.entries.push({
      ...message,
      timestamp: message.timestamp || new Date(),
    });
  }

  async getAll(): Promise<MemoryEntry[]> {
    return [...this.entries];
  }

  async getLast(n: number): Promise<MemoryEntry[]> {
    return this.entries.slice(-n);
  }

  async clear(): Promise<void> {
    this.entries = [];
  }

  async size(): Promise<number> {
    return this.entries.length;
  }
}

/**
 * In-memory Memory Provider
 */
export class InMemoryMemoryProvider implements MemoryProvider {
  private memories: Map<string, InMemoryMemory> = new Map();

  create(key: string): Memory {
    if (!this.memories.has(key)) {
      this.memories.set(key, new InMemoryMemory());
    }
    return this.memories.get(key)!;
  }

  async clear(key: string): Promise<void> {
    this.memories.delete(key);
  }
}
