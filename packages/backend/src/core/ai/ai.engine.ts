/**
 * AI Engine - Refactored Version
 * Now uses AIService for unified AI operations
 * This class serves as a facade providing backward compatibility
 * and file extraction utilities
 */

import { Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { AIService } from './ai.service';
import { Models } from './models';
import {
  ParsedResumeData,
  ParsedJobDescription,
  OptimizationSuggestion,
  InterviewQuestion,
} from '@/types';
import { z } from 'zod';

// Define Zod schema for ParsedResumeData for validation and potential fixing
const ParsedResumeDataSchema = z.object({
  personalInfo: z.object({
    name: z.string().default(''),
    email: z.string().default(''),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    website: z.string().optional(),
  }),
  summary: z.string().optional(),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        field: z.string().optional().default(''),
        startDate: z.string().optional().default(''),
        endDate: z.string().optional(),
        gpa: z.string().optional(),
        achievements: z.array(z.string()).optional(),
      })
    )
    .default([]),
  experience: z
    .array(
      z.object({
        company: z.string(),
        position: z.string(),
        startDate: z.string().optional().default(''),
        endDate: z.string().optional(),
        location: z.string().optional(),
        description: z.array(z.string()).default([]),
        achievements: z.array(z.string()).optional(),
      })
    )
    .default([]),
  skills: z.array(z.string()).default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        technologies: z.array(z.string()).default([]),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        url: z.string().optional(),
        highlights: z.array(z.string()).default([]),
      })
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        date: z.string(),
        expiryDate: z.string().optional(),
        credentialId: z.string().optional(),
      })
    )
    .optional(),
  languages: z
    .array(
      z.object({
        name: z.string(),
        proficiency: z.string(),
      })
    )
    .optional(),
  markdown: z.string().optional(),
});

@Injectable()
export class AIEngine {
  private readonly logger = new Logger(AIEngine.name);

  constructor(private aiService: AIService) { }

  /**
   * Extract text content from a file buffer based on file type
   */
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

