from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from ml_pipeline import run_ocr, run_ner
import os
import shutil

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client.receiptocr

@app.post("/receipts")
async def upload_receipt(image: UploadFile = File(...)):
    temp_path = f"temp_{image.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    ocr_text = run_ocr(temp_path)
    fields = run_ner(ocr_text)
    doc = {
        "ocr_text": ocr_text,
        "fields": fields,
    }
    result = await db.receipts.insert_one(doc)
    os.remove(temp_path)
    return {"receipt_id": str(result.inserted_id), "ocr_text": ocr_text, "fields": fields}

@app.get("/receipts")
async def get_receipts():
    receipts = []
    async for r in db.receipts.find():
        r["_id"] = str(r["_id"])
        receipts.append(r)
    return receipts

@app.delete("/receipts/{receipt_id}")
async def delete_receipt(receipt_id: str):
    result = await db.receipts.delete_one({"_id": ObjectId(receipt_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return {"status": "deleted"}