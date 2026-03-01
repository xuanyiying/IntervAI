import { FileType } from '../interfaces/storage.interface';

export class GeneratePresignedUrlDto {
  fileName: string;
  fileSize: number;
  contentType: string;
  fileType: FileType;
  category?: string;
  expires?: number;
}

export class ConfirmUploadDto {
  uploadSessionId: string;
  actualFileSize?: number;
}

export class CancelUploadDto {
  uploadSessionId: string;
}

export class GetUploadProgressDto {
  uploadSessionId: string;
}
