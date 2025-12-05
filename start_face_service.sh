#!/bin/bash

# NeoFace Face Recognition Service Startup Script
# This script starts the Python face recognition microservice

echo "========================================="
echo "Starting NeoFace Face Recognition Service"
echo "========================================="
echo ""

# Navigate to python_service directory
cd /Users/bibekanandabariki/Documents/project/NeoFace/python_service

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Creating..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
echo "🔄 Checking dependencies..."
if ! python -c "import flask" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip install flask deepface opencv-python-headless numpy tf-keras
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Start the face recognition service
echo ""
echo "🚀 Starting Face Recognition Service on port 5001..."
echo "========================================="
python app.py
