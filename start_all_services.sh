#!/bin/bash

# NeoFace Complete Project Startup Script
# Starts all three services: Python Face Recognition, Backend, and Frontend

echo "========================================="
echo "NeoFace Project - Complete Startup"
echo "========================================="
echo ""

PROJECT_DIR="/Users/bibekanandabariki/Documents/project/NeoFace"

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
    return $?
}

# Function to kill process on port
kill_port() {
    echo "🔄 Stopping service on port $1..."
    lsof -ti:$1 | xargs kill -9 2>/dev/null
    sleep 2
}

echo "Step 1: Stopping existing services..."
echo "========================================="

# Stop existing services
if check_port 5001; then
    kill_port 5001
    echo "✅ Stopped Python Face Service (port 5001)"
fi

if check_port 5003; then
    kill_port 5003
    echo "✅ Stopped Backend (port 5003)"
fi

if check_port 3000; then
    kill_port 3000
    echo "✅ Stopped Frontend (port 3000)"
fi

echo ""
echo "Step 2: Starting Python Face Recognition Service..."
echo "========================================="

cd "$PROJECT_DIR/python_service"

# Check and create venv if needed
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate and install dependencies
source venv/bin/activate

# Check if dependencies are installed
if ! python -c "import flask" 2>/dev/null; then
    echo "📦 Installing Python dependencies..."
    pip install flask deepface opencv-python-headless numpy tf-keras
fi

# Start Python service in background
echo "🚀 Starting Face Recognition Service on port 5001..."
nohup python app.py > ../logs/face_service.log 2>&1 &
FACE_PID=$!
echo "✅ Face Service started (PID: $FACE_PID)"

# Wait for service to start
sleep 3

# Verify Python service
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ Face Recognition Service is running!"
    curl -s http://localhost:5001/health | python3 -m json.tool
else
    echo "❌ Face Recognition Service failed to start"
    echo "Check logs: tail -f $PROJECT_DIR/logs/face_service.log"
fi

echo ""
echo "Step 3: Starting Backend (Node.js)..."
echo "========================================="

cd "$PROJECT_DIR/backend"
echo "🚀 Starting Backend on port 5003..."
nohup npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 5

echo ""
echo "Step 4: Starting Frontend (React)..."
echo "========================================="

cd "$PROJECT_DIR/frontend"
echo "🚀 Starting Frontend on port 3000..."
nohup npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to start
sleep 5

echo ""
echo "========================================="
echo "✅ ALL SERVICES STARTED!"
echo "========================================="
echo ""
echo "Service Status:"
echo "  🤖 Face Recognition: http://localhost:5001 (PID: $FACE_PID)"
echo "  🔧 Backend API:      http://localhost:5003 (PID: $BACKEND_PID)"
echo "  🌐 Frontend:         http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "Logs:"
echo "  Face Service: tail -f $PROJECT_DIR/logs/face_service.log"
echo "  Backend:      tail -f $PROJECT_DIR/logs/backend.log"
echo "  Frontend:     tail -f $PROJECT_DIR/logs/frontend.log"
echo ""
echo "To stop all services, run:"
echo "  ./stop_all_services.sh"
echo ""
echo "========================================="
echo "🎉 NeoFace is ready! Open http://localhost:3000"
echo "========================================="
