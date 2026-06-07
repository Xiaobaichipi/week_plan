@echo off
:: ============================================
:: Week Plan App — 启动脚本 (Windows)
:: 双击即可运行，自动安装依赖并启动
:: ============================================

:: 切换到脚本所在目录
cd /d "%~dp0"

echo ========================================
echo   Week Plan App — 周计划管理应用
echo ========================================
echo.

:: 检查 node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js
    echo 请先安装: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js %node_version%
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo %NODE_VER%

:: 安装依赖
if not exist "node_modules\" (
    echo.
    echo [安装] 首次运行，正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
    echo.
    echo [OK] 依赖安装完成
) else (
    echo [OK] 依赖已就绪
)

echo.
echo [启动] 正在启动开发服务器...
echo.
echo   浏览器访问: http://localhost:3000
echo   关闭此窗口即可停止服务
echo.

:: 启动开发服务器
npx vite --open --host

:: 如果 vite 异常退出，暂停以便看到错误信息
echo.
echo [提示] 服务器已停止，按任意键关闭窗口...
pause
