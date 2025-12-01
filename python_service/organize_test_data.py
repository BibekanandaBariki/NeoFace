#!/usr/bin/env python3
"""
Test Data Organization Script
This script helps organize existing face data for evaluation purposes.
"""

import os
import shutil
import json
from pathlib import Path

def organize_test_data_from_database():
    """
    Organize test data by extracting from the existing database structure.
    This assumes you have student data in your MongoDB.
    """
    print("This script would extract test data from your MongoDB database.")
    print("Since we're not modifying your application, you'll need to:")
    print("1. Export student face images from your database")
    print("2. Organize them in the required structure")
    print("\nExample structure:")
    print("test_images/")
    print("  ├── STUDENT_ID_1/")
    print("  │   ├── image1.jpg")
    print("  │   └── image2.jpg")
    print("  ├── STUDENT_ID_2/")
    print("  │   ├── image1.jpg")
    print("  │   └── image2.jpg")
    print("  └── ...")

def create_sample_structure():
    """
    Create a sample directory structure for test data
    """
    test_dir = "test_images"
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)
        print(f"Created {test_dir} directory")
    
    # Create sample student directories (you would replace these with real student IDs)
    sample_students = ["STUDENT_001", "STUDENT_002", "STUDENT_003"]
    
    for student_id in sample_students:
        student_dir = os.path.join(test_dir, student_id)
        if not os.path.exists(student_dir):
            os.makedirs(student_dir)
            print(f"Created {student_dir}")
            
    print(f"\nSample structure created in {test_dir}")
    print("Now place your test images in the appropriate student directories.")

def main():
    print("Test Data Organization Tool")
    print("=" * 30)
    print("This tool helps organize test data for face recognition evaluation.")
    print("\nOptions:")
    print("1. Create sample directory structure")
    print("2. Instructions for extracting from database")
    
    choice = input("\nEnter your choice (1 or 2): ").strip()
    
    if choice == "1":
        create_sample_structure()
    elif choice == "2":
        organize_test_data_from_database()
    else:
        print("Invalid choice. Creating sample structure by default.")
        create_sample_structure()

if __name__ == "__main__":
    main()