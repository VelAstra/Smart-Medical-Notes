"""
Mesin Aturan Koder Klinis Terpusat (Coder's Perspective Rule Engine).
Memvalidasi kelengkapan data medis, disambiguasi singkatan klinis, dan menghitung skor kesiapan klaim asuransi.
Mendukung pertahanan batas negasi (Defensive Negation Guard) dan fail-safe lokal berlatensi rendah (< 200ms).
"""

import re
import os
import json
import logging
from typing import List, Dict, Any, Optional
from app.schemas.soap import SoapModel, SuggestionItem, SuggestionResponse

logger = logging.getLogger(__name__)

# Pola Kata Negasi Klinis Indonesia & Inggris
NEGATION_PATTERN = re.compile(
    r'\b(tidak\s+ada|menyangkal|bebas|tanpa|bukan|negatif|tidak|denies|no|without)\b',
    re.IGNORECASE
)

# Pola Pengecekan Negasi Suffix (e.g. "demam (-)", "demam nihil", "afebris")
NEGATION_SUFFIX_PATTERN = re.compile(
    r'(\(-\)|negatif|nihil|disangkal)',
    re.IGNORECASE
)


class CoderRulesEngine:
    """
    Mesin aturan penegak kepatuhan koder rekam medis.
    """

    def __init__(self, data_file: Optional[str] = None):
        self.abbreviations: List[Dict[str, Any]] = self._load_abbreviations(data_file)

    def _load_abbreviations(self, custom_path: Optional[str] = None) -> List[Dict[str, Any]]:
        """Memuat kamus singkatan medis resmi (ICD-10 aligned)."""
        if not custom_path:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            candidate = os.path.abspath(os.path.join(base_dir, "..", "data", "medical_abbreviations.json"))
            if os.path.exists(candidate):
                custom_path = candidate

        if custom_path and os.path.exists(custom_path):
            try:
                with open(custom_path, "r", encoding="utf-8") as f:
                    raw_items = json.load(f)
                loaded = []
                for item in raw_items:
                    code = item.get("singkatan", "").lower()
                    if not code:
                        continue
                    expansion = item.get("istilah_resmi", "")
                    icd10 = item.get("kode_icd10", "")
                    desc = item.get("alasan_rekomendasi", f"Standardisasi '{code}' ke '{expansion}'.")

                    # Title formatting and standard expansions
                    if code == "df":
                        title = "Change df to dengue fever"
                        expansion = "dengue fever"
                    elif code == "ht":
                        title = "Change ht to hipertensi"
                        expansion = "hipertensi"
                    elif code == "ispa":
                        title = "Perjelas singkatan ispa menjadi Infeksi Saluran Pernapasan Akut (ISPA)"
                    elif code == "dm":
                        title = "Change dm to diabetes mellitus"
                        expansion = "diabetes mellitus"
                    elif code == "tbc":
                        title = "Change tbc to tuberculosis"
                        expansion = "tuberculosis"
                    elif code == "gea":
                        title = "Change gea to gastroenteritis akut"
                        expansion = "gastroenteritis akut"
                    else:
                        title = f"Change {code} to {expansion}"

                    pattern = rf"\b{re.escape(code)}\b" if code != "tbc" else r"\btbc?\b"

                    loaded.append({
                        "code": code,
                        "pattern": pattern,
                        "expansion": expansion,
                        "icd10": icd10,
                        "title": title,
                        "description": desc
                    })
                if loaded:
                    return loaded
            except Exception as e:
                logger.warning(f"Gagal memuat kamus singkatan dari {custom_path}: {e}")

        # Default standard dictionary fallback (ICD-10 aligned)
        return [
            {
                "code": "df",
                "pattern": r"\bdf\b",
                "expansion": "dengue fever",
                "icd10": "A97",
                "title": "Change df to dengue fever",
                "description": "Singkatan 'df' ambigu dan berpotensi memicu dispute klaim. Standardisasi ke 'dengue fever' (ICD-10: A97)."
            },
            {
                "code": "ht",
                "pattern": r"\bht\b",
                "expansion": "hipertensi",
                "icd10": "I10",
                "title": "Change ht to hipertensi",
                "description": "Singkatan 'ht' dapat tertukar dengan hematokrit. Standardisasi ke istilah resmi 'hipertensi' (ICD-10: I10)."
            },
            {
                "code": "ispa",
                "pattern": r"\bispa\b",
                "expansion": "Infeksi Saluran Pernapasan Akut (ISPA)",
                "icd10": "J06.9",
                "title": "Perjelas singkatan ispa menjadi Infeksi Saluran Pernapasan Akut (ISPA)",
                "description": "Perjelas diagnosis kerja menjadi terminologi resmi rekam medis (ICD-10: J06.9)."
            },
            {
                "code": "dm",
                "pattern": r"\bdm\b",
                "expansion": "diabetes mellitus",
                "icd10": "E11",
                "title": "Change dm to diabetes mellitus",
                "description": "Standardisasi singkatan 'dm' ke istilah baku 'diabetes mellitus' (ICD-10: E11)."
            },
            {
                "code": "tbc",
                "pattern": r"\btbc?\b",
                "expansion": "tuberculosis",
                "icd10": "A15",
                "title": "Change tbc to tuberculosis",
                "description": "Gunakan istilah resmi 'tuberculosis' sesuai pedoman klasifikasi penyakit (ICD-10: A15)."
            },
            {
                "code": "gea",
                "pattern": r"\bge[a]?\b",
                "expansion": "gastroenteritis akut",
                "icd10": "A09",
                "title": "Change gea to gastroenteritis akut",
                "description": "Perjelas diagnosis klinis menjadi 'gastroenteritis akut' (ICD-10: A09)."
            }
        ]

    def _is_clinically_negated(self, text: str, match_span: tuple) -> bool:
        """
        Defensive Negation Guard:
        Memeriksa apakah simtom klinis dinegasikan oleh dokter.
        Menganalisis jendela 35 karakter sebelum kemunculan kata simtom,
        serta jendela 15 karakter setelah kemunculan kata simtom.
        """
        start, end = match_span

        # 1. Periksa konteks mendahului (preceding context)
        prefix_window_start = max(0, start - 35)
        prefix_text = text[prefix_window_start:start].strip()

        if NEGATION_PATTERN.search(prefix_text):
            return True

        # 2. Periksa konteks mengikuti (suffix context, e.g. "demam (-)" atau "demam disangkal")
        suffix_window_end = min(len(text), end + 15)
        suffix_text = text[end:suffix_window_end].strip()

        if NEGATION_SUFFIX_PATTERN.search(suffix_text):
            return True

        return False

    def validate(self, soap: SoapModel) -> SuggestionResponse:
        """
        Mengevaluasi 4 blok SOAP dan menghasilkan daftar rekomendasi perbaikan berbasis koder.
        """
        s_text = (soap.S or soap.subjective or "").strip()
        o_text = (soap.O or soap.objective or "").strip()
        a_text = (soap.A or soap.assessment or "").strip()
        p_text = (soap.P or soap.plan or "").strip()

        # Kasus input kosong total
        if not s_text and not o_text and not a_text and not p_text:
            return SuggestionResponse(
                success=True,
                insurance_readiness_score=0,
                claim_readiness_score=0.0,
                total_suggestions=0,
                suggestions=[]
            )

        suggestions: List[SuggestionItem] = []

        # =================================================================
        # ATURAN 1: KELENGKAPAN SUHU TUBUH SAAT DEMAM (WITH NEGATION GUARD)
        # =================================================================
        # Cari simtom demam
        fever_matches = list(re.finditer(r'\b(demam|panas|fever|meriang|suhu\s+tinggi)\b', s_text, re.IGNORECASE))
        fever_in_o = list(re.finditer(r'\b(fever|demam|panas)\b', o_text, re.IGNORECASE))

        has_active_fever = False

        for match in fever_matches:
            if not self._is_clinically_negated(s_text, match.span()):
                has_active_fever = True
                break

        if not has_active_fever:
            for match in fever_in_o:
                if not self._is_clinically_negated(o_text, match.span()):
                    has_active_fever = True
                    break

        # Cek apakah ada kata kunci "afebris" (artinya tidak demam)
        if re.search(r'\bafebris\b', o_text, re.IGNORECASE) or re.search(r'\bafebris\b', s_text, re.IGNORECASE):
            has_active_fever = False

        if has_active_fever:
            # Periksa apakah ada nilai numerik suhu tubuh di Objective (e.g. 38 C, 38.8 C, 37.5)
            has_numeric_temp = bool(
                re.search(r'(?:suhu|temp|temperature|t:)?\s*(?:3[5-9]|4[0-2])(?:[.,]\d+)?\s*(?:°?c|celcius)?\b', o_text, re.IGNORECASE)
            )
            if not has_numeric_temp:
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

        # =================================================================
        # ATURAN 2: KELENGKAPAN TEKANAN DARAH (TENSI) SAAT RISIKO HIPERTENSI
        # =================================================================
        bp_risk_matches = list(re.finditer(r'\b(hipertensi|ht|tensi\s+tinggi|tengkuk\s+berat|tengkuk\s+kaku|pusing\s+kepala\s+hebat|pusing\s+berputar)\b', s_text, re.IGNORECASE))
        bp_in_a = list(re.finditer(r'\b(ht|hipertensi)\b', a_text, re.IGNORECASE))

        has_active_bp_risk = False
        for match in bp_risk_matches:
            if not self._is_clinically_negated(s_text, match.span()):
                has_active_bp_risk = True
                break

        if not has_active_bp_risk:
            for match in bp_in_a:
                if not self._is_clinically_negated(a_text, match.span()):
                    has_active_bp_risk = True
                    break

        if has_active_bp_risk:
            # Periksa apakah ada nilai tensi darah (e.g. 120/80, 150/95 mmHg)
            has_bp_numeric = bool(
                re.search(r'(?:td|bp|tensi)?\s*\d{2,3}\s*\/s*\d{2,3}', o_text, re.IGNORECASE)
            )
            if not has_bp_numeric:
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

        # =================================================================
        # ATURAN 3: DISAMBIGUASI SINGKATAN MEDIS AMBIGU (CASE-INSENSITIVE)
        # =================================================================
        for abbr in self.abbreviations:
            pattern = re.compile(abbr["pattern"], re.IGNORECASE)
            match = pattern.search(a_text)
            if match:
                detected_word = match.group(0)
                suggestions.append(
                    SuggestionItem(
                        id=f"rule_abbr_{abbr['code']}",
                        category="Singkatan Medis Ambigu",
                        target_field="A",
                        title=abbr["title"],
                        description=abbr["description"],
                        action_type="replace",
                        search_target=detected_word,
                        replacement_payload=abbr["expansion"],
                        badge_text="Standardisasi ICD-10"
                    )
                )

        # =================================================================
        # ATURAN 4: KERAPIHAN TERAPI PLAN
        # =================================================================
        if p_text and len(p_text) < 15:
            suggestions.append(
                SuggestionItem(
                    id="rule_plan_brevity",
                    category="Spesifikasi Terapi",
                    target_field="P",
                    title="Lengkapi rute pemberian atau dosis obat",
                    description="Rencana tatalaksana obat terlalu singkat. Disarankan mencantumkan rute pemberian (oral/IV) dan frekuensi konsumsi.",
                    action_type="append",
                    search_target=None,
                    replacement_payload=" (oral, sesudah makan)",
                    badge_text="Keamanan Pasien"
                )
            )

        # =================================================================
        # PERHITUNGAN SKOR KESIAPAN KLAIM ASURANSI (0.0 - 100.0%)
        # =================================================================
        total_issues = len(suggestions)
        if total_issues == 0:
            score = 100.0
        elif total_issues == 1:
            score = 75.0
        elif total_issues == 2:
            score = 50.0
        elif total_issues == 3:
            score = 30.0
        else:
            score = max(10.0, 100.0 - (total_issues * 25.0))

        # Clamp skor ke rentang 0.0 s.d. 100.0%
        score = max(0.0, min(100.0, float(score)))

        return SuggestionResponse(
            success=True,
            insurance_readiness_score=int(score),
            claim_readiness_score=round(score, 1),
            total_suggestions=total_issues,
            suggestions=suggestions
        )


# Singleton Instance
rules_engine = CoderRulesEngine()
