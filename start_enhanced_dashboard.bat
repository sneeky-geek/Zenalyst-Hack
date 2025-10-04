@echo off
echo Starting Zenalyst Enhanced Dashboard...

echo Starting MongoDB database...
start cmd /k "echo Starting MongoDB & mongod"

echo Starting API Server on port 5000...
start cmd /k "echo Starting API Server & python upload_api_server.py"

echo Starting Client on port 3000...
cd Client
start cmd /k "echo Starting Client & npm run dev"

echo All services started! Dashboard will be available at http://localhost:3000
echo Press any key to exit
pause > nul