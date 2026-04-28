# Caddy 迁移任务清单

## 阶段一：配置准备

### 1.1 创建 Caddy 配置目录
- [ ] 创建 `deployment/config/caddy/` 目录

### 1.2 创建 Caddyfile 配置文件
- [ ] 创建 `deployment/config/caddy/Caddyfile`
- [ ] 配置全局选项（email, acme_ca）
- [ ] 配置域名块
- [ ] 配置安全头
- [ ] 配置 API 反向代理
- [ ] 配置文件上传端点（增加超时时间）
- [ ] 配置健康检查端点
- [ ] 配置前端应用代理
- [ ] 配置静态资源缓存

### 1.3 更新 Docker Compose 配置
- [ ] 在 `docker-compose.prod.yml` 中添加 caddy 服务
- [ ] 配置端口映射（80, 443, 443/udp）
- [ ] 配置卷挂载（Caddyfile, data, config, logs）
- [ ] 配置环境变量
- [ ] 配置服务依赖
- [ ] 添加 caddy_data 和 caddy_config 卷定义
- [ ] 移除或注释 nginx 服务

## 阶段二：测试验证

### 2.1 本地配置验证
- [ ] 使用 `caddy validate` 验证 Caddyfile 语法
- [ ] 检查环境变量配置

### 2.2 测试环境部署
- [ ] 在测试环境启动 Caddy 容器
- [ ] 验证容器健康状态
- [ ] 检查日志输出

### 2.3 功能测试
- [ ] 测试 HTTP→HTTPS 重定向
- [ ] 测试证书自动获取
- [ ] 测试 API 请求代理
- [ ] 测试前端页面访问
- [ ] 测试 WebSocket 连接
- [ ] 测试文件上传功能
- [ ] 测试健康检查端点
- [ ] 验证安全头设置

## 阶段三：生产迁移

### 3.1 迁移前准备
- [ ] 备份当前 Nginx 配置
- [ ] 备份当前 SSL 证书
- [ ] 记录当前服务状态
- [ ] 通知相关人员维护窗口

### 3.2 执行迁移
- [ ] 停止 Nginx 服务
- [ ] 启动 Caddy 服务
- [ ] 监控 Caddy 启动日志
- [ ] 验证证书获取状态

### 3.3 迁移后验证
- [ ] 访问 HTTPS 网站验证证书
- [ ] 测试所有 API 端点
- [ ] 测试前端功能
- [ ] 检查 WebSocket 连接
- [ ] 验证文件上传
- [ ] 检查日志输出正常

## 阶段四：清理与文档

### 4.1 清理旧配置
- [ ] 删除 `deployment/config/nginx/` 目录
- [ ] 删除 `deployment/scripts/setup-ssl.sh`
- [ ] 删除 `deployment/config/nginx/conf.d/default.conf.init`
- [ ] 清理 `certbot/` 目录（如果存在）
- [ ] 移除 docker-compose.prod.yml 中的 nginx 服务定义
- [ ] 清理未使用的卷

### 4.2 更新文档
- [ ] 更新 `deployment/README.md`
- [ ] 更新 `deployment/docs/PRODUCTION_DEPLOYMENT.md`
  - [ ] 移除 Certbot 相关说明
  - [ ] 添加 Caddy 配置说明
  - [ ] 更新部署步骤
- [ ] 更新 `deployment/docs/PRODUCTION_OPERATIONS.md`
  - [ ] 移除证书续期手动操作说明
  - [ ] 添加 Caddy 证书管理说明
  - [ ] 添加 Caddy 日志查看说明
  - [ ] 添加 Caddy 配置重载说明

### 4.3 更新环境变量文档
- [ ] 更新 `.env.production.example`
- [ ] 添加 `LETSENCRYPT_EMAIL` 说明
- [ ] 添加 `ACME_CA` 说明（可选）

## 阶段五：监控与优化

### 5.1 设置监控
- [ ] 配置 Caddy 日志输出
- [ ] 设置证书过期告警（可选）
- [ ] 监控服务健康状态

### 5.2 性能优化
- [ ] 根据实际负载调整 Caddy 配置
- [ ] 配置静态资源缓存策略
- [ ] 优化连接池设置

## 任务依赖关系

```
1.1 → 1.2 → 1.3
              ↓
            2.1 → 2.2 → 2.3
                        ↓
                      3.1 → 3.2 → 3.3
                                ↓
                              4.1 → 4.2 → 4.3
                                        ↓
                                      5.1 → 5.2
```

## 注意事项

1. **证书备份**：迁移前务必备份现有证书，以防 Caddy 获取证书失败时可以快速回滚
2. **DNS 配置**：确保域名 DNS 已正确指向服务器 IP
3. **防火墙**：确保 80 和 443 端口已开放
4. **测试环境**：建议先在测试环境验证完整流程
5. **维护窗口**：生产迁移建议在低流量时段进行
