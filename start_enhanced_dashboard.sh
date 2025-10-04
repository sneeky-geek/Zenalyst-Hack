#!/bin/bash
echo "Starting Zenalyst Enhanced Dashboard..."

echo "Starting MongoDB database..."
mongod &

echo "Starting API Server on port 5000..."
python upload_api_server.py &

echo "Starting Client on port 3000..."
cd Client
npm run dev &

echo "All services started! Dashboard will be available at http://localhost:3000"
echo "Press CTRL+C to exit"
wait