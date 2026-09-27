import { penggunaAktif, keluarAkun } from './api.js';

// Escape teks dari database sebelum masuk ke innerHTML (cegah XSS)
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const bintang = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
export const param = (k) => new URLSearchParams(location.search).get(k);

// Tombol "Masuk" di navbar berubah menjadi "Keluar" bila sudah login
export async function pasangNavbar() {
  const tombol = document.querySelector('.navbar a[href="login.html"]');
  if (!tombol || !(await penggunaAktif())) return;
  tombol.textContent = 'Keluar'; tombol.href = '#';
  tombol.addEventListener('click', async (e) => { e.preventDefault(); await keluarAkun(); location.reload(); });
}
