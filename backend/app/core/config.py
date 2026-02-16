from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Receipt OCR API"
    API_V1_STR: str = ""
    MONGO_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "receiptocr"
    
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
