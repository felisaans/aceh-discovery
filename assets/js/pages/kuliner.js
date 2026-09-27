import { siap } from '../supabase-client.js';
import { daftarKuliner, ratingKuliner, daftarDaerah, daftarKategori } from '../api.js';
import { pasangNavbar, param } from '../ui.js';
import { rowKuliner, pesanKosong, pesanGagal, pesanSetup, pesanMuat } from '../components.js';

const $ = (id) => document.getElementById(id);
const wadah = $('daftarKulinerContainer');

// Ambil kata kunci dari URL (mis. dikirim dari kolom pencarian di beranda: kuliner.html?q=mie+aceh)
const kataKunciAwal = param('q');
if (kataKunciAwal) $('inputPencarian').value = kataKunciAwal;

if (!siap) {
  // Supabase adalah satu-satunya sumber data konten: tanpa konfigurasi, tampilkan status setup (bukan data hardcoded)
  wadah.innerHTML = pesanSetup();
  [$('inputPencarian'), $('filterDaerah'), $('filterKategori'), $('btnFilter')].forEach(el => el.disabled = true);
} else {
  const opsi = (sel, data, val, teks) => data.forEach(d => sel.add(new Option(d[teks], d[val])));
  let timer;
  const muat = async () => {
    wadah.innerHTML = pesanMuat();
    try {
      const [data, rating] = await Promise.all([
        daftarKuliner({ q: $('inputPencarian').value, daerah: $('filterDaerah').value, kategori: $('filterKategori').value }),
        ratingKuliner()]);
      wadah.innerHTML = data.length ? data.map((k, i) => rowKuliner(k, i, rating[k.id])).join('') : pesanKosong('Tidak ada kuliner yang cocok dengan pencarianmu.');
    } catch (e) { wadah.innerHTML = pesanGagal(); console.error(e); }
  };
  // isi pilihan filter dari database (opsi pertama "Semua ..." tetap dipertahankan dari HTML)
  const [d, k] = await Promise.all([daftarDaerah(), daftarKategori('kuliner')]);
  [$('filterDaerah'), $('filterKategori')].forEach(s => { while (s.options.length > 1) s.remove(1); });
  opsi($('filterDaerah'), d, 'slug', 'nama_daerah'); opsi($('filterKategori'), k, 'slug', 'nama_kategori');
  $('inputPencarian').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(muat, 300); });
  ['filterDaerah', 'filterKategori'].forEach(id => $(id).addEventListener('change', muat));
  $('btnFilter').addEventListener('click', muat);
  await muat();
}

pasangNavbar();
