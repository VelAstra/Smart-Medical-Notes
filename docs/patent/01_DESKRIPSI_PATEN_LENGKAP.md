# SURAT SPESIFIKASI PATEN INDONESIA
DIREKTORAT JENDERAL KEKAYAAN INTELEKTUAL (DJKI) KEMENTERIAN HUKUM DAN HAM REPUBLIK INDONESIA
DIREKTORAT INOVASI DAN PUSAT UNGGULAN UNIVERSITAS / INTEGRATED PATENT MANAGEMENT OFFICE (IPMO) UNIVERSITAS GADJAH MADA

---

## JUDUL INVENSI
METODE DAN SISTEM PENDUKUNG KEPUTUSAN TERDISTRIBUSI UNTUK EKSTRAKSI DOKUMENTASI MEDIS SOAP DAN VALIDASI KELENGKAPAN KODER SECARA WAKTU NYATA

---

## BIDANG TEKNIK INVENSI
Invensi ini secara umum berhubungan dengan bidang sistem informasi kesehatan dan rekayasa perangkat lunak klinis. Secara lebih khusus, invensi ini berkaitan dengan metode komputasi dan arsitektur sistem terdistribusi berbasis antarmuka pemrograman aplikasi (Application Programming Interface / RESTful API) yang mengintegrasikan teknik pemrosesan bahasa alami (Natural Language Processing / NLP) untuk mentransformasikan teks naratif medis bebas menjadi struktur catatan SOAP (Subjective, Objective, Assessment, Plan), serta mengevaluasi dan memvalidasi kepatuhan dokumentasi klinis secara waktu nyata (real-time) dari perspektif petugas koder medis guna standardisasi klasifikasi penyakit (ICD-10) dan optimalisasi kelayakan klaim asuransi kesehatan elektronik.

---

## LATAR BELAKANG INVENSI DAN MASALAH TEKNIK

### 1. Kesenjangan Klinis-Koder (The Clinical-Coding Gap)
Dalam operasional harian fasilitas pelayanan kesehatan (rumah sakit, puskesmas, dan klinik), interaksi terapeutik antara dokter dan pasien harus didokumentasikan dalam Rekam Medis Elektronik (RME). Namun demikian, terdapat disparitas kognitif dan operasional yang mendalam antara kebutuhan dokter di ruang periksa (point-of-care) dengan kebutuhan petugas koder rekam medis (clinical coder) di unit penjaminan asuransi kesehatan (seperti BPJS Kesehatan / INA-CBG di Indonesia).

Dokter memiliki beban kognitif tinggi dan keterbatasan waktu pelayanan, sehingga cenderung mendokumentasikan diagnosis secara tergesa-gesa menggunakan catatan teks bebas (free-text narrative) yang sarat dengan singkatan klinis lokal, tidak baku, atau ambigu. Di sisi lain, petugas koder asuransi memegang mandat legal-administratif ketat: setiap kode diagnosis primer dan sekunder (berbasis International Classification of Diseases, ICD-10) serta kode prosedur tindakan (ICD-9-CM) wajib didukung oleh bukti klinis objektif yang sah, lengkap, dan eksplisit.

Sebagai contoh nyata, dokter sering menuliskan diagnosis kerja berupa singkatan "df" tanpa merinci apakah istilah tersebut mengacu pada *Dengue Fever* (ICD-10: A97 / A90), *Dengue Fracture*, atau *Dysfunctional*. Selain itu, dokter kerap mencatat gejala "anak demam tinggi disertai bintik merah", namun pada kolom pemeriksaan fisik objektif tidak menyertakan angka kuantitatif pengukuran suhu tubuh (misalnya 38.5 derajat Celcius). Ketiadaan data kuantitatif tersebut menyebabkan berkas klaim asuransi dikembalikan atau ditolak (*dispute claim* / *pending claim*) oleh pihak verifikator BPJS/asuransi komersial karena dianggap tidak memenuhi kelayakan medis untuk justifikasi rawat inap atau pemberian terapi cairan intravena.

