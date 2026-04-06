# Carton Viewer

## Tentang fitur ini
Carton Viewer adalah alat 3D interaktif untuk memvisualisasikan kotak karton dan menempatkan label stiker di sisi mana pun.
Buka karton dari Carton Catalog untuk memulai dengan dimensi yang tepat, atau sesuaikan ukurannya langsung di halaman ini.

## Navigasi tampilan 3D

| Aksi | Cara |
|---|---|
| Putar | Klik dan seret pada kanvas |
| Zoom | Gulir roda mouse |
| Putar otomatis | Aktif secara otomatis saat tidak ada stiker yang diseret |

## Mengatur dimensi kotak
Gunakan kolom input **W / H / D** di bagian atas halaman untuk mengubah lebar, tinggi, dan kedalaman kotak secara real-time.

## Jenis stiker

Panel **stiker** di sebelah kanan mencantumkan jenis stiker yang tersedia:

- **Stiker bawaan**: Fragile ⚠️, This Way Up ⬆️, Recycle ♻️, Star ⭐, Heart ❤️, Approved ✅
- **Stiker gambar kustom**: klik **+ Add image** untuk mengunggah PNG/JPG/GIF milik Anda sendiri. Gambar akan digunakan sebagai tekstur pada kartu datar yang diletakkan di sisi kotak.

## Menempatkan stiker
1. Pilih jenis stiker dari panel (klik untuk menandainya).
2. Klik **Place on Face** lalu klik sisi yang diinginkan pada kotak 3D, atau langsung klik sisi tersebut saat jenis stiker sudah aktif.
3. Stiker akan muncul di tengah sisi tersebut.

## Memindahkan stiker
Klik stiker yang sudah ditempatkan untuk memilihnya (ditandai dengan warna biru), lalu seret ke posisi yang diinginkan pada sisi yang sama.

## Mengubah ukuran stiker
Saat stiker dipilih, gunakan slider **Size** di panel kontrol stiker untuk memperbesar atau memperkecilnya.

## Membatalkan pilihan stiker
Klik stiker yang sedang dipilih kembali (tanpa menyeret) untuk membatalkan pilihan, atau klik area kanvas lainnya.

## Menghapus stiker
Pilih stiker, lalu klik tombol **Delete** (✕) di panel kontrol stiker.

## Catatan
- Setiap stiker terkunci pada sisi tempat ia ditempatkan dan tidak akan berpindah ke sisi lain saat diseret.
- OrbitControls otomatis dijeda saat Anda menyeret stiker agar tampilan tidak bergerak.
- Stiker gambar kustom disimpan sebagai object URL dan hanya berlaku selama sesi; stiker tidak akan tersimpan setelah aplikasi ditutup.
