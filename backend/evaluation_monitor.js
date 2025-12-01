/**
 * Evaluation Monitor for NeoFace System
 * This module monitors the face recognition system to collect evaluation metrics
 * without modifying the main application code.
 */

const fs = require('fs');
const path = require('path');

class EvaluationMonitor {
  constructor() {
    this.metrics = {
      recognition_times: [],
      api_response_times: [],
      embedding_generation_times: [],
      recognition_confidence_scores: [],
      successful_recognitions: 0,
      total_recognitions: 0,
      errors: []
    };
    
    this.startTime = Date.now();
    this.logFilePath = path.join(__dirname, '..', 'logs', 'evaluation_metrics.json');
    
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  // Log face recognition time
  logRecognitionTime(timeInMs) {
    this.metrics.recognition_times.push(timeInMs);
    console.log(`[EVAL] Face recognition time: ${timeInMs.toFixed(2)}ms`);
  }

  // Log API response time
  logApiResponseTime(endpoint, timeInMs) {
    this.metrics.api_response_times.push({
      endpoint: endpoint,
      time: timeInMs,
      timestamp: new Date().toISOString()
    });
    console.log(`[EVAL] API response time for ${endpoint}: ${timeInMs.toFixed(2)}ms`);
  }

  // Log embedding generation time
  logEmbeddingGenerationTime(timeInMs) {
    this.metrics.embedding_generation_times.push(timeInMs);
    console.log(`[EVAL] Embedding generation time: ${timeInMs.toFixed(2)}ms`);
  }

  // Log recognition confidence score
  logRecognitionConfidence(confidence, studentId, isSuccessful) {
    this.metrics.recognition_confidence_scores.push({
      confidence: confidence,
      studentId: studentId,
      isSuccessful: isSuccessful,
      timestamp: new Date().toISOString()
    });
    
    if (isSuccessful) {
      this.metrics.successful_recognitions++;
    }
    this.metrics.total_recognitions++;
    
    console.log(`[EVAL] Recognition confidence: ${confidence.toFixed(3)}, Success: ${isSuccessful}`);
  }

  // Log errors
  logError(errorType, errorMessage) {
    this.metrics.errors.push({
      type: errorType,
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
    console.log(`[EVAL] Error logged: ${errorType} - ${errorMessage}`);
  }

  // Calculate statistics
  getStatistics() {
    const stats = {};
    
    // Recognition time statistics
    if (this.metrics.recognition_times.length > 0) {
      const times = this.metrics.recognition_times;
      stats.recognition_time = {
        count: times.length,
        average: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        median: this.getMedian(times)
      };
    }
    
    // Embedding generation time statistics
    if (this.metrics.embedding_generation_times.length > 0) {
      const times = this.metrics.embedding_generation_times;
      stats.embedding_time = {
        count: times.length,
        average: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        median: this.getMedian(times)
      };
    }
    
    // Confidence score statistics
    if (this.metrics.recognition_confidence_scores.length > 0) {
      const confidences = this.metrics.recognition_confidence_scores.map(c => c.confidence);
      const successfulConfidences = this.metrics.recognition_confidence_scores
        .filter(c => c.isSuccessful)
        .map(c => c.confidence);
      
      stats.confidence = {
        total: confidences.length,
        successful: successfulConfidences.length,
        success_rate: this.metrics.successful_recognitions / this.metrics.total_recognitions,
        average_all: confidences.reduce((a, b) => a + b, 0) / confidences.length,
        average_successful: successfulConfidences.length > 0 
          ? successfulConfidences.reduce((a, b) => a + b, 0) / successfulConfidences.length 
          : 0,
        min: Math.min(...confidences),
        max: Math.max(...confidences),
        median: this.getMedian(confidences)
      };
    }
    
    // Error statistics
    stats.errors = {
      count: this.metrics.errors.length,
      types: this.metrics.errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {})
    };
    
    return stats;
  }

  // Helper function to calculate median
  getMedian(array) {
    if (array.length === 0) return 0;
    const sorted = array.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  }

  // Generate confusion matrix data (simplified)
  getConfusionMatrixData() {
    // This is a simplified version - in a real implementation, you would track
    // actual vs predicted labels for each recognition attempt
    const successful = this.metrics.recognition_confidence_scores.filter(c => c.isSuccessful);
    const failed = this.metrics.recognition_confidence_scores.filter(c => !c.isSuccessful);
    
    return {
      true_positives: successful.length,
      false_negatives: failed.length,
      // In a real confusion matrix, you would also have false_positives and true_negatives
      // but that requires tracking actual vs predicted identities
      total_attempts: this.metrics.total_recognitions
    };
  }

  // Generate precision, recall, F1-score (simplified)
  getPRF1Metrics() {
    const successful = this.metrics.successful_recognitions;
    const total = this.metrics.total_recognitions;
    
    if (total === 0) return { precision: 0, recall: 0, f1_score: 0 };
    
    // Simplified calculation - in a real scenario, you would need true/false positives/negatives
    const precision = successful / total; // Assuming all successful are true positives
    const recall = successful / total;    // Assuming all successful are correctly identified
    const f1_score = total > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    
    return { precision, recall, f1_score };
  }

  // Save metrics to file
  saveMetrics() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      metrics: this.metrics,
      statistics: this.getStatistics(),
      confusion_matrix: this.getConfusionMatrixData(),
      prf1_metrics: this.getPRF1Metrics()
    };
    
    try {
      fs.writeFileSync(this.logFilePath, JSON.stringify(report, null, 2));
      console.log(`[EVAL] Metrics saved to ${this.logFilePath}`);
      return this.logFilePath;
    } catch (error) {
      console.error(`[EVAL] Error saving metrics: ${error.message}`);
      return null;
    }
  }

