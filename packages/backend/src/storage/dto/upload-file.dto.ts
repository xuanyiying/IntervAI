import { FileType } from '../interfaces/storage.interface';

export class UploadFileDto {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  userId: string;
  fileType: FileType;
  category?: string;
  description?: string;
}

export class BatchUploadDto {
  files: UploadFileDto[];
}
