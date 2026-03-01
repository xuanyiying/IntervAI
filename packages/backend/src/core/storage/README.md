# Storage 模块 (文件存储)

统一的文件存储抽象层，支持本地存储、S3、OSS、MinIO 等多种后端。

## 目录结构

```
storage/
├── providers/              # 存储提供商实现
│   ├── local.provider.ts
│   ├── s3.provider.ts
│   ├── oss.provider.ts
│   └── minio.provider.ts
├── interfaces/             # 接口定义
├── storage.controller.ts   # API 控制器
├── storage.module.ts       # 模块配置
└── storage.service.ts      # 核心服务
```

## 支持的存储后端

| 提供商     | 用途场景   |
| ---------- | ---------- |
| Local      | 本地开发   |
| AWS S3     | 生产环境   |
| Aliyun OSS | 中国区部署 |
| MinIO      | 私有化部署 |

## 核心功能

### 1. 文件操作

- 上传文件
- 下载文件
- 删除文件
- 获取临时访问URL

### 2. 安全特性

- 预签名URL (有效期配置)
- 文件类型验证
- 大小限制检查
- 病毒扫描接口 (可选)

### 3. 元数据管理

- 文件类型
- 文件大小
- 上传时间
- MD5校验

## API 端点

```
POST   /storage/upload          # 上传文件
GET    /storage/:key            # 下载文件
DELETE /storage/:key            # 删除文件
GET    /storage/:key/url        # 获取预签名URL
```

## 配置

```env
# 存储选择
STORAGE_PROVIDER=local    # local | s3 | oss | minio

# 本地存储
LOCAL_STORAGE_PATH=./uploads

# AWS S3
S3_BUCKET=my-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx

# 阿里云 OSS
OSS_BUCKET=my-bucket
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY=xxx
OSS_SECRET_KEY=xxx

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

## 使用示例

```typescript
import { StorageService } from './storage.service';

// 上传文件
const result = await this.storageService.upload({
  file: buffer,
  filename: 'resume.pdf',
  contentType: 'application/pdf',
  folder: 'resumes',
});

// 获取下载URL (有效期1小时)
const url = await this.storageService.getSignedUrl(result.key, 3600);

// 删除文件
await this.storageService.delete(result.key);
```

## 接口定义

```typescript
interface StorageProvider {
  upload(options: UploadOptions): Promise<UploadResult>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn: number): Promise<string>;
  exists(key: string): Promise<boolean>;
}
```

## 最佳实践

1. **生产环境** 使用 S3/OSS，配合 CDN
2. **开发环境** 使用 Local 或 MinIO
3. 设置合理的 **预签名URL有效期**
4. 启用 **文件类型白名单**
