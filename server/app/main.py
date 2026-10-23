"""
Smart Medical Notes Centralized API
Aplikasi FastAPI Utama untuk Layanan Rekomendasi Medis Terpusat (KS RPLD).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import soap_router

# Inisialisasi Aplikasi FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=(
        "Layanan API Terpusat (Centralized Medical API) untuk ekstraksi narasi rekam medis "
        "ke format SOAP terstruktur dan evaluasi kualitas pengisian dari sudut pandang koder "
        "asuransi kesehatan."
    ),
    docs_url="/docs",
    redoc_url="/redoc"
)

# Konfigurasi Middleware CORS agar dapat diakses dari Web Browser lokal mana pun
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrasi Router
app.include_router(soap_router)


@app.get("/", tags=["Sistem"])
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "version": settings.PROJECT_VERSION,
        "docs": "/docs"
    }


@app.get("/health", tags=["Sistem"])
async def health_check():
    return {"status": "healthy"}
