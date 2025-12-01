/**
 * Face Recognition Service with Monitoring
 * This is a wrapper around the original face recognition service that adds monitoring
 * without modifying the original code.
 */

const originalFaceService = require('./faceRecognition');
const evaluationMonitor = require('../evaluation_monitor');

class FaceRecognitionServiceWithMonitoring {
  constructor() {
    // Delegate to original service
    this.original = originalFaceService;
    this.threshold = originalFaceService.threshold;
  }

  // Wrapper for generateEmbedding with monitoring
  async generateEmbedding(imageData, frames = []) {
    const startTime = Date.now();
    
    try {
      const result = await this.original.generateEmbedding(imageData, frames);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      evaluationMonitor.logEmbeddingGenerationTime(duration);
      
      return result;
    } catch (error) {
      evaluationMonitor.logError('embedding_generation', error.message);
      throw error;
    }
  }

  // Wrapper for recognizeFace with monitoring
  async recognizeFace(imageData, registeredStudents = []) {
    const startTime = Date.now();
    
    try {
      const result = await this.original.recognizeFace(imageData, registeredStudents);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      evaluationMonitor.logRecognitionTime(duration);
      
      // Log confidence score if recognition was attempted
      if (result) {
        evaluationMonitor.logRecognitionConfidence(result.confidence, result.student._id, true);
      } else if (registeredStudents && registeredStudents.length > 0) {
        // Log a low confidence score for failed recognition
        evaluationMonitor.logRecognitionConfidence(0.0, 'unknown', false);
      }
      
      return result;
    } catch (error) {
      evaluationMonitor.logError('face_recognition', error.message);
      throw error;
    }
  }

  // Delegate other methods to original service
  normalize(vector) {
    return this.original.normalize(vector);
  }

  cosineSimilarity(a, b) {
    return this.original.cosineSimilarity(a, b);
  }
}

// Export the monitoring wrapper
module.exports = new FaceRecognitionServiceWithMonitoring();