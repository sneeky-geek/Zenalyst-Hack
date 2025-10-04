#!/bin/bash

# Start script for Zenalyst-Hack project
echo "Starting Zenalyst-Hack components..."

# Set directory variables
PROJECT_ROOT="$(pwd)"
CLIENT_DIR="$PROJECT_ROOT/Client"

# Start MongoDB (if not running)
echo "Checking MongoDB status..."
if ! pgrep mongod > /dev/null; then
    echo "Starting MongoDB..."
    mongod --fork --logpath /var/log/mongodb/mongod.log
    if [ $? -eq 0 ]; then
        echo "MongoDB started successfully."
    else
        echo "Failed to start MongoDB. Please check if MongoDB is installed correctly."
        exit 1
    fi
else
    echo "MongoDB is already running."
fi

# Configure MongoDB (if needed)
echo "Configuring MongoDB..."
python configure_mongodb.py

# Start backend API server
echo "Starting API server..."
python api_server.py &
BACKEND_PID=$!
echo "API server started with PID: $BACKEND_PID"

# Start frontend in development mode
echo "Starting frontend development server..."
cd "$CLIENT_DIR"
npm run dev &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"

echo "All components started successfully!"
echo "Frontend available at: http://localhost:5173"
echo "API server available at: http://localhost:5000"

# Write PID files for later cleanup
echo $BACKEND_PID > "$PROJECT_ROOT/.backend_pid"
echo $FRONTEND_PID > "$PROJECT_ROOT/.frontend_pid"

echo ""
echo "Press Ctrl+C to stop all components"

# Wait for user input
wait