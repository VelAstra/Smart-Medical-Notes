"""
Service Mesin Aturan Validasi Rekam Medis (Coder's Perspective Rule Engine).
Mendeteksi singkatan ambigu dan ketidaklengkapan data klinis untuk kelayakan klaim asuransi.
Diselaraskan dengan Knowledge Base Ananda Auliya Rahma (Medical Domain Lead).
"""

import os
import re
import json
from typing import List
from app.schemas.soap import SoapModel, SuggestionItem, SuggestionResponse

# Lokasi berkas dataset pengetahuan medis
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(CURRENT_DIR, "..", "data")
ABBR_FILE = os.path.join(DATA_DIR, "medical_abbreviations.json")


def load_clinical_abbreviations() -> List[dict]:
    """Memuat kamus singkatan dari JSON jika tersedia, atau fallback ke dataset default."""
    if os.path.exists(ABBR_FILE):
        try:
            with open(ABBR_FILE, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                result = []
                for item in raw_data:
                    code = item["singkatan"]
                    result.append({
                        "code": code,
                        "pattern": rf"\b{re.escape(code)}\b",
                        "expansion": item["istilah_resmi"],
                        "icd10": item.get("kode_icd10", "Unspecified"),
                        "description": item.get("alasan_rekomendasi", "Standarisasi rekam medis.")
                    })
                return result
        except Exception:
            pass

    # Default fallback
    return [
        {"code": "df", "pattern": r"\bdf\b", "expansion": "dengue fever", "icd10": "A90", "description": "Singkatan ambigu."},
        {"code": "ispa", "pattern": r"\bispa\b", "expansion": "Infeksi Saluran Pernapasan Akut (ISPA)", "icd10": "J06.9", "description": "Perjelas diagnosis spesifik."},
        {"code": "ht", "pattern": r"\bht\b", "expansion": "hipertensi", "icd10": "I10", "description": "Tertukar dengan hematokrit."},
        {"code": "dm", "pattern": r"\bdm\b", "expansion": "diabetes mellitus", "icd10": "E11", "description": "Tentukan tipe DM."},
        {"code": "tbc", "pattern": r"\btbc?\b", "expansion": "tuberculosis", "icd10": "A15", "description": "Istilah resmi tuberculosis."}
    ]


CLINICAL_ABBREVIATIONS = load_clinical_abbreviations()


class SoapValidatorService:
    @staticmethod
    def validate_soap(soap: SoapModel) -> SuggestionResponse:
        """
        Menganalisis 4 blok SOAP dan menghasilkan daftar rekomendasi perbaikan coder.
        """
        suggestions: List[SuggestionItem] = []
        s_text = soap.S or ""
        o_text = soap.O or ""
        a_text = soap.A or ""
        p_text = soap.P or ""

        # 1. Aturan Validasi: Kelengkapan Suhu Tubuh saat ada keluhan Demam
        mentions_fever = bool(
            re.search(r'\b(demam|panas|fever|meriang|suhu tinggi)\b', s_text, re.IGNORECASE) or
            re.search(r'\b(fever)\b', o_text, re.IGNORECASE)
        )
        has_temp_numeric = bool(
            re.search(r'(suhu|temp|temperature|t:)?\s*(3[5-9]|4[0-2])([.,]\d+)?\s*(°?c|celcius)?', o_text, re.IGNORECASE)
        )

        if mentions_fever and not has_temp_numeric:
            suggestions.append(
                SuggestionItem(
                    id="rule_temp_fever",
                    category="Kelengkapan Tanda Vital",
                    target_field="O",
                    title="Add temperature data",
                    description="Keluhan demam/fever tertera pada Subjective, tetapi nilai kuantitatif suhu tubuh belum tercantum di Objective.",
                    action_type="append",
                    search_target=None,
                    replacement_payload="temperature: 38.8 C",
                    badge_text="Wajib Klaim Asuransi"
                )
            )

        # 2. Aturan Validasi: Kelengkapan Tekanan Darah (Tensi)
        mentions_bp_risk = bool(
            re.search(r'\b(hipertensi|ht|tengkuk berat|pusing kepala hebat)\b', s_text, re.IGNORECASE) or
            re.search(r'\b(ht|hipertensi)\b', a_text, re.IGNORECASE)
        )
        has_bp_reading = bool(
            re.search(r'(td|bp|tensi)?\s*\d{2,3}\s*\/\s*\d{2,3}', o_text, re.IGNORECASE)
        )

        if mentions_bp_risk and not has_bp_reading:
            suggestions.append(
                SuggestionItem(
                    id="rule_bp_hypertension",
                    category="Kelengkapan Tanda Vital",
                    target_field="O",
                    title="Tambahkan nilai Tekanan Darah (TD)",
                    description="Koder memerlukan bukti angka tensi darah (mmHg) pada Objective untuk mendukung diagnosis terkait hipertensi.",
                    action_type="append",
                    search_target=None,
                    replacement_payload="TD: 150/95 mmHg",
                    badge_text="Kriteria Verifikasi Coder"
                )
            )

        # 3. Aturan Validasi: Deteksi Singkatan Medis Ambigu (Berdasarkan Knowledge Base)
        for item in CLINICAL_ABBREVIATIONS:
            if re.search(item["pattern"], a_text, re.IGNORECASE):
                suggestions.append(
                    SuggestionItem(
                        id=f"rule_abbr_{item['code']}",
                        category="Singkatan Medis Ambigu",
                        target_field="A",
                        title=f"Change {item['code']} to {item['expansion']}",
                        description=f"{item['description']} (Referensi ICD-10: {item['icd10']}).",
                        action_type="replace",
                        search_target=item["code"],
                        replacement_payload=item["expansion"],
                        badge_text="Standardisasi ICD-10"
                    )
                )

        # 4. Aturan Validasi: Detail Terapi (Plan) Terlalu Singkat
        if p_text.strip() and len(p_text.strip()) < 15:
            suggestions.append(
                SuggestionItem(
                    id="rule_plan_brevity",
                    category="Spesifikasi Terapi",
                    target_field="P",
                    title="Lengkapi rute pemberian atau dosis obat",
                    description="Rencana tatalaksana obat terlalu singkat. Disarankan mencantumkan rute pemberian (oral/IV) dan frekuensi.",
                    action_type="append",
                    search_target=None,
                    replacement_payload=" (oral, sesudah makan)",
                    badge_text="Keamanan Pasien"
                )
            )

        # Perhitungan Skor Kesiapan Klaim Asuransi
        total_issues = len(suggestions)
        if not s_text and not o_text and not a_text and not p_text:
            score = 0
        elif total_issues == 0:
            score = 100
        elif total_issues == 1:
            score = 75
        elif total_issues == 2:
            score = 50
        else:
            score = 30

        return SuggestionResponse(
            success=True,
            insurance_readiness_score=score,
            total_suggestions=total_issues,
            suggestions=suggestions
        )
