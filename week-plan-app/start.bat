@echo off
chcp 65001 >nul
:: ============================================
:: Week Plan App — 启动脚本 (Windows)
:: 自动安装依赖并启动开发服务器
:: ============================================

echo ========================================
echo   Week Plan App — 周计划管理应用
echo ========================================
echo.

:: 检查 node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js，请先安装: https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Node.js
node -v

:: 安装依赖
if not exist "node_modules" (
    echo.
    echo 📦 首次运行，正在安装依赖...
    call npm install
    echo.
    echo ✓ 依赖安装完成
) else (
    echo ✓ 依赖已就绪
)

echo.
echo 🚀 启动开发服务器...
echo.
echo   打开浏览器访问: http://localhost:3000
echo   按 Ctrl+C 停止服务
echo.

:: 启动开发服务器 + 打开浏览器
call npx vite --open
