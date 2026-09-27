import { siap } from '../supabase-client.js';
import { daftarAkun, masukAkun } from '../api.js';

const $ = (id) => document.getElementById(id);
let mode = 'masuk';
const pesan = (t, ok) => { $('aPesan').textContent = t; $('aPesan').className = 'small mb-3 ' + (ok ? 'text-success' : 'text-danger'); };

document.querySelectorAll('#tabAuth button').forEach(b => b.addEventListener('click', () => {
  mode = b.dataset.mode;
  document.querySelectorAll('#tabAuth button').forEach(x => x.classList.toggle('active', x === b));
  $('grupNama').classList.toggle('d-none', mode === 'masuk');
  $('aTombol').textContent = mode === 'masuk' ? 'Masuk' : 'Daftar';
  pesan('');
}));

$('formAuth').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!siap) return pesan('Supabase belum dikonfigurasi. Isi assets/js/config.js terlebih dahulu.');
  const email = $('aEmail').value.trim(), sandi = $('aSandi').value;
  if (!email || sandi.length < 6) return pesan('Isi email dan kata sandi (minimal 6 karakter).');
  $('aTombol').disabled = true;
  try {
    if (mode === 'daftar') {
      const { session } = await daftarAkun($('aNama').value.trim(), email, sandi);
      if (!session) return pesan('Pendaftaran berhasil. Cek email Anda untuk konfirmasi, lalu masuk.', true);
    } else await masukAkun(email, sandi);
    location.href = document.referrer.startsWith(location.origin) && !document.referrer.includes('login') ? document.referrer : 'index.html';
  } catch (err) { pesan(err.message || 'Terjadi kesalahan.'); }
  finally { $('aTombol').disabled = false; }
});
