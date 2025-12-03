#!/bin/bash
# 数据库恢复脚本
# 从备份文件恢复 PostgreSQL 数据库

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置
BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"

# 检查参数
if [ -z "$1" ]; then
    echo "用法: $0 <backup_file>"
    echo ""
    echo "可用的备份文件:"
    ls -lh ${BACKUP_DIR}/resume_optimizer_*.sql.gz 2>/dev/null || echo "未找到备份文件"
    exit 1
fi

BACKUP_FILE=$1

# 检测环境
if [ -f ".env.production" ]; then
    ENV_FILE=".env.production"
    COMPOSE_FILE="deployment/docker-compose.prod.yml"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
    COMPOSE_FILE="docker-compose.yml"
else
    print_error "未找到环境配置文件"
    exit 1
fi

# 加载环境变量
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# 检查备份文件
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
if [ ! -f "${BACKUP_PATH}" ]; then
    # 尝试直接使用提供的路径
    if [ -f "${BACKUP_FILE}" ]; then
        BACKUP_PATH="${BACKUP_FILE}"
    else
        print_error "备份文件不存在: ${BACKUP_PATH}"
        exit 1
    fi
fi

print_warn "=========================================="
print_warn "数据库恢复警告"
print_warn "=========================================="
print_warn "此操作将覆盖当前数据库!"
print_warn "备份文件: ${BACKUP_PATH}"
print_warn ""
print_warn "按 Ctrl+C 取消，或等待 10 秒继续..."
sleep 10

print_info "开始恢复数据库..."

# 检查数据库服务是否运行
if ! docker-compose -f $COMPOSE_FILE ps | grep -q "postgres.*Up"; then
    print_error "PostgreSQL 服务未运行"
    exit 1
fi

# 解压并恢复
print_info "正在恢复数据库从: ${BACKUP_PATH}"

gunzip -c ${BACKUP_PATH} | docker-compose -f $COMPOSE_FILE exec -T postgres pg_restore \
    -U ${POSTGRES_USER:-postgres} \
    -d ${POSTGRES_DB:-resume_optimizer} \
    --clean \
    --if-exists \
    --verbose

# 检查恢复是否成功
if [ $? -eq 0 ]; then
    print_info "✓ 数据库恢复成功!"
    
    # 重启应用服务以应用更改
    print_info "重启应用服务..."
    docker-compose -f $COMPOSE_FILE restart backend
    
    print_info "✓ 恢复流程完成"
else
    print_error "数据库恢复失败!"
    exit 1
fi
