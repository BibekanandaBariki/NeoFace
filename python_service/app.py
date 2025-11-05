from flask import Flask, request, jsonify
from deepface import DeepFace
import numpy as np
import os
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Model/backend selection:
# DeepFace supports: VGG-Face, Facenet, OpenFace, DeepFace, DeepID, Dlib, ArcFace
MODEL_NAME = os.environ.get("DEEPFACE_MODEL", "Facenet")
BACKEND = os.environ.get("DETECTOR_BACKEND", "opencv")  # opencv, mtcnn, retinaface, ssd, dlib

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME, "backend": BACKEND})

@app.route("/embed", methods=["POST"])
def embed():
    """
    Accepts:
      { "frames": ["data:image/jpeg;base64,....", ...] }
    OR
      { "frames": ["<base64 raw string>", ...] }
    Responds:
      { "embedding": [float,...], "dim": 128 or 512 }
    """
    data = request.get_json(force=True)
    frames = data.get("frames") or []
    if not isinstance(frames, list) or len(frames) == 0:
        return jsonify({"error": "frames array required"}), 400

    embeddings = []
    try:
        for idx, f in enumerate(frames):
            # DeepFace can accept base64 via img_path
            resp = DeepFace.represent(img_path=f, model_name=MODEL_NAME, detector_backend=BACKEND, enforce_detection=True)
            # DeepFace.represent returns a list of dicts
            if isinstance(resp, list) and len(resp) > 0:
                item = resp[0]
                if isinstance(item, dict) and "embedding" in item:
                    emb = np.array(item["embedding"], dtype=float)
                else:
                    emb = np.array(item, dtype=float)
            else:
                emb = np.array(resp, dtype=float)
            embeddings.append(emb)
    except Exception as e:
        app.logger.exception("DeepFace error")
        return jsonify({"error": "failed to generate embeddings", "detail": str(e)}), 500

    # Average and L2-normalize
    try:
        stacked = np.stack(embeddings, axis=0)
        avg = np.mean(stacked, axis=0)
        norm = np.linalg.norm(avg)
        if norm > 0:
            avg = avg / norm
        embedding_list = avg.astype(float).tolist()
        return jsonify({"embedding": embedding_list, "dim": len(embedding_list)}), 200
    except Exception as e:
        app.logger.exception("Embedding aggregation error")
        return jsonify({"error": "failed to aggregate embeddings", "detail": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
