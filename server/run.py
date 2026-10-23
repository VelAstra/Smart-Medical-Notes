"""
Script Runner untuk Menjalankan Server FastAPI Smart Medical Notes.
Eksekusi dengan: python run.py
"""

import sys
import uvicorn

if __name__ == "__main__":
    print("Memulai Smart Medical Notes Centralized API Server...")
    print("Swagger UI Docs: http://localhost:8000/docs")
    print("Tekan Ctrl + C untuk menghentikan server.")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
