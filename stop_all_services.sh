#!/bin/bash

# NeoFace - Stop All Services Script

echo "========================================="
echo "Stopping All NeoFace Services"
echo "========================================="
echo ""

# Function to kill process on port
kill_port() {
    if lsof -ti:$1 > /dev/null 2>&1; then
        echo "🔄 Stopping service on port $1..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null
        sleep 1
        echo "✅ Stopped service on port $1"
    else
        echo "ℹ️  No service running on port $1"
    fi
}

# Stop all services
kill_port 5001  # Python Face Service
kill_port 5003  # Backend
kill_port 3000  # Frontend

echo ""
echo "========================================="
echo "✅ All services stopped!"
echo "========================================="
