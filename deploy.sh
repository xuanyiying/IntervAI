#!/bin/bash
# ==============================================================================
# Resume Optimizer - 统一自动化部署脚本
# ==============================================================================

# 设置严格模式
set -e

# 加载工具库
PROJECT_ROOT="$(pwd)"
if [ -f "deployment/scripts/utils.sh" ]; then
    source "deployment/scripts/utils.sh"
else
    echo "错误: 找不到 deployment/scripts/utils.sh"
    exit 1
fi

# 默认配置
ENV="dev"
SKIP_BUILD=false
SKIP_PULL=false
SETUP_SSL=false

# 帮助信息
show_help() {
    cat << EOF
Resume Optimizer 部署脚本

用法: $0 [选项]

选项:
  -e, --env <env>       部署环境: dev (默认) 或 prod
  --skip-build          跳过 Docker 镜像构建
  --skip-pull           跳过代码拉取 (git pull)
  --ssl                 配置 SSL 证书 (仅 prod)
  --backup              部署前备份数据库
  --help                显示此帮助信息

示例:
  $0 --env dev                  # 部署开发环境
  $0 --env prod --ssl           # 部署生产环境并配置 SSL
  $0 --env prod --skip-build    # 快速重启生产环境
EOF
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env) ENV="$2"; shift 2 ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        --skip-pull) SKIP_PULL=true; shift ;;
        --ssl) SETUP_SSL=true; shift ;;
        --backup) 
            log_info "执行数据库备份..."
            bash deployment/scripts/manage-db.sh backup
            shift 
            ;;
        -h|--help) show_help; exit 0 ;;
        *) log_error "未知参数: $1"; show_help; exit 1 ;;
    esac
done

# 部署流程
main() {
    log_info ">>> 开始部署 Resume Optimizer ($ENV) <<<"
    
    # 1. 环境准备
    local env_file=".env"
    local compose_file="docker-compose.yml"
    
    if [ "$ENV" == "prod" ]; then
        env_file=".env.production"
        compose_file="deployment/docker-compose.prod.yml"
        
        # 检查 prod 配置文件
        if [ ! -f "$env_file" ]; then
            if [ -f ".env.production.example" ]; then
                log_warn "未找到 $env_file，从示例文件创建..."
                cp .env.production.example "$env_file"
                log_info "请编辑 $env_file 配置生产环境参数"
                exit 1
            else
                log_error "找不到 .env.production 或示例文件"
                exit 1
            fi
        fi
    fi
    
    load_env "$env_file"
    
    # 2. 拉取代码
    if [ "$SKIP_PULL" = false ]; then
        log_step "拉取最新代码..."
        git pull origin main || log_warn "代码拉取失败，使用本地版本继续"
    else
        log_info "跳过代码拉取"
    fi
    
    # 3. 依赖检查
    check_command docker
    check_command docker-compose || check_command docker
    
    # 4. 构建镜像
    if [ "$SKIP_BUILD" = false ]; then
        log_step "构建 Docker 镜像..."
        docker compose -f "$compose_file" build --no-cache
    else
        log_info "跳过镜像构建"
    fi
    
    # 5. 启动服务
    log_step "启动服务..."
    docker compose -f "$compose_file" up -d
    
    # 6. 数据库迁移
    log_step "执行数据库迁移..."
    docker compose -f "$compose_file" run --rm backend npx prisma migrate deploy
    
    # 7. SSL 配置 (仅 prod)
    if [ "$ENV" == "prod" ] && [ "$SETUP_SSL" == true ]; then
        log_step "配置 SSL..."
        bash deployment/scripts/setup-ssl.sh
    fi
    
    # 8. 健康检查
    log_step "执行健康检查..."
    local health_url="http://localhost:3000/health"
    if [ "$ENV" == "prod" ]; then
        health_url="http://localhost/health"
        if [ "$SETUP_SSL" == true ]; then
             health_url="https://${DOMAIN:-localhost}/health"
        fi
    fi
    
    # 简单的重试逻辑
    for i in {1..12}; do
        if curl -s -f "$health_url" > /dev/null; then
            log_info "✓ 服务健康检查通过"
            log_info "部署成功! 访问地址: $health_url"
            exit 0
        fi
        echo -n "."
        sleep 5
    done
    
    log_warn "服务启动可能超时，请手动检查: docker compose -f $compose_file logs"
}

main
