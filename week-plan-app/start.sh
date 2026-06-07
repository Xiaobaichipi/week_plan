#!/usr/bin/env bash
# ============================================
# Week Plan App — 启动脚本
# 自动安装依赖并启动开发服务器
# ============================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  Week Plan App — 周计划管理应用"
echo "========================================"
echo ""

# 检查 node
if ! command -v node &> /dev/null; then
  echo "❌ 未找到 Node.js，请先安装: https://nodejs.org"
  exit 1
fi

echo "✓ Node.js $(node -v)"

# 安装依赖
if [ ! -d "node_modules" ]; then
  echo ""
  echo "📦 首次运行，正在安装依赖..."
  npm install
  echo ""
  echo "✓ 依赖安装完成"
else
  echo "✓ 依赖已就绪"
fi

echo ""
echo "🚀 启动开发服务器..."
echo ""
echo "  打开浏览器访问: http://localhost:3000"
echo "  按 Ctrl+C 停止服务"
echo ""

# 启动开发服务器 + 打开浏览器
npx vite --open
