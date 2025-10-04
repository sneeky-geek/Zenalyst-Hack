#!/bin/bash

echo "Starting Zenalyst Analytics Dashboard..."

# Start the analytics API server in the background
echo "Starting Analytics API Server..."
python analytics_api_server.py &
ANALYTICS_PID=$!

# Wait for the API server to initialize
echo "Waiting for API server to initialize..."
sleep 5

# Start the React client
cd Client && npm run dev

# Clean up the analytics server process when the script is terminated
trap "kill $ANALYTICS_PID" EXIT

exit 0