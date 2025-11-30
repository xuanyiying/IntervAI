import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { DirectUploadService } from './direct-upload.service';
import { FileType } from './interfaces/storage.interface';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
  };
}

@Controller('/storage')
export class StorageController {
  constructor(
    private storageService: StorageService,
    private directUploadService: DirectUploadService
  ) {}

  /**
   * Upload single file
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, unknown>,
    @Req() req: RequestWithUser
  ) {
    const { fileType, category } = body;
    const userId = req.user?.id || 'anonymous';

    return this.storageService.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      userId,
      fileType: fileType as FileType,
      category: category as string,
    });
  }

  /**
   * Upload multiple files
   */
  @Post('upload-batch')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: Record<string, unknown>,
    @Req() req: RequestWithUser
  ) {
    const { fileType, category } = body;
    const userId = req.user?.id || 'anonymous';

    const filesData = files.map((file) => ({
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      userId,
      fileType: fileType as FileType,
      category: category as string,
    }));

    return this.storageService.uploadFiles(filesData);
  }

  /**
   * Get file list
   */
  @Get('files')
  async getFiles(
    @Req() req: RequestWithUser,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('fileType') fileType?: string,
    @Query('keyword') keyword?: string
  ) {
    return this.storageService.getFiles({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      userId: req.user?.id,
      fileType: fileType as FileType,
      keyword,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
  }

  /**
   * Get file by ID
   */
  @Get('files/:id')
  async getFileById(@Param('id') id: string) {
    return this.storageService.getFileById(id);
  }

  /**
   * Delete file
   */
  @Delete('files/:id')
  async deleteFile(@Param('id') id: string, @Req() req: RequestWithUser) {
    await this.storageService.deleteFile(id, req.user?.id || 'anonymous');
    return { message: 'File deleted successfully' };
  }

  /**
   * Delete multiple files
   */
  @Post('files/delete-batch')
  async deleteFiles(
    @Body() body: { ids: string[] },
    @Req() req: RequestWithUser
  ) {
    return this.storageService.deleteFiles(
      body.ids,
      req.user?.id || 'anonymous'
    );
  }

  /**
   * Download file
   */
  @Get('files/:id/download')
  async downloadFile(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.storageService.downloadFile(id, req.user?.id);
  }

  /**
   * Get file statistics
   */
  @Get('stats')
  async getFileStats(@Req() req: RequestWithUser) {
    return this.storageService.getFileStats(req.user?.id);
  }

  /**
   * Update file
   */
  @Put('files/:id')
  async updateFile(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: RequestWithUser
  ) {
    return this.storageService.updateFile(
      id,
      body,
      req.user?.id || 'anonymous'
    );
  }

  /**
   * Generate presigned upload URL
   */
  @Post('direct-upload/presigned-url')
  async getPresignedUrl(
    @Body() body: Record<string, unknown>,
    @Req() req: RequestWithUser
  ) {
    return this.directUploadService.generatePresignedUrl({
      userId: req.user?.id || 'anonymous',
      fileName: body.fileName as string,
      fileSize: body.fileSize as number,
      contentType: body.contentType as string,
      fileType: body.fileType as FileType,
      category: body.category as string,
      expires: body.expires as number,
    });
  }

  /**
   * Initialize chunk upload
   */
  @Post('direct-upload/chunk/init')
  async initializeChunkUpload(
    @Body() body: Record<string, unknown>,
    @Req() req: RequestWithUser
  ) {
    return this.directUploadService.initializeChunkUpload({
      userId: req.user?.id || 'anonymous',
      fileName: body.fileName as string,
      fileSize: body.fileSize as number,
      contentType: body.contentType as string,
      fileType: body.fileType as FileType,
      category: body.category as string,
      totalChunks: body.totalChunks as number,
      chunkSize: body.chunkSize as number,
    });
  }

  /**
   * Generate chunk upload URL
   */
  @Post('direct-upload/chunk/url')
  async generateChunkUploadUrl(
    @Body() body: Record<string, unknown>,
    @Req() req: RequestWithUser
  ) {
    return this.directUploadService.generateChunkUploadUrl({
      uploadSessionId: body.uploadSessionId as string,
      userId: req.user?.id || 'anonymous',
      chunkIndex: body.chunkIndex as number,
      expires: body.expires as number,
    });
  }

  /**
   * Confirm chunk uploaded
   */
  @Post('direct-upload/chunk/confirm')
  async confirmChunkUploaded(
    @Body() body: Record<string, unknown>,
    @Req() req: RequestWithUser
  ) {
    return this.directUploadService.confirmChunkUploaded({
      uploadSessionId: body.uploadSessionId as string,
      userId: req.user?.id || 'anonymous',
      chunkIndex: body.chunkIndex as number,
    });
  }

  /**
   * Complete chunk upload
   */
  @Post('direct-upload/chunk/complete')
  async completeChunkUpload(
    @Body() body: Record<string, unknown>,
    @Req() req: RequestWithUser
  ) {
    return this.directUploadService.completeChunkUpload({
      uploadSessionId: body.uploadSessionId as string,
      userId: req.user?.id || 'anonymous',
    });
  }

  /**
   * Confirm upload
   */
  @Post('direct-upload/confirm')
  async confirmUpload(
    @Body() body: Record<string, unknown>,
    @Req() req: RequestWithUser
  ) {
    return this.directUploadService.confirmUpload({
      uploadSessionId: body.uploadSessionId as string,
      userId: req.user?.id || 'anonymous',
      actualFileSize: body.actualFileSize as number,
    });
  }

  /**
   * Cancel upload
   */
  @Post('direct-upload/cancel')
  async cancelUpload(
    @Body() body: Record<string, unknown>,
    @Req() req: RequestWithUser
  ) {
    await this.directUploadService.cancelUpload(
      req.user?.id || 'anonymous',
      body.uploadSessionId as string
    );
    return { message: 'Upload cancelled' };
  }

  /**
   * Get upload progress
   */
  @Get('direct-upload/progress/:uploadSessionId')
  async getUploadProgress(
    @Param('uploadSessionId') uploadSessionId: string,
    @Req() req: RequestWithUser
  ) {
    return this.directUploadService.getUploadProgress(
      req.user?.id || 'anonymous',
      uploadSessionId
    );
  }
}
