from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
import shutil
import uuid
from enhanced_ml_pipeline import run_ocr, run_ner, categorize_expense
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
# --- MongoDB Setup ---
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client["receipt_ocr"]

# --- Models ---
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        # This tells Pydantic to treat this as a string in OpenAPI/JSON schema
        return {"type": "string"}

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Category(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    name: str
    description: Optional[str]

class ReceiptResponse(BaseModel):
    receipt_id: str
    ocr_text: str
    fields: dict
    category: str
    expense_id: str

# --- Auth Endpoints ---
@app.post("/auth/register")
async def register(user: UserRegister):
    # Check if user exists
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = user.dict()
    user_doc["password_hash"] = user_doc.pop("password")  # TODO: hash password
    result = await db.users.insert_one(user_doc)
    return {"success": True, "data": {"user_id": str(result.inserted_id)}, "error": None}

@app.post("/auth/login")
async def login(user: UserLogin):
    # TODO: Implement real password check
    db_user = await db.users.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"success": True, "data": {"token": "fake-jwt-token"}, "error": None}

# --- Receipt Endpoints ---
@app.post("/receipts", response_model=ReceiptResponse)
async def upload_receipt(image: UploadFile = File(...)):
    # Save uploaded image to a temp file
    temp_filename = f"temp_{uuid.uuid4().hex}.jpg"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # Run OCR
    ocr_text = run_ocr(temp_filename)

    # Run NER
    fields = run_ner(ocr_text)

    # Categorize
    category = categorize_expense(fields)

    # Store in DB
    receipt_doc = {
        "user_id": None,  # TODO: extract from token
        "image_uri": temp_filename,  # In production, store in cloud
        "ocr_text": ocr_text,
        "merchant_name": fields.get("merchant"),
        "purchase_date": fields.get("date"),
        "currency": "USD",
    }
    receipt_result = await db.receipts.insert_one(receipt_doc)
    expense_doc = {
        "receipt_id": receipt_result.inserted_id,
        "category_id": None,  # TODO: real category
        "amount": fields.get("total", 0),
        "tax_amount": None,
    }
    expense_result = await db.expenses.insert_one(expense_doc)

    # Clean up temp file
    try:
        os.remove(temp_filename)
    except Exception:
        pass

    return ReceiptResponse(
        receipt_id=str(receipt_result.inserted_id),
        ocr_text=ocr_text,
        fields=fields,
        category=category,
        expense_id=str(expense_result.inserted_id)
    )

@app.get("/receipts/{receipt_id}")
async def get_receipt(receipt_id: str):
    doc = await db.receipts.find_one({"_id": ObjectId(receipt_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Receipt not found")
    doc["_id"] = str(doc["_id"])
    return {"success": True, "data": doc, "error": None}

@app.get("/receipts")
async def list_receipts():
    receipts = []
    async for doc in db.receipts.find():
        doc["_id"] = str(doc["_id"])
        receipts.append(doc)
    return {"success": True, "data": receipts, "error": None}

from fastapi import status

# --- Delete Receipt Endpoint ---
@app.delete("/receipts/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receipt(receipt_id: str):
    result = await db.receipts.delete_one({"_id": ObjectId(receipt_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Receipt not found")
    # Optionally, also delete related expenses
    await db.expenses.delete_many({"receipt_id": ObjectId(receipt_id)})
    return

# --- Categories ---
@app.get("/categories", response_model=List[Category])
async def get_categories():
    cats = []
    async for doc in db.categories.find():
        doc["_id"] = str(doc["_id"])
        cats.append(Category(**doc))
    return cats
