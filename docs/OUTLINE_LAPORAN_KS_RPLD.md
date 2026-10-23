# Kerangka Dokumen Laporan Proyek Akhir KS RPLD

**Judul Proyek**: Pengembangan Sistem Smart Medical Notes: Asisten Ekstraksi Rekam Medis SOAP dan Validasi Koder Asuransi Berbasis Layanan API Terpusat  
**Mata Kuliah**: Kapita Selekta Rekayasa Perangkat Lunak dan Data (KS RPLD) - Kelas KOM B  
**Kelompok**: Partai Pengguling Rezim  
**Penyusun**: Alifa Batrisyia Nariswari (Technical Writer & QA Lead)  

---

## BAB I: PENDAHULUAN
### 1.1 Latar Belakang
* **Kesenjangan Bahasa Klinis (*The Clinical-Coding Gap*)**: Dokter dituntut bekerja cepat sehingga mencatat diagnosis rekam medis secara naratif dengan singkatan lokal non-standar dan sering kali melewatkan dokumentasi tanda vital objektif. Sebaliknya, petugas koder (*medical coder*) dan verifikator klaim asuransi kesehatan (BPJS/swasta) membutuhkan ketelitian berbasis kode ICD-10 dan data klinis lengkap agar berkas klaim tidak mengalami *pending* atau penolakan (*dispute*).
* **Visi Penelitian Disertasi**: Meneruskan konsep antarmuka eksperimental Dr. Lukman (*PhD Thesis Defense*) yang merancang asisten penulisan rekam medis interaktif serupa *Grammarly for Electronic Health Records*.
* **Urgensi Sistem**: Mengurangi konflik administrasi rekam medis rumah sakit, mempercepat siklus penagihan klaim asuransi (INA-CBG), dan meminimalkan beban kerja kognitif dokter.

### 1.2 Rumusan Masalah
1. Bagaimana merancang arsitektur sistem berbasis web yang mampu memetakan narasi diagnosis bebas dokter ke dalam 4 blok standar SOAP secara otomatis?
2. Bagaimana membangun mesin validasi berbasis aturan (*rule-based engine*) dari perspektif koder untuk mendeteksi singkatan medis ambigu dan ketidaklengkapan tanda vital secara real-time?
3. Bagaimana mengemas sistem ini menjadi layanan API terpusat (*centralized API*) yang siap diintegrasikan ke berbagai sistem Electronic Health Record (EHR)?

### 1.3 Batasan Masalah & Lingkup MVP (7 Minggu)
* Prototipe difokuskan pada antarmuka web 2 panel interaktif (*SOAP editor* dan *suggested improvement*).
* Ekstraksi NLP menggunakan pendekatan terpadu (*hybrid*): LLM dengan *few-shot prompting* terstruktur dan *fallback* heuristik regex klinis.
* Akurasi awal sistem ditargetkan sebagai *Proof of Concept* (PoC fungsional) untuk 5–10 sindrom klinis paling umum di Indonesia.

### 1.4 Tujuan dan Manfaat Proyek

---

## BAB II: LANDASAN TEORI DAN TINJAUAN PUSTAKA
### 2.1 Format Dokumentasi Medis SOAP (*Subjective, Objective, Assessment, Plan*)
### 2.2 Sistem Klasifikasi Penyakit Internasional (ICD-10) dan Regulasi Klaim Asuransi
* Peran petugas rekam medis (*coder*) dalam verifikasi kelayakan klaim.
* Analisis risiko penolakan klaim akibat singkatan ambigu dan ketiadaan tanda vital pendukung.
### 2.3 Pemrosesan Bahasa Alami (*Natural Language Processing*) pada Domain Medis
* Ekstraksi informasi dari teks klinis (*Clinical Information Extraction*).
* Tantangan bahasa campuran (*code-switching*) dokter di Indonesia (bahasa Indonesia, terminologi kedokteran Latin/Inggris, dan jargon lokal).
### 2.4 Konsep Arsitektur Layanan API Terpusat (*Centralized Web Services*)

---

## BAB III: METODOLOGI DAN PERANCANGAN SISTEM
### 3.1 Alur Kerja Rekayasa Perangkat Lunak (Metodologi Agile / 7-Week Sprint)
### 3.2 Arsitektur Sistem Terintegrasi
* **Arsitektur Tingkat Tinggi (*High-Level Architecture*)**: Interaksi antara EHR Klien, Frontend 2 Panel, dan Backend REST API.
* **Diagram Alir Data (*Data Flow Diagram*)**:
  1. Input Paragraf Dokter &rarr; Endpoint Ekstraksi &rarr; JSON SOAP.
  2. Perubahan Form SOAP &rarr; Debounce 400ms &rarr; Endpoint Validator &rarr; Daftar Saran Koder.
  3. Aksi Accept / Reject &rarr; Pembaruan State Reaktif &rarr; Kalkulasi Skor Kesiapan Klaim.
### 3.3 Perancangan Basis Data dan Skema Kontrak API (Pydantic v2 & JSON Schema)
### 3.4 Desain Antarmuka Pengguna (UI/UX) Berbasis Panel Terpisah
* Rancangan Form SOAP Note Editor (S, O, A, P).
* Rancangan Panel Kanan *Coder's Perspective* (Tombol Accept, Reject, Accept All, Clear All).

---

## BAB IV: IMPLEMENTASI DAN EVALUASI SISTEM
### 4.1 Implementasi Komponen Perangkat Lunak
* **Frontend Web Reaktif**: Modular ES Modules, Fetch API Client dengan AbortController, dan Reactive Store.
* **Backend REST API**: FastAPI, CORS Middleware, Swagger UI Interactive Documentation.
* **Pipeline NLP & Mesin Aturan Medis**: Integrasi LLM Few-Shot, dataset 22 singkatan klinis ICD-10, dan matriks tanda vital wajib.
### 4.2 Prosedur Pengujian Perangkat Lunak
* Pengujian Fungsionalitas Modul (*Black-Box Testing*).
* Eksekusi 10 Kasus Uji Klinis Autentik (*10 Authentic Clinical Test Cases*).
### 4.3 Analisis Hasil dan Pembahasan
* **Akurasi Ekstraksi Teks Bebas ke SOAP**: Keberhasilan pemisahan keluhan subjektif, temuan fisik objektif, diagnosis, dan terapi.
* **Efektivitas Saran Koder**: Tingkat koreksi singkatan ambigu dan penyisipan nilai tanda vital.
* **Metrik Evaluasi Kesiapan Klaim (*Insurance Readiness Score*)**: Kenaikan skor dari rata-rata 30%–50% saat input awal menjadi 100% setelah seluruh rekomendasi diterima (*accepted*).

---

## BAB V: KESIMPULAN DAN SARAN PENGEMBANGAN
### 5.1 Kesimpulan
* Keberhasilan merealisasikan prototipe fungsional (MVP) Smart Medical Notes dalam kurun waktu 7 minggu sesuai arahan bimbingan.
* Sistem terbukti mampu menjembatani perbedaan perspektif antara pencatatan cepat dokter dengan kebutuhan kelengkapan koder asuransi.
### 5.2 Saran dan Rencana Pengembangan Lanjutan
* Integrasi standar interoperabilitas kesehatan internasional (HL7 FHIR).
* Penambahan modul Speech-to-Text (ASR) langsung saat dokter melakukan anamnesis dengan pasien.
* Pelatihan model bahasa lokal (*fine-tuning small clinical LLM*) yang di-hosting langsung di server lokal rumah sakit untuk kepatuhan privasi data medis (HIPAA/UU PDP).
