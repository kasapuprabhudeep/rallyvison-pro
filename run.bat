@echo off
echo ========================================================
echo  Starting RallyVision Pro (Backend + Frontend)
echo ========================================================
echo.

:: 1. Start Backend in a new terminal window
start "RallyVision Pro - Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: 2. Wait 2 seconds for backend to initialize
ping 127.0.0.1 -n 3 >nul

:: 3. Start Frontend in a new terminal window
start "RallyVision Pro - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --host"

:: 4. Wait 2 seconds for Vite, then launch browser
ping 127.0.0.1 -n 3 >nul
start http://localhost:5173

echo Servers are running in separate terminal windows!
echo - Frontend: http://localhost:5173
echo - Backend API Docs: http://localhost:8000/docs
echo.

