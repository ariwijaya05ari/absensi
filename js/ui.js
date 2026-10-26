/* Helper UI: escape, ikon, tanggal, toast, modal, delegasi aksi */
const HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const ic = (n, c) => `<span class="ms ${c || ''}" aria-hidden="true">${n}</span>`;
const wib = () => new Date(Date.now() + 7 * 3600e3);
const todayWIB = () => wib().toISOString().slice(0, 10);
const dt = (t) => new Date(t + 'T12:00:00Z');
const tambahHari = (t, n) => new Date(dt(t).getTime() + n * 86400000).toISOString().slice(0, 10);
const hariDari = (t) => HARI[dt(t).getUTCDay()];
const tglPendek = (t) => { const d = dt(t); return `${d.getUTCDate()} ${BLN[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`; };
const tglPanjang = (t) => { const d = dt(t); return `${HARI[d.getUTCDay()]}, ${d.getUTCDate()} ${BLN[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const relTgl = (t) => (t === todayWIB() ? 'Hari ini' : t === tambahHari(todayWIB(), 1) ? 'Besok' : `${hariDari(t)}, ${tglPendek(t)}`);
const senin = (t) => { const u = dt(t).getUTCDay() || 7; return tambahHari(t, -(u - 1)); };
const inisial = (n) => String(n || '?').replace(/^(Hj\.|H\.|Dr\.|dr\.|Ust\.|Ustadz|Ustadzah)\s+/i, '').split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
const salam = () => { const h = wib().getUTCHours(); return h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam'; };
const angka = (n) => Number(n || 0).toLocaleString('id-ID');
const statusBadge = (s) => ({ Berlangsung: '<span class="badge navy"><span class="dot"></span>Berlangsung</span>', Terjadwal: '<span class="badge">Terjadwal</span>', Selesai: '<span class="badge">Selesai</span>', Dibatalkan: '<span class="badge err">Dibatalkan</span>', Hadir: '<span class="badge ok">Hadir</span>', Terlambat: '<span class="badge warn">Terlambat</span>' }[s] || `<span class="badge">${esc(s)}</span>`);

function ringSvg(frac, label, size) {
  const r = 26, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac || 0));
  return `<div class="ring" style="${size ? `width:${size}px;height:${size}px` : ''}"><svg viewBox="0 0 62 62" width="100%" height="100%"><circle cx="31" cy="31" r="${r}" fill="none" stroke="#e8e0d7" stroke-width="5"/><circle cx="31" cy="31" r="${r}" fill="none" stroke="#c98760" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}"/></svg><b>${esc(label)}</b></div>`;
}
const skeleton = (n) => '<div class="stack">' + Array.from({ length: n || 3 }, (_, i) => `<div class="skel" style="height:${i ? 120 : 170}px;border-radius:22px"></div>`).join('') + '</div>';
const kosong = (ikon, judul, teks, aksi) => `<div class="card center" style="padding:32px 20px"><div class="item-line" style="justify-content:center">${ic(ikon)}</div><h3 class="h-sm mt-s">${esc(judul)}</h3><p class="muted small mt-s">${esc(teks)}</p>${aksi || ''}</div>`;
const galat = (e, ulang) => `<div class="card center"><div class="alert err" style="text-align:left">${ic('error')}<div>${esc(e && e.message || e)}</div></div>${ulang ? `<button class="btn btn-ghost btn-sm mt" data-act="${ulang}">${ic('refresh')} Coba lagi</button>` : ''}</div>`;

