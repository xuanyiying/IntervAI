import stream from 'stream';

/**
 * 存储服务接口
 * 定义统一的存储操作接口，支持各种OSS服务
 */
export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  contentType: string;
  url: string;
}

export interface OssService {
  bucketName: string;
  /**
   * 初始化存储桶
   */
  initializeBucket(): Promise<void>;

  /**
   * 上传文件
   * @param file 文件缓冲区或流
   * @param originalName 原始文件名
   * @param contentType 文件类型
   * @param folder 文件夹路径（可选）
   */
  uploadFile(
    file: Buffer | stream.Readable,
    originalName: string,
    contentType: string,
    folder?: string
  ): Promise<UploadResult>;

  /**
   * 下载文件
   * @param key 文件键
   */
  downloadFile(key: string): Promise<Buffer>;

  /**
   * 删除文件
   * @param key 文件键
   */
  deleteFile(key: string): Promise<void>;

  /**
   * 获取文件信息
   * @param key 文件键
   */
  getFileInfo(key: string): Promise<FileInfo>;

  /**
   * 列出文件
   * @param prefix 前缀过滤
   * @param maxKeys 最大返回数量
   */
  listFiles(prefix?: string, maxKeys?: number): Promise<FileInfo[]>;

  /**
   * 检查文件是否存在
   * @param key 文件键
   */
  fileExists(key: string): Promise<boolean>;

  /**
   * 获取文件访问URL
   * @param key 文件键
   */
  getFileUrl(key: string): string;

  /**
   * 批量删除文件
   * @param keys 文件键数组
   */
  deleteFiles(keys: string[]): Promise<void>;

  /**
   * 复制文件
   * @param sourceKey 源文件键
   * @param targetKey 目标文件键
   */
  copyFile(sourceKey: string, targetKey: string): Promise<void>;

  /**
   * 生成预签名上传URL
   * @param key 文件键
   * @param expires 过期时间（秒），默认3600秒
   * @param contentType 文件类型
   */
  getPresignedUploadUrl(
    key: string,
    expires?: number,
    contentType?: string
  ): Promise<string>;

  /**
   * 生成预签名下载URL
   * @param key 文件键
   * @param expires 过期时间（秒），默认3600秒
   */
  getPresignedDownloadUrl(key: string, expires?: number): Promise<string>;
}
