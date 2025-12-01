const axios = require('axios');

class FaceRecognitionService {
  constructor() {
    this.faceServiceUrl = process.env.FACE_SERVICE_URL || 'http://localhost:5001';
    this.threshold = parseFloat(process.env.FACE_SIMILARITY_THRESHOLD) || 0.6;
  }

  // Call the Python microservice to generate an embedding from frames or a single image
  async generateEmbedding(imageData, frames = []) {
    try {
      const payload = { frames: frames && frames.length ? frames : [imageData] };
      console.log(`Generating embedding with ${payload.frames.length} frames`);
      
      const resp = await axios.post(`${this.faceServiceUrl}/embed`, payload, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });

      if (resp.data && resp.data.embedding && Array.isArray(resp.data.embedding)) {
        console.log(`Embedding generated successfully. Dimension: ${resp.data.dim}, Processed frames: ${resp.data.processed_frames || 'N/A'}`);
        return resp.data.embedding;
      }

      console.error('Invalid embedding response from face service', resp.data);
      return null;
    } catch (error) {
      console.error('Error calling face service /embed:', error.response?.data || error.message || error);
      return null;
    }
  }

  normalize(vector) {
    const mag = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    if (mag === 0) return vector.map(() => 0);
    return vector.map(v => v / mag);
  }

  cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  // Recognize face among a list of registered students (each must have faceEmbedding array)
  async recognizeFace(imageData, registeredStudents = []) {
    try {
      if (!registeredStudents || registeredStudents.length === 0) {
        console.log('No registered students provided for recognition');
        return null;
      }

      console.log(`Attempting recognition against ${registeredStudents.length} registered students`);
      const inputEmbedding = await this.generateEmbedding(imageData, [imageData]);
      if (!inputEmbedding || inputEmbedding.length === 0) {
        console.log('Failed to generate embedding from input image');
        return null;
      }

      const normalizedInput = this.normalize(inputEmbedding);

      let bestMatch = null;
      let highest = -1;

      for (const s of registeredStudents) {
        if (!s.faceEmbedding || !Array.isArray(s.faceEmbedding) || s.faceEmbedding.length === 0) {
          console.log(`Skipping student ${s.name || s.universityId}: No valid embedding`);
          continue;
        }
        const sim = this.cosineSimilarity(normalizedInput, this.normalize(s.faceEmbedding));
        console.log(`Similarity with ${s.name || s.universityId}: ${sim.toFixed(3)}`);
        if (sim > highest) {
          highest = sim;
          bestMatch = s;
        }
      }

      console.log(`Best match: ${bestMatch?.name || 'None'}, Confidence: ${highest.toFixed(3)}, Threshold: ${this.threshold}`);

      if (bestMatch && highest >= this.threshold) {
        return {
          student: bestMatch,
          confidence: highest
        };
      }

      return null;
    } catch (error) {
      console.error('Recognition error:', error);
      return null;
    }
  }
}

module.exports = new FaceRecognitionService();
