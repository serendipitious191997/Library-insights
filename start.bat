@echo off
title Library Circulation and Demand Dashboard Launcher
setlocal EnableDelayedExpansion

echo =====================================================================
echo       LIBRARY CIRCULATION AND DEMAND DASHBOARD
echo               Full-Stack Web Application
echo =====================================================================
echo.

:: Ensure uv and node are on PATH
set "PATH=C:\Users\lenovo\.local\bin;C:\Program Files\nodejs;%PATH%"

echo [1/3] Checking environment runtimes...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on PATH. Please ensure Node.js is installed.
    pause
    exit /b 1
)

where uv >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] uv is not found on PATH. Please install uv.
    pause
    exit /b 1
)

echo [OK] Runtime dependencies located.
echo.

echo [2/3] Starting FastAPI Backend on http://localhost:8000 ...
start "Library API - FastAPI Backend (Port 8000)" cmd /k "cd /d %~dp0backend && set PATH=C:\Users\lenovo\.local\bin;C:\Program Files\nodejs;%%PATH%% && .venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [3/3] Starting React Frontend on http://localhost:5173 ...
start "Library Web - React Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && set PATH=C:\Users\lenovo\.local\bin;C:\Program Files\nodejs;%%PATH%% && npm.cmd run dev"

echo.
echo =====================================================================
echo              ALL SERVICES LAUNCHED SUCCESSFULLY!
echo =====================================================================
echo.
echo   Frontend Application:  http://localhost:5173
echo   Backend API Root:      http://localhost:8000
echo   API Interactive Docs:  http://localhost:8000/docs
echo   Alternative ReDoc:     http://localhost:8000/redoc
echo.
echo   SQLite Database:       backend/library.db
echo   Sample CSV Data:       backend/data/sample_library.csv
echo.
echo Both servers are running in separate terminal windows.
echo To shut down the application, close the server terminal windows.
echo =====================================================================
echo.
pause
