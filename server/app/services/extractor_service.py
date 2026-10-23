"""
Service Layanan Ekstraksi Narasi Bebas Dokter ke Struktur SOAP.
Menghubungkan pipeline NLP berbasis LLM (Ifham) dengan fallback regex presisi.
"""

from app.schemas.soap import SoapModel
from app.services.llm_extractor import llm_extractor


class SoapExtractorService:
    @staticmethod
    def extract_from_narrative(narrative_text: str) -> SoapModel:
        """
        Memetakan narasi paragraf klinis dokter ke format SOAP 4 blok.
        Menggunakan LLM dengan prompt terstruktur few-shot, atau fallback regex jika offline.
        """
        return llm_extractor.extract(narrative_text)
