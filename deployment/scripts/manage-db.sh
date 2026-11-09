#!/bin/bash
# ==============================================================================
# 数据库管理 - backup | restore | list | migrate
# 可从仓库任意目录调用；deploy.sh --backup 会执行 `backup`。
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
export PROJECT_ROOT
cd "$PROJECT_ROOT"

source "${SCRIPT_DIR}/utils.sh"

BACKUP_DIR="${BACKUP_DIR:-deployment/backups/postgres}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
ENV_FILE=""
COMPOSE_FILE=""
DEPLOY_ENV="${DEPLOY_ENV:-}"

show_help() {
    echo "用法: $0 <command> [options]"
    echo ""
    echo "命令:"
    echo "  backup              备份数据库（写入 deployment/backups/postgres/）"
    echo "  restore <file>      从备份文件恢复数据库"
    echo "  list                列出所有备份"
    echo "  migrate             执行 Prisma 迁移"
    echo ""
    echo "环境判定: DEPLOY_ENV=dev|prod 显式指定；否则按 .env.production / .env 自动判定。"
    echo "可用环境变量: DEPLOY_ENV、BACKUP_DIR、BACKUP_RETENTION_DAYS、POSTGRES_USER、POSTGRES_DB"
}

# 环境配置：两个 compose 文件都在 deployment/ 下
# DEPLOY_ENV 可由 deploy.sh --env 显式传入；未指定时按 env 文件自动判定
detect_env_config() {
    case "${DEPLOY_ENV:-auto}" in
        prod)
            ENV_FILE=".env.production"
            COMPOSE_FILE="deployment/docker-compose.prod.yml"
            DEPLOY_ENV="prod"
            ;;
        dev)
            ENV_FILE=".env"
            COMPOSE_FILE="deployment/docker-compose.yml"
            DEPLOY_ENV="dev"
            ;;
        *)
            if [ -f .env.production ]; then
                ENV_FILE=".env.production"
                COMPOSE_FILE="deployment/docker-compose.prod.yml"
                DEPLOY_ENV="prod"
            elif [ -f .env ]; then
                ENV_FILE=".env"
                COMPOSE_FILE="deployment/docker-compose.yml"
                DEPLOY_ENV="dev"
            else
                log_error "未找到环境配置文件 (.env 或 .env.production)"
                exit 1
            fi
            ;;
    esac

    if [ -f "$ENV_FILE" ]; then
        load_env "$ENV_FILE"
    else
        log_warn "环境变量文件不存在: $ENV_FILE（使用当前进程环境）"
    fi
}

check_docker_status() {
    if ! docker compose -f "$COMPOSE_FILE" ps --services --filter "status=running" | grep -qx "postgres"; then
        log_error "PostgreSQL 服务未运行，无法执行操作"
        exit 1
    fi
}

backup_db() {
    detect_env_config
    check_docker_status

    local timestamp
    timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="interview_ai_${timestamp}.sql.gz"
    local backup_path="${BACKUP_DIR}/${backup_file}"

    log_info "开始 PostgreSQL 备份 ($DEPLOY_ENV)..."
    mkdir -p "$BACKUP_DIR"

    docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
        -U "${POSTGRES_USER:-postgres}" \
        -d "${POSTGRES_DB:-interview_ai}" \
        --format=custom \
        --compress=9 \
        | gzip > "$backup_path"

    local size
    size=$(du -h "$backup_path" | cut -f1)
    log_info "✓ 备份成功: ${backup_file} (大小: ${size})"

    find "$BACKUP_DIR" -name "interview_ai_*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete
    log_info "已清理 ${RETENTION_DAYS} 天前的旧备份"
}

restore_db() {
    local backup_file="$1"
    if [ -z "$backup_file" ]; then
        log_error "请指定备份文件"
        show_help
        exit 1
    fi

    detect_env_config

    local backup_path="${BACKUP_DIR}/${backup_file}"
    if [ ! -f "$backup_path" ] && [ -f "$backup_file" ]; then
        backup_path="$backup_file"
    fi
    if [ ! -f "$backup_path" ]; then
        log_error "备份文件不存在: ${backup_path}"
        exit 1
    fi

    check_docker_status

    log_warn "⚠️  警告: 此操作将覆盖当前数据库!"
    log_warn "备份文件: ${backup_path}"
    log_warn "按 Ctrl+C 取消，或等待 5 秒继续..."
    sleep 5

    log_info "正在恢复数据库..."
    gunzip -c "$backup_path" | docker compose -f "$COMPOSE_FILE" exec -T postgres pg_restore \
        -U "${POSTGRES_USER:-postgres}" \
        -d "${POSTGRES_DB:-interview_ai}" \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges

    log_info "✓ 数据库恢复成功"
    if [ "$DEPLOY_ENV" = "prod" ]; then
        log_info "重启后端服务..."
        docker compose -f "$COMPOSE_FILE" restart backend
    else
        log_info "开发 compose 不含 backend 容器，跳过重启"
    fi
}

list_backups() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_warn "备份目录不存在: ${BACKUP_DIR}"
        return
    fi

    echo "现有备份:"
    ls -lh "${BACKUP_DIR}"/interview_ai_*.sql.gz 2>/dev/null || echo "（暂无备份）"
}

migrate_db() {
    detect_env_config
    check_docker_status

    log_info "执行数据库迁移 ($DEPLOY_ENV)..."
    if [ "$DEPLOY_ENV" = "prod" ]; then
        docker compose -f "$COMPOSE_FILE" run --rm backend prisma migrate deploy
    else
        # 开发 compose 只有基础设施，没有 backend 服务，迁移走本地 Prisma
        pnpm --filter @interview-ai/backend exec prisma migrate deploy
    fi
    log_info "✓ 数据库迁移成功"
}

case "${1:-}" in
    backup) backup_db ;;
    restore) restore_db "${2:-}" ;;
    list) list_backups ;;
    migrate) migrate_db ;;
    *) show_help; exit 1 ;;
esac
