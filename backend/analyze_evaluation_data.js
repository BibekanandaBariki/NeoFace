/**
 * Analyze Evaluation Data
 * This script analyzes the collected evaluation metrics and generates reports.
 */

const fs = require('fs');
const path = require('path');
const evaluationMonitor = require('./evaluation_monitor');

// Function to read and analyze metrics
function analyzeMetrics() {
  const logFilePath = path.join(__dirname, 'logs', 'evaluation_metrics.json');
  
  if (!fs.existsSync(logFilePath)) {
    console.log('No evaluation metrics found yet. Please run the system to collect data first.');
    return null;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
    return data;
  } catch (error) {
    console.error('Error reading evaluation metrics:', error.message);
    return null;
  }
}

// Function to generate detailed report
function generateDetailedReport(metricsData) {
  if (!metricsData) {
    console.log('No metrics data to analyze');
    return;
  }
  
  console.log('\n=== DETAILED EVALUATION REPORT ===');
  console.log(`Report generated: ${new Date().toISOString()}`);
  console.log(`System uptime: ${(metricsData.uptime / 1000).toFixed(2)} seconds`);
  
  // Recognition Performance
  console.log('\n--- FACE RECOGNITION PERFORMANCE ---');
  if (metricsData.metrics.recognition_times.length > 0) {
    const times = metricsData.metrics.recognition_times;
    console.log(`Total recognition attempts: ${times.length}`);
    console.log(`Average recognition time: ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(2)}ms`);
    console.log(`Min recognition time: ${Math.min(...times).toFixed(2)}ms`);
    console.log(`Max recognition time: ${Math.max(...times).toFixed(2)}ms`);
  }
  
  // Embedding Generation
  console.log('\n--- EMBEDDING GENERATION ---');
  if (metricsData.metrics.embedding_generation_times.length > 0) {
    const times = metricsData.metrics.embedding_generation_times;
    console.log(`Total embedding generations: ${times.length}`);
    console.log(`Average generation time: ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(2)}ms`);
    console.log(`Min generation time: ${Math.min(...times).toFixed(2)}ms`);
    console.log(`Max generation time: ${Math.max(...times).toFixed(2)}ms`);
  }
  
  // Confidence Scores
  console.log('\n--- RECOGNITION CONFIDENCE ---');
  if (metricsData.metrics.recognition_confidence_scores.length > 0) {
    const scores = metricsData.metrics.recognition_confidence_scores;
    const successful = scores.filter(s => s.isSuccessful);
    const failed = scores.filter(s => !s.isSuccessful);
    
    console.log(`Total recognition attempts: ${scores.length}`);
    console.log(`Successful recognitions: ${successful.length}`);
    console.log(`Failed recognitions: ${failed.length}`);
    console.log(`Success rate: ${((successful.length / scores.length) * 100).toFixed(2)}%`);
    
    if (successful.length > 0) {
      const avgConfidence = successful.reduce((sum, s) => sum + s.confidence, 0) / successful.length;
      console.log(`Average confidence (successful): ${avgConfidence.toFixed(3)}`);
    }
    
    if (scores.length > 0) {
      const avgOverallConfidence = scores.reduce((sum, s) => sum + s.confidence, 0) / scores.length;
      console.log(`Average confidence (overall): ${avgOverallConfidence.toFixed(3)}`);
    }
  }
  
  // API Response Times
  console.log('\n--- API PERFORMANCE ---');
  if (metricsData.metrics.api_response_times.length > 0) {
    const apiTimes = metricsData.metrics.api_response_times;
    console.log(`Total API calls monitored: ${apiTimes.length}`);
    
    // Group by endpoint
    const endpointStats = {};
    apiTimes.forEach(call => {
      if (!endpointStats[call.endpoint]) {
        endpointStats[call.endpoint] = [];
      }
      endpointStats[call.endpoint].push(call.time);
    });
    
    Object.keys(endpointStats).forEach(endpoint => {
      const times = endpointStats[endpoint];
      console.log(`\nEndpoint: ${endpoint}`);
      console.log(`  Calls: ${times.length}`);
      console.log(`  Average response time: ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(2)}ms`);
      console.log(`  Min response time: ${Math.min(...times).toFixed(2)}ms`);
      console.log(`  Max response time: ${Math.max(...times).toFixed(2)}ms`);
    });
  }
  
  // Errors
  console.log('\n--- ERROR ANALYSIS ---');
  if (metricsData.metrics.errors.length > 0) {
    console.log(`Total errors: ${metricsData.metrics.errors.length}`);
    const errorTypes = {};
    metricsData.metrics.errors.forEach(error => {
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
    });
    
    Object.keys(errorTypes).forEach(type => {
      console.log(`  ${type}: ${errorTypes[type]} occurrences`);
    });
  } else {
    console.log('No errors recorded');
  }
}

