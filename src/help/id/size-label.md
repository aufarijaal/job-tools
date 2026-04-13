# Size Label Card Maker

## Tentang fitur ini
Size Label Card Maker mengubah file Excel ringkasan pesanan menjadi kartu label ukuran yang siap dicetak.
Upload data Anda, periksa dan urutkan baris, pilih preset layout atau desain sendiri, lalu ekspor langsung ke PDF (A4 landscape).

## Alur kerja
Fitur ini terbagi menjadi tiga langkah yang ditampilkan di bagian atas halaman:

1. **Upload** — muat file Excel
2. **Data** — periksa baris dan atur urutan pengurutan
3. **Design & Export** — desain kartu dan cetak ke PDF

---

## Langkah 1 — Upload

Seret dan lepaskan file Excel ke area upload, atau klik area tersebut untuk memilih file.

**Format yang didukung**: `.xlsx`, `.xls`, `.ods`, `.csv`

Fitur ini membaca kolom-kolom berikut dari sheet pertama:

| Kolom | Keterangan |
|---|---|
| `FTY SAP#` | Nomor SAP pabrik |
| `Order Number (GTN)` | Nomor pesanan GTN |
| `Article Number` | Nomor artikel / gaya |
| `Model Name` | Nama model produk |
| `PODD` | Planned on-dock date (ditampilkan sebagai "DD Bulan YYYY") |
| `接单日-Released date` | Tanggal pesanan diterima (ditampilkan sebagai "Released D Bln YYYY") |
| `TOTAL QTY` | Total kuantitas (ditampilkan sebagai "N prs") |
| `Ship to Country` | Negara tujuan pengiriman |
| `Sizes` | Jumlah kolom ukuran yang tidak nol (ditampilkan sebagai "N sizes") |

Kolom ukuran yang dikenali: 1, 1,5, 2 … 18 (pemisah desimal koma maupun titik keduanya dikenali).

---

## Langkah 2 — Data

Setelah file dimuat, semua baris ditampilkan dalam tabel yang bisa digulir (maksimal 100 baris ditampilkan sekaligus).

### Urutan pengurutan
Kartu akan dicetak sesuai urutan yang Anda atur di sini.

- **Urutan default**: FTY SAP# naik, lalu PODD naik.
- Klik **Add rule** untuk menambah tingkat pengurutan.
- Klik tombol **asc / desc** pada aturan untuk mengubah arah.
- Klik **×** pada aturan untuk menghapusnya.
- Klik **Reset sort** untuk mengembalikan urutan default dua aturan.

Jika data sudah sesuai, klik **Design Card →** untuk melanjutkan.

---

## Langkah 3 — Design & Export

### Pratinjau Langsung
Panel kiri menampilkan pratinjau kartu baris pertama secara real-time menggunakan pengaturan desain Anda saat ini.

### Preset Layout
Daftar preset bawaan ditampilkan di bagian atas panel desain. Klik salah satu kartu preset untuk langsung menerapkan desainnya (field, dimensi, warna, pengaturan barcode, dan gaya layout). Preset bawaan yang tersedia:

| Preset | Keterangan |
|---|---|
| **Classic** | Semua field, layout vertikal, barcode linear |
| **Bold** | Nama model besar, border tebal, barcode linear |
| **Compact** | Kartu kecil, lebih sedikit field, tanpa barcode |
| **Side QR** | Teks di kiri, kode QR di kanan |
| **Wide Label** | Kartu strip lebar, barcode linear besar |
| **SAP Hero** | SAP# raksasa di tengah, border biru, barcode linear |
| **SAP + QR** | SAP# besar di kiri, kode QR di kanan |
| **Size Breakdown** | Grid kuantitas per ukuran di bawah, barcode linear |

Klik **Preview Presets PDF** (bagian atas halaman) untuk mencetak lembar referensi berisi kartu sampel setiap preset.

#### Menyimpan preset sendiri
Jika Anda ingin menyimpan desain untuk digunakan kembali:
1. Klik **Save as preset** (ikon bookmark) di panel desain.
2. Masukkan nama, lalu tekan **Save**.

Preset pengguna tampil di palet preset bersama preset bawaan. Anda dapat **mengubah nama** (ikon pensil) atau **menghapus** (ikon tempat sampah) preset pengguna kapan saja.

