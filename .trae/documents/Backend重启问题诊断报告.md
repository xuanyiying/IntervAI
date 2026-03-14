# Backend 服务重启问题诊断报告

## 问题描述

生产环境部署后，backend 容器一直处于重启状态，无法正常运行。

## 可能原因分析

### 1. 数据库连接问题 ⚠️ 高优先级

#### 问题表现

- Backend 启动时无法连接到 PostgreSQL
- 配置中的服务名不匹配

#### 根本原因

在 `.env.production` 中发现配置不一致：

```bash
# 环境变量中使用的是 'postgres'
DATABASE_URL="postgresql://postgres:secure_postgres_2025@postgres:5432/interview_ai?..."

# 但 docker-compose.prod.yml 中 MinIO 服务名是 'minio-prod'
OSS_ENDPOINT=http://minio-prod:9000
```

**关键问题**：

- `docker-compose.prod.yml` 中 PostgreSQL 服务名是 `postgres`
- Backend 的 `depends_on` 配置正确
- 但可能存在启动顺序问题或健康检查超时

#### 解决方案

```bash
# 1. 检查 PostgreSQL 是否正常运行
docker ps | grep postgres

# 2. 检查 PostgreSQL 日志
docker logs postgres

# 3. 测试数据库连接
docker exec -it postgres psql -U postgres -d interview_ai -c "SELECT 1;"

# 4. 检查网络连接
docker exec -it backend ping postgres
```

### 2. Redis 连接问题 ⚠️ 高优先级

#### 问题表现

- Backend 启动时 Redis 连接失败
- WebSocket adapter 初始化失败

#### 根本原因

在 `main.ts` 中：

```typescript
const redisUrl =
  redisPassword && redisPassword.length > 0
    ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
    : `redis://${redisHost}:${redisPort}`;
app.useWebSocketAdapter(new RedisIoAdapter(app, redisUrl));
```

如果 Redis 未就绪，会导致应用启动失败。

#### 解决方案

```bash
# 1. 检查 Redis 是否运行
docker ps | grep redis

# 2. 测试 Redis 连接
docker exec -it redis redis-cli -a secure_redis_2025 ping

# 3. 检查 Redis 日志
docker logs redis
```

### 3. Prisma 迁移问题 ⚠️ 中优先级

#### 问题表现

- 数据库 schema 未初始化
- Prisma Client 生成失败

#### 根本原因

Dockerfile 中的构建流程：

```dockerfile
# Stage 2: Build
RUN cd packages/backend && pnpm prisma generate
RUN cd packages/backend && pnpm run build

# Stage 3: Runtime
RUN npm install -g prisma@5.22.0 && \
    cd /app/deploy && \
    prisma generate
```

可能问题：

- 运行时 Prisma Client 版本不匹配
- 数据库迁移未执行

#### 解决方案

```bash
# 1. 进入 backend 容器检查
docker exec -it backend sh

# 2. 检查 Prisma Client
ls -la node_modules/.prisma/client/

# 3. 手动执行迁移
docker exec -it backend npx prisma migrate deploy

# 4. 重新生成 Prisma Client
docker exec -it backend npx prisma generate
```

### 4. 环境变量缺失 ⚠️ 中优先级

#### 问题表现

- 必需的环境变量未设置
- 配置验证失败

#### 检查清单

```bash
# 必需的环境变量
✓ DATABASE_URL
✓ REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
✓ JWT_SECRET
✓ OSS_ENDPOINT, OSS_ACCESS_KEY, OSS_SECRET_KEY
? QWEN_API_KEY (AI 功能需要)
? GOOGLE_CLIENT_SECRET (OAuth 需要)
```

在 `.env.production` 中发现：

```bash
GOOGLE_CLIENT_SECRET=your-google-client-secret  # ❌ 未配置
```

#### 解决方案

```bash
# 检查容器内的环境变量
docker exec -it backend env | grep -E "DATABASE|REDIS|JWT|OSS"
```

### 5. 健康检查配置问题 ⚠️ 低优先级

#### 问题表现

Docker 健康检查失败导致容器被标记为 unhealthy 并重启

#### 配置检查

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
  interval: 30s
  timeout: 10s
  start_period: 60s # 给 60 秒启动时间
  retries: 3
```

