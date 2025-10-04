#!/bin/bash

# 🚀 Zenalyst AI - Complete System Startup Script

echo "🚀 Starting Zenalyst AI Complete System..."
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "backend_api.py" ]; then
    echo "❌ Please run this script from the Zenalyst AI root directory"
    exit 1
fi

# Start backend server in background
echo "🔧 Starting Backend API Server on port 8000..."
python3 backend_api.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend development server
echo "🎨 Starting Frontend Development Server on port 5173..."
cd Client
npm run dev &
FRONTEND_PID=$!

# Wait for user input
echo ""
echo "✅ Zenalyst AI System is now running!"
echo "🔗 Frontend: http://localhost:5173"
echo "🔗 Backend API: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down Zenalyst AI System..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ System shutdown complete!"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Wait for background processes
wait