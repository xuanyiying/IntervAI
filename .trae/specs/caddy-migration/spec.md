# Caddy 迁移规格说明

## 概述

将现有的 Nginx + Certbot 方案迁移到 Caddy，实现自动 HTTPS 证书管理与续期。

## 背景

当前系统使用 Nginx 作为反向代理，Certbot 手动管理 Let's Encrypt 证书。此方案存在以下问题：
- 证书续期需要手动操作或额外配置定时任务
- 配置复杂，需要维护多个配置文件
- SSL 配置繁琐

Caddy 是一个现代化的 Web 服务器，内置自动 HTTPS 功能：
- 自动获取和续期 Let's Encrypt 证书
- 配置简洁，使用 Caddyfile
- 默认启用 HTTPS，自动重定向 HTTP
- 内置安全头和性能优化

## 目标

1. 完全移除 Nginx 和 Certbot
2. 使用 Caddy 作为唯一的反向代理
3. 实现证书自动获取和续期
4. 保持所有现有功能不变
5. 简化配置和维护

## 架构变更

### 当前架构
```
Internet → Nginx (443/80) → Backend (3000)
                         → Frontend (80)
                         
Certbot → Let's Encrypt → /etc/letsencrypt
```

### 目标架构
```
Internet → Caddy (443/80) → Backend (3000)
         (直接提供前端静态文件)
                            
Caddy 自动管理 → Let's Encrypt 证书
```

**注意**：采用方案 B，Caddy 直接提供前端静态文件服务，移除前端容器内的 nginx，实现单一 web 服务器架构。

## 功能对照

| 功能 | Nginx 配置 | Caddy 等价配置 |
|------|-----------|---------------|
| HTTP→HTTPS 重定向 | 手动配置 server block | 自动处理 |
| SSL 证书 | 手动配置 certbot | 自动获取/续期 |
| 反向代理 | proxy_pass | reverse_proxy |
| 负载均衡 | upstream + least_conn | reverse_proxy 多目标 |
| 速率限制 | limit_req_zone | rate_limit (Caddy 模块) |
| 安全头 | add_header | header 指令 |
| Gzip 压缩 | gzip on | encode gzip |
| WebSocket | proxy_set_header Upgrade | 自动支持 |
| 文件上传大小 | client_max_body_size | request_body max_size |

## 配置文件变更

### 需要创建的文件
1. `deployment/config/caddy/Caddyfile` - Caddy 主配置文件

### 需要修改的文件
1. `deployment/docker-compose.prod.yml` - 替换 nginx 服务为 caddy
2. `deployment/docker-compose.yml` - 开发环境可选添加 caddy

### 需要删除的文件
1. `deployment/config/nginx/` - 整个 nginx 配置目录
2. `deployment/scripts/setup-ssl.sh` - SSL 设置脚本（不再需要）
3. `deployment/config/ssl/` - 手动证书目录（Caddy 自动管理）
4. `certbot/` - Certbot 数据目录

### 需要更新的文档
1. `deployment/docs/PRODUCTION_DEPLOYMENT.md`
2. `deployment/docs/PRODUCTION_OPERATIONS.md`
3. `deployment/README.md`

## Caddyfile 配置规格

### 基本结构
```caddyfile
{
    # 全局选项
    email {$LETSENCRYPT_EMAIL}
    acme_ca {$ACME_CA:https://acme-v02.api.letsencrypt.org/directory}
}

{$DOMAIN} {
    # 自动 HTTPS
    
    # 安全头
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "geolocation=(), microphone=(), camera=()"
    }
    
    # API 代理
    handle /api/* {
        reverse_proxy backend:3000
    }
    
    # WebSocket
    handle /socket.io/* {
        reverse_proxy backend:3000
    }
    
    # 文件上传
    handle /api/v1/resumes/upload {
        reverse_proxy backend:3000 {
            transport http {
                read_timeout 120s
                write_timeout 120s
            }
        }
    }
    
    # 健康检查
    handle /health {
        respond "healthy" 200
    }
    
    # 前端静态文件
    handle {
        root * /var/www/html
        try_files {path} /index.html
        file_server
        
        # 静态资源缓存
        @static {
            path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2 *.ttf *.eot
        }
        header @static Cache-Control "public, max-age=31536000, immutable"
    }
}
```

