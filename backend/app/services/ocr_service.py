import pytesseract
from PIL import Image
import cv2
import numpy as np
import spacy
import re
import os
import logging

logger = logging.getLogger(__name__)

# Load SpaCy model once
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    logger.error(f"Failed to load SpaCy model: {e}")
    # Fallback to a dummy if needed
    nlp = None

def preprocess_image(image_path: str):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")
        
    # Scale up if too small
    height, width = img.shape[:2]
    if width < 1000:
        scaling_factor = 2000 / width
        img = cv2.resize(img, None, fx=scaling_factor, fy=scaling_factor, interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Bilateral filter to remove noise while keeping edges sharp
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)
    
    # Adaptive thresholding
    thresh = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 31, 10)
    
    # Auto-rotate/deskew
    coords = np.column_stack(np.where(thresh > 0))
    if coords.shape[0] > 0:
        rect = cv2.minAreaRect(coords)
        angle = rect[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        (h, w) = thresh.shape
        M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
        thresh = cv2.warpAffine(thresh, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    
    return thresh

def run_ocr(image_path: str) -> str:
    processed_img = preprocess_image(image_path)
    temp_path = image_path + "_proc.png"
    cv2.imwrite(temp_path, processed_img)
    
    try:
        # Use --psm 4 (assume a single column of text of variable sizes) or 6 (uniform block of text)
        text = pytesseract.image_to_string(Image.open(temp_path), config='--psm 6')
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
    return text

def run_ner(ocr_text: str) -> dict:
    merchant = "Unknown"
    date = "Unknown"
    total = 0.0
    
    if nlp:
        doc = nlp(ocr_text)
        # Better merchant extraction: look for ORG at the beginning or top lines
        orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
        if orgs:
            merchant = orgs[0]
            
    lines = [l.strip() for l in ocr_text.splitlines() if l.strip()]
    if (merchant == "Unknown" or not merchant) and lines:
        merchant = lines[0]
        
    date_patterns = [
        r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b",
        r"\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b",
        r"\b([A-Za-z]{3,9} \d{1,2},? \d{4})\b",
    ]
    
    for pat in date_patterns:
        m = re.search(pat, ocr_text)
        if m:
            date = m.group(1)
            break
            
    total_candidates = []
    # Keywords that usually indicate the final amount
    total_keywords = ["total", "amount", "net", "balance", "total due", "grand total"]
    
    for line in lines:
        line_lower = line.lower()
        # Look for numbers with decimal points (most currencies)
        nums = re.findall(r"(\d+[\.,]\d{2})(?!\d)", line)
        for num_str in nums:
            try:
                val = float(num_str.replace(",", ""))
                total_candidates.append(val)
                # If a keyword is present in the same line, prioritize this value
                if any(kw in line_lower for kw in total_keywords):
                    total = val
            except Exception:
                pass
                
    if total == 0.0 and total_candidates:
        # Fallback: largest number is often the total
        total = max(total_candidates)
        
    return {
        "merchant": merchant or "Unknown",
        "date": date or "Unknown",
        "total": float(total)
    }
