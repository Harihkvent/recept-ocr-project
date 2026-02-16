import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.ocr_service import run_ner

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_run_ner_basic():
    ocr_text = "TOTAL $12.50\nSTARBUCKS\n01/01/2024"
    result = run_ner(ocr_text)
    assert result["merchant"] == "STARBUCKS"
    assert result["total"] == 12.50
    assert result["date"] == "01/01/2024"

def test_run_ner_fallback():
    ocr_text = "Some random text with 99.99"
    result = run_ner(ocr_text)
    assert result["total"] == 99.99
    assert result["merchant"] == "Some random text with 99.99" # First line fallback
