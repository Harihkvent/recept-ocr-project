from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from ml_pipeline import run_ocr, run_ner
import os
import shutil
import logging
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("receipt-ocr-backend")

app = FastAPI()

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error for {request.method} {request.url}")
    logger.error(f"Error details: {exc.errors()}")
    logger.error(f"Request body: {await request.body()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(await request.body())},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.receiptocr

@app.on_event("startup")
async def startup_db_client():
    logger.info("Starting up the FastAPI application...")
    logger.info(f"Connecting to MongoDB at {MONGO_URL}")

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down the FastAPI application...")
    client.close()

@app.post("/receipts")
async def upload_receipt(image: UploadFile = File(...)):
    start_time = time.time()
    logger.info(f"Received upload request for file: {image.filename}")
    
    temp_path = f"temp_{image.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        logger.info(f"Starting OCR processing for {image.filename}")
        ocr_text = run_ocr(temp_path)
        logger.info(f"OCR completed. Starting NER processing...")
        
        fields = run_ner(ocr_text)
        logger.info(f"NER completed. Extracted fields: {fields}")
        
        doc = {
            "ocr_text": ocr_text,
            "fields": fields,
            "filename": image.filename,
            "timestamp": time.time()
        }
        
        logger.info("Saving receipt to database...")
        result = await db.receipts.insert_one(doc)
        
        duration = time.time() - start_time
        logger.info(f"Receipt processed successfully in {duration:.2f}s. ID: {result.inserted_id}")
        
        return {"receipt_id": str(result.inserted_id), "ocr_text": ocr_text, "fields": fields}
    
    except Exception as e:
        logger.error(f"Error processing receipt {image.filename}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            logger.info(f"Cleaned up temporary file: {temp_path}")

@app.get("/receipts")
async def get_receipts():
    logger.info("Fetching all receipts from database")
    try:
        receipts = []
        async for r in db.receipts.find():
            r["_id"] = str(r["_id"])
            receipts.append(r)
        logger.info(f"Successfully retrieved {len(receipts)} receipts")
        return receipts
    except Exception as e:
        logger.error(f"Error fetching receipts: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.put("/receipts/{receipt_id}")
async def update_receipt(receipt_id: str, data: dict):
    logger.info(f"Update request received for receipt ID: {receipt_id}")
    try:
        result = await db.receipts.update_one(
            {"_id": ObjectId(receipt_id)},
            {"$set": {"fields": data.get("fields", {})}}
        )
        if result.matched_count == 0:
            logger.warning(f"Receipt ID {receipt_id} not found for update")
            raise HTTPException(status_code=404, detail="Receipt not found")
        
        logger.info(f"Successfully updated receipt ID: {receipt_id}")
        return {"status": "updated"}
    except Exception as e:
        if not isinstance(e, HTTPException):
            logger.error(f"Error updating receipt {receipt_id}: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal Server Error")
        raise e

@app.delete("/receipts/{receipt_id}")
async def delete_receipt(receipt_id: str):
    logger.info(f"Delete request received for receipt ID: {receipt_id}")
    try:
        result = await db.receipts.delete_one({"_id": ObjectId(receipt_id)})
        if result.deleted_count == 0:
            logger.warning(f"Receipt ID {receipt_id} not found for deletion")
            raise HTTPException(status_code=404, detail="Receipt not found")
        
        logger.info(f"Successfully deleted receipt ID: {receipt_id}")
        return {"status": "deleted"}
    except Exception as e:
        if not isinstance(e, HTTPException):
            logger.error(f"Error deleting receipt {receipt_id}: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal Server Error")
        raise e