# MATRIKS INVENSI DAN PENELUSURAN PATEN TERDAHULU (PRIOR ART)
DIREKTORAT JENDERAL KEKAYAAN INTELEKTUAL (DJKI) KEMENKUMHAM RI &
INTEGRATED PATENT MANAGEMENT OFFICE (IPMO) UNIVERSITAS GADJAH MADA

---

## I. PENGANTAR PENELUSURAN PRIOR ART
Berdasarkan penelusuran pada pangkalan data paten global (Google Patents, USPTO, WIPO, dan DJKI), dokumen ini menyajikan komparasi mendalam antara invensi "Smart Medical Notes" dengan paten-paten terdahulu di bidang informatika medis dan pemrosesan bahasa alami klinis. Penelusuran difokuskan pada tiga domain teknologi utama:
1. Sistem ekstraksi dan konversi narasi medis ke struktur SOAP.
2. Sistem rekomendasi entitas klinis dan pelengkapan otomatis (auto-complete) pada EHR/RME.
3. Sistem audit kepatuhan koding klaim asuransi dan deteksi kekurangan dokumentasi medis.

---

## II. MATRIKS KOMPARASI KOMPREHENSIF DENGAN PATEN TERDAHULU

| Parameter Evaluasi | Paten Pembanding 1: Nuance/Microsoft (US11152097B2 / US10950341B2) | Paten Pembanding 2: 3M Innovative Properties (US10650917B2) | Paten Pembanding 3: 3M Health Information Systems (US10121199B2) | Invensi Ini: Smart Medical Notes (UGM / Dr. Lukman dkk.) |
| :--- | :--- | :--- | :--- | :--- |
| **Judul Paten Resmi** | Systems and methods for automated generation of clinical documentation from physician-patient conversations | Context-aware real-time clinical documentation assistance | Computer-assisted coding and clinical documentation deficiency detection | METODE DAN SISTEM PENDUKUNG KEPUTUSAN TERDISTRIBUSI UNTUK EKSTRAKSI DOKUMENTASI MEDIS SOAP DAN VALIDASI KELENGKAPAN KODER SECARA WAKTU NYATA |
| **Pemegang Paten / Asal** | Nuance Communications, Inc. / Microsoft Corporation (Amerika Serikat) | 3M Innovative Properties Company / M*Modal (Amerika Serikat) | 3M Innovative Properties Company (Amerika Serikat) | Universitas Gadjah Mada & Tim Peneliti (Indonesia) |
| **Tahun Publikasi** | 2021 | 2020 | 2018 | 2026 (Pengajuan Baru) |
| **Sumber Masukan Data** | Percakapan audio dokter-pasien via mikrofon (Speech ASR) | Ketikan teks dokter pada field EHR konvensional | Berkas rekam medis lengkap paska-perawatan (discharge chart) | Narasi teks bebas dokter (1 paragraf) atau input teks langsung pada editor SOAP |
| **Metode Pemrosesan Inti** | Speech-to-Text diikuti klasifikasi semantik NLP ke blok SOAP | Model bahasa konteks pasien untuk prediksi kata/frasa berikutnya | Mesin NLP retrospektif untuk menghasilkan kode penagihan ICD-10 | Arsitektur hibrid: Pengurai SOAP (NLP/Regex) + Mesin Aturan Koder Kuantitatif waktu nyata |
| **Fokus & Tujuan Utama** | Mengurangi beban pengetikan dokter dengan transkripsi percakapan pasif | Mempercepat entri data teks dan pencegahan kesalahan klinis umum | Membantu koder rumah sakit memberi kode klaim dan membuat lembar klarifikasi (*query*) | Menjembatani kesenjangan klinis-koder secara preventif di ruang periksa (point-of-care) |
| **Titik Eksekusi Audit** | Tidak ada audit koder klaim asuransi | Saat mengetik teks (namun tanpa logika penjaminan klaim/reimbursement) | Retrospektif (setelah pasien pulang / post-encounter, penundaan 24 jam s.d. berhari-hari) | Waktu nyata (in-line real-time) saat dokter mendokumentasikan SOAP di ruang periksa |
| **Deteksi Variabel Hilang** | Tidak tersedia (hanya mencatat apa yang terucap) | Peringatan protokol klinis umum, bukan variabel pembuktian koder | Menghasilkan kueri retrospektif dokter (*physician query*) jika data hilang | Deteksi proaktif: kewajiban suhu saat demam, tensi saat hipertensi, dengan pertahanan negasi klinis |
| **Disambiguasi Singkatan** | Transkripsi leksikal apa adanya atau standarisasi ucapan | Saran kata berikutnya berbasis probabilitas korpus historis | Mapping kode ICD-10 pada berkas akhir | Resolusi singkatan ambigu kontekstual (misal: "df" menjadi "dengue fever", ICD-10: A97) |
| **Arsitektur Antarmuka** | Panel catatan medis terpadu tanpa kontrol perbaikan koder | Widget pop-up / inline auto-complete standar | Antarmuka modul koder terpisah di unit rekam medis | Antarmuka interaktif 2-Panel: Editor SOAP (kiri) dan Saran Koder dengan Accept/Reject (kanan) |
| **Indikator Kesiapan Klaim** | Tidak ada indikator kuantitatif kelayakan asuransi | Tidak ada indikator kesiapan klaim | Laporan audit berkas klaim paska-koding | Indikator dinamis Skor Kesiapan Dokumen Klaim Asuransi (0% hingga 100%) |
| **Model Distribusi Sistem** | Perangkat lunak monolitik terinstalasi atau integrasi cloud khusus | Modul terikat pada aplikasi EHR tertentu | Aplikasi back-office terpisah untuk divisi keuangan/koder | Layanan API Terpusat multi-tenant (SaaS, serupa model Google Maps API) |

