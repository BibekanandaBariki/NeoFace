// Face Recognition Service using FaceNet-like embeddings
// Note: In production, integrate with TensorFlow.js FaceNet or Python service

class FaceRecognitionService {
  constructor() {
    this.threshold = 0.6; // Cosine similarity threshold
    this.modelLoaded = false;
  }

  // Simulate face detection and embedding generation
  // In production, use actual FaceNet model
  async generateEmbedding(base64Image, frames) {
    try {
      // In production, use face-api.js or TensorFlow.js
      // For now, simulate with a simple embedding vector
      
      // Process multiple frames to ensure quality
      const embeddings = [];
      
      for (const frame of frames) {
        // Simulate embedding generation (128-dimensional vector)
        // Replace with actual face-api.js or TensorFlow.js call
        const embedding = this.mockGenerateEmbedding(frame);
        embeddings.push(embedding);
      }

      // Average embeddings from multiple frames for better accuracy
      const avgEmbedding = this.averageEmbeddings(embeddings);
      
      return avgEmbedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      return null;
    }
  }

  mockGenerateEmbedding(imageData) {
    // Mock embedding: 128-dimensional vector
    // In production, replace with actual FaceNet model
    const embedding = Array.from({ length: 128 }, () => Math.random() * 2 - 1);
    return this.normalize(embedding);
  }

  normalize(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }

  averageEmbeddings(embeddings) {
    const length = embeddings[0].length;
    const averaged = Array(length).fill(0);
    
    embeddings.forEach(embedding => {
      embedding.forEach((val, idx) => {
        averaged[idx] += val;
      });
    });
    
    return averaged.map(val => val / embeddings.length);
  }

  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  async recognizeFace(imageData, registeredStudents) {
    try {
      if (!registeredStudents || registeredStudents.length === 0) {
        console.log('No registered students provided for recognition');
        return null;
      }

      // Generate embedding for input image
      const inputEmbedding = await this.generateEmbedding(imageData, [imageData]);
      
      if (!inputEmbedding || inputEmbedding.length === 0) {
        console.log('Failed to generate embedding from input image');
        return null;
      }

      // Validate embedding dimensions
      if (inputEmbedding.length !== 128) {
        console.log(`Warning: Input embedding dimension is ${inputEmbedding.length}, expected 128`);
      }

      console.log(`Comparing input embedding (${inputEmbedding.length} dims) with ${registeredStudents.length} registered students`);

      // Compare with all registered students
      let bestMatch = null;
      let highestSimilarity = 0;
      const similarities = [];

      for (const student of registeredStudents) {
        // Validate student embedding
        if (!student.embedding) {
          console.log(`Skipping student ${student.name || student.universityId} - no embedding property`);
          continue;
        }

        if (!Array.isArray(student.embedding)) {
          console.log(`Skipping student ${student.name || student.universityId} - embedding is not an array`);
          continue;
        }

        if (student.embedding.length === 0) {
          console.log(`Skipping student ${student.name || student.universityId} - empty embedding array`);
          continue;
        }
        
        // Check dimension compatibility
        if (student.embedding.length !== inputEmbedding.length) {
          console.log(`Embedding dimension mismatch for ${student.name || student.universityId}: ${student.embedding.length} vs ${inputEmbedding.length}`);
          // Try to normalize - pad or truncate if needed (not ideal, but handles edge cases)
          continue;
        }
        
        // Calculate similarity
        const similarity = this.cosineSimilarity(inputEmbedding, student.embedding);
        similarities.push({ 
          name: student.name || 'Unknown', 
          universityId: student.universityId,
          similarity,
          embeddingLength: student.embedding.length
        });
        
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
        }
      }

      // Sort similarities and log top matches
      const sortedSimilarities = similarities.sort((a, b) => b.similarity - a.similarity);
      console.log(`Top 5 similarities:`, sortedSimilarities.slice(0, 5).map(s => 
        `${s.name} (${s.universityId}): ${s.similarity.toFixed(4)}`
      ));

      // Use a dynamic threshold - for mock system, be more lenient
      // In production with real FaceNet, use this.threshold (0.6)
      const recognitionThreshold = 0.3; // Lower for mock embeddings

      if (highestSimilarity >= recognitionThreshold) {
        const topStudent = registeredStudents[similarities.findIndex(s => 
          s.name === sortedSimilarities[0].name || 
          s.universityId === sortedSimilarities[0].universityId
        )];

        if (topStudent) {
          bestMatch = {
            studentId: topStudent.studentId || topStudent._id,
            userId: topStudent.userId,
            name: topStudent.name,
            universityId: topStudent.universityId,
            confidence: Math.round(highestSimilarity * 10000) / 100 // Percentage with 2 decimal places
          };
          console.log(`✓ Recognition successful: ${bestMatch.name} (ID: ${bestMatch.universityId}, confidence: ${bestMatch.confidence}%)`);
        }
      } else {
        console.log(`✗ No match found. Highest similarity: ${(highestSimilarity * 100).toFixed(2)}% (threshold: ${recognitionThreshold * 100}%)`);
        // For mock system: return best match if we have at least some similarity
        // This helps with demo/testing - REMOVE in production
        if (registeredStudents.length === 1 && highestSimilarity > 0.1) {
          const onlyStudent = registeredStudents[0];
          console.log(`Mock system: Returning only registered student: ${onlyStudent.name}`);
          bestMatch = {
            studentId: onlyStudent.studentId || onlyStudent._id,
            userId: onlyStudent.userId,
            name: onlyStudent.name,
            universityId: onlyStudent.universityId,
            confidence: Math.round(highestSimilarity * 10000) / 100
          };
        }
      }

      return bestMatch;
    } catch (error) {
      console.error('Face recognition error:', error);
      console.error('Error stack:', error.stack);
      return null;
    }
  }

  // Load FaceNet model (for production)
  async loadModel() {
    // In production, load TensorFlow.js or face-api.js models
    // const model = await tf.loadLayersModel('/models/facenet/model.json');
    this.modelLoaded = true;
    return true;
  }
}

module.exports = new FaceRecognitionService();

