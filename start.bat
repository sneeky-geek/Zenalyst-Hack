@echo off
setlocal enabledelayedexpansion

REM Start script for Zenalyst-Hack project on Windows
echo Starting Zenalyst-Hack components...

REM Set directory variables
set PROJECT_ROOT=%CD%
set CLIENT_DIR=%PROJECT_ROOT%\Client

REM Check if MongoDB is running via service
echo Checking MongoDB status...
sc query MongoDB > nul
if %ERRORLEVEL% equ 0 (
    echo MongoDB service is available.
) else (
    echo MongoDB service not found. Checking mongod process...
    tasklist /fi "imagename eq mongod.exe" | find "mongod.exe" > nul
    if %ERRORLEVEL% equ 0 (
        echo MongoDB is already running.
    ) else (
        echo Please start MongoDB manually before continuing.
        echo You can start it with: mongod --dbpath "C:\data\db"
        pause
        exit /b 1
    )
)

REM Configure MongoDB (if needed)
echo Configuring MongoDB...
python configure_mongodb.py
if %ERRORLEVEL% neq 0 (
    echo Failed to configure MongoDB.
    pause
    exit /b 1
)

REM Start backend API server in a new window
echo Starting API server...
start "Zenalyst API Server" cmd /c "python api_server.py"
if %ERRORLEVEL% neq 0 (
    echo Failed to start API server.
    pause
    exit /b 1
)

REM Start frontend in development mode in a new window
echo Starting frontend development server...
cd "%CLIENT_DIR%"
start "Zenalyst Frontend" cmd /c "npm run dev"
if %ERRORLEVEL% neq 0 (
    echo Failed to start frontend server.
    pause
    exit /b 1
)

echo All components started successfully!
echo Frontend available at: http://localhost:5173
echo API server available at: http://localhost:5000
echo.
echo Close the terminal windows to stop the servers when you're done.

pause