# Caddy 迁移验证清单

## 迁移前检查

### 环境准备
- [ ] 确认域名 DNS 已正确解析到服务器 IP
- [ ] 确认 80 端口可从外网访问（用于 ACME 验证）
- [ ] 确认 443 端口可从外网访问
- [ ] 确认服务器有足够的磁盘空间存储证书
- [ ] 确认 `.env.production` 中配置了正确的 `DOMAIN`
- [ ] 确认 `.env.production` 中配置了正确的 `LETSENCRYPT_EMAIL`

### 备份验证
- [ ] 已备份 `deployment/config/nginx/` 目录
- [ ] 已备份 `deployment/config/ssl/` 目录
- [ ] 已备份 `deployment/docker-compose.prod.yml`
- [ ] 已记录当前运行的服务状态

## 配置验证

### Caddyfile 语法
- [ ] Caddyfile 语法正确（运行 `caddy validate --config Caddyfile`）
- [ ] 域名配置正确
- [ ] 邮箱配置正确
- [ ] 所有反向代理目标地址正确
- [ ] 安全头配置完整

### Docker Compose 配置
- [ ] caddy 服务定义正确
- [ ] 端口映射正确（80, 443, 443/udp）
- [ ] 卷挂载路径正确
- [ ] 环境变量配置正确
- [ ] 服务依赖配置正确
- [ ] 卷定义已添加

## 功能验证

### 证书管理
- [ ] Caddy 容器成功启动
- [ ] 证书自动获取成功（检查日志）
- [ ] 证书文件存在于 `/data/caddy/certificates/` 目录
- [ ] HTTPS 访问正常，证书有效
- [ ] 证书链完整

### HTTP/HTTPS
- [ ] HTTP 请求自动重定向到 HTTPS
- [ ] HTTPS 连接正常
- [ ] TLS 1.2 和 1.3 支持
- [ ] HTTP/2 支持
- [ ] HTTP/3 支持（如果启用）

### 反向代理
- [ ] `/api/*` 请求正确代理到 backend:3000
- [ ] `/` 请求正确代理到 frontend:80
- [ ] `/health` 端点返回正常
- [ ] WebSocket 连接正常（`/socket.io/*`）

### 文件上传
- [ ] `/api/v1/resumes/upload` 端点正常工作
- [ ] 大文件上传成功（测试 10MB+ 文件）
- [ ] 上传超时配置正确

### 安全头
- [ ] `Strict-Transport-Security` 头存在
- [ ] `X-Content-Type-Options: nosniff` 头存在
- [ ] `X-Frame-Options: SAMEORIGIN` 头存在
- [ ] `X-XSS-Protection: 1; mode=block` 头存在
- [ ] `Referrer-Policy` 头存在
- [ ] `Permissions-Policy` 头存在

### 性能
- [ ] 响应时间在可接受范围内
- [ ] 静态资源缓存正常
- [ ] Gzip 压缩正常工作

## 清理验证

### 文件删除
- [ ] `deployment/config/nginx/` 目录已删除
- [ ] `deployment/scripts/setup-ssl.sh` 已删除
- [ ] `certbot/` 目录已删除（如果存在）
- [ ] docker-compose.prod.yml 中 nginx 服务已移除

### 文档更新
- [ ] `deployment/README.md` 已更新
- [ ] `deployment/docs/PRODUCTION_DEPLOYMENT.md` 已更新
- [ ] `deployment/docs/PRODUCTION_OPERATIONS.md` 已更新
- [ ] `.env.production.example` 已更新

## 监控验证

### 日志
- [ ] Caddy 访问日志正常输出
- [ ] Caddy 错误日志正常输出
- [ ] 日志格式正确

### 健康检查
- [ ] 容器健康检查通过
- [ ] 服务自动重启正常

## 证书续期验证

### 自动续期配置
- [ ] Caddy 配置了正确的邮箱地址
- [ ] 证书续期将在到期前自动进行
- [ ] 测试续期流程（可选：使用 staging 环境）

## 回滚验证

### 回滚准备
- [ ] 已记录回滚步骤
- [ ] 已备份所有必要文件
- [ ] 回滚脚本可用（如果需要）

## 最终验收

### 功能完整性
- [ ] 所有 API 端点正常工作
- [ ] 前端应用正常访问
- [ ] WebSocket 连接正常
- [ ] 文件上传功能正常
- [ ] 用户登录/注册正常
- [ ] 所有业务功能正常

### 安全性
- [ ] HTTPS 强制启用
- [ ] 安全头配置正确
- [ ] 证书有效且受信任
- [ ] 无安全警告

### 可维护性
- [ ] 配置文件清晰易懂
- [ ] 文档完整准确
- [ ] 日志可读性好
- [ ] 运维操作简单

## 验收签字

- 配置审核人：__________ 日期：__________
- 测试负责人：__________ 日期：__________
- 运维负责人：__________ 日期：__________
- 项目负责人：__________ 日期：__________
