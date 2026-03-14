/**
 * Skill Markdown Parser
 * Parses skill definitions from Markdown files
 */

import { Injectable, Logger } from '@nestjs/common';
import { SkillDefinition, SkillInputDefinition } from './skill.interface';

/**
 * Parsed frontmatter
 */
interface FrontMatter {
    [key: string]: any;
}

/**
 * Skill Markdown Parser
 * Parses skill definitions from Markdown format
 *
 * Example skill.md format:
 * ---
 * name: resume-analyzer
 * version: 1.0.0
 * description: Parses resume and extracts structured information
 * tags: [resume, parsing, extraction]
 * inputs:
 *   resumeText:
 *     type: string
 *     required: true
 *     description: The resume text to analyze
 * outputs:
 *   type: object
 * ---
 *
 * # System Prompt
 *
 * You are an expert resume parser...
 *
 * ## Instructions
 *
 * 1. Extract the following information...
 */
@Injectable()
export class SkillMarkdownParser {
    private readonly logger = new Logger(SkillMarkdownParser.name);

    /**
     * Parse a Markdown skill file
     */
    parse(content: string): SkillDefinition | null {
        try {
            const { frontMatter, body } = this.parseFrontMatter(content);

            if (!frontMatter.name) {
                this.logger.warn('Skill missing required field: name');
                return null;
            }

            const definition: SkillDefinition = {
                name: frontMatter.name,
                version: frontMatter.version || '1.0.0',
                description: frontMatter.description || '',
                author: frontMatter.author,
                tags: this.parseArray(frontMatter.tags),
                inputs: this.parseInputs(frontMatter.inputs),
                outputs: frontMatter.outputs,
                prompt: this.extractPrompt(body),
                timeout: frontMatter.timeout,
                retryConfig: frontMatter.retryConfig,
                rateLimit: frontMatter.rateLimit,
            };

            return definition;
        } catch (error) {
            this.logger.error(
                `Failed to parse skill: ${error instanceof Error ? error.message : String(error)}`
            );
            return null;
        }
    }

    /**
     * Parse YAML frontmatter from content
     */
    private parseFrontMatter(content: string): { frontMatter: FrontMatter; body: string } {
        const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontMatterRegex);

        if (!match) {
            // No frontmatter, treat entire content as body
            return {
                frontMatter: {},
                body: content.trim(),
            };
        }

        const frontMatterText = match[1];
        const body = match[2].trim();

        // Simple YAML parsing (for basic key-value pairs)
        const frontMatter = this.parseSimpleYaml(frontMatterText);

        return { frontMatter, body };
    }

    /**
     * Simple YAML parser for frontmatter
     * Handles basic key-value pairs, arrays, and nested objects
     */
    private parseSimpleYaml(yaml: string): FrontMatter {
        const result: FrontMatter = {};
        const lines = yaml.split('\n');
        let currentKey = '';
        let currentArray: string[] | null = null;
        let currentObject: Record<string, any> | null = null;
        let objectKey = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip empty lines
            if (!trimmed) continue;

            // Check for array item
            if (trimmed.startsWith('- ')) {
                if (currentArray !== null) {
                    currentArray.push(trimmed.slice(2).trim());
                }
                continue;
            }

            // Check for nested object
            const indent = line.search(/\S/);
            if (indent > 0 && currentObject !== null) {
                const colonIndex = trimmed.indexOf(':');
                if (colonIndex > 0) {
                    const key = trimmed.slice(0, colonIndex).trim();
                    const value = trimmed.slice(colonIndex + 1).trim();

                    if (value) {
                        currentObject[key] = this.parseValue(value);
                    } else {
                        objectKey = key;
                        currentObject[key] = {};
                        currentObject = currentObject[key] as Record<string, any>;
                    }
                }
                continue;
            }

            // Reset nested context
            currentArray = null;
            currentObject = null;

            // Parse key-value pair
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex > 0) {
                currentKey = trimmed.slice(0, colonIndex).trim();
                const value = trimmed.slice(colonIndex + 1).trim();

                if (value) {
                    result[currentKey] = this.parseValue(value);
                } else {
                    // Check next line for array or object
                    const nextLine = lines[i + 1]?.trim();
                    if (nextLine?.startsWith('- ')) {
                        result[currentKey] = [];
                        currentArray = result[currentKey] as string[];
                    } else if (nextLine && !nextLine.startsWith('-') && nextLine.includes(':')) {
                        result[currentKey] = {};
                        currentObject = result[currentKey] as Record<string, any>;
                    }
                }
            }
        }

        return result;
    }

    /**
     * Parse a value string
     */
    private parseValue(value: string): any {
        // Boolean
        if (value === 'true') return true;
        if (value === 'false') return false;

        // Number
        if (/^\d+$/.test(value)) return parseInt(value, 10);
        if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

        // Array (simple format: [item1, item2])
        if (value.startsWith('[') && value.endsWith(']')) {
            return value
                .slice(1, -1)
                .split(',')
                .map((s) => s.trim().replace(/^["']|["']$/g, ''));
        }

        // String (remove quotes)
        return value.replace(/^["']|["']$/g, '');
    }

    /**
     * Parse inputs definition
     */
    private parseInputs(inputs: any): SkillInputDefinition {
        if (!inputs || typeof inputs !== 'object') {
            return {};
        }

        const result: SkillInputDefinition = {};

        for (const [key, value] of Object.entries(inputs)) {
            if (typeof value === 'object' && value !== null) {
                const inputDef = value as Record<string, any>;
                result[key] = {
                    type: inputDef.type || 'string',
                    required: inputDef.required !== false,
                    description: inputDef.description,
                    default: inputDef.default,
                    enum: inputDef.enum,
                    min: inputDef.min,
                    max: inputDef.max,
                };
            }
        }

        return result;
    }

    /**
     * Parse array value
     */
    private parseArray(value: any): string[] {
        if (Array.isArray(value)) {
            return value.map(String);
        }
        if (typeof value === 'string') {
            return value.split(',').map((s) => s.trim());
        }
        return [];
    }

    /**
     * Extract prompt from Markdown body
     */
    private extractPrompt(body: string): string {
        // Remove code blocks that are not part of the prompt
        let prompt = body;

        // Extract content after the first heading (typically the system prompt)
        const lines = prompt.split('\n');
        const promptLines: string[] = [];
        let inPrompt = false;

        for (const line of lines) {
            // Start capturing after first heading
            if (line.startsWith('# ') && !inPrompt) {
                inPrompt = true;
                promptLines.push(line.replace(/^#\s*/, '').trim());
                continue;
            }

            if (inPrompt) {
                promptLines.push(line);
            }
        }

        return promptLines.join('\n').trim();
    }

    /**
     * Validate a skill definition
     */
    validate(definition: SkillDefinition): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!definition.name) {
            errors.push('Skill name is required');
        } else if (!/^[a-z0-9-]+$/.test(definition.name)) {
            errors.push('Skill name must be lowercase alphanumeric with hyphens');
        }

        if (!definition.description) {
            errors.push('Skill description is required');
        }

        if (!definition.prompt && !definition.execute) {
            errors.push('Skill must have either a prompt or execute function');
        }

        // Validate inputs
        for (const [key, inputDef] of Object.entries(definition.inputs)) {
            if (!inputDef.type) {
                errors.push(`Input "${key}" must have a type`);
            }

            const validTypes = ['string', 'number', 'boolean', 'object', 'array'];
            if (!validTypes.includes(inputDef.type)) {
                errors.push(`Input "${key}" has invalid type: ${inputDef.type}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
