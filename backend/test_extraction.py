import sys
import os
# Add backend to path so we can import ml_pipeline
sys.path.append(os.path.join(os.path.dirname(__file__)))

from ml_pipeline import run_ner

test_text = """
Receipt Number : 352289 Date : 15-Feb-2025
Admission ID: 4026
Roll No: 22331A12B6
Name: VENTRAPRAGADA HARI KIRAN
Year : 3rd YEAR
Course : B.TECH
Category : CONVENER
Branch : Information Technology
Parent's Name : VENTRAPRAGADA MURALI KRISHNA
Batch : 2022 - 2023
Academic Year : 2024 - 2025
1 III YEAR Transport Fees 11,000.00
"""

def test_extraction():
    print("Testing extraction logic...")
    fields = run_ner(test_text)
    print(f"Extracted fields: {fields}")
    
    assert fields["total"] == 11000.0, f"Expected 11000.0, got {fields['total']}"
    print("Test passed: Total correctly extracted!")

if __name__ == "__main__":
    test_extraction()
