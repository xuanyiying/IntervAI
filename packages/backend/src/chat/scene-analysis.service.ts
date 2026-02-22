import { Injectable, Logger } from '@nestjs/common';
import { AIEngineService } from '@/ai-providers/ai-engine.service';
import { RedisService } from '@/redis/redis.service';
import { ScenarioType } from '@/ai-providers/interfaces/model.interface';

export interface SceneAnalysisResult {
  scene: string;
  confidence: number;
  reasoning: string;
  entities: Record<string, any>;
  suggestedActions: string[];
  contextFactors: string[];
}

export interface SceneContext {
  userId: string;
  conversationId?: string;
  previousMessages?: Array<{ role: string; content: string }>;
  userMetadata?: Record<string, any>;
  hasResume?: boolean;
  hasJobDescription?: boolean;
}

const SCENE_CACHE_TTL = 3600;

@Injectable()
export class SceneAnalysisService {
  private readonly logger = new Logger(SceneAnalysisService.name);

  constructor(
    private readonly aiEngineService: AIEngineService,
    private readonly redisService: RedisService
  ) {}

  async analyzeScene(
    content: string,
    context: SceneContext
  ): Promise<SceneAnalysisResult> {
    this.logger.debug(`Analyzing scene for user ${context.userId}`);

    const cacheKey = await this.getCacheKey(content, context);
    const cached = await this.getCachedResult(cacheKey);
    if (cached) {
      this.logger.debug(
        `Using cached scene analysis for user ${context.userId}`
      );
      return cached;
    }

    try {
      const result = await this.performAIAnalysis(content, context);

      await this.cacheResult(cacheKey, result);

      return result;
    } catch (error) {
      this.logger.error(
        `AI scene analysis failed: ${error instanceof Error ? error.message : String(error)}`
      );

      return this.getFallbackAnalysis(content, context);
    }
  }