let _tt;
function toast(msg, tipe) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.className = 'toast show ' + (tipe || ''); clearTimeout(_tt); _tt = setTimeout(() => t.classList.remove('show'), 3600);
}
function busy(btn, on, teks) {
  if (!btn) return; if (on) { btn.dataset.h = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin"></span> ${teks || 'Memproses…'}`; } else { btn.disabled = false; if (btn.dataset.h) btn.innerHTML = btn.dataset.h; }
}
// Modal: kembalikan {el, tutup}. onClose dipanggil sekali saat ditutup.
function modal(o) {
  const back = document.createElement('div'); back.className = 'modal-back';
  back.innerHTML = `<div class="modal ${o.wide ? 'wide' : ''}" role="dialog" aria-modal="true"><div class="modal-head"><div class="grow"><h2 class="h-md">${esc(o.judul || '')}</h2>${o.sub ? `<p class="muted small">${esc(o.sub)}</p>` : ''}</div><button class="icon-btn" data-act="modal-tutup" aria-label="Tutup">${ic('close')}</button></div><div class="modal-body">${o.isi || ''}</div>${o.kaki ? `<div class="modal-foot">${o.kaki}</div>` : ''}</div>`;
  document.body.appendChild(back);
  let tutup = false; const api_ = { el: back, body: $('.modal-body', back), tutup() { if (tutup) return; tutup = true; back.remove(); if (o.onClose) o.onClose(); } };
  back._m = api_; back.addEventListener('mousedown', (e) => { if (e.target === back && !o.kunci) api_.tutup(); });
  if (o.onMount) o.onMount(api_);
  return api_;
}
function konfirmasi(judul, teks, label, bahaya) {
  return new Promise((res) => {
    const m = modal({ judul, isi: `<p class="muted">${teks}</p>`, kaki: `<button class="btn btn-ghost" data-k="0">Batal</button><button class="btn ${bahaya ? 'btn-danger' : 'btn-primary'}" data-k="1">${esc(label || 'Ya, lanjutkan')}</button>`, onClose: () => res(false) });
    $$('[data-k]', m.el).forEach((b) => b.addEventListener('click', () => { const v = b.dataset.k === '1'; m.tutup(); res(v); }));
  });
}
function unduhBase64(nama, mime, b64) {
  const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  unduhBlob(nama, new Blob([u], { type: mime }));
}
function unduhBlob(nama, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nama; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
function csvEsc(v) { v = String(v == null ? '' : v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function ambilForm(f) { const o = {}; new FormData(f).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; }); return o; }

// Delegasi: data-act (klik), data-form (submit), data-in (input), data-ch (change)
const Acts = {}, Forms = {}, Ins = {}, Chs = {};
document.addEventListener('click', (e) => { const el = e.target.closest('[data-act]'); if (!el) return; const f = Acts[el.dataset.act]; if (f) { e.preventDefault(); f(el, e); } });
document.addEventListener('submit', (e) => { const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); if (Forms[f.dataset.form]) Forms[f.dataset.form](f, e); });
document.addEventListener('input', (e) => { const el = e.target.closest('[data-in]'); if (el && Ins[el.dataset.in]) Ins[el.dataset.in](el, e); });
document.addEventListener('change', (e) => { const el = e.target.closest('[data-ch]'); if (el && Chs[el.dataset.ch]) Chs[el.dataset.ch](el, e); });
Acts['modal-tutup'] = (el) => { const b = el.closest('.modal-back'); if (b && b._m) b._m.tutup(); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const b = $$('.modal-back').pop(); if (b && b._m) b._m.tutup(); } });

