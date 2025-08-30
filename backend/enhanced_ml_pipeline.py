import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import spacy
import cv2
import numpy as np
import re
from difflib import get_close_matches
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

nlp = spacy.load("en_core_web_sm")

def enhance_image_preprocessing(image_path):
    """Enhanced image preprocessing with multiple techniques for better OCR accuracy"""
    img = cv2.imread(image_path)
    if img is None:
        logger.error(f"Could not load image: {image_path}")
        return None
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply multiple preprocessing techniques
    processed_images = []
    
    # Method 1: Adaptive threshold with different parameters
    thresh1 = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )
    processed_images.append(("adaptive_11_2", thresh1))
    
    thresh2 = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 10
    )
    processed_images.append(("adaptive_31_10", thresh2))
    
    # Method 2: OTSU thresholding
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    processed_images.append(("otsu", otsu))
    
    # Method 3: Morphological operations
    kernel = np.ones((2, 2), np.uint8)
    morph = cv2.morphologyEx(thresh2, cv2.MORPH_CLOSE, kernel)
    processed_images.append(("morphological", morph))
    
    # Method 4: Enhanced contrast and sharpening
    pil_img = Image.fromarray(gray)
    enhancer = ImageEnhance.Contrast(pil_img)
    enhanced = enhancer.enhance(2.0)  # Increase contrast
    enhanced = enhanced.filter(ImageFilter.SHARPEN)
    
    enhanced_array = np.array(enhanced)
    if len(enhanced_array.shape) == 3:  # RGB
        enhanced_cv = cv2.cvtColor(enhanced_array, cv2.COLOR_RGB2GRAY)
    else:  # Already grayscale
        enhanced_cv = enhanced_array
    
    _, enhanced_thresh = cv2.threshold(
        enhanced_cv, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )
    processed_images.append(("enhanced_contrast", enhanced_thresh))
    
    return processed_images

def advanced_deskew(image):
    """Advanced deskewing with better angle detection"""
    coords = np.column_stack(np.where(image > 0))
    if coords.shape[0] == 0:
        return image
    
    # Use HoughLines for better angle detection
    edges = cv2.Canny(image, 50, 150, apertureSize=3)
    lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
    
    angles = []
    if lines is not None:
        for rho, theta in lines[:10]:  # Use top 10 lines
            angle = np.degrees(theta) - 90
            angles.append(angle)
    
    if angles:
        # Use median angle for more robust deskewing
        angle = np.median(angles)
        if abs(angle) > 0.5:  # Only deskew if angle is significant
            (h, w) = image.shape
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            image = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    
    return image

def run_enhanced_ocr(image_path):
    """Enhanced OCR with multiple preprocessing methods and confidence scoring"""
    processed_images = enhance_image_preprocessing(image_path)
    if not processed_images:
        return ""
    
    ocr_results = []
    
    for method_name, processed_img in processed_images:
        try:
            # Apply deskewing
            deskewed = advanced_deskew(processed_img)
            
            # Denoise
            denoised = cv2.fastNlMeansDenoising(deskewed, None, 30, 7, 21)
            
            # Save temporary processed image
            temp_path = f"{image_path}_{method_name}_proc.png"
            cv2.imwrite(temp_path, denoised)
            
            # Try different PSM modes
            psm_modes = [6, 8, 11, 13]  # Different page segmentation modes
            
            for psm in psm_modes:
                try:
                    # Get OCR with confidence data
                    data = pytesseract.image_to_data(Image.open(temp_path), 
                                                   config=f'--psm {psm}', 
                                                   output_type=pytesseract.Output.DICT)
                    
                    # Filter out low confidence text
                    confidences = [int(conf) for conf in data['conf'] if int(conf) > 30]
                    texts = [data['text'][i] for i, conf in enumerate(data['conf']) if int(conf) > 30 and data['text'][i].strip()]
                    
                    if confidences and texts:
                        avg_confidence = sum(confidences) / len(confidences)
                        full_text = ' '.join(texts)
                        
                        ocr_results.append({
                            'method': f"{method_name}_psm{psm}",
                            'text': full_text,
                            'confidence': avg_confidence,
                            'word_count': len(texts)
                        })
                        
                        logger.info(f"OCR {method_name}_psm{psm}: confidence={avg_confidence:.1f}, words={len(texts)}")
                
                except Exception as e:
                    logger.warning(f"OCR failed for {method_name}_psm{psm}: {e}")
                    continue
            
            # Clean up temp file
            try:
                import os
                os.remove(temp_path)
            except:
                pass
                
        except Exception as e:
            logger.error(f"Processing failed for {method_name}: {e}")
            continue
    
    # Select best OCR result based on confidence and word count
    if ocr_results:
        # Sort by confidence and word count
        best_result = max(ocr_results, key=lambda x: (x['confidence'], x['word_count']))
        logger.info(f"Selected best OCR: {best_result['method']} (confidence: {best_result['confidence']:.1f})")
        return best_result['text']
    
    # Fallback to original method
    logger.warning("All enhanced OCR methods failed, falling back to original")
    return run_ocr_fallback(image_path)

