"""
Router API untuk Pengelolaan Ekstraksi dan Validasi Rekam Medis (SOAP).
Menyediakan endpoint RESTful berstandar waktu nyata (KS RPLD & Invensi Paten).
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
from app.services.rules_engine import rules_engine

router = APIRouter(prefix="", tags=["Smart Medical Notes"])


@router.post(
    "/api/v1/extract-soap",
    response_model=SoapResponse,
    status_code=status.HTTP_200_OK,
    summary="Ekstraksi Narasi Bebas Dokter ke Struktur 4 Blok SOAP",
    description="Menerima string narasi klinis bebas dokter dan menguraikannya menjadi blok Subjective, Objective, Assessment, Plan."
)
@router.post(
    "/api/v1/soap/extract",
    response_model=SoapResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
@router.post(
    "/api/parse-soap",
    response_model=SoapModel,
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
async def extract_soap_from_narrative(request: NarrativeExtractRequest):
    narrative_text = request.get_narrative()
    extracted_soap = SoapExtractorService.extract_from_narrative(narrative_text)
    return SoapResponse(
        success=True,
        data=extracted_soap,
        subjective=extracted_soap.S,
        objective=extracted_soap.O,
        assessment=extracted_soap.A,
        plan=extracted_soap.P,
        message="Ekstraksi narasi ke struktur SOAP berhasil"
    )


@router.post(
    "/api/v1/validate-coder",
    response_model=SuggestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Validasi Catatan SOAP dari Perspektif Coder Asuransi",
    description="Mengevaluasi blok SOAP untuk mendeteksi singkatan ambigu, ketidaklengkapan tanda vital, serta menghitung skor kesiapan klaim asuransi."
)
@router.post(
    "/api/v1/soap/validate",
    response_model=SuggestionResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
@router.post(
    "/api/suggest",
    response_model=SuggestionResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
async def validate_soap_notes(soap: SoapRequest):
    result = rules_engine.validate(soap)
    return result