### 2. Keterbatasan Pendekatan Konvensional
Upaya standardisasi yang ada saat ini umumnya mengandalkan dua pendekatan ekstrem yang masing-masing memiliki kelemahan mendasar:
1. Formulir Statis Berbasis Template Ketat: Penerapan RME dengan kolom isian berulang, kotak centang (*checkbox*), atau tombol radio (*radio button*) memaksa dokter melakukan klik berkali-kali. Pendekatan ini terbukti memicu *click fatigue*, mengalihkan perhatian dokter dari pasien, dan justru menurunkan kualitas anamnesis.
2. Audit Dokumen Retrospektif: Proses verifikasi kelengkapan rekam medis konvensional baru dilakukan berhari-hari setelah pasien pulang oleh petugas rekam medis. Apabila ditemukan data tanda vital yang hilang atau singkatan ambigu, petugas koder terpaksa melakukan klarifikasi ulang kepada dokter penanggung jawab pelayanan (DPJP) yang sering kali sudah lupa detail pasien atau sedang tidak bertugas, sehingga memperlambat siklus penagihan klaim rumah sakit secara signifikan.

### 3. Masalah Teknik yang Diselesaikan
Belum tersedianya suatu sistem yang mampu menjembatani kebebasan dokter menulis narasi klinis natural dengan kepatuhan format terstruktur SOAP dan validasi kelengkapan aturan koder secara waktu nyata pada saat dokumentasi sedang disusun. Kebutuhan tersebut menuntut adanya sistem terpusat berskala *Software-as-a-Service* (SaaS) multi-tenant yang dapat diintegrasikan dengan beragam vendor RME lokal melalui mekanisme *plugin*, mampu memproses masukan teks bebas, mengekstrak secara cerdas ke kuadran SOAP, mendeteksi variabel esensial yang hilang dengan pencegahan positif palsu (*zero false positive* pada negasi klinis), serta menyajikan daftar rekomendasi interaktif dua panel yang memberi kendali penuh kepada dokter untuk menerima atau menolak saran sebelum berkas disimpan.

---

## RINGKASAN INVENSI

Guna mengatasi permasalahan teknik di atas, invensi ini menghadirkan suatu metode dan sistem pendukung keputusan terdistribusi yang bekerja secara sinkron dan asinkron untuk mentransformasikan dokumentasi medis bebas menjadi dokumen berstandar koder asuransi.

Sistem terdiri atas antarmuka dua panel interaktif yang terhubung melalui jaringan komunikasi dengan server pemroses pusat. Pada sisi masukan, sistem menerima narasi teks bebas atau isian pada editor catatan SOAP. Sistem mengimplementasikan modul pengurai (SOAP Parsing Service) berbasis pemrosesan bahasa alami yang memecah kalimat naratif ke dalam empat kuadran klinis terpisah: Subjective (S), Objective (O), Assessment (A), dan Plan (P).

Secara terintegrasi, blok teks SOAP tersebut diproses oleh Mesin Aturan Koder (Coder Rule Engine) yang terhubung ke Pangkalan Pengetahuan ICD-10 dan Matriks Tanda Vital Esensial. Mesin aturan koder melakukan dua analisis utama:
1. Validasi Variabel Klinis Esensial yang Hilang: Memindai kemunculan entitas keluhan/simtom pada blok Subjective dan Objective, memverifikasi tidak adanya negasi klinis (misalnya memastikan pasien tidak sedang menyatakan "menyangkal demam" atau "tidak ada panas"), dan memverifikasi keberadaan data kuantitatif tanda vital terkait pada blok Objective (misalnya nilai kuantitatif suhu tubuh saat terindikasi demam, atau nilai kuantitatif tekanan darah saat terindikasi hipertensi).
2. Disambiguasi Singkatan Klinis Ambigu Kontekstual: Mengidentifikasi singkatan medis non-standar (seperti "df", "ht", "ispa", "dm") pada blok Assessment dan memetakannya ke terminologi baku serta kode klasifikasi ICD-10 yang relevan berdasarkan konteks simtom pada blok Subjective dan pemeriksaan pada blok Objective.

