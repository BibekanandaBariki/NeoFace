#!/bin/bash

# NeoFace - Deployment Health Check Script
# This script checks if all deployed services are running correctly

echo "🏥 NeoFace Deployment Health Check"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Checking $service_name... "
    
    # Use curl with timeout and follow redirects
    response=$(curl -s -f -m 10 --location $url 2>/dev/null)
    status=$?
    
    if [ $status -eq 0 ]; then
        # Check if response contains expected status
        if [ -n "$expected_status" ]; then
            if echo "$response" | grep -q "$expected_status"; then
                echo -e "${GREEN}✅ HEALTHY${NC}"
                echo "   Response: $(echo "$response" | jq -r '.status // .message' 2>/dev/null || echo "OK")"
            else
                echo -e "${YELLOW}⚠️  RESPONSE MISMATCH${NC}"
                echo "   Response: $response"
            fi
        else
            echo -e "${GREEN}✅ ACCESSIBLE${NC}"
        fi
    else
        echo -e "${RED}❌ UNREACHABLE${NC}"
        echo "   Error: curl exited with status $status"
    fi
}

# Check Python Face Recognition Service
echo ""
echo "🤖 Python Face Recognition Service"
echo "----------------------------------"
check_service "Root Endpoint" "https://neoface-python-service.onrender.com" ""
check_service "Health Endpoint" "https://neoface-python-service.onrender.com/health" "ok"

# Check Backend Service
echo ""
echo "💻 Backend API Service"
echo "----------------------"
check_service "Root Endpoint" "https://neoface-backend.onrender.com" "running"
check_service "Health Endpoint" "https://neoface-backend.onrender.com/api/health" "OK"
check_service "Face API Endpoint" "https://neoface-backend.onrender.com/api/face" "face"

# Check Frontend Service (if deployed)
echo ""
echo "📱 Frontend Web Application"
echo "---------------------------"
check_service "Main Page" "https://neoface-frontend.vercel.app" ""

echo ""
echo "📋 Health Check Complete"
echo ""
echo "Next steps:"
echo "1. If all services show ✅, test the face recognition feature"
echo "2. If any service shows ❌, check the deployment logs"
echo "3. Ensure environment variables are correctly set in Render dashboard"