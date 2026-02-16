from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime

class ReceiptBase(BaseModel):
    merchant: str = "Unknown"
    date: str = "Unknown"
    total: float = 0.0

class ReceiptCreate(BaseModel):
    ocr_text: str
    fields: ReceiptBase
    filename: str
    timestamp: float

class ReceiptResponse(BaseModel):
    id: str = Field(..., alias="_id")
    ocr_text: str
    fields: Dict[str, Any]
    filename: str
    timestamp: float

    class Config:
        populate_by_name = True
