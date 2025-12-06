#!/bin/bash

# Configuration
LOCAL_URI="mongodb://localhost:27017/neoface"
REMOTE_URI="mongodb+srv://neoface_user:Attitude3211@smartattendancecluster.5xyva0g.mongodb.net/neoface?retryWrites=true&w=majority"
TEMP_DIR="./temp_data_export"

# Collections to migrate
COLLECTIONS=(
    "users"
    "students"
    "universities"
    "campus"
    "branches"
    "batches"
    "subjects"
    "attendances"
    "programs"
    "semesters"
    "schools"
    "courses"
    "weeklytimetables"
)

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting Data Migration: Local -> Cloud${NC}"

# Create temp directory
mkdir -p $TEMP_DIR

# Check for mongo tools
if ! command -v mongoexport &> /dev/null; then
    echo -e "${RED}❌ Error: 'mongoexport' tool not found. Please install MongoDB Database Tools.${NC}"
    echo "Mac install: brew tap mongodb/brew && brew install mongodb-database-tools-community"
    exit 1
fi

for COL in "${COLLECTIONS[@]}"; do
    echo -e "\n📦 Processing collection: ${COL}..."
    
    # Export from Local
    echo "   ⬇️  Exporting from Local..."
    mongoexport --uri="$LOCAL_URI" --collection="$COL" --out="$TEMP_DIR/$COL.json" --jsonArray
    
    if [ $? -eq 0 ]; then
        # Import to Remote
        echo "   ⬆️  Importing to Cloud..."
        mongoimport --uri="$REMOTE_URI" --collection="$COL" --file="$TEMP_DIR/$COL.json" --jsonArray --drop
        
        if [ $? -eq 0 ]; then
            echo -e "   ${GREEN}✅ Success: $COL migrated${NC}"
        else
             echo -e "   ${RED}❌ Failed to import $COL${NC}"
        fi
    else
        echo -e "   ${RED}⚠️  Skipping $COL (Export failed or empty)${NC}"
    fi
done

# Cleanup
echo -e "\n🧹 Cleaning up..."
rm -rf $TEMP_DIR

echo -e "\n${GREEN}✨ Migration Complete! Check your deployed app now.${NC}"
