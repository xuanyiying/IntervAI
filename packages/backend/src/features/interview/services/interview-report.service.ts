import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { AIEngine } from '@/core/ai';
import { ParsedJobData, ParsedResumeData } from '@/types';
import { InterviewStatus, MessageRole } from '@prisma/client';

export interface InterviewReportAnalysis {
  overallScore: number;
  dimensions: {
    accuracy: number;
    fluency: number;
    logicalThinking: number;
    professionalKnowledge: number;
    communication: number;
    confidence: number;
  };
  strengths: string[];
  improvements: string[];
  detailedAnalysis: {
    questionId: string;
    question: string;
    answer: string;
    score: number;
    feedback: string;
    keywords: string[];
    suggestions: string[];
  }[];
  recommendations: string[];
  nextSteps: string[];
}

export interface InterviewReport {
  sessionId: string;
  generatedAt: string;
  candidateInfo: {
    name: string;
    email?: string;
  };
  jobInfo: {
    title: string;
    company: string;
  };
  interviewDuration: number;
  totalQuestions: number;
  answeredQuestions: number;
  transcript: {
    role: string;
    content: string;
    timestamp: string;
  }[];
  analysis: InterviewReportAnalysis;
  markdown: string;
}

@Injectable()
export class InterviewReportService {
  private readonly logger = new Logger(InterviewReportService.name);

  constructor(
    private prisma: PrismaService,
    private aiEngine: AIEngine
  ) {}

  async generateReport(
    sessionId: string,
    userId: string
  ): Promise<InterviewReport> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        optimization: {
          include: {
            resume: true,
            job: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this session'
      );
    }

    if (session.status !== InterviewStatus.COMPLETED) {
      throw new ForbiddenException(
        'Interview session must be completed before generating report'
      );
    }

    const resumeData = session.optimization.resume
      .parsedData as unknown as ParsedResumeData;
    const jobData = session.optimization.job
      .parsedRequirements as unknown as ParsedJobData;

    const questions = await this.prisma.interviewQuestion.findMany({
      where: { optimizationId: session.optimizationId },
      orderBy: { createdAt: 'asc' },
    });

    const analysis = await this.analyzeInterview(
      session,
      questions,
      resumeData,
      jobData
    );

    const transcript = session.messages.map((m) => ({
      role: m.role === MessageRole.USER ? '候选人' : '面试官',
      content: m.content,
      timestamp: m.createdAt.toISOString(),
    }));

    const startTime = new Date(session.startTime);
    const endTime = session.endTime ? new Date(session.endTime) : new Date();
    const duration = Math.round(
      (endTime.getTime() - startTime.getTime()) / 1000 / 60
    );

    const report: InterviewReport = {
      sessionId: session.id,
      generatedAt: new Date().toISOString(),
      candidateInfo: {
        name: resumeData.personalInfo?.name || '未知候选人',
        email: resumeData.personalInfo?.email,
      },
      jobInfo: {
        title: session.optimization.job.title || '未知职位',
        company: session.optimization.job.company || '未知公司',
      },
      interviewDuration: duration,
      totalQuestions: questions.length,
      answeredQuestions: session.messages.filter(
        (m) => m.role === MessageRole.USER
      ).length,
      transcript,
      analysis,
      markdown: '',
    };

    report.markdown = this.generateMarkdown(report);

