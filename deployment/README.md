# 部署文档

本文档说明 Interview AI 的部署流程和脚本使用方法。

## 目录结构

```
deployment/
├── README.md              # 本文档
├── docker-compose.prod.yml # 生产环境 Docker Compose 配置
├── scripts/               # 部署脚本目录
│   ├── manage-db.sh       # 数据库管理（备份/恢复/迁移）
│   └── utils.sh           # 通用工具函数
└── config/                # 配置文件目录
    └── caddy/             # Caddy 配置
        └── Caddyfile      # Caddy 配置文件
deploy.sh                  # 根目录下的统一入口脚本
```

## 快速开始

所有部署操作均通过根目录下的 `deploy.sh` 脚本执行。

### 1. 开发环境部署

```bash
# 默认部署开发环境
./deploy.sh

# 或显式指定
./deploy.sh --env dev
```

### 2. 生产环境部署

```bash
# 首次部署（需配置 .env.production）
./deploy.sh --env prod

# 更新代码并重启（不重新构建镜像）
./deploy.sh --env prod --skip-build

# 仅重启服务
./deploy.sh --env prod --skip-pull --skip-build
```

### 3. 数据库管理

```bash
# 备份数据库（备份文件存放在 backups/postgres/）
bash deployment/scripts/manage-db.sh backup

# 恢复数据库
bash deployment/scripts/manage-db.sh restore <backup_file>

# 列出所有备份
bash deployment/scripts/manage-db.sh list

# 手动执行迁移
bash deployment/scripts/manage-db.sh migrate
```

## 环境变量

部署前请确保正确配置环境变量文件：

- 开发环境：`.env`
- 生产环境：`.env.production`

示例文件可在 `.env.example` 和 `.env.production.example` 中找到。

## HTTPS 配置

生产环境使用 **Caddy** 作为反向代理，自动管理 HTTPS 证书：

### 自动证书管理

Caddy 会自动：
- 获取 Let's Encrypt SSL 证书
- 自动续期证书（到期前 30 天）
- 强制 HTTPS 重定向
- 配置最佳安全实践

### 必需的环境变量

在 `.env.production` 中配置：

```bash
# 域名配置
DOMAIN=yourdomain.com

# Let's Encrypt 邮箱（用于证书通知）
LETSENCRYPT_EMAIL=admin@yourdomain.com
```

### 测试环境配置

如需测试证书申请（避免达到 Let's Encrypt 速率限制），添加：

```bash
# 使用 Let's Encrypt 测试环境
ACME_CA=https://acme-staging-v02.api.letsencrypt.org/directory
```

### 部署

```bash
# 启动服务（Caddy 会自动获取证书）
./deploy.sh --env prod
```

### 查看证书状态

```bash
# 进入 Caddy 容器
docker-compose -f deployment/docker-compose.prod.yml exec caddy sh

# 查看证书
caddy list-certificates

# 查看证书详情
ls -la /data/caddy/certificates/
```

### 手动续期测试

```bash
# Caddy 会自动续期，如需手动测试
docker-compose -f deployment/docker-compose.prod.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

## 架构说明

```
Internet (HTTPS)
      │
      ▼
┌─────────────────┐
│      Caddy      │  ← 自动 HTTPS、反向代理
│   (Port 443)    │
└─────────────────┘
      │
      ├──────────────┬──────────────┐
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Frontend │  │ Backend  │  │  其他服务 │
│ (静态文件)│  │  (API)   │  │          │
└──────────┘  └──────────┘  └──────────┘
```

## 常见问题

**Q: 部署失败，提示端口被占用？**
A: 请检查是否运行了其他占用 80/443 端口的服务。使用 `lsof -i :80` 查看。

**Q: 数据库恢复失败？**
A: 恢复操作会清空当前数据库。请确保 Docker 服务正在运行，并且备份文件路径正确。

**Q: 证书获取失败？**
A: 
1. 检查域名 DNS 解析是否正确指向服务器 IP
2. 确保 80 和 443 端口可从外网访问
3. 检查 `.env.production` 中的 `LETSENCRYPT_EMAIL` 是否正确
4. 查看 Caddy 日志：`docker-compose -f deployment/docker-compose.prod.yml logs caddy`

**Q: 如何查看 Caddy 日志？**
A: 
```bash
# 实时查看日志
docker-compose -f deployment/docker-compose.prod.yml logs -f caddy

# 查看访问日志
tail -f logs/caddy/access.log
```

**Q: 如何修改 Caddy 配置？**
A: 
1. 编辑 `deployment/config/caddy/Caddyfile`
2. 重载配置：`docker-compose -f deployment/docker-compose.prod.yml exec caddy caddy reload --config /etc/caddy/Caddyfile`
3. 或重启服务：`docker-compose -f deployment/docker-compose.prod.yml restart caddy`
