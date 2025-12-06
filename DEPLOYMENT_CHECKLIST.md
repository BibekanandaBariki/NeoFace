# NeoFace Deployment Checklist

## Backend Service (Render)

### Environment Variables
- [ ] `MONGODB_URI` - Your MongoDB connection string
- [ ] `JWT_SECRET` - Your JWT secret key
- [ ] `SUPERADMIN_PASSWORD` - Your superadmin password
- [ ] `NODE_ENV` - Set to "production"
- [ ] `CORS_ORIGIN` - Set to "https://neoface-frontend.vercel.app"
- [ ] `FACE_SERVICE_URL` - Set to "https://neoface-python-service.onrender.com"
- [ ] `FACE_SIMILARITY_THRESHOLD` - Set to "0.75"
- [ ] `PORT` - Set to "8080"

### Configuration
- [ ] Build command: `npm install`
- [ ] Start command: `node server.js`
- [ ] Region: Choose appropriate region

## Python Service (Render)

### Environment Variables
- [ ] `PORT` - Set to "10000"
- [ ] `PYTHON_VERSION` - Set to "3.10.12"
- [ ] `DEEPFACE_MODEL` - Set to "Facenet"
- [ ] `DETECTOR_BACKEND` - Set to "opencv"

### Configuration
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `python app_advanced.py`
- [ ] Region: Choose appropriate region (same as backend if possible)

## Frontend Service (Vercel)

### Environment Variables
- [ ] `REACT_APP_API_URL` - Set to "https://neoface-backend.onrender.com/api"

### Configuration
- [ ] Build command: `npm run build`
- [ ] Output directory: `build`
- [ ] Install command: `npm install`
- [ ] Framework preset: `create-react-app`

## Post-Deployment Verification

### Service Health Checks
- [ ] Backend health: `curl https://neoface-backend.onrender.com/api/health`
- [ ] Python service health: `curl https://neoface-python-service.onrender.com/health`
- [ ] Frontend accessibility: Visit `https://neoface-frontend.vercel.app`

### Functionality Tests
- [ ] Login as SuperAdmin
- [ ] Create a test student
- [ ] Update student face data (this tests the face service integration)
- [ ] Verify face recognition works

## Common Issues and Solutions

### "Face detection failed" Error
1. **Check FACE_SERVICE_URL**: Ensure it's set to the deployed Python service URL
2. **Verify service communication**: Test that backend can reach Python service
3. **Check image quality**: Ensure images sent have clear, visible faces
4. **Network timeouts**: Increase timeout values if services are slow to respond

### "CORS" Errors
1. **Check CORS_ORIGIN**: Ensure it matches your frontend URL
2. **Verify headers**: Check that proper CORS headers are being sent

### "502 Bad Gateway" Errors
1. **Service downtime**: Check if all services are running
2. **Port binding**: Ensure services are binding to correct ports
3. **Environment variables**: Verify all required variables are set

## Troubleshooting Commands

### Check service status
```bash
# Check backend health
curl -I https://neoface-backend.onrender.com/api/health

# Check Python service health
curl -I https://neoface-python-service.onrender.com/health

# Test face recognition endpoint
curl -X POST https://neoface-python-service.onrender.com/embed \
  -H "Content-Type: application/json" \
  -d '{"frames": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="]}'
```

### Local testing
```bash
# Test communication between services locally
cd /Users/bibekanandabariki/Documents/project/NeoFace
node test_backend_face_communication.js
```