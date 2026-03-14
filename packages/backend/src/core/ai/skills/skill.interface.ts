/**
 * Skill Interface
 * Core interfaces for the skill system
 */

import { AIService } from '../ai.service';

/**
 * Skill execution context
 */
export interface SkillContext {
  ai: AIService;
  inputs: Record<string, any>;
  userId: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Skill definition
 */
export interface SkillDefinition {
  name: string;
  version: string;
  description: string;
  author?: string;
  tags: string[];
  inputs: SkillInputDefinition;
  outputs?: SkillOutputDefinition;
  prompt?: string;
  promptFile?: string;
  execute?: string | ((ctx: SkillContext) => Promise<any>);
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    backoffMs: number;
  };
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
}

/**
 * Input parameter definition
 */
export interface SkillInputDefinition {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description?: string;
    default?: any;
    enum?: string[];
    min?: number;
    max?: number;
  };
}

/**
 * Output definition
 */
export interface SkillOutputDefinition {
  type: 'string' | 'object' | 'array';
  schema?: Record<string, any>;
  description?: string;
}

/**
 * Runtime skill instance
 */
export interface Skill {
  definition: SkillDefinition;
  execute: (ctx: SkillContext) => Promise<any>;
  validateInputs: (inputs: Record<string, any>) => { valid: boolean; errors: string[] };
  source: SkillSource;
}

/**
 * Skill source information
 */
export interface SkillSource {
  type: 'builtin' | 'file' | 'package' | 'remote';
  path?: string;
  url?: string;
  loadedAt: Date;
  checksum?: string;
}

/**
 * Skill package manifest
 */
export interface SkillPackageManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  main: string;
  skills: string[];
  dependencies?: Record<string, string>;
  repository?: string;
  keywords?: string[];
}

/**
 * Skill execution result
 */
export interface SkillResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    skillName: string;
    duration: number;
    tokensUsed?: number;
    modelUsed?: string;
  };
}

/**
 * Skill statistics
 */
export interface SkillStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  averageTokens: number;
  lastExecutedAt?: Date;
}
