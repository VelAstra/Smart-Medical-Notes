"""
Layanan Ekstraksi NLP Klinis berbasis LLM (Few-Shot Prompting & Robust Parsing).
Dirancang oleh: Ifham Syafwan Fikri (NLP Pipeline & LLM Prompting Lead).
"""

import os
import re
import json
import logging
import urllib.request
import urllib.error
from typing import Optional, Dict, Any
from app.schemas.soap import SoapModel

logger = logging.getLogger(__name__)

# =====================================================================
# 1. TEMPLATE PROMPT (SYSTEM PROMPT & FEW-SHOT EXAMPLES)
# =====================================================================

SYSTEM_PROMPT = """Anda adalah Senior Medical Information Extraction Engine yang bertugas mengonversi catatan narasi bebas diagnosis klinis dokter menjadi format rekam medis standar SOAP (Subjective, Objective, Assessment, Plan).

Pedoman Khusus:
1. Pisahkan teks narasi ke dalam 4 blok kunci:
   - "S" (Subjective): Keluhan utama pasien, anamnesis, durasi gejala, riwayat penyakit sekarang dan terdahulu.
   - "O" (Objective): Hasil pemeriksaan fisik (PF/Pemfis), tanda-tanda vital (TTV: tensi, nadi, suhu, RR), hasil palpasi/auskultasi, dan laboratorium.
   - "A" (Assessment): Diagnosis kerja (working diagnosis), diagnosis banding (differential diagnosis/dd), atau kesan klinis dokter. PERTAHANKAN singkatan klinis asli dokter (misal: "df", "ispa", "ht") agar dapat dievaluasi oleh sistem validator koder.
   - "P" (Plan): Rencana terapi, obat-obatan, dosis, rute infus, edukasi pasien, dan anjuran rawat/kontrol ulang.
2. Jangan mengarang atau menambahkan informasi medis yang tidak ada dalam narasi dokter (Anti-Hallucination).
3. Tangani bahasa campuran dokter Indonesia (bahasa Indonesia sehari-hari, istilah serapan kedokteran, dan singkatan klinis).
4. OUTPUT WAJIB FORMAT JSON MURNI sesuai skema tanpa markdown pembuka/penutup tambahan."""

FEW_SHOT_EXAMPLES = [
    {
        "role": "user",
        "content": "Pasien anak usia 3 th datang dgn demam 3 hr, bintik merah pd lengan. PF tampak petekia di ekstremitas, nadi 120 x/m kuat. Diagnosis suspek df. Terapi infus RL 15 tpm dan paracetamol syr 3x1 cth."
    },
    {
        "role": "assistant",
        "content": json.dumps({
            "S": "pasien anak usia 3 th datang dgn demam 3 hr, bintik merah pd lengan",
            "O": "PF tampak petekia di ekstremitas, nadi 120 x/m kuat",
            "A": "suspek df",
            "P": "terapi infus RL 15 tpm dan paracetamol syr 3x1 cth"
        }, ensure_ascii=False)
    },
    {
        "role": "user",
        "content": "Pasien mengeluh batuk berdahak kehijauan, pilek, dan demam sejak kemarin malam. Pemfis faring hiperemis, T1-T1, ronki basah halus minimal, wheezing negatif. Kesimpulan kerja ispa dd faringitis akut. Diberikan paracetamol 3x500mg, ambroxol 3x30mg tab, perbanyak minum air hangat."
    },
    {
        "role": "assistant",
        "content": json.dumps({
            "S": "pasien mengeluh batuk berdahak kehijauan, pilek, dan demam sejak kemarin malam",
            "O": "Pemfis faring hiperemis, T1-T1, ronki basah halus minimal, wheezing negatif",
            "A": "ispa dd faringitis akut",
            "P": "diberikan paracetamol 3x500mg, ambroxol 3x30mg tab, perbanyak minum air hangat"
        }, ensure_ascii=False)
    },
    {
        "role": "user",
        "content": "Tn. B 52 tahun datang kontrol dengan keluhan tengkuk terasa kaku dan pusing berputar sejak 2 hari. Pada pemeriksaan fisik TD 165/100 mmHg, nadi 82 x/menit, afebris. Diagnosis ht grade 2. Rencana terapi amlodipine 10 mg 1x1 pagi, kurangi konsumsi garam, kontrol ulang 1 minggu."
    },
    {
        "role": "assistant",
        "content": json.dumps({
            "S": "Tn. B 52 tahun datang kontrol dengan keluhan tengkuk terasa kaku dan pusing berputar sejak 2 hari",
            "O": "pada pemeriksaan fisik TD 165/100 mmHg, nadi 82 x/menit, afebris",
            "A": "ht grade 2",
            "P": "rencana terapi amlodipine 10 mg 1x1 pagi, kurangi konsumsi garam, kontrol ulang 1 minggu"
        }, ensure_ascii=False)
    }
]


# =====================================================================
# 2. PIPELINE KELAS EKSTRAKSI LLM (OPENAI / GEMINI API SUPPORT)
# =====================================================================