  private async performAIAnalysis(
    content: string,
    context: SceneContext
  ): Promise<SceneAnalysisResult> {
    const systemPrompt = this.buildSystemPrompt(context);
    const contextInfo = this.buildContextInfo(context);

    const prompt = `${systemPrompt}

${contextInfo}

User Message: "${content}"

Analyze this message and determine the user's intent/scene. Return a JSON object with:
- scene: One of [optimize_resume, parse_resume, mock_interview, interview_prediction, parse_job_description, career_advice, skill_analysis, salary_negotiation, full_optimization, interview_preparation, career_transition, competitive_analysis, general_chat, help, unknown]
- confidence: Number between 0 and 1
- reasoning: Brief explanation of why this scene was identified
- entities: Object containing extracted entities (e.g., {"resumeId": "123", "jobTitle": "Software Engineer"})
- suggestedActions: Array of suggested next actions
- contextFactors: Array of context factors that influenced the decision

Return JSON only, no markdown.`;

    const response = await this.aiEngineService.call(
      {
        model: '',
        prompt,
        temperature: 0.3,
        maxTokens: 500,
      },
      context.userId,
      ScenarioType.AGENT_RESPONSE_ANALYSIS
    );

    try {
      const parsed = JSON.parse(response.content);
      return {
        scene: parsed.scene || 'unknown',
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        reasoning: parsed.reasoning || 'No reasoning provided',
        entities: parsed.entities || {},
        suggestedActions: Array.isArray(parsed.suggestedActions)
          ? parsed.suggestedActions
          : [],
        contextFactors: Array.isArray(parsed.contextFactors)
          ? parsed.contextFactors
          : [],
      };
    } catch (parseError) {
      this.logger.warn(
        `Failed to parse AI scene analysis response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
      return this.getFallbackAnalysis(content, context);
    }
  }

  private buildSystemPrompt(context: SceneContext): string {
    return `You are an intelligent scene analyzer for a career services platform. Your job is to understand user intent and categorize their requests into appropriate scenes.

Available Scenes:
1. optimize_resume - User wants to improve/polish their resume (simple optimization)
2. parse_resume - User wants to analyze or extract information from resume
3. mock_interview - User wants to practice interview scenarios
4. interview_prediction - User wants to predict interview questions
5. parse_job_description - User wants to analyze a job posting
6. career_advice - User seeks general career guidance
7. skill_analysis - User wants to analyze their skills
8. salary_negotiation - User wants help with salary discussions
9. full_optimization - User wants comprehensive resume optimization based on JD (uses multi-agent team)
10. interview_preparation - User wants comprehensive interview preparation (uses multi-agent team)
11. career_transition - User wants career transition analysis (uses multi-agent team)
12. competitive_analysis - User wants competitive analysis between their skills and JD (uses multi-agent team)
13. general_chat - General conversation or unclear intent
14. help - User is asking for help or instructions
15. unknown - Cannot determine intent

Guidelines:
- Consider the user's context (has resume, has JD, conversation history)
- Look for implicit intent, not just explicit keywords
- Provide confidence scores based on clarity of intent
- Extract relevant entities (dates, job titles, skills, etc.)
- Suggest appropriate next actions
- If user mentions both resume and JD together, prefer full_optimization over simple optimize_resume`;
  }

  private buildContextInfo(context: SceneContext): string {
    const parts: string[] = ['Context Information:'];

    if (context.hasResume) {
      parts.push('- User has uploaded a resume');
    } else {
      parts.push('- User has NOT uploaded a resume');
    }

    if (context.hasJobDescription) {
      parts.push('- User has provided a job description');
    }

    if (context.previousMessages && context.previousMessages.length > 0) {
      const recentMessages = context.previousMessages.slice(-3);
      parts.push(
        `- Recent conversation:\n${recentMessages.map((m) => `  ${m.role}: ${m.content.substring(0, 100)}...`).join('\n')}`
      );
    }

    if (context.userMetadata) {
      if (context.userMetadata.targetRole) {
        parts.push(`- Target role: ${context.userMetadata.targetRole}`);
      }
      if (context.userMetadata.experienceLevel) {
        parts.push(
          `- Experience level: ${context.userMetadata.experienceLevel}`
        );
      }
    }

    return parts.join('\n');
  }

  private async getCacheKey(
    content: string,
    context: SceneContext
  ): Promise<string> {
    const normalizedContent = content.toLowerCase().trim().substring(0, 200);
    const contextHash = this.hashContext(context);
    return `scene_analysis:${context.userId}:${this.simpleHash(normalizedContent + contextHash)}`;
  }

  private hashContext(context: SceneContext): string {
    const relevant = {
      hasResume: context.hasResume,
      hasJobDescription: context.hasJobDescription,
      msgCount: context.previousMessages?.length || 0,
    };
    return JSON.stringify(relevant);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private async getCachedResult(
    cacheKey: string
  ): Promise<SceneAnalysisResult | null> {
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to get cached scene analysis: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    return null;
  }

  private async cacheResult(
    cacheKey: string,
    result: SceneAnalysisResult
  ): Promise<void> {
    try {
      await this.redisService.set(
        cacheKey,
        JSON.stringify(result),
        SCENE_CACHE_TTL
      );
    } catch (error) {
      this.logger.warn(
        `Failed to cache scene analysis: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private getFallbackAnalysis(
    content: string,
    context: SceneContext
  ): SceneAnalysisResult {
    const lowerContent = content.toLowerCase();

    const keywordMap: Record<string, { scene: string; keywords: string[] }> = {
      optimize_resume: {
        scene: 'optimize_resume',
        keywords: [
          '优化',
          '改进',
          '润色',
          '提升',
          'optimize',
          'improve',
          'enhance',
          'polish',
        ],
      },
      mock_interview: {
        scene: 'mock_interview',
        keywords: ['模拟面试', '面试', '练习', 'mock', 'interview', 'practice'],
      },
      interview_prediction: {
        scene: 'interview_prediction',
        keywords: [
          '面试预测',
          '预测',
          '题目',
          '考题',
          'prediction',
          'questions',
        ],
      },
      parse_job_description: {
        scene: 'parse_job_description',
        keywords: ['职位', 'jd', 'job', 'description', '招聘'],
      },
      help: {
        scene: 'help',
        keywords: ['帮助', '怎么用', '如何', 'help', 'how to', 'guide'],
      },
    };

    for (const [, config] of Object.entries(keywordMap)) {
      for (const keyword of config.keywords) {
        if (lowerContent.includes(keyword)) {
          return {
            scene: config.scene,
            confidence: 0.7,
            reasoning: `Matched keyword: "${keyword}"`,
            entities: {},
            suggestedActions: [],
            contextFactors: ['keyword_fallback'],
          };
        }
      }
    }

    return {
      scene: 'general_chat',
      confidence: 0.5,
      reasoning: 'No specific intent detected, defaulting to general chat',
      entities: {},
      suggestedActions: context.hasResume
        ? ['optimize_resume', 'mock_interview']
        : ['upload_resume'],
      contextFactors: ['default_fallback'],
    };
  }

  async analyzeBatch(
    messages: Array<{ content: string; context: SceneContext }>
  ): Promise<SceneAnalysisResult[]> {
    this.logger.log(`Batch analyzing ${messages.length} messages`);

    const results = await Promise.all(
      messages.map(({ content, context }) =>
        this.analyzeScene(content, context)
      )
    );

    return results;
  }

  async getSceneSuggestions(scene: string): Promise<string[]> {
    const suggestions: Record<string, string[]> = {
      optimize_resume: [
        '分析简历亮点',
        '优化工作经历描述',
        '提升技能关键词匹配',
        '改进简历结构',
      ],
      mock_interview: [
        '开始技术面试模拟',
        '开始行为面试模拟',
        '针对特定职位练习',
        '获取面试技巧',
      ],
      interview_prediction: [
        '预测技术问题',
        '预测行为问题',
        '获取回答建议',
        '查看核心考点',
      ],
      parse_job_description: [
        '提取核心要求',
        '分析技能匹配度',
        '生成定制简历建议',
        '准备面试要点',
      ],
      general_chat: [
        '上传简历开始优化',
        '输入职位描述分析',
        '开始模拟面试',
        '获取求职建议',
      ],
    };

    return suggestions[scene] || suggestions['general_chat'];
  }
}
