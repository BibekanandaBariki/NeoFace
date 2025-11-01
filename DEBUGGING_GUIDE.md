# NeoFace Debugging Guide

## 🔧 Server Status

### Backend Server
- **Status**: ✅ Running on port 5001
- **PID File**: `backend/backend.pid`
- **Log File**: `backend/backend.log`
- **Health Check**: http://localhost:5001/api/health

### Frontend Server
- **Status**: ✅ Running on port 3000
- **PID File**: `frontend/frontend.pid`
- **Log File**: `frontend/frontend.log`

## 📋 Monitoring Logs

### View Backend Logs
```bash
tail -f backend/backend.log
```

### View Frontend Logs
```bash
tail -f frontend/frontend.log
```

### Stop Servers
```bash
# Stop backend
kill $(cat backend/backend.pid)

# Stop frontend
kill $(cat frontend/frontend.pid)

# Or kill all node processes
pkill -f "node.*server.js"
```

## 🐛 Debugging Student Creation

### When creating a student, check backend logs for:

1. **Request Received**
   ```
   === CREATE STUDENT REQUEST ===
   Timestamp: [timestamp]
   Auth User: [email] Role: [role]
   Request body: {...}
   ```

2. **Validation Status**
   - ✅ Validation passed
   - ❌ VALIDATION ERRORS: [...details...]

3. **User Creation**
   ```
   Creating user with data: {...}
   User created successfully: [id]
   ```

4. **Student Creation**
   ```
   Creating student with data: {...}
   Student created successfully: [id]
   ```

5. **Errors (if any)**
   ```
   User creation error: [details]
   Error details: {
     message: [...]
     code: [MongoDB error code]
     keyPattern: {...}
     keyValue: {...}
   }
   ```

## 🔍 Common Issues & Solutions

### Issue: "Server Error" when creating student

**Check:**
1. Backend logs (`backend/backend.log`)
2. MongoDB connection (should show "✅ MongoDB Connected")
3. Request body in logs
4. Error codes:
   - `11000` = Duplicate key (email/universityId already exists)
   - `ValidationError` = Missing or invalid fields

**Solutions:**
- If duplicate: Use different email or universityId
- If validation error: Check all required fields are provided
- If MongoDB error: Check database connection

### Issue: Frontend can't connect to backend

**Check:**
1. Backend is running: `curl http://localhost:5001/api/health`
2. Frontend API URL: Should be `http://localhost:5001` in `frontend/src/utils/api.js`
3. CORS: Backend should allow `http://localhost:3000`

### Issue: Authentication failed

**Check:**
1. Token is present in request headers (check logs)
2. JWT_SECRET matches in backend `.env`
3. User is active and verified

## 📝 Enhanced Logging

The student creation endpoint now logs:
- ✅ Request timestamp
- ✅ Authenticated user info
- ✅ Complete request body
- ✅ Request headers (content-type, authorization)
- ✅ Validation results
- ✅ Each step of creation (user, student, subjects)
- ✅ Error details with MongoDB codes
- ✅ Success confirmation

## 🚀 Quick Restart

```bash
# Stop all
pkill -f "node.*server.js"
pkill -f "react-scripts"

# Start backend
cd backend && node server.js > backend.log 2>&1 & echo $! > backend.pid

# Start frontend (in another terminal)
cd frontend && npm start > frontend.log 2>&1 & echo $! > frontend.pid
```

## ✅ Testing Student Creation

1. Login as SuperAdmin:
   - Email: `bibekbariki786@gmail.com`
   - Password: `Attitude321@11`

2. Navigate to "Add Student" section

3. Fill in required fields:
   - Name
   - Email (must be unique)
   - University ID (must be unique)
   - Department
   - Semester (1-8)
   - Year (optional)
   - Section (optional)

4. Check backend logs for detailed process

5. If error occurs, check logs for specific error message and code