Hasil analisis mesin aturan koder kemudian diformat menjadi daftar rekomendasi perbaikan (Suggested Improvement) yang disajikan pada panel kanan antarmuka pengguna, dilengkapi dengan kontrol aksi per butir berupa tombol persetujuan (Accept) dan tombol penolakan (Reject), tombol aksi massal (Accept all, Reject all, Clear all), serta indikator visual tingkat kesiapan dokumen klaim asuransi (Claim Readiness Score) yang terhitung secara dinamis dari 0 hingga 100 persen. Apabila pengguna menekan tombol Accept, sistem secara otomatis melakukan pembaruan atomik pada kolom teks terkait tanpa merusak tanda baca yang ada.

---

## URAIAN SINGKAT GAMBAR PATEN

Penjelasan invensi ini dilengkapi dengan gambar-gambar teknik resmi sebagai berikut:

- GAMBAR 1 adalah diagram blok arsitektur sistem terdistribusi pendukung keputusan dokumentasi medis SOAP dan validasi koder sesuai dengan perwujudan invensi ini, yang memperlihatkan interkoneksi antara klien RME multi-tenant, gerbang API, modul pengurai SOAP, mesin aturan koder, pangkalan pengetahuan, dan pemformat rekomendasi.
- GAMBAR 2 adalah diagram alir metode pengolahan data ujung-ke-ujung (end-to-end) dari penerimaan narasi bebas klinis hingga pembaruan dan penyimpanan catatan SOAP terstruktur pada basis data RME.
- GAMBAR 3 adalah diagram alir logika deteksi variabel klinis esensial yang hilang disertai penjaga batas pertahanan negasi klinis.
- GAMBAR 4 adalah diagram alir metode disambiguasi singkatan medis ambigu kontekstual berbasis pemetaan terminologi baku ICD-10.
- GAMBAR 5 adalah representasi skematik antarmuka pengguna dua panel interaktif yang merefleksikan tata letak editor catatan SOAP pada panel kiri dan daftar rekomendasi perspektif koder pada panel kanan.

---

## URAIAN LENGKAP INVENSI

Merujuk pada GAMBAR 1, arsitektur sistem pendukung keputusan terdistribusi menurut perwujudan invensi ini mencakup sekurang-kurangnya satu Klien RME [100] yang beroperasi pada fasilitas pelayanan kesehatan. Klien RME [100] dapat berupa aplikasi berbasis web, aplikasi desktop, atau aplikasi peramban terintegrasi yang digunakan oleh dokter di ruang periksa. Klien RME [100] terhubung melalui Jaringan Komunikasi Internet [102] dengan infrastruktur peladen terpusat yang diawali oleh Gerbang API (API Gateway) [104].

Gerbang API [104] berfungsi sebagai pintu masuk komunikasi RESTful multi-tenant yang aman, mengelola otentikasi kunci akses faskes, penyeimbangan beban (*load balancing*), serta mengarahkan muatan data (*payload*) menuju Layanan Pengurai SOAP (SOAP Parsing Service) [106] dan Mesin Aturan Koder (Coder Rule Engine) [108]. Mesin Aturan Koder [108] memiliki akses langsung ke Pangkalan Pengetahuan ICD-10 dan Matriks Tanda Vital [110], yang memuat kamus terminologi medis baku, pola ekspresi reguler singkatan klinis, rentang nilai normal parameter fisiologis, dan relasi dependensi antara simtom dengan tanda vital wajib. Keluaran dari Mesin Aturan Koder [108] dihimpun oleh Modul Pemformat Rekomendasi (Formatter Rekomendasi) [112] untuk menghasilkan struktur data JSON terstandar yang dikembalikan kepada Klien RME [100].

