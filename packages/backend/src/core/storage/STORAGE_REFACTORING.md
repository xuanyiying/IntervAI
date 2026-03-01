# Storage Module Refactoring Plan

## 当前问题

1. **文件重复**
   - `storage.service.ts` - 本地存储（旧代码）
   - `file.service.ts` - 完整OSS集成（新代码）
   - `fs.service.ts` - 简单文件系统服务
   - 三个服务功能重叠

2. **架构不清晰**
   - Controller 放在 `oss/` 子目录中
   - 服务层职责不明确
   - 缺少统一的模块export

3. **代码依赖混乱**
   - 有些代码使用Sequelize（旧ORM）
   - 有些代码使用Prisma（新ORM）
   - OSS配置散落各处

## 重构目标

创建清晰的模块结构：

```
storage/
├── storage.module.ts          # 主模块
├── storage.controller.ts      # HTTP 控制器
├── storage.service.ts         # 核心存储服务
├── direct-upload.service.ts   # 直传服务
├── dto/                       # DTO 定义
│   ├── upload-file.dto.ts
│   ├── direct-upload.dto.ts
│   └── chunk-upload.dto.ts
├── interfaces/                # 接口定义
│   └── storage.interface.ts
└── providers/                 # OSS Provider 实现
    ├── oss.interface.ts       # 统一OSS接口
    ├── oss.factory.ts         # Provider工厂
    ├── minio.provider.ts      # MinIO实现
    ├── aws-s3.provider.ts     # AWS S3实现
    ├── aliyun-oss.provider.ts # 阿里云OSS实现
    └── tencent-cos.provider.ts# 腾讯云COS实现
```

## 重构步骤

### 1. 合并服务层

**保留**: `storage.service.ts`

- 作为核心服务
- 整合 file.service.ts 的功能
- 使用 Prisma ORM
- 提供服务端上传、下载、管理功能

**保留**: `direct-upload.service.ts`

- 专注于直传功能
- 生成预签名URL
- 管理上传会话

**删除**:

- `fs.service.ts` (功能合并到 storage.service.ts)
- 旧的 `storage.service.ts` (使用本地文件系统的版本)

### 2. 重组 OSS Providers

**重命名**:

- `oss/oss.service.ts` → `providers/oss.interface.ts`
- `oss/oss.factory.ts` → `providers/oss.factory.ts`
- `oss/minio.service.ts` → `providers/minio.provider.ts`
- `oss/aliyun-oss.service.ts` → `providers/aliyun-oss.provider.ts`

**新增**:

- `providers/aws-s3.provider.ts` (S3原生支持)
- `providers/tencent-cos.provider.ts` (腾讯云COS)

### 3. 移动Controller

**移动**:

- `oss/file.controller.ts` → `storage.controller.ts`
- 转换为 NestJS Controller 装饰器风格
- 添加适当的Guards和Interceptors

### 4. 统一DTO

创建规范的DTO文件：

- `UploadFileDto` - 单文件上传
- `BatchUploadDto` - 批量上传
- `GeneratePresignedUrlDto` - 生成预签名URL
- `ConfirmUploadDto` - 确认上传
- `ChunkUploadInitDto` - 初始化分片
- `ChunkUploadDto` - 上传分片

### 5. Prisma Schema

确保File模型完整：

```prisma
model Storage {
  id            String   @id @default(uuid())
  userId        String
  filename      String
  originalName  String
  fileSize      Int
  mimeType      String
  fileUrl       String
  filePath      String   // OSS Key
  hashMd5       String
  fileType      FileType
  category      String?
  thumbnailUrl  String?
  ossType       OssType
  isPublic      Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([fileType])
  @@index([hashMd5])
}

enum FileType {
  IMAGE
  VIDEO
  DOCUMENT
  AUDIO
  OTHER
}

enum OssType {
  MINIO
  AWS_S3
  ALIYUN_OSS
  TENCENT_COS
  LOCAL
}
```

## 实施清单

- [x] 创建新的目录结构
- [x] 重构 storage.service.ts
- [x] 保持 direct-upload.service.ts
- [x] 重组 OSS providers
- [x] 创建 storage.controller.ts
- [x] 创建 DTO 文件
- [x] 更新 storage.module.ts
- [x] 添加 AWS S3 provider
- [x] 添加 Tencent COS provider
- [x] 创建统一的 OSS 配置服务
- [x] 实现 Redis 分片上传会话管理
- [x] 修复代码错误（类型安全、参数顺序）
- [x] 删除冗余文件
- [x] 更新 Prisma schema
- [ ] 编写单元测试
- [ ] 更新文档

## 完成的工作

### 1. 目录结构重组

- ✅ 创建了清晰的模块结构
- ✅ 整理了 DTO 文件到 `dto/` 目录
- ✅ 整理了接口文件到 `interfaces/` 目录
- ✅ 保留了 `providers/` 目录用于 OSS 实现

### 2. 服务层合并

- ✅ 合并 `storage.service.ts` 和 `file.service.ts` 功能
- ✅ 使用 Prisma ORM 替代 Sequelize
- ✅ 保留 `direct-upload.service.ts` 用于直传功能
- ✅ 删除了冗余的 `fs.service.ts`

