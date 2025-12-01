#!/usr/bin/env python3
"""
Performance Monitoring Script
This script monitors the real-time performance of the face recognition system.
"""

import time
import statistics
import json
import os
from datetime import datetime

class PerformanceMonitor:
    def __init__(self):
        self.inference_times = []
        self.recognition_rates = []
        self.system_metrics = []
        self.start_time = time.time()
        
    def log_inference_time(self, inference_time):
        """Log a single inference time measurement"""
        self.inference_times.append(inference_time)
        
    def log_recognition_rate(self, successful_recognitions, total_attempts):
        """Log recognition rate for a batch"""
        if total_attempts > 0:
            rate = successful_recognitions / total_attempts
            self.recognition_rates.append(rate)
            
    def get_inference_stats(self):
        """Get statistics for inference times"""
        if not self.inference_times:
            return {}
            
        return {
            'count': len(self.inference_times),
            'average': statistics.mean(self.inference_times),
            'median': statistics.median(self.inference_times),
            'min': min(self.inference_times),
            'max': max(self.inference_times),
            'std_dev': statistics.stdev(self.inference_times) if len(self.inference_times) > 1 else 0
        }
        
    def get_recognition_stats(self):
        """Get statistics for recognition rates"""
        if not self.recognition_rates:
            return {}
            
        return {
            'count': len(self.recognition_rates),
            'average': statistics.mean(self.recognition_rates),
            'median': statistics.median(self.recognition_rates),
            'min': min(self.recognition_rates),
            'max': max(self.recognition_rates)
        }
        
    def generate_report(self):
        """Generate a comprehensive performance report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'uptime_seconds': time.time() - self.start_time,
            'inference_statistics': self.get_inference_stats(),
            'recognition_statistics': self.get_recognition_stats(),
            'total_inference_measurements': len(self.inference_times),
            'total_recognition_measurements': len(self.recognition_rates)
        }
        
        return report
        
    def save_report(self, filename=None):
        """Save the performance report to a JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"performance_report_{timestamp}.json"
            
        report = self.generate_report()
        
        try:
            with open(filename, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"Performance report saved to: {filename}")
            return filename
        except Exception as e:
            print(f"Error saving report: {e}")
            return None
            
    def print_summary(self):
        """Print a summary of current performance"""
        inference_stats = self.get_inference_stats()
        recognition_stats = self.get_recognition_stats()
        
        print("\n=== PERFORMANCE SUMMARY ===")
        print(f"Uptime: {time.time() - self.start_time:.2f} seconds")
        print(f"Total inference measurements: {len(self.inference_times)}")
        print(f"Total recognition measurements: {len(self.recognition_rates)}")
        
        if inference_stats:
            print(f"\nInference Time Statistics:")
            print(f"  Average: {inference_stats['average']:.4f}s")
            print(f"  Median:  {inference_stats['median']:.4f}s")
            print(f"  Min:     {inference_stats['min']:.4f}s")
            print(f"  Max:     {inference_stats['max']:.4f}s")
            print(f"  Std Dev: {inference_stats['std_dev']:.4f}s")
            
        if recognition_stats:
            print(f"\nRecognition Rate Statistics:")
            print(f"  Average: {recognition_stats['average']:.4f}")
            print(f"  Median:  {recognition_stats['median']:.4f}")
            print(f"  Min:     {recognition_stats['min']:.4f}")
            print(f"  Max:     {recognition_stats['max']:.4f}")

def main():
    print("Performance Monitoring Tool")
    print("=" * 30)
    print("This tool monitors the real-time performance of your face recognition system.")
    print("To use it, integrate the PerformanceMonitor class into your face recognition code.")
    print("\nExample integration:")
    print("""
    # Create monitor instance
    monitor = PerformanceMonitor()
    
    # In your recognition loop:
    start_time = time.time()
    # ... face recognition process ...
    end_time = time.time()
    
    # Log the inference time
    monitor.log_inference_time(end_time - start_time)
    
    # Periodically save reports
    if len(monitor.inference_times) % 100 == 0:
        monitor.save_report()
        monitor.print_summary()
    """)

if __name__ == "__main__":
    main()