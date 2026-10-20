/**
 * Skill Loader
 * Loads skills from files, directories, and packages
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SkillMarkdownParser } from './skill-markdown-parser';
import { SkillRegistry } from './skill-registry';
import {
  Skill,
  SkillDefinition,
  SkillPackageManifest,
  SkillSource,
} from './skill.interface';

/**
 * Skill loader configuration
 */
export interface SkillLoaderConfig {
  skillsDir: string;
  builtinSkillsDir: string;
  enableRemoteSkills: boolean;
  cacheSkills: boolean;
}

/**
 * Loaded skill info
 */
export interface LoadedSkillInfo {
  name: string;
  source: SkillSource;
  definition: SkillDefinition;
}

@Injectable()
export class SkillLoader {
  private readonly logger = new Logger(SkillLoader.name);
  private readonly config: SkillLoaderConfig;
  private loadedSkills: Map<string, LoadedSkillInfo> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly registry: SkillRegistry,
    private readonly markdownParser: SkillMarkdownParser
  ) {
    this.config = {
      skillsDir: this.configService.get('SKILLS_DIR', 'skills'),
      builtinSkillsDir: this.configService.get(
        'BUILTIN_SKILLS_DIR',
        'skills/builtin'
      ),
      enableRemoteSkills:
        this.configService.get('ENABLE_REMOTE_SKILLS', 'true') === 'true',
      cacheSkills: this.configService.get('CACHE_SKILLS', 'true') === 'true',
    };
  }

  /**
   * Initialize and load all skills
   */
  async initialize(): Promise<void> {
    this.logger.log('Initializing skill loader...');

    // Load builtin skills
    await this.loadBuiltinSkills();

    // Load user skills
    await this.loadSkillsFromDirectory(this.config.skillsDir);

    this.logger.log(
      `Skill loader initialized. Loaded ${this.loadedSkills.size} skills`
    );
  }

  /**
   * Load builtin skills
   */
  async loadBuiltinSkills(): Promise<LoadedSkillInfo[]> {
    const builtinPath = this.resolvePath(this.config.builtinSkillsDir);

    try {
      await fs.access(builtinPath);
    } catch {
      this.logger.debug(`Builtin skills directory not found: ${builtinPath}`);
      return [];
    }

    return this.loadSkillsFromDirectory(builtinPath, 'builtin');
  }

  /**
   * Load skills from a directory
   */
  async loadSkillsFromDirectory(
    dirPath: string,
    sourceType: SkillSource['type'] = 'file'
  ): Promise<LoadedSkillInfo[]> {
    const resolvedPath = this.resolvePath(dirPath);
    const loaded: LoadedSkillInfo[] = [];

    try {
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Check for skill.md or skill.yaml in directory
          const skillDir = path.join(resolvedPath, entry.name);
          const skillInfo = await this.loadSkillFromDirectory(
            skillDir,
            sourceType
          );

          if (skillInfo) {
            loaded.push(skillInfo);
            this.registerSkill(skillInfo);
          }
        } else if (entry.isFile()) {
          // Check for .md or .yaml files
          if (entry.name.endsWith('.md') || entry.name.endsWith('.skill.md')) {
            const skillInfo = await this.loadSkillFromFile(
              path.join(resolvedPath, entry.name),
              sourceType
            );

            if (skillInfo) {
              loaded.push(skillInfo);
              this.registerSkill(skillInfo);
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn(
        `Failed to load skills from ${resolvedPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return loaded;
  }

  /**
   * Load a skill from a directory
   */
  async loadSkillFromDirectory(
    dirPath: string,
    sourceType: SkillSource['type']
  ): Promise<LoadedSkillInfo | null> {
    // Try skill.md first, then skill.yaml
    const mdPath = path.join(dirPath, 'skill.md');
    const yamlPath = path.join(dirPath, 'skill.yaml');

    try {
      await fs.access(mdPath);
      return this.loadSkillFromFile(mdPath, sourceType);
    } catch {
      // Try yaml
    }

    try {
      await fs.access(yamlPath);
      return this.loadSkillFromYaml(yamlPath, sourceType);
    } catch {
      this.logger.debug(`No skill definition found in ${dirPath}`);
      return null;
    }
  }

  /**
   * Load a skill from a Markdown file
   */
  async loadSkillFromFile(
    filePath: string,
    sourceType: SkillSource['type']
  ): Promise<LoadedSkillInfo | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const definition = this.markdownParser.parse(content);

      if (!definition) {
        this.logger.warn(`Failed to parse skill from ${filePath}`);
        return null;
      }

      const source: SkillSource = {
        type: sourceType,
        path: filePath,
        loadedAt: new Date(),
      };

      const info: LoadedSkillInfo = {
        name: definition.name,
        source,
        definition,
      };

      this.loadedSkills.set(definition.name, info);
      this.logger.debug(`Loaded skill from file: ${filePath}`);

      return info;
    } catch (error) {
      this.logger.error(
        `Failed to load skill from ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  /**
   * Load a skill from YAML file
   */
  async loadSkillFromYaml(
    filePath: string,
    _sourceType: SkillSource['type']
  ): Promise<LoadedSkillInfo | null> {
    // YAML parsing would be implemented here
    // For now, we focus on Markdown
    this.logger.debug(`YAML loading not implemented: ${filePath}`);
    return null;
  }

  /**
   * Load a skill from a package
   */
  async loadSkillFromPackage(packagePath: string): Promise<LoadedSkillInfo[]> {
    const manifestPath = path.join(packagePath, 'skill-package.json');

    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest: SkillPackageManifest = JSON.parse(manifestContent);

      const loaded: LoadedSkillInfo[] = [];

      for (const skillFile of manifest.skills) {
        const skillPath = path.join(packagePath, skillFile);
        const skillInfo = await this.loadSkillFromFile(skillPath, 'package');

        if (skillInfo) {
          loaded.push(skillInfo);
        }
      }

      return loaded;
    } catch (error) {
      this.logger.error(
        `Failed to load skill package from ${packagePath}: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  /**
   * Register a loaded skill
   */
  private registerSkill(info: LoadedSkillInfo): void {
    const skill: Skill = {
      definition: info.definition,
      source: info.source,
      execute: this.createExecutor(info.definition),
      validateInputs: this.createValidator(info.definition),
    };

    this.registry.register(skill);
  }

  /**
   * Create an executor function for the skill
   */
  private createExecutor(
    definition: SkillDefinition
  ): (ctx: any) => Promise<any> {
    return async (ctx: any) => {
      // If custom execute function is provided
      if (typeof definition.execute === 'function') {
        return definition.execute(ctx);
      }

      // Default: use prompt-based execution
      if (definition.prompt) {
        return this.executeWithPrompt(ctx, definition);
      }

      throw new Error(
        `Skill "${definition.name}" has no execute function or prompt defined`
      );
    };
  }

  /**
   * Execute skill using prompt
   */
  private async executeWithPrompt(
    ctx: any,
    definition: SkillDefinition
  ): Promise<any> {
    const { ai, inputs } = ctx;

    // Process {{#if key}}...{{/if}} conditional blocks first, so placeholders
    // inside removed blocks are stripped before value substitution.
    let prompt = this.processConditionals(definition.prompt || '', inputs);

    // Replace input placeholders
    for (const [key, value] of Object.entries(inputs)) {
      prompt = prompt.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        this.formatInputValue(value)
      );
    }

    // Determine response format
    const hasJsonOutput =
      definition.outputs?.type === 'object' ||
      definition.outputs?.type === 'array';

    const result = await ai.chat(
      ctx.model || ai.getModel(),
      [{ role: 'user', content: prompt }],
      {
        // Structured skill outputs (e.g. resume parsing) can be large —
        // a too-small cap truncates the JSON and makes it unparseable.
        maxTokens: definition.maxTokens ?? 8000,
        responseFormat: hasJsonOutput ? { type: 'json_object' } : undefined,
        userId: ctx.userId,
      }
    );

    // Parse JSON if needed
    if (hasJsonOutput) {
      try {
        return this.parseJsonLoose(result.content);
      } catch {
        return { raw: result.content };
      }
    }

    return result.content;
  }

  /**
   * Process {{#if key}}...{{/if}} conditional blocks: keep the inner content
   * only when the corresponding input is present and non-empty.
   */
  private processConditionals(
    prompt: string,
    inputs: Record<string, any>
  ): string {
    const blockRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    let result = prompt;
    let previous: string;

    // Iterate to resolve nested conditional blocks (innermost first)
    do {
      previous = result;
      result = result.replace(
        blockRegex,
        (_match, key: string, body: string) =>
          this.isTruthyInput(inputs[key]) ? body : ''
      );
    } while (result !== previous);

    return result;
  }

  /**
   * Check whether an input value is present enough to include its block
   */
  private isTruthyInput(value: any): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }

  /**
   * Format an input value for prompt substitution.
   * Objects/arrays are serialized as JSON instead of "[object Object]".
   */
  private formatInputValue(value: any): string {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  /**
   * Parse JSON that may be wrapped in markdown fences or surrounded by
   * extra prose (some models ignore response_format).
   */
  private parseJsonLoose(content: string): any {
    const trimmed = (content || '').trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      // Strip ```json ... ``` fences if present
      const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch?.[1]) {
        return JSON.parse(fenceMatch[1].trim());
      }
      // Fallback: parse from first { to last }
      const start = trimmed.indexOf('{');
      const end = trimmed.lastIndexOf('}');
      if (start !== -1 && end > start) {
        return JSON.parse(trimmed.slice(start, end + 1));
      }
      throw new Error('No valid JSON found in response');
    }
  }

  /**
   * Create a validator function for the skill
   */
  private createValidator(
    definition: SkillDefinition
  ): (inputs: any) => { valid: boolean; errors: string[] } {
    return (inputs: Record<string, any>) => {
      const errors: string[] = [];

      for (const [key, inputDef] of Object.entries(definition.inputs)) {
        const value = inputs[key];

        // Check required
        if (inputDef.required && (value === undefined || value === null)) {
          errors.push(`Missing required input: ${key}`);
          continue;
        }

        // Skip validation if not provided and has default
        if (value === undefined && inputDef.default !== undefined) {
          continue;
        }

        // Type validation
        if (value !== undefined) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== inputDef.type) {
            errors.push(
              `Input "${key}" must be of type ${inputDef.type}, got ${actualType}`
            );
          }
        }

        // Enum validation
        if (inputDef.enum && value !== undefined) {
          if (!inputDef.enum.includes(value)) {
            errors.push(
              `Input "${key}" must be one of: ${inputDef.enum.join(', ')}`
            );
          }
        }

        // Min/max validation for numbers
        if (inputDef.type === 'number' && typeof value === 'number') {
          if (inputDef.min !== undefined && value < inputDef.min) {
            errors.push(`Input "${key}" must be >= ${inputDef.min}`);
          }
          if (inputDef.max !== undefined && value > inputDef.max) {
            errors.push(`Input "${key}" must be <= ${inputDef.max}`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    };
  }

  /**
   * Resolve path (relative or absolute)
   */
  private resolvePath(p: string): string {
    if (path.isAbsolute(p)) {
      return p;
    }

    // Try relative to cwd
    return path.resolve(process.cwd(), p);
  }

  /**
   * Get loaded skill info
   */
  getLoadedSkill(name: string): LoadedSkillInfo | undefined {
    return this.loadedSkills.get(name);
  }

  /**
   * Get all loaded skills
   */
  getLoadedSkills(): LoadedSkillInfo[] {
    return Array.from(this.loadedSkills.values());
  }

  /**
   * Reload a skill
   */
  async reloadSkill(name: string): Promise<boolean> {
    const info = this.loadedSkills.get(name);
    if (!info || !info.source.path) {
      return false;
    }

    // Unregister old skill
    this.registry.unregister(name);

    // Reload from file
    const newInfo = await this.loadSkillFromFile(
      info.source.path,
      info.source.type
    );

    if (newInfo) {
      this.registerSkill(newInfo);
      return true;
    }

    return false;
  }

  /**
   * Unload a skill
   */
  unloadSkill(name: string): boolean {
    const info = this.loadedSkills.get(name);
    if (!info) {
      return false;
    }

    this.loadedSkills.delete(name);
    this.registry.unregister(name);
    return true;
  }
}