// Grafik SVG ringan
function grafikGaris(titik, target) {
  const W = 560, H = 210, L = 38, R = 14, T = 14, B = 34, n = titik.length;
  if (!n) return '<p class="muted small center">Belum ada data.</p>';
  const x = (i) => L + (n === 1 ? (W - L - R) / 2 : i * (W - L - R) / (n - 1)), y = (v) => T + (H - T - B) * (1 - Math.max(0, Math.min(100, v)) / 100);
  const pts = titik.map((p, i) => [x(i), y(p.persen)]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = path + ` L${pts[n - 1][0].toFixed(1)} ${H - B} L${pts[0][0].toFixed(1)} ${H - B} Z`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Tren kehadiran"><defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98760" stop-opacity=".35"/><stop offset="1" stop-color="#c98760" stop-opacity="0"/></linearGradient></defs>
  ${[0, 25, 50, 75, 100].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#e8e0d7" stroke-width="1"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10" fill="#76767e" font-family="JetBrains Mono">${v}%</text>`).join('')}
  <line x1="${L}" x2="${W - R}" y1="${y(target)}" y2="${y(target)}" stroke="#88512e" stroke-dasharray="5 4" stroke-width="1.2"/>
  <path d="${area}" fill="url(#gA)"/><path d="${path}" fill="none" stroke="#c98760" stroke-width="2.5" stroke-linejoin="round"/>
  ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#fff" stroke="#232b45" stroke-width="2"/><text x="${p[0]}" y="${H - 16}" text-anchor="middle" font-size="11" fill="#45464d">${esc(titik[i].label)}</text><text x="${p[0]}" y="${H - 3}" text-anchor="middle" font-size="10" fill="#88512e" font-family="JetBrains Mono">${titik[i].persen}%</text>`).join('')}</svg>`;
}
function grafikBatang(titik) {
  const W = 560, H = 200, B = 40, T = 20, n = titik.length; if (!n) return '<p class="muted small center">Belum ada data.</p>';
  const maks = Math.max(1, ...titik.map((t) => t.nilai)), bw = Math.min(70, (W - 20) / n - 14);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Grafik batang">${titik.map((t, i) => { const cx = 10 + (i + .5) * (W - 20) / n, h = (H - B - T) * t.nilai / maks, last = i === n - 1;
    return `<rect x="${cx - bw / 2}" y="${H - B - h}" width="${bw}" height="${Math.max(2, h)}" rx="10" fill="${last ? '#0e162f' : '#c98760'}" opacity="${last ? 1 : .85}"/><text x="${cx}" y="${H - B - h - 6}" text-anchor="middle" font-size="11" font-family="JetBrains Mono" fill="#232b45">${t.nilai}</text><text x="${cx}" y="${H - 18}" text-anchor="middle" font-size="11" fill="#45464d">${esc(t.label)}</text>${t.sub ? `<text x="${cx}" y="${H - 5}" text-anchor="middle" font-size="10" fill="#88512e" font-family="JetBrains Mono">${esc(t.sub)}</text>` : ''}`; }).join('')}</svg>`;
}
function donat(seg, tengah, sub) {
  const warna = ['#0e162f', '#c98760', '#ffb68c', '#d8b4b8', '#5a6180'], tot = seg.reduce((a, s) => a + s.nilai, 0), r = 52, c = 2 * Math.PI * r; let off = 0;
  const arcs = tot ? seg.map((s, i) => { const len = c * s.nilai / tot, a = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${warna[i % 5]}" stroke-width="18" stroke-dasharray="${len.toFixed(1)} ${(c - len).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}"/>`; off += len; return a; }).join('') : '';
  return `<div class="row gap-l wrap"><div style="position:relative;width:140px;height:140px"><svg viewBox="0 0 140 140" width="140" height="140" style="transform:rotate(-90deg)"><circle cx="70" cy="70" r="${r}" fill="none" stroke="#e8e0d7" stroke-width="18"/>${arcs}</svg><div style="position:absolute;inset:0;display:grid;place-content:center;text-align:center"><b class="h-lg" style="line-height:28px">${esc(tengah)}</b><span class="mono small muted">${esc(sub || '')}</span></div></div>
  <div class="grow stack" style="min-width:150px">${seg.map((s, i) => `<div class="row between small"><span><i class="dot" style="background:${warna[i % 5]};margin-right:6px"></i>${esc(s.label)}</span><b class="mono">${s.nilai}${tot ? ` · ${Math.round(s.nilai * 100 / tot)}%` : ''}</b></div>`).join('') || '<p class="muted small">Belum ada data.</p>'}</div></div>`;
}
