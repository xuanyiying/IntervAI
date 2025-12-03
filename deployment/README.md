# 部署指南

本目录包含 Resume Optimizer 平台的所有部署相关文件和脚本。

## 📁 目录结构

```
deployment/
├── README.md                      # 本文件
├── docker-compose.prod.yml        # 生产环境 Docker Compose 配置
├── scripts/                       # 部署脚本
│   ├── deploy.sh                  # 统一部署脚本（推荐）
│   ├── backup-database.sh         # 数据库备份脚本
│   ├── restore-database.sh        # 数据库恢复脚本
│   ├── setup-ssl.sh              # SSL/TLS 证书配置脚本
│   └── docker-entrypoint.sh      # Docker 容器入口脚本
├── config/                        # 部署配置文件
│   ├── nginx/                    # Nginx 配置
│   └── ssl/                      # SSL 证书配置
└── docs/                          # 详细文档
    ├── PRODUCTION_DEPLOYMENT.md   # 生产部署完整指南
    └── PRODUCTION_OPERATIONS.md   # 生产运维指南
```

## 🚀 快速开始

### 一键部署（推荐）

我们提供了统一的部署脚本，支持开发和生产环境：

```bash
# 开发环境部署
./deployment/scripts/deploy.sh --env dev

# 生产环境部署
./deployment/scripts/deploy.sh --env prod

# 生产环境部署（带数据库备份）
./deployment/scripts/deploy.sh --env prod --backup

# 查看所有选项
./deployment/scripts/deploy.sh --help
```

### 部署脚本选项

```
选项:
    -e, --env <ENV>         部署环境: dev (开发) 或 prod (生产), 默认: dev
    -s, --skip-build        跳过 Docker 镜像构建
    -m, --skip-migration    跳过数据库迁移
    -b, --backup            部署前备份数据库
    -h, --help              显示帮助信息
```

## 📋 部署前准备

### 1. 环境配置

#### 开发环境

```bash
cp .env.example .env
nano .env
```

#### 生产环境

```bash
cp .env.production.example .env.production
nano .env.production
```

必需的环境变量（生产环境）：

- `POSTGRES_PASSWORD` - PostgreSQL 数据库密码
- `REDIS_PASSWORD` - Redis 密码
- `JWT_SECRET` - JWT 密钥
- `DOMAIN` - 你的域名
- AI 提供商 API 密钥（至少一个）

### 2. 系统要求

- Docker >= 20.10
- Docker Compose >= 2.0
- 至少 4GB RAM
- 至少 20GB 磁盘空间

## 🔧 常用操作

### 数据库管理

#### 备份数据库

```bash
./deployment/scripts/backup-database.sh
```

备份文件保存在 `backups/postgres/` 目录，格式：`resume_optimizer_YYYYMMDD_HHMMSS.sql.gz`

#### 恢复数据库

```bash
# 查看可用备份
ls -lh backups/postgres/

# 恢复指定备份
./deployment/scripts/restore-database.sh resume_optimizer_20231201_120000.sql.gz
```

### SSL/TLS 配置

```bash
# 配置 Let's Encrypt SSL 证书
./deployment/scripts/setup-ssl.sh

# 测试环境（使用 staging 证书）
LETSENCRYPT_STAGING=true ./deployment/scripts/setup-ssl.sh
```

### 服务管理

```bash
# 查看服务状态
docker-compose -f deployment/docker-compose.prod.yml ps

# 查看日志
docker-compose -f deployment/docker-compose.prod.yml logs -f [service]

# 重启服务
docker-compose -f deployment/docker-compose.prod.yml restart [service]

# 停止所有服务
docker-compose -f deployment/docker-compose.prod.yml down

# 停止并删除数据卷（危险操作！）
docker-compose -f deployment/docker-compose.prod.yml down -v
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新部署（会重新构建镜像）
./deployment/scripts/deploy.sh --env prod --backup

# 快速重启（跳过构建）
./deployment/scripts/deploy.sh --env prod --skip-build
```

## 📊 监控和日志

### 查看实时日志

```bash
# 所有服务
docker-compose -f deployment/docker-compose.prod.yml logs -f

# 特定服务
docker-compose -f deployment/docker-compose.prod.yml logs -f backend
docker-compose -f deployment/docker-compose.prod.yml logs -f frontend
docker-compose -f deployment/docker-compose.prod.yml logs -f nginx
```

### 健康检查

```bash
# 后端健康检查
curl http://localhost:3000/health

# 通过 Nginx
curl http://localhost/health
```

## 🔒 安全建议

1. **修改默认密码**: 确保修改所有默认密码（数据库、Redis 等）
2. **使用强密钥**: JWT_SECRET 应使用强随机字符串
3. **启用 HTTPS**: 生产环境必须配置 SSL/TLS
4. **定期备份**: 设置自动备份任务
5. **更新依赖**: 定期更新系统和依赖包
6. **限制访问**: 配置防火墙规则，只开放必要端口
7. **监控日志**: 定期检查日志，发现异常行为

## 🆘 故障排查

### 服务无法启动

```bash
# 检查日志
docker-compose -f deployment/docker-compose.prod.yml logs

# 检查容器状态
docker-compose -f deployment/docker-compose.prod.yml ps

# 重新构建镜像
docker-compose -f deployment/docker-compose.prod.yml build --no-cache
```

### 数据库连接失败

```bash
# 检查数据库服务
docker-compose -f deployment/docker-compose.prod.yml ps postgres

# 检查数据库日志
docker-compose -f deployment/docker-compose.prod.yml logs postgres

# 进入数据库容器
docker-compose -f deployment/docker-compose.prod.yml exec postgres psql -U postgres
```

### SSL 证书问题

```bash
# 检查证书状态
docker-compose -f deployment/docker-compose.prod.yml exec nginx ls -la /etc/letsencrypt/live/

# 重新申请证书
./deployment/scripts/setup-ssl.sh

# 查看 certbot 日志
docker-compose -f deployment/docker-compose.prod.yml logs certbot
```

## 📚 详细文档

- **[生产部署完整指南](docs/PRODUCTION_DEPLOYMENT.md)** - 详细的生产环境部署步骤
- **[生产运维指南](docs/PRODUCTION_OPERATIONS.md)** - 日常运维操作和最佳实践

## 🔄 自动化部署

### 使用 Makefile（如果可用）

```bash
# 开发环境
make dev

# 生产环境
make prod

# 备份
make backup

# 查看所有命令
make help
```

### CI/CD 集成

项目包含 GitHub Actions 配置，可以自动化部署流程。查看 `.github/workflows/` 目录了解详情。

## 📞 获取帮助

如果遇到问题：

1. 查看本文档的故障排查部分
2. 检查详细文档 `docs/` 目录
3. 查看项目 Issues
4. 联系技术支持团队

## 📝 更新日志

- **2024-12**: 整合部署脚本，统一到 deployment 目录
- **2024-11**: 添加自动备份功能
- **2024-10**: 初始版本
