import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PdfGenerationService } from '../services/pdf-generation.service';
import { ParsedResumeData } from '@/types';

export interface GeneratePdfJobData {
  optimizationId: string;
  userId: string;
  templateId: string;
  resumeData: ParsedResumeData;
  options: any;
  isMarkdown?: boolean;
  markdownContent?: string;
}

@Processor('pdf_queue')
export class PdfProcessor {
  private readonly logger = new Logger(PdfProcessor.name);

  constructor(private readonly pdfGenerationService: PdfGenerationService) {}

  @Process('generate_pdf')
  async handleGeneratePdf(job: Job<GeneratePdfJobData>) {
    this.logger.log(
      `Processing PDF generation job ${job.id} for optimization ${job.data.optimizationId}`
    );

    try {
      const {
        optimizationId,
        userId,
        templateId,
        resumeData,
        options,
        isMarkdown,
        markdownContent,
      } = job.data;

      let result;
      if (isMarkdown && markdownContent) {
        result = await this.pdfGenerationService.generatePDFFromMarkdown(
          markdownContent,
          userId,
          options
        );
      } else {
        result = await this.pdfGenerationService.generatePDF(
          optimizationId,
          userId,
          templateId,
          resumeData,
          options
        );
      }

      this.logger.log(`Successfully processed PDF generation job ${job.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process PDF generation job ${job.id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }
}