// Function to generate confusion matrix (simplified)
function generateConfusionMatrix(metricsData) {
  if (!metricsData || !metricsData.metrics.recognition_confidence_scores.length) {
    console.log('No recognition data available for confusion matrix');
    return;
  }
  
  console.log('\n--- CONFUSION MATRIX (SIMPLIFIED) ---');
  const scores = metricsData.metrics.recognition_confidence_scores;
  const successful = scores.filter(s => s.isSuccessful).length;
  const failed = scores.filter(s => !s.isSuccessful).length;
  const total = scores.length;
  
  console.log('Actual\\Predicted | Recognized | Not Recognized');
  console.log('----------------|------------|----------------');
  console.log(`     Person     |   ${successful.toString().padStart(4)}    |    ${failed.toString().padStart(4)}     `);
  console.log(`   Not Person   |    0       |    0           `); // Simplified
  console.log(`\nNote: This is a simplified confusion matrix. A complete matrix would require tracking actual vs predicted identities.`);
}

// Function to calculate PRF1 metrics
function calculatePRF1(metricsData) {
  if (!metricsData || !metricsData.metrics.recognition_confidence_scores.length) {
    console.log('No recognition data available for PRF1 calculation');
    return;
  }
  
  console.log('\n--- PRECISION, RECALL, F1-SCORE ---');
  const scores = metricsData.metrics.recognition_confidence_scores;
  const successful = scores.filter(s => s.isSuccessful).length;
  const total = scores.length;
  
  // Simplified calculation - assuming all successful recognitions are true positives
  const precision = total > 0 ? successful / total : 0;
  const recall = total > 0 ? successful / total : 0; // Simplified
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  
  console.log(`Precision: ${precision.toFixed(3)} (${successful}/${total})`);
  console.log(`Recall: ${recall.toFixed(3)} (${successful}/${total})`);
  console.log(`F1-Score: ${f1.toFixed(3)}`);
  console.log(`\nNote: These are simplified metrics. Complete PRF1 requires true/false positives/negatives.`);
}

// Function to generate training vs validation-like data
function generateTrainingValidationData(metricsData) {
  if (!metricsData || !metricsData.metrics.recognition_confidence_scores.length) {
    console.log('No recognition data available for training/validation analysis');
    return;
  }
  
  console.log('\n--- TRAINING VS VALIDATION SIMULATION ---');
  
  // Simulate by splitting data into "training" and "validation" sets
  const scores = metricsData.metrics.recognition_confidence_scores;
  const midpoint = Math.floor(scores.length / 2);
  
  const trainingSet = scores.slice(0, midpoint);
  const validationSet = scores.slice(midpoint);
  
  console.log(`Total data points: ${scores.length}`);
  console.log(`Training set size: ${trainingSet.length}`);
  console.log(`Validation set size: ${validationSet.length}`);
  
  if (trainingSet.length > 0) {
    const trainSuccess = trainingSet.filter(s => s.isSuccessful).length;
    const trainRate = trainSuccess / trainingSet.length;
    console.log(`Training success rate: ${(trainRate * 100).toFixed(2)}%`);
  }
  
  if (validationSet.length > 0) {
    const valSuccess = validationSet.filter(s => s.isSuccessful).length;
    const valRate = valSuccess / validationSet.length;
    console.log(`Validation success rate: ${(valRate * 100).toFixed(2)}%`);
  }
  
  console.log(`\nNote: This simulates training/validation split. Actual training data would come from model training logs.`);
}

// Function to save analysis to file
function saveAnalysisToFile(metricsData) {
  if (!metricsData) return;
  
  const analysis = {
    timestamp: new Date().toISOString(),
    summary: {
      uptime_seconds: metricsData.uptime / 1000,
      total_recognition_attempts: metricsData.metrics.recognition_times.length,
      total_embedding_generations: metricsData.metrics.embedding_generation_times.length,
      total_api_calls: metricsData.metrics.api_response_times.length,
      total_errors: metricsData.metrics.errors.length
    },
    recognition_performance: metricsData.statistics.recognition_time,
    embedding_performance: metricsData.statistics.embedding_time,
    confidence_statistics: metricsData.statistics.confidence,
    prf1_metrics: metricsData.prf1_metrics,
    confusion_matrix: metricsData.confusion_matrix
  };
  
  const outputPath = path.join(__dirname, 'logs', `evaluation_analysis_${Date.now()}.json`);
  
  try {
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`\nDetailed analysis saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error saving analysis:', error.message);
    return null;
  }
}

// Main function
function main() {
  console.log('Analyzing NeoFace Evaluation Data');
  console.log('=================================');
  
  const metricsData = analyzeMetrics();
  
  if (!metricsData) {
    console.log('\nPlease run your face recognition system to collect evaluation data first.');
    console.log('Metrics will be automatically collected and saved to backend/logs/evaluation_metrics.json');
    return;
  }
  
  generateDetailedReport(metricsData);
  generateConfusionMatrix(metricsData);
  calculatePRF1(metricsData);
  generateTrainingValidationData(metricsData);
  
  const analysisPath = saveAnalysisToFile(metricsData);
  
  console.log('\n=== ANALYSIS COMPLETE ===');
  if (analysisPath) {
    console.log(`Full analysis saved to: ${analysisPath}`);
  }
}

// Export functions
module.exports = {
  analyzeMetrics,
  generateDetailedReport,
  generateConfusionMatrix,
  calculatePRF1,
  generateTrainingValidationData,
  saveAnalysisToFile
};

// Run analysis if called directly
if (require.main === module) {
  main();
}