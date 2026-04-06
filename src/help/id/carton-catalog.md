# Carton Catalog

## Tentang fitur ini
Carton Catalog digunakan untuk menyimpan daftar ukuran kotak karton berdasarkan nama (Lebar × Tinggi × Kedalaman).
Setiap entri dilengkapi pratinjau 3D yang berputar otomatis dan dapat dibuka di Carton Viewer untuk menempatkan stiker.

## Menambah karton secara manual
1. Klik **+ New Carton**.
2. Isi **Name**, **Description** (opsional), dan tiga dimensi dalam satuan metre (**W**, **H**, **D**).
3. Klik **Save** untuk menambahkan entri ke katalog.

## Impor dari Excel
1. Klik **Import Excel**.
2. Pilih file `.xlsx` atau `.xls`. Fitur ini membaca sheet pertama dan mencari kolom berikut (tidak membedakan huruf besar/kecil):

   | Kolom | Alias yang diterima |
   |---|---|
   | `name` | — |
   | `width` | `w`, `width_mm` |
   | `height` | `h`, `height_mm` |
   | `depth` | `d`, `depth_mm` |
   | `description` | `desc`, `note`, `notes` |

3. Dialog **Import Preview** terbuka dan menampilkan semua baris yang terdeteksi. Baris dengan kesalahan (nama tidak ada, dimensi tidak valid) akan ditandai merah.
4. Centang atau hapus centang baris sesuai kebutuhan. Klik kotak di header untuk memilih/membatalkan semua sekaligus.
5. Klik **Import N Cartons** untuk menambahkan baris yang dipilih ke katalog.

## Mengedit karton
Arahkan kursor ke kartu karton dan klik ikon **pensil**. Ubah kolom yang diinginkan dan klik **Save**.

## Menghapus karton
Arahkan kursor ke kartu karton dan klik ikon **tempat sampah**. Penghapusan bersifat langsung dan tidak dapat dibatalkan.

## Membuka di Carton Viewer
Klik tombol **View** (ikon panah) pada kartu karton mana pun untuk membukanya di Carton Viewer.

## Pratinjau 3D
Setiap kartu menampilkan kotak 3D yang berputar secara langsung dengan rasio aspek yang benar. Pratinjau diperbarui otomatis saat Anda mengubah dimensi.

## Catatan
- Dimensi disimpan dalam satuan **metre**. Carton Viewer akan menskalakan kotak secara visual.
- Data karton disimpan secara lokal di database SQLite aplikasi dan akan tetap ada meski aplikasi ditutup dan dibuka kembali.