Merujuk pada GAMBAR 2, metode pengolahan data dokumentasi klinis diimplementasikan melalui tahapan komputasi terurut sebagai berikut:
- Pada Langkah 200, sistem menerima masukan string teks narasi klinis bebas dari dokter melalui antarmuka Klien RME [100].
- Pada Langkah 202, string narasi dikirimkan melalui Jaringan Internet [102] menuju API Gateway [104] dalam format permintaan HTTP POST.
- Pada Langkah 204, Layanan Pengurai SOAP [106] menguraikan string narasi tersebut menjadi empat blok data terpisah: Subjective (S), Objective (O), Assessment (A), dan Plan (P). Uraian ini memanfaatkan model bahasa alami terstruktur atau cadangan heuristik berbasis pola tanda baca dan penanda leksikal kedokteran.
- Pada Langkah 206, keempat blok teks SOAP dievaluasi secara serempak oleh Mesin Aturan Koder [108] dengan mencocokkan konten terhadap Pangkalan Pengetahuan [110].
- Pada Langkah 208, sistem mengidentifikasi ketidaksesuaian koder (seperti singkatan non-standar dan tanda vital yang belum dicantumkan) dan membangkitkan daftar rekomendasi perbaikan spesifik.
- Pada Langkah 210, sistem mengkalkulasi Skor Kesiapan Klaim Asuransi (Claim Readiness Score) secara dinamis dengan formula bobot kepatuhan.
- Pada Langkah 212, daftar rekomendasi dan skor kesiapan dikirimkan kembali dan dirender pada panel kanan antarmuka pengguna Klien RME [100].
- Pada Langkah 214, sistem memantau interaksi pengguna terhadap tombol kontrol aksi: dokter dapat menekan tombol Accept untuk mengadopsi saran tertentu atau tombol Reject untuk mengabaikan saran.
- Pada Langkah 216, setelah seluruh perbaikan yang disetujui terintegrasi ke dalam editor catatan SOAP dan dokter menekan tombol Submit, catatan medis final disimpan ke dalam basis data rekam medis elektronik.

Merujuk pada GAMBAR 3, logika deteksi variabel klinis tanda vital esensial yang hilang bekerja sebagai berikut:
- Pada Langkah 300, Mesin Aturan Koder [108] memindai string teks pada blok Subjective dan Objective untuk menemukan token simtom klinis (misalnya leksikon: "demam", "panas", "fever", "meriang").
- Pada Langkah 302, sistem menguji apakah token simtom tersebut terdeteksi. Apabila tidak ditemukan simtom relevan, alur beralih ke Langkah 312 di mana status pemeriksaan tanda vital dinyatakan lengkap / tidak bermasalah.
- Apabila token simtom terdeteksi, pada Langkah 304 sistem menjalankan Penjaga Batas Negasi Klinis (*Defensive Negation Guard*). Modul ini menganalisis jendela konteks mendahului (preceding context) sepanjang 1 hingga 5 kata sebelum token simtom untuk memeriksa keberadaan leksikon negasi seperti "tidak", "tidak ada", "menyangkal", "tanpa", "bebas", "denies", atau "no". Jika terdeteksi kondisi negasi (misalnya: "pasien menyangkal demam" atau "tidak ada panas"), sistem menyimpulkan bahwa pasien tidak menderita kondisi tersebut sehingga alur diarahkan ke Langkah 312 untuk mencegah alarm palsu (*zero false positive*).
- Apabila kondisi negasi tidak ditemukan (artinya pasien benar-benar mengalami demam), sistem melanjutkan ke Langkah 306 untuk memindai blok Objective guna menemukan entitas numerik kuantitatif tanda vital (misalnya pola angka suhu tubuh dengan rentang 35.0 hingga 42.0 derajat Celcius).
- Pada Langkah 308, sistem mengevaluasi apakah nilai numerik suhu tubuh ditemukan. Jika ditemukan angka suhu yang valid, alur menuju Langkah 312.
- Sebaliknya, jika angka suhu tidak ditemukan pada blok Objective, sistem melanjutkan ke Langkah 310 dengan membangkitkan rekomendasi: "Add temperature data" (Kategori: Kelengkapan Tanda Vital, Target Field: 'O', Tindakan: Append nilai draf terukur).

