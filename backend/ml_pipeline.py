import pytesseract
from PIL import Image
import cv2
import numpy as np
import spacy
import re
import os

nlp = spacy.load("en_core_web_sm")

def run_ocr(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 31, 10)
    denoised = cv2.fastNlMeansDenoising(thresh, None, 30, 7, 21)
    coords = np.column_stack(np.where(denoised > 0))
    angle = 0
    if coords.shape[0] > 0:
        rect = cv2.minAreaRect(coords)
        angle = rect[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        (h, w) = denoised.shape
        M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
        denoised = cv2.warpAffine(denoised, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    temp_path = image_path + "_proc.png"
    cv2.imwrite(temp_path, denoised)
    text = pytesseract.image_to_string(Image.open(temp_path), config='--psm 6')
    os.remove(temp_path)
    return text

def run_ner(ocr_text):
    doc = nlp(ocr_text)
    merchant = next((ent.text for ent in doc.ents if ent.label_ == "ORG"), None)
    lines = [l.strip() for l in ocr_text.splitlines() if l.strip()]
    if not merchant and lines:
        merchant = lines[0]
    
    date = None
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
    if not date:
        date = next((ent.text for ent in doc.ents if ent.label_ == "DATE"), "Unknown")
    
    total = None
    total_candidates = []
    
    # Priority keywords for total amount
    amount_keywords = ["total", "amount", "fees", "subtotal", "amt", "payable"]
    
    for line in lines:
        line_lower = line.lower()
        # Look for numbers in the line
        # This regex matches numbers like 11,000.00 or 1000.00 or 1000
        nums = re.findall(r"(\d+(?:[.,]\d+)+)", line)
        if not nums:
            nums = re.findall(r"(\d+)", line)
            
        for n in nums:
            try:
                # Clean up comma/period usage for float conversion
                clean_n = n.replace(",", "")
                # If there are multiple dots, it might be an OCR error (e.g. 11.000.00 instead of 11,000.00)
                if clean_n.count('.') > 1:
                    parts = clean_n.split('.')
                    clean_n = "".join(parts[:-1]) + "." + parts[-1]
                
                val = float(clean_n)
                
                # Check if this line has a keyword
                has_keyword = any(kw in line_lower for kw in amount_keywords)
                
                if has_keyword:
                    # If line has keyword, it's a very strong candidate
                    total_candidates.append((val, True))
                else:
                    # Otherwise, it's just a candidate, but filter out likely years/dates
                    if 1900 < val < 2100: # Likely a year
                        continue
                    if val > 0.1: # Avoid very small numbers
                        total_candidates.append((val, False))
            except Exception:
                pass
                
    if total_candidates:
        # Sort: priority to keyword lines, then by value (usually total is highest)
        total_candidates.sort(key=lambda x: (x[1], x[0]), reverse=True)
        total = total_candidates[0][0]
        
    if total is None:
        total = "Unknown"
        
    return {"merchant": merchant or "Unknown", "date": date, "total": total}
