/**
 * AI Engine - Skills-First Architecture
 * Delegates domain-level AI operations to the Skills Engine.
 * Retains backward-compatible API surface for all consumers.
 * Framework-level prompts (interview mock, chat intent, etc.) remain in PromptService.
 */

import {
  InterviewQuestion,
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

  constructor(private aiService: AIService) { }

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
      const result = await this.aiService.executeSkill(
        'resume-analyzer',
        { resumeText: content },
        userId
      );

      if (!result.success || !result.data) {
        throw new Error('Skill returned no data');
      }

      return this.normalizeSkillResult(result.data);
    } catch (error) {
      this.logger.error('Error parsing resume via skill:', error);
      throw new Error('Failed to parse resume content');
    }
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
      const parseResult = await this.aiService.executeSkill(
        'resume-analyzer',
        { resumeText: content },
        userId
      );

      if (!parseResult.success || !parseResult.data) {
        throw new Error('resume-analyzer skill failed');
      }

      parsedData = this.normalizeSkillResult(parseResult.data);

      const writerResult = await this.aiService.executeSkill(
        'resume-writer',
        {
          resumeData: JSON.stringify(parsedData),
          optimizationFocus: 'all',
          style: 'professional',
        },
        userId
      );

      if (writerResult.success && writerResult.data) {
        const writerData = writerResult.data as any;
        optimizedContent =
          typeof writerData === 'string'
            ? writerData
            : JSON.stringify(writerData, null, 2);
      }
    } catch (error) {
      this.logger.warn('Skills pipeline failed, falling back to parse-only:', error);

      const parseResult = await this.aiService.executeSkill(
        'resume-analyzer',
        { resumeText: content },
        userId
      );

      if (parseResult.success && parseResult.data) {
        parsedData = this.normalizeSkillResult(parseResult.data);
      } else {
        throw new Error('Both skills pipeline and fallback failed');
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
      const result = await this.aiService.executeSkill(
        'resume-writer',
        {
          resumeData: JSON.stringify(parsedData),
          optimizationFocus: 'all',
          style: 'professional',
        },
        userId
      );

      if (!result.success || !result.data) {
        throw new Error('Skill returned no data');
      }

      const data = result.data as any;
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
      throw new Error('Failed to generate optimization suggestions');
    }
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
      const result = await this.aiService.executeSkill(
        'job-parser',
        { rawJob: { description: content } },
        userId
      );

      if (!result.success || !result.data) {
        throw new Error('Skill returned no data');
      }

      return result.data as ParsedJobDescription;
    } catch (error) {
      this.logger.error('Error parsing job description:', error);
      throw new Error('Failed to parse job description');
    }
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
      const result = await this.aiService.executeSkill(
        'resume-writer',
        {
          resumeData: resumeContent,
          targetJob: jobDescription,
          optimizationFocus: 'all',
          style: 'professional',
        },
        userId
      );

      if (!result.success || !result.data) {
        throw new Error('Skill returned no data');
      }

      const data = result.data as any;
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
      throw new Error('Failed to generate optimization suggestions');
    }
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
      const result = await this.aiService.executeSkill(
        'interview-question-generator',
        {
          jobDescription,
          resumeText: resumeContent,
          count,
          difficulty: 'mixed',
        },
        userId
      );

      if (!result.success || !result.data) {
        throw new Error('Skill returned no data');
      }

      const data = result.data as any;
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
      throw new Error('Failed to generate interview questions');
    }
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
      const result = await this.aiService.executeSkill(
        'resume-analyzer',
        { resumeText: JSON.stringify(parsedData) },
        userId
      );

      if (!result.success || !result.data) {
        throw new Error('Skill returned no data');
      }

      const data = result.data as any;
      const matchAnalysis = data?.matchAnalysis || {};

      return {
        strengths: matchAnalysis.strengths || [],
        weaknesses: matchAnalysis.gaps || [],
        suggestions: matchAnalysis.recommendations || [],
        overallScore: matchAnalysis.score ?? 0,
      };
    } catch (error) {
      this.logger.error('Error analyzing resume:', error);
      throw new Error('Failed to analyze resume');
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
      const result = await this.aiService.executeSkill(
        'resume-writer',
        {
          resumeData: content,
          optimizationFocus: 'content',
          style: 'professional',
        },
        userId
      );

      if (!result.success || !result.data) {
        throw new Error('Skill returned no data');
      }

      const data = result.data as any;
      return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    } catch (error) {
      this.logger.error('Error optimizing resume content:', error);
      throw new Error('Failed to optimize resume content');
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