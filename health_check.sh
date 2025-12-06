#!/bin/bash

# NeoFace - Health Check Script
# This script checks if all services are running correctly

echo "🏥 NeoFace Health Check"
echo "======================"

# Check Backend Service
echo "Checking Backend Service..."
if curl -s -f -m 10 http://localhost:5003/api/health > /dev/null; then
    echo "✅ Backend Service: RUNNING"
    BACKEND_STATUS=$(curl -s http://localhost:5003/api/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "   Status: $BACKEND_STATUS"
else
    echo "❌ Backend Service: NOT RESPONDING"
fi

# Check Python Face Recognition Service
echo ""
echo "Checking Python Face Recognition Service..."
if curl -s -f -m 10 http://localhost:5001/health > /dev/null; then
    echo "✅ Python Face Recognition Service: RUNNING"
    PYTHON_STATUS=$(curl -s http://localhost:5001/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "   Status: $PYTHON_STATUS"
else
    echo "❌ Python Face Recognition Service: NOT RESPONDING"
fi

# Check if services are listening on their ports
echo ""
echo "Checking Port Status..."
if lsof -i :5003 >/dev/null 2>&1; then
    echo "✅ Port 5003 (Backend): IN USE"
else
    echo "❌ Port 5003 (Backend): NOT IN USE"
fi

if lsof -i :3000 >/dev/null 2>&1; then
    echo "✅ Port 3000 (Frontend): IN USE"
else
    echo "❌ Port 3000 (Frontend): NOT IN USE"
fi

if lsof -i :5001 >/dev/null 2>&1; then
    echo "✅ Port 5001 (Python Service): IN USE"
else
    echo "❌ Port 5001 (Python Service): NOT IN USE"
fi

echo ""
echo "📋 Health Check Complete"