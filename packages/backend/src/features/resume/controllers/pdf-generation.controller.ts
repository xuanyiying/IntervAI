import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  Res,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Response } from 'express';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import PdfGenerationService, {
  PDFOptions,
} from '../services/pdf-generation.service';
import { ParsedResumeData } from '../../../types';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('PDF Generation')
@ApiBearerAuth()
@Controller('generate')
@UseGuards(JwtAuthGuard)
export class PdfGenerationController {
  private readonly logger = new Logger(PdfGenerationController.name);

  constructor(
    private pdfGenerationService: PdfGenerationService,
    @InjectQueue('pdf_queue') private readonly pdfQueue: Queue
  ) {}

  /**
   * Generate PDF from resume
   * POST /api/v1/generate/pdf
   */
  @Post('pdf')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate PDF from resume' })
  @ApiResponse({
    status: 201,
    description: 'PDF generated successfully',
  })
  async generatePDF(
    @Request() req: any,
    @Body()
    body: {
      optimizationId: string;
      templateId: string;
      resumeData: ParsedResumeData;
      options: PDFOptions;
    }
  ) {
    this.logger.log(
      `Queueing PDF generation for optimization ${body.optimizationId}`
    );

    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    const job = await this.pdfQueue.add('generate_pdf', {
      optimizationId: body.optimizationId,
      userId,
      templateId: body.templateId,
      resumeData: body.resumeData,
      options: body.options,
    });

    // Add timeout and error handling for job completion
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF generation timeout')), 30000)
    );

    try {
      const generatedPDF = await Promise.race([job.finished(), timeoutPromise]);
      return {
        success: true,
        data: generatedPDF,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`PDF generation failed: ${message}`);
      throw new ServiceUnavailableException('PDF generation timeout');
    }
  }

  /**
   * Preview PDF as HTML
   * POST /api/v1/generate/preview
   */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview PDF as HTML' })
  @ApiResponse({
    status: 200,
    description: 'HTML preview returned successfully',
  })
  async previewPDF(
    @Request() req: any,
    @Body()
    body: {
      optimizationId: string;
      templateId: string;
      resumeData: ParsedResumeData;
      options: PDFOptions;
    }
  ) {
    this.logger.log(`Previewing PDF for optimization ${body.optimizationId}`);

    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    const html = await this.pdfGenerationService.previewPDF(
      body.optimizationId,
      userId,
      body.templateId,
      body.resumeData,
      body.options
    );

    return {
      success: true,
      data: { html },
    };
  }

  /**
   * Get generated PDF details
   * GET /api/v1/generate/pdfs/:id
   */
  @Get('pdfs/:id')
  @ApiOperation({ summary: 'Get generated PDF details' })
  @ApiResponse({
    status: 200,
    description: 'PDF details retrieved successfully',
  })
  async getGeneratedPDF(@Request() req: any, @Param('id') pdfId: string) {
    this.logger.log(`Fetching PDF details: ${pdfId}`);

    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    const pdf = await this.pdfGenerationService.getGeneratedPDF(pdfId, userId);

    return {
      success: true,
      data: pdf,
    };
  }

  /**
   * List generated PDFs for an optimization
   * GET /api/v1/generate/optimizations/:optimizationId/pdfs
   */
  @Get('optimizations/:optimizationId/pdfs')
  @ApiOperation({ summary: 'List generated PDFs for an optimization' })
  @ApiResponse({
    status: 200,
    description: 'PDFs retrieved successfully',
  })
  async listGeneratedPDFs(
    @Request() req: any,
    @Param('optimizationId') optimizationId: string
  ) {
    this.logger.log(`Fetching PDFs for optimization: ${optimizationId}`);

    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    const pdfs = await this.pdfGenerationService.listGeneratedPDFs(
      optimizationId,
      userId
    );

    return {
      success: true,
      data: pdfs,
    };
  }

  /**
   * Download PDF file
   * GET /api/v1/generate/pdfs/:id/download
   */
  @Get('pdfs/:id/download')
  @ApiOperation({ summary: 'Download PDF file' })
  @ApiResponse({
    status: 200,
    description: 'PDF file downloaded successfully',
  })
  async downloadPDF(
    @Request() req: any,
    @Param('id') pdfId: string,
    @Res() res: Response
  ) {
    this.logger.log(`Downloading PDF: ${pdfId}`);

    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    const buffer = await this.pdfGenerationService.downloadPDF(pdfId, userId);

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="resume-${pdfId}.pdf"`
    );
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  }

  /**
   * Delete generated PDF
   * DELETE /api/v1/generate/pdfs/:id
   */
  @Post('pdfs/:id/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete generated PDF' })
  @ApiResponse({
    status: 200,
    description: 'PDF deleted successfully',
  })
  async deleteGeneratedPDF(@Request() req: any, @Param('id') pdfId: string) {
    this.logger.log(`Deleting PDF: ${pdfId}`);

    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    await this.pdfGenerationService.deleteGeneratedPDF(pdfId, userId);

    return {
      success: true,
      message: 'PDF deleted successfully',
    };
  }

  /**
   * Generate PDF from Markdown content
   * POST /api/v1/generate/pdf/from-markdown
   */
  @Post('pdf/from-markdown')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate PDF from Markdown content' })
  @ApiResponse({
    status: 201,
    description: 'PDF generated successfully from Markdown',
  })
  async generatePDFFromMarkdown(
    @Request() req: any,
    @Body()
    body: {
      markdown: string;
      options?: {
        fontSize?: number;
        margin?: { top: number; bottom: number; left: number; right: number };
      };
    }
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    this.logger.log(`Queueing PDF from Markdown for user ${userId}`);

    const job = await this.pdfQueue.add('generate_pdf', {
      isMarkdown: true,
      markdownContent: body.markdown,
      userId,
      options: body.options,
      optimizationId: 'markdown',
      templateId: 'markdown',
    });

    // Add timeout and error handling for job completion
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF generation timed out')), 60000)
    );

    try {
      const result = await Promise.race([job.finished(), timeoutPromise]);
      return {
        success: true,
        data: {
          downloadUrl: result.downloadUrl,
          expiresAt: result.expiresAt,
          fileSize: null, // Will be available after generation
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Markdown PDF generation failed: ${message}`);
      throw new ServiceUnavailableException(
        'Markdown PDF generation failed or timed out. Please try again later.'
      );
    }
  }
}