Merujuk pada GAMBAR 4, alur kerja disambiguasi singkatan medis kontekstual berlangsung sebagai berikut:
- Pada Langkah 400, Mesin Aturan Koder [108] membaca seluruh token kata pada blok Assessment.
- Pada Langkah 402, setiap token dicocokkan dengan entri singkatan pada Pangkalan Pengetahuan [110] dengan sifat pencocokan tidak peka huruf besar/kecil (*case-insensitive*) dan batas kata (*word boundary*).
- Pada Langkah 404, diuji apakah token merupakan singkatan ambigu terdaftar (misalnya "df", "ht", "ispa", "dm", "tbc"). Jika tidak ditemukan singkatan, proses beralih ke Langkah 412 (tidak ada saran singkatan).
- Apabila ditemukan singkatan ambigu (misalnya "df"), pada Langkah 406 sistem melakukan analisis konteks simtom pendukung dari blok Subjective dan Objective. Sistem memeriksa apakah terdapat simtom demam, bintik merah, ruam kulit, petekia, atau trombositopenia.
- Pada Langkah 408, sistem mengonfirmasi bahwa konteks klinis mendukung diagnosis *Dengue Fever*, menetapkan istilah resmi "Dengue Fever", dan mengaitkannya dengan kode klasifikasi ICD-10 A97 / A90.
- Pada Langkah 410, sistem menyusun muatan rekomendasi (*replacement payload*) dengan tipe aksi 'replace', target kata 'df', dan kata pengganti resmi "Dengue Fever".
- Pada Langkah 412, rekomendasi disajikan pada antarmuka pengguna sebagai butir saran yang dapat diterima langsung dengan satu kali klik.

