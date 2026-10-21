# Smart Medical Notes - MVP Prototipe KS RPLD

Prototipe antarmuka asisten cerdas rekam medis berbasis struktur SOAP (*Subjective, Objective, Assessment, Plan*) dan sistem rekomendasi koder (*Coder's Perspective Improvement*).

Proyek ini merealisasikan visi penelitian disertasi Dr. Lukman untuk memfasilitasi pembuatan catatan medis yang terstruktur, bebas singkatan ambigu, serta memenuhi kelengkapan data klinis untuk mempermudah klaim asuransi kesehatan.

---

## Informasi Kelompok & Pengembang

* **Mata Kuliah**: Kapita Selekta Rekayasa Perangkat Lunak dan Data (KS RPLD)
* **Kelas**: KOM B
* **Nama Proyek**: Smart Medical Notes
* **Nama Kelompok**: Partai Pengguling Rezim

### Anggota Tim

| No. | NIM | Nama Mahasiswa |
| :---: | :--- | :--- |
| 1 | `24/545406/PA/23176` | Rayhan Haldi Hermawan |
| 2 | `24/533677/PA/22604` | Pratama Aji |
| 3 | `24/545184/PA/23161` | Ifham Syafwan Fikri |
| 4 | `24/533691/PA/22608` | Ananda Auliya Rahma |
| 5 | `24/535256/PA/22707` | Alifa Batrisyia Nariswari |

---

## 1. Fitur Utama Prototipe

1. **SOAP Note Editor (2-Panel Layout)**:
   - Panel kiri menyajikan editor 4 blok: *Subjective*, *Objective*, *Assessment*, dan *Plan*.
   - Mengikuti tata letak rancangan antarmuka eksperimental pada slide disertasi (`Dokumentasi.jpeg`).
2. **Coder's Perspective (Suggested Improvement List)**:
   - Menghasilkan saran perbaikan otomatis secara real-time.
   - Deteksi singkatan medis ambigu (contoh: ekspansi otomatis `df` menjadi `dengue fever`).
   - Deteksi kelengkapan tanda vital (contoh: mendeteksi keluhan demam namun belum mencantumkan angka suhu tubuh pada Objective).
   - Tombol interaksi per butir: **Accept** (langsung menyisipkan/mengganti teks pada kolom terkait) dan **Reject**.
   - Tombol aksi massal: **Accept all**, **Reject all**, dan **Clear all**.
3. **Ekstraksi Narasi Bebas ke SOAP**:
   - Dokter cukup mengetik/menempelkan 1 paragraf diagnosis lengkap, lalu sistem memetakan kalimat ke blok S, O, A, dan P secara otomatis.
4. **Indikator Kesiapan Dokumen Klaim Asuransi**:
   - Menghitung skor kepatuhan dan kelayakan klaim asuransi secara dinamis berdasarkan saran yang telah diselesaikan.

---

## 2. Struktur Berkas

```
Smart Medical Notes/
├── CONTRIBUTORS.md        # Susunan anggota tim & kontributor proyek
├── README.md              # Dokumentasi teknis & panduan uji
└── prototype/
    ├── index.html         # Antarmuka web responsif 2-kolom
    ├── style.css          # Gaya visual & animasi highlight interaktif
    └── app.js             # Engine analisis aturan medis & manajemen state
```

---

## 3. Cara Menjalankan

Prototipe ini dibuat murni berbasis standar web (HTML5, Tailwind CSS, Vanilla JS) tanpa ketergantungan *build tool* tambahan.

1. Buka berkas [`prototype/index.html`](prototype/index.html) langsung di peramban web (Chrome, Edge, Firefox).
2. Atau jalankan server lokal sederhana melalui terminal:
   ```powershell
   cd "Akademik\KS RPLD\Smart Medical Notes\prototype"
   python -m http.server 8000
   ```
   Lalu akses `http://localhost:8000` di peramban.

---

## 4. Skenario Uji Coba Demo

Pilih menu dropdown **Pilih Kasus Uji** di bilah atas:

| Skenario | Deskripsi Input Awal | Rekomendasi yang Muncul | Hasil Setelah Klik *Accept all* |
| :--- | :--- | :--- | :--- |
| **Kasus 1: Demam Berdarah (Slide Disertasi)** | S: demam & bintik merah<br>O: petekia, nadi 120<br>A: `df`<br>P: infus RL | 1. *Add temperature data* (O)<br>2. *Change df to dengue fever* (A) | Suhu tubuh tersisip pada O, diagnosis A menjadi `dengue fever`. Skor kesiapan naik ke 100%. |
| **Kasus 2: ISPA & Demam** | S: batuk berdahak & demam<br>O: faring hiperemis<br>A: `ispa`<br>P: paracetamol | 1. Tambah data suhu tubuh (O)<br>2. Perjelas istilah ISPA (A) | Data tanda vital lengkap dan diagnosis baku rekam medis terisi. |
| **Kasus 3: Hipertensi** | S: tengkuk kaku & nyeri kepala<br>O: nadi 88<br>A: `ht`<br>P: amlodipine | 1. Tambah nilai tekanan darah (O)<br>2. Ubah `ht` jadi hipertensi (A) | Tekanan darah tensi tersisip, singkatan diubah resmi. |

---

## 5. Rencana Pengembangan Lanjutan (Roadmap KS RPLD)

1. **Minggu 1–2**: Validasi prototipe antarmuka dan penyusunan skema data JSON standar FHIR / SOAP.
2. **Minggu 3–4**: Pembuatan backend REST API (FastAPI/Python) untuk endpoint parser SOAP dan mesin aturan ICD-10.
3. **Minggu 5–6**: Integrasi LLM (OpenAI/Gemini API) untuk ekstraksi narasi bahasa Indonesia yang lebih adaptif.
4. **Minggu 7**: Pengujian usabilitas bersama koder rekam medis dan finalisasi laporan proyek.