#### 解决方案

```bash
# 1. 检查健康检查端点
docker exec -it backend curl -f http://localhost:3000/health

# 2. 查看健康检查日志
docker inspect backend | jq '.[0].State.Health'
```

### 6. 资源限制问题 ⚠️ 低优先级

#### 问题表现

- 内存不足导致 OOM
- CPU 限制导致启动超时

#### 配置检查

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G
```

#### 解决方案

```bash
# 检查容器资源使用
docker stats backend

# 检查系统资源
free -h
df -h
```

## 诊断步骤

### 第一步：查看容器状态

```bash
# 查看所有容器状态
docker ps -a

# 查看 backend 容器详细信息
docker inspect backend
```

### 第二步：查看日志

```bash
# 查看 backend 启动日志（最重要）
docker logs backend --tail 200

# 查看 PostgreSQL 日志
docker logs postgres --tail 100

# 查看 Redis 日志
docker logs redis --tail 100

# 实时监控日志
docker logs -f backend
```

### 第三步：检查依赖服务

```bash
# 检查 PostgreSQL
docker exec -it postgres pg_isready -U postgres

# 检查 Redis
docker exec -it redis redis-cli -a secure_redis_2025 ping

# 检查 ChromaDB
docker exec -it chromadb curl http://localhost:8000/api/v1/heartbeat

# 检查 MinIO
docker exec -it minio curl http://localhost:9000/minio/health/live
```

### 第四步：检查网络连接

```bash
# 检查 backend 到 postgres 的连接
docker exec -it backend ping postgres

# 检查 backend 到 redis 的连接
docker exec -it backend ping redis

# 检查网络配置
docker network inspect deployment_app-network
```

### 第五步：手动测试启动

```bash
# 停止 backend
docker stop backend

# 手动启动并查看输出
docker start backend && docker logs -f backend
```

## 快速修复方案

### 方案 1：重新构建并部署

```bash
cd /path/to/project

# 停止所有服务
docker compose -f deployment/docker-compose.prod.yml down

# 清理旧容器和镜像
docker system prune -a

# 重新构建
docker compose -f deployment/docker-compose.prod.yml build --no-cache backend

# 启动依赖服务
docker compose -f deployment/docker-compose.prod.yml up -d postgres redis chromadb minio

# 等待 30 秒让服务就绪
sleep 30

# 执行数据库迁移
docker compose -f deployment/docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# 启动 backend
docker compose -f deployment/docker-compose.prod.yml up -d backend

# 查看日志
docker logs -f backend
```

### 方案 2：修复配置问题

```bash
# 1. 检查并修复 .env.production
nano .env.production

# 确保以下配置正确：
# DATABASE_URL="postgresql://postgres:secure_postgres_2025@postgres:5432/interview_ai?schema=public&sslmode=disable"
# REDIS_HOST=redis
# REDIS_PORT=6379
# REDIS_PASSWORD=secure_redis_2025
# OSS_ENDPOINT=http://minio:9000  # 注意：不是 minio-prod

# 2. 重启服务
docker compose -f deployment/docker-compose.prod.yml restart backend
```

### 方案 3：降级健康检查

临时禁用健康检查以排查问题：

```yaml
# 在 docker-compose.prod.yml 中注释掉 backend 的 healthcheck
backend:
  # healthcheck:
  #   test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
```

然后重启：

```bash
docker compose -f deployment/docker-compose.prod.yml up -d backend
```

## 预防措施

### 1. 改进启动顺序

在 `docker-compose.prod.yml` 中添加更严格的依赖：

```yaml
backend:
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
    chromadb:
      condition: service_started
    minio:
      condition: service_healthy