class LlmSoapExtractor:
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.model_name = os.getenv("LLM_MODEL_NAME", "gemini-1.5-flash")

    def extract(self, narrative_text: str) -> SoapModel:
        """
        Mengekstrak narasi dokter ke SOAP menggunakan LLM.
        Otomatis jatuh ke fallback heuristik jika API key tidak tersedia atau kuota habis.
        """
        if not narrative_text or not narrative_text.strip():
            return SoapModel(S="", O="", A="", P="")

        # 1. Coba Gemini API jika API key tersedia
        if self.gemini_api_key:
            try:
                raw_json = self._call_gemini_api(narrative_text)
                return self._parse_and_validate_json(raw_json)
            except Exception as e:
                logger.warning(f"[LLM Extractor] Gemini API gagal ({e}), mencoba fallback.")

        # 2. Coba OpenAI API jika API key tersedia
        if self.openai_api_key:
            try:
                raw_json = self._call_openai_api(narrative_text)
                return self._parse_and_validate_json(raw_json)
            except Exception as e:
                logger.warning(f"[LLM Extractor] OpenAI API gagal ({e}), mencoba fallback.")

        # 3. Fallback Heuristik Regex (100% Reliable Offline)
        logger.info("[LLM Extractor] Menggunakan fallback aturan regex klinis.")
        return self.regex_heuristic_fallback(narrative_text)

    def _call_gemini_api(self, narrative_text: str) -> str:
        """Memanggil Gemini 1.5 Flash via REST API endpoint dengan JSON mode."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.gemini_api_key}"
        
        contents = [
            {"role": "user", "parts": [{"text": SYSTEM_PROMPT}]}
        ]
        
        for example in FEW_SHOT_EXAMPLES:
            role = "user" if example["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": example["content"]}]})

        contents.append({"role": "user", "parts": [{"text": f"Ekstrak narasi medis berikut ke format JSON SOAP:\n\n{narrative_text}"}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )

        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["candidates"][0]["content"]["parts"][0]["text"]

    def _call_openai_api(self, narrative_text: str) -> str:
        """Memanggil OpenAI Chat Completions API dengan response_format JSON."""
        url = "https://api.openai.com/v1/chat/completions"
        
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for example in FEW_SHOT_EXAMPLES:
            messages.append({"role": example["role"], "content": example["content"]})
        messages.append({"role": "user", "content": f"Ekstrak narasi medis berikut:\n\n{narrative_text}"})

        payload = {
            "model": "gpt-4o-mini",
            "messages": messages,
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.openai_api_key}"
            }
        )

        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["choices"][0]["message"]["content"]

    def _parse_and_validate_json(self, raw_text: str) -> SoapModel:
        """
        Pembersih dan validator format JSON untuk mengantisipasi format markdown fences.
        """
        # Hapus markdown codeblocks jika ada (```json ... ```)
        cleaned = re.sub(r"^```json\s*", "", raw_text.strip(), flags=re.MULTILINE)
        cleaned = re.sub(r"^```\s*", "", cleaned, flags=re.MULTILINE)
        cleaned = cleaned.rstrip("`").strip()

        data = json.loads(cleaned)

        # Mapping Pydantic type-safe
        return SoapModel(
            S=data.get("S") or data.get("subjective") or "",
            O=data.get("O") or data.get("objective") or "",
            A=data.get("A") or data.get("assessment") or "",
            P=data.get("P") or data.get("plan") or ""
        )

    # =====================================================================
    # 3. FUNGSI FALLBACK HEURISTIK REGEX KLINIS
    # =====================================================================
    @staticmethod
    def regex_heuristic_fallback(narrative_text: str) -> SoapModel:
        """
        Fallback parser presisi berbasis pola kalimat dan kata kunci klinis kedokteran.
        """
        sentences = [s.strip() for s in re.split(r'(?<=[.?!])\s+|\n+', narrative_text.strip()) if s.strip()]

        s_list, o_list, a_list, p_list = [], [], [], []

        re_subj = re.compile(r'\b(pasien|keluhan|mengeluh|riwayat|sejak|sakit|nyeri|demam|lemas|pusing|batuk|sesak|mual|muntah|anak|th|tahun)\b', re.I)
        re_obj = re.compile(r'\b(pemeriksaan|pemfis|pf|tanda vital|ttv|fisik|tampak|nadi|suhu|temp|td|tensi|rr|ekstremitas|hiperemis|ronki|wheezing|lab|hb|trombosit)\b', re.I)
        re_ass = re.compile(r'\b(diagnosis|dx|suspek|kesimpulan|kerja|df|dengue|ispa|faringitis|hipertensi|ht|dm|diabetes|ge|gea|tbc?)\b', re.I)
        re_plan = re.compile(r'\b(terapi|tatalaksana|diberikan|resep|obat|infus|rl|paracetamol|mg|tab|tablet|sirup|syr|iv|oral|edukasi|kontrol|pro|plan)\b', re.I)

        for sent in sentences:
            if re_plan.search(sent) and not re_ass.search(sent):
                p_list.append(sent)
            elif re_ass.search(sent) and not re_obj.search(sent):
                a_list.append(sent)
            elif re_obj.search(sent):
                o_list.append(sent)
            elif re_subj.search(sent):
                s_list.append(sent)
            else:
                if not s_list:
                    s_list.append(sent)
                else:
                    o_list.append(sent)

        return SoapModel(
            S=" ".join(s_list).strip(),
            O=" ".join(o_list).strip(),
            A=" ".join(a_list).strip(),
            P=" ".join(p_list).strip()
        )


# Singleton instance
llm_extractor = LlmSoapExtractor()
