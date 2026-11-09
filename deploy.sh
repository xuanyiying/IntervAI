#!/bin/bash
# ==============================================================================
# IntervAI - 统一自动化部署脚本
# ==============================================================================

# 设置严格模式
set -e

# 1. 路径定义 (使用绝对路径)
# 获取脚本所在目录的绝对路径作为项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT" || exit 1
DEPLOY_DIR="${PROJECT_ROOT}/deployment"
SCRIPTS_DIR="${DEPLOY_DIR}/scripts"

# 2. 加载工具库
if [ -f "${SCRIPTS_DIR}/utils.sh" ]; then
    source "${SCRIPTS_DIR}/utils.sh"
else
    echo "错误: 找不到工具库 ${SCRIPTS_DIR}/utils.sh"
    exit 1
fi

# 默认配置
ENV="dev"
SKIP_BUILD=false
SKIP_PULL=false
SETUP_SSL=false
SERVICES=""

# 帮助信息
show_help() {
    cat << EOF
IntervAI 部署脚本

用法: $0 [选项]

选项:
  -e, --env <env>       部署环境: dev (默认) 或 prod
  -s, --services <list> 只构建/启动指定的组件 (例如: "backend frontend")
  --skip-build          跳过 Docker 镜像构建
  --skip-pull           跳过代码拉取 (git pull)
  --ssl                 兼容参数（HTTPS 已由 Caddy 自动配置）
  --backup              部署前备份数据库
  --help                显示此帮助信息

示例:
  $0 --env dev                  # 部署开发环境
  $0 --env prod               # 部署生产环境（HTTPS 由 Caddy 自动配置）
  $0 --env prod --skip-build    # 快速重启生产环境
EOF
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env) ENV="$2"; shift 2 ;;
        -s|--services) SERVICES="$2"; shift 2 ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        --skip-pull) SKIP_PULL=true; shift ;;
        --ssl) SETUP_SSL=true; shift ;;
        --backup)
            log_info "执行数据库备份..."
            if [ -f "${SCRIPTS_DIR}/manage-db.sh" ]; then
                DEPLOY_ENV="$ENV" bash "${SCRIPTS_DIR}/manage-db.sh" backup
            else
                log_error "找不到备份脚本: ${SCRIPTS_DIR}/manage-db.sh"
                exit 1
            fi
            shift
            ;;
        -h|--help) show_help; exit 0 ;;
        --) shift ;;
        *) log_error "未知参数: $1"; show_help; exit 1 ;;
    esac
done

