"""
Service Mesin Aturan Validasi Rekam Medis (Coder's Perspective Rule Engine).
Mendelegasikan analisis ke CoderRulesEngine pada rules_engine.py.
"""

from app.schemas.soap import SoapModel, SuggestionResponse
from app.services.rules_engine import rules_engine


class SoapValidatorService:
    @staticmethod
    def validate_soap(soap: SoapModel) -> SuggestionResponse:
        """
        Menganalisis 4 blok SOAP menggunakan rules_engine.
        """
        return rules_engine.validate(soap)
