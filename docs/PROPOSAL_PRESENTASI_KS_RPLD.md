# DRAF NASKAH SLIDE PRESENTASI PROPOSAL
MATA KULIAH KAPITA SELEKTA REKAYASA PERANGKAT LUNAK DAN DATA (KS RPLD)
DEPARTEMEN ILMU KOMPUTER DAN ELEKTRONIKA - FMIPA UNIVERSITAS GADJAH MADA (2026)

---

## SLIDE 1: JUDUL PROYEK & KESENJANGAN KLINIS-KODER (THE CLINICAL-CODING GAP)

### Informasi Identitas Proyek
- Judul Proyek: Smart Medical Notes: Asisten Rekomendasi Dokumentasi Medis SOAP dan Sistem Validasi Koder Waktu Nyata
- Mata Kuliah: Kapita Selekta Rekayasa Perangkat Lunak dan Data (KS RPLD) - Kelas KOM B
- Kelompok: Partai Pengguling Rezim
- Pembimbing / Konseptor Riset: Dr. Lukman, S.T., M.Cs.

### Susunan Anggota Tim Mahasiswa
1. Rayhan Haldi Hermawan (NIM: 24/545406/PA/23176) - Full-Stack Architecture & Reactive UI/UX Lead
2. Pratama Aji (NIM: 24/533677/PA/22604) - Distributed Systems & API Gateway Lead
3. Ifham Syafwan Fikri (NIM: 24/545184/PA/23161) - Data & NLP Extraction Pipeline Lead
4. Ananda Auliya Rahma (NIM: 24/533691/PA/22608) - Medical Domain & Coder Verification Lead
5. Alifa Batrisyia Nariswari (NIM: 24/535256/PA/22707) - Quality Assurance & Patent Documentation Lead

### Masalah Nyata: Kesenjangan Klinis-Koder di Fasilitas Kesehatan
- Di ruang periksa, dokter menghadapi beban kerja tinggi sehingga mencatat rekam medis secara terburu-buru dalam teks bebas (free-text) dengan singkatan lokal non-standar (misal: "df", "ht", "ispa").
- Di sisi lain, petugas koder rekam medis asuransi (BPJS Kesehatan / INA-CBG) memiliki kewajiban regulasi ketat: setiap kode diagnosis ICD-10 harus didukung bukti klinis objektif yang lengkap (misal: suhu tubuh kuantitatif untuk demam, angka tensi untuk hipertensi).
- Akibatnya: Terjadi perselisihan berkas klaim (dispute claim / pending claim) yang menahan pencairan dana rumah sakit hingga ratusan juta rupiah per bulan.
- Solusi Konvensional Gagal: Formulir statis (banyak checkbox) memicu kelelahan klik (click fatigue), sedangkan audit retrospektif baru menemukan kesalahan setelah pasien pulang.

---

## SLIDE 2: ORISINALITAS RISET & JUSTIFIKASI PATEN PERANGKAT LUNAK DALAM RANAH RPL

### 1. Landasan Orisinalitas Riset Akademik
- Berakar dari disertasi doktoral Dr. Lukman di Kyoto University Graduate School of Informatics (Department of Social Informatics, Medical Informatics Division).
- Khususnya merujuk pada Slide 53 disertasi bertajuk "2020-8-4-Lukman-PhD thesis defence (AIMR).pptx" yang merumuskan konsep antarmuka dua panel: SOAP Note Editor dan Coder's Perspective Suggested Improvement.
- Status Pengajuan Paten di IPMO UGM: Status awal 25% (28 Oktober 2026) berhasil dinaikkan menjadi 100% Draft Ready untuk pendaftaran resmi di DJKI Kemenkumham RI.

