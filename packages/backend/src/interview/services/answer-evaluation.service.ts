import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AIEngine } from '@/ai';
import { ParsedJobData, ParsedResumeData } from '@/types';

@Injectable()
export class AnswerEvaluationService {
  private readonly logger = new Logger(AnswerEvaluationService.name);

  constructor(
    private prisma: PrismaService,
    private aiEngine: AIEngine
  ) {}

  /**
   * Evaluate a completed interview session
   * Generates score and feedback based on the transcript
   */
  async evaluateSession(sessionId: string): Promise<void> {
    try {
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
        this.logger.error(`Session ${sessionId} not found for evaluation`);
        return;
      }

      const resumeData = session.optimization.resume
        .parsedData as unknown as ParsedResumeData;
      const jobData = session.optimization.job
        .parsedRequirements as unknown as ParsedJobData;

      const jobTitle = session.optimization.job.title || 'Unknown Role';
      const company = session.optimization.job.company || 'Unknown Company';

      const requirements = [
        ...(jobData.requiredSkills || []),
        ...(jobData.responsibilities || []),
      ].join('; ');

      const transcript = session.messages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

      const prompt = `
You are an expert interview coach. Review the following interview transcript for a ${jobTitle} position at ${company}.
Job Requirements: ${requirements.substring(0, 500)}...
Candidate: ${resumeData.personalInfo.name}

Transcript:
${transcript}

Provide a comprehensive evaluation including:
1. Overall Score (0-100)
2. Key Strengths (bullet points)
3. Areas for Improvement (bullet points)
4. Detailed Feedback on specific answers

Format the output as JSON:
{
  "score": number,
  "feedback": "markdown string"
}
`;

      const result = await this.aiEngine.generate(prompt, {
        temperature: 0.7,
        maxTokens: 2000,
      });

      // Parse JSON from result
      let parsedResult: { score: number; feedback: string };
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (e) {
        // Fallback if parsing fails
        parsedResult = {
          score: 70,
          feedback: result,
        };
      }

      await this.prisma.interviewSession.update({
        where: { id: session.id },
        data: {
          score: parsedResult.score,
          feedback: parsedResult.feedback,
        },
      });

      this.logger.log(`Session ${sessionId} evaluated successfully`);
    } catch (error) {
      this.logger.error(`Error evaluating session ${sessionId}:`, error);
      throw error;
    }
  }
}
