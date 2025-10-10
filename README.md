# Deployment/Setup Instructions

## Backend (FastAPI)
1. Create a virtual environment:
   python -m venv venv
   venv\Scripts\activate
2. Install dependencies:
   pip install fastapi uvicorn python-multipart
3. (Optional) For OCR/NER:
   pip install pytesseract spacy transformers
4. Initialize SQLite DB:
   sqlite3 backend.db < schema.sql
5. Run server:
   uvicorn main:app --reload

## Mobile (React Native)
1. Install Node.js and Expo CLI:
   npm install -g expo-cli
2. In `mobile/` folder:
   npm install
   expo start

## Notes
- Update backend URLs in mobile app as needed.
- For production, use cloud DB and secure secrets.
- Integrate real ML models in `ml_pipeline.py`.
