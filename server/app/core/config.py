"""
Konfigurasi Inti (Core Settings) untuk Smart Medical Notes Centralized API.
"""

from typing import List
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel as BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Medical Notes Centralized API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Konfigurasi CORS (Cross-Origin Resource Sharing)
    # Mengizinkan frontend lokal mengakses backend tanpa hambatan
    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:8000",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:5500",
        "*"
    ]

    class Config:
        case_sensitive = True


settings = Settings()
