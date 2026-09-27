import { siap } from '../supabase-client.js';
import { daftarBudaya, daftarKategori } from '../api.js';
import { param, pasangNavbar } from '../ui.js';
import { rowBudaya, pesanGagal, pesanSetup, pesanMuat } from '../components.js';

const $ = (id) => document.getElementById(id);
const wadah = $('daftarBudayaContainer');
const inputPencarian = $('inputPencarianBudaya');
const filterKategori = $('filterKategoriBudaya');
const pesanKosongEl = $('budayaKosong');

// Ambil kata kunci dari URL bila datang dari kolom pencarian di halaman lain (mis. ?q=saman)
const kataKunciAwal = param('q');
if (kataKunciAwal) inputPencarian.value = kataKunciAwal;

if (!siap) {
  // Supabase adalah satu-satunya sumber data konten: tanpa konfigurasi, tampilkan status setup (bukan data hardcoded)
  wadah.innerHTML = pesanSetup();
  pesanKosongEl.classList.add('d-none');
  [inputPencarian, filterKategori].forEach(el => el.disabled = true);
} else {
  let timer;
  const muat = async () => {
    wadah.innerHTML = pesanMuat();
    pesanKosongEl.classList.add('d-none');
    try {
      const data = await daftarBudaya({ q: inputPencarian.value, kategori: filterKategori.value });
      wadah.innerHTML = data.map((b, i) => rowBudaya(b, i)).join('');
      pesanKosongEl.classList.toggle('d-none', data.length > 0);
    } catch (e) { wadah.innerHTML = pesanGagal(); pesanKosongEl.classList.add('d-none'); console.error(e); }
  };
  const kategoriList = await daftarKategori('budaya');
  while (filterKategori.options.length > 1) filterKategori.remove(1);
  kategoriList.forEach(k => filterKategori.add(new Option(k.nama_kategori, k.slug)));

  inputPencarian.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(muat, 300); });
  filterKategori.addEventListener('change', muat);
  await muat();
}

pasangNavbar();
