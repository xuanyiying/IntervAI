#!/bin/bash
# ==============================================================================
# Backend 重启问题诊断脚本
# 用于远程服务器诊断
# ==============================================================================

set -e

echo "=========================================="
echo "Backend 容器诊断工具"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查容器状态
echo -e "${YELLOW}[1/8] 检查容器状态...${NC}"
docker ps -a --filter "name=backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. 获取容器详细状态
echo -e "${YELLOW}[2/8] 获取容器详细信息...${NC}"
BACKEND_STATUS=$(docker inspect backend --format='{{.State.Status}}' 2>/dev/null || echo "not_found")
BACKEND_RESTART_COUNT=$(docker inspect backend --format='{{.RestartCount}}' 2>/dev/null || echo "0")
BACKEND_ERROR=$(docker inspect backend --format='{{.State.Error}}' 2>/dev/null || echo "")

echo "状态: $BACKEND_STATUS"
echo "重启次数: $BACKEND_RESTART_COUNT"
if [ -n "$BACKEND_ERROR" ]; then
    echo -e "${RED}错误: $BACKEND_ERROR${NC}"
fi
echo ""

# 3. 查看最近的日志（最重要）
echo -e "${YELLOW}[3/8] 查看 Backend 启动日志（最近 100 行）...${NC}"
echo "----------------------------------------"
docker logs backend --tail 100 2>&1 || echo "无法获取日志"
echo "----------------------------------------"
echo ""

# 4. 检查依赖服务状态
echo -e "${YELLOW}[4/8] 检查依赖服务状态...${NC}"

# PostgreSQL
echo -n "PostgreSQL: "
if docker exec postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo -e "${GREEN}✓ 运行正常${NC}"
else
    echo -e "${RED}✗ 连接失败${NC}"
    echo "PostgreSQL 日志："
    docker logs postgres --tail 20 2>&1
fi

# Redis
echo -n "Redis: "
REDIS_PASSWORD=$(grep REDIS_PASSWORD .env.production 2>/dev/null | cut -d'=' -f2 || echo "")
if [ -n "$REDIS_PASSWORD" ]; then
    if docker exec redis redis-cli -a "$REDIS_PASSWORD" ping >/dev/null 2>&1; then
        echo -e "${GREEN}✓ 运行正常${NC}"
    else
        echo -e "${RED}✗ 连接失败${NC}"
        echo "Redis 日志："
        docker logs redis --tail 20 2>&1
    fi
else
    if docker exec redis redis-cli ping >/dev/null 2>&1; then
        echo -e "${GREEN}✓ 运行正常${NC}"
    else
        echo -e "${RED}✗ 连接失败${NC}"
    fi
fi

# ChromaDB
echo -n "ChromaDB: "
if docker exec chromadb curl -s http://localhost:8000/api/v1/heartbeat >/dev/null 2>&1; then
    echo -e "${GREEN}✓ 运行正常${NC}"
else
    echo -e "${RED}✗ 连接失败${NC}"
fi

# MinIO
echo -n "MinIO: "
if docker exec minio curl -s http://localhost:9000/minio/health/live >/dev/null 2>&1; then
    echo -e "${GREEN}✓ 运行正常${NC}"
else
    echo -e "${RED}✗ 连接失败${NC}"
fi
echo ""

# 5. 检查网络连接
echo -e "${YELLOW}[5/8] 检查网络连接...${NC}"
echo "Docker 网络列表："
docker network ls | grep app-network || echo "未找到 app-network"
echo ""

# 6. 检查环境变量配置
echo -e "${YELLOW}[6/8] 检查关键环境变量...${NC}"
if [ -f ".env.production" ]; then
    echo "DATABASE_URL: $(grep DATABASE_URL .env.production | cut -d'=' -f2 | sed 's/:[^:]*@/:***@/')"
    echo "REDIS_HOST: $(grep REDIS_HOST .env.production | cut -d'=' -f2)"
    echo "REDIS_PORT: $(grep REDIS_PORT .env.production | cut -d'=' -f2)"
    echo "OSS_ENDPOINT: $(grep OSS_ENDPOINT .env.production | cut -d'=' -f2)"
    echo "JWT_SECRET: $(grep JWT_SECRET .env.production | cut -d'=' -f2 | head -c 20)..."
else
    echo -e "${RED}未找到 .env.production 文件${NC}"
fi
echo ""

# 7. 检查资源使用
echo -e "${YELLOW}[7/8] 检查系统资源...${NC}"
echo "内存使用："
free -h | grep -E "Mem|Swap"
echo ""
echo "磁盘使用："
df -h | grep -E "Filesystem|/$"
echo ""
echo "容器资源使用："
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "无法获取容器统计信息"
echo ""

# 8. 尝试获取健康检查日志
echo -e "${YELLOW}[8/8] 检查健康检查状态...${NC}"
HEALTH_STATUS=$(docker inspect backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "no_healthcheck")
echo "健康检查状态: $HEALTH_STATUS"

if [ "$HEALTH_STATUS" != "no_healthcheck" ]; then
    echo "最近的健康检查日志："
    docker inspect backend --format='{{range .State.Health.Log}}{{.Output}}{{end}}' 2>/dev/null | tail -5
fi
echo ""

# 总结和建议
echo "=========================================="
echo -e "${YELLOW}诊断总结${NC}"
echo "=========================================="

if [ "$BACKEND_RESTART_COUNT" -gt 10 ]; then
    echo -e "${RED}⚠ Backend 已重启 $BACKEND_RESTART_COUNT 次，存在严重问题${NC}"
fi

echo ""
echo "建议的下一步操作："
echo "1. 查看完整日志: docker logs backend --tail 500"
echo "2. 检查数据库连接: docker exec postgres psql -U postgres -d interview_ai -c 'SELECT 1;'"
echo "3. 重新构建: docker compose -f deployment/docker-compose.prod.yml up -d --build --force-recreate backend"
echo "4. 查看实时日志: docker logs -f backend"
echo ""

# 保存诊断结果
REPORT_FILE="backend-diagnosis-$(date +%Y%m%d-%H%M%S).log"
echo "正在保存诊断报告到: $REPORT_FILE"
{
    echo "Backend 诊断报告 - $(date)"
    echo "======================================"
    echo ""
    echo "容器状态: $BACKEND_STATUS"
    echo "重启次数: $BACKEND_RESTART_COUNT"
    echo ""
    echo "最近日志："
    docker logs backend --tail 200 2>&1
} > "$REPORT_FILE"

echo -e "${GREEN}诊断完成！报告已保存到 $REPORT_FILE${NC}"
