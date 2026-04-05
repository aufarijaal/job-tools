# Size Label Card Maker

## Tentang fitur ini
Size Label Card Maker mengubah file Excel ringkasan pesanan menjadi kartu label ukuran yang siap dicetak.
Upload data Anda, periksa dan urutkan baris, desain tampilan kartu, lalu ekspor langsung ke PDF (A4 landscape).

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
| Card index | Tampilkan penghitung "N/total" kecil di sudut kanan atas |
| Page numbers | Cetak footer "Page N of N" di bawah setiap halaman A4 |

### Field
Setiap kartu menampilkan daftar **field** yang tersusun dari atas ke bawah. Panel kanan memungkinkan Anda mengelolanya.

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
Kartu disusun secara otomatis — sebanyak mungkin per halaman sesuai dimensi kartu.

> **Tips**: Di dialog cetak, atur **Margins → None** dan nonaktifkan header/footer browser untuk hasil yang paling bersih.

### Reset
- **Reset to defaults** — mengembalikan desain kartu default (field, warna, dimensi). Data yang diunggah tetap ada.
- **Start over** — menghapus semuanya termasuk file yang diunggah.

## Catatan
- Desain kartu (field, dimensi, warna) disimpan otomatis di browser dan dikembalikan saat kunjungan berikutnya.
- Tanggal PODD diurai dari nilai tanggal Excel atau teks dan diformat menjadi "DD Bulan YYYY".
- Kolom ukuran yang menggunakan titik sebagai pemisah desimal tetap dikenali dengan benar.
