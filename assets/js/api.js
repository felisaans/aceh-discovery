import { supabase } from './supabase-client.js';

const FOTO_KOSONG = 'https://placehold.co/600x600/e9d8a6/1b4332?text=Aceh+Discovery';
export const imgUrl = (p) => !p ? FOTO_KOSONG : (/^https?:/.test(p) || p.startsWith('assets/')) ? p
  : supabase.storage.from('gambar').getPublicUrl(p).data.publicUrl;
const bersih = (s) => s.replace(/[,()%*\\]/g, ' ').trim();
const cek = ({ data, error }) => { if (error) throw error; return data; };

/* ---------- helper generik (dipakai kuliner, budaya, destinasi) ----------
   Ketiga jenis konten punya bentuk yang sama: nama, slug, deskripsi, gambar,
   relasi ke daerah & kategori. Daripada menulis ulang query yang sama tiga
   kali, dipusatkan di sini supaya halaman baru tinggal memanggil fungsi ini. */
async function daftarKonten(table, { q = '', daerah = '', kategori = '', urut = 'nama' } = {}) {
  let k = supabase.from(table)
    .select(`*, daerah${daerah ? '!inner' : ''}(nama_daerah,slug), kategori${kategori ? '!inner' : ''}(nama_kategori,slug)`)
    .order(urut);
  if (daerah) k = k.eq('daerah.slug', daerah);
  if (kategori) k = k.eq('kategori.slug', kategori);
  if (bersih(q)) { const t = bersih(q); k = k.or(`nama.ilike.%${t}%,deskripsi.ilike.%${t}%`); }
  return cek(await k);
}
const ambilKonten = async (table, slug) => cek(await supabase.from(table)
  .select('*, daerah(nama_daerah,slug), kategori(nama_kategori,slug)').eq('slug', slug).maybeSingle());
const kontenUnggulan = async (table, limit) => cek(await supabase.from(table)
  .select('*, daerah(nama_daerah,slug), kategori(nama_kategori,slug)').order('created_at', { ascending: false }).limit(limit));

/* ---------- kuliner ---------- */
export async function daftarKuliner({ q = '', daerah = '', kategori = '' } = {}) {
  let k = supabase.from('kuliner')
    .select(`*, daerah${daerah ? '!inner' : ''}(nama_daerah,slug), kategori${kategori ? '!inner' : ''}(nama_kategori,slug)`)
    .order('nama');
  if (daerah) k = k.eq('daerah.slug', daerah);
  if (kategori) k = k.eq('kategori.slug', kategori);
  if (bersih(q)) { const t = bersih(q); k = k.or(`nama.ilike.%${t}%,deskripsi.ilike.%${t}%,bahan_utama.ilike.%${t}%`); }
  return cek(await k);
}
export async function ratingKuliner() {
  const map = {};
  cek(await supabase.from('kuliner_rating').select('*')).forEach(r => { map[r.kuliner_id] = r; });
  return map;
}
export const daftarDaerah = async () => cek(await supabase.from('daerah').select('id,nama_daerah,slug').order('nama_daerah'));
export const daftarKategori = async (tipe) => cek(await supabase.from('kategori').select('nama_kategori,slug').eq('tipe', tipe).order('nama_kategori'));
export const ambilKuliner = async (slug) => cek(await supabase.from('kuliner')
  .select('*, daerah(nama_daerah,slug), kategori(nama_kategori,slug)').eq('slug', slug).maybeSingle());
export const daftarUlasan = async (id) => cek(await supabase.from('ulasan')
  .select('id,rating,komentar,created_at,profiles(nama)').eq('kuliner_id', id).order('created_at', { ascending: false }));
export const kulinerUnggulan = (limit = 4) => kontenUnggulan('kuliner', limit);

/* ---------- budaya ---------- */
export const daftarBudaya = (opsi) => daftarKonten('budaya', opsi);
export const ambilBudaya = (slug) => ambilKonten('budaya', slug);
export const budayaUnggulan = (limit = 3) => kontenUnggulan('budaya', limit);

/* ---------- destinasi ---------- */
export const daftarDestinasi = (opsi) => daftarKonten('destinasi', opsi);
export const ambilDestinasi = (slug) => ambilKonten('destinasi', slug);

/* ---------- berita/cerita beranda ---------- */
export const daftarBerita = async (limit = 3) => cek(await supabase.from('berita')
  .select('*').order('tanggal', { ascending: false }).limit(limit));

/* ---------- akun ---------- */
export const penggunaAktif = async () => (await supabase.auth.getSession()).data.session?.user ?? null;
export const daftarAkun = async (nama, email, password) =>
  cek(await supabase.auth.signUp({ email, password, options: { data: { nama } } }));
export const masukAkun = async (email, password) => cek(await supabase.auth.signInWithPassword({ email, password }));
export const keluarAkun = () => supabase.auth.signOut();
export async function apakahAdmin(user) {
  if (!user) return false;
  return cek(await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle())?.role === 'admin';
}

/* ---------- ulasan & favorit (butuh login) ---------- */
export const kirimUlasan = async (user, kulinerId, rating, komentar) => cek(await supabase.from('ulasan')
  .upsert({ user_id: user.id, kuliner_id: kulinerId, rating, komentar }, { onConflict: 'user_id,kuliner_id' }));
export const favoritKuliner = async (user, kulinerId) => user ? cek(await supabase.from('favorit')
  .select('id').eq('kuliner_id', kulinerId).eq('user_id', user.id).maybeSingle()) : null;
export async function toggleFavorit(user, kulinerId) {
  const ada = await favoritKuliner(user, kulinerId);
  if (ada) { cek(await supabase.from('favorit').delete().eq('id', ada.id)); return false; }
  cek(await supabase.from('favorit').insert({ user_id: user.id, kuliner_id: kulinerId })); return true;
}

/* ---------- pengalaman wisatawan (unggah publik: foto + cerita) ---------- */
export const daftarPengalaman = async () => cek(await supabase.from('pengalaman')
  .select('id,nama,teks,foto,email,daerah(nama_daerah,slug),created_at').order('created_at', { ascending: false }).limit(12));
export async function unggahPengalaman(nama, teks, fotoFile, daerahId, email) {
  const ext = fotoFile.name.split('.').pop();
  const path = `pengalaman/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  cek(await supabase.storage.from('gambar').upload(path, fotoFile));
  return cek(await supabase.from('pengalaman')
    .insert({ nama, teks, foto: path, daerah_id: daerahId || null, email: email || null })
    .select('*, daerah(nama_daerah,slug)').single());
}
