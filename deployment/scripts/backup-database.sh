#!/bin/bash
# 数据库备份脚本
# 支持 PostgreSQL 自动备份和云存储上传

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
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="resume_optimizer_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

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

print_info "开始 PostgreSQL 备份..."

# 创建备份目录
mkdir -p ${BACKUP_DIR}

# 检查数据库服务是否运行
if ! docker-compose -f $COMPOSE_FILE ps | grep -q "postgres.*Up"; then
    print_error "PostgreSQL 服务未运行"
    exit 1
fi

# 执行备份
print_info "正在备份数据库到: ${BACKUP_FILE}"

docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump \
    -U ${POSTGRES_USER:-postgres} \
    -d ${POSTGRES_DB:-resume_optimizer} \
    --format=custom \
    --compress=9 \
    --verbose \
    | gzip > ${BACKUP_DIR}/${BACKUP_FILE}

# 检查备份是否成功
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h ${BACKUP_DIR}/${BACKUP_FILE} | cut -f1)
    print_info "✓ 备份完成: ${BACKUP_FILE} (大小: ${BACKUP_SIZE})"
    
    # 清理旧备份
    print_info "清理 ${RETENTION_DAYS} 天前的旧备份..."
    find ${BACKUP_DIR} -name "resume_optimizer_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
    
    # 列出当前备份
    print_info "当前备份列表:"
    ls -lh ${BACKUP_DIR}/resume_optimizer_*.sql.gz 2>/dev/null || print_warn "未找到备份文件"
    
    # 可选: 上传到云存储
    if [ ! -z "${BACKUP_S3_BUCKET}" ]; then
        print_info "上传备份到 S3: ${BACKUP_S3_BUCKET}"
        if command -v aws &> /dev/null; then
            aws s3 cp ${BACKUP_DIR}/${BACKUP_FILE} s3://${BACKUP_S3_BUCKET}/backups/postgres/
            print_info "✓ 备份已上传到 S3"
        else
            print_warn "AWS CLI 未安装，跳过 S3 上传"
        fi
    fi
    
    if [ ! -z "${BACKUP_OSS_BUCKET}" ]; then
        print_info "上传备份到阿里云 OSS: ${BACKUP_OSS_BUCKET}"
        if command -v ossutil &> /dev/null; then
            ossutil cp ${BACKUP_DIR}/${BACKUP_FILE} oss://${BACKUP_OSS_BUCKET}/backups/postgres/
            print_info "✓ 备份已上传到 OSS"
        else
            print_warn "ossutil 未安装，跳过 OSS 上传"
        fi
    fi
else
    print_error "备份失败!"
    exit 1
fi

print_info "备份流程完成"
