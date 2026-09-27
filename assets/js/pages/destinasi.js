import { siap } from '../supabase-client.js';
import { daftarDestinasi, daftarDaerah } from '../api.js';
import { pasangNavbar } from '../ui.js';
import { rowDestinasi, pasangChipDaerah, pesanKosong, pesanGagal, pesanSetup, pesanMuat } from '../components.js';

const chipWadah = document.getElementById('filterDaerahChipsDestinasi');
const wadah = document.getElementById('daftarDestinasiContainer');

if (!siap) {
  // Supabase adalah satu-satunya sumber data konten: tanpa konfigurasi, tampilkan status setup (bukan data hardcoded)
  wadah.innerHTML = pesanSetup();
} else {
  const muat = async (daerah = '') => {
    wadah.innerHTML = pesanMuat();
    try {
      const data = await daftarDestinasi({ daerah });
      wadah.innerHTML = data.length ? data.map((d, i) => rowDestinasi(d, i)).join('') : pesanKosong('Belum ada destinasi untuk daerah ini.');
    } catch (e) { wadah.innerHTML = pesanGagal(); console.error(e); }
  };
  const daerah = await daftarDaerah();
  pasangChipDaerah(chipWadah, daerah.filter(d => d.slug !== 'semua'), (slug) => muat(slug === 'semua' ? '' : slug));
  await muat();
}

pasangNavbar();