  // Print summary
  printSummary() {
    const stats = this.getStatistics();
    const prf1 = this.getPRF1Metrics();
    const cm = this.getConfusionMatrixData();
    
    console.log('\n=== EVALUATION SUMMARY ===');
    console.log(`Uptime: ${(Date.now() - this.startTime) / 1000}s`);
    
    if (stats.recognition_time) {
      console.log('\nRecognition Time Statistics:');
      console.log(`  Count: ${stats.recognition_time.count}`);
      console.log(`  Average: ${stats.recognition_time.average.toFixed(2)}ms`);
      console.log(`  Min: ${stats.recognition_time.min.toFixed(2)}ms`);
      console.log(`  Max: ${stats.recognition_time.max.toFixed(2)}ms`);
      console.log(`  Median: ${stats.recognition_time.median.toFixed(2)}ms`);
    }
    
    if (stats.confidence) {
      console.log('\nRecognition Confidence Statistics:');
      console.log(`  Total Attempts: ${stats.confidence.total}`);
      console.log(`  Successful Recognitions: ${stats.confidence.successful}`);
      console.log(`  Success Rate: ${(stats.confidence.success_rate * 100).toFixed(2)}%`);
      console.log(`  Average Confidence (All): ${stats.confidence.average_all.toFixed(3)}`);
      console.log(`  Average Confidence (Successful): ${stats.confidence.average_successful.toFixed(3)}`);
    }
    
    console.log('\nPRF1 Metrics:');
    console.log(`  Precision: ${prf1.precision.toFixed(3)}`);
    console.log(`  Recall: ${prf1.recall.toFixed(3)}`);
    console.log(`  F1-Score: ${prf1.f1_score.toFixed(3)}`);
    
    console.log('\nConfusion Matrix Data:');
    console.log(`  True Positives: ${cm.true_positives}`);
    console.log(`  False Negatives: ${cm.false_negatives}`);
    console.log(`  Total Attempts: ${cm.total_attempts}`);
    
    console.log(`\nErrors: ${stats.errors.count}`);
    Object.keys(stats.errors.types).forEach(type => {
      console.log(`  ${type}: ${stats.errors.types[type]}`);
    });
  }
}

// Export singleton instance
module.exports = new EvaluationMonitor();