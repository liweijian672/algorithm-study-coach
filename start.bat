@echo off
setlocal
chcp 65001 >nul
title Algo Study Coach Launcher
set "ROOT=%~dp0"

echo [1/6] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
  echo Python 3.11+ is required.
  pause
  exit /b 1
)

echo [2/6] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
  echo Node.js 18+ is required.
  pause
  exit /b 1
)

python -c "import fastapi, uvicorn, sqlalchemy, httpx" >nul 2>&1
if errorlevel 1 (
  echo Installing backend dependencies...
  python -m pip install -e "%ROOT%backend[dev]"
  if errorlevel 1 (
    echo Failed to install backend dependencies.
    pause
    exit /b 1
  )
)

if not exist "%ROOT%dashboard\node_modules" (
  echo Installing dashboard dependencies...
  call npm install --prefix "%ROOT%dashboard"
)

if not exist "%ROOT%extension\node_modules" (
  echo Installing extension dependencies...
  call npm install --prefix "%ROOT%extension"
)

echo [3/6] Building browser extension...
call npm --prefix "%ROOT%extension" run build
if errorlevel 1 (
  echo Extension build failed.
  pause
  exit /b 1
)

echo [4/6] Starting backend...
netstat -ano | findstr /C:":8000 " | findstr /C:"LISTENING" >nul
if errorlevel 1 (
  start "Algo Coach Backend" cmd /k "cd /d %ROOT%backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
) else (
  echo Backend is already running on port 8000.
)

echo [5/6] Starting dashboard...
netstat -ano | findstr /C:":5173 " | findstr /C:"LISTENING" >nul
if errorlevel 1 (
  start "Algo Coach Dashboard" cmd /k "cd /d %ROOT%dashboard && npm run dev"
) else (
  echo Dashboard is already running on port 5173.
)

echo [6/6] Opening dashboard...
start "" http://127.0.0.1:5173

echo.
echo Dashboard: http://127.0.0.1:5173
echo Backend:   http://127.0.0.1:8000
echo Extension: load "%ROOT%extension\dist" in chrome://extensions
echo.
pause
