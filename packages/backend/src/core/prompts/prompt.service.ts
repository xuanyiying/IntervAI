/**
 * Prompt Service - Framework-Level Prompts Only
 * Provides system-level prompts for: interview mock, feedback, chat intent,
 * scene analysis, UI labels, and conversation context.
 * Domain-level prompts (resume parsing, JD parsing, optimization suggestions)
 * are handled by the Skills Engine.
 */

import { Injectable } from '@nestjs/common';
import {
  INTERVIEW_MOCK_PROMPTS,
  INTERVIEW_FEEDBACK_PROMPTS,
  RESUME_OPTIMIZATION_PROMPTS,
  SCENE_ANALYSIS_PROMPTS,
  CHAT_INTENT_PROMPTS,
} from './constants/interview-prompts';

export type Language = 'EN' | 'ZH';
export type LanguageInput = 'en' | 'zh' | 'EN' | 'ZH';

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
  getInterviewMockPrompts(language: LanguageInput) {
    const lang = normalizeLanguage(language);
    return INTERVIEW_MOCK_PROMPTS[lang];
  }

  getInterviewFeedbackPrompt(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return INTERVIEW_FEEDBACK_PROMPTS[lang];
  }

  getResumeOptimizationPrompt(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return RESUME_OPTIMIZATION_PROMPTS[lang].system;
  }

  getSceneAnalysisPrompt(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return SCENE_ANALYSIS_PROMPTS[lang].system;
  }

  getChatIntentPrompt(
    scene: 'careerAdvice' | 'generalChat',
    language: LanguageInput
  ): string {
    const lang = normalizeLanguage(language);
    return CHAT_INTENT_PROMPTS[lang][scene];
  }

  getPreparationGuidancePrompt(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return lang === 'ZH'
      ? `你是一位专业的面试教练。提供全面的面试准备指导。`
      : `You are an expert interview coach. Provide comprehensive interview preparation guidance.`;
  }

  buildInterviewContext(context: InterviewContext): string {
    const hasChinese = /[\u4e00-\u9fa5]/.test(
      context.candidateName + context.jobTitle + context.company
    );
    const lang = hasChinese ? 'ZH' : 'EN';
    const prompts = INTERVIEW_MOCK_PROMPTS[lang];
    return prompts.context(context);
  }

  buildFeedbackPrompt(
    context: FeedbackContext,
    language: LanguageInput
  ): string {
    const template = this.getInterviewFeedbackPrompt(language);
    return template
      .replace('{{jobTitle}}', context.jobTitle)
      .replace('{{company}}', context.company)
      .replace('{{requirements}}', context.requirements)
      .replace('{{candidateName}}', context.candidateName)
      .replace('{{transcript}}', context.transcript);
  }

  getFallbackResponse(language: LanguageInput): string {
    const lang = normalizeLanguage(language);
    return lang === 'ZH'
      ? '抱歉，无法生成回复。请稍后重试。'
      : 'Sorry, unable to generate response. Please try again later.';
  }

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