### 2. Justifikasi Paten Perangkat Lunak dalam Rekayasa Perangkat Lunak (RPL)
- Diskursus Pembimbing: Sebagaimana ditekankan pada sesi konsultasi, perancangan paten metode dan arsitektur perangkat lunak adalah bagian inti dari rekayasa perangkat lunak modern.
- Analogi Lisensi Industri: Apabila penemu metode Waterfall atau pembuat framework Laravel mematenkan invensinya di awal, setiap implementasi komersial wajib menghargai lisensi metode tersebut.
- Efek Teknis Nyata (Tangible Technical Effect): Smart Medical Notes mematenkan metode komputasi penguraian SOAP terdistribusi, penjaga batas negasi klinis, dan algoritma penegakan aturan koder multi-tenant secara waktu nyata, yang memenuhi syarat Pasal 4 UU No. 13/2016.

---

## SLIDE 3: VISI ARSITEKTUR LAYANAN API TERPUSAT (CENTRALIZED MEDICAL API)

### 1. Filosofi "Google Maps API untuk Rekam Medis"
- Berbeda dari vendor RME tradisional yang bersifat monolitik tertutup, Smart Medical Notes dirancang sebagai penyedia layanan Software-as-a-Service (SaaS) terdistribusi.
- Bekerja serupa Google Maps API: Fasilitas kesehatan atau pengembang RME lokal mana pun di Indonesia cukup memasang plugin JavaScript ringan dan memanggil RESTful API kami untuk memperoleh kemampuan audit koder cerdas.

### 2. Komponen Arsitektur Utama (Merujuk Gambar 1 Paten)
- Klien RME Multi-Tenant [100]: Antarmuka peramban web atau aplikasi desktop klinik.
- Gerbang API (API Gateway) [104]: Pengendali otentikasi faskes, rate limiting, dan routing permintaan data.
- Layanan Pengurai SOAP [106]: Transformasi narasi paragraf dokter menjadi kuadran S, O, A, dan P.
- Mesin Aturan Koder [108]: Penegakan aturan ICD-10 dan verifikasi kelengkapan tanda vital objektif.
- Pangkalan Pengetahuan [110]: Kamus singkatan klinis terstandar dan matriks dependensi simtom.
- Modul Pemformat Rekomendasi [112]: Pembangkit saran perbaikan dan kalkulator skor kesiapan klaim.

---

## SLIDE 4: LOGIKA ATURAN VALIDASI KODER & PERTAHANAN NEGASI KLINIS

### 1. Deteksi Variabel Klinis Esensial yang Hilang (Merujuk Gambar 3 Paten)
- Pemicu Simtom: Menemukan kata kunci keluhan demam/panas pada blok Subjective/Objective.
- Defensive Negation Guard: Menganalisis konteks kalimat sebelum memicu saran. Jika dokter menulis "pasien menyangkal demam" atau "tidak ada panas", sistem memastikan tidak ada saran suhu yang muncul (Zero False Positives).
- Verifikasi Objektif: Jika demam aktif namun angka derajat Celcius tidak terdeteksi pada blok Objective, sistem memunculkan saran: "Add temperature data".

### 2. Disambiguasi Singkatan Klinis Ambigu Kontekstual (Merujuk Gambar 4 Paten)
- Evaluasi Blok Assessment: Mendeteksi singkatan rawan dispute seperti "df", "ht", "ispa", "dm".
- Validasi Konteks: Pada kasus "df", sistem memeriksa simtom demam dan petekia pada S dan O untuk mengonfirmasi bahwa "df" adalah Dengue Fever (ICD-10: A97).
- Payload Penggantian: Menyediakan tindakan penggantian kata secara terstruktur saat tombol Accept ditekan.

---

## SLIDE 5: DESAIN ANTARMUKA REAKTIF DUA PANEL (BERDASARKAN BENTUK UI.PNG)

### 1. Panel Kiri: SOAP Note Editor [Area 502]
- Empat area masukan terpisah (S, O, A, P) dengan label jumlah karakter dinamis.
- Disediakan tombol ekstraksi otomatis: dokter dapat menempelkan satu paragraf narasi bebas, lalu sistem memetakannya ke masing-masing kolom SOAP.
- Tombol aksi: "Periksa Kualitas Rekam Medis" dan "Submit Final ke EHR".

