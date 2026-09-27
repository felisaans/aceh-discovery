-- =========================================================
-- Aceh Discovery — Skema Database Supabase
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- Aman dijalankan ulang (pakai IF NOT EXISTS / DROP ... IF EXISTS)
-- =========================================================

-- ---------- 1. Tabel referensi ----------

create table if not exists daerah (
  id          bigint generated always as identity primary key,
  nama_daerah text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

-- tipe: 'kuliner' | 'budaya' | 'destinasi'
create table if not exists kategori (
  id            bigint generated always as identity primary key,
  nama_kategori text not null,
  slug          text not null,
  tipe          text not null check (tipe in ('kuliner','budaya','destinasi')),
  created_at    timestamptz not null default now(),
  unique (tipe, slug)
);

-- profil pengguna (1-1 dengan auth.users), menyimpan role admin/user
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nama       text,
  role       text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

-- ---------- 2. Tabel konten utama ----------

create table if not exists kuliner (
  id            bigint generated always as identity primary key,
  nama          text not null,
  slug          text not null unique,
  deskripsi     text,
  bahan_utama   text,
  harga_min     integer,
  harga_max     integer,
  gambar        text,                    -- path di storage bucket 'gambar' ATAU url penuh
  sejarah       text,
  cerita_budaya text,
  daerah_id     bigint references daerah(id) on delete set null,
  kategori_id   bigint references kategori(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table if not exists budaya (
  id          bigint generated always as identity primary key,
  nama        text not null,
  slug        text not null unique,
  deskripsi   text,
  gambar      text,
  sorotan     text,                      -- highlight singkat, mis. "Pengakuan Resmi UNESCO"
  daerah_id   bigint references daerah(id) on delete set null,
  kategori_id bigint references kategori(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists destinasi (
  id          bigint generated always as identity primary key,
  nama        text not null,
  slug        text not null unique,
  deskripsi   text,
  gambar      text,
  jenis_wisata text,                     -- label ikon, mis. "Wisata Pantai"
  daerah_id   bigint references daerah(id) on delete set null,
  kategori_id bigint references kategori(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists berita (
  id         bigint generated always as identity primary key,
  judul      text not null,
  ringkasan  text,
  label      text,                       -- badge kecil, mis. "Kuliner Legendaris"
  tanggal    date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------- 3. Interaksi pengguna ----------

create table if not exists ulasan (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kuliner_id bigint not null references kuliner(id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  komentar   text,
  created_at timestamptz not null default now(),
  unique (user_id, kuliner_id)
);

create table if not exists favorit (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kuliner_id bigint not null references kuliner(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, kuliner_id)
);

create table if not exists pengalaman (
  id         bigint generated always as identity primary key,
  nama       text not null,
  teks       text not null,
  foto       text not null,              -- path di storage bucket 'gambar'
  created_at timestamptz not null default now()
);

-- rata-rata & jumlah ulasan per kuliner (dipakai api.js: ratingKuliner)
create or replace view kuliner_rating as
  select kuliner_id,
         round(avg(rating)::numeric, 1) as rata_rata,
         count(*)                        as jumlah
  from ulasan
  group by kuliner_id;

-- ---------- 4. Row Level Security ----------

alter table daerah     enable row level security;
alter table kategori   enable row level security;
alter table profiles   enable row level security;
alter table kuliner    enable row level security;
alter table budaya     enable row level security;
alter table destinasi  enable row level security;
alter table berita     enable row level security;
alter table ulasan     enable row level security;
alter table favorit    enable row level security;
alter table pengalaman enable row level security;

-- helper: apakah user saat ini admin?
create or replace function is_admin() returns boolean
language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Semua orang boleh MEMBACA konten publik
drop policy if exists "publik baca daerah"    on daerah;
create policy "publik baca daerah"    on daerah    for select using (true);
drop policy if exists "publik baca kategori"  on kategori;
create policy "publik baca kategori"  on kategori  for select using (true);
drop policy if exists "publik baca kuliner"   on kuliner;
create policy "publik baca kuliner"   on kuliner   for select using (true);
drop policy if exists "publik baca budaya"    on budaya;
create policy "publik baca budaya"    on budaya    for select using (true);
drop policy if exists "publik baca destinasi" on destinasi;
create policy "publik baca destinasi" on destinasi for select using (true);
drop policy if exists "publik baca berita"    on berita;
create policy "publik baca berita"    on berita    for select using (true);
drop policy if exists "publik baca pengalaman" on pengalaman;
create policy "publik baca pengalaman" on pengalaman for select using (true);
drop policy if exists "publik baca ulasan" on ulasan;
create policy "publik baca ulasan" on ulasan for select using (true);

-- Hanya admin yang boleh UBAH konten (insert/update/delete)
drop policy if exists "admin kelola daerah" on daerah;
create policy "admin kelola daerah" on daerah for all using (is_admin()) with check (is_admin());
drop policy if exists "admin kelola kategori" on kategori;
create policy "admin kelola kategori" on kategori for all using (is_admin()) with check (is_admin());
drop policy if exists "admin kelola kuliner" on kuliner;
create policy "admin kelola kuliner" on kuliner for all using (is_admin()) with check (is_admin());
drop policy if exists "admin kelola budaya" on budaya;
create policy "admin kelola budaya" on budaya for all using (is_admin()) with check (is_admin());
drop policy if exists "admin kelola destinasi" on destinasi;
create policy "admin kelola destinasi" on destinasi for all using (is_admin()) with check (is_admin());
drop policy if exists "admin kelola berita" on berita;
create policy "admin kelola berita" on berita for all using (is_admin()) with check (is_admin());
drop policy if exists "admin hapus pengalaman" on pengalaman;
create policy "admin hapus pengalaman" on pengalaman for delete using (is_admin());

-- profil: user baca profil sendiri (admin baca semua); user boleh ubah namanya sendiri.
-- Kolom `role` dilindungi lewat trigger di bawah (bukan RLS) supaya user TIDAK BISA
-- menaikkan hak aksesnya sendiri menjadi admin walau mengirim update role=admin.
drop policy if exists "user baca profil sendiri" on profiles;
create policy "user baca profil sendiri" on profiles for select using (auth.uid() = id or is_admin());
drop policy if exists "user ubah profil sendiri" on profiles;
create policy "user ubah profil sendiri" on profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- pengalaman: siapa saja (termasuk anonim) boleh mengunggah cerita; admin boleh moderasi (ubah/hapus)
drop policy if exists "publik unggah pengalaman" on pengalaman;
create policy "publik unggah pengalaman" on pengalaman for insert with check (true);
drop policy if exists "admin ubah pengalaman" on pengalaman;
create policy "admin ubah pengalaman" on pengalaman for update using (is_admin()) with check (is_admin());

-- ulasan: pemilik ulasan kelola miliknya sendiri; admin boleh menghapus ulasan yang melanggar (moderasi)
drop policy if exists "user kelola ulasan sendiri" on ulasan;
create policy "user kelola ulasan sendiri" on ulasan for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "admin hapus ulasan" on ulasan;
create policy "admin hapus ulasan" on ulasan for delete using (is_admin());

-- favorit: hanya pemilik data (user login) yang boleh membaca/menambah/menghapus miliknya sendiri
drop policy if exists "user kelola favorit sendiri" on favorit;
create policy "user kelola favorit sendiri" on favorit for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Buat profil otomatis saat ada pengguna baru mendaftar
create or replace function handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into profiles (id, nama) values (new.id, new.raw_user_meta_data->>'nama');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Cegah user biasa menaikkan role dirinya sendiri jadi admin lewat request update profil.
-- Hanya pengguna yang SUDAH admin yang boleh mengubah kolom role (mis. lewat dashboard admin
-- di masa depan, atau langsung lewat SQL Editor untuk pembuatan admin pertama).
create or replace function protect_profile_role() returns trigger
language plpgsql security definer as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    new.role := old.role;
  end if;
  return new;
end; $$;

drop trigger if exists trg_protect_profile_role on profiles;
create trigger trg_protect_profile_role
  before update on profiles
  for each row execute function protect_profile_role();

-- ---------- 5. Storage ----------
-- Buat bucket PUBLIC bernama "gambar" di Storage (Dashboard > Storage > New bucket).
-- Konten editorial (kuliner/budaya/destinasi) TIDAK lagi diunggah ke bucket ini secara
-- default — admin.js kini menyimpan URL gambar eksternal langsung di kolom `gambar`.
-- Bucket ini tetap dipertahankan untuk unggahan pengguna: folder pengalaman/ (diisi
-- publik lewat form "Unggah Pengalaman" di beranda, lihat unggahPengalaman di api.js).
-- Folder kuliner/, budaya/, destinasi/, berita/ tetap boleh dipakai bila suatu saat admin
-- perlu mengunggah file gambar secara manual, tapi ini bukan alur bawaan lagi.

insert into storage.buckets (id, name, public)
  values ('gambar', 'gambar', true)
  on conflict (id) do nothing;

-- siapa saja boleh MEMBACA gambar (supaya tampil di halaman publik)
drop policy if exists "publik baca gambar" on storage.objects;
create policy "publik baca gambar" on storage.objects
  for select using (bucket_id = 'gambar');

-- hanya admin yang boleh mengunggah gambar KONTEN (kuliner/budaya/destinasi/berita, dst)
drop policy if exists "publik unggah gambar" on storage.objects;
drop policy if exists "admin unggah gambar konten" on storage.objects;
create policy "admin unggah gambar konten" on storage.objects
  for insert with check (bucket_id = 'gambar' and (storage.foldername(name))[1] <> 'pengalaman' and is_admin());

-- siapa saja (termasuk anonim) boleh mengunggah foto KE FOLDER pengalaman/ saja
drop policy if exists "publik unggah foto pengalaman" on storage.objects;
create policy "publik unggah foto pengalaman" on storage.objects
  for insert with check (bucket_id = 'gambar' and (storage.foldername(name))[1] = 'pengalaman');

-- hanya admin yang boleh mengubah/menghapus gambar apa pun di bucket ini (termasuk moderasi foto pengalaman)
drop policy if exists "admin kelola gambar" on storage.objects;
create policy "admin ubah gambar" on storage.objects
  for update using (bucket_id = 'gambar' and is_admin());
drop policy if exists "admin hapus gambar" on storage.objects;
create policy "admin hapus gambar" on storage.objects
  for delete using (bucket_id = 'gambar' and is_admin());

-- =========================================================
-- 6. SEED DATA — mengisi ulang konten yang tadinya hardcoded
-- =========================================================

insert into daerah (nama_daerah, slug) values
  ('Kota Banda Aceh', 'banda-aceh'),
  ('Kabupaten Aceh Besar', 'aceh-besar'),
  ('Bireuen', 'bireuen'),
  ('Aceh Tengah', 'aceh-tengah'),
  ('Pidie', 'pidie'),
  ('Gayo Lues', 'gayo-lues'),
  ('Aceh Selatan', 'aceh-selatan'),
  ('Seluruh Wilayah Aceh', 'semua')
on conflict (slug) do nothing;

insert into kategori (nama_kategori, slug, tipe) values
  ('Makanan Berat', 'makanan-berat', 'kuliner'),
  ('Minuman', 'minuman', 'kuliner'),
  ('Kue Tradisional', 'kue-tradisional', 'kuliner'),
  ('Tari Tradisional', 'tari', 'budaya'),
  ('Arsitektur & Rumah Adat', 'arsitektur', 'budaya'),
  ('Upacara & Tradisi', 'upacara', 'budaya'),
  ('Wisata Sejarah & Religi', 'sejarah-religi', 'destinasi'),
  ('Wisata Pantai', 'pantai', 'destinasi'),
  ('Wisata Alam', 'alam', 'destinasi')
on conflict (tipe, slug) do nothing;

insert into kuliner (nama, slug, deskripsi, bahan_utama, harga_min, harga_max, gambar, daerah_id, kategori_id)
select v.nama, v.slug, v.deskripsi, v.bahan_utama, v.harga_min, v.harga_max, v.gambar,
       (select id from daerah where slug = v.daerah_slug),
       (select id from kategori where slug = v.kategori_slug and tipe = 'kuliner')
from (values
  ('Mie Aceh', 'mie-aceh',
   'Mie kuning tebal dengan irisan daging sapi, kambing, atau makanan laut dalam sup kari yang pedas, hangat, dan kaya rempah pilihan khas Serambi Mekkah.',
   'Mie kuning, daging/udang, rempah kari', 20000, 35000,
   'https://placehold.co/600x600/e9d8a6/1b4332?text=Mie+Aceh', 'banda-aceh', 'makanan-berat'),
  ('Kuah Pliek U', 'kuah-pliek-u',
   'Gulai sayuran bergizi khas Aceh dengan bumbu utama patarana (pliek u) fermentasi kelapa, melinjo, daun pepaya, dan kecombrang yang membangkitkan selera.',
   'Pliek u, sayuran, melinjo', 15000, 25000,
   'https://placehold.co/600x600/dda15e/1b4332?text=Kuah+Pliek+U', 'pidie', 'makanan-berat'),
  ('Kopi Sanger', 'kopi-sanger',
   'Perpaduan pas antara kopi hitam saring khas Aceh dengan susu kental manis dan gula, dikocok dan diaduk hingga menghasilkan busa lembut yang nikmat.',
   'Kopi robusta, susu kental manis', 8000, 15000,
   'https://placehold.co/600x600/bc6c25/ffffff?text=Kopi+Sanger', 'aceh-besar', 'minuman'),
  ('Ayam Tangkap', 'ayam-tangkap',
   'Ayam kampung garing yang digoreng bersama daun temurui, pandan, dan cabai hijau harum.',
   'Ayam kampung, daun temurui, cabai hijau', 25000, 45000,
   'https://placehold.co/600x400/52b788/ffffff?text=Ayam+Tangkap', 'aceh-besar', 'makanan-berat')
) as v(nama, slug, deskripsi, bahan_utama, harga_min, harga_max, gambar, daerah_slug, kategori_slug)
on conflict (slug) do nothing;

insert into budaya (nama, slug, deskripsi, gambar, sorotan, daerah_id, kategori_id)
select v.nama, v.slug, v.deskripsi, v.gambar, v.sorotan,
       (select id from daerah where slug = v.daerah_slug),
       (select id from kategori where slug = v.kategori_slug and tipe = 'budaya')
from (values
  ('Tari Saman Seribu Tangan', 'tari-saman',
   'Tarian suku Gayo yang sangat terkenal di kancah internasional dengan kecepatan gerakan tangan, tepukan dada, dan kekompakan formasi yang luar biasa. Diakui resmi oleh UNESCO sebagai Warisan Budaya Takbenda.',
   'https://placehold.co/400x400/2d6a4f/ffffff?text=Tari+Saman', 'Pengakuan Resmi UNESCO', 'gayo-lues', 'tari'),
  ('Rumoh Aceh Tradisional', 'rumah-adat-aceh',
   'Rumah panggung tradisional berstruktur kayu pilihan yang dirancang tanpa menggunakan paku besi tunggal pun. Konstruksi fleksibel ini tahan gempa dan dihiasi ukiran filosofis.',
   'https://placehold.co/400x400/52b788/ffffff?text=Rumoh+Aceh', 'Tahan Gempa & Filosofis', 'aceh-besar', 'arsitektur'),
  ('Tradisi Peusijuek (Tepung Tawar)', 'peusijuek',
   'Ritual adat sakral sebagai ungkapan rasa syukur, permohonan keselamatan, kedamaian, dan kesejahteraan. Rutin dilaksanakan pada pernikahan, kelahiran, hingga penyambutan tamu.',
   'https://placehold.co/400x250/1b4332/ffffff?text=Peusijuek', 'Simbol Kerukunan Sosial', 'semua', 'upacara'),
  ('Rapai Geleng & Ratoh Duek', 'rapai',
   'Seni tabuh rebana tradisional berpadu gerak tari energik penuh kekompakan moral.',
   'https://placehold.co/600x400/ddb892/ffffff?text=Rapai+Geleng', 'Warisan Seni Pesisir', 'aceh-selatan', 'tari')
) as v(nama, slug, deskripsi, gambar, sorotan, daerah_slug, kategori_slug)
on conflict (slug) do nothing;

insert into destinasi (nama, slug, deskripsi, gambar, jenis_wisata, daerah_id, kategori_id)
select v.nama, v.slug, v.deskripsi, v.gambar, v.jenis_wisata,
       (select id from daerah where slug = v.daerah_slug),
       (select id from kategori where slug = v.kategori_slug and tipe = 'destinasi')
from (values
  ('Masjid Raya Baiturrahman', 'masjid-raya-baiturrahman',
   'Ikon megah bergaya arsitektur Mughal-Belanda yang menjadi saksi sejarah dan pusat wisata religi Kota Banda Aceh.',
   'https://placehold.co/600x400/1b4332/ffffff?text=Masjid+Raya+Baiturrahman', 'Wisata Sejarah & Religi', 'banda-aceh', 'sejarah-religi'),
  ('Pantai Lampuuk', 'pantai-lampuuk',
   'Menawarkan hamparan pasir putih dan ombak yang digemari peselancar, dipadukan pemandangan Bukit Lampuuk yang hijau.',
   'https://placehold.co/600x400/52b788/ffffff?text=Pantai+Lampuuk', 'Wisata Pantai', 'aceh-besar', 'pantai'),
  ('Waduk Paya Tampi', 'waduk-paya-tampi',
   'Spot rekreasi keluarga favorit di Bireuen, dengan area duduk lesehan di tepi air dan udara sejuk khas pedesaan.',
   'https://placehold.co/600x400/2d6a4f/ffffff?text=Waduk+Paya+Tampi', 'Wisata Alam', 'bireuen', 'alam'),
  ('Danau Lut Tawar', 'danau-lut-tawar',
   'Danau di Dataran Tinggi Gayo yang memikat dengan udara sejuk, panorama pegunungan, serta secangkir Kopi Gayo hangat.',
   'https://placehold.co/600x400/40916c/ffffff?text=Danau+Lut+Tawar', 'Wisata Alam', 'aceh-tengah', 'alam'),
  ('Pantai Kembang Tanjong', 'pantai-kembang-tanjong',
   'Menyuguhkan suasana pesisir yang tenang, cocok untuk berjalan santai sambil menikmati kuliner khas Pidie di sekitarnya.',
   'https://placehold.co/600x400/74c69d/1b4332?text=Pantai+Kembang+Tanjong', 'Wisata Pantai', 'pidie', 'pantai')
) as v(nama, slug, deskripsi, gambar, jenis_wisata, daerah_slug, kategori_slug)
on conflict (slug) do nothing;

-- Migrasi untuk database yang SUDAH pernah menjalankan seed lama (yang memakai path lokal
-- assets/img/... untuk destinasi, sebelum aturan "editorial = URL eksternal" ini berlaku).
-- Aman dijalankan ulang: hanya menimpa baris yang gambarnya masih path lokal/asets/kosong.
update destinasi set gambar = 'https://placehold.co/600x400/1b4332/ffffff?text=Masjid+Raya+Baiturrahman' where slug = 'masjid-raya-baiturrahman' and (gambar is null or gambar like 'assets/%');
update destinasi set gambar = 'https://placehold.co/600x400/52b788/ffffff?text=Pantai+Lampuuk' where slug = 'pantai-lampuuk' and (gambar is null or gambar like 'assets/%');
update destinasi set gambar = 'https://placehold.co/600x400/2d6a4f/ffffff?text=Waduk+Paya+Tampi' where slug = 'waduk-paya-tampi' and (gambar is null or gambar like 'assets/%');
update destinasi set gambar = 'https://placehold.co/600x400/40916c/ffffff?text=Danau+Lut+Tawar' where slug = 'danau-lut-tawar' and (gambar is null or gambar like 'assets/%');
update destinasi set gambar = 'https://placehold.co/600x400/74c69d/1b4332?text=Pantai+Kembang+Tanjong' where slug = 'pantai-kembang-tanjong' and (gambar is null or gambar like 'assets/%');

insert into berita (judul, ringkasan, label, tanggal) values
  ('Menelusuri Sejarah Kuah Beulangong Tradisional Pidie',
   'Kelezatan rempah pilihan dalam tradisi kenduri akbar masyarakat Pidie yang diwariskan turun-temurun.',
   'Kuliner Legendaris', '2026-06-22'),
  ('Makna Filosofis Dibalik Gerakan Dinamis Tari Saman Gayo',
   'Kekompakan, disiplin, dan pesan keagamaan yang terkandung dalam Warisan Budaya Tak Benda UNESCO.',
   'Seni & Budaya', '2026-06-21'),
  ('Mengenal Tradisi Peusijuek (Tepung Tawar) dalam Adat Aceh',
   'Simbol rasa syukur, doa keselamatan, dan kedamaian menyambut tamu kehormatan atau momen bahagia.',
   'Kearifan Lokal', '2026-06-20')
on conflict do nothing;

-- Setelah mendaftar akun pertama kali lewat halaman login, jadikan admin dengan:
-- update profiles set role = 'admin' where id = '<UUID_USER_DARI_AUTH>';
