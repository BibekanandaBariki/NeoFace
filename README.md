# NeoFace
The Automated Attendance System Using Face Recognition is an AI-powered application designed to simplify and automate the attendance-marking process in educational institutions. Instead of relying on manual attendance methods, this system leverages computer vision and machine learning techniques to identify and verify students through their facial features.

## Face recognition upgrade (DeepFace microservice)

- Python microservice added in `python_service/` (Flask) exposing `/health` and `/embed` for embeddings.
- Node backend integrates via `backend/services/faceRecognition.js` and uses env `FACE_SERVICE_URL` and `FACE_SIMILARITY_THRESHOLD`.

### Local setup
1) Start Python service
- See `python_service/README.md` for full steps.
- Recommended env:
  - `PORT=5001`
  - `DEEPFACE_MODEL=Facenet` (or `ArcFace`)
  - `DETECTOR_BACKEND=opencv`

2) Start Node backend
- Copy `backend/.env.example` to `backend/.env` and set:
  - `PORT=5000` (to avoid conflict with Python service)
  - `FACE_SERVICE_URL=http://localhost:5001`
  - `FACE_SIMILARITY_THRESHOLD=0.6`
- From `backend/`: `npm install && npm run dev`

3) Test
- Register via `POST /api/face/register` with `{ frames: [base64,...] }`.
- Recognize via `POST /api/face/recognize` with `{ imageData: base64, subjectId }`.