    return report;
  }

  private async analyzeInterview(
    session: any,
    questions: any[],
    resumeData: ParsedResumeData,
    jobData: ParsedJobData
  ): Promise<InterviewReportAnalysis> {
    const jobTitle = session.optimization.job.title || 'Unknown Role';
    const company = session.optimization.job.company || 'Unknown Company';
    const requirements = [
      ...(jobData.requiredSkills || []),
      ...(jobData.responsibilities || []),
    ].join('; ');

    const messages = session.messages;
    const userMessages = messages.filter(
      (m: any) => m.role === MessageRole.USER
    );
    const assistantMessages = messages.filter(
      (m: any) => m.role === MessageRole.ASSISTANT
    );

    const transcript = messages
      .map((m: any) => `${m.role}: ${m.content}`)
      .join('\n');

    const analysisPrompt = `你是一位资深的面试评估专家。请对以下模拟面试进行全面、专业的分析评估。

## 面试背景
- 职位: ${jobTitle}
- 公司: ${company}
- 候选人: ${resumeData.personalInfo?.name || '候选人'}
- 职位要求: ${requirements.substring(0, 800)}

## 面试记录
${transcript}

## 评估要求
请从以下维度进行专业评估，并以JSON格式返回结果：

1. **准确性评估 (accuracy: 0-100)**: 回答内容的技术准确性、事实正确性
2. **表达流畅度 (fluency: 0-100)**: 语言表达是否清晰流畅、有条理
3. **逻辑思维能力 (logicalThinking: 0-100)**: 回答是否有逻辑性、层次分明
4. **专业知识掌握程度 (professionalKnowledge: 0-100)**: 对相关领域知识的掌握深度
5. **沟通能力 (communication: 0-100)**: 与面试官的互动质量、倾听能力
6. **自信心 (confidence: 0-100)**: 回答时的自信程度、态度表现

请返回以下JSON格式：
{
  "overallScore": 0-100,
  "dimensions": {
    "accuracy": 0-100,
    "fluency": 0-100,
    "logicalThinking": 0-100,
    "professionalKnowledge": 0-100,
    "communication": 0-100,
    "confidence": 0-100
  },
  "strengths": ["优势1", "优势2", "优势3"],
  "improvements": ["改进点1", "改进点2", "改进点3"],
  "detailedAnalysis": [
    {
      "questionId": "问题序号",
      "question": "问题内容",
      "answer": "回答内容摘要",
      "score": 0-100,
      "feedback": "针对该问题的具体反馈",
      "keywords": ["关键词1", "关键词2"],
      "suggestions": ["建议1", "建议2"]
    }
  ],
  "recommendations": ["整体建议1", "整体建议2"],
  "nextSteps": ["下一步行动1", "下一步行动2"]
}

请确保返回纯JSON格式，不要包含任何其他文字。`;

    try {
      const result = await this.aiEngine.generate(analysisPrompt, {
        temperature: 0.7,
        maxTokens: 4000,
      });

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAndNormalizeAnalysis(
          parsed,
          questions,
          userMessages
        );
      }
    } catch (error) {
      this.logger.error('Error analyzing interview:', error);
    }

    return this.getDefaultAnalysis(questions, userMessages);
  }

  private validateAndNormalizeAnalysis(
    parsed: any,
    questions: any[],
    userMessages: any[]
  ): InterviewReportAnalysis {
    const normalizeScore = (score: number) =>
      Math.min(100, Math.max(0, score || 50));

    const dimensions = {
      accuracy: normalizeScore(parsed.dimensions?.accuracy),
      fluency: normalizeScore(parsed.dimensions?.fluency),
      logicalThinking: normalizeScore(parsed.dimensions?.logicalThinking),
      professionalKnowledge: normalizeScore(
        parsed.dimensions?.professionalKnowledge
      ),
      communication: normalizeScore(parsed.dimensions?.communication),
      confidence: normalizeScore(parsed.dimensions?.confidence),
    };

    const overallScore = Math.round(
      dimensions.accuracy * 0.25 +
        dimensions.fluency * 0.15 +
        dimensions.logicalThinking * 0.2 +
        dimensions.professionalKnowledge * 0.25 +
        dimensions.communication * 0.1 +
        dimensions.confidence * 0.05
    );

    const detailedAnalysis = (parsed.detailedAnalysis || [])
      .slice(0, userMessages.length)
      .map((item: any, index: number) => ({
        questionId: `Q${index + 1}`,
        question: questions[index]?.question || item.question || '未知问题',
        answer:
          item.answer || userMessages[index]?.content?.substring(0, 200) || '',
        score: normalizeScore(item.score),
        feedback: item.feedback || '暂无详细反馈',
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
        suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
      }));

    return {
      overallScore: normalizeScore(parsed.overallScore || overallScore),
      dimensions,
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths.slice(0, 5)
        : ['表现稳定', '态度认真'],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements.slice(0, 5)
        : ['需要更多练习', '可以更深入'],
      detailedAnalysis,
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.slice(0, 5)
        : ['继续加强专业知识学习'],
      nextSteps: Array.isArray(parsed.nextSteps)
        ? parsed.nextSteps.slice(0, 5)
        : ['建议进行更多模拟面试'],
    };
  }

  private getDefaultAnalysis(
    questions: any[],
    userMessages: any[]
  ): InterviewReportAnalysis {
    return {
      overallScore: 65,
      dimensions: {
        accuracy: 65,
        fluency: 65,
        logicalThinking: 65,
        professionalKnowledge: 65,
        communication: 65,
        confidence: 65,
      },
      strengths: ['完成了面试流程', '态度认真'],
      improvements: ['需要更多练习', '可以更深入回答问题'],
      detailedAnalysis: userMessages
        .slice(0, questions.length)
        .map((msg, index) => ({
          questionId: `Q${index + 1}`,
          question: questions[index]?.question || '未知问题',
          answer: msg.content?.substring(0, 200) || '',
          score: 65,
          feedback: '需要更详细的分析',
          keywords: [],
          suggestions: ['建议提供更完整的回答'],
        })),
      recommendations: ['建议进行更多模拟面试练习'],
      nextSteps: ['继续加强专业知识学习', '提升表达能力'],
    };
  }

  private generateMarkdown(report: InterviewReport): string {
    const { analysis } = report;

    const dimensionLabels: Record<string, string> = {
      accuracy: '回答准确性',
      fluency: '表达流畅度',
      logicalThinking: '逻辑思维能力',
      professionalKnowledge: '专业知识掌握',
      communication: '沟通能力',
      confidence: '自信心',
    };

    const getScoreEmoji = (score: number) => {
      if (score >= 80) return '🟢';
      if (score >= 60) return '🟡';
      return '🔴';
    };

    const getScoreLevel = (score: number) => {
      if (score >= 90) return '优秀';
      if (score >= 80) return '良好';
      if (score >= 70) return '中等';
      if (score >= 60) return '及格';
      return '需改进';
    };

    let md = `# 模拟面试报告

## 基本信息

| 项目 | 内容 |
|------|------|
| **候选人** | ${report.candidateInfo.name} |
| **邮箱** | ${report.candidateInfo.email || '未提供'} |
| **应聘职位** | ${report.jobInfo.title} |
| **目标公司** | ${report.jobInfo.company} |
| **面试时长** | ${report.interviewDuration} 分钟 |
| **问题数量** | ${report.answeredQuestions}/${report.totalQuestions} |
| **报告生成时间** | ${new Date(report.generatedAt).toLocaleString('zh-CN')} |

---

## 综合评分

### 总分: ${analysis.overallScore} 分 (${getScoreLevel(analysis.overallScore)})

### 各维度评分

| 维度 | 得分 | 等级 |
|------|------|------|
${Object.entries(analysis.dimensions)
  .map(
    ([key, value]) =>
      `| ${dimensionLabels[key] || key} | ${getScoreEmoji(value)} ${value} 分 | ${getScoreLevel(value)} |`
  )
  .join('\n')}

---

## 面试记录

### 完整对话

`;
    report.transcript.forEach((msg, index) => {
      const time = new Date(msg.timestamp).toLocaleTimeString('zh-CN');
      md += `**[${time}] ${msg.role}**:\n\n${msg.content}\n\n---\n\n`;
    });

    md += `## 问题回答详情

`;
    analysis.detailedAnalysis.forEach((item, index) => {
      md += `### 问题 ${index + 1}: ${item.question}

**回答摘要**: ${item.answer || '（未作答）'}

**得分**: ${getScoreEmoji(item.score)} ${item.score} 分

**反馈**: ${item.feedback}

`;
      if (item.keywords.length > 0) {
        md += `**关键词**: ${item.keywords.map((k) => `\`${k}\``).join(' ')}\n\n`;
      }
      if (item.suggestions.length > 0) {
        md += `**改进建议**:\n${item.suggestions.map((s) => `- ${s}`).join('\n')}\n\n`;
      }
      md += '---\n\n';
    });

    md += `## 表现分析

### 优势亮点

${analysis.strengths.map((s) => `- ✅ ${s}`).join('\n')}

### 需要改进

${analysis.improvements.map((i) => `- ⚠️ ${i}`).join('\n')}

---

## 改进建议

${analysis.recommendations.map((r) => `- 💡 ${r}`).join('\n')}

---

## 下一步行动

${analysis.nextSteps.map((n) => `- 🎯 ${n}`).join('\n')}

---

## 评分说明

- 🟢 **80-100分**: 优秀/良好 - 表现出色，继续保持
- 🟡 **60-79分**: 中等/及格 - 有一定基础，需要加强
- 🔴 **60分以下**: 需改进 - 建议重点练习

---

*本报告由 IntervAI 自动生成，仅供参考。*
`;

    return md;
  }
}