### 2. Panel Kanan: Suggested Improvement [Area 504]
- Mereplikasi tata letak eksperimental slide 53 disertasi Kyoto University secara presisi:
  * Kolom Reject dan Accept dengan tombol kontrol per butir saran.
  * Tombol aksi massal: Clear all, Reject all, dan Accept all.
- Indikator Kesiapan Dokumen Klaim Asuransi [Area 512]:
  * Menampilkan skor dinamis dari 0% hingga 100%.
  * Skor naik menjadi 100% saat dokter menyetujui rekomendasi koder, memberikan kepastian dokumen aman dari penolakan klaim.
- Pemrosesan Kasus Klinis Universal: Mampu memvalidasi seluruh ragam kasus medis langsung melalui teks bebas atau editor SOAP tanpa batasan menu pilihan statis.

---

## SLIDE 6: BUKTI EKSEKUSI & PENGUJIAN OTOMASI ADVERSARIAL (ZERO-ERROR MANDATE)

### 1. Hasil Pengujian Otomatis (test_patent_cases.py)
Skrip pengujian otomatis mandiri dieksekusi melalui terminal dan lolos 100% dengan exit code 0:
- Kasus 1 (Baseline Slide Disertasi): Input "df" + demam tanpa suhu menghasilkan tepat 2 saran ("Add temperature data" dan "Change df to dengue fever").
- Kasus 2 (Hipertensi Primer): Input "ht" tanpa tensi memicu saran penambahan TD dan ekspansi singkatan "ht" ke "hipertensi".
- Kasus 3 (Negasi Klinis): Input "pasien menyangkal demam, tidak ada panas" membuktikan Zero False Positives (saran suhu tidak terpicu).
- Kasus 4 (Masukan Ekstrem Kosong/Spasi): Sistem merespons graceful tanpa crash atau HTTP 500.
- Kasus 5 (Variasi Huruf Kapital): Input "dF", "DF", "Df" konsisten terdeteksi.
- Kasus 6 (Teks Paragraf Panjang): Pemetaan SOAP proporsional tanpa data terpotong.
- Kasus 7 (Validitas Skor Klaim): Skor terbukti selalu berada pada rentang aman 0.0% s.d. 100.0%.
- Kasus 8 (Uji Latensi Mesin Lokal): Eksekusi aturan lokal selesai dalam 12 milidetik (jauh di bawah batas toleransi 200 milidetik).

---

## SLIDE 7: ROADMAP PENGEMBANGAN MVP 7 MINGGU & ALOKASI PERAN KELOMPOK

### 1. Garis Waktu 7 Minggu Menuju Prototipe Teruji
- Minggu 1 (Inisiasi & Riset Paten): Finalisasi draf deskripsi paten lengkap, diagram Gambar 1-5, dan checklist submisi IPMO UGM (Selesai 100%).
- Minggu 2 (Desain Skema Data): Pembakuan skema Pydantic v2 untuk payload SOAP interoperabel (JSON Schema standar FHIR/HL7).
- Minggu 3 (Implementasi REST API): Konstruksi endpoint `/api/v1/extract-soap` dan `/api/v1/validate-coder` pada FastAPI.
- Minggu 4 (Penyelarasan Mesin Aturan): Integrasi kamus 50 singkatan medis ICD-10 dan logika pertahanan negasi klinis.
- Minggu 5 (Integrasi Frontend 2-Panel): Penyempurnaan interaksi reaktif Vanilla JS, kontrol Accept/Reject, dan sinkronisasi skor klaim.
- Minggu 6 (QA Adversarial & Optimasi Performa): Pengujian beban latensi (< 200ms) dan skenario masukan ekstrem.
- Minggu 7 (Uji Usabilitas & Finalisasi Presentasi): Demonstrasi langsung ke koder rekam medis dan finalisasi laporan proyek KS RPLD.

### 2. Komitmen Deliverables
Dokumen paten siap diajukan ke IPMO UGM, purwarupa sistem berjalan stabil, dan kode backend terverifikasi penuh bebas galat (zero-error).
