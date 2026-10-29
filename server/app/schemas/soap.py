"""
Definisi Skema Pydantic (v2) untuk Smart Medical Notes API.
Mendukung interoperabilitas format baku SOAP, narasi klinis, dan rekomendasi koder.
"""

from typing import List, Optional, Any
from pydantic import BaseModel, Field


class NarrativeExtractRequest(BaseModel):
    """
    Skema input saat dokter mengirimkan narasi bebas.
    """
    narrative: Optional[str] = Field(
        default=None,
        description="Teks narasi diagnosis lengkap yang ditulis oleh dokter",
        examples=["Patient 3 years old has fever, red spots on the skin. Examination shows petechia on skin, strong pulse 120. Diagnosis df. Plan intravenous fluid ringer lactate."]
    )
    text: Optional[str] = Field(
        default=None,
        description="Alias input narasi dokter"
    )

    def get_narrative(self) -> str:
        return (self.narrative or self.text or "").strip()


class SoapModel(BaseModel):
    """
    Model representasi data 4 blok SOAP standar medis.
    Mendukung format singkatan (S, O, A, P) dan format nama lengkap (subjective, objective, assessment, plan).
    """
    S: str = Field(default="", description="Subjective: Keluhan pasien dan riwayat penyakit")
    O: str = Field(default="", description="Objective: Hasil pemeriksaan fisik, tanda vital, dan laboratorium")
    A: str = Field(default="", description="Assessment: Diagnosis klinis dan diagnosis banding")
    P: str = Field(default="", description="Plan: Terapi, obat, tindakan medis, edukasi pasien")

    subjective: Optional[str] = Field(default=None, description="Alias untuk S")
    objective: Optional[str] = Field(default=None, description="Alias untuk O")
    assessment: Optional[str] = Field(default=None, description="Alias untuk A")
    plan: Optional[str] = Field(default=None, description="Alias untuk P")

    def model_post_init(self, __context: Any) -> None:
        # Sinkronisasi dua arah antara S/O/A/P dan subjective/objective/assessment/plan
        if not self.S and self.subjective:
            self.S = self.subjective
        if not self.O and self.objective:
            self.O = self.objective
        if not self.A and self.assessment:
            self.A = self.assessment
        if not self.P and self.plan:
            self.P = self.plan

        if not self.subjective:
            self.subjective = self.S
        if not self.objective:
            self.objective = self.O
        if not self.assessment:
            self.assessment = self.A
        if not self.plan:
            self.plan = self.P

    class Config:
        json_schema_extra = {
            "example": {
                "S": "patient 3 years old has fever, red spots on the skin",
                "O": "petechia on skin, strong pulse 120",
                "A": "df",
                "P": "intravenous fluid ringer lactate",
                "subjective": "patient 3 years old has fever, red spots on the skin",
                "objective": "petechia on skin, strong pulse 120",
                "assessment": "df",
                "plan": "intravenous fluid ringer lactate"
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
    subjective: str = ""
    objective: str = ""
    assessment: str = ""
    plan: str = ""
    message: str = "Ekstraksi narasi ke struktur SOAP berhasil"

    def model_post_init(self, __context: Any) -> None:
        if self.data:
            if not self.subjective:
                self.subjective = self.data.S
            if not self.objective:
                self.objective = self.data.O
            if not self.assessment:
                self.assessment = self.data.A
            if not self.plan:
                self.plan = self.data.P


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
    claim_readiness_score: float = Field(..., description="Nilai presisi skor kesiapan klaim (0.0 - 100.0%)")
    total_suggestions: int = Field(..., description="Jumlah rekomendasi perbaikan aktif")
    suggestions: List[SuggestionItem] = Field(default_factory=list, description="Daftar rekomendasi perbaikan")
