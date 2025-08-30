
import pytesseract
from PIL import Image
import spacy
import cv2
import numpy as np
import re
from difflib import get_close_matches

nlp = spacy.load("en_core_web_sm")

def run_ocr(image_path):
    # Preprocessing: grayscale, threshold, denoise, deskew
    img = cv2.imread(image_path)
    if img is None:
        return ""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Adaptive threshold
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 31, 10)
    # Denoise
    denoised = cv2.fastNlMeansDenoising(thresh, None, 30, 7, 21)
    # Deskew
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
    # Save temp processed image
    temp_path = image_path + "_proc.png"
    cv2.imwrite(temp_path, denoised)
    # OCR
    text = pytesseract.image_to_string(Image.open(temp_path), config='--psm 6')
    return text

def run_ner(ocr_text):
    doc = nlp(ocr_text)
    # Merchant: try NER, fallback to first line or fuzzy match
    merchant = next((ent.text for ent in doc.ents if ent.label_ == "ORG"), None)
    lines = [l.strip() for l in ocr_text.splitlines() if l.strip()]
    if not merchant and lines:
        merchant = lines[0]
    # Optionally, fuzzy match to known merchants
    known_merchants = ["Walmart", "Target", "Starbucks", "Uber", "Amazon", "Costco", "Tesco", "Subway", "McDonald's"]
    if merchant:
        match = get_close_matches(merchant, known_merchants, n=1, cutoff=0.7)
        if match:
            merchant = match[0]
    merchant = merchant or "Unknown"

    # Date: regex for common date patterns
    date = None
    date_patterns = [
        r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b",  # 12/31/2023 or 12-31-2023
        r"\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b",    # 2023-12-31
        r"\b([A-Za-z]{3,9} \d{1,2},? \d{4})\b",  # December 31, 2023
    ]
    for pat in date_patterns:
        m = re.search(pat, ocr_text)
        if m:
            date = m.group(1)
            break
    if not date:
        date = next((ent.text for ent in doc.ents if ent.label_ == "DATE"), "Unknown")

    # Total: look for lines with 'total' and a number, or the largest number
    total = None
    total_candidates = []
    for line in lines:
        if "total" in line.lower():
            nums = re.findall(r"\d+[\.,]?\d*", line)
            if nums:
                try:
                    total = float(nums[-1].replace(",", "").replace(".", "."))
                except Exception:
                    pass
        # Collect all numbers for fallback
        nums = re.findall(r"\d+[\.,]?\d*", line)
        for n in nums:
            try:
                total_candidates.append(float(n.replace(",", "").replace(".", ".")))
            except Exception:
                pass
    if total is None and total_candidates:
        total = max(total_candidates)
    if total is None:
        total = "Unknown"

    return {"merchant": merchant, "date": date, "total": total}

def categorize_expense(fields):
    merchant = fields.get("merchant", "").lower()
    if "food" in merchant or "cafe" in merchant:
        return "Food"
    if "uber" in merchant or "taxi" in merchant:
        return "Travel"
    return "Other"