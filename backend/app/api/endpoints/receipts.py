from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.ocr_service import run_ocr, run_ner
from app.models.receipt import ReceiptCreate
from app.core.config import settings
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import shutil
import time
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Basic DB setup for now (will move to a dependency later)
client = AsyncIOMotorClient(settings.MONGO_URL)
db = client[settings.DATABASE_NAME]

@router.post("/receipts")
async def upload_receipt(image: UploadFile = File(...)):
    start_time = time.time()
    logger.info(f"Received upload request for file: {image.filename}")
    
    temp_path = f"temp_{image.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        ocr_text = run_ocr(temp_path)
        fields = run_ner(ocr_text)
        
        doc = {
            "ocr_text": ocr_text,
            "fields": fields,
            "filename": image.filename,
            "timestamp": time.time()
        }
        
        result = await db.receipts.insert_one(doc)
        
        return {"receipt_id": str(result.inserted_id), "ocr_text": ocr_text, "fields": fields}
    
    except Exception as e:
        logger.error(f"Error processing receipt: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/receipts")
async def get_receipts():
    receipts = []
    async for r in db.receipts.find():
        r["_id"] = str(r["_id"])
        receipts.append(r)
    return receipts

@router.delete("/receipts/{receipt_id}")
async def delete_receipt(receipt_id: str):
    try:
        result = await db.receipts.delete_one({"_id": ObjectId(receipt_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Receipt not found")
        return {"status": "deleted"}
    except Exception as e:
        if not isinstance(e, HTTPException):
            raise HTTPException(status_code=500, detail="Internal Server Error")
        raise e

@router.put("/receipts/{receipt_id}")
async def update_receipt(receipt_id: str, data: dict):
    try:
        # Update specific fields
        update_data = {}
        if "fields" in data:
            update_data["fields"] = data["fields"]
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data to update")
            
        result = await db.receipts.update_one(
            {"_id": ObjectId(receipt_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Receipt not found")
            
        return {"status": "updated"}
    except Exception as e:
        logger.error(f"Error updating receipt: {e}", exc_info=True)
        if not isinstance(e, HTTPException):
            raise HTTPException(status_code=500, detail="Internal Server Error")
        raise e
