#!/bin/bash

# NeoFace - Start All Services Script (Fixed Version)
# This script starts all services in the correct order with proper environment variables

echo "🚀 Starting NeoFace Services..."

# Function to check if a port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
    return $?
}

# Function to kill process on a port
kill_port() {
    if check_port $1; then
        echo "⚠️  Killing process on port $1..."
        lsof -ti :$1 | xargs kill -9 2>/dev/null
    fi
}

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
kill_port 5003  # Backend
kill_port 3000  # Frontend
kill_port 5001  # Python Service

# Wait a moment for processes to terminate
sleep 2

# Start Backend Service
echo "🔧 Starting Backend Service..."
cd backend
export PORT=5003
export CORS_ORIGIN=http://localhost:3000
export FACE_SERVICE_URL=http://localhost:5001
export FACE_SIMILARITY_THRESHOLD=0.75
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend Service started (PID: $BACKEND_PID)"
else
    echo "❌ Backend Service failed to start"
    tail -20 backend.log
    exit 1
fi

# Start Frontend Service
echo "🌐 Starting Frontend Service..."
cd frontend
export REACT_APP_API_URL=http://localhost:5003/api
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 10

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ Frontend Service started (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend Service failed to start"
    tail -20 frontend.log
    exit 1
fi

# Start Python Face Recognition Service
echo "🧠 Starting Python Face Recognition Service..."
cd python_service
/opt/homebrew/bin/python3.10 app_advanced.py > ../python_service.log 2>&1 &
PYTHON_PID=$!
cd ..

# Wait for python service to start
sleep 5

# Check if python service started successfully
if ps -p $PYTHON_PID > /dev/null; then
    echo "✅ Python Face Recognition Service started (PID: $PYTHON_PID)"
else
    echo "❌ Python Face Recognition Service failed to start"
    tail -20 python_service.log
    exit 1
fi

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "💻 Backend API: http://localhost:5003/api"
echo "🤖 Face Recognition Service: http://localhost:5001"
echo ""
echo "🔐 SuperAdmin Credentials:"
echo "   Email: bibekbariki786@gmail.com"
echo "   Password: Attitude321@11"
echo ""
echo "📌 Press Ctrl+C to stop all services"

# Wait for user to press Ctrl+C
trap "echo '🛑 Stopping all services...'; kill $BACKEND_PID $FRONTEND_PID $PYTHON_PID 2>/dev/null; exit" INT TERM

# Keep script running
while true; do
    sleep 1
done