---

## III. ASPEK KEBARUAN (NOVELTY) INVENSI SMART MEDICAL NOTES
Invensi Smart Medical Notes memiliki kebaruan hakiki yang belum pernah diungkapkan dalam publikasi atau paten terdahulu mana pun di dunia:
1. Closed-Loop Real-Time Dual-Panel Architecture:
   Penggabungan simultan antara editor empat kuadran SOAP di panel kiri dengan daftar rekomendasi perspektif koder di panel kanan yang bereaksi secara real-time. Dokter memperoleh visibilitas instan atas implikasi administratif-asuransi dari setiap kata yang diketiknya tanpa meninggalkan alur kerja klinis.
2. Integrasi Hulu-Hilir Terpadu (Point-of-Care Claim Shield):
   Memindahkan mekanisme audit aturan koder klaim (yang pada paten US10121199B2 dilakukan berhari-hari paska-pelayanan di ruang rekam medis) langsung ke meja dokter pada detik-detik dokumentasi disusun, sehingga mengeliminasi *dispute claim* dan *post-encounter query* secara tuntas.
3. Arsitektur API Terpusat Multi-Tenant Berbasis Plugin:
   Menyediakan mesin inferensi SOAP dan aturan koder sebagai layanan mandiri (serupa Google Maps API) yang dapat disematkan ke dalam ratusan vendor RME lokal yang berbeda di fasilitas kesehatan tingkat pertama (FKTP) maupun lanjutan (FKRTL), tanpa perlu merombak basis data inti masing-masing vendor.

---

## IV. ASPEK LANGKAH INVENTIF (INVENTIVE STEP / NON-OBVIOUSNESS)
Bagi seorang ahli di bidang informatika medis (person having ordinary skill in the art / PHOSITA), penggabungan sistem dokumentasi klinis dokter dengan mesin audit aturan koder klaim asuransi bukanlah hal yang nyata atau jelas (non-obvious), karena alasan-alasan teknis berikut:
1. Pemisahan Paradigma Tradisional:
   Dokter dan koder selama puluhan tahun diperlakukan sebagai dua entitas yang terpisah dengan orientasi bahasa yang berlawanan: dokter berorientasi pada narasi fenomena patologis pasien, sementara koder berorientasi pada aturan numerik buku tarif dan klasifikasi statistik (ICD-10/INA-CBG). Membangun sistem yang menerjemahkan orientasi koder menjadi saran aksi interaktif sederhana (Accept/Reject) bagi dokter di ruang periksa menuntut lompatan pemikiran arsitektural.
2. Penjaga Batas Pertahanan Negasi Klinis (Defensive Negation Guard):
   Secara konvensional, mendeteksi kata "demam" akan secara otomatis memicu tuntutan pengisian angka suhu. Namun dalam rekam medis, dokter sering menulis "pasien menyangkal demam", "tidak ada riwayat demam", atau "suhu afebris". Invensi ini menerapkan analisis jendela leksikal kontekstual yang mencegah pemicuan saran palsu (*zero false positive*), menjaga dokter dari gangguan peringatan yang tidak perlu (*alert fatigue*).
3. Mekanisme Fail-Safe Deterministik Berlatensi Rendah:
   Invensi memadukan model bahasa alami berbasis LLM dengan mesin aturan deterministik lokal. Jika koneksi jaringan atau peladen LLM mengalami gangguan, sistem secara otomatis beralih ke engine regex dan kamus aturan terkompilasi yang menjamin respons tetap tersaji dalam waktu kurang dari 200 milidetik, memenuhi kriteria keandalan kritis di lingkungan medis.

---

## V. KESIMPULAN KELAYAKAN PATEN
Berdasarkan perbandingan teknis di atas, invensi "Smart Medical Notes" secara meyakinkan memenuhi seluruh persyaratan substansial paten menurut Undang-Undang No. 13 Tahun 2016 tentang Paten Republik Indonesia:
- Kebaruan (Novelty): Terbukti melalui matriks perbandingan terhadap US11152097B2, US10650917B2, dan US10121199B2.
- Langkah Inventif (Inventive Step): Mengatasi masalah kesenjangan klinis-koder melalui pendekatan hulu terdistribusi yang tidak terduga oleh ahli bidangnya.
- Keterterapan Industri (Industrial Applicability): Terbukti secara fungsional melalui purwarupa antarmuka web dan peladen RESTful API yang siap dioperasionalkan pada berbagai fasilitas pelayanan kesehatan.