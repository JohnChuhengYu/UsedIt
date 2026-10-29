@echo off
setlocal enabledelayedexpansion
title UsedIt - One-Click Launcher

echo =================================================================
echo   UsedIt - Local-First Active Vocabulary Training Platform
echo =================================================================
echo.

:: Resolve absolute directory of this script
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

:: 1. Check Ollama
echo [1/4] Checking Ollama service...
where ollama >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo   [OK] Ollama CLI detected.
) else (
    echo   [INFO] Ollama not found in PATH. (Install from https://ollama.com for local AI)
)

:: 2. Setup Backend
echo.
echo [2/4] Setting up Python backend (FastAPI)...
cd /d "%BACKEND_DIR%"
if not exist "venv" (
    echo   Creating Python virtual environment...
    python -m venv venv
)

if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo   [OK] Created backend\.env from template
    )
)

call venv\Scripts\activate.bat
python -c "import uvicorn, fastapi, sqlmodel, chromadb" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo   Installing backend dependencies (first-time setup)...
    pip install -r requirements.txt
)

echo   [OK] Launching FastAPI backend on http://localhost:8000...
start "UsedIt Backend (FastAPI)" /min cmd /c "venv\Scripts\activate.bat && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: 3. Setup Frontend
echo.
echo [3/4] Setting up React frontend (Vite)...
cd /d "%FRONTEND_DIR%"
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo   [OK] Created frontend\.env from template
    )
)

if not exist "node_modules" (
    echo   Installing frontend dependencies (first-time setup)...
    call npm install
)

echo   [OK] Launching Vite frontend on http://localhost:5173...
start "UsedIt Frontend (Vite)" /min cmd /c "npm run dev"

:: 4. Open Browser
echo.
echo [4/4] Opening application in browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo =================================================================
echo   UsedIt is up and running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000/docs
echo =================================================================
echo.
echo Close the background command windows when you are done.
pause
