/**
 * AI Engine - Skills-First Architecture
 * Delegates domain-level AI operations to the Skills Engine.
 * Retains backward-compatible API surface for all consumers.
 * Framework-level prompts (interview mock, chat intent, etc.) remain in PromptService.
 */

import {
  InterviewDifficulty,
  InterviewQuestion,
  InterviewQuestionType,
  OptimizationSuggestion,
  ParsedJobDescription,
  ParsedResumeData,
} from '@/types';
import { SuggestionStatus, SuggestionType } from '@/types/ai';
import { Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { AIService } from './ai.service';
import { AI_MODEL } from './models';

@Injectable()
export class AIEngine {
  private readonly logger = new Logger(AIEngine.name);
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 1000;

  constructor(private aiService: AIService) { }

  /**
   * Execute skill with retry logic and error handling
   * Implements exponential backoff for transient failures
   */
  private async executeSkillWithRetry(
    skillName: string,
    inputs: Record<string, any>,
    userId: string,
    options?: { fallback?: () => Promise<any> }
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
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
            this.logger.warn(
              `Skill "${skillName}" transient error (attempt ${attempt + 1}): ${errorMessage}`
            );
            continue;
          }

          if (options?.fallback) {
            this.logger.warn(
              `Skill "${skillName}" permanent error (${errorCode}), using fallback immediately`
            );
            return options.fallback();
          }

          throw lastError;
        }

        if (!result.data) {
          if (options?.fallback && attempt < this.maxRetries) {
            this.logger.warn(
              `Skill "${skillName}" returned empty data (attempt ${attempt + 1}), retrying...`
            );
            continue;
          }

          if (options?.fallback) {
            this.logger.warn(
              `Skill "${skillName}" returned no data after all retries, using fallback`
            );
            return options.fallback();
          }
          throw new Error('Skill returned no data');
        }

        return result.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (this.isNetworkError(lastError) && attempt < this.maxRetries) {
          this.logger.warn(
            `Network error for skill "${skillName}" (attempt ${attempt + 1}): ${lastError.message}`
          );
          continue;
        }

        if (options?.fallback) {
          this.logger.warn(
            `Skill "${skillName}" error after attempts, using fallback: ${lastError.message}`
          );
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
      this.logger.warn(
        `Skill "${skillName}" exhausted all retries, using fallback as last resort`
      );
      try {
        return await options.fallback();
      } catch (fallbackError) {
        this.logger.error(`Fallback also failed for skill "${skillName}":`, fallbackError);
      }
    }

    throw lastError || new Error('Skill execution failed');
  }

  /**
   * Check if error is transient and should be retried
   */
  private isTransientError(errorCode: string): boolean {
    const transientErrors = [
      'RATE_LIMIT_EXCEEDED',
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
      'PROVIDER_OVERLOADED',
    ];
    return transientErrors.includes(errorCode);
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: Error): boolean {
    const networkPatterns = [
      /network/i,
      /timeout/i,
      /ECONNREFUSED/i,
      /ECONNRESET/i,
      /ETIMEDOUT/i,
      /fetch failed/i,
      /socket hang up/i,
    ];
    return networkPatterns.some(pattern => pattern.test(error.message));
  }

  async extractTextFromFile(
    fileBuffer: Buffer,
    fileType: string
  ): Promise<string> {
    this.logger.log(
      `Extracting text from ${fileType} file (${fileBuffer.length} bytes)`
    );

    let text = '';
    switch (fileType.toLowerCase()) {
      case 'pdf':
        text = await this.extractTextFromPDF(fileBuffer);
        break;
      case 'docx':
        text = await this.extractTextFromDOCX(fileBuffer);
        break;
      case 'txt':
      case 'md':
      case 'markdown':
        text = fileBuffer.toString('utf-8');
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    if (!text || text.trim().length === 0) {
      this.logger.warn(`Extracted text is empty for ${fileType} file`);
    }

    return text;
  }

  private async extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
    try {
      const data = new Uint8Array(fileBuffer);
      const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;
      const textParts: string[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        textParts.push(pageText);
      }

      const fullText = textParts.join('\n\n');

      const avgCharsPerPage = fullText.length / doc.numPages;
      if (avgCharsPerPage < 50 && doc.numPages > 0) {
        this.logger.warn(
          `PDF may be scanned/image-based (avg ${avgCharsPerPage.toFixed(0)} chars/page). ` +
          `Text extraction may be incomplete.`
        );
      }

      return fullText;
    } catch (error) {
      this.logger.error('Error parsing PDF with pdfjs-dist:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  private async extractTextFromDOCX(fileBuffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } catch (error) {
      this.logger.error('Error parsing DOCX:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }

  /**
   * Parse resume content using resume-analyzer skill
   */
  async parseResumeContent(
    content: string,
    userId: string,
    _language?: string
  ): Promise<ParsedResumeData> {
    this.logger.log(`Parsing resume content via resume-analyzer skill`);

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
   * Basic fallback parsing when AI skill fails
   */
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

  /**
   * Parse resume AND optimize in one flow using skills pipeline
   */
  async parseAndOptimizeResume(
    content: string,
    userId: string,
    _language?: string
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
   * Generate structured optimization suggestions using resume-writer skill
   */
  async generateSuggestions(
    parsedData: ParsedResumeData,
    userId: string,
    _language?: string
  ): Promise<OptimizationSuggestion[]> {
    this.logger.log('Generating optimization suggestions via resume-writer skill');

    try {
      const data = await this.executeSkillWithRetry(
        'resume-writer',
        {
          resumeData: JSON.stringify(parsedData),
          optimizationFocus: 'all',
          style: 'professional',
        },
        userId,
        {
          fallback: async () => {
            this.logger.warn('Using rule-based suggestions as fallback');
            return this.generateRuleBasedSuggestions(parsedData);
          }
        }
      );

      const optimizations =
        data?.optimizations ||
        (Array.isArray(data) ? data : []);

      if (!Array.isArray(optimizations)) {
        return [];
      }

      return optimizations.map((opt: any, index: number) => ({
        id: `sug_${Date.now()}_${index}`,
        type:
          (SuggestionType as any)[(opt.type as string)?.toUpperCase()] ??
          SuggestionType.CONTENT,
        section: opt.section || 'experience',
        itemIndex: opt.sectionIndex ?? 0,
        original: opt.before || opt.original || '',
        optimized: opt.after || opt.optimized || '',
        reason: opt.reason || opt.change || '',
        status: SuggestionStatus.PENDING,
      }));
    } catch (error) {
      this.logger.error('Error generating suggestions:', error);
      throw new Error(`Failed to generate optimization suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rule-based fallback for suggestion generation
   */
  private generateRuleBasedSuggestions(parsedData: ParsedResumeData): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    if (parsedData.skills && parsedData.skills.length < 5) {
      suggestions.push({
        id: `sug_${Date.now()}_skills`,
        type: SuggestionType.CONTENT,
        section: 'skills',
        itemIndex: 0,
        original: parsedData.skills.join(', ') || '',
        optimized: `${parsedData.skills.join(', ')}, Team Leadership, Problem Solving`,
        reason: 'Consider adding more technical and soft skills',
        status: SuggestionStatus.PENDING
      });
    }

    if (!parsedData.summary || parsedData.summary.length < 50) {
      suggestions.push({
        id: `sug_${Date.now()}_summary`,
        type: SuggestionType.CONTENT,
        section: 'summary',
        itemIndex: 0,
        original: parsedData.summary || '',
        optimized: `Experienced professional with expertise in ${parsedData.skills?.[0] || 'various technologies'}. Proven track record of delivering high-quality results.`,
        reason: 'Summary should be more comprehensive (50-200 characters recommended)',
        status: SuggestionStatus.PENDING
      });
    }

    return suggestions;
  }

  /**
   * Parse job description using job-parser skill
   */
  async parseJobDescription(
    content: string,
    userId: string,
    _language?: string
  ): Promise<ParsedJobDescription> {
    this.logger.log('Parsing job description via job-parser skill');

    try {
      const data = await this.executeSkillWithRetry(
        'job-parser',
        { rawJob: { description: content } },
        userId,
        {
          fallback: async () => {
            this.logger.warn('Using rule-based parsing as fallback for job description');
            return this.basicParseJobDescription(content);
          }
        }
      );

      return data as ParsedJobDescription;
    } catch (error) {
      this.logger.error('Error parsing job description:', error);
      throw new Error(`Failed to parse job description: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Basic fallback for job description parsing
   */
  private basicParseJobDescription(content: string): ParsedJobDescription {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    return {
      title: lines[0] || '',
      company: '',
      location: '',
      requiredSkills: [],
      preferredSkills: [],
      responsibilities: [],
      keywords: [],
      salaryRange: '',
      experienceYears: 0,
      educationLevel: 'bachelor',
      description: content
    };
  }

  /**
   * Generate JD-based optimization suggestions using resume-writer skill
   */
  async generateOptimizationSuggestions(
    resumeContent: string,
    jobDescription: string,
    userId: string,
    _language?: string
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
            return this.generateBasicJDSuggestions(resumeContent, jobDescription);
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

  /**
   * Basic JD-based fallback for suggestion generation
   */
  private generateBasicJDSuggestions(_resumeContent: string, _jobDescription: string): OptimizationSuggestion[] {
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

  /**
   * Generate interview questions using interview-question-generator skill
   */
  async generateInterviewQuestions(
    jobDescription: string,
    resumeContent: string,
    count: number = 10,
    userId: string,
    _language?: string
  ): Promise<InterviewQuestion[]> {
    this.logger.log(
      `Generating interview questions via interview-question-generator skill (count: ${count})`
    );

    try {
      const data = await this.executeSkillWithRetry(
        'interview-question-generator',
        {
          jobDescription,
          resumeText: resumeContent,
          count,
          difficulty: 'mixed',
        },
        userId,
        {
          fallback: async () => {
            this.logger.warn('Using template-based questions as fallback');
            return this.generateTemplateQuestions(jobDescription, count);
          }
        }
      );

      const questions = data?.questions || [];

      if (!Array.isArray(questions)) {
        return [];
      }

      return questions.map((q: any) => ({
        questionType: q.category || q.questionType || 'behavioral',
        question: q.question,
        suggestedAnswer: q.sampleAnswer?.example || q.suggestedAnswer || q.context || '',
        tips: Array.isArray(q.tips) ? q.tips : [q.tips].filter(Boolean),
        difficulty: q.difficulty || 'medium',
      }));
    } catch (error) {
      this.logger.error('Error generating interview questions:', error);
      throw new Error(`Failed to generate interview questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Template-based fallback for question generation
   */
  private generateTemplateQuestions(_jobDescription: string, count: number = 10): InterviewQuestion[] {
    const templates = [
      { questionType: InterviewQuestionType.BEHAVIORAL, question: 'Tell me about a challenging project you worked on.', suggestedAnswer: '', tips: ['Use STAR method'], difficulty: InterviewDifficulty.MEDIUM },
      { questionType: InterviewQuestionType.TECHNICAL, question: 'Describe your experience with relevant technologies.', suggestedAnswer: '', tips: ['Be specific about your role'], difficulty: InterviewDifficulty.MEDIUM },
      { questionType: InterviewQuestionType.SITUATIONAL, question: 'How do you handle tight deadlines?', suggestedAnswer: '', tips: ['Provide examples'], difficulty: InterviewDifficulty.EASY },
      { questionType: InterviewQuestionType.BEHAVIORAL, question: 'Describe a time when you had to learn a new technology quickly.', suggestedAnswer: '', tips: ['Focus on learning process'], difficulty: InterviewDifficulty.MEDIUM },
      { questionType: InterviewQuestionType.TECHNICAL, question: 'What is your approach to debugging complex issues?', suggestedAnswer: '', tips: ['Show systematic approach'], difficulty: InterviewDifficulty.HARD },
    ];

    return templates.slice(0, count).map((t, i) => ({
      ...t,
      id: `template_q_${i}`,
      createdAt: new Date(),
      optimizationId: ''
    }));
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.aiService.embed(AI_MODEL, text);
  }

  async generateChatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const result = await this.aiService.chat(AI_MODEL, messages, options);
    return result.content;
  }

  async generate(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const result = await this.aiService.chat(
      AI_MODEL,
      [{ role: 'user', content: prompt }],
      options
    );
    return result.content;
  }

  async chatWithInterviewer(
    context: string,
    message: string,
    history: Array<{ role: string; content: string }>
  ): Promise<string> {
    const systemPrompt = `You are an experienced interviewer. ${context}
    
Conduct a professional interview. Ask follow-up questions, probe for details, and provide constructive feedback.
Be encouraging but thorough. Keep responses concise and focused.`;

    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user', content: message },
      ];

    const result = await this.aiService.chat(AI_MODEL, messages, {
      temperature: 0.7,
    });
    return result.content;
  }

  async transcribeAudio(_audioBuffer: Buffer): Promise<string> {
    this.logger.log('Transcribing audio...');
    const result = await this.aiService.chat(
      AI_MODEL,
      [
        {
          role: 'system',
          content:
            'You are a transcription assistant. The user will provide audio context.',
        },
        {
          role: 'user',
          content:
            'Please transcribe the following audio content. (Note: This is a placeholder - actual transcription requires Whisper API integration)',
        },
      ],
      { temperature: 0.3 }
    );
    return result.content;
  }

  /**
   * Analyze parsed resume data using resume-analyzer skill
   */
  async analyzeParsedResume(
    parsedData: ParsedResumeData,
    userId: string,
    _language?: string
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
   * Basic fallback for resume analysis
   */
  private basicAnalyzeResume(parsedData: ParsedResumeData): any {
    const skills = parsedData.skills || [];
    const experienceCount = parsedData.experience?.length || 0;

    const strengths = [];
    const weaknesses = [];
    const suggestions = [];

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
      matchAnalysis: {
        strengths,
        weaknesses,
        recommendations: suggestions,
        score
      }
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
      throw new Error(`Failed to optimize resume content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private normalizeSkillResult(data: any): ParsedResumeData {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data as unknown as ParsedResumeData;
      }
    }

    const normalized: any = { ...data };

    if (normalized.skills && typeof normalized.skills === 'object' && !Array.isArray(normalized.skills)) {
      const skillsObj = normalized.skills;
      normalized.skills = [
        ...(skillsObj.technical || []),
        ...(skillsObj.soft || []),
        ...(skillsObj.languages || []),
        ...(skillsObj.tools || []),
      ];
    }

    if (normalized.experience && Array.isArray(normalized.experience)) {
      normalized.experience = normalized.experience.map((exp: any) => ({
        company: exp.company || '',
        position: exp.title || exp.position || '',
        startDate: exp.startDate || exp.dates || '',
        endDate: exp.endDate || exp.current ? undefined : '',
        description: exp.responsibilities || exp.description || [],
        achievements: exp.achievements || [],
      }));
    }

    if (normalized.education && Array.isArray(normalized.education)) {
      normalized.education = normalized.education.map((edu: any) => ({
        institution: edu.institution || '',
        degree: edu.degree || '',
        field: edu.field || '',
        year: edu.year || edu.graduationYear || '',
      }));
    }

    return normalized;
  }
}