### 环境变量
- `DOMAIN` - 域名（必需）
- `LETSENCRYPT_EMAIL` - Let's Encrypt 邮箱（必需）
- `ACME_CA` - ACME CA 地址（可选，用于测试）
- `STAGING` - 是否使用测试环境（可选）

## Docker Compose 服务配置

### Caddy 服务定义
```yaml
  caddy:
    image: caddy:2-alpine
    container_name: caddy
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"  # HTTP/3 支持
    volumes:
      - ./config/caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
      - ../packages/frontend/dist:/var/www/html:ro  # 前端静态文件
      - ../logs/caddy:/var/log/caddy
    environment:
      - DOMAIN=${DOMAIN}
      - LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL}
      - ACME_CA=${ACME_CA:-https://acme-v02.api.letsencrypt.org/directory}
    networks:
      - app-network
    restart: always
    logging: *logging
    healthcheck:
      test: ["CMD", "caddy", "validate", "--config", "/etc/caddy/Caddyfile"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 卷定义
```yaml
volumes:
  caddy_data:      # 证书存储
  caddy_config:    # Caddy 配置
```

### 前端 Dockerfile 修改
移除 nginx，只保留构建阶段：

```dockerfile
# Stage 1-2: 构建阶段（保持不变）
# ...

# Stage 3: 只输出静态文件（移除 nginx）
FROM scratch AS export
COPY --from=builder /app/packages/frontend/dist /dist
```

或者使用轻量级基础镜像作为最终镜像：

```dockerfile
# Stage 3: Runtime (用于构建产物)
FROM alpine:latest
COPY --from=builder /app/packages/frontend/dist /app/dist
# 此镜像仅用于存储构建产物，实际由 Caddy 提供服务
```

## 迁移步骤

### 阶段一：准备
1. 备份现有 Nginx 配置
2. 创建 Caddyfile 配置
3. 更新 docker-compose.prod.yml

### 阶段二：测试
1. 在测试环境验证 Caddy 配置
2. 测试证书自动获取
3. 验证所有路由正常工作

### 阶段三：生产迁移
1. 停止 Nginx 服务
2. 启动 Caddy 服务
3. 验证证书自动获取成功
4. 验证所有功能正常

### 阶段四：清理
1. 删除 Nginx 相关配置
2. 删除 Certbot 相关文件
3. 更新文档

## 回滚计划

如果迁移失败，可以快速回滚：
1. 停止 Caddy 容器
2. 恢复 Nginx 配置
3. 重启 Nginx 服务
4. 手动恢复证书（如果需要）

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 证书获取失败 | 服务不可用 | 保留现有证书作为备份，配置 Caddy 使用现有证书 |
| 配置语法错误 | 服务启动失败 | 本地测试配置，使用 `caddy validate` 验证 |
| 性能差异 | 用户体验 | 性能测试，监控响应时间 |
| 功能缺失 | 功能不可用 | 详细功能对照，确保所有功能已迁移 |

## 验收标准

1. ✅ Caddy 成功启动并监听 80/443 端口
2. ✅ HTTPS 证书自动获取成功
3. ✅ HTTP 自动重定向到 HTTPS
4. ✅ API 请求正确代理到后端
5. ✅ 前端请求正确代理到前端容器
6. ✅ WebSocket 连接正常工作
7. ✅ 文件上传功能正常
8. ✅ 安全头正确设置
9. ✅ 证书自动续期配置正确
10. ✅ 所有旧 Nginx 配置已清理

## 时间估算

- 准备和配置：1 小时
- 测试环境验证：1 小时
- 生产迁移：30 分钟
- 清理和文档更新：30 分钟

**总计：约 3 小时**
