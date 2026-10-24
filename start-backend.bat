@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo Starting FastAPI AI Backend (Port 8000)...
echo ========================================================
cd /d "%~dp0"

:: Auto-detect and release port 8000 if occupied by a stale process
for /f "tokens=5" %%p in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo [INFO] Port 8000 is occupied by process PID %%p. Freeing port 8000...
    taskkill /F /PID %%p >nul 2>&1
    timeout /t 1 /nobreak >nul
)

"%~dp0venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
