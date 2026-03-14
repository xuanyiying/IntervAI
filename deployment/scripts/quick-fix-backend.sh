#!/bin/bash
# ==============================================================================
# Backend 快速修复脚本
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Backend 快速修复工具"
echo "=========================================="
echo ""

# 切换到项目根目录
cd "$(dirname "$0")/../.." || exit 1

# 检查 compose 文件
COMPOSE_FILE="deployment/docker-compose.prod.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}错误: 找不到 $COMPOSE_FILE${NC}"
    exit 1
fi

# 修复选项
echo "请选择修复方案："
echo "1. 重启 Backend（保留数据）"
echo "2. 重新构建 Backend（保留数据）"
echo "3. 完全重置（清除所有数据，重新开始）"
echo "4. 仅修复数据库连接"
echo "5. 查看详细日志"
echo "6. 手动调试模式"
echo ""
read -p "请输入选项 (1-6): " choice

case $choice in
    1)
        echo -e "${YELLOW}方案 1: 重启 Backend...${NC}"
        
        # 停止 backend
        echo "停止 Backend 容器..."
        docker compose -f "$COMPOSE_FILE" stop backend
        
        # 等待 5 秒
        sleep 5
        
        # 启动 backend
        echo "启动 Backend 容器..."
        docker compose -f "$COMPOSE_FILE" up -d backend
        
        # 查看日志
        echo ""
        echo "查看启动日志（按 Ctrl+C 退出）..."
        sleep 3
        docker logs -f backend
        ;;
        
    2)
        echo -e "${YELLOW}方案 2: 重新构建 Backend...${NC}"
        
        # 停止 backend
        echo "停止 Backend 容器..."
        docker compose -f "$COMPOSE_FILE" stop backend
        
        # 删除容器
        echo "删除旧容器..."
        docker compose -f "$COMPOSE_FILE" rm -f backend
        
        # 重新构建
        echo "重新构建镜像（这可能需要几分钟）..."
        docker compose -f "$COMPOSE_FILE" build --no-cache backend
        
        # 启动
        echo "启动 Backend 容器..."
        docker compose -f "$COMPOSE_FILE" up -d backend
        
        # 查看日志
        echo ""
        echo "查看启动日志（按 Ctrl+C 退出）..."
        sleep 3
        docker logs -f backend
        ;;
        
    3)
        echo -e "${RED}警告: 这将删除所有数据！${NC}"
        read -p "确认继续？(yes/no): " confirm
        
        if [ "$confirm" != "yes" ]; then
            echo "已取消"
            exit 0
        fi
        
        echo -e "${YELLOW}方案 3: 完全重置...${NC}"
        
        # 停止所有服务
        echo "停止所有服务..."
        docker compose -f "$COMPOSE_FILE" down
        
        # 删除数据卷
        echo "删除数据卷..."
        docker volume rm deployment_postgres_data deployment_redis_data deployment_chroma_data deployment_minio_data 2>/dev/null || true
        
        # 重新构建
        echo "重新构建所有镜像..."
        docker compose -f "$COMPOSE_FILE" build --no-cache
        
        # 启动依赖服务
        echo "启动依赖服务..."
        docker compose -f "$COMPOSE_FILE" up -d postgres redis chromadb minio
        
        # 等待服务就绪
        echo "等待服务就绪（30秒）..."
        sleep 30
        
        # 执行数据库迁移
        echo "执行数据库迁移..."
        docker compose -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy
        
        # 启动 backend
        echo "启动 Backend..."
        docker compose -f "$COMPOSE_FILE" up -d backend
        
        # 启动其他服务
        echo "启动其他服务..."
        docker compose -f "$COMPOSE_FILE" up -d
        
        echo -e "${GREEN}重置完成！${NC}"
        docker compose -f "$COMPOSE_FILE" ps
        ;;
        
    4)
        echo -e "${YELLOW}方案 4: 修复数据库连接...${NC}"
        
        # 检查 PostgreSQL
        echo "检查 PostgreSQL..."
        if ! docker exec postgres pg_isready -U postgres; then
            echo -e "${RED}PostgreSQL 未就绪，尝试重启...${NC}"
            docker compose -f "$COMPOSE_FILE" restart postgres
            sleep 10
        fi
        
        # 测试连接
        echo "测试数据库连接..."
        docker exec postgres psql -U postgres -d interview_ai -c "SELECT 1;" || {
            echo -e "${RED}数据库连接失败！${NC}"
            echo "尝试创建数据库..."
            docker exec postgres psql -U postgres -c "CREATE DATABASE interview_ai;" || true
        }
        
        # 执行迁移
        echo "执行数据库迁移..."
        docker compose -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy
        
        # 重启 backend
        echo "重启 Backend..."
        docker compose -f "$COMPOSE_FILE" restart backend
        
        # 查看日志
        sleep 3
        docker logs -f backend
        ;;
        
    5)
        echo -e "${YELLOW}方案 5: 查看详细日志...${NC}"
        echo ""
        echo "=== Backend 日志（最近 200 行）==="
        docker logs backend --tail 200 2>&1
        echo ""
        echo "=== PostgreSQL 日志（最近 50 行）==="
        docker logs postgres --tail 50 2>&1
        echo ""
        echo "=== Redis 日志（最近 50 行）==="
        docker logs redis --tail 50 2>&1
        echo ""
        echo "按任意键查看实时日志..."
        read -n 1
        docker logs -f backend
        ;;
        
    6)
        echo -e "${YELLOW}方案 6: 手动调试模式...${NC}"
        echo ""
        echo "进入 Backend 容器进行手动调试"
        echo "注意：容器可能正在重启，请快速执行命令"
        echo ""
        echo "有用的命令："
        echo "  - env | grep DATABASE  # 查看数据库配置"
        echo "  - env | grep REDIS     # 查看 Redis 配置"
        echo "  - ping postgres        # 测试数据库连接"
        echo "  - ping redis           # 测试 Redis 连接"
        echo "  - npx prisma migrate status  # 查看迁移状态"
        echo ""
        
        # 尝试进入容器
        docker exec -it backend sh || {
            echo -e "${RED}无法进入容器（可能正在重启）${NC}"
            echo "尝试临时停止重启策略..."
            docker update --restart=no backend
            echo "已禁用自动重启，手动启动容器："
            echo "docker start backend && docker exec -it backend sh"
        }
        ;;
        
    *)
        echo -e "${RED}无效选项${NC}"
        exit 1
        ;;
esac
