"""
Definisi Skema Pydantic (v2) untuk Smart Medical Notes API.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class NarrativeExtractRequest(BaseModel):
    """
    Skema input saat dokter mengirimkan satu paragraf narasi bebas.
    """
    narrative: str = Field(
        ...,
        description="Teks narasi diagnosis lengkap yang ditulis oleh dokter",
        examples=["Patient 3 years old has fever, red spots on the skin. Examination shows petechia on skin, strong pulse 120. Diagnosis df. Plan intravenous fluid ringer lactate."]
    )


class SoapModel(BaseModel):
    """
    Model representasi data 4 blok SOAP standar medis.
    """
    S: str = Field(default="", description="Subjective: Keluhan pasien dan riwayat penyakit")
    O: str = Field(default="", description="Objective: Hasil pemeriksaan fisik, tanda vital, dan laboratorium")
    A: str = Field(default="", description="Assessment: Diagnosis klinis dan diagnosis banding")
    P: str = Field(default="", description="Plan: Terapi, obat, tindakan medis, edukasi pasien")

    class Config:
        json_schema_extra = {
            "example": {
                "S": "patient 3 years old has fever, red spots on the skin",
                "O": "petechia on skin, strong pulse 120",
                "A": "df",
                "P": "intravenous fluid ringer lactate"
            }
        }


class SoapRequest(SoapModel):
    """
    Skema permintaan untuk evaluasi kelayakan catatan SOAP.
    """
    pass


class SoapResponse(BaseModel):
    """
    Skema balasan hasil ekstraksi SOAP.
    """
    success: bool = True
    data: SoapModel
    message: str = "Ekstraksi narasi ke struktur SOAP berhasil"


class SuggestionItem(BaseModel):
    """
    Skema satu butir saran perbaikan dari perspektif coder asuransi.
    """
    id: str = Field(..., description="Pengidentifikasi unik saran")
    category: str = Field(..., description="Kategori rekomendasi (e.g. Kelengkapan Tanda Vital, Singkatan Medis Ambigu)")
    target_field: str = Field(..., description="Kolom target pada SOAP: 'S', 'O', 'A', atau 'P'")
    title: str = Field(..., description="Judul ringkas saran")
    description: str = Field(..., description="Penjelasan rasional medis / klaim asuransi")
    action_type: str = Field(..., description="Tipe tindakan: 'replace' atau 'append'")
    search_target: Optional[str] = Field(default=None, description="Kata/frasa yang akan diganti jika action_type adalah replace")
    replacement_payload: str = Field(..., description="Teks hasil perbaikan yang akan disisipkan atau menggantikan")
    badge_text: Optional[str] = Field(default="Kriteria Coder", description="Label ringkas penanda urgensi klaim")


class SuggestionResponse(BaseModel):
    """
    Skema balasan lengkap evaluasi kelayakan rekam medis.
    """
    success: bool = True
    insurance_readiness_score: int = Field(..., description="Indeks kepatuhan klaim asuransi (0 - 100%)")
    total_suggestions: int = Field(..., description="Jumlah rekomendasi perbaikan aktif")
    suggestions: List[SuggestionItem] = Field(default_factory=list, description="Daftar rekomendasi perbaikan")
