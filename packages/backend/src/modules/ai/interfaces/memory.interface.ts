/**
 * Memory Interface
 * Abstract interface for conversation memory
 */

/**
 * Memory entry
 */
export interface MemoryEntry {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Memory interface
 */
export interface Memory {
  /**
   * Add a message to memory
   */
  add(message: MemoryEntry): Promise<void>;

  /**
   * Get all messages
   */
  getAll(): Promise<MemoryEntry[]>;

  /**
   * Get last N messages
   */
  getLast(n: number): Promise<MemoryEntry[]>;

  /**
   * Clear all messages
   */
  clear(): Promise<void>;

  /**
   * Get memory size
   */
  size(): Promise<number>;
}

/**
 * Memory provider interface
 */
export interface MemoryProvider {
  /**
   * Create a memory instance for a given key
   */
  create(key: string): Memory;

  /**
   * Clear all memory for a given key
   */
  clear(key: string): Promise<void>;
}
