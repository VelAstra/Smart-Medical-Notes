"""
Skrip Pengujian Otomatis Mandiri (Automated QA Verification Suite).
Memvalidasi 8 Skenario Batas (Edge Cases) Medis Sesuai Spesifikasi Paten dan Standar Zero-Error.
Dilarang memuat emoji mentah apa pun.
"""

import sys
import os
import time
import warnings

# Suppress deprecation warnings for pristine terminal output
warnings.filterwarnings("ignore")

# Pastikan modul server dapat diimpor
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from app.schemas.soap import SoapModel, NarrativeExtractRequest, SoapResponse, SuggestionResponse
from app.services.rules_engine import rules_engine
from app.services.extractor_service import SoapExtractorService
from app.main import app
from starlette.testclient import TestClient


def log_test_header(test_id: str, title: str):
    print(f"\n[TEST {test_id}] {title}")
    print("-" * 70)


def test_case_1_baseline_kyoto_dissertation():
    """
    Kasus 1: Baseline Riset Disertasi Kyoto University (Slide 53 / Bentuk UI.png).
    Input: "df" dan simtom demam tanpa angka temperatur pada O.
    Ekspektasi: Tepat menghasilkan 2 saran: "Add temperature data" dan "Change df to dengue fever".
    """
    log_test_header("1", "Baseline Disertasi Kyoto University (Slide 53)")
    soap = SoapModel(
        S="patient 3 years old has fever, red spots on the skin",
        O="petechia on skin, strong pulse 120",
        A="df",
        P="intravenous fluid ringer lactate"
    )

    res = rules_engine.validate(soap)

    assert res.success is True, "Respons harus sukses"
    assert res.total_suggestions == 2, f"Total saran harus 2, diperoleh: {res.total_suggestions}"
    
    titles = [s.title for s in res.suggestions]
    assert "Add temperature data" in titles, "Saran 'Add temperature data' wajib ada"
    assert "Change df to dengue fever" in titles, "Saran 'Change df to dengue fever' wajib ada"

    fields = {s.title: s.target_field for s in res.suggestions}
    assert fields["Add temperature data"] == "O", "Target temperature harus kolom O"
    assert fields["Change df to dengue fever"] == "A", "Target df harus kolom A"

    assert res.claim_readiness_score == 50.0, f"Skor kesiapan klaim harus 50.0%, diperoleh: {res.claim_readiness_score}"
    print("[PASSED] Kasus 1 valid: 2 saran spesifik terdeteksi dengan skor 50.0%")


def test_case_2_hypertension_missing_bp():
    """
    Kasus 2: Hipertensi Tanpa Bukti Tekanan Darah.
    Input: Keluhan tengkuk kaku dan "ht" tanpa angka tensi pada O.
    Ekspektasi: Menghasilkan saran penambahan tensi darah (O) dan ekspansi "ht" menjadi "hipertensi" (A).
    """
    log_test_header("2", "Hipertensi Tanpa Bukti Tekanan Darah (TD)")
    soap = SoapModel(
        S="pasien mengeluh tengkuk kaku dan nyeri kepala belakang memberat sejak kemarin",
        O="pemeriksaan nadi 84x/m reguler, edema tungkai (-)",
        A="ht",
        P="diberikan amlodipine 10mg per oral"
    )

    res = rules_engine.validate(soap)

    assert res.success is True
    titles = [s.title for s in res.suggestions]
    assert "Tambahkan nilai Tekanan Darah (TD)" in titles, "Saran TD wajib ada"
    assert "Change ht to hipertensi" in titles, "Saran ekspansi ht wajib ada"
    assert res.claim_readiness_score <= 50.0
    print("[PASSED] Kasus 2 valid: Saran TD dan ekspansi singkatan ht terverifikasi")


def test_case_3_clinical_negation_zero_false_positive():
    """
    Kasus 3: Pertahanan Negasi Klinis (Defensive Negation Guard - Zero False Positives).
    Input: "pasien menyangkal demam, tidak ada panas".
    Ekspektasi: Sistem TIDAK boleh memicu saran penambahan suhu tubuh.
    """
    log_test_header("3", "Uji Negasi Klinis (Zero False Positive Mandate)")
    
    # Skenario 3a: Penyangkalan di Subjective
    soap_negated_1 = SoapModel(
        S="pasien menyangkal demam, tidak ada panas, keluhan batuk berdahak 3 hari",
        O="pemeriksaan faring hiperemis, nadi 80x/m",
        A="faringitis akut",
        P="terapi paracetamol tablet 3x500mg jika nyeri"
    )
    res_1 = rules_engine.validate(soap_negated_1)
    titles_1 = [s.title for s in res_1.suggestions]
    assert "Add temperature data" not in titles_1, "GAGAL: Demam yang disangkal tidak boleh memicu saran suhu!"

    # Skenario 3b: Afebris pada Objective
    soap_negated_2 = SoapModel(
        S="anak rewel dan batuk berdahak",
        O="pemeriksaan fisik afebris, wheezing negatif",
        A="bronkitis",
        P="terapi ambroxol sirup 3x1 cth"
    )
    res_2 = rules_engine.validate(soap_negated_2)
    titles_2 = [s.title for s in res_2.suggestions]
    assert "Add temperature data" not in titles_2, "GAGAL: Status afebris tidak boleh memicu saran suhu!"

    print("[PASSED] Kasus 3 valid: Penjaga batas negasi klinis berhasil mencegah false positive")


