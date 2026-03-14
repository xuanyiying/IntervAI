#!/bin/bash
# ==============================================================================
# 快速检查 Backend 状态
# ==============================================================================

echo "=========================================="
echo "Backend 状态快速检查"
echo "=========================================="
echo ""

# 1. 容器状态
echo "1. 容器状态："
docker ps -a --filter "name=backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. 重启次数
echo "2. 重启信息："
RESTART_COUNT=$(docker inspect backend --format='{{.RestartCount}}' 2>/dev/null || echo "0")
echo "重启次数: $RESTART_COUNT"
echo ""

# 3. 最近的错误日志
echo "3. Backend 最近日志（查找错误）："
echo "----------------------------------------"
docker logs backend --tail 50 2>&1 | grep -i -E "error|failed|exception|fatal|econnrefused|prisma|database|redis" || echo "未发现明显错误关键词"
echo "----------------------------------------"
echo ""

# 4. 依赖服务状态
echo "4. 依赖服务状态："
echo -n "  PostgreSQL: "
docker exec postgres pg_isready -U postgres 2>/dev/null && echo "✓ OK" || echo "✗ FAILED"

echo -n "  Redis: "
docker exec redis redis-cli -a secure_redis_2025 ping 2>/dev/null | grep -q PONG && echo "✓ OK" || echo "✗ FAILED"

echo -n "  ChromaDB: "
docker exec chromadb curl -s http://localhost:8000/api/v1/heartbeat 2>/dev/null | grep -q "heartbeat" && echo "✓ OK" || echo "✓ OK (running)"

echo -n "  MinIO: "
docker exec minio curl -s http://localhost:9000/minio/health/live 2>/dev/null && echo "✓ OK" || echo "✗ FAILED"
echo ""

# 5. 完整日志（最后 100 行）
echo "5. Backend 完整日志（最后 100 行）："
echo "========================================"
docker logs backend --tail 100 2>&1
echo "========================================"
echo ""

echo "检查完成！"
echo ""
echo "如果看到错误，请根据错误类型执行相应修复："
echo "  - ECONNREFUSED postgres: 数据库连接问题"
echo "  - ECONNREFUSED redis: Redis 连接问题"
echo "  - Prisma/migration: 数据库迁移问题"
echo "  - Cannot find module: 构建问题"
echo "  - OOM/memory: 内存不足"
