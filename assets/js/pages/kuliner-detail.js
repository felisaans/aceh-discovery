import { siap } from '../supabase-client.js';
import { ambilKuliner, daftarUlasan, ratingKuliner, kirimUlasan, penggunaAktif, favoritKuliner, toggleFavorit, imgUrl } from '../api.js';
import { esc, bintang, param, pasangNavbar } from '../ui.js';

const $ = (id) => document.getElementById(id);
const root = $('dKonten');
const rupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
const info = (t, cls = 'text-muted') => { root.innerHTML = `<p class="text-center ${cls} py-5">${t}</p>`; };
const bagian = (judul, isi) => isi ? `<h2 class="h4 fw-bold mt-4">${judul}</h2><p class="text-muted" style="white-space:pre-line">${esc(isi)}</p>` : '';

async function muat() {
  if (!siap) return info('Halaman ini memuat data dari Supabase. Isi <code>assets/js/config.js</code> terlebih dahulu.');
  const k = await ambilKuliner(param('slug'));
  if (!k) return info('Kuliner tidak ditemukan. <a href="kuliner.html">Kembali ke daftar</a>');
  document.title = `${k.nama} - Aceh Discovery`;
  $('dNama').textContent = k.nama; $('dBadge').textContent = k.kategori?.nama_kategori || 'Kuliner';
  $('dDaerah').innerHTML = `<i class="fa-solid fa-location-dot me-1"></i> ${esc(k.daerah?.nama_daerah)}`;
  const [rating, ulasan, user] = await Promise.all([ratingKuliner(), daftarUlasan(k.id), penggunaAktif()]);
  const r = rating[k.id], fav = user ? await favoritKuliner(user, k.id) : null;
  const harga = k.harga_min != null ? `${rupiah(k.harga_min)}${k.harga_max ? ' - ' + rupiah(k.harga_max) : ''}` : '';

  root.innerHTML = `
    <div class="row align-items-center g-5">
      <div class="col-lg-5 organic-shape-container"><div class="organic-blob"></div>
        <img src="${esc(imgUrl(k.gambar))}" class="editorial-img" alt="${esc(k.nama)}"></div>
      <div class="col-lg-7">
        <p class="lead fs-6 text-muted">${esc(k.deskripsi)}</p>
        <ul class="list-unstyled">
          ${k.bahan_utama ? `<li class="mb-2"><i class="fa-solid fa-bowl-food text-success me-2"></i><strong>Bahan utama:</strong> ${esc(k.bahan_utama)}</li>` : ''}
          ${harga ? `<li class="mb-2"><i class="fa-solid fa-tag text-success me-2"></i><strong>Kisaran harga:</strong> ${harga}</li>` : ''}
          <li class="text-warning fw-bold"><i class="fa-solid fa-star me-2"></i>${r ? r.rata_rata : '-'} <span class="text-muted fw-normal small">(${r ? r.jumlah : 0} ulasan)</span></li>
        </ul>
        <button class="btn ${fav ? 'btn-primary-custom' : 'btn-outline-success rounded-pill px-4'}" id="btnFav" type="button">
          <i class="fa-${fav ? 'solid' : 'regular'} fa-heart me-1"></i>${fav ? 'Tersimpan di favorit' : 'Simpan ke favorit'}</button>
      </div>
    </div>
    ${bagian('Sejarah dan Asal-usul', k.sejarah)}${bagian('Cerita Budaya', k.cerita_budaya)}
    <hr class="my-5"><h2 class="h4 fw-bold">Ulasan</h2>
    <div class="filter-section mb-4">${user ? `
      <label class="form-label fw-semibold" for="fRating">Beri penilaian</label>
      <select id="fRating" class="form-select mb-3">${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${bintang(n)}</option>`).join('')}</select>
      <textarea id="fKomentar" class="form-control mb-3" rows="3" maxlength="1000" placeholder="Ceritakan pengalaman Anda..."></textarea>
      <button class="btn btn-primary-custom" id="btnUlasan" type="button">Kirim Ulasan</button> <span class="small ms-2" id="fPesan"></span>`
      : '<p class="mb-0">Silakan <a href="login.html">masuk</a> untuk memberi ulasan dan menyimpan favorit.</p>'}</div>
    ${ulasan.length ? ulasan.map(u => `<div class="border-bottom py-3"><strong>${esc(u.profiles?.nama || 'Pengguna')}</strong>
      <span class="text-warning ms-2">${bintang(u.rating)}</span><div class="small text-muted">${new Date(u.created_at).toLocaleDateString('id-ID')}</div>
      <p class="mb-0 mt-1">${esc(u.komentar)}</p></div>`).join('') : '<p class="text-muted">Belum ada ulasan. Jadilah yang pertama!</p>'}`;

  $('btnFav').addEventListener('click', async () => {
    if (!user) return location.href = 'login.html';
    try { await toggleFavorit(user, k.id); muat(); } catch (e) { alert('Gagal menyimpan favorit.'); console.error(e); }
  });
  $('btnUlasan')?.addEventListener('click', async () => {
    try { await kirimUlasan(user, k.id, +$('fRating').value, $('fKomentar').value.trim() || null); muat(); }
    catch (e) { $('fPesan').textContent = 'Gagal mengirim ulasan.'; $('fPesan').className = 'small ms-2 text-danger'; console.error(e); }
  });
}
muat().catch(e => { info('Gagal memuat data. Coba muat ulang halaman.', 'text-danger'); console.error(e); });
pasangNavbar();
