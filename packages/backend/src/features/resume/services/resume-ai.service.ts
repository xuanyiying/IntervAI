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

          if (this.isTransientError(errorCode) && attempt < this.maxRetries - 1) {
            continue;
          }

          if (options?.fallback) {
            return options.fallback();
          }

          throw lastError;
        }

        if (!result.data) {
          if (options?.fallback && attempt < this.maxRetries - 1) {
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

        if (this.isNetworkError(lastError) && attempt < this.maxRetries - 1) {
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
   * Parse resume AND optimize in one flow using skills pipeline.
   * Optimization runs in parallel with saving parsedData —
   * the caller gets parsedData immediately and optimizedContent is
   * appended asynchronously via a separate optimization step.
   */
  async parseAndOptimizeResume(
    content: string,
    userId: string
  ): Promise<{ parsedData: ParsedResumeData; optimizedContent: string }> {
    this.logger.log('Parsing and optimizing resume via skills pipeline');

    let parsedData: ParsedResumeData;

    // Step 1: Parse (must complete before anything else)
    try {
      const parseResult = await this.executeSkillWithRetry(
        'resume-analyzer',
        { resumeText: content },
        userId
      );

      parsedData = this.normalizeSkillResult(parseResult);
    } catch (error) {
      this.logger.warn('Resume parsing failed, falling back to basic parse:', error);
      parsedData = this.basicParseResume(content);
    }

    // Step 2: Optimize (non-blocking — if it fails, we still have parsedData)
    let optimizedContent = '';
    try {
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
      this.logger.warn('Resume optimization failed, continuing with parsed data only:', error);
    }

    return { parsedData, optimizedContent };
  }

  /**
   * Analyze parsed resume data using local rule-based scoring.
   * No AI call needed — the parsed data already has all structured info.
   */
  analyzeParsedResume(
    parsedData: ParsedResumeData,
    _userId: string
  ): {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    overallScore: number;
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // ── Summary ──
    if (parsedData.summary && parsedData.summary.length >= 50) {
      strengths.push('Professional summary is present and substantive');
      score += 15;
    } else {
      weaknesses.push('Professional summary is missing or too brief');
      suggestions.push('Add a compelling professional summary (50-200 characters) that highlights your core value');
    }

    // ── Skills ──
    const skills = parsedData.skills || [];
    if (skills.length >= 8) {
      strengths.push(`Strong technical skill set with ${skills.length} skills listed`);
      score += 15;
    } else if (skills.length >= 4) {
      score += 8;
      suggestions.push('Consider adding more relevant skills to strengthen your profile');
    } else {
      weaknesses.push('Limited skill diversity — few skills listed');
      suggestions.push('Add relevant technical and soft skills that match your target roles');
    }

    // ── Experience ──
    const experience = parsedData.experience || [];
    if (experience.length >= 3) {
      strengths.push(`Substantial work experience with ${experience.length} positions`);
      score += 15;
    } else if (experience.length >= 1) {
      score += 8;
      suggestions.push('Consider adding more work experience entries if available');
    } else {
      weaknesses.push('No work experience listed');
      suggestions.push('Add internships, part-time roles, or volunteer experience');
    }

    // Check for quantified achievements in experience
    const hasQuantifiedAchievements = experience.some(exp =>
      (exp.achievements || []).some(a => /\d+%|\d+x|\$\d|\d+ (users|customers|projects|team)/i.test(a))
    );
    if (hasQuantifiedAchievements) {
      strengths.push('Experience includes quantified achievements and metrics');
      score += 10;
    } else {
      weaknesses.push('Work experience lacks quantified achievements');
      suggestions.push('Add specific numbers and metrics to your achievements (e.g., "increased revenue by 30%")');
    }

    // ── Education ──
    const education = parsedData.education || [];
    if (education.length > 0) {
      score += 10;
      if (education.some(e => /硕士|master|phd|博士/i.test(e.degree))) {
        strengths.push('Advanced degree strengthens academic credentials');
        score += 5;
      }
    } else {
      weaknesses.push('No education information provided');
      suggestions.push('Add your educational background');
    }

    // ── Projects ──
    const projects = parsedData.projects || [];
    if (projects.length >= 2) {
      strengths.push(`${projects.length} project entries demonstrate hands-on experience`);
      score += 10;
    } else if (projects.length >= 1) {
      score += 5;
      suggestions.push('Adding more project examples can showcase a broader skill set');
    } else {
      weaknesses.push('No project experience listed');
      suggestions.push('Add personal or professional projects to demonstrate practical skills');
    }

    // ── Personal Info completeness ──
    const pi = parsedData.personalInfo || {} as any;
    const contactFields = [pi.email, pi.phone, pi.location].filter(Boolean).length;
    if (contactFields >= 3) {
      score += 10;
    } else {
      weaknesses.push('Contact information is incomplete');
      suggestions.push('Ensure email, phone, and location are all provided');
    }

    // ── Certifications ──
    if (parsedData.certifications && parsedData.certifications.length > 0) {
      strengths.push(`${parsedData.certifications.length} certification(s) add professional credibility`);
      score += 5;
    }

    // ── contextSummary / markdown (new fields) ──
    if (parsedData.contextSummary) {
      score += 5;
    }

    // Cap score
    score = Math.min(100, score);

    return { strengths, weaknesses, suggestions, overallScore: score };
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
