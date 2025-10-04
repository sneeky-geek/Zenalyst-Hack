@echo off
echo Starting Zenalyst Analytics Dashboard...

rem Start the analytics API server in the background
start cmd /k "echo Starting Analytics API Server... && cd /d %~dp0 && python analytics_api_server.py"

rem Wait for the API server to initialize
echo Waiting for API server to initialize...
timeout /t 5 /nobreak > nul

rem Start the regular API server
start cmd /k "echo Starting Regular API Server... && cd /d %~dp0 && python api_server.py"

rem Wait for the regular API server to initialize
echo Waiting for regular API server to initialize...
timeout /t 3 /nobreak > nul

rem Start the React client
cd /d %~dp0Client && npm run dev

exit