### 3. Controller 重构

- ✅ 创建了 NestJS 风格的 `storage.controller.ts`
- ✅ 使用装饰器模式替代 Express 中间件
- ✅ 整合了文件上传、下载、删除等功能
- ✅ 删除了旧的 Express 风格 controller

### 4. DTO 定义

- ✅ `upload-file.dto.ts` - 单文件和批量上传
- ✅ `direct-upload.dto.ts` - 直传相关 DTO
- ✅ `chunk-upload.dto.ts` - 分块上传相关 DTO

### 5. 接口定义

- ✅ `storage.interface.ts` - 统一的存储接口和类型定义
- ✅ 定义了 FileType 和 OssType 枚举

### 6. Prisma Schema

- ✅ 添加了 Storage 模型
- ✅ 添加了 FileType 和 OssType 枚举
- ✅ 建立了 User 和 Storage 的关系

### 7. 模块导出

- ✅ 创建了 `index.ts` 用于统一导出

## 最新完成的工作 (2025-11-30)

### 1. 统一 OSS 配置管理

- ✅ 创建 `config/oss.config.ts` - 统一的 OSS 配置服务
- ✅ 支持通过 `OSS_TYPE` 环境变量切换不同的 OSS 提供商
- ✅ 支持的提供商：MINIO, AWS_S3, ALIYUN_OSS, TENCENT_COS
- ✅ 从环境变量自动构建配置
- ✅ 配置验证功能

### 2. Redis 分片上传会话管理

- ✅ 创建 `services/chunk-upload-session.service.ts`
- ✅ 使用 Redis 存储上传会话状态
- ✅ 支持分片上传进度跟踪
- ✅ 自动过期清理（2小时 TTL）
- ✅ 会话状态管理：pending, uploading, completed, failed, cancelled

### 3. 新增 OSS Provider

- ✅ `providers/aws-s3.provider.ts` - AWS S3 原生支持
- ✅ `providers/tencent-cos.provider.ts` - 腾讯云 COS 支持
- ✅ 更新 `providers/oss.factory.ts` - 支持所有提供商

### 4. 代码错误修复

- ✅ 修复 `storage.controller.ts` 中的类型错误
  - 移除 `any` 类型，使用 `RequestWithUser` 接口
  - 修复参数顺序问题（必需参数不能在可选参数之后）
- ✅ 更新 `storage.service.ts` 使用新的配置服务
- ✅ 重构 `direct-upload.service.ts` 集成分片上传功能

### 5. 分片上传功能

新增以下 API 端点：

- `POST /api/v1/storage/direct-upload/chunk/init` - 初始化分片上传
- `POST /api/v1/storage/direct-upload/chunk/url` - 获取分片上传 URL
- `POST /api/v1/storage/direct-upload/chunk/confirm` - 确认分片上传
- `POST /api/v1/storage/direct-upload/chunk/complete` - 完成分片上传

### 6. 环境变量配置

更新 `.env.example` 包含：

- 统一的 OSS 配置格式
- 支持所有 OSS 提供商的配置示例
- 清晰的配置说明和注释

### 7. 模块导出

更新 `index.ts` 导出：

- `ChunkUploadSessionService`
- `OssConfigService`
- `OssTypeEnum`
- `OssFactory`

## 架构改进

### 配置管理

```typescript
// 旧方式：配置散落在各处
const config = {
  endpoint: process.env.OSS_ENDPOINT,
  // ...
};

// 新方式：统一配置服务
constructor(private ossConfigService: OssConfigService) {
  const config = this.ossConfigService.getConfig();
  this.ossService = OssFactory.getInstance(config);
}
```

### 分片上传流程

```
1. 客户端调用 /chunk/init 初始化上传
   ↓
2. 服务端创建 Redis 会话，返回 uploadSessionId
   ↓
3. 客户端循环：
   - 调用 /chunk/url 获取分片上传 URL
   - 直接上传分片到 OSS
   - 调用 /chunk/confirm 确认分片上传
   ↓
4. 所有分片上传完成后，调用 /chunk/complete
   ↓
5. 服务端创建文件记录，清理 Redis 会话
```

### OSS 提供商切换

只需修改环境变量 `OSS_TYPE`，无需修改代码：

```bash
# 使用 MinIO (本地开发)
OSS_TYPE=MINIO

# 使用 AWS S3 (生产环境)
OSS_TYPE=AWS_S3

# 使用阿里云 OSS
OSS_TYPE=ALIYUN_OSS

# 使用腾讯云 COS
OSS_TYPE=TENCENT_COS
```

## 待完成工作

1. **单元测试**
   - OssConfigService 测试
   - ChunkUploadSessionService 测试
   - 各个 Provider 的测试
   - 分片上传流程测试

2. **文档更新**
   - API 文档
   - 部署文档
   - 配置指南

3. **性能优化**
   - 分片上传并发控制
   - 大文件上传优化
   - Redis 连接池优化

4. **错误处理**
   - 更详细的错误信息
   - 重试机制
   - 失败恢复策略
