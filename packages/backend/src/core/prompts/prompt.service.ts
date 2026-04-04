/**
 * Prompt Service
 * Centralized prompt management with multi-language support
 */

import { Injectable } from '@nestjs/common';
import {
  INTERVIEW_MOCK_PROMPTS,
  INTERVIEW_FEEDBACK_PROMPTS,
  QUESTION_GENERATOR_PROMPTS,
  RESUME_OPTIMIZATION_PROMPTS,
  RESUME_PARSING_PROMPTS,
  JOB_PARSING_PROMPTS,
  OPTIMIZATION_PROMPTS,
  RESUME_ANALYSIS_PROMPTS,
  SCENE_ANALYSIS_PROMPTS,
  CHAT_INTENT_PROMPTS,
} from './constants/interview-prompts';

export type Language = 'EN' | 'ZH';
export type LanguageInput = 'en' | 'zh' | 'EN' | 'ZH';

/**
 * Convert language input to standard format
 */
export function normalizeLanguage(lang: LanguageInput): Language {
  const lower = lang.toLowerCase();
  return lower === 'zh' ? 'ZH' : 'EN';
}

export interface InterviewContext {
  candidateName: string;
  jobTitle: string;
  company: string;
  requirements: string;
}

export interface FeedbackContext {
  jobTitle: string;
  company: string;
  requirements: string;
  candidateName: string;
  transcript: string;
}

@Injectable()
export class PromptService {
  /**
   * Get interview mock prompts for a specific language
   */
  getInterviewMockPrompts(language: LanguageInput) {
    const lang = normalizeLanguage(language);
    return INTERVIEW_MOCK_PROMPTS[lang];
  }

  /**
   * Get interview feedback prompt for a specific language
   */
  getInterviewFeedbackPrompt(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return INTERVIEW_FEEDBACK_PROMPTS[lang];
  }

  /**
   * Get question generator prompt for a specific language
   */
  getQuestionGeneratorPrompt(language: LanguageInput, count: number): string {
    const lang = normalizeLanguage(language);
    const template = QUESTION_GENERATOR_PROMPTS[lang];
    return template.replace('{{count}}', count.toString());
  }

  /**
   * Get resume optimization system prompt for a specific language
   */
  getResumeOptimizationPrompt(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return RESUME_OPTIMIZATION_PROMPTS[lang].system;
  }

  /**
   * Get resume parsing prompt for a specific language
   */
  getResumeParsingPrompt(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return RESUME_PARSING_PROMPTS[lang];
  }

  /**
   * Get job description parsing prompt for a specific language
   */
  getJobParsingPrompt(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return JOB_PARSING_PROMPTS[lang];
  }

  /**
   * Get optimization suggestions prompt for a specific language
   */
  getOptimizationPrompt(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return OPTIMIZATION_PROMPTS[lang];
  }

  /**
   * Get resume analysis prompt for a specific language
   */
  getAnalysisPrompt(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return RESUME_ANALYSIS_PROMPTS[lang];
  }

  /**
   * Get scene analysis system prompt for a specific language
   */
  getSceneAnalysisPrompt(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return SCENE_ANALYSIS_PROMPTS[lang].system;
  }

  /**
   * Get chat intent prompt for a specific scene and language
   */
  getChatIntentPrompt(
    scene: 'careerAdvice' | 'generalChat',
    language: LanguageInput
  ): string {
    const lang = normalizeLanguage(language);
    return CHAT_INTENT_PROMPTS[lang][scene];
  }

  /**
   * Get interview preparation guidance prompt
   */
  getPreparationGuidancePrompt(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return lang === 'ZH'
      ? `你是一位专业的面试教练。提供全面的面试准备指导。`
      : `You are an expert interview coach. Provide comprehensive interview preparation guidance.`;
  }

  /**
   * Build resume parsing user prompt
   */
  buildResumeParsingPrompt(content: string): string {
    return `Parse this resume and return structured JSON data:\n\n${content}`;
  }

  /**
   * Build job description parsing user prompt
   */
  buildJobParsingPrompt(content: string): string {
    return `Parse this job description and return structured JSON data:\n\n${content}`;
  }

  /**
   * Build optimization suggestions user prompt
   */
  buildOptimizationPrompt(
    resumeContent: string,
    jobDescription: string
  ): string {
    return `Resume:\n${resumeContent}\n\nJob Description:\n${jobDescription}\n\nProvide optimization suggestions as a JSON array.`;
  }

  /**
   * Build interview questions generation user prompt
   */
  buildInterviewQuestionsPrompt(
    jobDescription: string,
    resumeContent: string,
    count: number
  ): string {
    return `Job Description:\n${jobDescription}\n\nResume:\n${resumeContent}\n\nGenerate ${count} interview questions as a JSON array.`;
  }

  /**
   * Build resume analysis user prompt
   */
  buildAnalysisPrompt(parsedData: any): string {
    return `Analyze this resume data:\n\n${JSON.stringify(parsedData, null, 2)}`;
  }

  /**
   * Build complete context for interview mock
   */
  buildInterviewContext(context: InterviewContext): string {
    // Determine language based on content
    const hasChinese = /[\u4e00-\u9fa5]/.test(
      context.candidateName + context.jobTitle + context.company
    );
    const lang = hasChinese ? 'ZH' : 'EN';
    const prompts = INTERVIEW_MOCK_PROMPTS[lang];
    return prompts.context(context);
  }

  /**
   * Build feedback prompt with context
   */
  buildFeedbackPrompt(context: FeedbackContext, language: LanguageInput): string {
    const template = this.getInterviewFeedbackPrompt(language);
    return template
      .replace('{{jobTitle}}', context.jobTitle)
      .replace('{{company}}', context.company)
      .replace('{{requirements}}', context.requirements)
      .replace('{{candidateName}}', context.candidateName)
      .replace('{{transcript}}', context.transcript);
  }

  /**
   * Get fallback response for errors
   */
  getFallbackResponse(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return lang === 'ZH'
      ? '抱歉，无法生成回复。请稍后重试。'
      : 'Sorry, unable to generate response. Please try again later.';
  }

  /**
   * Get common interview labels
   */
  getInterviewLabels(language: LanguageInput) {
    const lang = normalizeLanguage(language);
    return lang === 'ZH'
      ? {
          question: '问题',
          referenceAnswer: '参考答案',
          keyPoints: '要点',
          estimatedTime: '建议时长',
          tips: '建议',
          avoid: '避免',
          score: '评分',
          strengths: '优势',
          improvements: '改进空间',
        }
      : {
          question: 'Question',
          referenceAnswer: 'Reference Answer',
          keyPoints: 'Key Points',
          estimatedTime: 'Estimated Time',
          tips: 'Tips',
          avoid: 'Avoid',
          score: 'Score',
          strengths: 'Strengths',
          improvements: 'Areas for Improvement',
        };
  }
}