#!/usr/bin/env python3
"""
Data Collection Script
This script collects existing performance data from your system logs.
"""

import re
import json
import os
from datetime import datetime
from collections import defaultdict

def parse_backend_logs(log_file_path):
    """
    Parse backend logs to extract performance data
    """
    performance_data = {
        'api_response_times': [],
        'face_recognition_times': [],
        'database_query_times': [],
        'errors': []
    }
    
    if not os.path.exists(log_file_path):
        print(f"Log file not found: {log_file_path}")
        return performance_data
        
    with open(log_file_path, 'r') as f:
        for line in f:
            # Look for timing information in logs
            if 'face recognition' in line.lower() and 'seconds' in line.lower():
                # Extract time from log line
                time_match = re.search(r'(\d+\.\d+) seconds', line)
                if time_match:
                    time_value = float(time_match.group(1))
                    performance_data['face_recognition_times'].append(time_value)
                    
            elif 'database query' in line.lower() and 'seconds' in line.lower():
                time_match = re.search(r'(\d+\.\d+) seconds', line)
                if time_match:
                    time_value = float(time_match.group(1))
                    performance_data['database_query_times'].append(time_value)
                    
            elif 'api response' in line.lower() and 'seconds' in line.lower():
                time_match = re.search(r'(\d+\.\d+) seconds', line)
                if time_match:
                    time_value = float(time_match.group(1))
                    performance_data['api_response_times'].append(time_value)
                    
            elif 'error' in line.lower() or 'exception' in line.lower():
                performance_data['errors'].append(line.strip())
    
    return performance_data

def analyze_performance_data(performance_data):
    """
    Analyze collected performance data
    """
    print("=== PERFORMANCE ANALYSIS ===")
    
    # Face recognition times
    if performance_data['face_recognition_times']:
        times = performance_data['face_recognition_times']
        print(f"\nFace Recognition Times:")
        print(f"  Count: {len(times)}")
        print(f"  Average: {sum(times)/len(times):.4f}s")
        print(f"  Min: {min(times):.4f}s")
        print(f"  Max: {max(times):.4f}s")
        
    # API response times
    if performance_data['api_response_times']:
        times = performance_data['api_response_times']
        print(f"\nAPI Response Times:")
        print(f"  Count: {len(times)}")
        print(f"  Average: {sum(times)/len(times):.4f}s")
        print(f"  Min: {min(times):.4f}s")
        print(f"  Max: {max(times):.4f}s")
        
    # Database query times
    if performance_data['database_query_times']:
        times = performance_data['database_query_times']
        print(f"\nDatabase Query Times:")
        print(f"  Count: {len(times)}")
        print(f"  Average: {sum(times)/len(times):.4f}s")
        print(f"  Min: {min(times):.4f}s")
        print(f"  Max: {max(times):.4f}s")
        
    # Error count
    if performance_data['errors']:
        print(f"\nErrors Found: {len(performance_data['errors'])}")
        # Show first few errors
        for i, error in enumerate(performance_data['errors'][:5]):
            print(f"  {i+1}. {error}")

def collect_database_statistics():
    """
    Collect database statistics (this would connect to your MongoDB)
    """
    print("\n=== DATABASE STATISTICS ===")
    print("To collect database statistics, you would run MongoDB queries like:")
    print("  db.students.count() - Total students")
    print("  db.subjects.count() - Total subjects")
    print("  db.attendance.count() - Total attendance records")
    print("  db.users.count() - Total users by role")
    print("\nExample MongoDB commands:")
    print("  mongo neoface --eval 'db.students.count()'")  
    print("  mongo neoface --eval 'db.users.aggregate([{$group: {_id: \"$role\", count: {$sum: 1}}}])'")

def main():
    print("Existing Data Collection Tool")
    print("=" * 30)
    print("This tool collects performance data from your existing system.")
    
    # Look for common log file locations
    log_files = [
        '/tmp/backend.log',
        '/var/log/neoface/backend.log',
        './backend.log',
        '../backend/logs/app.log'
    ]
    
    found_logs = []
    for log_file in log_files:
        if os.path.exists(log_file):
            found_logs.append(log_file)
            print(f"Found log file: {log_file}")
    
    if not found_logs:
        print("No log files found. Please specify the path to your backend log file.")
        log_path = input("Enter path to backend log file: ").strip()
        if log_path and os.path.exists(log_path):
            found_logs.append(log_path)
    
    # Parse log files
    all_performance_data = {
        'api_response_times': [],
        'face_recognition_times': [],
        'database_query_times': [],
        'errors': []
    }
    
    for log_file in found_logs:
        print(f"\nParsing {log_file}...")
        perf_data = parse_backend_logs(log_file)
        
        # Merge data
        all_performance_data['api_response_times'].extend(perf_data['api_response_times'])
        all_performance_data['face_recognition_times'].extend(perf_data['face_recognition_times'])
        all_performance_data['database_query_times'].extend(perf_data['database_query_times'])
        all_performance_data['errors'].extend(perf_data['errors'])
    
    # Analyze data
    if any(len(v) > 0 for v in all_performance_data.values()):
        analyze_performance_data(all_performance_data)
    else:
        print("No performance data found in logs.")
    
    # Collect database statistics
    collect_database_statistics()
    
    print("\nTo collect more detailed data, you can:")
    print("1. Enable more detailed logging in your backend")
    print("2. Add timing measurements to critical functions")
    print("3. Use database profiling tools")
    print("4. Monitor system resources during operation")

if __name__ == "__main__":
    main()