  /**
   * Extract text from PDF file
   */
  private async extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(fileBuffer);
      return data.text;
    } catch (error) {
      this.logger.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  /**
   * Extract text from DOCX file
   */
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
   * Parse resume content using AI
   * Delegates to AIService with unified AI support
   */
  async parseResumeContent(content: string): Promise<ParsedResumeData> {
    this.logger.log('Parsing resume content');

    const systemPrompt = `You are a resume parsing expert. Extract structured information from the resume text provided.
Return valid JSON matching the expected schema with personalInfo, education, experience, skills, projects, certifications, and languages.`;

    const userPrompt = `Parse this resume and return structured JSON data:\n\n${content}`;

    try {
      const response = await this.aiService.generate(
        Models.ResumeParser,
        systemPrompt,
        userPrompt
      );

      // Try to parse the JSON response
      let parsedData: any;
      try {
        // Try direct JSON parsing first
        parsedData = JSON.parse(response);
      } catch (e) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[1].trim());
        } else {
          throw new Error('Could not parse JSON from AI response');
        }
      }

      // Validate and fix the parsed data using Zod
      const validatedData = ParsedResumeDataSchema.parse(parsedData);

      this.logger.log('Resume parsed successfully');
      return validatedData;
    } catch (error) {
      this.logger.error('Error parsing resume:', error);
      throw new Error('Failed to parse resume content');
    }
  }

  /**
   * Parse job description using AI
   */
  async parseJobDescription(content: string): Promise<ParsedJobDescription> {
    this.logger.log('Parsing job description');

    const systemPrompt = `You are a job description parsing expert. Extract structured information from the job description provided.
Return valid JSON with title, company, location, description, requirements, responsibilities, skills, experience, education, salary, and benefits.`;

    const userPrompt = `Parse this job description and return structured JSON data:\n\n${content}`;

    try {
      const response = await this.aiService.generate(
        Models.JobParser,
        systemPrompt,
        userPrompt
      );

      // Try to parse the JSON response
      let parsedData: any;
      try {
        parsedData = JSON.parse(response);
      } catch (e) {
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[1].trim());
        } else {
          throw new Error('Could not parse JSON from AI response');
        }
      }

      this.logger.log('Job description parsed successfully');
      return parsedData;
    } catch (error) {
      this.logger.error('Error parsing job description:', error);
      throw new Error('Failed to parse job description');
    }
  }

  /**
   * Generate optimization suggestions
   */
  async generateOptimizationSuggestions(
    resumeContent: string,
    jobDescription: string
  ): Promise<OptimizationSuggestion[]> {
    this.logger.log('Generating optimization suggestions');

    const systemPrompt = `You are a resume optimization expert. Analyze the resume against the job description and provide specific suggestions for improvement.
Return an array of JSON objects with type, priority, section, original, suggestion, and reason fields.`;

    const userPrompt = `Resume:\n${resumeContent}\n\nJob Description:\n${jobDescription}\n\nProvide optimization suggestions as a JSON array.`;

    try {
      const response = await this.aiService.generate(
        Models.Optimization,
        systemPrompt,
        userPrompt
      );

      let suggestions: any;
      try {
        suggestions = JSON.parse(response);
      } catch (e) {
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[1].trim());
        } else {
          throw new Error('Could not parse JSON from AI response');
        }
      }

      this.logger.log(`Generated ${suggestions.length} optimization suggestions`);
      return suggestions;
    } catch (error) {
      this.logger.error('Error generating optimization suggestions:', error);
      throw new Error('Failed to generate optimization suggestions');
    }
  }

  /**
   * Generate interview questions
   */
  async generateInterviewQuestions(
    jobDescription: string,
    resumeContent: string
  ): Promise<InterviewQuestion[]> {
    this.logger.log('Generating interview questions');

    const systemPrompt = `You are an interview preparation expert. Based on the job description and resume, generate relevant interview questions.
Return an array of JSON objects with category, question, suggestedAnswer, and tips fields.`;

    const userPrompt = `Job Description:\n${jobDescription}\n\nResume:\n${resumeContent}\n\nGenerate interview questions as a JSON array.`;

    try {
      const response = await this.aiService.generate(
        Models.InterviewPrep,
        systemPrompt,
        userPrompt
      );

      let questions: any;
      try {
        questions = JSON.parse(response);
      } catch (e) {
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[1].trim());
        } else {
          throw new Error('Could not parse JSON from AI response');
        }
      }

      this.logger.log(`Generated ${questions.length} interview questions`);
      return questions;
    } catch (error) {
      this.logger.error('Error generating interview questions:', error);
      throw new Error('Failed to generate interview questions');
    }
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    return this.aiService.embed(Models.Embedding, text);
  }

  /**
   * Generate chat completion
   */
  async generateChatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const result = await this.aiService.chat(Models.Default, messages, options);
    return result.content;
  }

  /**
   * Generate completion from a prompt (simplified API)
   */
  async generate(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const result = await this.aiService.chat(
      Models.Default,
      [{ role: 'user', content: prompt }],
      options
    );
    return result.content;
  }

  /**
   * Chat with interviewer persona
   */
  async chatWithInterviewer(
    context: string,
    message: string,
    history: Array<{ role: string; content: string }>
  ): Promise<string> {
    const systemPrompt = `You are an experienced interviewer. ${context}
    
Conduct a professional interview. Ask follow-up questions, probe for details, and provide constructive feedback.
Be encouraging but thorough. Keep responses concise and focused.`;

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    const result = await this.aiService.chat(Models.InterviewChat, messages, {
      temperature: 0.7,
    });
    return result.content;
  }

  /**
   * Transcribe audio (placeholder - requires Whisper API)
   */
  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    this.logger.log('Transcribing audio...');
    const result = await this.aiService.chat(
      Models.Default,
      [
        {
          role: 'system',
          content: 'You are a transcription assistant. The user will provide audio context.',
        },
        {
          role: 'user',
          content: 'Please transcribe the following audio content. (Note: This is a placeholder - actual transcription requires Whisper API integration)',
        },
      ],
      { temperature: 0.3 }
    );
    return result.content;
  }

  /**
   * Analyze parsed resume data
   */
  async analyzeParsedResume(parsedData: ParsedResumeData): Promise<{
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    overallScore: number;
  }> {
    this.logger.log('Analyzing parsed resume data');

    const systemPrompt = `You are a resume analysis expert. Analyze the parsed resume data and provide:
1. A list of strengths (what makes this resume strong)
2. A list of weaknesses (areas that need improvement)
3. Specific suggestions for improvement
4. An overall score from 0-100

Return valid JSON with keys: strengths (string[]), weaknesses (string[]), suggestions (string[]), overallScore (number).`;

    const userPrompt = `Analyze this resume data:\n\n${JSON.stringify(parsedData, null, 2)}`;

    try {
      const response = await this.aiService.generate(
        Models.ResumeParser,
        systemPrompt,
        userPrompt
      );

      let analysis: any;
      try {
        analysis = JSON.parse(response);
      } catch (e) {
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[1].trim());
        } else {
          throw new Error('Could not parse JSON from AI response');
        }
      }

      this.logger.log('Resume analysis completed');
      return {
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        suggestions: analysis.suggestions || [],
        overallScore: analysis.overallScore || 0,
      };
    } catch (error) {
      this.logger.error('Error analyzing resume:', error);
      throw new Error('Failed to analyze resume');
    }
  }

  /**
   * Optimize resume content
   */
  async optimizeResumeContent(content: string): Promise<string> {
    this.logger.log('Optimizing resume content');

    const systemPrompt = `You are a resume optimization expert. Improve the given resume content to:
1. Use strong action verbs
2. Quantify achievements where possible
3. Highlight relevant skills and experiences
4. Improve clarity and conciseness
5. Maintain the original structure and format

Return the optimized resume content as plain text.`;

    const userPrompt = `Optimize this resume content:\n\n${content}`;

    try {
      const response = await this.aiService.generate(
        Models.ResumeOptimization,
        systemPrompt,
        userPrompt
      );
      this.logger.log('Resume content optimized');
      return response;
    } catch (error) {
      this.logger.error('Error optimizing resume content:', error);
      throw new Error('Failed to optimize resume content');
    }
  }
}
