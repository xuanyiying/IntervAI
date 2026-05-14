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

  // ── Field alias mapping configuration ──
  // LLMs may return alternative field names; these maps normalize them.
  // When adding a new known alias, just append to the array.
  private static readonly SKILL_CATEGORIES = [
    'technical',
    'soft',
    'languages',
    'tools',
    'frameworks',
    'databases',
    'devops',
    'methodologies',
    'other',
  ] as const;

  private static readonly EXPERIENCE_ALIASES: Record<string, string[]> = {
    position: ['title', 'role', 'jobTitle'],
    startDate: ['dates', 'from', 'start'],
    description: ['responsibilities', 'duties', 'details'],
    achievements: ['highlights', 'accomplishments', 'results'],
  };

  private static readonly EDUCATION_ALIASES: Record<string, string[]> = {
    field: ['major', 'specialty', 'subject'],
    startDate: ['year', 'graduationYear', 'from'],
  };

  private static readonly CERT_ALIASES: Record<string, string[]> = {
    issuer: ['organization', 'authority', 'provider'],
  };

  private static readonly LANG_ALIASES: Record<string, string[]> = {
    proficiency: ['level', 'fluency', 'competency'],
  };

  private static readonly SUGGESTION_ALIASES: Record<string, string[]> = {
    original: ['before'],
    optimized: ['after', 'suggestion'],
    reason: ['explanation', 'why'],
    section: ['category'],
  };

  // Scoring rules for resume analysis — easy to tune without touching logic
  private static readonly SCORING = {
    summary: { present: 15, minLength: 50 },
    skills: {
      high: { threshold: 8, score: 15 },
      mid: { threshold: 4, score: 8 },
    },
    experience: {
      high: { threshold: 3, score: 15 },
      mid: { threshold: 1, score: 8 },
    },
    achievements: {
      quantified: 10,
      pattern: /\d+%|\d+x|\$\d|\d+ (users|customers|projects|team)/i,
    },
    education: {
      present: 10,
      advanced: 5,
      advancedPattern: /硕士|master|phd|博士/i,
    },
    projects: {
      high: { threshold: 2, score: 10 },
      mid: { threshold: 1, score: 5 },
    },
    contact: {
      complete: 10,
      requiredFields: ['email', 'phone', 'location'] as const,
    },
    certifications: { perItem: 5 },
    contextSummary: { present: 5 },
    maxScore: 100,
  } as const;

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
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const result = await this.aiService.executeSkill(
          skillName,
          inputs,
          userId
        );

        if (!result.success) {
          const errorCode = result.error?.code || 'UNKNOWN_ERROR';
          const errorMessage =
            result.error?.message || 'Skill execution failed';
          lastError = new Error(`[${errorCode}] ${errorMessage}`);

          if (
            this.isTransientError(errorCode) &&
            attempt < this.maxRetries - 1
          ) {
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
            this.logger.error(
              `Fallback also failed for skill "${skillName}":`,
              fallbackError
            );
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
        this.logger.error(
          `Fallback also failed for skill "${skillName}":`,
          fallbackError
        );
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
    ].some((pattern) => pattern.test(error.message));
  }

  // ── Smart extraction (post-processing correction) ──

  /**
   * Resolve a field value from an object, trying the primary key first,
   * then each alias in order. Returns the first truthy value found.
   */
  private resolveField(
    obj: Record<string, any>,
    primary: string,
    aliases: readonly string[]
  ): any {
    if (
      obj[primary] !== undefined &&
      obj[primary] !== null &&
      obj[primary] !== ''
    ) {
      return obj[primary];
    }
    for (const alias of aliases) {
      if (
        obj[alias] !== undefined &&
        obj[alias] !== null &&
        obj[alias] !== ''
      ) {
        return obj[alias];
      }
    }
    return obj[primary] ?? '';
  }

  /**
   * Correct personalInfo using our own LLM-generated contextSummary as source.
   * contextSummary has a predictable natural-language format like:
   * "张三是一名拥有8年经验的工程师... 联系电话：13800138000 邮箱：myid@163.com"
   * This is far more reliable than scanning raw text with brittle regexes.
   */
  private correctPersonalInfo(
    info: { name: string; email: string; phone: string; location: string },
    ctx: string
  ): typeof info | null {
    let changed = false;
    const result = { ...info };

    // Name: detect fake names (document titles, not real person names) and extract from context
    // A real name does NOT look like a document title:
    //   - Document titles are generic nouns like "简历"/"Resume"/"CV" (no personal identifiers)
    //   - Real names contain specific characters (CJK 2-4 chars, or Latin with capital first letter)
    if (!result.name || this.isDocumentTitle(result.name)) {
      const labeledMatch = ctx.match(/(?:姓名|名字|Name)\s*[:：]\s*(\S{2,20})/);
      if (labeledMatch?.[1] && !this.isDocumentTitle(labeledMatch[1])) {
        result.name = labeledMatch[1];
        changed = true;
      }
    }

    // Email
    if (!result.email) {
      const emailMatch = ctx.match(
        /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/
      );
      if (emailMatch?.[0]) {
        result.email = emailMatch[0];
        changed = true;
      }
    }

    // Phone — prefer labeled patterns, then standalone mobile numbers
    if (!result.phone) {
      const phonePatterns = [
        /(?:电话|手机|Tel|Phone|联系)[:：]?\s*([+\d][\d\s\-]{6,15})/,
        /\b(1[3-9]\d{9})\b/,
      ];
      for (const pat of phonePatterns) {
        const m = ctx.match(pat);
        if (m?.[1]) {
          result.phone = m[1].replace(/[\s\-]/g, '');
          changed = true;
          break;
        }
      }
    }

    return changed ? result : null;
  }

  /**
   * Detect whether a string looks like a document title rather than a person's name.
   * Generic heuristic: document titles are common nouns/phrases without personal identifiers.
   * Real names typically contain CJK characters (2-4) or Latin words with capital first letter.
   */
  private isDocumentTitle(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return true;

    // Short generic nouns that are never real names
    const genericTitles = [
      '简历',
      '个人简历',
      'Resume',
      'CV',
      'Curriculum Vitae',
    ];
    if (genericTitles.some((t) => trimmed.toLowerCase() === t.toLowerCase()))
      return true;

    // Too long for a name (most names are under 20 chars)
    if (trimmed.length > 20) return true;

    // Contains common document-related words (Chinese)
    if (/[简历版模板文档]/.test(trimmed)) return true;

    // Contains structural punctuation typical of titles, not names
    if (/[/\\|—–\-–_]/.test(trimmed)) return true;

    // ALL CAPS English longer than 2 words (e.g. "CURRICULUM VITAE")
    if (/^[A-Z\s]+$/.test(trimmed) && trimmed.split(/\s+/).length > 2)
      return true;

    return false;
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
            this.logger.warn(
              'Using basic parsing as fallback for resume content'
            );
            return this.basicParseResume(content);
          },
        }
      );

      return this.normalizeSkillResult(data);
    } catch (error) {
      this.logger.error('Error parsing resume via skill:', error);
      throw new Error(
        `Failed to parse resume content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
      this.logger.warn(
        'Resume parsing failed, falling back to basic parse:',
        error
      );
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
      this.logger.warn(
        'Resume optimization failed, continuing with parsed data only:',
        error
      );
    }

    return { parsedData, optimizedContent };
  }

  /**
   * Analyze parsed resume data using local rule-based scoring.
   * No AI call needed — the parsed data already has all structured info.
   * Scoring rules are defined in SCORING config constant for easy tuning.
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
    const S = ResumeAIService.SCORING;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // ── Summary ──
    if (
      parsedData.summary &&
      parsedData.summary.length >= S.summary.minLength
    ) {
      strengths.push('Professional summary is present and substantive');
      score += S.summary.present;
    } else {
      weaknesses.push('Professional summary is missing or too brief');
      suggestions.push(
        'Add a compelling professional summary (50-200 characters) that highlights your core value'
      );
    }

    // ── Skills ──
    const skills = parsedData.skills || [];
    if (skills.length >= S.skills.high.threshold) {
      strengths.push(
        `Strong technical skill set with ${skills.length} skills listed`
      );
      score += S.skills.high.score;
    } else if (skills.length >= S.skills.mid.threshold) {
      score += S.skills.mid.score;
      suggestions.push(
        'Consider adding more relevant skills to strengthen your profile'
      );
    } else {
      weaknesses.push('Limited skill diversity — few skills listed');
      suggestions.push(
        'Add relevant technical and soft skills that match your target roles'
      );
    }

    // ── Experience ──
    const experience = parsedData.experience || [];
    if (experience.length >= S.experience.high.threshold) {
      strengths.push(
        `Substantial work experience with ${experience.length} positions`
      );
      score += S.experience.high.score;
    } else if (experience.length >= S.experience.mid.threshold) {
      score += S.experience.mid.score;
      suggestions.push(
        'Consider adding more work experience entries if available'
      );
    } else {
      weaknesses.push('No work experience listed');
      suggestions.push(
        'Add internships, part-time roles, or volunteer experience'
      );
    }

    // Quantified achievements
    const hasQuantifiedAchievements = experience.some((exp) =>
      (exp.achievements || []).some((a) => S.achievements.pattern.test(a))
    );
    if (hasQuantifiedAchievements) {
      strengths.push('Experience includes quantified achievements and metrics');
      score += S.achievements.quantified;
    } else {
      weaknesses.push('Work experience lacks quantified achievements');
      suggestions.push(
        'Add specific numbers and metrics to your achievements (e.g., "increased revenue by 30%")'
      );
    }

    // ── Education ──
    const education = parsedData.education || [];
    if (education.length > 0) {
      score += S.education.present;
      if (education.some((e) => S.education.advancedPattern.test(e.degree))) {
        strengths.push('Advanced degree strengthens academic credentials');
        score += S.education.advanced;
      }
    } else {
      weaknesses.push('No education information provided');
      suggestions.push('Add your educational background');
    }

    // ── Projects ──
    const projects = parsedData.projects || [];
    if (projects.length >= S.projects.high.threshold) {
      strengths.push(
        `${projects.length} project entries demonstrate hands-on experience`
      );
      score += S.projects.high.score;
    } else if (projects.length >= S.projects.mid.threshold) {
      score += S.projects.mid.score;
      suggestions.push(
        'Adding more project examples can showcase a broader skill set'
      );
    } else {
      weaknesses.push('No project experience listed');
      suggestions.push(
        'Add personal or professional projects to demonstrate practical skills'
      );
    }

    // ── Personal Info completeness ──
    const pi = parsedData.personalInfo || ({} as any);
    const filledContactFields = S.contact.requiredFields.filter(
      (f) => pi[f]
    ).length;
    if (filledContactFields >= S.contact.requiredFields.length) {
      score += S.contact.complete;
    } else {
      weaknesses.push('Contact information is incomplete');
      suggestions.push('Ensure email, phone, and location are all provided');
    }

    // ── Certifications ──
    if (parsedData.certifications && parsedData.certifications.length > 0) {
      strengths.push(
        `${parsedData.certifications.length} certification(s) add professional credibility`
      );
      score += S.certifications.perItem;
    }

    // ── contextSummary ──
    if (parsedData.contextSummary) {
      score += S.contextSummary.present;
    }

    return {
      strengths,
      weaknesses,
      suggestions,
      overallScore: Math.min(S.maxScore, score),
    };
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
      throw new Error(
        `Failed to optimize resume content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
    this.logger.log(
      'Generating JD-based optimization suggestions via resume-writer skill'
    );

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
          },
        }
      );

      const optimizations = data?.optimizations || [];

      if (!Array.isArray(optimizations)) {
        return [];
      }

      const A = ResumeAIService.SUGGESTION_ALIASES;
      return optimizations.map((opt: any, index: number) => ({
        id: `sug_${Date.now()}_${index}`,
        type:
          (SuggestionType as any)[(opt.type as string)?.toUpperCase()] ??
          SuggestionType.CONTENT,
        section: this.resolveField(opt, 'section', A.section),
        itemIndex: opt.sectionIndex ?? 0,
        original: this.resolveField(opt, 'original', A.original),
        optimized: this.resolveField(opt, 'optimized', A.optimized),
        reason: this.resolveField(opt, 'reason', A.reason),
        status: SuggestionStatus.PENDING,
      }));
    } catch (error) {
      this.logger.error('Error generating optimization suggestions:', error);
      throw new Error(
        `Failed to generate optimization suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ---- Fallback methods ----

  private basicParseResume(content: string): ParsedResumeData {
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return {
      personalInfo: {
        name: lines[0] || '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        website: '',
      },
      summary: lines.slice(1, 3).join(' ') || '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
    };
  }

  private generateBasicJDSuggestions(): OptimizationSuggestion[] {
    return [
      {
        id: `sug_${Date.now()}_jd_0`,
        type: SuggestionType.CONTENT,
        section: 'summary',
        itemIndex: 0,
        original: '',
        optimized:
          'Tailor your summary to match the key requirements from the job description',
        reason: 'Align your professional summary with job requirements',
        status: SuggestionStatus.PENDING,
      },
    ];
  }

  private normalizeSkillResult(data: any): ParsedResumeData {
    // Parse JSON string if needed
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return this.basicParseResume(data);
      }
    }

    const normalized: any = { ...data };

    // ── personalInfo ──
    if (
      !normalized.personalInfo ||
      typeof normalized.personalInfo !== 'object'
    ) {
      normalized.personalInfo = {};
    }
    const pi = normalized.personalInfo;
    normalized.personalInfo = {
      name: pi.name || normalized.personalName || '',
      email: pi.email || normalized.personalEmail || '',
      phone: pi.phone || normalized.personalPhone || '',
      location: pi.location || '',
      linkedin: pi.linkedin || '',
      github: pi.github || '',
      website: pi.website || '',
    };

    // ── Smart validation & correction ──
    const ctx = normalized.contextSummary || normalized.summary || '';
    if (ctx) {
      const corrected = this.correctPersonalInfo(normalized.personalInfo, ctx);
      if (corrected) {
        normalized.personalInfo = corrected;
      }
    }

    // ── summary ──
    normalized.summary = normalized.summary || '';

    // ── skills ── Flatten categorized skills object into string array
    normalized.skills = this.normalizeSkills(normalized.skills);

    // ── experience ──
    normalized.experience = this.normalizeExperience(normalized.experience);

    // ── education ──
    normalized.education = this.normalizeEducation(normalized.education);

    // ── projects ──
    normalized.projects = this.normalizeProjects(normalized.projects);

    // ── certifications ──
    normalized.certifications = this.normalizeCertifications(
      normalized.certifications
    );

    // ── languages ──
    normalized.languages = this.normalizeLanguages(normalized.languages);

    // Remove extra fields not in ParsedResumeData
    delete normalized.matchAnalysis;

    return normalized as ParsedResumeData;
  }

  // ── Section normalizers (using alias maps) ──

  private normalizeSkills(skills: any): string[] {
    if (Array.isArray(skills)) return skills;
    if (skills && typeof skills === 'object') {
      return ResumeAIService.SKILL_CATEGORIES.flatMap((cat) =>
        Array.isArray(skills[cat]) ? skills[cat] : []
      );
    }
    return [];
  }

  private normalizeExperience(experience: any): any[] {
    if (!Array.isArray(experience)) return [];
    const A = ResumeAIService.EXPERIENCE_ALIASES;
    return experience.map((exp: any) => {
      const position = this.resolveField(exp, 'position', A.position);
      const startDate = this.resolveField(exp, 'startDate', A.startDate);

      // endDate: handle "至今"/"present"/current flag
      let endDate: string | undefined;
      if (exp.endDate && exp.endDate !== '至今' && exp.endDate !== 'present') {
        endDate = exp.endDate;
      } else if (
        exp.current === true ||
        exp.endDate === '至今' ||
        exp.endDate === 'present'
      ) {
        endDate = undefined;
      } else {
        endDate = '';
      }

      // description: array of strings, may come from aliases
      const descRaw = this.resolveField(exp, 'description', A.description);
      const description = Array.isArray(descRaw)
        ? descRaw
        : typeof descRaw === 'string'
          ? [descRaw]
          : [];

      // achievements: also has aliases
      const achRaw = this.resolveField(exp, 'achievements', A.achievements);
      const achievements = Array.isArray(achRaw) ? achRaw : [];

      return {
        company: exp.company || '',
        position,
        startDate,
        endDate,
        location: exp.location || '',
        description,
        achievements,
      };
    });
  }

  private normalizeEducation(education: any): any[] {
    if (!Array.isArray(education)) return [];
    const A = ResumeAIService.EDUCATION_ALIASES;
    return education.map((edu: any) => ({
      institution: edu.institution || '',
      degree: edu.degree || '',
      field: this.resolveField(edu, 'field', A.field),
      startDate: this.resolveField(edu, 'startDate', A.startDate),
      endDate: edu.endDate || '',
      gpa: edu.gpa || '',
      achievements: Array.isArray(edu.achievements) ? edu.achievements : [],
    }));
  }

  private normalizeProjects(projects: any): any[] {
    if (!Array.isArray(projects)) return [];
    return projects.map((proj: any) => {
      const highlights = Array.isArray(proj.highlights)
        ? proj.highlights
        : Array.isArray(proj.achievements)
          ? proj.achievements
          : [];
      return {
        name: proj.name || '',
        description: proj.description || '',
        technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
        startDate: proj.startDate || '',
        endDate: proj.endDate || '',
        url: proj.url || '',
        highlights,
      };
    });
  }

  private normalizeCertifications(certifications: any): any[] {
    if (!Array.isArray(certifications)) return [];
    const A = ResumeAIService.CERT_ALIASES;
    return certifications.map((cert: any) => {
      if (typeof cert === 'string') {
        return {
          name: cert,
          issuer: '',
          date: '',
          expiryDate: '',
          credentialId: '',
        };
      }
      return {
        name: cert.name || '',
        issuer: this.resolveField(cert, 'issuer', A.issuer),
        date: cert.date || '',
        expiryDate: cert.expiryDate || '',
        credentialId: cert.credentialId || '',
      };
    });
  }

  private normalizeLanguages(languages: any): any[] {
    if (!Array.isArray(languages)) return [];
    const A = ResumeAIService.LANG_ALIASES;
    return languages.map((lang: any) => {
      if (typeof lang === 'string') {
        return { name: lang, proficiency: '' };
      }
      return {
        name: lang.name || '',
        proficiency: this.resolveField(lang, 'proficiency', A.proficiency),
      };
    });
  }
}
