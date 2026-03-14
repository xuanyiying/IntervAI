import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import {
  InterviewQuestion,
  InterviewSession,
  InterviewMessage,
} from '@prisma/client';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { QuestionGeneratorService } from './services/question-generator.service';
import { InterviewSessionService } from './services/interview-session.service';
import { AIService, Models, AIEngine } from '@/core/ai';
import { GetPreparationGuideDto } from './dto/get-preparation-guide.dto';

@Injectable()
export class InterviewService {
  constructor(
    private prisma: PrismaService,
    private questionGenerator: QuestionGeneratorService,
    private sessionService: InterviewSessionService,
    private aiService: AIService,
    private aiEngine: AIEngine
  ) { }

  async getPreparationGuide(dto: GetPreparationGuideDto): Promise<string> {
    const systemPrompt = `You are an expert interview coach. Provide comprehensive interview preparation guidance.`;

    const userPrompt = `Please provide interview preparation guidance based on:

Resume: ${dto.resumeData ? JSON.stringify(dto.resumeData) : 'Not provided'}
Job Description: ${dto.jobDescription || 'Not provided'}
Question/Scenario: ${dto.question || 'General preparation'}
Type: ${dto.type || 'general'}
Language: ${dto.language || 'en'}`;

    const result = await this.aiService.chat(
      Models.InterviewPrep,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7 }
    );
    return result.content;
  }

  async generateQuestions(
    optimizationId: string,
    userId: string,
    count: number = 12
  ): Promise<InterviewQuestion[]> {
    return this.questionGenerator.generateQuestions(
      optimizationId,
      userId,
      count
    );
  }

  async getQuestions(
    optimizationId: string,
    userId: string
  ): Promise<InterviewQuestion[]> {
    const optimization = await this.prisma.optimization.findUnique({
      where: { id: optimizationId },
    });

    if (!optimization) {
      throw new NotFoundException(
        `Optimization with ID ${optimizationId} not found`
      );
    }

    if (optimization.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this optimization'
      );
    }

    return this.prisma.interviewQuestion.findMany({
      where: { optimizationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async exportInterviewPrep(
    optimizationId: string,
    userId: string
  ): Promise<string> {
    const questions = await this.getQuestions(optimizationId, userId);

    if (questions.length === 0) {
      throw new NotFoundException(
        'No interview questions found for this optimization'
      );
    }

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Interview Preparation Guide</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 20px; }
    .question { margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; }
    .question-text { font-weight: bold; color: #333; margin-bottom: 10px; }
    .answer { margin: 10px 0; }
    .tips { margin: 10px 0; padding: 10px; background: #e7f3ff; border-radius: 4px; }
    .tips-title { font-weight: bold; color: #0056b3; }
    .difficulty { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
    .difficulty.easy { background: #d4edda; color: #155724; }
    .difficulty.medium { background: #fff3cd; color: #856404; }
    .difficulty.hard { background: #f8d7da; color: #721c24; }
    .type { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #e2e3e5; color: #383d41; }
  </style>
</head>
<body>
  <h1>Interview Preparation Guide</h1>
  <p>This guide contains interview questions and suggested answers to help you prepare for your interview.</p>
`;

    const questionsByType = this.groupQuestionsByType(questions);

    for (const [type, typeQuestions] of Object.entries(questionsByType)) {
      html += `<h2>${this.formatQuestionType(type)} Questions (${typeQuestions.length})</h2>`;

      typeQuestions.forEach((q, index) => {
        html += `
  <div class="question">
    <div class="question-text">
      Q${index + 1}: ${this.escapeHtml(q.question)}
      <span class="type">${this.formatQuestionType(q.questionType)}</span>
      <span class="difficulty ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
    </div>
    <div class="answer">
      <strong>Suggested Answer:</strong>
      <p>${this.escapeHtml(q.suggestedAnswer).replace(/\n/g, '<br>')}</p>
    </div>
    ${q.tips && q.tips.length > 0
            ? `
    <div class="tips">
      <div class="tips-title">Tips:</div>
      <ul>
        ${q.tips.map((tip) => `<li>${this.escapeHtml(tip)}</li>`).join('')}
      </ul>
    </div>`
            : ''
          }
  </div>`;
      });
    }

    html += `
</body>
</html>`;

    return html;
  }

  private groupQuestionsByType(
    questions: InterviewQuestion[]
  ): Record<string, InterviewQuestion[]> {
    return questions.reduce((acc, question) => {
      const type = question.questionType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(question);
      return acc;
    }, {} as Record<string, InterviewQuestion[]>);
  }

  private formatQuestionType(type: string): string {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private escapeHtml(text: string): string {
    const div = { toString: () => '' };
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async createSession(
    userId: string,
    dto: CreateSessionDto
  ): Promise<{ session: InterviewSession; firstQuestion: InterviewQuestion | null }> {
    return this.sessionService.startSession(userId, dto);
  }

  async sendMessage(
    sessionId: string,
    userId: string,
    dto: SendMessageDto
  ): Promise<{ userMessage: InterviewMessage; aiMessage: InterviewMessage }> {
    return this.sessionService.handleMessage(userId, sessionId, dto);
  }

  async endSession(
    sessionId: string,
    userId: string,
  ): Promise<InterviewSession> {
    return this.sessionService.endSession(userId, { sessionId });
  }

  async getSession(sessionId: string, userId: string): Promise<InterviewSession> {
    return this.sessionService.getSession(userId, sessionId);
  }

  async getSessionMessages(
    sessionId: string,
    userId: string
  ): Promise<InterviewMessage[]> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { messages: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this session');
    }

    return session.messages;
  }

  async getUserSessions(userId: string): Promise<InterviewSession[]> {
    return this.prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveSessionByOptimization(
    userId: string,
    optimizationId: string
  ): Promise<InterviewSession | null> {
    return this.sessionService.getActiveSessionByOptimization(userId, optimizationId);
  }

  async transcribeAudio(file: Express.Multer.File): Promise<{ text: string }> {
    const text = await this.aiEngine.transcribeAudio(file.buffer);
    return { text };
  }
}
