#!/usr/bin/env python3
"""
Face Recognition Evaluation Script
This script evaluates the face recognition system without modifying the main application.
"""

import cv2
import numpy as np
import time
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support, classification_report
from sklearn.model_selection import train_test_split
import json
import os
import sys
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class FaceRecognitionEvaluator:
    def __init__(self):
        self.actual_labels = []
        self.predicted_labels = []
        self.inference_times = []
        self.results = {}
        
    def collect_predictions(self, test_data_path):
        """
        Collect predictions from test data
        test_data_path: Path to directory with test images organized by student ID
        """
        print("Loading known faces...")
        
        # Walk through test data directory
        for root, dirs, files in os.walk(test_data_path):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    # Extract student ID from path
                    student_id = os.path.basename(root)
                    image_path = os.path.join(root, file)
                    
                    print(f"Processing {image_path} for student {student_id}")
                    
                    # Read image
                    image = cv2.imread(image_path)
                    if image is None:
                        print(f"Could not read image: {image_path}")
                        continue
                    
                    # Measure inference time
                    start_time = time.time()
                    
                    try:
                        # For now, we'll simulate the recognition process
                        # In a real implementation, you would call your actual face recognition service
                        result = self.simulate_face_recognition(image, student_id)
                        
                        end_time = time.time()
                        inference_time = end_time - start_time
                        
                        # Store actual label
                        self.actual_labels.append(student_id)
                        
                        # Store predicted label (if recognized)
                        if result.get('recognized_student'):
                            self.predicted_labels.append(result['recognized_student'])
                        else:
                            # Use a special label for unrecognized faces
                            self.predicted_labels.append("UNKNOWN")
                            
                        # Store inference time
                        self.inference_times.append(inference_time)
                        
                        print(f"  -> Inference time: {inference_time:.4f}s")
                        
                    except Exception as e:
                        print(f"  -> Error processing image: {e}")
                        end_time = time.time()
                        self.inference_times.append(end_time - start_time)
                        self.actual_labels.append(student_id)
                        self.predicted_labels.append("ERROR")
        
    def simulate_face_recognition(self, image, expected_student_id):
        """
        Simulate face recognition process
        In a real implementation, this would call your actual face recognition service
        """
        # Simulate some recognition logic
        # For demonstration, we'll have a high accuracy rate
        import random
        if random.random() > 0.1:  # 90% accuracy
            return {"recognized_student": expected_student_id}
        else:
            # Return a random wrong student ID or UNKNOWN
            if random.random() > 0.5:
                return {"recognized_student": "WRONG_STUDENT"}
            else:
                return {"recognized_student": None}
    
    def calculate_metrics(self):
        """Calculate all evaluation metrics"""
        if not self.actual_labels or not self.predicted_labels:
            print("No data to evaluate")
            return
            
        print("\n=== EVALUATION RESULTS ===")
        
        # 1. Confusion Matrix
        try:
            cm = confusion_matrix(self.actual_labels, self.predicted_labels)
            print("\nConfusion Matrix:")
            print(cm)
            self.results['confusion_matrix'] = cm.tolist()
        except Exception as e:
            print(f"Error calculating confusion matrix: {e}")
            
        # 2. Precision, Recall, F1-Score
        try:
            precision, recall, f1, support = precision_recall_fscore_support(
                self.actual_labels, self.predicted_labels, average=None, zero_division='warn'
            )
            
            # Weighted averages
            precision_avg, recall_avg, f1_avg, _ = precision_recall_fscore_support(
                self.actual_labels, self.predicted_labels, average='weighted', zero_division='warn'
            )
            
            print(f"\nOverall Metrics:")
            print(f"Precision: {precision_avg:.4f}")
            print(f"Recall: {recall_avg:.4f}")
            print(f"F1-Score: {f1_avg:.4f}")
            
            self.results['precision'] = float(precision_avg)
            self.results['recall'] = float(recall_avg)
            self.results['f1_score'] = float(f1_avg)
            
            # Per-class metrics
            print(f"\nDetailed Classification Report:")
            report = classification_report(self.actual_labels, self.predicted_labels, zero_division='warn')
            print(report)
            
        except Exception as e:
            print(f"Error calculating precision/recall/f1: {e}")
            
        # 3. Inference Time Statistics
        if self.inference_times:
            avg_time = np.mean(self.inference_times)
            std_time = np.std(self.inference_times)
            min_time = np.min(self.inference_times)
            max_time = np.max(self.inference_times)
            
            print(f"\nInference Time Statistics:")
            print(f"Average: {avg_time:.4f}s")
            print(f"Standard Deviation: {std_time:.4f}s")
            print(f"Min: {min_time:.4f}s")
            print(f"Max: {max_time:.4f}s")
            
            self.results['inference_time_avg'] = float(avg_time)
            self.results['inference_time_std'] = float(std_time)
            self.results['inference_time_min'] = float(min_time)
            self.results['inference_time_max'] = float(max_time)
            
        # 4. Accuracy
        correct_predictions = sum(1 for a, p in zip(self.actual_labels, self.predicted_labels) if a == p)
        total_predictions = len(self.actual_labels)
        accuracy = correct_predictions / total_predictions if total_predictions > 0 else 0
        
        print(f"\nAccuracy: {accuracy:.4f} ({correct_predictions}/{total_predictions})")
        self.results['accuracy'] = float(accuracy)
        self.results['correct_predictions'] = correct_predictions
        self.results['total_predictions'] = total_predictions
        
    def save_results(self, output_path=None):
        """Save results to JSON file"""
        if not output_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"face_evaluation_results_{timestamp}.json"
            
        self.results['timestamp'] = datetime.now().isoformat()
        self.results['sample_count'] = len(self.actual_labels)
        
        try:
            with open(output_path, 'w') as f:
                json.dump(self.results, f, indent=2)
            print(f"\nResults saved to: {output_path}")
        except Exception as e:
            print(f"Error saving results: {e}")

def main():
    evaluator = FaceRecognitionEvaluator()
    
    # Path to test data (you need to organize your test images in this structure)
    test_data_path = "test_images"  # Create this directory with subdirectories for each student
    
    print("Face Recognition Evaluation")
    print("=" * 30)
    
    # Check if test data directory exists
    if not os.path.exists(test_data_path):
        print(f"Test data directory '{test_data_path}' not found.")
        print("Please create a directory with the following structure:")
        print("test_images/")
        print("  ├── STUDENT_ID_1/")
        print("  │   ├── image1.jpg")
        print("  │   └── image2.jpg")
        print("  ├── STUDENT_ID_2/")
        print("  │   ├── image1.jpg")
        print("  │   └── image2.jpg")
        print("  └── ...")
        return
    
    # Collect predictions
    evaluator.collect_predictions(test_data_path)
    
    # Calculate metrics
    evaluator.calculate_metrics()
    
    # Save results
    evaluator.save_results()

if __name__ == "__main__":
    main()