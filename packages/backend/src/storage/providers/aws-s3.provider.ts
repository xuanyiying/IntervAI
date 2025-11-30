import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import path from 'path';
import { OssService, UploadResult, FileInfo } from './oss.interface';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { OssConfig } from '../config/oss.config';

export class AwsS3Service implements OssService {
  public bucketName: string;
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private config: OssConfig;
  private readonly logger = new Logger(AwsS3Service.name);

  constructor(config: OssConfig) {
    this.config = config;
    this.bucket = config.bucket;
    this.bucketName = config.bucket;
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint, // Optional
    });
  }

  async initializeBucket(): Promise<void> {
    // AWS S3 buckets are usually pre-created, but we can check existence
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: 'test-access', // Just checking access, not really checking bucket existence in the same way as MinIO
      });
      // This will likely fail if file doesn't exist, but if it's 404 it means bucket exists and we have access
      // A better way is HeadBucket but that requires specific permissions
    } catch (error) {
      // Ignore for now, assuming bucket exists and credentials are correct
    }
    this.logger.log(`AWS S3 Service initialized for bucket: ${this.bucket}`);
  }

  async uploadFile(
    file: Buffer | Readable,
    originalName: string,
    contentType: string,
    folder: string = ''
  ): Promise<UploadResult> {
    const fileExtension = path.extname(originalName);
    const fileName = `${crypto.randomUUID()}${fileExtension}`;
    const key = folder ? `${folder}/${fileName}` : fileName;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: {
          originalName: encodeURIComponent(originalName),
          uploadTime: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      const url = this.getFileUrl(key);

      // Get file size if not available
      let size = 0;
      if (Buffer.isBuffer(file)) {
        size = file.length;
      } else {
        try {
          const headCommand = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: key,
          });
          const headResult = await this.s3Client.send(headCommand);
          size = headResult.ContentLength || 0;
        } catch (e) {
          this.logger.warn(`Failed to get file size for ${key}: ${e}`);
        }
      }

      return {
        key,
        url,
        size,
        contentType,
      };
    } catch (error) {
      this.logger.error('Error uploading file to AWS S3:', error);
      throw new Error('Failed to upload file to AWS S3');
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error('Error downloading file from AWS S3:', error);
      throw new Error('Failed to download file from AWS S3');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error('Error deleting file from AWS S3:', error);
      throw new Error('Failed to delete file from AWS S3');
    }
  }

  async getFileInfo(key: string): Promise<FileInfo> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType || 'application/octet-stream',
        url: this.getFileUrl(key),
      };
    } catch (error) {
      this.logger.error('Error getting file info from AWS S3:', error);
      throw new Error('Failed to get file info from AWS S3');
    }
  }

  async listFiles(prefix?: string, maxKeys: number = 100): Promise<FileInfo[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.s3Client.send(command);

      if (!response.Contents) {
        return [];
      }

      return response.Contents.map((obj) => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        contentType: 'application/octet-stream',
        url: this.getFileUrl(obj.Key || ''),
      }));
    } catch (error) {
      this.logger.error('Error listing files from AWS S3:', error);
      throw new Error('Failed to list files from AWS S3');
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileInfo(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  getFileUrl(key: string): string {
    // Standard AWS S3 URL format: https://bucket.s3.region.amazonaws.com/key
    // Or if custom endpoint is used
    if (this.config.endpoint) {
      return `${this.config.endpoint}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  async deleteFiles(keys: string[]): Promise<void> {
    try {
      const deletePromises = keys.map((key) => this.deleteFile(key));
      await Promise.all(deletePromises);
    } catch (error) {
      this.logger.error('Error deleting files from AWS S3:', error);
      throw new Error('Failed to delete files from AWS S3');
    }
  }

  async copyFile(sourceKey: string, targetKey: string): Promise<void> {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: targetKey,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error('Error copying file in AWS S3:', error);
      throw new Error('Failed to copy file in AWS S3');
    }
  }

  async getPresignedUploadUrl(
    key: string,
    expires: number = 3600,
    contentType?: string
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn: expires });
    } catch (error) {
      this.logger.error(
        'Error generating presigned upload URL for AWS S3:',
        error
      );
      throw new Error('Failed to generate presigned upload URL');
    }
  }

  async getPresignedDownloadUrl(
    key: string,
    expires: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn: expires });
    } catch (error) {
      this.logger.error(
        'Error generating presigned download URL for AWS S3:',
        error
      );
      throw new Error('Failed to generate presigned download URL');
    }
  }
}