def test_case_4_empty_and_whitespace_inputs():
    """
    Kasus 4: Penanganan Masukan Ekstrem (String Kosong & Whitespace).
    Input: "", "   ", "\n\t  ".
    Ekspektasi: Sistem merespons secara graceful tanpa exception HTTP 500.
    """
    log_test_header("4", "Masukan Ekstrem (String Kosong & Whitespace)")
    
    empty_cases = [
        SoapModel(S="", O="", A="", P=""),
        SoapModel(S="   ", O="   ", A="   ", P="   "),
        SoapModel(S="\n\t", O="\n", A="\t", P="  \n  ")
    ]

    for idx, empty_soap in enumerate(empty_cases):
        res = rules_engine.validate(empty_soap)
        assert res.success is True, f"Kasus kosong {idx} harus sukses"
        assert res.total_suggestions == 0, f"Kasus kosong {idx} tidak boleh memiliki saran aktif"
        assert res.claim_readiness_score == 0.0, f"Kasus kosong {idx} harus memiliki skor 0.0%"

    print("[PASSED] Kasus 4 valid: Masukan kosong ditangani secara graceful tanpa error")


def test_case_5_casing_variations():
    """
    Kasus 5: Variasi Huruf Kapital (Casing Invariance).
    Input: "dF", "DF", "Df", "df".
    Ekspektasi: Seluruh variasi huruf kapital terdeteksi sebagai singkatan ambigu secara konsisten.
    """
    log_test_header("5", "Variasi Huruf Kapital (Casing Invariance)")
    
    casing_tests = ["df", "DF", "dF", "Df"]

    for variation in casing_tests:
        soap = SoapModel(
            S="patient with fever",
            O="petechia",
            A=f"suspected {variation}",
            P="fluid resuscitation"
        )
        res = rules_engine.validate(soap)
        titles = [s.title for s in res.suggestions]
        assert "Change df to dengue fever" in titles, f"Variasi '{variation}' gagal dideteksi!"

    print("[PASSED] Kasus 5 valid: Variasi huruf 'df', 'DF', 'dF', 'Df' terdeteksi konsisten")


def test_case_6_long_narrative_extraction():
    """
    Kasus 6: Ekstraksi Teks Narasi Bebas Panjang ke Kuadran SOAP.
    Input: Satu paragraf panjang narasi klinis campur bahasa Indonesia.
    Ekspektasi: Modul pengurai memetakan kalimat ke S, O, A, dan P secara proporsional.
    """
    log_test_header("6", "Ekstraksi Teks Narasi Bebas Panjang")
    
    narrative = (
        "Pasien anak usia 3 tahun dibawa ibunya dengan keluhan demam tinggi sejak 3 hari yang lalu "
        "disertai bintik-bintik merah pada lengan dan tungkai. Pada pemeriksaan fisik tampak petekia "
        "pada ekstremitas, nadi 120 x/menit teraba kuat, akral hangat. Diagnosis kerja dokter suspek df. "
        "Rencana terapi tatalaksana cairan infus ringer laktat 15 tetes per menit dan paracetamol sirup."
    )

    extracted = SoapExtractorService.extract_from_narrative(narrative)

    assert bool(extracted.S.strip()), "Subjective tidak boleh kosong"
    assert bool(extracted.O.strip()), "Objective tidak boleh kosong"
    assert bool(extracted.A.strip()), "Assessment tidak boleh kosong"
    assert bool(extracted.P.strip()), "Plan tidak boleh kosong"

    assert "demam" in extracted.S.lower() or "keluhan" in extracted.S.lower()
    assert "petekia" in extracted.O.lower() or "nadi" in extracted.O.lower()
    assert "df" in extracted.A.lower()
    assert "infus" in extracted.P.lower() or "paracetamol" in extracted.P.lower()

    print("[PASSED] Kasus 6 valid: Narasi panjang berhasil dipetakan ke 4 kuadran SOAP")


