@echo off
:: Week Plan App — Startup Script
:: Double-click to run

cd /d "%~dp0"

echo ========================================
echo   Week Plan App
echo ========================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found
    echo Install from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do echo [OK] Node.js %%i

:: Install dependencies
if not exist "node_modules\" (
    echo.
    echo [SETUP] Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Install failed, check network
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies ready
)

echo.
echo [START] Starting dev server...
echo.
echo    Open: http://localhost:3000
echo    Close this window to stop
echo.

npx vite --open --host

:: If vite exits unexpectedly
echo.
echo Server stopped. Press any key to close...
pause
