/**
 * Setup Evaluation Monitoring
 * This script sets up monitoring for the face recognition system
 * by patching the face routes to collect evaluation metrics.
 */

const fs = require('fs');
const path = require('path');

// Function to patch the face routes file
function patchFaceRoutes() {
  const faceRoutesPath = path.join(__dirname, 'routes', 'face.js');
  
  if (!fs.existsSync(faceRoutesPath)) {
    console.error('Face routes file not found:', faceRoutesPath);
    return false;
  }
  
  try {
    let content = fs.readFileSync(faceRoutesPath, 'utf8');
    
    // Check if already patched
    if (content.includes('faceServiceWithMonitoring')) {
      console.log('Face routes already patched for monitoring');
      return true;
    }
    
    // Replace the faceService import with our monitoring wrapper
    content = content.replace(
      "const faceService = require('../services/faceRecognition');",
      "const faceService = require('../services/faceRecognition');\nconst faceServiceWithMonitoring = require('../services/faceRecognitionWithMonitoring');"
    );
    
    // Replace calls to faceService.recognizeFace with monitoring version
    content = content.replace(
      'const result = await faceService.recognizeFace(imageData, candidates);',
      'const result = await faceServiceWithMonitoring.recognizeFace(imageData, candidates);'
    );
    
    // Replace calls to faceService.generateEmbedding with monitoring version
    content = content.replace(
      'const embedding = await faceService.generateEmbedding(framesToProcess[0], framesToProcess);',
      'const embedding = await faceServiceWithMonitoring.generateEmbedding(framesToProcess[0], framesToProcess);'
    );
    
    content = content.replace(
      'const embedding = await faceService.generateEmbedding(imageData, frames);',
      'const embedding = await faceServiceWithMonitoring.generateEmbedding(imageData, frames);'
    );
    
    // Write the modified content back
    fs.writeFileSync(faceRoutesPath, content, 'utf8');
    console.log('Successfully patched face routes for monitoring');
    return true;
  } catch (error) {
    console.error('Error patching face routes:', error.message);
    return false;
  }
}

// Function to restore original face routes
function restoreFaceRoutes() {
  const faceRoutesPath = path.join(__dirname, 'routes', 'face.js');
  
  if (!fs.existsSync(faceRoutesPath)) {
    console.error('Face routes file not found:', faceRoutesPath);
    return false;
  }
  
  try {
    let content = fs.readFileSync(faceRoutesPath, 'utf8');
    
    // Remove monitoring imports
    content = content.replace(
      "const faceService = require('../services/faceRecognition');\nconst faceServiceWithMonitoring = require('../services/faceRecognitionWithMonitoring');",
      "const faceService = require('../services/faceRecognition');"
    );
    
    // Restore original service calls
    content = content.replace(
      'const result = await faceServiceWithMonitoring.recognizeFace(imageData, candidates);',
      'const result = await faceService.recognizeFace(imageData, candidates);'
    );
    
    content = content.replace(
      'const embedding = await faceServiceWithMonitoring.generateEmbedding(framesToProcess[0], framesToProcess);',
      'const embedding = await faceService.generateEmbedding(framesToProcess[0], framesToProcess);'
    );
    
    content = content.replace(
      'const embedding = await faceServiceWithMonitoring.generateEmbedding(imageData, frames);',
      'const embedding = await faceService.generateEmbedding(imageData, frames);'
    );
    
    // Write the restored content back
    fs.writeFileSync(faceRoutesPath, content, 'utf8');
    console.log('Successfully restored original face routes');
    return true;
  } catch (error) {
    console.error('Error restoring face routes:', error.message);
    return false;
  }
}

