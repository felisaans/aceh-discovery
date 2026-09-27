import { supabase, siap } from '../../assets/js/supabase-client.js';
import { penggunaAktif, apakahAdmin, keluarAkun, imgUrl } from '../../assets/js/api.js';
import { esc } from '../../assets/js/ui.js';

const $ = (id) => document.getElementById(id);
const cek = ({ data, error }) => { if (error) throw error; return data; };
const ambil = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);

/* ---------- Konfigurasi tiap resource: cukup ubah/tambah di sini untuk kebutuhan baru ---------- */
const OPSI_TIPE_KATEGORI = [{ value: 'kuliner', label: 'Kuliner' }, { value: 'budaya', label: 'Budaya' }, { value: 'destinasi', label: 'Destinasi' }];

const RESOURCES = {
  daerah: {
    label: 'Daerah', icon: 'fa-map-location-dot', order: 'nama_daerah',
    columns: [{ key: 'nama_daerah', label: 'Nama Daerah' }, { key: 'slug', label: 'Slug' }],
    fields: [
      { name: 'nama_daerah', label: 'Nama Daerah', type: 'text', required: true },
      { name: 'slug', label: 'Slug (unik, huruf kecil, pakai -)', type: 'text', required: true },
    ],
  },
  kategori: {
    label: 'Kategori', icon: 'fa-tags', order: 'nama_kategori',
    columns: [{ key: 'nama_kategori', label: 'Nama Kategori' }, { key: 'slug', label: 'Slug' }, { key: 'tipe', label: 'Tipe' }],
    fields: [
      { name: 'nama_kategori', label: 'Nama Kategori', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'tipe', label: 'Tipe Konten', type: 'select', required: true, options: OPSI_TIPE_KATEGORI },
    ],
  },
  kuliner: {
    label: 'Kuliner', icon: 'fa-bowl-food', order: 'nama', select: '*, daerah(nama_daerah), kategori(nama_kategori)',
    columns: [{ key: 'gambar', label: 'Foto', type: 'image' }, { key: 'nama', label: 'Nama' }, { key: 'daerah.nama_daerah', label: 'Daerah' }, { key: 'kategori.nama_kategori', label: 'Kategori' }],
    fields: [
      { name: 'nama', label: 'Nama', type: 'text', required: true },
      { name: 'slug', label: 'Slug (unik)', type: 'text', required: true },
      { name: 'daerah_id', label: 'Daerah', type: 'select-fk', fk: 'daerah', required: true },
      { name: 'kategori_id', label: 'Kategori', type: 'select-fk', fk: 'kategori', fkTipe: 'kuliner', required: true },
      { name: 'gambar', label: 'URL Gambar', type: 'image-url' },
      { name: 'deskripsi', label: 'Deskripsi', type: 'textarea' },
      { name: 'bahan_utama', label: 'Bahan Utama', type: 'text' },
      { name: 'harga_min', label: 'Harga Minimum (Rp)', type: 'number' },
      { name: 'harga_max', label: 'Harga Maksimum (Rp)', type: 'number' },
      { name: 'sejarah', label: 'Sejarah / Asal-usul', type: 'textarea' },
      { name: 'cerita_budaya', label: 'Cerita Budaya', type: 'textarea' },
    ],
  },
  budaya: {
    label: 'Budaya & Tradisi', icon: 'fa-masks-theater', order: 'nama', select: '*, daerah(nama_daerah), kategori(nama_kategori)',
    columns: [{ key: 'gambar', label: 'Foto', type: 'image' }, { key: 'nama', label: 'Nama' }, { key: 'daerah.nama_daerah', label: 'Daerah' }, { key: 'kategori.nama_kategori', label: 'Kategori' }],
    fields: [
      { name: 'nama', label: 'Nama', type: 'text', required: true },
      { name: 'slug', label: 'Slug (unik)', type: 'text', required: true },
      { name: 'daerah_id', label: 'Daerah', type: 'select-fk', fk: 'daerah', required: true },
      { name: 'kategori_id', label: 'Kategori', type: 'select-fk', fk: 'kategori', fkTipe: 'budaya', required: true },
      { name: 'gambar', label: 'URL Gambar', type: 'image-url' },
      { name: 'deskripsi', label: 'Deskripsi', type: 'textarea', required: true },
      { name: 'sorotan', label: 'Sorotan singkat (mis. "Pengakuan Resmi UNESCO")', type: 'text' },
    ],
  },
  destinasi: {
    label: 'Destinasi Wisata', icon: 'fa-mountain-sun', order: 'nama', select: '*, daerah(nama_daerah), kategori(nama_kategori)',
    columns: [{ key: 'gambar', label: 'Foto', type: 'image' }, { key: 'nama', label: 'Nama' }, { key: 'daerah.nama_daerah', label: 'Daerah' }, { key: 'jenis_wisata', label: 'Jenis Wisata' }],
    fields: [
      { name: 'nama', label: 'Nama', type: 'text', required: true },
      { name: 'slug', label: 'Slug (unik)', type: 'text', required: true },
      { name: 'daerah_id', label: 'Daerah', type: 'select-fk', fk: 'daerah', required: true },
      { name: 'kategori_id', label: 'Kategori', type: 'select-fk', fk: 'kategori', fkTipe: 'destinasi', required: true },
      { name: 'jenis_wisata', label: 'Label Jenis Wisata (mis. "Wisata Pantai")', type: 'text' },
      { name: 'gambar', label: 'URL Gambar', type: 'image-url' },
      { name: 'deskripsi', label: 'Deskripsi', type: 'textarea', required: true },
    ],
  },
  berita: {
    label: 'Cerita & Berita', icon: 'fa-bullhorn', order: 'tanggal', orderAsc: false,
    columns: [{ key: 'judul', label: 'Judul' }, { key: 'label', label: 'Label' }, { key: 'tanggal', label: 'Tanggal' }],
    fields: [
      { name: 'judul', label: 'Judul', type: 'text', required: true },
      { name: 'label', label: 'Label Badge (mis. "Kuliner Legendaris")', type: 'text' },
      { name: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { name: 'ringkasan', label: 'Ringkasan', type: 'textarea', required: true },
    ],
  },
  pengalaman: {
    label: 'Pengalaman Wisatawan', icon: 'fa-camera', order: 'created_at', orderAsc: false,
    columns: [{ key: 'foto', label: 'Foto', type: 'image' }, { key: 'nama', label: 'Nama' }, { key: 'teks', label: 'Cerita' }],
    fields: [
      { name: 'nama', label: 'Nama', type: 'text', required: true },
      { name: 'teks', label: 'Cerita', type: 'textarea', required: true },
    ],
    hanyaModerasi: true, // tidak ada tombol "Tambah": ini kiriman publik dari beranda, admin cuma edit/hapus
  },
};

let resourceAktif = 'daerah';
const cacheOpsiFk = {}; // { daerah: [...], 'kategori:kuliner': [...] }

/* ---------- Opsi dropdown untuk field foreign key ---------- */
async function opsiFk(field) {
  const kunci = field.fkTipe ? `${field.fk}:${field.fkTipe}` : field.fk;
  if (cacheOpsiFk[kunci]) return cacheOpsiFk[kunci];
  const kolomNama = field.fk === 'daerah' ? 'nama_daerah' : 'nama_kategori';
  let q = supabase.from(field.fk).select(`id, ${kolomNama}`);
  if (field.fkTipe) q = q.eq('tipe', field.fkTipe);
  const data = cek(await q);
  const opsi = data.map(d => ({ value: d.id, label: d[kolomNama] }));
  cacheOpsiFk[kunci] = opsi;
  return opsi;
}

/* ---------- Render sidebar menu ---------- */
function renderMenu() {
  const nav = $('menuResource');
  nav.innerHTML = Object.entries(RESOURCES).map(([kunci, r]) => `
    <a href="#" class="nav-link d-flex align-items-center gap-2 ${kunci === resourceAktif ? 'active' : ''}" data-resource="${kunci}">
      <i class="fa-solid ${r.icon}"></i> ${esc(r.label)}
    </a>`).join('');
  nav.querySelectorAll('[data-resource]').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    resourceAktif = a.dataset.resource;
    renderMenu();
    muatTabel();
  }));
}

