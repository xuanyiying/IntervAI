# Storage 模块

统一的文件存储抽象，支持分片上传、预签名直传与文件元数据管理。代码位于 `src/modules/storage/`。

## 目录结构

```
storage/
├── adapters/                    # 外部对象存储实现
│   ├── aws-s3.provider.ts       # AWS S3
│   ├── aliyun-oss.provider.ts   # 阿里云 OSS
│   ├── minio.provider.ts        # MinIO（默认）
│   └── oss.factory.ts           # 按 OSS_TYPE 选择实现
├── config/oss.config.ts         # 环境变量读取
├── controllers/                 # REST 控制器
├── services/                    # 存储业务服务（含分片 / 预签名直传）
├── dto/、interfaces/            # 请求 DTO 与存储契约
└── storage.module.ts
```

## 配置

后端通过 `OSS_TYPE`（默认 `MINIO`）选择 provider，配置来自 `config/oss.config.ts` 与对应 provider：

```env
OSS_TYPE=MINIO
OSS_ENDPOINT=http://localhost:9000
OSS_REGION=us-east-1
OSS_ACCESS_KEY=minioadmin
OSS_SECRET_KEY=minioadmin
OSS_BUCKET=resume-files
OSS_PATH_STYLE=true
OSS_PUBLIC_ENDPOINT=https://oss.example.com   # 浏览器访问用
```

S3 provider 另读取 `S3_SSE`、`S3_KMS_KEY_ID`。`.env.production.example` 中的 `STORAGE_PROVIDER`、`AWS_ACCESS_KEY_ID` / `AWS_S3_BUCKET`、`MINIO_*` 等命名**未被运行时代码读取**，请勿据此配置。

## API 端点

控制器前缀为 `/storage`，实际挂在全局前缀 `/api/v1` 下，且多数接口使用 `JwtAuthGuard`：

```
POST   /api/v1/storage/upload                     # 单文件上传
POST   /api/v1/storage/upload-batch              # 批量上传
GET    /api/v1/storage/files                     # 文件列表
GET    /api/v1/storage/files/:id                 # 文件详情
GET    /api/v1/storage/files/:id/download       # 下载
PUT    /api/v1/storage/files/:id                 # 更新
DELETE /api/v1/storage/files/:id                 # 删除
POST   /api/v1/storage/files/delete-batch       # 批量删除
GET    /api/v1/storage/stats                    # 统计
POST   /api/v1/storage/direct-upload/presigned-url
POST   /api/v1/storage/direct-upload/chunk/init | /chunk/url | /chunk/confirm | /chunk/complete
POST   /api/v1/storage/direct-upload/confirm | /cancel
GET    /api/v1/storage/direct-upload/progress/:uploadSessionId
```

上传体积与类型由 `common/validators/file-upload.validator.ts` 校验（上限 10 MB）；文件元数据落在 Prisma 的 `Storage` 模型。

## 相关文档

- [系统架构](../../../../../docs/architecture/system-architecture.md) · [部署环境变量](../../../../../deployment/README.md) · [后端 README](../../../README.md)
