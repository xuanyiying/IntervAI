/**
 * Skill Registry
 * Central registry for managing skills
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  Skill,
  SkillDefinition,
  SkillSource,
  SkillStats,
  SkillContext,
  SkillResult,
} from './skill.interface';

@Injectable()
export class SkillRegistry {
  private readonly logger = new Logger(SkillRegistry.name);
  private skills: Map<string, Skill> = new Map();
  private stats: Map<string, SkillStats> = new Map();

  /**
   * Register a skill
   */
  register(skill: Skill): void {
    if (this.skills.has(skill.definition.name)) {
      this.logger.warn(
        `Skill "${skill.definition.name}" already registered, overwriting`
      );
    }

    this.skills.set(skill.definition.name, skill);
    this.stats.set(skill.definition.name, {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageDuration: 0,
      averageTokens: 0,
    });

    this.logger.log(`Registered skill: ${skill.definition.name} v${skill.definition.version}`);
  }

  /**
   * Unregister a skill
   */
  unregister(name: string): boolean {
    if (!this.skills.has(name)) {
      return false;
    }

    this.skills.delete(name);
    this.stats.delete(name);
    this.logger.log(`Unregistered skill: ${name}`);
    return true;
  }

  /**
   * Get a skill by name
   */
  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /**
   * Check if a skill exists
   */
  has(name: string): boolean {
    return this.skills.has(name);
  }

  /**
   * Get all skill names
   */
  getNames(): string[] {
    return Array.from(this.skills.keys());
  }

  /**
   * Get all skills
   */
  getAll(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get all skill definitions
   */
  getDefinitions(): SkillDefinition[] {
    return this.getAll().map((s) => s.definition);
  }

  /**
   * Get skill statistics
   */
  getStats(name: string): SkillStats | undefined {
    return this.stats.get(name);
  }

  /**
   * Execute a skill
   */
  async execute(name: string, ctx: SkillContext): Promise<SkillResult> {
    const skill = this.skills.get(name);
    if (!skill) {
      return {
        success: false,
        error: {
          code: 'SKILL_NOT_FOUND',
          message: `Skill "${name}" not found`,
        },
        metadata: {
          skillName: name,
          duration: 0,
        },
      };
    }

    const startTime = Date.now();
    const stats = this.stats.get(name)!;

    try {
      // Validate inputs
      const validation = skill.validateInputs(ctx.inputs);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUTS',
            message: 'Invalid inputs',
            details: validation.errors,
          },
          metadata: {
            skillName: name,
            duration: Date.now() - startTime,
          },
        };
      }

      // Execute skill
      const result = await skill.execute(ctx);
      const duration = Date.now() - startTime;

      // Update stats
      stats.totalExecutions++;
      stats.successfulExecutions++;
      stats.averageDuration =
        (stats.averageDuration * (stats.totalExecutions - 1) + duration) /
        stats.totalExecutions;
      stats.lastExecutedAt = new Date();

      return {
        success: true,
        data: result,
        metadata: {
          skillName: name,
          duration,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Update stats
      stats.totalExecutions++;
      stats.failedExecutions++;

      this.logger.error(
        `Skill "${name}" execution failed: ${error instanceof Error ? error.message : String(error)}`
      );

      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
        metadata: {
          skillName: name,
          duration,
        },
      };
    }
  }

  /**
   * Clear all skills
   */
  clear(): void {
    this.skills.clear();
    this.stats.clear();
    this.logger.log('Cleared all skills from registry');
  }
}
