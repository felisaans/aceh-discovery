import { siap } from '../supabase-client.js';
import { daftarPengalaman, unggahPengalaman, imgUrl, kulinerUnggulan, budayaUnggulan, daftarBerita, daftarDaerah, penggunaAktif } from '../api.js';
import { esc, pasangNavbar, avatarHtml } from '../ui.js';
import { cardMini, pasangChipDaerah, pesanSetup, pesanMuat } from '../components.js';

const $ = (id) => document.getElementById(id);
const kWadah = $('kulinerPopulerContainer');
const bWadah = $('budayaPilihanContainer');
const beritaWadah = $('beritaContainer');
const chipWadah = $('filterDaerahChips');
const inner = $('carouselPengalamanInner');
const form = $('formPengalaman');
const modalEl = $('modalUnggahPengalaman');

const filterKuliner = (target) => {
  document.querySelectorAll('.kuliner-populer-item').forEach(item => {
    const cocok = target === 'semua' || item.dataset.daerah === target || item.dataset.daerah === 'semua';
    item.style.display = cocok ? '' : 'none';
  });
};

/* ---------- deteksi kecerahan foto latar, supaya teks kutipan tetap terbaca ---------- */
function deteksiLuminance(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 40; canvas.height = 40;
        ctx.drawImage(img, 0, 0, 40, 40);
        const data = ctx.getImageData(0, 0, 40, 40).data;
        let total = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          count++;
        }
        resolve((total / count) < 140 ? 'is-dark' : 'is-light');
      } catch (e) { resolve('is-dark'); }
    };
    img.onerror = () => resolve('is-dark');
    img.src = url;
  });
}

