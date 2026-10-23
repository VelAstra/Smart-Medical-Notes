"""
Service Mesin Aturan Validasi Rekam Medis (Coder's Perspective Rule Engine).
Mendeteksi singkatan ambigu dan ketidaklengkapan data klinis untuk kelayakan klaim asuransi.
"""

import re
from typing import List
from app.schemas.soap import SoapModel, SuggestionItem, SuggestionResponse


# Kamus Singkatan Medis Baku (Dapat diperluas dari dataset Ananda Auliya)
CLINICAL_ABBREVIATIONS = [
    {
        "code": "df",
        "pattern": r"\bdf\b",
        "expansion": "dengue fever",
        "icd10": "A90",
        "description": "Singkatan 'df' ambigu dan tidak memenuhi standar dokumentasi rekam medis ICD-10."
    },
    {
        "code": "ispa",
        "pattern": r"\bispa\b",
        "expansion": "Infeksi Saluran Pernapasan Akut (ISPA)",
        "icd10": "J06.9",
        "description": "Disarankan mencantumkan nama diagnosis resmi untuk verifikasi klaim BPJS."
    },
    {
        "code": "ht",
        "pattern": r"\bht\b",
        "expansion": "hipertensi",
        "icd10": "I10",
        "description": "Singkatan 'ht' berpotensi tertukar dengan istilah hematokrit/histerektomi."
    },
    {
        "code": "dm",
        "pattern": r"\bdm\b",
        "expansion": "diabetes mellitus",
        "icd10": "E11",
        "description": "Singkatan 'dm' perlu diperjelas jenis tipenya (Tipe 1 / Tipe 2)."
    },
    {
        "code": "tbc",
        "pattern": r"\btbc?\b",
        "expansion": "tuberculosis",
        "icd10": "A15",
        "description": "Istilah baku rekam medis internasional adalah tuberculosis."
    },
    {
        "code": "gea",
        "pattern": r"\bge(a)?\b",
        "expansion": "gastroenteritis akut",
        "icd10": "A09",
        "description": "Gunakan istilah gastroenteritis akut untuk kepastian diagnosis koding klaim."
    }
]


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

        # 3. Aturan Validasi: Deteksi Singkatan Medis Ambigu
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
