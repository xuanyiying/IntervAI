import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AnswerEvaluationService } from '../services/answer-evaluation.service';

@Processor('interview-evaluation')
export class EvaluationProcessor {
  private readonly logger = new Logger(EvaluationProcessor.name);

  constructor(private readonly evaluationService: AnswerEvaluationService) {}

  @Process('evaluate')
  async handleEvaluation(job: Job<{ sessionId: string }>) {
    this.logger.log(`Processing evaluation for session ${job.data.sessionId}`);
    try {
      await this.evaluationService.evaluateSession(job.data.sessionId);
      this.logger.log(`Evaluation completed for session ${job.data.sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to evaluate session ${job.data.sessionId}`,
        error
      );
      throw error; // Retry job
    }
  }
}
