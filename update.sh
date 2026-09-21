#!/usr/bin/env bash
set -euo pipefail

# 确保在脚本所在目录执行
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "      New API 容器服务自动更新脚本        "
echo "=========================================="

# 1. 拉取最新代码
echo "==> [1/3] 拉取远程最新代码 (git pull origin main)..."
git pull origin main

# 2. 构建本地镜像
echo "==> [2/3] 构建 Docker 本地镜像 (new-api:custom)..."
docker build --no-cache -t new-api:custom .

# 3. 重启容器服务
echo "==> [3/3] 重启容器服务 (docker compose up -d --force-recreate)..."
if docker compose version >/dev/null 2>&1; then
    docker compose up -d --force-recreate
elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose up -d --force-recreate
else
    echo "错误: 未检测到 docker compose 或 docker-compose 命令！" >&2
    exit 1
fi

# 4. 自动清理构建留下的虚悬镜像（释放磁盘空间）
if [ -n "$(docker images -f "dangling=true" -q 2>/dev/null || true)" ]; then
    echo "==> [清理] 清理构建产生的虚悬镜像..."
    docker image prune -f
fi

echo "=========================================="
echo "  更新完成！服务已重新启动并应用最新配置。"
echo "=========================================="