/* ---------- Render tabel ---------- */
async function muatTabel() {
  const r = RESOURCES[resourceAktif];
  $('judulResource').textContent = r.label;
  $('deskResource').textContent = r.hanyaModerasi ? 'Kiriman publik dari beranda — kelola atau hapus di sini.' : `Kelola data ${r.label.toLowerCase()} yang tampil di halaman pengguna.`;
  $('btnTambah').classList.toggle('d-none', !!r.hanyaModerasi);
  $('theadRow').innerHTML = r.columns.map(c => `<th>${esc(c.label || c.key)}</th>`).join('') + '<th class="text-end">Aksi</th>';

  const { data, error } = await supabase.from(resourceAktif).select(r.select || '*').order(r.order, { ascending: r.orderAsc !== false });
  if (error) { $('tbodyData').innerHTML = `<tr><td colspan="99" class="text-danger text-center py-4">Gagal memuat: ${esc(error.message)}</td></tr>`; return; }

  $('tabelKosong').classList.toggle('d-none', data.length > 0);
  $('tbodyData').innerHTML = data.map(row => `
    <tr>
      ${r.columns.map(c => {
        const v = ambil(row, c.key);
        return c.type === 'image' ? `<td><img class="thumb" src="${esc(imgUrl(v))}" alt=""></td>` : `<td>${esc(v ?? '-')}</td>`;
      }).join('')}
      <td class="text-end">
        <button class="btn btn-sm btn-outline-success rounded-pill me-1" data-aksi="edit" data-id="${row.id}"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-danger rounded-pill" data-aksi="hapus" data-id="${row.id}"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');

  $('tbodyData').querySelectorAll('[data-aksi="edit"]').forEach(b => b.addEventListener('click', () => bukaForm(data.find(d => d.id == b.dataset.id))));
  $('tbodyData').querySelectorAll('[data-aksi="hapus"]').forEach(b => b.addEventListener('click', () => hapusData(b.dataset.id)));
}

async function hapusData(id) {
  if (!confirm('Hapus data ini? Tindakan tidak bisa dibatalkan.')) return;
  const { error } = await supabase.from(resourceAktif).delete().eq('id', id);
  if (error) return alert('Gagal menghapus: ' + error.message);
  muatTabel();
}

/* ---------- Render & submit form (dipakai untuk tambah maupun edit) ---------- */
let dataEdit = null;
const modalForm = () => bootstrap.Modal.getOrCreateInstance($('modalForm'));

async function bukaForm(data = null) {
  dataEdit = data;
  const r = RESOURCES[resourceAktif];
  $('judulModal').textContent = data ? `Ubah ${r.label}` : `Tambah ${r.label}`;
  $('pesanForm').textContent = '';

  const potongan = await Promise.all(r.fields.map(async (f) => {
    const nilai = data ? data[f.name] : '';
    const wajib = f.required ? 'required' : '';
    const lebar = f.type === 'textarea' ? 'col-12' : 'col-md-6';
    if (f.type === 'textarea') return `<div class="${lebar}"><label class="form-label fw-semibold">${esc(f.label)}</label><textarea class="form-control" name="${f.name}" rows="3" ${wajib}>${esc(nilai)}</textarea></div>`;
    if (f.type === 'select') return `<div class="${lebar}"><label class="form-label fw-semibold">${esc(f.label)}</label><select class="form-select" name="${f.name}" ${wajib}><option value="">Pilih...</option>${f.options.map(o => `<option value="${o.value}" ${o.value === nilai ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></div>`;
    if (f.type === 'select-fk') {
      const opsi = await opsiFk(f);
      return `<div class="${lebar}"><label class="form-label fw-semibold">${esc(f.label)}</label><select class="form-select" name="${f.name}" ${wajib}><option value="">Pilih...</option>${opsi.map(o => `<option value="${o.value}" ${o.value === nilai ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></div>`;
    }
    if (f.type === 'image-url') return `<div class="col-12">
        <label class="form-label fw-semibold">${esc(f.label)}</label>
        <div class="d-flex align-items-center gap-3 mb-2">
          <img src="${esc(imgUrl(nilai))}" class="thumb" style="width:64px;height:64px;object-fit:cover;" data-preview-for="${f.name}" onerror="this.style.visibility='hidden'">
          <input type="url" class="form-control" name="${f.name}" placeholder="https://images.unsplash.com/..." value="${esc(nilai || '')}" data-preview-input>
        </div>
        <div class="form-text">Tempel URL gambar eksternal (mis. Unsplash). Kosongkan untuk memakai gambar bawaan.</div>
      </div>`;
    return `<div class="${lebar}"><label class="form-label fw-semibold">${esc(f.label)}</label><input type="${f.type}" class="form-control" name="${f.name}" value="${esc(nilai ?? '')}" ${wajib}></div>`;
  }));
  $('isiFormResource').innerHTML = potongan.join('');
  // pratinjau langsung saat URL gambar diketik/ditempel
  $('isiFormResource').querySelectorAll('[data-preview-input]').forEach((input) => {
    const preview = $('isiFormResource').querySelector(`[data-preview-for="${input.name}"]`);
    input.addEventListener('input', () => {
      preview.style.visibility = 'visible';
      preview.src = imgUrl(input.value.trim());
    });
  });
  modalForm().show();
}

$('btnTambah').addEventListener('click', () => bukaForm(null));

$('formResource').addEventListener('submit', async (e) => {
  e.preventDefault();
  const r = RESOURCES[resourceAktif];
  const form = new FormData(e.target);
  const btn = $('btnSimpanForm');
  btn.disabled = true; btn.textContent = 'Menyimpan...';
  try {
    const payload = {};
    for (const f of r.fields) {
      if (f.type === 'image-url') {
        // Konten editorial (kuliner/budaya/destinasi) memakai URL gambar eksternal,
        // TIDAK diunggah ke Supabase Storage. Storage tetap dipakai khusus untuk
        // unggahan pengguna (lihat unggahPengalaman di api.js).
        const url = (form.get(f.name) || '').trim();
        payload[f.name] = url || null;
      } else if (f.type === 'number') {
        const v = form.get(f.name);
        payload[f.name] = v === '' ? null : Number(v);
      } else if (f.type === 'select-fk') {
        payload[f.name] = form.get(f.name) ? Number(form.get(f.name)) : null;
      } else {
        payload[f.name] = form.get(f.name) || null;
      }
    }
    const q = dataEdit ? supabase.from(resourceAktif).update(payload).eq('id', dataEdit.id) : supabase.from(resourceAktif).insert(payload);
    cek(await q);
    modalForm().hide();
    muatTabel();
  } catch (err) {
    $('pesanForm').textContent = err.message || 'Gagal menyimpan data.';
  } finally {
    btn.disabled = false; btn.textContent = 'Simpan';
  }
});

/* ---------- Gerbang otentikasi admin ---------- */
(async () => {
  if (!siap) {
    $('aksesDitolak').classList.remove('d-none');
    $('aksesDitolak').querySelector('p').textContent = 'Supabase belum dikonfigurasi. Isi assets/js/config.js terlebih dahulu.';
    return;
  }
  const user = await penggunaAktif();
  if (!user || !(await apakahAdmin(user))) { $('aksesDitolak').classList.remove('d-none'); return; }
  $('infoUser').textContent = user.email;
  $('dashboard').classList.remove('d-none');
  renderMenu();
  muatTabel();
})();

$('btnKeluar').addEventListener('click', async () => { await keluarAkun(); location.href = '../index.html'; });
