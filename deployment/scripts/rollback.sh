#!/bin/bash
# ==============================================================================
# IntervAI - 回滚脚本
# ==============================================================================

set -e

# 路径定义
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_SCRIPT="${PROJECT_ROOT}/deploy.sh"

# 帮助信息
show_help() {
    echo "用法: $0 <version> [options]"
    echo ""
    echo "参数:"
    echo "  version              要回滚到的版本标签 (例如: v1.0.0)"
    echo ""
    echo "选项:"
    echo "  -e, --env <env>      环境: prod (默认) 或 dev"
    echo "  --help               显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 v1.0.0"
    echo "  $0 v1.0.1 --env prod"
}

if [ -z "$1" ]; then
    show_help
    exit 1
fi

VERSION="$1"
shift

ENV="prod"

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env) ENV="$2"; shift 2 ;;
        -h|--help) show_help; exit 0 ;;
        *) echo "未知参数: $1"; exit 1 ;;
    esac
done

echo ">>> 正在回滚到版本: ${VERSION} (环境: ${ENV}) <<<"

# 设置镜像变量
# 注意：这里的镜像仓库地址需要与 deploy.yml 中的一致
# 如果需要动态配置仓库，建议从 .env 文件读取或作为参数传入
REPO_PREFIX="ghcr.io/interview-ai"

export BACKEND_IMAGE="${REPO_PREFIX}/backend:${VERSION}"
export FRONTEND_IMAGE="${REPO_PREFIX}/frontend:${VERSION}"

echo "Backend Image: ${BACKEND_IMAGE}"
echo "Frontend Image: ${FRONTEND_IMAGE}"

# 调用主部署脚本
# 使用 --skip-build 和 --skip-pull 因为我们要使用特定的镜像版本，而不是构建或拉取 latest
"${DEPLOY_SCRIPT}" --env "${ENV}" --skip-build --skip-pull

echo ">>> 回滚完成 <<<"
