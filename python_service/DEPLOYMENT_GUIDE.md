# Python Service Deployment Guide for Render Free Tier

## Quick Start

The service has been optimized to work on Render's free tier (512MB RAM). Follow these steps:

### 1. Render Service Configuration

**Service Type**: Web Service  
**Build Command**: `pip install -r requirements.txt`  
**Start Command**: `python app_advanced.py` (or use Procfile)

### 2. Environment Variables

Set these in Render Dashboard → Environment:
```
PORT=10000
PYTHON_VERSION=3.10.12
DEEPFACE_MODEL=Facenet
DETECTOR_BACKEND=opencv
```

### 3. Using Lighter Requirements (Recommended for Free Tier)

If you want to save even more memory, you can use `requirements-free-tier.txt`:

**Build Command**: `pip install -r requirements-free-tier.txt`

This removes TensorFlow/DeepFace (~500MB) since `app_advanced.py` doesn't use them.

### 4. Procfile

Make sure your Procfile contains:
```
web: python app_advanced.py
```

Or with Gunicorn (more stable, but uses slightly more memory):
```
web: gunicorn --workers 1 --threads 1 --worker-class sync --timeout 120 --bind 0.0.0.0:$PORT app_advanced:app
```

### 5. Health Check

After deployment, verify the service is running:
```bash
curl https://your-service.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "model": "Advanced-CV-CNN",
  "backend": "opencv+pillow",
  "mode": "advanced"
}
```

## Memory Optimizations Already Applied

✅ Image size reduced: 160x160 → 128x128  
✅ Frame limit: Max 8 frames per request  
✅ Sequential processing with GC  
✅ Explicit memory cleanup  
✅ Lightweight OpenCV backend (no TensorFlow)

## If You Still Get Memory Errors

### Option 1: Use Lighter Requirements
Update build command to use `requirements-free-tier.txt` instead of `requirements.txt`

### Option 2: Further Reduce Settings
Edit `app_advanced.py`:
- Change `MAX_FRAMES = 5` (line ~80)
- Change `memory_efficient_size = (96, 96)` (line ~45)

### Option 3: Upgrade Render Plan
Starter plan ($7/month) gives 1GB RAM - more headroom for processing

## Testing

Test face detection endpoint:
```bash
curl -X POST https://your-service.onrender.com/embed \
  -H "Content-Type: application/json" \
  -d '{"frames": ["data:image/jpeg;base64,/9j/4AAQ..."]}'
```

## Monitoring

1. **Check Logs**: Render Dashboard → Your Service → Logs
2. **Watch for**: "out of memory", "SIGKILL", or high memory usage
3. **Success indicators**: "Successfully processed frame" messages

## Troubleshooting

### Service crashes on startup
- Check Python version (should be 3.10.12)
- Verify requirements.txt installs successfully
- Check build logs for errors

### Out of memory errors
- Use `requirements-free-tier.txt`
- Reduce MAX_FRAMES to 5
- Reduce image size to 96x96

### Face detection fails
- Ensure images are clear and well-lit
- Check backend logs for specific errors
- Verify service is receiving requests (check logs)

### Slow processing
- Normal for free tier (shared resources)
- First request after sleep can take 30-60 seconds
- Subsequent requests should be faster

## Performance Expectations (Free Tier)

- **First request**: 30-60 seconds (cold start)
- **Subsequent requests**: 5-15 seconds
- **Memory usage**: 300-400MB
- **Uptime**: Service may sleep after 15 min inactivity

## Next Steps

1. Deploy to Render
2. Test health endpoint
3. Test face detection with a few frames
4. Monitor logs for any issues
5. Adjust settings if needed