def test_case_7_claim_readiness_score_bounds():
    """
    Kasus 7: Validitas Rentang Nilai Skor Kesiapan Klaim Asuransi.
    Ekspektasi: Nilai claim_readiness_score selalu berada pada rentang numerik 0.0 s.d. 100.0%.
    """
    log_test_header("7", "Validitas Rentang Skor Kesiapan Klaim (0.0 - 100.0%)")
    
    # 7a: Kondisi lengkap sempurna (100.0%)
    perfect_soap = SoapModel(
        S="pasien kontrol rutin diabetes tanpa keluhan baru",
        O="TD 120/80 mmHg, nadi 76x/m, suhu 36.8 C, GDS 130 mg/dL",
        A="diabetes mellitus tipe 2 terkontrol",
        P="metformin tablet 500mg 2x1 oral sesudah makan"
    )
    res_perfect = rules_engine.validate(perfect_soap)
    assert res_perfect.claim_readiness_score == 100.0, f"Skor harus 100.0%, diperoleh: {res_perfect.claim_readiness_score}"
    assert res_perfect.total_suggestions == 0

    # 7b: Kondisi banyak defisiensi
    deficient_soap = SoapModel(
        S="demam tinggi, tengkuk kaku, batuk",
        O="pemeriksaan lemas",
        A="df dd ht",
        P="obat"
    )
    res_def = rules_engine.validate(deficient_soap)
    assert 0.0 <= res_def.claim_readiness_score <= 100.0, "Skor berada di luar rentang 0.0-100.0"

    print("[PASSED] Kasus 7 valid: Skor kesiapan klaim selalu berada dalam batas valid 0.0% s.d. 100.0%")


def test_case_8_local_engine_latency():
    """
    Kasus 8: Uji Kinerja Latensi Eksekusi Mesin Aturan Lokal.
    Ekspektasi: Eksekusi evaluasi selesai dalam waktu jauh di bawah 200 milidetik (< 200ms).
    """
    log_test_header("8", "Uji Latensi Mesin Aturan Lokal (< 200ms Mandate)")
    
    soap = SoapModel(
        S="patient 3 years old has fever, red spots on the skin",
        O="petechia on skin, strong pulse 120",
        A="df",
        P="intravenous fluid ringer lactate"
    )

    iterations = 100
    start_time = time.perf_counter()
    for _ in range(iterations):
        rules_engine.validate(soap)
    end_time = time.perf_counter()

    avg_ms = ((end_time - start_time) / iterations) * 1000.0
    print(f"Rata-rata waktu eksekusi lokal: {avg_ms:.3f} milidetik per pemanggilan.")

    assert avg_ms < 200.0, f"Latensi melampaui batas 200ms: {avg_ms:.3f} ms"
    assert avg_ms < 5.0, f"Kinerja mesin lokal sangat optimal: {avg_ms:.3f} ms"
    print(f"[PASSED] Kasus 8 valid: Latensi ({avg_ms:.3f} ms) jauh di bawah batas 200 milidetik")


def test_case_9_fastapi_rest_endpoints():
    """
    Kasus 9: Verifikasi Pengujian Antarmuka RESTful API (FastAPI TestClient).
    Ekspektasi: Endpoint /api/v1/extract-soap dan /api/v1/validate-coder mengembalikan HTTP 200.
    """
    log_test_header("9", "Verifikasi Integrasi REST API Endpoint (FastAPI)")
    client = TestClient(app)

    # 1. Test Endpoint Ekstraksi Narasi
    extract_payload = {
        "narrative": "Patient has fever and red spots. Pulse 120, petechia. Diagnosis df. Plan intravenous fluids."
    }
    res_extract = client.post("/api/v1/extract-soap", json=extract_payload)
    assert res_extract.status_code == 200, f"Status extract harus 200, diperoleh: {res_extract.status_code}"
    extract_data = res_extract.json()
    assert extract_data["success"] is True
    assert bool(extract_data["subjective"])
    assert bool(extract_data["assessment"])

    # 2. Test Endpoint Validasi Koder
    validate_payload = {
        "S": "patient 3 years old has fever, red spots on the skin",
        "O": "petechia on skin, strong pulse 120",
        "A": "df",
        "P": "intravenous fluid ringer lactate"
    }
    res_validate = client.post("/api/v1/validate-coder", json=validate_payload)
    assert res_validate.status_code == 200, f"Status validate harus 200, diperoleh: {res_validate.status_code}"
    val_data = res_validate.json()
    assert val_data["success"] is True
    assert val_data["total_suggestions"] == 2
    assert val_data["claim_readiness_score"] == 50.0

    print("[PASSED] Kasus 9 valid: Kedua endpoint REST API FastAPI berfungsi normal dengan HTTP 200 OK")


def main():
    print("=" * 70)
    print("SMART MEDICAL NOTES - QA ADVERSARIAL & PATENT VERIFICATION SUITE")
    print("Zero-Error Mandate & Clinical Edge Cases Verification")
    print("=" * 70)

    try:
        test_case_1_baseline_kyoto_dissertation()
        test_case_2_hypertension_missing_bp()
        test_case_3_clinical_negation_zero_false_positive()
        test_case_4_empty_and_whitespace_inputs()
        test_case_5_casing_variations()
        test_case_6_long_narrative_extraction()
        test_case_7_claim_readiness_score_bounds()
        test_case_8_local_engine_latency()
        test_case_9_fastapi_rest_endpoints()

        print("\n" + "=" * 70)
        print("SEMUA PENGUJIAN OTOMATIS LOLOS (ALL TESTS PASSED WITH EXIT CODE 0)")
        print("Sistem terverifikasi andal, deterministik, dan siap disubmisikan.")
        print("=" * 70)
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[FAILED] Asersi gagal: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Kegagalan tak terduga: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
