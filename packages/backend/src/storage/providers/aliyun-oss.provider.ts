// 需要先安装 ali-oss 及其类型声明文件
// npm install ali-oss @types/ali-oss
import OSS from 'ali-oss';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { OssService, UploadResult, FileInfo } from './oss.interface';
import { Readable } from 'stream';
import { OssConfig } from '@/storage/config/oss.config';

export class AliyunOssService implements OssService {
  public bucketName: string;
  private ossClient: OSS;
  private bucket: string;
  private config: OssConfig;

  constructor(config: OssConfig) {
    this.config = config;
    this.bucket = config.bucket;
    this.bucketName = config.bucket;
    this.ossClient = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.secretAccessKey,
      bucket: config.bucket,
      endpoint: config.endpoint,
      secure: config.secure !== false, // 默认使用HTTPS
    });
  }

  /**
   * 初始化存储桶
   */
  async initializeBucket(): Promise<void> {
    try {
      // 检查bucket是否存在
      const bucketInfo = await this.ossClient.getBucketInfo(this.bucket);
      const bucketName = bucketInfo.BucketInfo.BucketName;
      console.log(`OSS Bucket ${bucketName} already exists`);
    } catch (error: any) {
      if (error.code === 'NoSuchBucket') {
        try {
          await this.ossClient.putBucket(this.bucket);
          console.log(`OSS Bucket ${this.bucket} created successfully`);
        } catch (createError) {
          console.error('Error creating OSS bucket:', createError);
          throw createError;
        }
      } else {
        console.error('Error checking OSS bucket:', error);
        throw error;
      }
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(
    file: Buffer | Readable,
    originalName: string,
    contentType: string,
    folder?: string
  ): Promise<UploadResult> {
    try {
      // 生成唯一文件名
      const fileExtension = path.extname(originalName);
      const fileName = `${uuidv4()}${fileExtension}`;
      const key = folder ? `${folder}/${fileName}` : fileName;

      // 获取文件大小
      let fileSize = 0;
      if (Buffer.isBuffer(file)) {
        fileSize = file.length;
      } else if (
        file instanceof Readable &&
        (file as any).readableLength !== undefined
      ) {
        fileSize = (file as any).readableLength;
      }

      const result = await this.ossClient.put(key, file, {
        headers: {
          'Content-Type': contentType,
        },
        meta: {
          originalName,
          uploadTime: new Date().toISOString(),
          uid: 0,
          pid: 0,
        },
      });

      // 如果上传成功但无法预先获取大小，从结果中获取
      if (fileSize === 0 && result.res && result.res.size) {
        fileSize = parseInt(String(result.res.size), 10);
      }

      return {
        key,
        url: result.url,
        size: fileSize,
        contentType,
      };
    } catch (error) {
      console.error('Error uploading file to OSS:', error);
      throw new Error('Failed to upload file to OSS');
    }
  }

  /**
   * 下载文件
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const result = await this.ossClient.get(key);
      return result.content as Buffer;
    } catch (error) {
      console.error('Error downloading file from OSS:', error);
      throw new Error('Failed to download file from OSS');
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.ossClient.delete(key);
    } catch (error) {
      console.error('Error deleting file from OSS:', error);
      throw new Error('Failed to delete file from OSS');
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(key: string): Promise<FileInfo> {
    try {
      const result = await this.ossClient.head(key);

      const headers = result.res.headers as any;
      return {
        key,
        size: parseInt(headers['content-length'] || '0'),
        lastModified: new Date(headers['last-modified'] || new Date()),
        contentType: headers['content-type'] || 'application/octet-stream',
        url: this.getFileUrl(key),
      };
    } catch (error) {
      console.error('Error getting file info from OSS:', error);
      throw new Error('Failed to get file info from OSS');
    }
  }

  /**
   * 列出文件
   */
  async listFiles(prefix?: string, maxKeys: number = 100): Promise<FileInfo[]> {
    try {
      const result = await this.ossClient.list(
        {
          prefix: prefix,
          'max-keys': maxKeys,
        },
        {}
      );

      if (!result.objects) {
        return [];
      }

      return result.objects.map(
        (obj: {
          name: string;
          size: any;
          lastModified: string | number | Date;
        }) => ({
          key: obj.name,
          size: obj.size,
          lastModified: new Date(obj.lastModified),
          contentType: 'application/octet-stream', // OSS list不返回ContentType
          url: this.getFileUrl(obj.name),
        })
      );
    } catch (error) {
      console.error('Error listing files from OSS:', error);
      throw new Error('Failed to list files from OSS');
    }
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileInfo(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取文件访问URL
   */
  getFileUrl(key: string): string {
    // 如果配置了自定义域名，使用自定义域名
    if (
      this.config.endpoint &&
      !this.config.endpoint.includes('aliyuncs.com')
    ) {
      const protocol = this.config.secure !== false ? 'https' : 'http';
      return `${protocol}://${this.config.endpoint}/${key}`;
    }

    // 使用默认的OSS域名
    const protocol = this.config.secure !== false ? 'https' : 'http';
    return `${protocol}://${this.bucket}.${this.config.region}.aliyuncs.com/${key}`;
  }

  /**
   * 批量删除文件
   */
  async deleteFiles(keys: string[]): Promise<void> {
    try {
      if (keys.length === 0) return;

      // OSS支持批量删除，但有数量限制（1000个）
      const batchSize = 1000;
      const batches: any[] = [];

      for (let i = 0; i < keys.length; i += batchSize) {
        batches.push(keys.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await this.ossClient.deleteMulti(batch);
      }
    } catch (error) {
      console.error('Error deleting files from OSS:', error);
      throw new Error('Failed to delete files from OSS');
    }
  }

  /**
   * 复制文件
   */
  async copyFile(sourceKey: string, targetKey: string): Promise<void> {
    try {
      await this.ossClient.copy(targetKey, sourceKey);
    } catch (error) {
      console.error('Error copying file in OSS:', error);
      throw new Error('Failed to copy file in OSS');
    }
  }

  /**
   * 生成签名URL（用于临时访问私有文件）
   */
  async getSignedUrl(key: string, expires: number = 3600): Promise<string> {
    try {
      return this.ossClient.signatureUrl(key, { expires });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * 生成预签名上传URL
   */
  async getPresignedUploadUrl(
    key: string,
    expires: number = 3600,
    contentType?: string
  ): Promise<string> {
    try {
      const options: any = {
        expires,
        method: 'PUT',
      };

      if (contentType) {
        options['Content-Type'] = contentType;
      }

      return this.ossClient.signatureUrl(key, options);
    } catch (error) {
      console.error('Error generating presigned upload URL:', error);
      throw new Error('Failed to generate presigned upload URL');
    }
  }

  /**
   * 生成预签名下载URL
   */
  async getPresignedDownloadUrl(
    key: string,
    expires: number = 3600
  ): Promise<string> {
    try {
      return this.ossClient.signatureUrl(key, { expires, method: 'GET' });
    } catch (error) {
      console.error('Error generating presigned download URL:', error);
      throw new Error('Failed to generate presigned download URL');
    }
  }
}
