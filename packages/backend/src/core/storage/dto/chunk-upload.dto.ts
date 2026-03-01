export class ChunkUploadInitDto {
  filename: string;
  fileSize: number;
  mimeType: string;
  category: string;
  totalChunks: number;
}

export class ChunkUploadDto {
  uploadId: string;
  chunkIndex: number;
  chunkData: Buffer;
}

export class CheckChunkUploadStatusDto {
  uploadId: string;
}

export class CompleteChunkUploadDto {
  uploadId: string;
}
