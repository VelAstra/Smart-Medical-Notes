"""
Service Layanan Ekstraksi Narasi Bebas Dokter ke Struktur SOAP.
Didesain modular agar dapat dengan mudah diintegrasikan dengan model NLP/LLM (Ifham).
"""

import re
from app.schemas.soap import SoapModel


class SoapExtractorService:
    @staticmethod
    def extract_from_narrative(narrative_text: str) -> SoapModel:
        """
        Memetakan narasi paragraf klinis ke 4 blok SOAP.
        Menggunakan aturan segmentasi kalimat dan pencocokan semantik klinis.
        """
        if not narrative_text or not narrative_text.strip():
            return SoapModel(S="", O="", A="", P="")

        # Normalisasi spasi
        text = narrative_text.strip()
        
        # Pisahkan kalimat berdasarkan tanda baca titik, seru, tanya, atau baris baru
        sentences = [s.strip() for s in re.split(r'(?<=[.?!])\s+|\n+', text) if s.strip()]

        s_parts = []
        o_parts = []
        a_parts = []
        p_parts = []

        # Pola kata kunci klinis
        subjective_pattern = re.compile(
            r'\b(pasien|mengeluh|keluhan|riwayat|sejak|rasa|merasa|sakit|nyeri|demam|lemas|pusing|batuk|mual|muntah|anak|usia)\b',
            re.IGNORECASE
        )
        objective_pattern = re.compile(
            r'\b(pemeriksaan|tanda vital|fisik|tampak|keadaan|nadi|suhu|temp|td|tensi|rr|ekstremitas|hiperemis|ronki|wheezing|pupil|abdomen|toraks|laboratorium|lab|hb|trombosit)\b',
            re.IGNORECASE
        )
        assessment_pattern = re.compile(
            r'\b(diagnosis|dx|suspek|kesimpulan|kerja|df|dengue|ispa|hipertensi|ht|dm|diabetes|ge|gea|tbc?|faringitis)\b',
            re.IGNORECASE
        )
        plan_pattern = re.compile(
            r'\b(terapi|tatalaksana|diberikan|resep|obat|infus|ringer|rl|paracetamol|mg|tablet|sirup|ampul|oral|iv|edukasi|rawat|kontrol|pro|plan)\b',
            re.IGNORECASE
        )

        for sentence in sentences:
            # Prioritas pencocokan
            if plan_pattern.search(sentence) and not assessment_pattern.search(sentence):
                p_parts.append(sentence)
            elif assessment_pattern.search(sentence) and not objective_pattern.search(sentence):
                a_parts.append(sentence)
            elif objective_pattern.search(sentence):
                o_parts.append(sentence)
            elif subjective_pattern.search(sentence):
                s_parts.append(sentence)
            else:
                # Default fallback jika tidak ada kata kunci spesifik
                if not s_parts:
                    s_parts.append(sentence)
                else:
                    o_parts.append(sentence)

        return SoapModel(
            S=" ".join(s_parts).strip(),
            O=" ".join(o_parts).strip(),
            A=" ".join(a_parts).strip(),
            P=" ".join(p_parts).strip()
        )
