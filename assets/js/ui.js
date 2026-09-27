import { penggunaAktif, keluarAkun } from './api.js';

// Escape teks dari database sebelum masuk ke innerHTML (cegah XSS)
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const bintang = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
export const param = (k) => new URLSearchParams(location.search).get(k);

/* ---------- avatar dari email (Gravatar), jatuh ke inisial kalau tidak ada foto ----------
   Gravatar mengunci foto profil ke hash MD5 dari email (dikelola pengguna di gravatar.com).
   Implementasi MD5 murni JS di bawah ini cuma dipakai untuk itu, bukan untuk keamanan. */
function md5(str) {
  const rotl = (n, c) => (n << c) | (n >>> (32 - c));
  const hex = (n) => { let s = ''; for (let i = 0; i < 4; i++) s += ((n >> (i * 8)) & 0xff).toString(16).padStart(2, '0'); return s; };
  const K = []; for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22, 5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
             4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23, 6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const bitLen = new TextEncoder().encode(str).length * 8;
  const bytes = Array.from(new TextEncoder().encode(str));
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 0; i < 8; i++) bytes.push(Math.floor(bitLen / Math.pow(2, i * 8)) & 0xff);
  let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    const M = []; for (let i = 0; i < 16; i++) M[i] = bytes[chunk + i*4] | (bytes[chunk + i*4+1] << 8) | (bytes[chunk + i*4+2] << 16) | (bytes[chunk + i*4+3] << 24);
    let [A, B, C, D] = [a0, b0, c0, d0];
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) >>> 0;
      [A, D, C] = [D, C, B]; B = (B + rotl(F, S[i])) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  return [a0, b0, c0, d0].map(hex).join('');
}
const inisialNama = (nama) => (nama || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';

// Dipanggil dari onerror foto Gravatar kalau pengguna belum punya foto di sana (404) -> ganti jadi lingkaran inisial
if (typeof window !== 'undefined') {
  window.__avatarGagal = (img) => {
    const div = document.createElement('div');
    div.className = 'avatar-initial ' + (img.dataset.avatarClass || '');
    const s = img.dataset.avatarSize || 40;
    div.style.width = s + 'px'; div.style.height = s + 'px'; div.style.fontSize = Math.round(s * 0.38) + 'px';
    div.textContent = img.dataset.inisial || '?';
    img.replaceWith(div);
  };
}

// Potongan HTML avatar: foto Gravatar dari email kalau ada, kalau tidak (atau tidak punya foto di Gravatar) tampil inisial nama
export function avatarHtml(nama, email, sizePx, kelasTambahan = '') {
  const inisial = inisialNama(nama);
  if (!email) return `<div class="avatar-initial ${kelasTambahan}" style="width:${sizePx}px;height:${sizePx}px;font-size:${Math.round(sizePx * 0.38)}px">${esc(inisial)}</div>`;
  const url = `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=404&s=${sizePx * 2}`;
  return `<img src="${url}" alt="${esc(nama || '')}" class="${kelasTambahan}" style="width:${sizePx}px;height:${sizePx}px;object-fit:cover"
    data-inisial="${esc(inisial)}" data-avatar-class="${kelasTambahan}" data-avatar-size="${sizePx}" onerror="window.__avatarGagal(this)">`;
}

// Tombol "Masuk" di navbar berubah menjadi "Keluar" bila sudah login
export async function pasangNavbar() {
  const tombol = document.querySelector('.navbar a[href="login.html"]');
  if (!tombol || !(await penggunaAktif())) return;
  tombol.textContent = 'Keluar'; tombol.href = '#';
  tombol.addEventListener('click', async (e) => { e.preventDefault(); await keluarAkun(); location.reload(); });
}
