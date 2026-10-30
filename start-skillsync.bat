@echo off
title SkillSync AI Platform Launcher
color 0A

echo ===================================================
echo           SKILLSYNC AI PLATFORM LAUNCHER
echo ===================================================
echo.

echo [1/3] Checking MongoDB Database Service...
sc query MongoDB | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] MongoDB Service is already running!
) else (
    echo [..] Starting MongoDB Service...
    net start MongoDB
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] Could not start MongoDB service automatically.
        echo Please ensure MongoDB is installed or running on 127.0.0.1:27017.
    ) else (
        echo [OK] MongoDB Service started successfully!
    )
)
echo.

echo [2/3] Starting SkillSync AI Backend Server on Port 5000...
cd /d "D:\MEGA PROJECT\SkillSyncAI3\skillsync-ai-backend\skillsync-ai-backend"
start "SkillSync AI Backend Server (Port 5000)" cmd /k "node server.js"
timeout /t 3 /nobreak >nul
echo.

echo [3/3] Opening SkillSync AI Web App in Browser...
start "" "http://localhost:5000"
echo.

echo ===================================================
echo [SUCCESS] SkillSync AI is now LIVE and CONNECTED!
echo - Web App: http://localhost:5000
echo - Backend API: http://localhost:5000/api/status
echo - Database: MongoDB (skillsync_ai)
echo ===================================================
timeout /t 5 >nul