def run_ocr_fallback(image_path):
    """Fallback OCR method (original implementation)"""
    img = cv2.imread(image_path)
    if img is None:
        return ""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 31, 10)
    denoised = cv2.fastNlMeansDenoising(thresh, None, 30, 7, 21)
    temp_path = image_path + "_fallback_proc.png"
    cv2.imwrite(temp_path, denoised)
    text = pytesseract.image_to_string(Image.open(temp_path), config='--psm 6')
    return text

def enhanced_ner(ocr_text):
    """Enhanced Named Entity Recognition with better pattern matching"""
    doc = nlp(ocr_text)
    lines = [l.strip() for l in ocr_text.splitlines() if l.strip()]
    
    # Enhanced merchant detection
    merchant = extract_merchant(doc, lines, ocr_text)
    
    # Enhanced date extraction
    date = extract_date(doc, ocr_text)
    
    # Enhanced total extraction
    total = extract_total(lines, ocr_text)
    
    # Extract additional fields
    tax = extract_tax(lines, ocr_text)
    items = extract_items(lines)
    
    return {
        "merchant": merchant,
        "date": date,
        "total": total,
        "tax": tax,
        "items": items,
        "raw_text": ocr_text
    }

def extract_merchant(doc, lines, ocr_text):
    """Enhanced merchant extraction with multiple strategies"""
    # Strategy 1: NER organizations
    orgs = [ent.text.strip() for ent in doc.ents if ent.label_ == "ORG"]
    
    # Strategy 2: Known merchant patterns
    known_merchants = [
        "Walmart", "Target", "Starbucks", "Uber", "Amazon", "Costco", "Tesco", 
        "Subway", "McDonald's", "KFC", "Pizza Hut", "Domino's", "CVS", "Walgreens",
        "Home Depot", "Lowe's", "Best Buy", "GameStop", "Barnes & Noble"
    ]
    
    # Strategy 3: First few lines (merchants usually appear at top)
    top_lines = lines[:3] if lines else []
    
    # Strategy 4: Look for common merchant indicators
    merchant_indicators = ["store", "shop", "market", "restaurant", "cafe", "inc", "ltd", "corp", "company"]
    
    # Try different strategies
    candidates = []
    
    # Add NER organizations
    candidates.extend(orgs)
    
    # Add fuzzy matches with known merchants
    for line in top_lines:
        for merchant in known_merchants:
            if get_close_matches(line.lower(), [merchant.lower()], n=1, cutoff=0.6):
                candidates.append(merchant)
    
    # Look for lines containing merchant indicators
    for line in top_lines:
        line_lower = line.lower()
        if any(indicator in line_lower for indicator in merchant_indicators):
            candidates.append(line)
    
    # Select best candidate
    if candidates:
        # Prefer known merchants
        for candidate in candidates:
            if candidate in known_merchants:
                return candidate
        # Otherwise return first candidate
        return candidates[0]
    
    # Fallback to first line
    return lines[0] if lines else "Unknown"

def extract_date(doc, ocr_text):
    """Enhanced date extraction with multiple patterns"""
    # Enhanced date patterns
    date_patterns = [
        r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b",  # 12/31/2023 or 12-31-2023
        r"\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b",    # 2023-12-31
        r"\b([A-Za-z]{3,9} \d{1,2},? \d{4})\b",  # December 31, 2023
        r"\b(\d{1,2} [A-Za-z]{3,9} \d{4})\b",    # 31 December 2023
        r"\b(\d{1,2}/\d{1,2}/\d{2})\b",          # 12/31/23
        r"\b(\d{2}-\d{2}-\d{4})\b",              # 31-12-2023
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, ocr_text)
        if match:
            try:
                # Try to parse and validate the date
                date_str = match.group(1)
                # Basic validation - you could add more sophisticated parsing here
                return date_str
            except:
                continue
    
    # Try NER for dates
    date_entities = [ent.text for ent in doc.ents if ent.label_ == "DATE"]
    if date_entities:
        return date_entities[0]
    
    return "Unknown"

