"""
Router API untuk Pengelolaan Ekstraksi dan Validasi Rekam Medis (SOAP).
"""

from fastapi import APIRouter, status
from app.schemas.soap import (
    NarrativeExtractRequest,
    SoapModel,
    SoapRequest,
    SoapResponse,
    SuggestionResponse
)
from app.services.extractor_service import SoapExtractorService
from app.services.validator_service import SoapValidatorService

router = APIRouter(prefix="", tags=["Smart Medical Notes"])


@router.post(
    "/api/v1/soap/extract",
    response_model=SoapResponse,
    status_code=status.HTTP_200_OK,
    summary="Ekstraksi Narasi Bebas Dokter ke Struktur SOAP",
    description="Menerima satu paragraf narasi bebas klinis dari dokter dan menguraikannya menjadi 4 blok terpisah (S, O, A, P)."
)
@router.post(
    "/api/parse-soap",
    response_model=SoapModel,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
    summary="Alias Endpoint untuk Kompatibilitas Frontend Web"
)
async def extract_soap_from_narrative(request: NarrativeExtractRequest):
    extracted_soap = SoapExtractorService.extract_from_narrative(request.narrative)
    return extracted_soap


@router.post(
    "/api/v1/soap/validate",
    response_model=SuggestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Validasi Catatan SOAP dari Perspektif Coder Asuransi",
    description="Menganalisis isi SOAP untuk menemukan singkatan ambigu, ketidaklengkapan tanda vital, dan menghitung indeks kesiapan klaim asuransi."
)
@router.post(
    "/api/suggest",
    response_model=SuggestionResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
    summary="Alias Endpoint untuk Kompatibilitas Frontend Web"
)
async def validate_soap_notes(soap: SoapRequest):
    result = SoapValidatorService.validate_soap(soap)
    return result