Merujuk pada GAMBAR 5, antarmuka pengguna dua panel mencakup:
- Area 502: Panel Kiri (SOAP Note Editor) yang memuat empat area masukan teks terpisah untuk blok Subjective, Objective, Assessment, dan Plan, disertai label jumlah karakter dan penanda visual interaktif.
- Area 504: Panel Kanan (Suggested Improvement / Coder's Perspective) yang menampilkan kartu-kartu rekomendasi aktif hasil analisis waktu nyata.
- Area 506: Kontrol Aksi per butir saran yang menyediakan tombol Reject (menolak saran) dan tombol Accept (menerima saran dan menyisipkan atau menggantikan teks pada Area 502 secara atomik).
- Area 508: Tombol Submit Final untuk mengirimkan catatan medis yang telah diverifikasi menuju peladen RME.
- Area 510: Kontrol Aksi Massal yang mencakup tombol Clear all, Reject all, dan Accept all untuk efisiensi alur kerja dokter saat menangani banyak saran sekaligus.
- Area 512: Bilah Indikator Skor Kesiapan Dokumen Klaim Asuransi yang menampilkan persentase kepatuhan secara visual dan numerik (0% hingga 100%).

---

## STUDI KASUS IMPLEMENTASI KLINIS RIIL

Untuk membuktikan keandalan teknis dan penerapan praktis dari metode yang diusulkan, berikut diuraikan dua studi kasus klinis riil:

### Studi Kasus 1: Balita dengan Demam Berdarah (Acuan Riset Kyoto University)
- Karakteristik Pasien: Pasien anak berusia 3 tahun dibawa ke klinik dengan keluhan demam dan bintik-bintik merah pada kulit.
- Masukan Narasi Bebas Dokter:
  "patient 3 years old has fever, red spots on the skin. petechia on skin, strong pulse 120. df. intravenous fluid ringer lactate."
- Hasil Ekstraksi Modul Pengurai SOAP [106]:
  * S: "patient 3 years old has fever, red spots on the skin"
  * O: "petechia on skin, strong pulse 120"
  * A: "df"
  * P: "intravenous fluid ringer lactate"
- Hasil Evaluasi Mesin Aturan Koder [108]:
  1. Deteksi Variabel Hilang (Langkah 300-310): Keluhan "fever" pada S memicu verifikasi suhu tubuh pada O. Karena O hanya mencatat petekia dan denyut nadi 120 tanpa angka suhu Celcius, dibangkitkan Saran 1: "Add temperature data" (Target: O, Payload: "temperature: 38.8 C").
  2. Disambiguasi Singkatan (Langkah 400-410): Token "df" pada A dicocokkan ke kamus singkatan. Konteks simtom "fever" dan "petechia" mengonfirmasi penyakit Dengue Fever (ICD-10: A97). Dibangkitkan Saran 2: "Change df to dengue fever" (Target: A, Payload: "dengue fever").
- Skor Kesiapan Klaim Awal: 50%.
- Interaksi Dokter: Dokter menekan tombol "Accept all" pada Area 510.
- Kondisi Akhir Catatan SOAP:
  * S: "patient 3 years old has fever, red spots on the skin"
  * O: "petechia on skin, strong pulse 120, temperature: 38.8 C"
  * A: "dengue fever"
  * P: "intravenous fluid ringer lactate"
- Skor Kesiapan Klaim Akhir: 100% (Dokumen sah untuk klaim pembiayaan rawat inap INA-CBG).

### Studi Kasus 2: Pasien Dewasa dengan Hipertensi Primer
- Karakteristik Pasien: Pasien dewasa 52 tahun datang dengan keluhan sakit kepala belakang dan leher tegang.
- Masukan Dokter pada Editor SOAP:
  * S: "pasien mengeluh tengkuk kaku dan nyeri kepala belakang sejak semalam"
  * O: "nadi 84x/m reguler, edema tungkai (-)"
  * A: "ht"
  * P: "amlodipine 10mg"
- Hasil Evaluasi Mesin Aturan Koder [108]:
  1. Deteksi Tekanan Darah Hilang: Istilah "tengkuk kaku" pada S dan diagnosis "ht" pada A memicu kewajiban verifikasi angka tensi darah pada O. Karena O tidak mencatat nilai tekanan darah kuantitatif (mmHg), dibangkitkan Saran 1: "Tambahkan nilai Tekanan Darah (TD)" (Target: O, Payload: "TD: 150/95 mmHg").
  2. Disambiguasi Singkatan: Token "ht" pada A ambigu terhadap hematokrit atau hipertensi. Konteks kardiovaskular mengonfirmasi hipertensi esensial (ICD-10: I10). Dibangkitkan Saran 2: "Change ht to hipertensi" (Target: A, Payload: "hipertensi").
  3. Kerapihan Terapi: Plan "amlodipine 10mg" terlalu ringkas (< 15 karakter). Dibangkitkan Saran 3: "Lengkapi rute pemberian atau dosis obat" (Target: P, Payload: " (oral, sesudah makan)").
- Skor Kesiapan Klaim Awal: 30%.
- Interaksi Dokter: Dokter menekan "Accept" pada Saran 1 dan 2, serta melengkapi dosis pada P.
- Skor Kesiapan Klaim Akhir: 100% (Mencegah dispute klaim obat antihipertensi kronis).

---

## KLAIM PATEN

Berdasarkan uraian invensi di atas, klaim-klaim yang dimohonkan perlindungan hukum paten adalah sebagai berikut:

### Klaim 1 (Mandiri - Metode)
Suatu metode pendukung keputusan berbasis komputer untuk standardisasi dokumentasi medis dan validasi kelengkapan koder rekam medis secara waktu nyata, yang dicirikan oleh langkah-langkah komputasi terurut:
a. menerima string teks narasi klinis bebas atau teks catatan medis melalui antarmuka pengguna klien rekam medis elektronik [100];
b. mentransmisikan string teks tersebut melalui jaringan komunikasi data [102] menuju antarmuka pemrograman aplikasi (API Gateway) [104];
c. menguraikan string teks narasi klinis bebas tersebut menjadi empat blok data catatan SOAP (Subjective, Objective, Assessment, Plan) secara terpisah menggunakan modul pengurai pemrosesan bahasa alami [106];
d. mengevaluasi keempat blok data catatan SOAP tersebut menggunakan mesin aturan koder [108] yang terhubung secara operasional dengan pangkalan pengetahuan klasifikasi penyakit internasional dan matriks tanda vital [110];
e. mendeteksi keberadaan singkatan medis ambigu pada blok Assessment dan ketidaklengkapan variabel tanda vital kuantitatif pada blok Objective berdasarkan simtom pada blok Subjective dan Objective;
f. membangkitkan sekurang-kurangnya satu butir rekomendasi perbaikan berbasis koder secara otomatis dan menghitung skor kesiapan dokumen klaim asuransi;
g. menampilkan daftar rekomendasi perbaikan tersebut pada panel rekomendasi antarmuka pengguna [504] berdampingan dengan panel editor catatan SOAP [502]; dan
h. memperbarui konten pada sekurang-kurangnya satu blok data catatan SOAP pada panel editor [502] secara otomatis dan atomik ketika menerima sinyal persetujuan pengguna melalui kontrol aksi [506].

### Klaim 2 (Mandiri - Sistem)
Suatu sistem pendukung keputusan terdistribusi untuk standardisasi dokumentasi medis dan validasi kelengkapan koder rekam medis secara waktu nyata, yang dicirikan oleh tersusun atas:
a. sekurang-kurangnya satu prosesor data dan sekurang-kurangnya satu memori yang menyimpan instruksi program komputer;
b. antarmuka komunikasi jaringan yang menghubungkan peladen pemroses terpusat dengan sejumlah klien rekam medis elektronik multi-tenant [100] melalui jaringan komunikasi data [102];
c. modul penerima teks narasi klinis bebas yang beroperasi pada gerbang API [104];
d. modul pengurai SOAP [106] yang dikonfigurasi untuk memetakan teks narasi klinis bebas ke dalam kuadran Subjective, Objective, Assessment, dan Plan;
e. pangkalan pengetahuan [110] yang memuat kamus singkatan medis ambigu, kode diagnosis klasifikasi penyakit internasional, dan matriks relasi simtom klinis terhadap tanda vital wajib;
f. modul mesin aturan koder [108] yang dikonfigurasi untuk mengevaluasi kepatuhan dokumentasi SOAP terhadap kriteria kelayakan klaim asuransi kesehatan;
g. modul pemformat rekomendasi [112] yang menyusun daftar perbaikan klinis dan mengkalkulasi skor kesiapan klaim asuransi; dan
h. modul antarmuka pengguna dua panel yang menyajikan editor catatan SOAP pada panel kiri [502] dan daftar rekomendasi perbaikan interaktif pada panel kanan [504].

### Klaim 3 (Turunan Metode)
Metode sesuai klaim 1, di mana langkah mendeteksi ketidaklengkapan variabel tanda vital kuantitatif mencakup:
a. memindai kemunculan leksikon simtom demam pada blok Subjective dan Objective;
b. mengevaluasi jendela konteks kata sebelum leksikon simtom demam untuk mendeteksi penanda negasi klinis guna memastikan pasien tidak menyangkal keluhan demam; dan
c. memindai keberadaan representasi numerik suhu tubuh pada blok Objective apabila penanda negasi klinis tidak terdeteksi, serta membangkitkan rekomendasi penambahan data suhu tubuh apabila representasi numerik suhu tubuh tidak ditemukan.

### Klaim 4 (Turunan Metode)
Metode sesuai klaim 1, di mana langkah mendeteksi singkatan medis ambigu mencakup:
a. mencocokkan token kata pada blok Assessment terhadap entri kamus singkatan ambigu pada pangkalan pengetahuan [110];
b. melakukan verifikasi kesesuaian konteks klinis pendukung pada blok Subjective dan Objective; dan
c. merekomendasikan ekspansi singkatan "df" menjadi terminologi resmi "dengue fever" yang terasosiasi dengan kode klasifikasi ICD-10 A97 / A90 saat konteks simtom demam dan petekia terdeteksi.

### Klaim 5 (Turunan Metode)
Metode sesuai klaim 1, di mana skor kesiapan dokumen klaim asuransi dikalkulasi secara dinamis pada rentang 0 hingga 100 persen, di mana skor bernilai 100 persen ketika seluruh rekomendasi perbaikan yang dibangkitkan telah disetujui atau tidak ditemukan ketidaksesuaian koder, bernilai 0 persen ketika seluruh blok catatan SOAP kosong, dan berkurang secara proporsional sesuai jumlah rekomendasi perbaikan koder yang masih aktif.

### Klaim 6 (Turunan Sistem)
Sistem sesuai klaim 2, di mana gerbang API [104] mengimplementasikan protokol arsitektur RESTful berbasis stateless multi-tenant yang menyediakan endpoint ekstraksi narasi ke SOAP dan endpoint validasi aturan koder, sehingga dapat diakses oleh beragam vendor aplikasi rekam medis elektronik eksternal sebagai layanan terpusat perangkat lunak sebagai layanan (*Software-as-a-Service*).

### Klaim 7 (Turunan Sistem)
Sistem sesuai klaim 2, di mana modul pengurai SOAP [106] dan modul mesin aturan koder [108] mengimplementasikan mekanisme perlindungan kegagalan lokal (*fail-safe deterministic fallback*) berbasis ekspresi reguler dan kamus aturan terkompilasi, yang secara otomatis aktif mengeksekusi ekstraksi dan validasi dengan latensi kurang dari 200 milidetik apabila koneksi ke layanan model bahasa alami eksternal mengalami kegagalan atau kehabisan batas waktu respons.

### Klaim 8 (Turunan Metode)
Metode sesuai klaim 1, di mana pembaruan konten pada blok data catatan SOAP pada langkah (h) dilakukan secara atomik tanpa memerlukan pemuatan ulang halaman web, mencakup operasi penyisipan teks (*append*) pada blok Objective dengan pemisah tanda baca koma, atau operasi penggantian kata (*replace*) pada blok Assessment dengan mempertahankan integritas kalimat di sekitarnya.

### Klaim 9 (Turunan Metode)
Metode sesuai klaim 1, yang selanjutnya mencakup langkah menerima sinyal penolakan pengguna (Reject) melalui kontrol aksi [506], di mana penolakan tersebut menekan penampilan rekomendasi spesifik yang bersangkutan dari daftar aktif serta memperbarui kalkulasi skor kesiapan klaim asuransi tanpa mengubah teks asli pada editor catatan SOAP.

### Klaim 10 (Media Penyimpanan Terbaca-Komputer)
Suatu media penyimpanan terbaca-komputer non-transitori (*non-transitory computer-readable medium*) yang memuat instruksi-instruksi program komputer yang, ketika dieksekusi oleh satu atau lebih prosesor, menyebabkan sistem pemroses data menjalankan seluruh tahapan metode sebagaimana didefinisikan pada salah satu klaim 1 hingga 9.

---

## ABSTRAK RESMI INVENSI

Suatu metode dan sistem pendukung keputusan terdistribusi untuk ekstraksi dokumentasi medis SOAP dan validasi kelengkapan koder secara waktu nyata diungkapkan guna mengatasi kesenjangan klinis-koder dalam pengajuan klaim asuransi kesehatan elektronik. Sistem mencakup klien rekam medis elektronik multi-tenant yang terhubung melalui antarmuka pemrograman aplikasi (API Gateway) menuju peladen pemroses terpusat. Peladen menguraikan string teks narasi klinis bebas dokter menjadi kuadran catatan terstruktur Subjective (S), Objective (O), Assessment (A), dan Plan (P). Mesin aturan koder mengevaluasi catatan SOAP terhadap pangkalan pengetahuan ICD-10 dan tanda vital wajib, mendeteksi variabel kuantitatif yang hilang dengan penjaga batas pertahanan negasi klinis, serta melakukan disambiguasi singkatan ambigu seperti "df" menjadi "dengue fever" (ICD-10: A97). Hasil analisis disajikan pada antarmuka dua panel interaktif yang memungkinkan dokter menerima atau menolak saran perbaikan per butir maupun secara massal, disertai pembaruan atomik teks dan indikator skor kesiapan dokumen klaim asuransi dinamis 0 hingga 100 persen. Sistem dilengkapi mekanisme perlindungan lokal deterministik berlatensi rendah untuk menjamin ketersediaan layanan prima berkesinambungan.