# 部署流程
main() {
    log_info ">>> 开始部署 IntervAI ($ENV) <<<"
    log_info "项目根目录: $PROJECT_ROOT"

    # 1. 环境准备
    local env_file="${PROJECT_ROOT}/.env"
    local compose_file="${DEPLOY_DIR}/docker-compose.yml"

    if [ "$ENV" == "prod" ]; then
        env_file="${PROJECT_ROOT}/.env.production"
        compose_file="${DEPLOY_DIR}/docker-compose.prod.yml"

        # 生产配置：优先 .env.production，否则依赖进程环境变量
        # compose 中 JWT_SECRET 等使用 :? 强制要求，缺失时 Compose 会直接报错
        if [ ! -f "$env_file" ]; then
            log_warn "未找到 $env_file，将使用进程环境变量"
            log_warn "必需变量见 deployment/README.md 的「环境变量」章节"
        fi
    fi

    # 校验 compose 文件是否存在
    if [ ! -f "$compose_file" ]; then
        log_error "找不到 Docker Compose 配置文件: $compose_file"
        exit 1
    fi

    # 统一的 Compose v2 调用：env 文件不存在时不传 --env-file（避免启动失败）
    dc() {
        if [ -f "$env_file" ]; then
            docker compose --env-file "$env_file" -f "$compose_file" "$@"
        else
            docker compose -f "$compose_file" "$@"
        fi
    }

    # 加载环境变量
    if [ -f "$env_file" ]; then
        load_env "$env_file"
    else
        log_warn "环境变量文件不存在: $env_file (继续执行)"
    fi

    # 2. 拉取代码
    if [ "$SKIP_PULL" = false ]; then
        log_step "拉取最新代码..."
        # 确保在项目根目录执行 git
        if [ -d "$PROJECT_ROOT/.git" ]; then
            git -C "$PROJECT_ROOT" pull origin main || log_warn "代码拉取失败，使用本地版本继续"
        else
            log_warn "不是 git 仓库，跳过拉取"
        fi
    else
        log_info "跳过代码拉取"
    fi

    # 3. 依赖检查（统一要求 Compose v2）
    check_command docker
    if ! docker compose version >/dev/null 2>&1; then
        log_error "未检测到 Docker Compose v2（docker compose）"
        exit 1
    fi

    # 4. 构建镜像（dev compose 只有基础设施，build 为空操作）
    if [ "$SKIP_BUILD" = false ]; then
        log_step "构建 Docker 镜像... ${SERVICES}"
        dc build --no-cache $SERVICES
    else
        log_info "跳过镜像构建"
    fi

    # 5. 启动服务
    log_step "启动服务... ${SERVICES}"
    dc up -d $SERVICES

    # 6. 数据库迁移：仅 prod compose 含 backend 服务
    if [ "$ENV" == "prod" ]; then
        log_step "执行数据库迁移..."
        dc run --rm backend prisma migrate deploy
    else
        log_info "开发 compose 不含 backend 服务，跳过容器内迁移"
        log_info "本地启动前请执行: pnpm --filter @interview-ai/backend prisma:migrate"
    fi

    # 7. HTTPS：由 Caddy 依据 DOMAIN / LETSENCRYPT_EMAIL 自动申请与续期
    if [ "$ENV" == "prod" ] && [ "$SETUP_SSL" == true ]; then
        log_info "--ssl 已启用：证书由 Caddy 自动管理，无需额外脚本"
    fi

    # 8. 健康检查
    log_step "执行健康检查..."

    if [ "$ENV" != "prod" ]; then
        # 开发 compose 只含基础设施，检查容器状态而非应用 HTTP 端点
        local running_services
        running_services=$(dc ps --services --filter "status=running")
        for svc in postgres redis; do
            if ! echo "$running_services" | grep -qx "$svc"; then
                log_error "基础设施服务未运行: $svc"
                exit 1
            fi
            log_info "✓ 服务运行中: $svc"
        done
        log_info "开发部署完成。启动应用: pnpm dev"
        exit 0
    fi

    # 生产：直接探测后端容器。Caddy 的 :80 恒返回 426，不能作为探活入口
    local backend_healthy=false
    for i in {1..12}; do
        if dc exec -T backend curl -fsS http://localhost:3000/health > /dev/null 2>&1; then
            backend_healthy=true
            break
        fi
        echo -n "."
        sleep 5
    done
    echo ""

    if [ "$backend_healthy" != true ]; then
        log_error "后端健康检查失败"
        dc logs --tail=50 backend || true
        exit 1
    fi
    log_info "✓ 后端健康检查通过"

    # 可选：公网 HTTPS 入口检查（Caddy 已把 /health 反代到后端）
    local check_urls=()
    if [ -n "${DOMAIN:-}" ] && [ "$DOMAIN" != "localhost" ]; then
        check_urls+=("https://${DOMAIN}/health")
    fi

    for url in "${check_urls[@]}"; do
        log_info "Checking: $url"
        local success=false
        for i in {1..12}; do
            if curl -s -f -k -L "$url" > /dev/null; then
                log_info "✓ Health check passed: $url"
                success=true
                break
            fi
            echo -n "."
            sleep 5
        done
        echo ""

        if [ "$success" = false ]; then
            log_warn "公网健康检查未通过: $url（后端容器已健康，请检查 Caddy / DNS / 证书）"
        fi
    done

    log_info "部署成功! 访问地址: https://${DOMAIN:-localhost}"
    exit 0
}

main
