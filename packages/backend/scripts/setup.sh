#!/bin/bash
# ==============================================================================
# 本地开发环境初始化（由 packages/backend 的 `pnpm setup` 调用）
# 与 README / docs/guide/environment-setup.md 的流程保持一致。
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
cd "$ROOT_DIR"

echo "🚀 IntervAI 本地环境初始化"
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "❌ 未找到 Node.js，请安装 Node.js 18+"
    exit 1
fi
if ! command -v pnpm >/dev/null 2>&1; then
    echo "❌ 未找到 pnpm，请安装 pnpm 9+（packageManager: pnpm@9.0.0）"
    exit 1
fi
echo "✅ Node $(node --version) / pnpm $(pnpm --version)"

echo ""
echo "📦 安装 workspace 依赖..."
pnpm install

echo ""
echo "📝 配置环境变量..."
for pkg in backend frontend; do
    if [ ! -f "packages/${pkg}/.env" ]; then
        cp "packages/${pkg}/.env.example" "packages/${pkg}/.env"
        echo "✅ 已创建 packages/${pkg}/.env（请按实际环境修改）"
    else
        echo "✅ packages/${pkg}/.env 已存在"
    fi
done

COMPOSE_FILE="deployment/docker-compose.yml"
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    echo ""
    read -r -p "🐳 是否启动 PostgreSQL / Redis / MinIO / Jaeger？(y/n) " -n 1 reply
    echo
    if [[ $reply =~ ^[Yy]$ ]]; then
        docker compose -f "$COMPOSE_FILE" up -d
        docker compose -f "$COMPOSE_FILE" ps
    fi
else
    echo "⚠️  未检测到 Docker Compose v2，请自行准备 PostgreSQL 16 与 Redis 7"
fi

echo ""
read -r -p "🗄️  是否生成 Prisma Client 并执行迁移？(y/n) " -n 1 reply
echo
if [[ $reply =~ ^[Yy]$ ]]; then
    pnpm --filter @interview-ai/backend prisma:generate
    pnpm --filter @interview-ai/backend prisma:migrate

    echo ""
    read -r -p "🌱 是否初始化管理员 / 模板数据？(y/n) " -n 1 reply
    echo
    if [[ $reply =~ ^[Yy]$ ]]; then
        pnpm --filter @interview-ai/backend prisma:seed
    fi
fi

echo ""
echo "✨ 初始化完成，接下来："
echo "  1. 按需编辑 packages/backend/.env 与 packages/frontend/.env"
echo "  2. 启动服务：pnpm dev"
echo "  3. 前端 http://localhost:5173 · Swagger http://localhost:3000/api/docs"
echo "  4. 健康检查：curl http://localhost:3000/health"
echo "  5. 详见 docs/guide/environment-setup.md"
