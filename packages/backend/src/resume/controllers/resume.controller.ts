import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FILE_UPLOAD_CONFIG } from '../../common/validators/file-upload.validator';
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
    const userId = req.user.id;
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
    const userId = req.user.id;
    return this.resumeService.listResumes(userId);
  }

  /**
   * Get a specific resume by ID
   * GET /resumes/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific resume by ID' })
  async getResume(@Param('id') resumeId: string, @Request() req: any) {
    const userId = req.user.id;
    return this.resumeService.getResume(resumeId, userId);
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
    const userId = req.user.id;
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
    const userId = req.user.id;
    return this.resumeService.updateResume(resumeId, userId, dto);
  }

  /**
   * Set a resume as primary
   * PUT /resumes/:id/primary
   */
  @Put(':id/primary')
  @ApiOperation({ summary: 'Set a resume as primary' })
  async setPrimaryResume(@Param('id') resumeId: string, @Request() req: any) {
    const userId = req.user.id;
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
    const userId = req.user.id;
    return this.resumeService.analyzeResume(resumeId, userId);
  }

  /**
   * Delete a resume
   * DELETE /resumes/:id
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resume' })
  async deleteResume(@Param('id') resumeId: string, @Request() req: any) {
    const userId = req.user.id;
    await this.resumeService.deleteResume(resumeId, userId);
    return { message: 'Resume deleted successfully' };
  }
}
