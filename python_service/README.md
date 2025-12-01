# DeepFace Embedding Microservice

This Flask service exposes endpoints to generate face embeddings using DeepFace.

## Endpoints
- GET /health → { status, model, backend }
- POST /embed → { embedding: number[], dim }
  - Body: { "frames": ["data:image/jpeg;base64,...", ...] } or raw base64 strings

## Quick start (macOS/Linux)
1) Create venv and install deps
```
bash
cd python_service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2) Run the service (defaults: PORT=5001, MODEL=Facenet, BACKEND=opencv)
```
bash
export PORT=5001
export DEEPFACE_MODEL=Facenet
export DETECTOR_BACKEND=opencv
python app.py
```

3) Health check
```
bash
curl http://localhost:5001/health
```

4) Test embed
```
bash
curl -X POST http://localhost:5001/embed \
  -H "Content-Type: application/json" \
  -d '{"frames":["data:image/jpeg;base64,<yourBase64>"]}'
```

## Notes
- First run will download/load models and may take up to a couple minutes.
- For higher accuracy, try DEEPFACE_MODEL=ArcFace or Facenet; detector backends: opencv, mtcnn, retinaface, ssd, dlib.
- In production, consider GPU builds of TensorFlow for throughput.
