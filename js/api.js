/* Klien API — semua komunikasi ke GAS lewat fetch (POST text/plain agar tanpa preflight CORS) */
const Sesi = {
  mem: { t: '', me: null },
  get token() { try { return localStorage.getItem('ap_token') || this.mem.t; } catch (e) { return this.mem.t; } },
  get me() { try { return JSON.parse(localStorage.getItem('ap_me') || 'null') || this.mem.me; } catch (e) { return this.mem.me; } },
  set(t, me) {
    this.mem = { t: t || this.mem.t, me: me || this.mem.me };
    try { if (t) localStorage.setItem('ap_token', t); if (me) localStorage.setItem('ap_me', JSON.stringify(me)); } catch (e) { /* mode privat */ }
  },
  clear() { this.mem = { t: '', me: null }; try { localStorage.removeItem('ap_token'); localStorage.removeItem('ap_me'); } catch (e) { /* abaikan */ } }
};
class ApiError extends Error { constructor(msg, code) { super(msg); this.code = code || 'ERR'; } }

const _READ = /^(me|dashboard|jadwal\.list|kegiatan\.list|absen\.sesiAktif|riwayat\.saya|jamaah\.list|lokasi\.list|laporan\.data|pengaturan\.get|log\.list)$/;
const _cache = {}; const _inflight = {};
function bersihkanCache() { Object.keys(_cache).forEach((k) => delete _cache[k]); }

async function api(action, data, opt) {
  opt = opt || {};
  const url = (window.APP_CONFIG || {}).GAS_URL || '';
  if (!url || /GANTI|XXXX/.test(url)) throw new ApiError('Konfigurasi belum lengkap: isi GAS_URL di js/config.js.', 'CONFIG');
  const baca = _READ.test(action), key = action + '|' + JSON.stringify(data || {});
  if (baca && !opt.fresh) {
    const c = _cache[key]; if (c && Date.now() - c.t < (opt.ttl || 12000)) return c.v;
    if (_inflight[key]) return _inflight[key];
  }
  const p = (async () => {
    let res;
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: Sesi.token, data: data || {} }) });
      res = await r.json();
    } catch (e) { throw new ApiError('Tidak dapat terhubung ke server. Periksa sambungan internet Anda.', 'NET'); }
    if (!res.success) {
      if (res.code === 'AUTH' && !opt.tanpaLogout) { Sesi.clear(); window.dispatchEvent(new Event('ap:logout')); }
      throw new ApiError(res.message || 'Terjadi kesalahan.', res.code);
    }
    return res.data;
  })();
  if (baca) _inflight[key] = p; else bersihkanCache();
  try { const v = await p; if (baca) _cache[key] = { t: Date.now(), v }; return v; }
  finally { delete _inflight[key]; }
}
// Gabungkan beberapa pembacaan jadi 1 eksekusi server
async function apiBatch(calls) {
  const d = await api('batch', { calls });
  return d.hasil.map((h) => { if (!h.success) throw new ApiError(h.message, h.code); return h.data; });
}
async function pingServer() {
  try { const r = await fetch((APP_CONFIG.GAS_URL || '') + '?w=pub'); const j = await r.json(); return !!j.success; } catch (e) { return false; }
}