```

### 2. 增加启动等待时间

修改健康检查配置：

```yaml
healthcheck:
  start_period: 120s # 从 60s 增加到 120s
  interval: 30s
  timeout: 10s
  retries: 5 # 从 3 增加到 5
```

### 3. 添加重试逻辑

在 `main.ts` 中添加数据库连接重试：

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 添加数据库连接重试
  const prisma = app.get(PrismaService);
  let retries = 5;
  while (retries > 0) {
    try {
      await prisma.$connect();
      break;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  // ... 其余启动代码
}
```

### 4. 改进日志记录

确保启动过程中的错误被正确记录：

```typescript
// 在 main.ts 中添加
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
```

## 下一步行动

1. **立即执行**：查看 backend 容器日志

   ```bash
   docker logs backend --tail 200
   ```

2. **检查依赖**：确认 PostgreSQL 和 Redis 正常运行

   ```bash
   docker ps | grep -E "postgres|redis"
   ```

3. **测试连接**：验证网络连接

   ```bash
   docker exec -it backend ping postgres
   docker exec -it backend ping redis
   ```

4. **应用修复**：根据日志错误信息选择对应的修复方案

## 总结

Backend 重启问题最可能的原因是：

1. **数据库连接失败**（最常见）
2. **Redis 连接失败**
3. **Prisma 迁移未执行**
4. **环境变量配置错误**

建议按照"诊断步骤"逐步排查，重点关注容器日志中的错误信息。

---

## 远程服务器诊断步骤 (服务器 IP: 150.158.20.143)

### 连接到服务器

```bash
# SSH 连接到服务器
ssh root@150.158.20.143

# 或使用密钥
ssh -i ~/.ssh/your-key.pem root@150.158.20.143
```

### 快速诊断（推荐）

我已经创建了自动化诊断脚本，在服务器上执行：

```bash
# 进入项目目录
cd /path/to/IntervAI

# 给脚本执行权限
chmod +x deployment/scripts/diagnose-backend.sh

# 运行诊断
./deployment/scripts/diagnose-backend.sh
```

这个脚本会自动检查：

- 容器状态和重启次数
- Backend 启动日志
- 所有依赖服务状态（PostgreSQL、Redis、ChromaDB、MinIO）
- 网络连接
- 环境变量配置
- 系统资源使用
- 健康检查状态

### 快速修复（推荐）

```bash
# 给脚本执行权限
chmod +x deployment/scripts/quick-fix-backend.sh

# 运行修复工具
./deployment/scripts/quick-fix-backend.sh
```

修复工具提供 6 个选项：

1. 重启 Backend（最快，适合临时问题）
2. 重新构建 Backend（适合代码或配置变更）
3. 完全重置（清除所有数据，重新开始）
4. 仅修复数据库连接（适合数据库问题）
5. 查看详细日志（诊断用）
6. 手动调试模式（高级用户）

### 手动诊断步骤

如果自动化脚本无法使用，按以下步骤手动诊断：

#### 1. 查看容器状态

```bash
docker ps -a | grep backend
```

#### 2. 查看 Backend 日志（最重要）

```bash
# 查看最近 200 行日志
docker logs backend --tail 200

# 实时查看日志
docker logs -f backend
```

#### 3. 检查依赖服务

```bash
# PostgreSQL
docker exec postgres pg_isready -U postgres

# Redis
docker exec redis redis-cli -a secure_redis_2025 ping

# ChromaDB
docker exec chromadb curl http://localhost:8000/api/v1/heartbeat

# MinIO
docker exec minio curl http://localhost:9000/minio/health/live
```

#### 4. 检查网络连接

```bash
# 从 backend 容器测试连接（如果容器运行中）
docker exec backend ping postgres
docker exec backend ping redis
```

