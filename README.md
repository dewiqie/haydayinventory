# Inventory Stock Online V2

Versi online menggunakan Supabase sebagai Auth + database dan GitHub Pages sebagai hosting.

## Yang tersedia
- Login & daftar akun
- Database online
- Data stok sama di HP/komputer yang login ke akun yang sama
- Barang masuk
- Barang keluar
- Stok otomatis
- Riwayat transaksi
- Closing stok + snapshot
- Tambah/edit/hapus barang
- Responsive
- GitHub Pages ready

## Setup

### 1. Buat project Supabase
Buat project di https://supabase.com/

### 2. Buat database
Buka SQL Editor, lalu jalankan semua isi `supabase.sql`.

RLS sengaja diaktifkan agar akun hanya dapat membaca/mengubah data miliknya.

### 3. Ambil URL dan key
Di Supabase, buka pengaturan API/project dan salin:
- Project URL
- Publishable key (atau anon key pada project yang masih menggunakannya)

Jangan pernah memasukkan `service_role` key ke website/browser.

### 4. Isi config.js
Buka `config.js` dan ganti:
PASTE_SUPABASE_URL_HERE
PASTE_SUPABASE_PUBLISHABLE_OR_ANON_KEY_HERE

### 5. Upload ke GitHub
Upload:
- index.html
- style.css
- app.js
- config.js
- supabase.sql
- README.md

### 6. Aktifkan GitHub Pages
Repository → Settings → Pages → Deploy from branch → main → /(root).

Setelah aktif, buka URL GitHub Pages.

## Catatan
GitHub Pages adalah hosting statis. Database/auth disediakan Supabase.

Supabase JavaScript SDK dimuat melalui CDN, sehingga tidak diperlukan npm/build step.

## Alur penggunaan
1. Daftar akun.
2. Login.
3. Tambahkan barang dan stok awal.
4. Gunakan Barang Masuk/Keluar.
5. Stok otomatis berubah.
6. Lakukan Closing untuk menyimpan snapshot stok hari tersebut.
7. Login akun yang sama dari HP/komputer lain untuk mengakses data online yang sama.