def extract_total(lines, ocr_text):
    """Enhanced total extraction with better pattern matching"""
    total_candidates = []
    
    # Look for explicit total lines
    total_keywords = ["total", "amount", "sum", "balance", "due", "pay"]
    
    for line in lines:
        line_lower = line.lower()
        
        # Check if line contains total keywords
        if any(keyword in line_lower for keyword in total_keywords):
            # Extract numbers from this line
            numbers = re.findall(r"\$?(\d+[.,]\d{2}|\d+\.\d{2}|\d+,\d{3}\.\d{2})", line)
            for num_str in numbers:
                try:
                    # Clean and convert to float
                    clean_num = num_str.replace(",", "")
                    total_candidates.append((float(clean_num), "total_line", line))
                except:
                    continue
    
    # If no explicit total found, look for largest monetary amounts
    if not total_candidates:
        for line in lines:
            # Look for currency patterns
            currency_patterns = [
                r"\$(\d+[.,]\d{2})",
                r"(\d+\.\d{2})",
                r"(\d+,\d{3}\.\d{2})",
            ]
            
            for pattern in currency_patterns:
                matches = re.findall(pattern, line)
                for match in matches:
                    try:
                        clean_num = match.replace(",", "")
                        amount = float(clean_num)
                        # Only consider reasonable amounts (not too small, not too large)
                        if 0.01 <= amount <= 10000:
                            total_candidates.append((amount, "currency_pattern", line))
                    except:
                        continue
    
    if total_candidates:
        # Sort by amount and prefer explicit total lines
        total_candidates.sort(key=lambda x: (x[1] == "total_line", x[0]), reverse=True)
        return total_candidates[0][0]
    
    return "Unknown"

def extract_tax(lines, ocr_text):
    """Extract tax amount from receipt"""
    tax_keywords = ["tax", "vat", "gst", "hst"]
    
    for line in lines:
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in tax_keywords):
            # Extract numbers from tax line
            numbers = re.findall(r"\$?(\d+[.,]\d{2}|\d+\.\d{2})", line)
            if numbers:
                try:
                    return float(numbers[-1].replace(",", ""))
                except:
                    continue
    
    return None

def extract_items(lines):
    """Extract individual items from receipt"""
    items = []
    
    # Look for lines that might be items (contain both text and price)
    for line in lines:
        # Skip lines that are likely headers or totals
        line_lower = line.lower()
        if any(skip_word in line_lower for skip_word in ["total", "subtotal", "tax", "change", "cash", "card"]):
            continue
        
        # Look for lines with item name and price
        price_match = re.search(r"\$?(\d+[.,]\d{2}|\d+\.\d{2})$", line.strip())
        if price_match:
            try:
                price = float(price_match.group(1).replace(",", ""))
                # Extract item name (everything before the price)
                item_name = line[:price_match.start()].strip()
                if item_name and len(item_name) > 2:  # Reasonable item name length
                    items.append({
                        "name": item_name,
                        "price": price
                    })
            except:
                continue
    
    return items

def enhanced_categorize_expense(fields):
    """Enhanced expense categorization with more categories and better matching"""
    merchant = fields.get("merchant", "").lower()
    items = fields.get("items", [])
    
    # Food & Dining
    food_keywords = ["restaurant", "cafe", "coffee", "pizza", "burger", "food", "dining", 
                    "starbucks", "mcdonald", "subway", "kfc", "taco", "deli"]
    if any(keyword in merchant for keyword in food_keywords):
        return "Food & Dining"
    
    # Grocery
    grocery_keywords = ["grocery", "market", "walmart", "target", "costco", "supermarket", 
                       "store", "shop"]
    if any(keyword in merchant for keyword in grocery_keywords):
        return "Groceries"
    
    # Transportation
    transport_keywords = ["uber", "lyft", "taxi", "gas", "fuel", "parking", "metro", "bus"]
    if any(keyword in merchant for keyword in transport_keywords):
        return "Transportation"
    
    # Shopping
    shopping_keywords = ["amazon", "ebay", "mall", "outlet", "retail", "clothing", "fashion"]
    if any(keyword in merchant for keyword in shopping_keywords):
        return "Shopping"
    
    # Healthcare
    health_keywords = ["pharmacy", "hospital", "clinic", "medical", "doctor", "cvs", "walgreens"]
    if any(keyword in merchant for keyword in health_keywords):
        return "Healthcare"
    
    # Entertainment
    entertainment_keywords = ["movie", "theater", "cinema", "game", "entertainment", "netflix"]
    if any(keyword in merchant for keyword in entertainment_keywords):
        return "Entertainment"
    
    # Utilities
    utility_keywords = ["electric", "gas", "water", "internet", "phone", "utility"]
    if any(keyword in merchant for keyword in utility_keywords):
        return "Utilities"
    
    return "Other"

# Backward compatibility functions
def run_ocr(image_path):
    """Backward compatible OCR function"""
    return run_enhanced_ocr(image_path)

def run_ner(ocr_text):
    """Backward compatible NER function"""
    return enhanced_ner(ocr_text)

def categorize_expense(fields):
    """Backward compatible categorization function"""
    return enhanced_categorize_expense(fields)
