from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace  # pyright: ignore[reportMissingImports]
import numpy as np
import os
import logging
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)
# Enable CORS for all routes and origins (for Render deployment)
CORS(app, resources={r"/*": {"origins": "*"}})
logging.basicConfig(level=logging.INFO)

# Model/backend selection:
# DeepFace supports: VGG-Face, Facenet, OpenFace, DeepFace, DeepID, Dlib, ArcFace
MODEL_NAME = os.environ.get("DEEPFACE_MODEL", "Facenet")
BACKEND = os.environ.get("DETECTOR_BACKEND", "opencv")  # opencv, mtcnn, retinaface, ssd, dlib

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME, "backend": BACKEND})

def process_base64_image(image_data):
    """Convert base64 image data to a format DeepFace can process"""
    try:
        # Handle data URI format (data:image/jpeg;base64,...)
        if isinstance(image_data, str):
            if image_data.startswith('data:image'):
                # Extract base64 part after comma
                image_data = image_data.split(',', 1)[1]
            
            # Decode base64 to bytes
            img_bytes = base64.b64decode(image_data)
            
            # Convert to PIL Image
            img = Image.open(BytesIO(img_bytes)).convert('RGB')
            
            # Save to temporary file-like object for DeepFace
            temp_file = BytesIO()
            img.save(temp_file, format='JPEG')
            temp_file.seek(0)
            
            return temp_file
        return image_data
    except Exception as e:
        app.logger.error(f"Error processing base64 image: {str(e)}")
        raise

@app.route("/embed", methods=["POST", "OPTIONS"])
def embed():
    """
    Accepts:
      { "frames": ["data:image/jpeg;base64,....", ...] }
    OR
      { "frames": ["<base64 raw string>", ...] }
    Responds:
      { "embedding": [float,...], "dim": 128 or 512 }
    """
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    
    try:
        data = request.get_json(force=True)
        if not data:
            app.logger.error("No JSON data received")
            return jsonify({"error": "No data provided"}), 400
            
        frames = data.get("frames") or []
        if not isinstance(frames, list) or len(frames) == 0:
            app.logger.error("Invalid frames array")
            return jsonify({"error": "frames array required"}), 400

        app.logger.info(f"Processing {len(frames)} frames with model {MODEL_NAME} and backend {BACKEND}")

        embeddings = []
        failed_frames = 0
        frame_errors = []
        
        for idx, f in enumerate(frames):
            try:
                # Process base64 image
                processed_image = process_base64_image(f)
                
                # DeepFace can accept file-like object or path
                resp = DeepFace.represent(
                    img_path=processed_image, 
                    model_name=MODEL_NAME, 
                    detector_backend=BACKEND, 
                    enforce_detection=True
                )
                
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
                app.logger.info(f"Successfully processed frame {idx + 1}/{len(frames)}")
                
            except Exception as frame_error:
                error_msg = str(frame_error)
                app.logger.warning(f"Failed to process frame {idx + 1}: {error_msg}")
                frame_errors.append(f"Frame {idx + 1}: {error_msg}")
                failed_frames += 1
                # Continue processing other frames
                continue

        # Check if we have enough successful embeddings
        if len(embeddings) == 0:
            error_detail = "; ".join(frame_errors[:3])  # Show first 3 errors
            app.logger.error(f"No face detected in any frame. Errors: {error_detail}")
            return jsonify({
                "error": "No face detected in any frame. Please ensure face is clearly visible.",
                "detail": error_detail if frame_errors else "Face detection failed"
            }), 400

        # Average and L2-normalize
        try:
            stacked = np.stack(embeddings, axis=0)
            avg = np.mean(stacked, axis=0)
            norm = np.linalg.norm(avg)
            if norm > 0:
                avg = avg / norm
            embedding_list = avg.astype(float).tolist()
            
            app.logger.info(f"Successfully generated embedding. Dimension: {len(embedding_list)}, Processed: {len(embeddings)}/{len(frames)} frames")
            
            return jsonify({
                "embedding": embedding_list, 
                "dim": len(embedding_list),
                "processed_frames": len(embeddings),
                "failed_frames": failed_frames
            }), 200
        except Exception as e:
            app.logger.exception("Embedding aggregation error")
            return jsonify({"error": "failed to aggregate embeddings", "detail": str(e)}), 500
            
    except Exception as e:
        app.logger.exception("DeepFace error in embed endpoint")
        return jsonify({"error": "failed to generate embeddings", "detail": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
