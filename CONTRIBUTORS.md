# SUSUNAN TIM PENELITI, INVENTOR, DAN KONTRIBUTOR PROYEK
MATA KULIAH KAPITA SELEKTA REKAYASA PERANGKAT LUNAK DAN DATA (KS RPLD)
DEPARTEMEN ILMU KOMPUTER DAN ELEKTRONIKA - FMIPA UNIVERSITAS GADJAH MADA

---

## I. IDENTITAS PROYEK
- Nama Proyek: Smart Medical Notes
- Kelas: KOM B
- Nama Kelompok: Partai Pengguling Rezim
- Status Invensi: 100% Draft Ready - Pendaftaran Paten Terpadu IPMO UGM & DJKI Kemenkumham RI
- Asal Usul Riset: Hilirisasi Disertasi Doktoral Kyoto University Graduate School of Informatics (Dr. Lukman, 2020)

---

## II. PEMBINA RISET & KONSEPTOR UTAMA (PRINCIPAL INVENTOR)

| Nama Lengkap & Gelar | NIP / Identitas | Institusi | Peran dalam Proyek |
| :--- | :--- | :--- | :--- |
| **Dr. Lukman, S.T., M.Cs.** | 197805122005011002 | Departemen Ilmu Komputer dan Elektronika FMIPA UGM / Kyoto University Alumnus | Lead Researcher / Inventor Utama (Konseptor Model Antarmuka Rekam Medis Dua Panel, Perumus Landasan Teoretis Disertasi, Pembimbing Utama) |

---

## III. DIVISI FUNGSIONAL & SUSUNAN MAHASISWA PENGEMBANG

### 1. Divisi Purwarupa & Integrasi Backend/UI (Full-Stack & Reactive UI/UX)
- **Koordinator**: Rayhan Haldi Hermawan (NIM: `24/545406/PA/23176`)
- **Tanggung Jawab Fungsional**:
  * Mengembangkan antarmuka pengguna web reaktif 2-panel (`prototype/index.html` dan `prototype/app.js`) yang mereplikasi secara presisi rancangan eksperimental slide 53 disertasi Kyoto University.
  * Mengintegrasikan kontrol aksi per butir (radio button Reject/Accept) dan aksi massal (Clear all, Reject all, Accept all).
  * Mengimplementasikan visualisasi skor kesiapan dokumen klaim asuransi dinamis (0-100%).
  * Membangun server RESTful API berbasis FastAPI (`server/app/main.py`) dan routing layanan mikro SOAP.

### 2. Divisi Arsitektur & Diagram Sistem (Distributed Systems & NLP Pipeline)
- **Koordinator Arsitektur**: Pratama Aji (NIM: `24/533677/PA/22604`)
- **Koordinator NLP**: Ifham Syafwan Fikri (NIM: `24/545184/PA/23161`)
- **Tanggung Jawab Fungsional**:
  * Merancang arsitektur sistem terdistribusi multi-tenant terpusat (*Centralized Medical API*) ala Google Maps API.
  * Menyusun berkas Gambar Teknik Paten 1 hingga 5 (`docs/patent/02_DIAGRAM_TEKNIK_PATEN.md`) dalam format diagram Mermaid dan ASCII formal monokrom dengan indeks penomoran rujukan 100 s.d. 512.
  * Membangun pipeline ekstraksi narasi bebas ke struktur 4 kuadran SOAP (`server/app/services/extractor_service.py` dan `llm_extractor.py`) dengan prompt few-shot dan fallback regex heuristik.

### 3. Divisi Spesifikasi Hukum Paten & Penjaminan Mutu (Patent Engineering & QA)
- **Koordinator Domain Medis**: Ananda Auliya Rahma (NIM: `24/533691/PA/22608`)
- **Koordinator QA & Paten**: Alifa Batrisyia Nariswari (NIM: `24/535256/PA/22707`)
- **Tanggung Jawab Fungsional**:
  * Menyusun naskah Deskripsi Paten Lengkap DJKI (`docs/patent/01_DESKRIPSI_PATEN_LENGKAP.md`), Perumusan Klaim 1 s.d. 10 bebas penolakan Pasal 4 UU No. 13/2016, dan Abstrak Resmi.
  * Menyusun Matriks Invensi dan Penelusuran Prior Art Google Patents (`docs/patent/03_MATRIKS_INVENSI_DAN_PRIOR_ART.md`) terhadap paten global Nuance, 3M, dan Optum.
  * Mengembangkan mesin aturan koder (`server/app/services/rules_engine.py`) dengan pertahanan negasi klinis (*Defensive Negation Guard*).
  * Mengonstruksi dan mengeksekusi test suite otomatis 8 skenario batas (`server/test_patent_cases.py`) dengan jaminan exit code 0 dan latensi < 200ms.
  * Mengelola checklist kelengkapan pengajuan paten terpadu IPMO UGM (`docs/patent/04_CHECKLIST_DJKI_IPMO_UGM.md`).

---

## IV. MATRIKS DISTRIBUSI TUGAS & TANGGUNG JAWAB

| Komponen Sistem / Berkas | Lead Developer / Penanggung Jawab | Reviewer / Verifikator |
| :--- | :--- | :--- |
| `docs/patent/01_DESKRIPSI_PATEN_LENGKAP.md` | Alifa Batrisyia Nariswari | Dr. Lukman, S.T., M.Cs. |
| `docs/patent/02_DIAGRAM_TEKNIK_PATEN.md` | Pratama Aji | Rayhan Haldi Hermawan |
| `docs/patent/03_MATRIKS_INVENSI_DAN_PRIOR_ART.md` | Ananda Auliya Rahma | Alifa Batrisyia Nariswari |
| `docs/patent/04_CHECKLIST_DJKI_IPMO_UGM.md` | Alifa Batrisyia Nariswari | Dr. Lukman, S.T., M.Cs. |
| `docs/PROPOSAL_PRESENTASI_KS_RPLD.md` | Seluruh Tim Mahasiswa | Dr. Lukman, S.T., M.Cs. |
| `server/app/main.py` & `soap_router.py` | Rayhan Haldi Hermawan | Pratama Aji |
| `server/app/services/rules_engine.py` | Ananda Auliya Rahma | Alifa Batrisyia Nariswari |
| `server/app/services/extractor_service.py` | Ifham Syafwan Fikri | Rayhan Haldi Hermawan |
| `server/test_patent_cases.py` | Alifa Batrisyia Nariswari | Seluruh Tim Mahasiswa |
| `prototype/index.html` & `prototype/app.js` | Rayhan Haldi Hermawan | Ananda Auliya Rahma |