/* ---------- kartu carousel pengalaman wisatawan (desain kartu editorial baru) ---------- */
async function buatSlide({ nama, teks, foto, daerah, email }) {
  const cls = await deteksiLuminance(foto);
  const item = document.createElement('div');
  item.className = 'carousel-item';
  item.innerHTML = `
    <div class="experience-card ${cls}" style="background-image: url('${esc(foto)}');">
      <div class="experience-overlay"></div>
      <div class="experience-header">
        <span class="experience-tag"><i class="fa-solid fa-location-dot me-1"></i> ${esc(daerah || 'Aceh')}</span>
      </div>
      <div class="experience-body">
        <div class="experience-glass-panel">
          <p class="experience-quote">"${esc(teks)}"</p>
          <div class="experience-footer">
            <div class="experience-user">
              ${avatarHtml(nama, email, 52, 'experience-avatar')}
              <div>
                <h6 class="experience-user-name mb-0">${esc(nama)}</h6>
                <p class="experience-user-role m-0">Wisatawan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  return item;
}

const tambahSlideAktif = async (item) => {
  document.querySelectorAll('#carouselPengalamanInner .carousel-item').forEach(el => el.classList.remove('active'));
  const slideBaru = await buatSlide(item);
  slideBaru.classList.add('active');
  inner.appendChild(slideBaru);
  bootstrap.Carousel.getOrCreateInstance(document.getElementById('carouselPengalaman')).to(inner.children.length - 1);
};

if (!siap) {
  // Supabase adalah satu-satunya sumber data konten: tanpa konfigurasi, tampilkan status setup (bukan data hardcoded/localStorage)
  const setup = pesanSetup();
  kWadah.innerHTML = `<div class="col-12">${setup}</div>`;
  bWadah.innerHTML = `<div class="col-12">${setup}</div>`;
  beritaWadah.innerHTML = `<div class="col-12">${setup}</div>`;
  inner.innerHTML = `<div class="carousel-item active">${setup}</div>`;
  form.querySelector('button[type="submit"]').disabled = true;
  form.addEventListener('submit', (e) => e.preventDefault());
} else {
  /* ---------- Kuliner Populer, Budaya Pilihan, Berita & Chip Daerah: dari Supabase ---------- */
  kWadah.innerHTML = `<div class="col-12">${pesanMuat()}</div>`;
  bWadah.innerHTML = `<div class="col-12">${pesanMuat()}</div>`;
  beritaWadah.innerHTML = `<div class="col-12">${pesanMuat()}</div>`;
  (async () => {
    try {
      const [kuliner, budaya, berita, daerah] = await Promise.all([
        kulinerUnggulan(4), budayaUnggulan(3), daftarBerita(3), daftarDaerah()
      ]);

      kWadah.innerHTML = kuliner.length ? kuliner.map(k => `
        <div class="col-lg-3 col-md-6 kuliner-populer-item" data-daerah="${esc(k.daerah?.slug || 'semua')}">
          ${cardMini({
            href: `kuliner-detail.html?slug=${encodeURIComponent(k.slug)}`,
            badge: '<i class="fa-solid fa-bowl-food me-1"></i> Kuliner',
            tipe: 'kuliner',
            lokasi: k.daerah?.nama_daerah || 'Seluruh Aceh', judul: k.nama, deskripsi: k.deskripsi, gambar: k.gambar,
          })}
        </div>`).join('') : '<p class="text-center text-muted py-4 w-100">Belum ada data kuliner.</p>';

      bWadah.innerHTML = budaya.length ? budaya.map(b => `
        <div class="col-lg-4 col-md-6">
          ${cardMini({
            href: `budaya.html?q=${encodeURIComponent(b.nama)}`,
            badge: `<i class="fa-solid fa-masks-theater me-1"></i> ${esc(b.kategori?.nama_kategori || 'Budaya')}`,
            tipe: 'budaya',
            lokasi: b.daerah?.nama_daerah || 'Seluruh Aceh', judul: b.nama, deskripsi: b.deskripsi, gambar: b.gambar,
            tombolTeks: 'Pelajari Filosofi'
          })}
        </div>`).join('') : '<p class="text-center text-muted py-4 w-100">Belum ada data budaya.</p>';

      beritaWadah.innerHTML = berita.length ? berita.map(n => `
        <div class="col-md-4">
          <div class="news-ticker-card p-4 h-100">
            <span class="badge bg-success-subtle text-success fw-bold mb-2">${esc(n.label || 'Cerita')}</span>
            <h5 class="fw-bold mb-2 font-editorial">${esc(n.judul)}</h5>
            <p class="text-muted small mb-3">${esc(n.ringkasan)}</p>
            <span class="text-secondary small"><i class="fa-regular fa-clock me-1"></i> ${new Date(n.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>`).join('') : '<p class="text-center text-muted py-4 w-100">Belum ada berita.</p>';

      pasangChipDaerah(chipWadah, daerah.filter(d => d.slug !== 'semua'), filterKuliner);

      /* dropdown daerah pada form "Bagikan Pengalaman" */
      const selDaerah = $('inputDaerahPengalaman');
      if (selDaerah) selDaerah.innerHTML = '<option value="" selected disabled>Pilih daerah...</option>' +
        daerah.map(d => `<option value="${d.id}">${esc(d.nama_daerah)}</option>`).join('');
    } catch (e) {
      console.error('Gagal memuat konten beranda:', e);
      [kWadah, bWadah, beritaWadah].forEach(el => el.innerHTML = '<p class="text-center text-danger py-4 w-100">Gagal memuat data. Coba muat ulang halaman.</p>');
    }
  })();

  /* ---------- Pengalaman Wisatawan (slide foto + cerita), tersimpan permanen di Supabase ---------- */
  inner.innerHTML = `<div class="carousel-item active">${pesanMuat()}</div>`;
  (async () => {
    try {
      const data = await daftarPengalaman();
      inner.innerHTML = data.length ? '' : `<div class="carousel-item active"><p class="text-center text-muted py-5 mb-0 w-100">Belum ada pengalaman yang dibagikan. Jadilah yang pertama!</p></div>`;
      const dibalik = data.slice().reverse();
      for (let i = 0; i < dibalik.length; i++) {
        const item = dibalik[i];
        const slide = await buatSlide({ nama: item.nama, teks: item.teks, foto: imgUrl(item.foto), daerah: item.daerah?.nama_daerah, email: item.email });
        if (i === dibalik.length - 1) slide.classList.add('active');
        inner.appendChild(slide);
      }
    } catch (e) { console.error('Gagal memuat pengalaman:', e); }
  })();

  /* ---------- Kartu info akun: kalau sudah masuk, sembunyikan input Nama dan pakai nama akun ---------- */
  (async () => {
    const user = await penggunaAktif();
    if (!user) return;
    const nama = user.user_metadata?.nama || user.user_metadata?.full_name || user.email.split('@')[0];
    $('userNameDisplay').textContent = nama;
    $('userInfoCard').classList.remove('d-none');
    $('grupNamaPengalaman').classList.add('d-none');
    $('inputNamaPengalaman').required = false;
    $('inputNamaPengalaman').value = nama;
    $('userAvatarWrap').innerHTML = avatarHtml(nama, user.email, 56, 'avatar-info-avatar');
  })();

  /* ---------- Dropzone upload foto (klik atau seret & lepas) ---------- */
  const dropzone = $('uploadDropzone');
  const fileInput = $('inputFotoPengalaman');
  const preview = $('filePreview');
  const previewBg = $('filePreviewBg');
  const fileNameEl = $('fileName');
  const fileSizeEl = $('fileSize');
  const removeBtn = $('removeFileBtn');

  const pilihFile = () => fileInput.click();
  dropzone.addEventListener('click', pilihFile);
  dropzone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pilihFile(); } });
  ['dragenter', 'dragover'].forEach(ev => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) { fileInput.files = e.dataTransfer.files; tampilkanPreview(file); }
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) tampilkanPreview(fileInput.files[0]); });

  function tampilkanPreview(file) {
    if (!file.type.startsWith('image/')) { alert('File harus berupa gambar (JPG, PNG, WEBP).'); fileInput.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { alert('Ukuran file maksimal 5MB.'); fileInput.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      previewBg.style.backgroundImage = `url('${e.target.result}')`;
      fileNameEl.textContent = file.name;
      fileSizeEl.textContent = (file.size / 1024).toFixed(1) + ' KB';
      preview.classList.remove('d-none');
      dropzone.classList.add('d-none');
    };
    reader.readAsDataURL(file);
  }
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.value = '';
    preview.classList.add('d-none');
    dropzone.classList.remove('d-none');
    previewBg.style.backgroundImage = '';
  });

  /* ---------- Submit form pengalaman ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama = $('inputNamaPengalaman').value.trim();
    const selDaerah = $('inputDaerahPengalaman');
    const daerahId = selDaerah.value;
    const daerahNama = selDaerah.selectedOptions[0]?.textContent || '';
    const destinasi = $('inputDestinasiPengalaman').value.trim();
    const rating = +$('inputRatingPengalaman').value;
    const cerita = $('inputTeksPengalaman').value.trim();
    const file = fileInput.files[0];
    if (!nama || !daerahId || !destinasi || !cerita || !file) return;

    const teks = `\u{1F4CD} ${destinasi} \u2014 ${'\u2605'.repeat(rating)}${'\u2606'.repeat(5 - rating)}\n\n${cerita}`;

    const tombolSubmit = $('submitBtn');
    const progressWrap = $('uploadProgress'), progressBar = $('uploadProgressBar'), progressText = $('uploadStatusText');
    tombolSubmit.disabled = true;
    progressWrap.classList.remove('d-none');
    progressBar.style.width = '30%';
    progressText.textContent = 'Mengunggah foto...';
    try {
      progressBar.style.width = '70%';
      const user = await penggunaAktif();
      const hasil = await unggahPengalaman(nama, teks, file, daerahId, user?.email || null);
      progressBar.style.width = '100%';
      progressText.textContent = 'Selesai!';
      await tambahSlideAktif({ nama: hasil.nama, teks: hasil.teks, foto: imgUrl(hasil.foto), daerah: hasil.daerah?.nama_daerah || daerahNama, email: hasil.email });
      form.reset();
      preview.classList.add('d-none');
      dropzone.classList.remove('d-none');
      previewBg.style.backgroundImage = '';
      if (user) $('inputNamaPengalaman').value = $('userNameDisplay').textContent;
      setTimeout(() => { progressWrap.classList.add('d-none'); progressBar.style.width = '0%'; }, 400);
      bootstrap.Modal.getInstance(modalEl).hide();
    } catch (err) {
      alert('Gagal mengunggah pengalaman: ' + err.message);
      console.error(err);
      progressWrap.classList.add('d-none');
    } finally {
      tombolSubmit.disabled = false;
    }
  });
}

pasangNavbar();