### Pengaturan Kartu

| Pengaturan | Keterangan |
|---|---|
| Width (mm) | Lebar kartu dalam milimeter |
| Height (mm) | Tinggi kartu dalam milimeter |
| Padding (mm) | Margin dalam kartu |
| Border (px) | Ketebalan border dalam piksel |
| Background | Warna isi kartu |
| Border color | Warna border kartu |
| Font family | Jenis huruf yang digunakan di seluruh kartu |
| Layout style | **Vertical** — semua field lalu kode tersusun dari atas ke bawah; **Side Code Right** — field di kiri, barcode/QR di kanan; **Size Grid** — field diikuti grid kuantitas per ukuran |
| Card index | Tampilkan penghitung "N/total" kecil di sudut kanan atas |
| Page numbers | Cetak footer "Page N of N" di bawah setiap halaman A4 |
| PDF Scale | Faktor zoom yang diterapkan pada setiap kartu saat mencetak (0,5× – 2×). Gunakan nilai di bawah 1 untuk memuat lebih banyak kartu per halaman. |

### Barcode / Kode QR

| Pengaturan | Keterangan |
|---|---|
| Show barcode | Tampilkan atau sembunyikan kode |
| Type | **Linear (CODE128)** — barcode 1-D konvensional; **QR Code** — kode 2-D berbentuk kotak |
| Height (mm) | Tinggi elemen kode yang dirender (lebar mengikuti otomatis untuk linear; ukuran persegi untuk QR) |

Nilai barcode selalu menggunakan **FTY SAP#** dari baris kartu yang bersangkutan.

### Field
Setiap kartu menampilkan daftar **field**. Panel kanan memungkinkan Anda mengelolanya.

- **Add** — buat field baru (klik tombol hijau **Add**).
- **Hapus** — klik **×** pada baris field.
- **Urutkan ulang** — gunakan panah **↑ / ↓**, atau seret gagang grip.
- **Edit** — klik baris field untuk membuka pengaturannya:

| Opsi | Keterangan |
|---|---|
| Data source | Kolom mana yang ditampilkan, atau **Static text** untuk konten tetap |
| Static text | Teks yang ditampilkan jika data source adalah "Static text" |
| Prefix / Suffix | Teks yang ditambahkan di awal / akhir nilai |
| Label prefix | Aktifkan untuk menambahkan label singkat (contoh: `SAP: 12345`) |
| Font size | XS (10px) → 3XL (28px) |
| Font weight | Normal / Semibold / Bold |
| Italic | Aktifkan gaya miring |
| Alignment | Kiri / Tengah / Kanan |

### Ekspor ke PDF
Klik **Export PDF** untuk membuka dialog cetak browser dengan pengaturan A4 landscape yang sudah diterapkan.
Kartu disusun secara otomatis — sebanyak mungkin per halaman sesuai dimensi kartu dan nilai PDF scale.

> **Tips**: Di dialog cetak, atur **Margins → None** dan nonaktifkan header/footer browser untuk hasil yang paling bersih.

### Menyimpan dan memuat konfigurasi
Gunakan tombol **Export Config** dan **Import Config** di bagian atas halaman untuk menyimpan dan memulihkan seluruh pengaturan desain:

- **Export Config** — mengunduh file `.json` yang berisi desain kartu saat ini, semua preset pengguna, dan nilai PDF scale.
- **Import Config** — memuat file `.json` yang sebelumnya diekspor dan memulihkan desain, preset pengguna, serta PDF scale.

Fitur ini berguna untuk berbagi desain dengan rekan kerja atau mencadangkan pekerjaan sebelum bereksperimen.

### Reset
- **Reset to defaults** — mengembalikan desain kartu default (field, warna, dimensi). Data yang diunggah tetap ada.
- **Start over** — menghapus semuanya termasuk file yang diunggah.

## Catatan
- Desain kartu (field, dimensi, warna) dan preset pengguna disimpan otomatis di browser dan dikembalikan saat kunjungan berikutnya.
- Tanggal PODD diurai dari nilai tanggal Excel atau teks dan diformat menjadi "DD Bulan YYYY".
- Tanggal Released (kolom `接单日-Released date`) diformat menjadi "Released D Bln YYYY".
- Kolom ukuran yang menggunakan titik sebagai pemisah desimal tetap dikenali dengan benar.
