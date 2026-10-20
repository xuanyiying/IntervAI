import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Res,
  UseGuards,
  UseInterceptors,
  Body,
  Param,
  Query,
  Request,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UnauthorizedException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { FILE_UPLOAD_CONFIG } from '../../../common/validators/file-upload.validator';
import { ResumeService } from '../services/resume.service';
import { UploadResumeDto } from '../dto/upload-resume.dto';
import { UpdateResumeDto } from '../dto/update-resume.dto';

@Controller('resumes')
@UseGuards(JwtAuthGuard)
@ApiTags('resumes')
@ApiBearerAuth()
export class ResumeController {
  constructor(private resumeService: ResumeService) {}

  /**
   * Upload a new resume file
   * POST /resumes/upload
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: FILE_UPLOAD_CONFIG.MAX_FILE_SIZE,
      },
    })
  )
  @ApiOperation({ summary: 'Upload a new resume file' })
  @ApiConsumes('multipart/form-data')
  async uploadResume(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: FILE_UPLOAD_CONFIG.MAX_FILE_SIZE,
          }),
          new FileTypeValidator({
            fileType:
              /(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|plain|markdown|x-markdown)/,
          }),
        ],
      })
    )
    file: Express.Multer.File,
    @Body() dto: UploadResumeDto,
    @Request() req: any
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeService.uploadResume(
      userId,
      file,
      dto.title,
      dto.conversationId
    );
  }

  /**
   * Get all resumes for the current user
   * GET /resumes
   */
  @Get()
  @ApiOperation({ summary: 'Get all resumes for the current user' })
  async listResumes(@Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeService.listResumes(userId);
  }

  /**
   * Get a specific resume by ID
   * GET /resumes/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific resume by ID' })
  async getResume(@Param('id') resumeId: string, @Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeService.getResume(resumeId, userId);
  }

  /**
   * Stream the original resume file (for preview/download)
   * GET /resumes/:id/file
   */
  @Get(':id/file')
  @ApiOperation({ summary: 'Stream the original resume file' })
  async getResumeFile(
    @Param('id') resumeId: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: any
  ): Promise<StreamableFile> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    const { buffer, fileType, filename } = await this.resumeService.getResumeFile(
      resumeId,
      userId
    );

    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      txt: 'text/plain',
      md: 'text/markdown',
      markdown: 'text/markdown',
    };
    if (!mimeMap[fileType]) {
      throw new NotFoundException(`Unsupported file type: ${fileType}`);
    }

    res.setHeader('Content-Type', mimeMap[fileType]);
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    return new StreamableFile(buffer);
  }

  /**
   * Parse a resume file
   * GET /resumes/:id/parse?conversationId=xxx
   */
  @Get(':id/parse')
  @ApiOperation({ summary: 'Parse a resume file and extract structured data' })
  async parseResume(
    @Param('id') resumeId: string,
    @Request() req: any,
    @Query('conversationId') conversationId?: string
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeService.parseResume(resumeId, userId, conversationId);
  }

  /**
   * Update resume data
   * PUT /resumes/:id
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update resume data and create new version' })
  async updateResume(
    @Param('id') resumeId: string,
    @Body() dto: UpdateResumeDto,
    @Request() req: any
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeService.updateResume(resumeId, userId, dto);
  }

  /**
   * Set a resume as primary
   * PUT /resumes/:id/primary
   */
  @Put(':id/primary')
  @ApiOperation({ summary: 'Set a resume as primary' })
  async setPrimaryResume(@Param('id') resumeId: string, @Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeService.setPrimaryResume(resumeId, userId);
  }

  /**
   * Analyze a resume
   * GET /resumes/:id/analyze
   */
  @Get(':id/analyze')
  @ApiOperation({
    summary: 'Analyze a resume and provide scoring and suggestions',
  })
  async analyzeResume(@Param('id') resumeId: string, @Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeService.analyzeResume(resumeId, userId);
  }

  /**
   * Delete a resume
   * DELETE /resumes/:id
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resume' })
  async deleteResume(@Param('id') resumeId: string, @Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    await this.resumeService.deleteResume(resumeId, userId);
    return { message: 'Resume deleted successfully' };
  }
}
