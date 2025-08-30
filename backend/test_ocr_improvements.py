#!/usr/bin/env python3
"""
Test script to compare original vs enhanced OCR pipeline performance
"""

import sys
import os
import time
from ml_pipeline import run_ocr as original_ocr, run_ner as original_ner, categorize_expense as original_categorize
from enhanced_ml_pipeline import run_enhanced_ocr, enhanced_ner, enhanced_categorize_expense

def test_ocr_comparison(image_path):
    """Compare original vs enhanced OCR performance"""
    print(f"Testing OCR improvements on: {image_path}")
    print("=" * 60)
    
    if not os.path.exists(image_path):
        print(f"Error: Image file {image_path} not found!")
        return
    
    # Test original OCR
    print("🔍 Running Original OCR Pipeline...")
    start_time = time.time()
    try:
        original_text = original_ocr(image_path)
        original_time = time.time() - start_time
        original_fields = original_ner(original_text)
        original_category = original_categorize(original_fields)
        print(f"✅ Original OCR completed in {original_time:.2f}s")
    except Exception as e:
        print(f"❌ Original OCR failed: {e}")
        original_text = ""
        original_fields = {}
        original_category = "Unknown"
        original_time = 0
    
    print("\n" + "─" * 40)
    
    # Test enhanced OCR
    print("🚀 Running Enhanced OCR Pipeline...")
    start_time = time.time()
    try:
        enhanced_text = run_enhanced_ocr(image_path)
        enhanced_time = time.time() - start_time
        enhanced_fields = enhanced_ner(enhanced_text)
        enhanced_category = enhanced_categorize_expense(enhanced_fields)
        print(f"✅ Enhanced OCR completed in {enhanced_time:.2f}s")
    except Exception as e:
        print(f"❌ Enhanced OCR failed: {e}")
        enhanced_text = ""
        enhanced_fields = {}
        enhanced_category = "Unknown"
        enhanced_time = 0
    
    # Display results comparison
    print("\n" + "=" * 60)
    print("📊 RESULTS COMPARISON")
    print("=" * 60)
    
    print(f"\n⏱️  Processing Time:")
    print(f"   Original: {original_time:.2f}s")
    print(f"   Enhanced: {enhanced_time:.2f}s")
    if enhanced_time > 0 and original_time > 0:
        speedup = original_time / enhanced_time
        print(f"   Speed ratio: {speedup:.2f}x {'(Enhanced faster)' if speedup > 1 else '(Original faster)'}")
    
    print(f"\n📝 OCR Text Length:")
    print(f"   Original: {len(original_text)} characters")
    print(f"   Enhanced: {len(enhanced_text)} characters")
    
    print(f"\n🏪 Merchant Detection:")
    print(f"   Original: {original_fields.get('merchant', 'Unknown')}")
    print(f"   Enhanced: {enhanced_fields.get('merchant', 'Unknown')}")
    
    print(f"\n📅 Date Detection:")
    print(f"   Original: {original_fields.get('date', 'Unknown')}")
    print(f"   Enhanced: {enhanced_fields.get('date', 'Unknown')}")
    
    print(f"\n💰 Total Amount:")
    print(f"   Original: {original_fields.get('total', 'Unknown')}")
    print(f"   Enhanced: {enhanced_fields.get('total', 'Unknown')}")
    
    print(f"\n🏷️  Category:")
    print(f"   Original: {original_category}")
    print(f"   Enhanced: {enhanced_category}")
    
    # Enhanced features
    if 'tax' in enhanced_fields:
        print(f"\n💸 Tax Amount (Enhanced only): {enhanced_fields.get('tax', 'Not detected')}")
    
    if 'items' in enhanced_fields and enhanced_fields['items']:
        print(f"\n🛒 Items Detected (Enhanced only): {len(enhanced_fields['items'])} items")
        for i, item in enumerate(enhanced_fields['items'][:3], 1):  # Show first 3 items
            print(f"   {i}. {item['name']}: ${item['price']:.2f}")
        if len(enhanced_fields['items']) > 3:
            print(f"   ... and {len(enhanced_fields['items']) - 3} more items")
    
    print(f"\n📄 Raw OCR Text Comparison:")
    print("─" * 30 + " ORIGINAL " + "─" * 30)
    print(original_text[:200] + ("..." if len(original_text) > 200 else ""))
    print("─" * 30 + " ENHANCED " + "─" * 30)
    print(enhanced_text[:200] + ("..." if len(enhanced_text) > 200 else ""))
    
    return {
        'original': {
            'text': original_text,
            'fields': original_fields,
            'category': original_category,
            'time': original_time
        },
        'enhanced': {
            'text': enhanced_text,
            'fields': enhanced_fields,
            'category': enhanced_category,
            'time': enhanced_time
        }
    }

def main():
    """Main test function"""
    print("🧪 OCR Pipeline Improvement Test")
    print("=" * 60)
    
    # Test with the existing processed image
    test_image = "backend/temp_89a95cd19ed345dfabd96e8f0aada973.jpg"
    
    # Also test with the original test.jpg if it exists
    test_images = []
    
    if os.path.exists(test_image):
        test_images.append(test_image)
    
    if not test_images:
        print("❌ No test images found!")
        print("Please ensure test.jpg or processed images exist in the project directory.")
        return
    
    results = []
    for image_path in test_images:
        print(f"\n{'='*20} Testing {image_path} {'='*20}")
        result = test_ocr_comparison(image_path)
        results.append((image_path, result))
        print("\n")
    
    # Summary
    print("🎯 SUMMARY")
    print("=" * 60)
    
    total_original_time = sum(r[1]['original']['time'] for r in results)
    total_enhanced_time = sum(r[1]['enhanced']['time'] for r in results)
    
    print(f"Total processing time:")
    print(f"  Original pipeline: {total_original_time:.2f}s")
    print(f"  Enhanced pipeline: {total_enhanced_time:.2f}s")
    
    if total_enhanced_time > 0 and total_original_time > 0:
        improvement = ((total_original_time - total_enhanced_time) / total_original_time) * 100
        print(f"  Time improvement: {improvement:+.1f}%")
    
    print(f"\nKey improvements in Enhanced Pipeline:")
    print("✨ Multiple preprocessing techniques (adaptive threshold, OTSU, morphological ops)")
    print("✨ Advanced deskewing with HoughLines")
    print("✨ Confidence-based OCR result selection")
    print("✨ Multiple PSM (Page Segmentation Mode) testing")
    print("✨ Enhanced field extraction (merchant, date, total, tax, items)")
    print("✨ Better categorization with more categories")
    print("✨ Robust error handling and fallback mechanisms")

if __name__ == "__main__":
    main()
