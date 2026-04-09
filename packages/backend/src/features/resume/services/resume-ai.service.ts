/**
 * Resume AI Service
 * Handles AI-powered resume operations using skills (resume-analyzer, resume-writer).
 * Extracted from AIEngine to keep AI module generic.
 */

import { AIService } from '@/core/ai';
import { ParsedResumeData, OptimizationSuggestion } from '@/types';
import { SuggestionStatus, SuggestionType } from '@/types/ai';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ResumeAIService {
  private readonly logger = new Logger(ResumeAIService.name);
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 1000;

  constructor(private readonly aiService: AIService) {}

  /**
   * Execute skill with retry logic and error handling
   */
  private async executeSkillWithRetry(
    skillName: string,
    inputs: Record<string, any>,
    userId: string,
    options?: { fallback?: () => Promise<any> }
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
          this.logger.warn(
            `Retry ${attempt}/${this.maxRetries} for skill "${skillName}" after ${delay}ms`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await this.aiService.executeSkill(skillName, inputs, userId);

        if (!result.success) {
          const errorCode = result.error?.code || 'UNKNOWN_ERROR';
          const errorMessage = result.error?.message || 'Skill execution failed';
          lastError = new Error(`[${errorCode}] ${errorMessage}`);

          if (this.isTransientError(errorCode) && attempt < this.maxRetries) {
            continue;
          }

          if (options?.fallback) {
            return options.fallback();
          }

          throw lastError;
        }

        if (!result.data) {
          if (options?.fallback && attempt < this.maxRetries) {
            continue;
          }

          if (options?.fallback) {
            return options.fallback();
          }
          throw new Error('Skill returned no data');
        }

        return result.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (this.isNetworkError(lastError) && attempt < this.maxRetries) {
          continue;
        }

        if (options?.fallback) {
          try {
            return await options.fallback();
          } catch (fallbackError) {
            this.logger.error(`Fallback also failed for skill "${skillName}":`, fallbackError);
            throw lastError;
          }
        }

        throw lastError;
      }
    }

    if (options?.fallback && lastError) {
      try {
        return await options.fallback();
      } catch (fallbackError) {
        this.logger.error(`Fallback also failed for skill "${skillName}":`, fallbackError);
        throw lastError;
      }
    }

    throw lastError || new Error('Skill execution failed');
  }

  private isTransientError(errorCode: string): boolean {
    return [
      'RATE_LIMIT_EXCEEDED',
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
      'PROVIDER_OVERLOADED',
    ].includes(errorCode);
  }

  private isNetworkError(error: Error): boolean {
    return [
      /network/i,
      /timeout/i,
      /ECONNREFUSED/i,
      /ECONNRESET/i,
      /ETIMEDOUT/i,
      /fetch failed/i,
      /socket hang up/i,
    ].some(pattern => pattern.test(error.message));
  }

  /**
   * Parse resume content using resume-analyzer skill
   */
  async parseResumeContent(
    content: string,
    userId: string
  ): Promise<ParsedResumeData> {
    this.logger.log('Parsing resume content via resume-analyzer skill');

    try {
      const data = await this.executeSkillWithRetry(
        'resume-analyzer',
        { resumeText: content },
        userId,
        {
          fallback: async () => {
            this.logger.warn('Using basic parsing as fallback for resume content');
            return this.basicParseResume(content);
          }
        }
      );

      return this.normalizeSkillResult(data);
    } catch (error) {
      this.logger.error('Error parsing resume via skill:', error);
      throw new Error(`Failed to parse resume content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse resume AND optimize in one flow using skills pipeline
   */
  async parseAndOptimizeResume(
    content: string,
    userId: string
  ): Promise<{ parsedData: ParsedResumeData; optimizedContent: string }> {
    this.logger.log('Parsing and optimizing resume via skills pipeline');

    let parsedData: ParsedResumeData;
    let optimizedContent: string | null = null;

    try {
      const parseResult = await this.executeSkillWithRetry(
        'resume-analyzer',
        { resumeText: content },
        userId
      );

      parsedData = this.normalizeSkillResult(parseResult);

      const writerResult = await this.executeSkillWithRetry(
        'resume-writer',
        {
          resumeData: JSON.stringify(parsedData),
          optimizationFocus: 'all',
          style: 'professional',
        },
        userId
      );

      if (writerResult) {
        optimizedContent =
          typeof writerResult === 'string'
            ? writerResult
            : JSON.stringify(writerResult, null, 2);
      }
    } catch (error) {
      this.logger.warn('Skills pipeline failed, falling back to parse-only:', error);

      try {
        const parseFallback = await this.executeSkillWithRetry(
          'resume-analyzer',
          { resumeText: content },
          userId,
          {
            fallback: async () => this.basicParseResume(content)
          }
        );
        parsedData = this.normalizeSkillResult(parseFallback);
      } catch (fallbackError) {
        this.logger.error('Both skills pipeline and fallback failed:', fallbackError);
        throw new Error(`Failed to parse and optimize resume: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }

    return { parsedData, optimizedContent: optimizedContent || '' };
  }

  /**
   * Analyze parsed resume data using resume-analyzer skill
   */
  async analyzeParsedResume(
    parsedData: ParsedResumeData,
    userId: string
  ): Promise<{
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    overallScore: number;
  }> {
    this.logger.log('Analyzing parsed resume data via resume-analyzer skill');

    try {
      const data = await this.executeSkillWithRetry(
        'resume-analyzer',
        { resumeText: JSON.stringify(parsedData) },
        userId,
        {
          fallback: async () => {
            this.logger.warn('Using basic analysis as fallback');
            return this.basicAnalyzeResume(parsedData);
          }
        }
      );

      const matchAnalysis = data?.matchAnalysis || {};

      return {
        strengths: matchAnalysis.strengths || [],
        weaknesses: matchAnalysis.gaps || [],
        suggestions: matchAnalysis.recommendations || [],
        overallScore: matchAnalysis.score ?? 0,
      };
    } catch (error) {
      this.logger.error('Error analyzing resume:', error);
      throw new Error(`Failed to analyze resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Optimize resume content using resume-writer skill
   */
  async optimizeResumeContent(
    content: string,
    userId: string
  ): Promise<string> {
    this.logger.log('Optimizing resume content via resume-writer skill');

    try {
      const data = await this.executeSkillWithRetry(
        'resume-writer',
        {
          resumeData: content,
          optimizationFocus: 'content',
          style: 'professional',
        },
        userId
      );

      return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    } catch (error) {
      this.logger.error('Error optimizing resume content:', error);
      throw new Error(`Failed to optimize resume content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate JD-based optimization suggestions using resume-writer skill
   */
  async generateOptimizationSuggestions(
    resumeContent: string,
    jobDescription: string,
    userId: string
  ): Promise<OptimizationSuggestion[]> {
    this.logger.log('Generating JD-based optimization suggestions via resume-writer skill');

    try {
      const data = await this.executeSkillWithRetry(
        'resume-writer',
        {
          resumeData: resumeContent,
          targetJob: jobDescription,
          optimizationFocus: 'all',
          style: 'professional',
        },
        userId,
        {
          fallback: async () => {
            this.logger.warn('Using basic JD-based suggestions as fallback');
            return this.generateBasicJDSuggestions();
          }
        }
      );

      const optimizations = data?.optimizations || [];

      if (!Array.isArray(optimizations)) {
        return [];
      }

      return optimizations.map((opt: any, index: number) => ({
        id: `sug_${Date.now()}_${index}`,
        type:
          (SuggestionType as any)[(opt.type as string)?.toUpperCase()] ??
          SuggestionType.CONTENT,
        section: opt.section || 'general',
        itemIndex: opt.sectionIndex ?? 0,
        original: opt.before || opt.original || '',
        optimized: opt.after || opt.optimized || opt.suggestion || '',
        reason: opt.reason || '',
        status: SuggestionStatus.PENDING,
      }));
    } catch (error) {
      this.logger.error('Error generating optimization suggestions:', error);
      throw new Error(`Failed to generate optimization suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ---- Fallback methods ----

  private basicParseResume(content: string): ParsedResumeData {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    return {
      personalInfo: {
        name: lines[0] || '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        website: ''
      },
      summary: lines.slice(1, 3).join(' ') || '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: []
    };
  }

  private basicAnalyzeResume(parsedData: ParsedResumeData): any {
    const skills = parsedData.skills || [];
    const experienceCount = parsedData.experience?.length || 0;

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    if (skills.length >= 8) {
      strengths.push('Strong technical skill set');
    } else if (skills.length < 5) {
      weaknesses.push('Limited skill diversity');
      suggestions.push('Consider adding more relevant skills');
    }

    if (experienceCount >= 3) {
      strengths.push('Substantial work experience');
    } else if (experienceCount < 2) {
      weaknesses.push('Limited work history');
      suggestions.push('Add more detailed experience entries');
    }

    if (!parsedData.summary || parsedData.summary.length < 50) {
      weaknesses.push('Weak or missing professional summary');
      suggestions.push('Write a compelling professional summary (50-200 characters)');
    }

    const score = Math.min(100, (strengths.length * 20) + (skills.length * 2) + (experienceCount * 10));

    return {
      matchAnalysis: { strengths, weaknesses, recommendations: suggestions, score }
    };
  }

  private generateBasicJDSuggestions(): OptimizationSuggestion[] {
    return [{
      id: `sug_${Date.now()}_jd_0`,
      type: SuggestionType.CONTENT,
      section: 'summary',
      itemIndex: 0,
      original: '',
      optimized: 'Tailor your summary to match the key requirements from the job description',
      reason: 'Align your professional summary with job requirements',
      status: SuggestionStatus.PENDING
    }];
  }

  private normalizeSkillResult(data: any): ParsedResumeData {
    // Parse JSON string if needed
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        // If parsing fails, wrap as basic parse result
        return this.basicParseResume(data);
      }
    }

    const normalized: any = { ...data };

    // ── personalInfo ──
    if (!normalized.personalInfo || typeof normalized.personalInfo !== 'object') {
      normalized.personalInfo = {};
    }
    normalized.personalInfo = {
      name: normalized.personalInfo.name || '',
      email: normalized.personalInfo.email || '',
      phone: normalized.personalInfo.phone || '',
      location: normalized.personalInfo.location || '',
      linkedin: normalized.personalInfo.linkedin || '',
      github: normalized.personalInfo.github || '',
      website: normalized.personalInfo.website || '',
    };

    // ── summary ──
    if (!normalized.summary) {
      normalized.summary = '';
    }

    // ── skills ── Flatten categorized skills object into string array
    if (normalized.skills && typeof normalized.skills === 'object' && !Array.isArray(normalized.skills)) {
      const skillsObj = normalized.skills;
      normalized.skills = [
        ...(skillsObj.technical || []),
        ...(skillsObj.soft || []),
        ...(skillsObj.languages || []),
        ...(skillsObj.tools || []),
      ];
    }
    if (!Array.isArray(normalized.skills)) {
      normalized.skills = [];
    }

    // ── experience ── Normalize field names
    if (normalized.experience && Array.isArray(normalized.experience)) {
      normalized.experience = normalized.experience.map((exp: any) => {
        // Determine endDate: explicit endDate > "至今"/"current" → undefined > fallback
        let endDate: string | undefined;
        if (exp.endDate) {
          endDate = exp.endDate;
        } else if (exp.current === true || exp.endDate === '至今' || exp.endDate === 'present') {
          endDate = undefined;
        } else {
          endDate = '';
        }

        // Normalize description: responsibilities → description
        let description: string[] = [];
        if (Array.isArray(exp.description)) {
          description = exp.description;
        } else if (Array.isArray(exp.responsibilities)) {
          description = exp.responsibilities;
        } else if (typeof exp.description === 'string') {
          description = [exp.description];
        }

        return {
          company: exp.company || '',
          position: exp.position || exp.title || '',
          startDate: exp.startDate || exp.dates || '',
          endDate,
          location: exp.location || '',
          description,
          achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
        };
      });
    } else {
      normalized.experience = [];
    }

    // ── education ── Normalize field names (year → startDate/endDate)
    if (normalized.education && Array.isArray(normalized.education)) {
      normalized.education = normalized.education.map((edu: any) => ({
        institution: edu.institution || '',
        degree: edu.degree || '',
        field: edu.field || edu.major || '',
        startDate: edu.startDate || edu.year || edu.graduationYear || '',
        endDate: edu.endDate || '',
        gpa: edu.gpa || '',
        achievements: Array.isArray(edu.achievements) ? edu.achievements : [],
      }));
    } else {
      normalized.education = [];
    }

    // ── projects ──
    if (normalized.projects && Array.isArray(normalized.projects)) {
      normalized.projects = normalized.projects.map((proj: any) => ({
        name: proj.name || '',
        description: proj.description || '',
        technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
        startDate: proj.startDate || '',
        endDate: proj.endDate || '',
        url: proj.url || '',
        highlights: Array.isArray(proj.highlights) ? proj.highlights :
                    Array.isArray(proj.achievements) ? proj.achievements : [],
      }));
    } else {
      normalized.projects = [];
    }

    // ── certifications ── Support both string[] and object[]
    if (normalized.certifications && Array.isArray(normalized.certifications)) {
      normalized.certifications = normalized.certifications.map((cert: any) => {
        if (typeof cert === 'string') {
          return { name: cert, issuer: '', date: '', expiryDate: '', credentialId: '' };
        }
        return {
          name: cert.name || '',
          issuer: cert.issuer || cert.organization || '',
          date: cert.date || '',
          expiryDate: cert.expiryDate || '',
          credentialId: cert.credentialId || '',
        };
      });
    } else {
      normalized.certifications = [];
    }

    // ── languages ──
    if (normalized.languages && Array.isArray(normalized.languages)) {
      normalized.languages = normalized.languages.map((lang: any) => {
        if (typeof lang === 'string') {
          return { name: lang, proficiency: '' };
        }
        return {
          name: lang.name || '',
          proficiency: lang.proficiency || lang.level || '',
        };
      });
    } else {
      normalized.languages = [];
    }

    // Remove matchAnalysis and other extra fields not in ParsedResumeData
    delete normalized.matchAnalysis;

    return normalized as ParsedResumeData;
  }
}