// Function to add API response time monitoring
function addApiResponseMonitoring() {
  const serverPath = path.join(__dirname, 'server.js');
  
  if (!fs.existsSync(serverPath)) {
    console.error('Server file not found:', serverPath);
    return false;
  }
  
  try {
    let content = fs.readFileSync(serverPath, 'utf8');
    
    // Check if already patched
    if (content.includes('evaluationMonitor')) {
      console.log('Server already patched for API monitoring');
      return true;
    }
    
    // Add evaluation monitor import
    content = content.replace(
      "const initSuperAdmin = async () => {",
      "const evaluationMonitor = require('./evaluation_monitor');\n\nconst initSuperAdmin = async () => {"
    );
    
    // Add middleware to monitor API response times
    const middlewareCode = `
// API Response Time Monitoring Middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    evaluationMonitor.logApiResponseTime(req.path, duration);
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
});
`;
    
    // Insert middleware after other middleware but before routes
    content = content.replace(
      '// Routes',
      '// Routes\n' + middlewareCode
    );
    
    // Add periodic metrics saving
    const periodicSaveCode = `
// Periodically save evaluation metrics
setInterval(() => {
  evaluationMonitor.saveMetrics();
  evaluationMonitor.printSummary();
}, 300000); // Save every 5 minutes
`;
    
    content = content.replace(
      '// Make io accessible to routes',
      periodicSaveCode + '\n// Make io accessible to routes'
    );
    
    // Write the modified content back
    fs.writeFileSync(serverPath, content, 'utf8');
    console.log('Successfully added API response monitoring');
    return true;
  } catch (error) {
    console.error('Error adding API response monitoring:', error.message);
    return false;
  }
}

// Function to remove API response monitoring
function removeApiResponseMonitoring() {
  const serverPath = path.join(__dirname, 'server.js');
  
  if (!fs.existsSync(serverPath)) {
    console.error('Server file not found:', serverPath);
    return false;
  }
  
  try {
    let content = fs.readFileSync(serverPath, 'utf8');
    
    // Remove evaluation monitor import
    content = content.replace(
      "const evaluationMonitor = require('./evaluation_monitor');\n\nconst initSuperAdmin = async () => {",
      "const initSuperAdmin = async () => {"
    );
    
    // Remove middleware
    const middlewareCode = `
// API Response Time Monitoring Middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    evaluationMonitor.logApiResponseTime(req.path, duration);
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
});
`;
    
    content = content.replace(middlewareCode, '');
    
    // Remove periodic metrics saving
    const periodicSaveCode = `
// Periodically save evaluation metrics
setInterval(() => {
  evaluationMonitor.saveMetrics();
  evaluationMonitor.printSummary();
}, 300000); // Save every 5 minutes
`;
    
    content = content.replace(periodicSaveCode + '\n', '');
    
    // Write the restored content back
    fs.writeFileSync(serverPath, content, 'utf8');
    console.log('Successfully removed API response monitoring');
    return true;
  } catch (error) {
    console.error('Error removing API response monitoring:', error.message);
    return false;
  }
}

// Main setup function
function setupEvaluationMonitoring() {
  console.log('Setting up evaluation monitoring...');
  
  const success1 = patchFaceRoutes();
  const success2 = addApiResponseMonitoring();
  
  if (success1 && success2) {
    console.log('✅ Evaluation monitoring setup complete!');
    console.log('Metrics will be collected automatically during face recognition operations.');
    console.log('Data will be saved to: backend/logs/evaluation_metrics.json');
    return true;
  } else {
    console.error('❌ Failed to setup evaluation monitoring');
    return false;
  }
}

// Main teardown function
function removeEvaluationMonitoring() {
  console.log('Removing evaluation monitoring...');
  
  const success1 = restoreFaceRoutes();
  const success2 = removeApiResponseMonitoring();
  
  if (success1 && success2) {
    console.log('✅ Evaluation monitoring removed successfully!');
    return true;
  } else {
    console.error('❌ Failed to remove evaluation monitoring');
    return false;
  }
}

// Export functions
module.exports = {
  setup: setupEvaluationMonitoring,
  remove: removeEvaluationMonitoring,
  patchFaceRoutes,
  restoreFaceRoutes,
  addApiResponseMonitoring,
  removeApiResponseMonitoring
};

// Run setup if called directly
if (require.main === module) {
  const action = process.argv[2] || 'setup';
  
  if (action === 'setup') {
    setupEvaluationMonitoring();
  } else if (action === 'remove') {
    removeEvaluationMonitoring();
  } else {
    console.log('Usage: node setup_evaluation_monitoring.js [setup|remove]');
  }
}