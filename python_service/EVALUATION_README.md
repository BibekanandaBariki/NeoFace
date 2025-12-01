# Face Recognition System Evaluation Tools

This directory contains tools to evaluate your NeoFace attendance system without modifying the main application.

## Tools Overview

### 1. Face Recognition Evaluator (`face_evaluation.py`)
- Generates confusion matrix
- Calculates precision, recall, and F1-score
- Measures inference time
- Provides overall accuracy metrics

### 2. Performance Monitor (`performance_monitor.py`)
- Real-time performance monitoring
- Tracks inference times and recognition rates
- Generates performance reports

### 3. Data Collector (`collect_existing_data.py`)
- Extracts performance data from existing logs
- Analyzes system performance metrics
- Collects database statistics

### 4. Test Data Organizer (`organize_test_data.py`)
- Helps organize test images for evaluation
- Creates directory structure for evaluation

## How to Use

### Setting Up Test Data

1. Run the test data organizer:
   ```bash
   python3 organize_test_data.py
   ```

2. Place your test images in the generated directory structure:
   ```
   test_images/
     ├── STUDENT_ID_1/
     │   ├── image1.jpg
     │   └── image2.jpg
     ├── STUDENT_ID_2/
     │   ├── image1.jpg
     │   └── image2.jpg
     └── ...
   ```

### Running Face Recognition Evaluation

1. Ensure your Python service is set up with required dependencies:
   ```bash
   pip install scikit-learn opencv-python numpy
   ```

2. Run the evaluation:
   ```bash
   python3 face_evaluation.py
   ```

### Monitoring Real-time Performance

1. Integrate the `PerformanceMonitor` class into your face recognition code:
   ```python
   from performance_monitor import PerformanceMonitor
   
   monitor = PerformanceMonitor()
   
   # In your recognition loop:
   start_time = time.time()
   # ... face recognition process ...
   end_time = time.time()
   
   monitor.log_inference_time(end_time - start_time)
   ```

### Collecting Existing Data

1. Run the data collector:
   ```bash
   python3 collect_existing_data.py
   ```

## Required Dependencies

```bash
pip install scikit-learn opencv-python numpy pymongo
```

## Output Files

- `face_evaluation_results_*.json` - Face recognition evaluation results
- `performance_report_*.json` - Performance monitoring reports

## Integration Notes

These tools are designed to work with your existing system without any modifications. They use the same face recognition functions from your main application but collect additional metrics for evaluation purposes.