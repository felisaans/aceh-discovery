import { esc } from './ui.js';
import { imgUrl } from './api.js';

/* ---------- kartu kecil (grid "Temukan Kekayaan Aceh" & "Budaya Pilihan" di beranda) ---------- */
export function cardMini({ href, badge, tipe = 'kuliner', lokasi, judul, deskripsi, gambar, ekstraKanan = '', tombolTeks = 'Detail' }) {
  return `
    <div class="discovery-card-modern h-100">
      <div class="discovery-img-wrapper">
        <span class="card-category-tag ${tipe === 'budaya' ? 'tag-budaya' : ''}">${badge}</span>
        <img src="${esc(imgUrl(gambar))}" alt="${esc(judul)}" onerror="this.src='https://placehold.co/600x400/eee/333?text=${encodeURIComponent(judul)}'">
      </div>
      <div class="p-4 d-flex flex-column flex-grow-1">
        <div class="d-flex justify-content-between align-items-center small text-muted mb-2">
          <span><i class="fa-solid fa-location-dot me-1"></i> ${esc(lokasi)}</span>
          ${ekstraKanan}
        </div>
        <h5 class="mb-2"><a href="${href}" class="card-title-link">${esc(judul)}</a></h5>
        <p class="small text-muted mb-4 flex-grow-1">${esc(deskripsi)}</p>
        <a href="${href}" class="btn btn-sm btn-aceh-outline w-100">${tombolTeks}</a>
      </div>
    </div>`;
}

/* ---------- baris editorial dengan blob organik (dipakai halaman daftar kuliner) ---------- */
export function rowKuliner(k, i, r) {
  return `
    <div class="row align-items-center editorial-row py-5 border-bottom border-light ${i % 2 ? 'flex-lg-row-reverse' : ''}" data-daerah="${esc(k.daerah?.slug)}">
      <div class="col-lg-6 mb-4 mb-lg-0 editorial-content ${i % 2 ? 'ps-lg-5' : 'pe-lg-5'}">
        <div class="mb-3">
          <span class="badge-kategori mb-2">${esc(k.kategori?.nama_kategori || 'Kuliner')}</span>
          <span class="text-muted small ms-2"><i class="fa-solid fa-location-dot text-teal me-1"></i> ${esc(k.daerah?.nama_daerah)}</span>
        </div>
        <h2 class="editorial-title">${esc(k.nama)}</h2>
        <p class="text-muted mb-4 lead fs-6">${esc(k.deskripsi)}</p>
        <div class="d-flex align-items-center gap-4">
          <span class="text-warning fw-bold"><i class="fa-solid fa-star"></i> ${r ? r.rata_rata : '-'} <span class="text-muted fw-normal font-monospace small">(${r ? r.jumlah : 0} ulasan)</span></span>
          <a href="kuliner-detail.html?slug=${encodeURIComponent(k.slug)}" class="btn btn-aceh-outline rounded-pill px-4">Lihat Detail</a>
        </div>
      </div>
      <div class="col-lg-6 organic-shape-container">
        <div class="organic-blob ${i % 2 ? 'coral' : ''}"></div>
        <img src="${esc(imgUrl(k.gambar))}" class="editorial-img" alt="${esc(k.nama)}">
      </div>
    </div>`;
}

/* ---------- baris budaya (bingkai bulat berselang-seling, meniru desain baru) ---------- */
export function rowBudaya(b, i) {
  const genap = i % 2 === 0;
  return `
    <div class="row g-5 align-items-center mb-5 ${genap ? '' : 'flex-lg-row-reverse'} budaya-item" data-kategori="${esc(b.kategori?.slug)}">
      <div class="col-lg-4 text-center ${genap ? 'text-lg-start' : 'text-lg-end'}">
        <div class="ornate-frame-circle mb-3 mb-lg-0">
          <img src="${esc(imgUrl(b.gambar))}" alt="${esc(b.nama)}" onerror="this.src='https://placehold.co/400x400/2d6a4f/ffffff?text=${encodeURIComponent(b.nama)}'">
        </div>
      </div>
      <div class="col-lg-8">
        <div class="custom-card-bg p-4 p-md-5">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <span class="badge-budaya"><i class="fa-solid fa-masks-theater me-1"></i> ${esc(b.kategori?.nama_kategori || 'Budaya')}</span>
            <span class="text-muted small fw-semibold"><i class="fa-solid fa-location-dot text-teal me-1"></i> ${esc(b.daerah?.nama_daerah)}</span>
          </div>
          <h3 class="fw-bold mb-3 text-teal font-editorial" style="font-size: 1.8rem;">${esc(b.nama)}</h3>
          <p class="text-muted lh-lg mb-4"><span class="drop-cap">${esc(b.nama[0])}</span>${esc(b.deskripsi.slice(1))}</p>
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-3" style="border-top: 1px dashed rgba(32,70,84,0.15);">
            <span class="text-teal small fw-bold"><i class="fa-solid fa-award me-1"></i> ${esc(b.sorotan || '')}</span>
          </div>
        </div>
      </div>
    </div>`;
}

/* ---------- baris destinasi (layout overlapping, meniru desain baru) ---------- */
export function rowDestinasi(d, i) {
  return `
    <div class="dest-row ${i % 2 ? 'reverse' : ''}" data-daerah="${esc(d.daerah?.slug)}">
      <div class="dest-image-wrapper">
        <span class="dest-region-tag"><i class="fa-solid fa-location-dot me-1"></i>${esc(d.daerah?.nama_daerah)}</span>
        <img src="${esc(imgUrl(d.gambar))}" alt="${esc(d.nama)}" onerror="this.src='https://placehold.co/600x400/eee/333?text=${encodeURIComponent(d.nama)}'">
      </div>
      <div class="dest-content-box">
        <div class="dest-title-pill">${esc(d.nama)}</div>
        <p class="dest-desc">${esc(d.deskripsi)}</p>
        <div class="dest-footer-meta">
          <span class="text-muted fw-medium small"><i class="fa-solid fa-map text-teal me-2"></i>${esc(d.jenis_wisata || '')}</span>
        </div>
      </div>
    </div>`;
}

/* ---------- chip filter daerah, dibangun dari data (bukan hardcoded) ---------- */
export function pasangChipDaerah(container, daftarDaerah, onPilih) {
  container.innerHTML = `<button type="button" class="region-chip active" data-filter-daerah="semua">Semua Daerah</button>` +
    daftarDaerah.map(d => `<button type="button" class="region-chip" data-filter-daerah="${esc(d.slug)}">${esc(d.nama_daerah)}</button>`).join('');
  container.querySelectorAll('[data-filter-daerah]').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('[data-filter-daerah]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      onPilih(chip.dataset.filterDaerah);
    });
  });
}

export const pesanKosong = (teks) => `<p class="text-center text-muted py-5">${esc(teks)}</p>`;
export const pesanGagal = (teks = 'Gagal memuat data. Coba muat ulang halaman.') => `<p class="text-center text-danger py-5">${esc(teks)}</p>`;
export const pesanMuat = (teks = 'Memuat data...') => `<div class="text-center text-muted py-5"><span class="spinner-border spinner-border-sm me-2"></span>${esc(teks)}</div>`;
export const pesanSetup = (teks = 'Supabase belum dikonfigurasi. Silakan isi konfigurasi Supabase terlebih dahulu (assets/js/config.js) agar konten dapat dimuat.') =>
  `<div class="text-center text-muted py-5"><i class="fa-solid fa-database fs-2 mb-3 d-block opacity-50"></i>${esc(teks)}</div>`;
