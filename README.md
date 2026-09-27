# Aceh Discovery

Portal eksplorasi digital untuk menemukan kuliner, budaya, tradisi, dan destinasi wisata Aceh. Proyek ini menggunakan HTML, CSS, JavaScript ES Modules, Bootstrap, dan Supabase sebagai sumber data dinamis.

## Fitur

- Beranda editorial dengan sorotan kuliner, budaya, destinasi, berita, dan pengalaman wisatawan.
- Katalog kuliner Aceh dengan pencarian, filter daerah, dan filter kategori.
- Halaman detail kuliner dengan:
  - Informasi bahan, sejarah, dan cerita budaya.
  - Rating dan ulasan pengguna.
  - Fitur favorit untuk pengguna yang sudah masuk.
- Katalog budaya dan tradisi dengan pencarian serta filter kategori.
- Daftar destinasi wisata dengan filter berdasarkan daerah.
- Autentikasi pengguna melalui Supabase Auth.
- Pengunjung dapat membagikan pengalaman wisata beserta foto.
- Desain responsif berbasis Bootstrap 5.
- Antarmuka berbahasa Indonesia dengan tema editorial Aceh.

## Teknologi

- HTML5
- CSS3
- JavaScript ES Modules
- [Bootstrap 5.3.2](https://getbootstrap.com/)
- [Font Awesome 6](https://fontawesome.com/)
- Google Fonts: Playfair Display dan Plus Jakarta Sans
- [Supabase](https://supabase.com/): database, autentikasi, dan object storage

## Struktur Proyek

```text
.
├── index.html
├── kuliner.html
├── kuliner-detail.html
├── budaya.html
├── destinasi.html
├── login.html
├── admin/
└── assets/
    ├── css/
    │   ├── style.css
    │   ├── beranda.css
    │   ├── kuliner.css
    │   ├── budaya.css
    │   └── destinasi.css
    └── js/
        ├── api.js
        ├── components.js
        ├── config.js
        ├── supabase-client.js
        ├── ui.js
        └── pages/
            ├── beranda.js
            ├── kuliner.js
            ├── kuliner-detail.js
            ├── budaya.js
            ├── destinasi.js
            └── login.js
```

## Menjalankan Secara Lokal

Karena aplikasi menggunakan JavaScript modules, jalankan melalui web server lokal. Jangan membuka file HTML langsung dengan protokol `file://`.

Contoh menggunakan Python:

```bash
python -m http.server 8000
```

Kemudian buka [http://localhost:8000](http://localhost:8000).

Alternatifnya, gunakan ekstensi **Live Server** di Visual Studio Code atau web server statis lainnya.

## Konfigurasi Supabase

1. Buat proyek baru di [Supabase](https://supabase.com/).
2. Buka **Project Settings → API**.
3. Salin **Project URL** dan **anon public key**.
4. Isi nilainya di `assets/js/config.js`:

```javascript
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-public-key';
```

`anon public key` memang dapat digunakan pada aplikasi frontend, tetapi jangan pernah memasukkan `service_role key` ke dalam repository atau kode browser.

Setelah konfigurasi tersedia, halaman akan mengambil konten dari Supabase. Tanpa konfigurasi yang valid, halaman dinamis menampilkan pesan bahwa Supabase belum dikonfigurasi.

## Struktur Data Supabase

Kode frontend mengharapkan tabel dan relasi berikut:

- `daerah`
  - `id`
  - `nama_daerah`
  - `slug`
- `kategori`
  - `nama_kategori`
  - `slug`
  - `tipe` (`kuliner` atau `budaya`)
- `kuliner`
  - `nama`, `slug`, `deskripsi`, `gambar`
  - `bahan_utama`, `harga_min`, `harga_max`
  - `sejarah`, `cerita_budaya`
  - relasi ke `daerah` dan `kategori`
- `budaya`
  - `nama`, `slug`, `deskripsi`, `gambar`, `sorotan`
  - relasi ke `daerah` dan `kategori`
- `destinasi`
  - `nama`, `deskripsi`, `gambar`, `jenis_wisata`
  - relasi ke `daerah` dan `kategori` bila digunakan
- `berita`
  - `judul`, `ringkasan`, `label`, `tanggal`
- `kuliner_rating`
  - `kuliner_id`, `rata_rata`, `jumlah`
- `ulasan`
  - `user_id`, `kuliner_id`, `rating`, `komentar`, `created_at`
  - relasi ke profil pengguna
- `favorit`
  - `user_id`, `kuliner_id`
- `pengalaman`
  - `nama`, `teks`, `foto`, `created_at`
- `profiles`
  - `id`, `nama`, `role`

Sesuaikan nama kolom, foreign key, kebijakan Row Level Security (RLS), dan relasi tabel dengan skema Supabase yang digunakan oleh proyek.

## Storage Foto

Upload pengalaman wisata menggunakan bucket Supabase Storage bernama `gambar`. File disimpan pada prefix:

```text
pengalaman/<timestamp>-<random>.<extension>
```

Pastikan bucket dan policy Storage dikonfigurasi agar:

- Foto dapat dibaca oleh pengunjung sesuai kebutuhan aplikasi.
- Pengguna yang berwenang dapat mengunggah foto.
- Ukuran dan tipe file dibatasi di sisi server bila diperlukan.

Frontend membatasi foto pengalaman hingga 5 MB dan menerima format JPG, JPEG, PNG, serta WEBP. Validasi server tetap disarankan.

## Autentikasi dan Keamanan

- Login dan pendaftaran menggunakan Supabase Auth.
- Fitur favorit dan ulasan membutuhkan pengguna yang sudah masuk.
- Pengalaman wisata dapat dikirim melalui formulir publik.
- Data dari database di-escape sebelum dimasukkan ke `innerHTML` melalui helper `esc`.
- Aktifkan RLS pada tabel Supabase dan buat policy yang sesuai untuk operasi baca, tulis, ubah, dan hapus.
- Jangan menaruh secret key atau `service_role key` di frontend.
- Validasi input dan file juga perlu diterapkan pada policy atau endpoint server-side, bukan hanya di browser.

## Halaman Utama

| Halaman | Deskripsi |
| --- | --- |
| `index.html` | Beranda dan sorotan editorial Aceh |
| `kuliner.html` | Daftar kuliner dengan pencarian dan filter |
| `kuliner-detail.html?slug=...` | Detail kuliner, rating, ulasan, dan favorit |
| `budaya.html` | Daftar budaya dan tradisi |
| `destinasi.html` | Daftar destinasi wisata |
| `login.html` | Masuk dan pendaftaran pengguna |
| `admin/index.html` | Dashboard admin, jika konfigurasi admin tersedia |

## Pencarian dari Beranda

Kolom pencarian di beranda mengarahkan pencarian ke katalog kuliner menggunakan parameter URL `q`. Contoh:

```text
kuliner.html?q=mie+aceh
```

Halaman budaya juga mendukung parameter `q`, misalnya:

```text
budaya.html?q=saman
```

## Deployment

Proyek ini dapat di-deploy ke layanan hosting statis seperti:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Server web statis lainnya

Pastikan:

1. Semua file repository ikut di-deploy.
2. Hosting menyajikan file JavaScript modules dengan MIME type yang benar.
3. URL Supabase dan anon public key telah dikonfigurasi.
4. CORS, Auth redirect URL, RLS, dan Storage policy Supabase telah disesuaikan dengan domain deployment.

## Pengembangan

Perubahan halaman sebaiknya mengikuti pembagian berikut:

- `assets/css/style.css`: token desain, navbar, tombol, form, dan footer bersama.
- CSS per halaman: gaya khusus untuk beranda, kuliner, budaya, atau destinasi.
- `assets/js/api.js`: seluruh akses data dan operasi Supabase.
- `assets/js/components.js`: komponen HTML yang dipakai ulang.
- `assets/js/ui.js`: helper antarmuka, sanitasi teks, parameter URL, dan navbar.
- `assets/js/pages/`: logika khusus setiap halaman.

Sebelum membuka pull request, periksa setidaknya:

- Tampilan desktop dan mobile.
- Pencarian dan filter.
- Kondisi loading, kosong, error, dan konfigurasi Supabase yang belum tersedia.
- Login, logout, ulasan, favorit, serta upload foto.
- Console browser untuk error JavaScript dan request Supabase yang gagal.

## Lisensi

Belum ada lisensi open-source yang ditentukan di repository ini. Tambahkan file `LICENSE` apabila proyek akan didistribusikan secara publik.

## Kredit

Dibuat untuk eksplorasi kuliner, warisan budaya, dan destinasi wisata Aceh.

© 2026 Bit2Bit. RPL Studio.
