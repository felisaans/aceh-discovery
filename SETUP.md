# Aceh Discovery — Panduan Setup (Arsitektur Dinamis)

## 1. Buat proyek Supabase
1. Buat proyek baru di https://supabase.com.
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu **Run**.
   Skrip ini membuat semua tabel, relasi, RLS policy, storage bucket `gambar`,
   dan mengisi data contoh (persis sama dengan yang sebelumnya hardcoded).
3. Buka **Project Settings > API**, salin `Project URL` dan `anon public key`.

## 2. Hubungkan front-end ke Supabase
Edit `assets/js/config.js`:
```js
export const SUPABASE_URL = 'https://xxxxx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
```
Selama file ini belum diisi, semua halaman otomatis menampilkan status
**"Supabase belum dikonfigurasi"** (bukan konten statis) — variabel `siap` di
`assets/js/supabase-client.js` akan `false`. Setelah diisi, seluruh halaman
otomatis beralih ke data dari Supabase — tidak ada kode lain yang perlu diubah.
HTML tidak pernah menyimpan data konten; hanya container kosong yang diisi JS.

## 3. Buat akun admin pertama
1. Buka `login.html` di browser, daftar akun baru (tab **Daftar**).
2. Di Supabase Dashboard > **Table Editor > profiles**, cari baris dengan
   email/nama Anda, ubah kolom `role` dari `user` menjadi `admin`.
   (Atau lewat SQL Editor: `update profiles set role='admin' where id='<uuid>';`)
   Ini **wajib** dilakukan lewat SQL Editor/Table Editor (bukan dari halaman
   publik), karena user biasa tidak diizinkan mengubah kolom `role` miliknya
   sendiri (dicegah oleh trigger `protect_profile_role`, lihat bagian RLS).
3. Buka `admin/index.html` dan masuk dengan akun tersebut.

## 4. Sumber gambar: URL eksternal vs Supabase Storage
- **Konten editorial** (Kuliner, Budaya, Destinasi) → admin menempel **URL gambar
  eksternal** (mis. Unsplash) langsung di form Dashboard Admin. URL disimpan sebagai
  teks di kolom `gambar`; tidak ada file yang diunggah ke Storage untuk konten ini.
- **Pengalaman Wisatawan** (unggahan publik) → tetap memakai bucket Storage `gambar`,
  folder `pengalaman/`. Pengunjung (termasuk anonim) mengunggah foto lewat form
  "Unggah Pengalaman" di beranda; hasilnya disimpan sebagai path di kolom `foto`.
- Bucket `gambar` tetap ada dan folder `kuliner/`, `budaya/`, `destinasi/`, `berita/`
  masih bisa dipakai (RLS-nya membatasi hanya admin yang boleh menulis ke situ) bila
  suatu saat perlu mengunggah file secara manual — tapi ini bukan alur bawaan lagi.
- Semua folder di bucket `gambar` bisa dibaca publik (supaya gambar tampil di halaman pengguna).

## 5. Kelola konten lewat Dashboard Admin
`admin/index.html` menyediakan CRUD untuk: **Daerah, Kategori, Kuliner,
Budaya & Tradisi, Destinasi Wisata, Cerita & Berita**, serta moderasi
**Pengalaman Wisatawan** yang dikirim publik dari beranda. Menambah/mengubah/
menghapus data di sana akan langsung tampil di halaman publik — tanpa
menyentuh HTML/JS sama sekali.

## Struktur folder
```
aceh-discovery/
├── index.html, kuliner.html, kuliner-detail.html, budaya.html,
│   destinasi.html, login.html         <- halaman publik (desain tidak diubah)
├── admin/
│   ├── index.html                     <- dashboard admin (satu shell untuk semua resource)
│   └── assets/admin.js, admin.css     <- generic CRUD engine berbasis konfigurasi
├── assets/
│   ├── css/                           <- tidak diubah
│   ├── img/                           <- kosong (disiapkan utk aset statis non-editorial jika perlu)
│   └── js/
│       ├── config.js                  <- isi kredensial Supabase Anda di sini
│       ├── supabase-client.js         <- inisialisasi client + flag `siap`
│       ├── api.js                     <- SATU-SATUNYA tempat query ke Supabase (data layer)
│       ├── ui.js                      <- helper UI umum (escape HTML, navbar, dll)
│       ├── components.js              <- render kartu/baris/chip yang dipakai ulang di banyak halaman
│       └── pages/                     <- logic khusus tiap halaman (memanggil api.js + components.js)
└── supabase/schema.sql                <- skema database + RLS + seed data
```

## Alur data
**Admin → Supabase → Pengguna**
1. Admin login ke `admin/index.html` (dicek lewat `apakahAdmin()`, berbasis kolom `profiles.role`).
2. Admin tambah/ubah/hapus data lewat form generik → langsung `insert/update/delete` ke tabel Supabase terkait. Untuk konten editorial, gambar disimpan sebagai URL eksternal (teks), bukan file yang diunggah.
3. Row Level Security memastikan hanya admin yang bisa menulis; pengguna publik hanya bisa membaca (`select`).
4. Halaman publik (`index.html`, `kuliner.html`, `budaya.html`, `destinasi.html`, dst) memanggil fungsi di `api.js` saat dimuat, lalu merender hasilnya lewat `components.js` — sehingga perubahan admin langsung terlihat begitu halaman di-refresh, tanpa deploy ulang kode apa pun.
