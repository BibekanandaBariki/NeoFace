#!/usr/bin/env python3
"""
Baseline Comparison for Face Recognition
This script implements simple baseline models for comparison with your advanced system.
"""

import numpy as np
import cv2
import os
import time
from PIL import Image
from io import BytesIO
import base64

class SimpleBaselines:
    def __init__(self):
        self.baselines = {
            'euclidean': self.euclidean_distance_baseline,
            'cosine': self.cosine_similarity_baseline,
            'histogram': self.histogram_baseline
        }
    
    def preprocess_image(self, image_data):
        """Convert base64 to normalized face image array"""
        try:
            # Decode base64
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            img_bytes = base64.b64decode(image_data)
            img = Image.open(BytesIO(img_bytes)).convert('RGB')
            
            # Convert to numpy array
            img_array = np.array(img)
            return img_array
        except Exception as e:
            print(f"Image preprocessing error: {e}")
            return None
    
    def extract_simple_features(self, img_array):
        """Extract simple features for baseline comparison"""
        # Convert to grayscale
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Resize to small size for simplicity
        small = cv2.resize(gray, (32, 32))
        
        # Flatten to vector
        features = small.flatten().astype(np.float32)
        
        # Normalize
        norm = np.linalg.norm(features)
        if norm > 0:
            features = features / norm
            
        return features
    
    def euclidean_distance_baseline(self, img1_data, img2_data):
        """Simple Euclidean distance baseline"""
        img1 = self.preprocess_image(img1_data)
        img2 = self.preprocess_image(img2_data)
        
        if img1 is None or img2 is None:
            return float('inf')
        
        features1 = self.extract_simple_features(img1)
        features2 = self.extract_simple_features(img2)
        
        # Calculate Euclidean distance
        distance = np.linalg.norm(features1 - features2)
        return distance
    
    def cosine_similarity_baseline(self, img1_data, img2_data):
        """Simple cosine similarity baseline"""
        img1 = self.preprocess_image(img1_data)
        img2 = self.preprocess_image(img2_data)
        
        if img1 is None or img2 is None:
            return 0.0
        
        features1 = self.extract_simple_features(img1)
        features2 = self.extract_simple_features(img2)
        
        # Calculate cosine similarity
        similarity = np.dot(features1, features2) / (np.linalg.norm(features1) * np.linalg.norm(features2))
        return similarity
    
    def histogram_baseline(self, img1_data, img2_data):
        """Simple histogram comparison baseline"""
        img1 = self.preprocess_image(img1_data)
        img2 = self.preprocess_image(img2_data)
        
        if img1 is None or img2 is None:
            return 0.0
        
        # Convert to grayscale
        gray1 = cv2.cvtColor(img1, cv2.COLOR_RGB2GRAY)
        gray2 = cv2.cvtColor(img2, cv2.COLOR_RGB2GRAY)
        
        # Calculate histograms
        hist1 = cv2.calcHist([gray1], [0], None, [256], [0, 256])
        hist2 = cv2.calcHist([gray2], [0], None, [256], [0, 256])
        
        # Compare histograms using correlation
        correlation = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
        return correlation
    
    def benchmark_baseline(self, baseline_name, test_pairs):
        """
        Benchmark a baseline model
        test_pairs: list of (img1_data, img2_data, is_same_person)
        """
        if baseline_name not in self.baselines:
            print(f"Unknown baseline: {baseline_name}")
            return None
        
        baseline_func = self.baselines[baseline_name]
        results = []
        
        print(f"Benchmarking {baseline_name} baseline...")
        
        start_time = time.time()
        for i, (img1_data, img2_data, is_same_person) in enumerate(test_pairs):
            try:
                score = baseline_func(img1_data, img2_data)
                results.append({
                    'score': score,
                    'is_same_person': is_same_person,
                    'processing_time': time.time() - start_time
                })
                print(f"  Pair {i+1}: Score={score:.4f}, Same Person={is_same_person}")
            except Exception as e:
                print(f"  Error processing pair {i+1}: {e}")
                results.append({
                    'score': 0.0,
                    'is_same_person': is_same_person,
                    'processing_time': time.time() - start_time,
                    'error': str(e)
                })
        
        total_time = time.time() - start_time
        print(f"Completed {len(test_pairs)} comparisons in {total_time:.2f} seconds")
        
        return results
    
    def compare_baselines(self, test_pairs):
        """Compare all baseline models"""
        print("=== BASELINE COMPARISON ===")
        
        comparison_results = {}
        
        for baseline_name in self.baselines:
            print(f"\n--- {baseline_name.upper()} BASELINE ---")
            results = self.benchmark_baseline(baseline_name, test_pairs)
            
            if results:
                # Calculate accuracy-like metric
                correct = 0
                total = 0
                
                for result in results:
                    if 'error' not in result:
                        score = result['score']
                        is_same = result['is_same_person']
                        
                        # Simple threshold-based classification
                        # (This would need tuning for each baseline)
                        if baseline_name == 'euclidean':
                            predicted_same = score < 0.5  # Lower distance = more similar
                        else:
                            predicted_same = score > 0.5  # Higher similarity = more similar
                        
                        if predicted_same == is_same:
                            correct += 1
                        total += 1
                
                accuracy = correct / total if total > 0 else 0
                avg_time = sum(r['processing_time'] for r in results) / len(results) if results else 0
                
                comparison_results[baseline_name] = {
                    'accuracy': accuracy,
                    'average_time': avg_time,
                    'total_comparisons': total,
                    'correct_predictions': correct
                }
                
                print(f"Accuracy: {accuracy:.3f} ({correct}/{total})")
                print(f"Average processing time: {avg_time:.4f} seconds")
        
        return comparison_results

def main():
    print("Baseline Comparison Tool")
    print("========================")
    print("This tool compares simple baseline models with your advanced face recognition system.")
    print("\nTo use this tool:")
    print("1. Prepare test image pairs (same person and different persons)")
    print("2. Run the comparison to get baseline performance metrics")
    print("3. Compare with your advanced system's performance")
    
    # Example usage:
    print("\nExample usage:")
    print("""
    baselines = SimpleBaselines()
    
    # Prepare your test data as pairs of images
    test_pairs = [
        (image1_data, image2_data, True),   # Same person
        (image3_data, image4_data, False),  # Different persons
        # ... more pairs
    ]
    
    # Compare all baselines
    results = baselines.compare_baselines(test_pairs)
    
    # Print comparison
    for baseline, metrics in results.items():
        print(f"{baseline}: {metrics['accuracy']:.3f} accuracy, {metrics['average_time']:.4f}s avg")
    """)

if __name__ == "__main__":
    main()