#### 5. 检查环境变量

```bash
cd /path/to/IntervAI
cat .env.production | grep -E "DATABASE|REDIS|JWT|OSS"
```

### 常见问题快速修复

#### 问题 1：数据库连接失败

```bash
# 检查 PostgreSQL
docker logs postgres --tail 50

# 重启 PostgreSQL
docker compose -f deployment/docker-compose.prod.yml restart postgres

# 等待 10 秒
sleep 10

# 测试连接
docker exec postgres psql -U postgres -d interview_ai -c "SELECT 1;"

# 如果数据库不存在，创建它
docker exec postgres psql -U postgres -c "CREATE DATABASE interview_ai;"

# 执行迁移
docker compose -f deployment/docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# 重启 backend
docker compose -f deployment/docker-compose.prod.yml restart backend
```

#### 问题 2：Redis 连接失败

```bash
# 检查 Redis
docker logs redis --tail 50

# 重启 Redis
docker compose -f deployment/docker-compose.prod.yml restart redis

# 等待 5 秒
sleep 5

# 重启 backend
docker compose -f deployment/docker-compose.prod.yml restart backend
```

#### 问题 3：Prisma 迁移问题

```bash
# 进入 backend 容器（如果可以）
docker exec -it backend sh

# 在容器内执行
npx prisma migrate status
npx prisma generate
npx prisma migrate deploy

# 退出容器
exit

# 重启 backend
docker compose -f deployment/docker-compose.prod.yml restart backend
```

#### 问题 4：容器不断重启无法进入

```bash
# 临时禁用自动重启
docker update --restart=no backend

# 查看日志
docker logs backend --tail 300

# 根据日志修复问题后，重新启动
docker start backend

# 恢复自动重启策略
docker update --restart=always backend
```

### 完全重建方案

如果以上方法都无效，执行完全重建：

```bash
cd /path/to/IntervAI

# 1. 停止所有服务
docker compose -f deployment/docker-compose.prod.yml down

# 2. 备份数据（可选但推荐）
docker run --rm -v deployment_postgres_data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/postgres-backup-$(date +%Y%m%d).tar.gz /data

# 3. 清理旧镜像和容器
docker system prune -a -f

# 4. 重新构建
docker compose -f deployment/docker-compose.prod.yml build --no-cache

# 5. 启动依赖服务
docker compose -f deployment/docker-compose.prod.yml up -d postgres redis chromadb minio

# 6. 等待服务就绪
sleep 30

# 7. 执行数据库迁移
docker compose -f deployment/docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# 8. 启动 backend
docker compose -f deployment/docker-compose.prod.yml up -d backend

# 9. 查看日志
docker logs -f backend
```

## 立即行动指南

由于你的容器正在不断重启，建议按以下顺序操作：

### 第一步：SSH 连接到服务器

```bash
ssh root@150.158.20.143
```

### 第二步：查看日志找出根本原因

```bash
cd /path/to/IntervAI
docker logs backend --tail 200 > backend-error.log
cat backend-error.log
```

### 第三步：根据日志选择修复方案

**如果看到 "ECONNREFUSED" 或 "Connection refused"：**

- 数据库或 Redis 连接失败
- 执行"问题 1"或"问题 2"的修复步骤

**如果看到 "Prisma" 或 "migration" 相关错误：**

- 数据库迁移问题
- 执行"问题 3"的修复步骤

**如果看到 "ENOENT" 或文件找不到：**

- 构建问题
- 执行"方案 2：重新构建"

**如果日志显示 OOM 或内存相关：**

- 资源不足
- 检查系统资源：`free -h` 和 `df -h`

### 第四步：应用修复后验证

```bash
# 查看容器状态
docker ps -a

# 实时监控日志
docker logs -f backend

# 测试健康检查
curl http://localhost:3000/health
```

如果你能提供 backend 的日志内容，我可以给出更精确的解决方案。
