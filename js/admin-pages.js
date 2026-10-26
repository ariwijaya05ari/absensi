/* Halaman pengurus (responsif: sidebar di desktop, navigasi bawah di ponsel) */
const PagesAdmin = {};
const Adm = { sesi: [], sm: null, timers: [] };
const phead = (eb, judul, sub, aksi) => `<div class="row between wrap" style="align-items:flex-end;gap:12px;margin-bottom:16px"><div><div class="eyebrow">${esc(eb)}</div><h1 class="h-xl" style="font-size:clamp(26px,4vw,38px);line-height:1.15">${esc(judul)}</h1>${sub ? `<p class="muted" style="max-width:640px">${esc(sub)}</p>` : ''}</div><div class="row wrap">${aksi || ''}</div></div>`;
const opt = (list, val, kosongLabel) => (kosongLabel !== undefined ? `<option value="">${esc(kosongLabel)}</option>` : '') + list.map((x) => `<option value="${esc(x.id)}" ${x.id === val ? 'selected' : ''}>${esc(x.nama)}</option>`).join('');
const pinModal = (judul, baris) => modal({ judul, sub: 'PIN hanya tampil sekali. Catat dan berikan langsung kepada jamaah yang bersangkutan.', isi: `<div class="stack">${baris.map((b) => `<div class="card flat row between"><div><b>${esc(b.nama)}</b><br><span class="small mono muted">${esc(b.id)}</span></div><span class="mono h-md" style="letter-spacing:.2em">${esc(b.pin)}</span></div>`).join('')}</div>`, kaki: `<button class="btn btn-ghost" data-act="pin-csv">${ic('download')} Unduh CSV</button><button class="btn btn-primary" data-act="modal-tutup">Sudah dicatat</button>`, onMount: () => { Adm.pinRows = baris; } });
Acts['pin-csv'] = () => unduhBlob('pin-awal-jamaah.csv', new Blob(['ID,Nama,PIN\n' + (Adm.pinRows || []).map((b) => [b.id, b.nama, b.pin].map(csvEsc).join(',')).join('\n')], { type: 'text/csv' }));

// ================================================================ DASHBOARD
PagesAdmin.beranda = async (v) => {
  v.innerHTML = skeleton(3);
  let d; try { d = await api('dashboard', {}, { fresh: true }); } catch (e) { v.innerHTML = galat(e, 'muat-ulang'); return; }
  const a = d.admin; Adm.sesi = a.sesiHariIni; const n = wib();
  const perJenis = Object.keys(a.perJenis).map((k) => ({ label: k, nilai: a.perJenis[k] })), totalJ = perJenis.reduce((s, x) => s + x.nilai, 0);
  v.innerHTML = phead(`${(App.me.app || {}).namaMajelis || 'Majelis'} • Zona WIB (UTC+7)`, 'Dashboard Ringkasan Presensi', tglPanjang(todayWIB()), `<button class="btn btn-primary" data-act="adm-catat">${ic('add_circle')} Catat presensi</button>`) + `
  <div class="grid-4">
    <div class="card stat"><div class="lbl">Total jamaah</div><div class="val">${a.totalJamaah} <small>orang</small></div><p class="small muted">${a.aktif} akun aktif • ${a.wajah} wajah terdaftar</p></div>
    <div class="card stat"><div class="lbl">Sesi hari ini</div><div class="val">${a.sesiHariIni.length} <small>sesi</small></div>${a.sesiBerlangsung ? `<span class="badge peach"><span class="dot"></span> ${a.sesiBerlangsung} sedang berlangsung</span>` : '<p class="small muted">Tidak ada sesi berlangsung</p>'}</div>
    <div class="card stat"><div class="lbl">Hadir hari ini</div><div class="val">${a.hadirHariIni} <small>jamaah</small></div><p class="small"><span class="dot ok"></span> ${a.tepatHariIni} tepat waktu &nbsp; <span class="dot"></span> ${a.terlambatHariIni} terlambat</p></div>
    <div class="card stat"><div class="lbl">Kehadiran bulan ini</div><div class="val">${a.kehadiranBulan}<small>%</small></div><div class="bar mt-s"><i style="width:${a.kehadiranBulan}%"></i></div><p class="small muted mt-s">Target ≥ ${a.target}%</p></div></div>
  <div class="grid-2 mt"><section class="card"><div class="row between"><div><h2 class="h-md">Tren kehadiran per pekan</h2><p class="small muted">Realisasi vs target (${a.target}%) • 4 pekan terakhir</p></div></div><div class="mt">${grafikGaris(a.tren, a.target)}</div></section>
  <section class="card"><h2 class="h-md">Kehadiran per jenis pengajian</h2><p class="small muted">Catatan kehadiran bulan ini</p><div class="mt">${donat(perJenis, String(totalJ), 'CATATAN')}</div></section></div>
  <div class="grid-2 mt"><section class="card"><div class="row between"><div><h2 class="h-md">Sesi pengajian hari ini</h2><p class="small muted">Monitoring ruang taklim dan batas GPS aktif</p></div><a class="small" href="#/jadwal"><b>Kalender</b> ›</a></div><div class="mt">${a.sesiHariIni.length ? a.sesiHariIni.map((s) => `<div class="session-row"><div class="grow" style="min-width:200px"><div class="row wrap"><span class="mono small muted">${esc(s.mulai)} – ${esc(s.selesai)} WIB</span>${statusBadge(s.status)}</div><b class="h-sm" style="display:block">${esc(s.judul)}</b><span class="small muted">${esc(s.pemateri || s.tempat)}</span><div class="row mt-s"><span class="small mono">Hadir ${s.hadir}/${s.target}</span><div class="bar grow"><i style="width:${s.target ? Math.min(100, s.hadir * 100 / s.target) : 0}%"></i></div></div></div><button class="btn btn-primary btn-sm" data-act="adm-sesi" data-id="${esc(s.id)}">${s.status === 'Selesai' ? 'Lihat rekap' : 'Buka presensi'}</button></div>`).join('') : '<p class="muted center" style="padding:20px">Tidak ada sesi hari ini.</p>'}</div></section>
  <section class="card"><h2 class="h-md">Aktivitas absen terbaru</h2><p class="small muted">Log verifikasi wajah, QR, dan GPS</p><div class="mt">${a.aktivitas.length ? a.aktivitas.map((x) => `<div class="act-row"><span class="avatar" style="width:36px;height:36px;font-size:12px">${esc(inisial(x.nama))}</span><div class="grow"><b>${esc(x.nama)}</b><br><span class="small muted">${esc(x.wilayah)}</span></div><div style="text-align:right"><span class="mono small">${esc(x.jam.slice(0, 5))} WIB</span><br><span class="badge mono" style="height:20px">${esc(x.metode)}${x.jarak != null ? ' ' + x.jarak + 'm' : ''}</span></div></div>`).join('') : '<p class="muted center" style="padding:20px">Belum ada aktivitas.</p>'}</div></section></div>`;
};
Acts['adm-catat'] = () => {
  const l = Adm.sesi.filter((s) => s.status !== 'Dibatalkan');
  if (!l.length) return toast('Tidak ada sesi hari ini. Buat jadwal terlebih dahulu.');
  if (l.length === 1) return sesiModal(l[0].id);
  modal({ judul: 'Pilih sesi', isi: `<div class="stack">${l.map((s) => `<button class="card flat row between" style="width:100%;text-align:left" data-act="adm-sesi" data-id="${esc(s.id)}"><span><b>${esc(s.judul)}</b><br><span class="small muted">${esc(s.mulai)} – ${esc(s.selesai)} WIB</span></span>${statusBadge(s.status)}</button>`).join('')}</div>` });
};
Acts['adm-sesi'] = (el) => { const o = $('.modal-back'); if (o && o._m) o._m.tutup(); sesiModal(el.dataset.id); };

// ---------- Modal presensi sesi: QR sesi • scan kartu • manual
function sesiModal(id) {
  const s = Adm.sesi.find((x) => x.id === id) || (AJ.data || []).find((x) => x.id === id) || { id, judul: 'Sesi pengajian', mulai: '', selesai: '' };
  Adm.sm = { id, tab: 'qr', s };
  const m = modal({ wide: true, judul: s.judul, sub: `${s.mulai} – ${s.selesai} WIB`, isi: `<div class="chips"><button class="chip" data-act="sm-tab" data-t="qr">${ic('qr_code_2')} QR sesi</button><button class="chip" data-act="sm-tab" data-t="kartu">${ic('qr_code_scanner')} Pindai kartu</button><button class="chip" data-act="sm-tab" data-t="manual">${ic('edit_note')} Absen manual</button><button class="chip" data-act="sm-tab" data-t="hadir">${ic('groups')} Yang hadir</button></div><div id="sm-body" class="mt"></div>`, onClose: () => { Adm.timers.forEach(clearInterval); Adm.timers = []; Cam.henti(); Pemindai.henti(); Adm.sm = null; } });
  smTab('qr');
}
Acts['sm-tab'] = (el) => smTab(el.dataset.t);
async function smTab(t) {
  const b = $('#sm-body'); if (!b || !Adm.sm) return; Adm.sm.tab = t;
  Adm.timers.forEach(clearInterval); Adm.timers = []; Cam.henti(); Pemindai.henti();
  $$('.modal-body .chips .chip').forEach((c) => c.classList.toggle('active', c.dataset.t === t));
  const id = Adm.sm.id;
  if (t === 'qr') {
    b.innerHTML = `<div class="center"><div class="qr-box" id="sm-qr" style="min-width:260px;min-height:260px"><span class="spin"></span></div><p class="small muted mt-s">Jamaah memindai QR ini lewat menu Absen → Scan QR. QR berganti otomatis tiap 30 detik agar tidak bisa dibagikan.</p><p class="h-lg mt-s" id="sm-cnt">–</p></div>`;
    const muat = async () => { try { const d = await api('sesi.qr', { idJadwal: id }, { fresh: true }); const e = $('#sm-qr'); if (e) e.innerHTML = await qrSvg(d.payload, 260); } catch (e) { const q = $('#sm-qr'); if (q) q.innerHTML = `<p class="small" style="color:var(--err)">${esc(e.message)}</p>`; } };
    const hitung = async () => { try { const d = await api('sesi.peserta', { idJadwal: id }, { fresh: true }); const e = $('#sm-cnt'); if (e) e.innerHTML = `${d.hadir.length} <small class="muted" style="font:500 14px var(--sans)">hadir • ${d.belum.length} belum</small>`; } catch (e) { /* abaikan */ } };
    muat(); hitung(); Adm.timers.push(setInterval(muat, 30000), setInterval(hitung, 10000));
  } else if (t === 'kartu') {
    b.innerHTML = `<div class="cam qr" style="max-width:360px;margin:0 auto"><video id="sm-video" playsinline muted></video><div class="guide"></div><div class="msg" id="sm-msg"><span class="spin"></span></div></div><p class="small muted center mt-s">Arahkan ke QR pada profil/kartu jamaah.</p>
    <form data-form="sm-kode" class="row mt" style="max-width:360px;margin-inline:auto"><input class="input mono grow" name="kode" placeholder="atau ketik kode, mis. JMH-002-1234" aria-label="Kode kartu"><button class="btn btn-primary">Catat</button></form><div id="sm-log" class="stack mt" style="max-width:360px;margin-inline:auto"></div>`;
    try { await Cam.mulai($('#sm-video'), false); $('#sm-msg').classList.add('hide'); let kunci = 0; await Pemindai.mulai($('#sm-video'), (k) => { if (Date.now() - kunci < 2500) return; kunci = Date.now(); smKartu(k); }); }
    catch (e) { const m = $('#sm-msg'); if (m) m.innerHTML = `<p>${esc(e.message)}</p>`; }
  } else if (t === 'manual' || t === 'hadir') {
    b.innerHTML = skeleton(1); let d;
    try { d = await api('sesi.peserta', { idJadwal: id }, { fresh: true }); } catch (e) { b.innerHTML = galat(e); return; }
    Adm.sm.peserta = d;
    if (t === 'hadir') b.innerHTML = `<p class="small muted">${d.hadir.length} jamaah tercatat hadir</p><div class="stack mt-s" style="max-height:50vh;overflow:auto">${d.hadir.map((h) => `<div class="act-row"><span class="avatar" style="width:34px;height:34px;font-size:12px">${esc(inisial(h.nama))}</span><div class="grow"><b>${esc(h.nama)}</b><br><span class="small muted mono">${esc(h.id)} • ${esc(h.jam.slice(0, 5))} • ${esc(h.metode)}</span></div>${statusBadge(h.status)}</div>`).join('') || '<p class="muted center">Belum ada yang hadir.</p>'}</div>`;
    else { b.innerHTML = `<div class="input-icon">${ic('search')}<input class="input" placeholder="Cari nama jamaah yang belum absen…" data-in="sm-cari"></div><div id="sm-list" class="mt" style="max-height:46vh;overflow:auto"></div>`; smDaftar(''); }
  }
}
function smDaftar(q) {
  const e = $('#sm-list'); if (!e || !Adm.sm) return; q = q.toLowerCase();
  const l = Adm.sm.peserta.belum.filter((u) => !q || (u.nama + u.id).toLowerCase().includes(q));
  e.innerHTML = l.length ? l.map((u) => `<div class="act-row"><div class="grow"><b>${esc(u.nama)}</b><br><span class="small muted mono">${esc(u.id)} • ${esc(u.wilayah)}</span></div><button class="btn btn-ghost btn-sm" data-act="sm-manual" data-id="${esc(u.id)}" data-st="Hadir">Hadir</button><button class="btn btn-ghost btn-sm" data-act="sm-manual" data-id="${esc(u.id)}" data-st="Terlambat">Terlambat</button></div>`).join('') : '<p class="muted center" style="padding:16px">Semua jamaah sudah tercatat atau tidak ditemukan.</p>';
}
Ins['sm-cari'] = (el) => smDaftar(el.value);
Acts['sm-manual'] = async (el) => {
  busy(el, true, '…');
  try { const r = await api('absen.manual', { idJadwal: Adm.sm.id, idJamaah: el.dataset.id, status: el.dataset.st }); toast(`${r.nama} dicatat ${r.status.toLowerCase()}.`, 'ok'); Adm.sm.peserta.belum = Adm.sm.peserta.belum.filter((u) => u.id !== el.dataset.id); smDaftar(($('.modal-body .input') || {}).value || ''); }
  catch (e) { busy(el, false); toast(e.message, 'err'); }
};
async function smKartu(kode) {
  const log = $('#sm-log'); if (!log || !Adm.sm) return;
  try { const r = await api('absen.scanKartu', { idJadwal: Adm.sm.id, kode }); toast(`✓ ${r.nama} — ${r.status}`, 'ok'); log.insertAdjacentHTML('afterbegin', `<div class="alert ok">${ic('check_circle', 'fill')}<div><b>${esc(r.nama)}</b> • ${esc(r.status)}</div></div>`); }
  catch (e) { toast(e.message, 'err'); log.insertAdjacentHTML('afterbegin', `<div class="alert err">${ic('error')}<div>${esc(e.message)}</div></div>`); }
}
Forms['sm-kode'] = (f) => { const k = ambilForm(f).kode; if (k) { smKartu(k); f.reset(); } };

// ================================================================ JADWAL
const AJ = { bulan: '', jenis: '', status: '', data: null, lokasi: [], jenisList: [] };
PagesAdmin.jadwal = async (v) => { if (!AJ.bulan) AJ.bulan = todayWIB().slice(0, 7); await jadwalAdm(v); };
async function jadwalAdm(v) {
  v = v || $('#view'); v.innerHTML = skeleton(2);
  const [y, m] = AJ.bulan.split('-').map(Number), dari = AJ.bulan + '-01', sampai = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  try { const [j, l] = await apiBatch([{ action: 'jadwal.list', data: { dari, sampai, idJenis: AJ.jenis, status: AJ.status, semua: true } }, { action: 'lokasi.list' }]); AJ.data = j.jadwal; AJ.jenisList = j.jenis; AJ.lokasi = l.lokasi; } catch (e) { v.innerHTML = galat(e, 'jadwal-adm'); return; }
  v.innerHTML = phead('Manajemen taklim & sesi GPS', 'Jadwal Pengajian Majelis', 'Kelola jadwal rutin pekanan, pemateri, tempat, dan penugasan titik geofence GPS untuk presensi tepat radius.', `<button class="btn btn-primary" data-act="jd-baru">${ic('add_circle')} Tambah jadwal baru</button>`) + `
  <section class="card"><div class="row wrap"><label class="field grow" style="min-width:160px"><span>Bulan</span><input class="input" type="month" value="${AJ.bulan}" data-ch="jd-bulan"></label><label class="field grow" style="min-width:160px"><span>Jenis</span><select class="input" data-ch="jd-jenis">${opt(AJ.jenisList, AJ.jenis, 'Semua jenis pengajian')}</select></label><label class="field grow" style="min-width:160px"><span>Status</span><select class="input" data-ch="jd-status">${['', 'Terjadwal', 'Berlangsung', 'Selesai', 'Dibatalkan'].map((s) => `<option value="${s}" ${AJ.status === s ? 'selected' : ''}>${s || 'Semua status'}</option>`).join('')}</select></label></div></section>
  <section class="card mt"><div class="row between"><h2 class="h-md">Agenda taklim terkonfirmasi</h2><span class="badge mono">${AJ.data.length} sesi</span></div><div class="tbl-wrap mt"><table class="tbl"><thead><tr><th>Tanggal &amp; waktu</th><th>Kategori &amp; materi</th><th>Lokasi geofence</th><th>Pemateri</th><th>Status</th><th>Hadir</th><th>Aksi</th></tr></thead><tbody>${AJ.data.map((s) => `<tr><td><b>${esc(hariDari(s.tanggal))}, ${esc(tglPendek(s.tanggal))}</b><br><span class="mono small muted">${esc(s.mulai)} – ${esc(s.selesai)}</span></td><td><span class="badge peach">${esc(s.jenis)}</span><br><span class="nm">${esc(s.judul)}</span>${s.materi ? `<br><span class="small muted">${esc(s.materi)}</span>` : ''}</td><td>${esc(s.tempat)}<br>${s.lokasi ? `<span class="badge mono" style="height:20px">${ic('adjust')} r ${s.lokasi.radius} m</span>` : '<span class="badge err">Tanpa GPS</span>'}</td><td>${esc(s.pemateri || '-')}</td><td>${statusBadge(s.status)}</td><td class="mono small">${s.hadir}/${s.target}</td><td><div class="row gap-s" style="min-width:150px"><button class="icon-btn" title="Presensi" data-act="adm-sesi" data-id="${esc(s.id)}">${ic('how_to_reg')}</button><button class="icon-btn" title="Ubah" data-act="jd-ubah" data-id="${esc(s.id)}">${ic('edit')}</button><button class="icon-btn" title="${s.dibatalkan ? 'Aktifkan' : 'Batalkan'}" data-act="jd-batal" data-id="${esc(s.id)}" data-b="${s.dibatalkan ? 0 : 1}">${ic(s.dibatalkan ? 'restore' : 'event_busy')}</button><button class="icon-btn" title="Hapus" data-act="jd-hapus" data-id="${esc(s.id)}" style="color:var(--err)">${ic('delete')}</button></div></td></tr>`).join('') || '<tr><td colspan="7" class="center muted" style="padding:28px">Belum ada jadwal pada filter ini.</td></tr>'}</tbody></table></div></section>
  <div class="grid-3 mt"><div class="card row">${ic('location_on')}<div><b class="h-md">${AJ.lokasi.length} titik</b><br><span class="small muted">Geofence aktif terdaftar</span></div></div><div class="card row">${ic('event')}<div><b class="h-md">${AJ.data.length} sesi</b><br><span class="small muted">Pada bulan terpilih</span></div></div><div class="card row">${ic('groups')}<div><b class="h-md">${AJ.data.reduce((a, s) => a + s.hadir, 0)} hadir</b><br><span class="small muted">Tercatat pada sesi bulan ini</span></div></div></div>`;
}
Acts['jadwal-adm'] = () => jadwalAdm();
Chs['jd-bulan'] = (el) => { if (el.value) { AJ.bulan = el.value; jadwalAdm(); } };
Chs['jd-jenis'] = (el) => { AJ.jenis = el.value; jadwalAdm(); };
Chs['jd-status'] = (el) => { AJ.status = el.value; jadwalAdm(); };
function jadwalForm(s) {
  s = s || { tanggal: todayWIB(), mulai: '16:30', selesai: '17:45', idLokasi: (AJ.lokasi[0] || {}).id || '' };
  if (!AJ.lokasi.length) { toast('Tambahkan titik Lokasi GPS dulu sebelum membuat jadwal.', 'err'); location.hash = '#/lokasi'; return; }
  modal({ judul: s.id ? 'Ubah jadwal' : 'Tambah jadwal baru', sub: 'Konfigurasi sesi pengajian & titik geofence', wide: true, isi: `<form data-form="jd-simpan" class="form-grid"><input type="hidden" name="id" value="${esc(s.id || '')}">
  <label class="field"><span>Jenis pengajian *</span><select class="input" name="idJenis" required>${opt(AJ.jenisList, s.idJenis)}</select></label>
  <label class="field"><span>Tanggal sesi *</span><input class="input" type="date" name="tanggal" value="${esc(s.tanggal)}" required></label>
  <label class="field full"><span>Judul / materi utama *</span><input class="input" name="judul" value="${esc(s.judul || '')}" required maxlength="120"></label>
  <label class="field"><span>Jam mulai *</span><input class="input" type="time" name="mulai" value="${esc(s.mulai)}" required></label>
  <label class="field"><span>Jam selesai *</span><input class="input" type="time" name="selesai" value="${esc(s.selesai)}" required></label>
  <label class="field"><span>Tempat / ruangan</span><input class="input" name="tempat" value="${esc(s.tempat || '')}"></label>
  <label class="field"><span>Pemateri</span><input class="input" name="pemateri" value="${esc(s.pemateri || '')}"></label>
  <label class="field full"><span>Rujukan materi</span><input class="input" name="materi" value="${esc(s.materi || '')}" placeholder="mis. Kitab Safinatun Najah"></label>
  <label class="field full"><span>Titik lokasi GPS * <em>radius jadi batas presensi</em></span><select class="input" name="idLokasi" required>${AJ.lokasi.map((l) => `<option value="${esc(l.id)}" ${l.id === s.idLokasi ? 'selected' : ''}>${esc(l.nama)} (radius ${l.radius} m)</option>`).join('')}</select></label>
  ${s.id ? '' : `<label class="full row between card flat" style="padding:12px 14px"><span><b>Ulangi rutin setiap pekan</b><br><span class="small muted">Otomatis membuat 8 sesi mingguan di hari yang sama</span></span><input class="switch" type="checkbox" name="ulang"></label>`}
  <div class="modal-foot full"><button type="button" class="btn btn-ghost" data-act="modal-tutup">Batal</button><button class="btn btn-primary">Simpan jadwal</button></div></form>` });
}
Acts['jd-baru'] = () => jadwalForm();
Acts['jd-ubah'] = (el) => jadwalForm(AJ.data.find((x) => x.id === el.dataset.id));
Forms['jd-simpan'] = async (f) => {
  const d = ambilForm(f), b = $('button:not([type=button])', f); busy(b, true);
  try { const r = await api('jadwal.simpan', { id: d.id || undefined, idJenis: d.idJenis, judul: d.judul, tanggal: d.tanggal, mulai: d.mulai, selesai: d.selesai, tempat: d.tempat, pemateri: d.pemateri, materi: d.materi, idLokasi: d.idLokasi, ulang: f.elements.ulang ? f.elements.ulang.checked : false }); $('.modal-back')._m.tutup(); toast(r && r.jumlah > 1 ? `${r.jumlah} sesi mingguan dibuat.` : 'Jadwal disimpan.', 'ok'); jadwalAdm(); }
  catch (e) { busy(b, false); toast(e.message, 'err'); }
};
Acts['jd-batal'] = async (el) => { const b = el.dataset.b === '1'; if (b && !(await konfirmasi('Batalkan sesi?', 'Sesi ditandai dibatalkan dan jamaah tidak dapat absen.', 'Batalkan sesi', true))) return; try { await api('jadwal.batal', { id: el.dataset.id, batal: b }); toast(b ? 'Sesi dibatalkan.' : 'Sesi diaktifkan.', 'ok'); jadwalAdm(); } catch (e) { toast(e.message, 'err'); } };
Acts['jd-hapus'] = async (el) => { if (!(await konfirmasi('Hapus jadwal?', 'Jadwal dihapus permanen. Catatan absen yang sudah ada tetap tersimpan namun tanpa nama sesi.', 'Hapus', true))) return; try { await api('jadwal.hapus', { id: el.dataset.id }); toast('Jadwal dihapus.', 'ok'); jadwalAdm(); } catch (e) { toast(e.message, 'err'); } };

// ================================================================ KEGIATAN
const AK = { list: [] };
PagesAdmin.kegiatan = async (v) => {
  v.innerHTML = skeleton(2);
  try { AK.list = (await api('kegiatan.list', {}, { fresh: true })).kegiatan; Kegi.list = AK.list; } catch (e) { v.innerHTML = galat(e, 'muat-ulang'); return; }
  v.innerHTML = phead('Pengumuman majelis', 'Kegiatan Majelis', 'Kelola agenda kegiatan sosial, khotmil, dan acara besar yang tampil di aplikasi jamaah.', `<button class="btn btn-primary" data-act="kg-baru">${ic('add_circle')} Tambah kegiatan</button>`) +
  `<div class="grid-3">${AK.list.map((k) => `<article class="card" style="padding:0">${kegHero(k)}<div style="padding:14px 16px"><div class="row between"><span class="badge ${k.publik ? 'ok' : ''}">${k.publik ? 'Dipublikasikan' : 'Draf'}</span><span class="badge ${k.akan ? 'peach' : ''}">${k.akan ? 'Akan datang' : 'Selesai'}</span></div><p class="small muted mt-s">${esc(k.tempat || '')} ${k.jam ? '• ' + esc(k.jam) + ' WIB' : ''}</p><div class="row mt"><button class="btn btn-ghost btn-sm grow" data-act="kg-ubah" data-id="${esc(k.id)}">${ic('edit')} Ubah</button><button class="btn btn-danger btn-sm" data-act="kg-hapus" data-id="${esc(k.id)}">${ic('delete')}</button></div></div></article>`).join('') || kosong('celebration', 'Belum ada kegiatan', 'Tambahkan kegiatan pertama untuk ditampilkan kepada jamaah.')}</div>`;
};
function kegiatanForm(k) {
  k = k || { tanggal: todayWIB(), publik: true };
  const kats = Array.from(new Set(AK.list.map((x) => x.kategori).filter(Boolean)));
  modal({ judul: k.id ? 'Ubah kegiatan' : 'Tambah kegiatan', wide: true, isi: `<form data-form="kg-simpan" class="form-grid"><input type="hidden" name="id" value="${esc(k.id || '')}">
  <label class="field full"><span>Judul kegiatan *</span><input class="input" name="judul" value="${esc(k.judul || '')}" required maxlength="140"></label>
  <label class="field"><span>Kategori</span><input class="input" name="kategori" list="kg-kat" value="${esc(k.kategori || '')}" placeholder="Sosial & Santunan"><datalist id="kg-kat">${kats.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></label>
  <label class="field"><span>Tanggal *</span><input class="input" type="date" name="tanggal" value="${esc(k.tanggal)}" required></label>
  <label class="field"><span>Jam</span><input class="input" type="time" name="jam" value="${esc(k.jam || '')}"></label>
  <label class="field"><span>Kuota (opsional)</span><input class="input" type="number" min="0" name="kuota" value="${k.kuota || ''}"></label>
  <label class="field full"><span>Tempat</span><input class="input" name="tempat" value="${esc(k.tempat || '')}"></label>
  <label class="field full"><span>Deskripsi</span><textarea class="input" name="deskripsi" maxlength="1500">${esc(k.deskripsi || '')}</textarea></label>
  <label class="field full"><span>Foto sampul <em>JPG/PNG, otomatis dikecilkan</em></span><input class="input" type="file" name="foto" accept="image/*"></label>
  <label class="full row between card flat" style="padding:12px 14px"><span><b>Tampilkan ke jamaah</b><br><span class="small muted">Matikan untuk menyimpan sebagai draf</span></span><input class="switch" type="checkbox" name="publik" ${k.publik !== false ? 'checked' : ''}></label>
  <div class="modal-foot full"><button type="button" class="btn btn-ghost" data-act="modal-tutup">Batal</button><button class="btn btn-primary">Simpan kegiatan</button></div></form>` });
}
Acts['kg-baru'] = () => kegiatanForm();
Acts['kg-ubah'] = (el) => kegiatanForm(AK.list.find((x) => x.id === el.dataset.id));
Forms['kg-simpan'] = async (f) => {
  const d = ambilForm(f), b = $('button:not([type=button])', f); busy(b, true, 'Menyimpan…');
  try {
    const p = { id: d.id || undefined, judul: d.judul, kategori: d.kategori, tanggal: d.tanggal, jam: d.jam, kuota: d.kuota, tempat: d.tempat, deskripsi: d.deskripsi, publik: f.elements.publik.checked };
    const file = f.elements.foto.files[0]; if (file) { p.fotoBase64 = await kecilkanFoto(file, 1000); p.fotoMime = 'image/jpeg'; }
    await api('kegiatan.simpan', p); $('.modal-back')._m.tutup(); toast('Kegiatan disimpan.', 'ok'); Router.render();
  } catch (e) { busy(b, false); toast(e.message, 'err'); }
};
Acts['kg-hapus'] = async (el) => { if (!(await konfirmasi('Hapus kegiatan?', 'Kegiatan akan dihapus dari aplikasi jamaah.', 'Hapus', true))) return; try { await api('kegiatan.hapus', { id: el.dataset.id }); toast('Kegiatan dihapus.', 'ok'); Router.render(); } catch (e) { toast(e.message, 'err'); } };

// ================================================================ DATA JAMAAH
const JM = { list: [], jenis: [], q: '', wil: '', jns: '', st: '', sel: new Set(), hal: 1, ukuran: 10 };
PagesAdmin.jamaah = async (v) => {
  v.innerHTML = skeleton(2);
  try { const d = await api('jamaah.list', {}, { fresh: true }); JM.list = d.jamaah; JM.jenis = d.jenis; } catch (e) { v.innerHTML = galat(e, 'muat-ulang'); return; }
  JM.sel = new Set(); JM.hal = 1; const wil = Array.from(new Set(JM.list.map((u) => u.wilayah).filter(Boolean))).sort(), L = JM.list;
  v.innerHTML = phead('Direktori majelis', 'Data Jamaah Majelis', `Kelola ${L.length} jamaah terdaftar, verifikasi biometrik wajah, dan kartu QR untuk presensi harian.`, `<button class="btn btn-ghost" data-act="jm-impor">${ic('upload_file')} Impor Excel / CSV</button><button class="btn btn-primary" data-act="jm-baru">${ic('person_add')} Tambah jamaah baru</button>`) + `
  <div class="grid-4"><div class="card stat"><div class="lbl">Total jamaah</div><div class="val">${L.length}</div></div><div class="card stat"><div class="lbl">Biometrik wajah</div><div class="val">${L.filter((u) => u.wajah).length} <small>/ ${L.length}</small></div></div><div class="card stat"><div class="lbl">Akun aktif</div><div class="val">${L.filter((u) => u.status === 'Aktif').length}</div></div><div class="card stat"><div class="lbl">Nonaktif</div><div class="val">${L.filter((u) => u.status !== 'Aktif').length}</div></div></div>
  <section class="card mt"><div class="row wrap"><div class="input-icon grow" style="min-width:200px">${ic('search')}<input class="input" placeholder="Cari nama atau ID jamaah…" data-in="jm-q" aria-label="Cari"></div><select class="input" style="width:auto" data-ch="jm-wil"><option value="">Semua wilayah</option>${wil.map((w) => `<option>${esc(w)}</option>`).join('')}</select><select class="input" style="width:auto" data-ch="jm-jns"><option value="">Semua pengajian</option>${JM.jenis.map((j) => `<option>${esc(j.nama)}</option>`).join('')}</select><select class="input" style="width:auto" data-ch="jm-st"><option value="">Semua status</option><option>Aktif</option><option>Nonaktif</option></select></div>
  <div id="jm-bulk"></div><div class="tbl-wrap mt"><table class="tbl"><thead><tr><th style="width:36px"><input type="checkbox" data-ch="jm-all" aria-label="Pilih semua"></th><th>ID</th><th>Nama lengkap</th><th>WhatsApp</th><th>Kelompok / wilayah</th><th>Jenis</th><th>Wajah</th><th>Akun</th><th>Aksi</th></tr></thead><tbody id="jm-body"></tbody></table></div><div id="jm-pager" class="row between wrap mt"></div></section>`;
  jmTabel();
};
function jmFilter() { const q = JM.q.toLowerCase(); return JM.list.filter((u) => (!q || (u.nama + ' ' + u.id).toLowerCase().includes(q)) && (!JM.wil || u.wilayah === JM.wil) && (!JM.jns || u.jenis.includes(JM.jns)) && (!JM.st || u.status === JM.st)); }
function jmTabel() {
  const l = jmFilter(), tot = l.length, hal = Math.max(1, Math.min(JM.hal, Math.ceil(tot / JM.ukuran))); JM.hal = hal; const p = l.slice((hal - 1) * JM.ukuran, hal * JM.ukuran);
  $('#jm-body').innerHTML = p.map((u) => `<tr class="${JM.sel.has(u.id) ? 'sel' : ''}"><td><input type="checkbox" data-ch="jm-pilih" data-id="${esc(u.id)}" ${JM.sel.has(u.id) ? 'checked' : ''} aria-label="Pilih ${esc(u.nama)}"></td><td><span class="badge mono">${esc(u.id)}</span></td><td><div class="row"><span class="avatar" style="width:38px;height:38px;font-size:12px">${esc(inisial(u.nama))}</span><div><span class="nm">${esc(u.nama)}</span><br><span class="small" style="color:var(--copper-dk)">${esc(u.jabatan || u.peran)}</span></div></div></td><td class="mono small">${esc(u.hp || '-')}</td><td>${esc(u.wilayah || '-')}</td><td>${u.jenis.map((j) => `<span class="badge peach" style="margin:1px">${esc(j)}</span>`).join('') || '-'}</td><td>${u.wajah ? '<span class="badge ok"><span class="dot ok"></span>Terdaftar</span>' : '<span class="badge warn"><span class="dot"></span>Belum ada</span>'}</td><td><span class="badge ${u.status === 'Aktif' ? '' : 'err'}">${esc(u.status)}</span></td><td><div class="row gap-s" style="min-width:210px"><button class="icon-btn" title="Ubah" data-act="jm-ubah" data-id="${esc(u.id)}">${ic('edit')}</button><button class="icon-btn" title="Daftarkan wajah" data-act="jm-wajah" data-id="${esc(u.id)}">${ic('face')}</button><button class="icon-btn" title="Kartu QR" data-act="jm-kartu" data-id="${esc(u.id)}">${ic('qr_code_2')}</button><button class="icon-btn" title="Reset PIN" data-act="jm-pin" data-id="${esc(u.id)}">${ic('password')}</button><button class="icon-btn" title="Hapus" data-act="jm-hapus" data-id="${esc(u.id)}" style="color:var(--err)">${ic('delete')}</button></div></td></tr>`).join('') || '<tr><td colspan="9" class="center muted" style="padding:28px">Tidak ada jamaah yang cocok.</td></tr>';
  const n = Math.ceil(tot / JM.ukuran) || 1;
  $('#jm-pager').innerHTML = `<span class="small muted">Menampilkan ${tot ? (hal - 1) * JM.ukuran + 1 : 0}–${Math.min(tot, hal * JM.ukuran)} dari ${tot} jamaah</span><div class="pager"><button data-act="jm-hal" data-n="${hal - 1}" ${hal <= 1 ? 'disabled' : ''} aria-label="Sebelumnya">${ic('chevron_left')}</button>${Array.from({ length: n }, (_, i) => i + 1).filter((i) => i === 1 || i === n || Math.abs(i - hal) <= 1).map((i, k, a) => (k && i - a[k - 1] > 1 ? '<span>…</span>' : '') + `<button class="${i === hal ? 'on' : ''}" data-act="jm-hal" data-n="${i}">${i}</button>`).join('')}<button data-act="jm-hal" data-n="${hal + 1}" ${hal >= n ? 'disabled' : ''} aria-label="Berikutnya">${ic('chevron_right')}</button></div>`;
  const b = $('#jm-bulk'); b.innerHTML = JM.sel.size ? `<div class="bulk"><span class="badge" style="background:var(--copper);color:#fff">${JM.sel.size}</span><span class="grow">Jamaah terpilih untuk tindakan massal</span><button class="btn btn-accent btn-sm" data-act="jm-cetak">${ic('qr_code_2')} Cetak kartu</button><button class="btn btn-ghost btn-sm" data-act="jm-massal" data-a="nonaktif">${ic('person_off')} Nonaktifkan</button><button class="btn btn-ghost btn-sm" data-act="jm-massal" data-a="aktif">${ic('person')} Aktifkan</button><button class="btn btn-sm" style="color:#fff" data-act="jm-batal">✕ Batal</button></div>` : '';
}
Ins['jm-q'] = (el) => { JM.q = el.value; JM.hal = 1; jmTabel(); };
Chs['jm-wil'] = (el) => { JM.wil = el.value; JM.hal = 1; jmTabel(); }; Chs['jm-jns'] = (el) => { JM.jns = el.value; JM.hal = 1; jmTabel(); }; Chs['jm-st'] = (el) => { JM.st = el.value; JM.hal = 1; jmTabel(); };
Chs['jm-all'] = (el) => { const p = jmFilter().slice((JM.hal - 1) * JM.ukuran, JM.hal * JM.ukuran); p.forEach((u) => (el.checked ? JM.sel.add(u.id) : JM.sel.delete(u.id))); jmTabel(); };
Chs['jm-pilih'] = (el) => { el.checked ? JM.sel.add(el.dataset.id) : JM.sel.delete(el.dataset.id); jmTabel(); };
Acts['jm-hal'] = (el) => { JM.hal = Number(el.dataset.n); jmTabel(); }; Acts['jm-batal'] = () => { JM.sel.clear(); jmTabel(); };
Acts['jm-massal'] = async (el) => { const a = el.dataset.a; if (!(await konfirmasi(a === 'aktif' ? 'Aktifkan akun?' : 'Nonaktifkan akun?', `${JM.sel.size} akun akan ${a === 'aktif' ? 'diaktifkan' : 'dinonaktifkan (tidak bisa login)'}.`, 'Ya, lanjutkan', a !== 'aktif'))) return; try { const r = await api('jamaah.massal', { ids: Array.from(JM.sel), aksi: a }); toast(r.jumlah + ' akun diperbarui.', 'ok'); Router.render(); } catch (e) { toast(e.message, 'err'); } };
function jamaahForm(u) {
  u = u || { jenis: [] }; const wil = Array.from(new Set(JM.list.map((x) => x.wilayah).filter(Boolean)));
  modal({ judul: u.id ? 'Ubah data jamaah' : 'Tambah jamaah baru', sub: u.id || 'ID dan PIN awal dibuat otomatis', wide: true, isi: `<form data-form="jm-simpan" class="form-grid"><input type="hidden" name="id" value="${esc(u.id || '')}">
  <label class="field full"><span>Nama lengkap *</span><input class="input" name="nama" value="${esc(u.nama || '')}" required minlength="3" maxlength="80"></label>
  <label class="field"><span>No. WhatsApp</span><input class="input mono" name="hp" value="${esc(u.hp || '')}" inputmode="tel"></label>
  <label class="field"><span>Kelompok / wilayah</span><input class="input" name="wilayah" list="jm-wil-l" value="${esc(u.wilayah || '')}"><datalist id="jm-wil-l">${wil.map((w) => `<option value="${esc(w)}">`).join('')}</datalist></label>
  <div class="field full"><span>Jenis pengajian yang diikuti</span><div class="row wrap">${JM.jenis.map((j) => `<label class="chip" style="cursor:pointer"><input type="checkbox" name="jenis" value="${esc(j.nama)}" ${(u.jenis || []).includes(j.nama) ? 'checked' : ''}> ${esc(j.nama)}</label>`).join('')}</div></div>
  <label class="field"><span>Peran</span><select class="input" name="peran"><option ${u.peran !== 'Admin' ? 'selected' : ''}>Jamaah</option><option ${u.peran === 'Admin' ? 'selected' : ''}>Admin</option></select></label>
  <label class="field"><span>Jabatan (opsional)</span><input class="input" name="jabatan" value="${esc(u.jabatan || '')}" placeholder="Ketua Kelompok"></label>
  ${u.id ? `<label class="field"><span>Status akun</span><select class="input" name="status"><option ${u.status === 'Aktif' ? 'selected' : ''}>Aktif</option><option ${u.status === 'Nonaktif' ? 'selected' : ''}>Nonaktif</option></select></label>` : ''}
  <div class="modal-foot full"><button type="button" class="btn btn-ghost" data-act="modal-tutup">Batal</button><button class="btn btn-primary">Simpan</button></div></form>` });
}
Acts['jm-baru'] = () => jamaahForm(); Acts['jm-ubah'] = (el) => jamaahForm(JM.list.find((u) => u.id === el.dataset.id));
Forms['jm-simpan'] = async (f) => {
  const d = ambilForm(f), b = $('button:not([type=button])', f), jenis = $$('input[name=jenis]:checked', f).map((x) => x.value); busy(b, true);
  try { const r = await api('jamaah.simpan', { id: d.id || undefined, nama: d.nama, hp: d.hp, wilayah: d.wilayah, jenis, peran: d.peran, jabatan: d.jabatan, status: d.status }); $('.modal-back')._m.tutup(); toast('Data jamaah disimpan.', 'ok'); await Router.render(); if (r.pin) pinModal('Jamaah ditambahkan', [{ id: r.id, nama: d.nama, pin: r.pin }]); }
  catch (e) { busy(b, false); toast(e.message, 'err'); }
};
Acts['jm-pin'] = async (el) => { const u = JM.list.find((x) => x.id === el.dataset.id); if (!(await konfirmasi('Reset PIN?', `PIN baru dibuat untuk <b>${esc(u.nama)}</b>. PIN lama dan sesi yang sedang login langsung tidak berlaku.`, 'Reset PIN'))) return; try { const r = await api('jamaah.resetPin', { id: u.id }); pinModal('PIN baru', [{ id: u.id, nama: u.nama, pin: r.pin }]); } catch (e) { toast(e.message, 'err'); } };
Acts['jm-hapus'] = async (el) => { const u = JM.list.find((x) => x.id === el.dataset.id); if (!(await konfirmasi('Hapus jamaah?', `Data <b>${esc(u.nama)}</b> dihapus permanen. Untuk menghentikan akses sementara, pilih Nonaktifkan.`, 'Hapus permanen', true))) return; try { await api('jamaah.hapus', { id: u.id }); toast('Data dihapus.', 'ok'); Router.render(); } catch (e) { toast(e.message, 'err'); } };

// ----- kartu QR (cetak)
async function cetakKartu(ids) {
  const l = JM.list.filter((u) => ids.includes(u.id)); if (!l.length) return;
  const nm = (App.me.app || {}).namaMajelis || 'Majelis'; toast('Menyiapkan kartu…');
  const kartu = await Promise.all(l.map(async (u) => `<div class="kartu"><b style="font:600 14px var(--serif)">${esc(nm)}</b><div style="margin:8px auto;width:150px">${await qrSvg(u.kode, 150)}</div><div style="font:600 15px var(--serif)">${esc(u.nama)}</div><div class="mono small">${esc(u.id)}</div><div class="mono" style="font-size:10px;color:#555">${esc(u.kode)}</div></div>`));
  let a = $('#print-area'); if (!a) { a = document.createElement('div'); a.id = 'print-area'; document.body.appendChild(a); }
  a.innerHTML = `<div class="cards-print">${kartu.join('')}</div>`; document.body.classList.add('printing');
  const sel = () => { document.body.classList.remove('printing'); a.innerHTML = ''; window.removeEventListener('afterprint', sel); }; window.addEventListener('afterprint', sel); setTimeout(() => window.print(), 250);
}
Acts['jm-kartu'] = (el) => cetakKartu([el.dataset.id]); Acts['jm-cetak'] = () => cetakKartu(Array.from(JM.sel));

// ----- daftar wajah
Acts['jm-wajah'] = (el) => {
  const u = JM.list.find((x) => x.id === el.dataset.id), S = { n: 0, sampel: [] };
  const m = modal({ judul: 'Daftarkan wajah', sub: `${u.nama} (${u.id})`, kunci: true, isi: `<div class="cam" style="max-width:340px;margin:0 auto"><video id="wj-video" playsinline muted></video><div class="guide"></div><div class="msg" id="wj-msg"><span class="spin"></span><p class="mt-s">Menyiapkan kamera…</p></div></div><p class="center mt" id="wj-info">Ambil 3 sampel dengan ekspresi/arah sedikit berbeda.</p><div class="modal-foot" style="justify-content:center"><button class="btn btn-primary" id="wj-btn" disabled>${ic('photo_camera')} Ambil sampel 1/3</button>${u.wajah ? `<button class="btn btn-danger" id="wj-del">${ic('delete')} Hapus data wajah</button>` : ''}</div>`, onClose: () => Cam.henti(),
    onMount: async (mm) => {
      const msg = $('#wj-msg', mm.el), btn = $('#wj-btn', mm.el);
      try { await Cam.mulai($('#wj-video', mm.el), true); await Face.muat((t) => { msg.innerHTML = `<span class="spin"></span><p class="mt-s">${esc(t)}</p>`; }); msg.classList.add('hide'); btn.disabled = false; } catch (e) { msg.innerHTML = `<p>${esc(e.message)}</p>`; }
      btn.addEventListener('click', async () => {
        busy(btn, true, 'Memindai…');
        try {
          S.sampel.push(await Face.ambil($('#wj-video', mm.el))); S.n++;
          if (S.n < 3) { busy(btn, false); btn.innerHTML = `${ic('photo_camera')} Ambil sampel ${S.n + 1}/3`; $('#wj-info', mm.el).textContent = `Sampel ${S.n} tersimpan. Ubah sedikit posisi wajah lalu ambil lagi.`; return; }
          const rata = S.sampel[0].map((_, i) => (S.sampel[0][i] + S.sampel[1][i] + S.sampel[2][i]) / 3);
          await api('jamaah.wajah', { id: u.id, descriptor: rata }); mm.tutup(); toast('Wajah berhasil didaftarkan.', 'ok'); Router.render();
        } catch (e) { busy(btn, false); toast(e.message, 'err'); }
      });
      const del = $('#wj-del', mm.el); if (del) del.addEventListener('click', async () => { try { await api('jamaah.wajah', { id: u.id, descriptor: null }); mm.tutup(); toast('Data wajah dihapus.', 'ok'); Router.render(); } catch (e) { toast(e.message, 'err'); } });
    } });
};

// ----- impor CSV / Excel
function parseCsv(t) {
  const baris1 = t.split(/\r?\n/)[0] || '', sep = (baris1.match(/;/g) || []).length > (baris1.match(/,/g) || []).length ? ';' : ',', out = []; let row = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true; else if (c === sep) { row.push(cur); cur = ''; } else if (c === '\n') { row.push(cur); out.push(row); row = []; cur = ''; } else if (c !== '\r') cur += c; }
  row.push(cur); out.push(row); return out.filter((r) => r.some((x) => String(x).trim()));
}
function petaKolom(rows) {
  const h = rows[0].map((x) => String(x).toLowerCase().replace(/[^a-z]/g, '')), cari = (...k) => h.findIndex((x) => k.some((y) => x.includes(y)));
  const ix = { nama: cari('nama'), hp: cari('hp', 'wa', 'whatsapp', 'telp', 'phone'), wilayah: cari('wilayah', 'kelompok', 'sektor'), jenis: cari('jenis', 'pengajian'), peran: cari('peran'), jabatan: cari('jabatan') };
  if (ix.nama < 0) throw new Error('Kolom "Nama" tidak ditemukan pada baris pertama.');
  return rows.slice(1).map((r) => ({ nama: String(r[ix.nama] || '').trim(), hp: ix.hp > -1 ? String(r[ix.hp] || '').trim() : '', wilayah: ix.wilayah > -1 ? String(r[ix.wilayah] || '').trim() : '', jenis: ix.jenis > -1 ? String(r[ix.jenis] || '').split(/[,;]/).map((x) => x.trim()).filter(Boolean) : [], peran: ix.peran > -1 ? String(r[ix.peran] || '').trim() : '', jabatan: ix.jabatan > -1 ? String(r[ix.jabatan] || '').trim() : '' })).filter((r) => r.nama);
}
Acts['jm-impor'] = () => modal({ judul: 'Impor jamaah', sub: 'Kolom: Nama, HP, Wilayah, Jenis, Peran, Jabatan — baris pertama sebagai judul kolom.', isi: `<div class="stack"><button class="btn btn-ghost btn-sm" data-act="jm-templat" style="justify-self:start">${ic('download')} Unduh templat CSV</button><input class="input" type="file" accept=".csv,.xlsx,.xls" data-ch="jm-berkas"><div id="im-info" class="small muted">Pilih berkas untuk melihat pratinjau.</div></div>`, kaki: `<button class="btn btn-ghost" data-act="modal-tutup">Batal</button><button class="btn btn-primary" id="im-go" data-act="jm-impor-go" disabled>Impor sekarang</button>` });
Acts['jm-templat'] = () => unduhBlob('templat-jamaah.csv', new Blob(['Nama,HP,Wilayah,Jenis,Peran,Jabatan\nHj. Contoh Nama,081234567890,Sektor Barat,"Ibu-ibu",Jamaah,\n'], { type: 'text/csv' }));
Chs['jm-berkas'] = async (el) => {
  const f = el.files[0], info = $('#im-info'); if (!f) return; info.textContent = 'Membaca berkas…'; Adm.impor = null;
  try {
    let rows; if (/\.csv$/i.test(f.name)) rows = parseCsv(await f.text()); else { await Lib.muat(CDN.xlsx); const wb = window.XLSX.read(await f.arrayBuffer(), { type: 'array' }); rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }); }
    if (rows.length < 2) throw new Error('Berkas kosong.'); const data = petaKolom(rows); if (!data.length) throw new Error('Tidak ada baris dengan nama.'); Adm.impor = data;
    info.innerHTML = `<div class="alert ok">${ic('check_circle')}<div><b>${data.length} baris</b> siap diimpor. Duplikat (nama + HP sama) akan dilewati.</div></div><div class="small mt-s">Contoh: ${data.slice(0, 3).map((x) => esc(x.nama)).join(', ')}…</div>`; $('#im-go').disabled = false;
  } catch (e) { info.innerHTML = `<div class="alert err">${ic('error')}<div>${esc(e.message)}</div></div>`; $('#im-go').disabled = true; }
};
Acts['jm-impor-go'] = async (el) => {
  const data = Adm.impor || [], hasil = []; let lewati = 0; busy(el, true, 'Mengimpor 0%');
  try { for (let i = 0; i < data.length; i += 20) { const r = await api('jamaah.impor', { rows: data.slice(i, i + 20) }); hasil.push(...r.hasil); lewati += r.lewati; el.innerHTML = `<span class="spin"></span> Mengimpor ${Math.min(100, Math.round((i + 20) * 100 / data.length))}%`; } $('.modal-back')._m.tutup(); toast(`${hasil.length} jamaah diimpor, ${lewati} dilewati.`, 'ok'); await Router.render(); if (hasil.length) pinModal('Impor selesai — catat PIN awal', hasil); }
  catch (e) { busy(el, false); toast(e.message + (hasil.length ? ` (${hasil.length} baris sebelumnya sudah masuk)` : ''), 'err'); }
};

// ================================================================ LOKASI GPS
const LK = { list: [] };
PagesAdmin.lokasi = async (v) => {
  v.innerHTML = skeleton(2);
  try { LK.list = (await api('lokasi.list', {}, { fresh: true })).lokasi; } catch (e) { v.innerHTML = galat(e, 'muat-ulang'); return; }
  v.innerHTML = phead('Geofence presensi', 'Lokasi GPS & Radius', 'Tentukan titik pusat dan radius toleransi. Jamaah hanya bisa absen bila berada di dalam radius saat sesi dibuka.', `<button class="btn btn-primary" data-act="lk-baru">${ic('add_location_alt')} Tambah titik lokasi</button>`) +
  `<div class="grid-3">${LK.list.map((l) => `<article class="card"><div class="row between"><span class="item-line" style="padding:0">${ic('location_on')}</span><span class="badge mono">r ${l.radius} m</span></div><h3 class="h-md mt-s">${esc(l.nama)}</h3><p class="mono small muted">${l.lat.toFixed(6)}, ${l.lng.toFixed(6)}</p><p class="small muted">Dipakai ${l.dipakai} jadwal</p><div class="row mt wrap"><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${l.lat},${l.lng}">${ic('map')} Lihat peta</a><button class="btn btn-ghost btn-sm" data-act="lk-ubah" data-id="${esc(l.id)}">${ic('edit')}</button><button class="btn btn-danger btn-sm" data-act="lk-hapus" data-id="${esc(l.id)}">${ic('delete')}</button></div></article>`).join('') || kosong('location_off', 'Belum ada titik lokasi', 'Tambahkan titik pengajian agar sesi bisa memakai validasi GPS.')}</div>
  <div class="alert info mt">${ic('info')}<div>Tip: datang ke lokasi pengajian, buka form titik lokasi di ponsel, lalu ketuk <b>Gunakan lokasi saya</b> agar koordinat akurat.</div></div>`;
};
function lokasiForm(l) {
  l = l || { radius: 50, lat: '', lng: '' };
  modal({ judul: l.id ? 'Ubah titik lokasi' : 'Tambah titik lokasi', isi: `<form data-form="lk-simpan" class="form-grid"><input type="hidden" name="id" value="${esc(l.id || '')}">
  <label class="field full"><span>Nama lokasi *</span><input class="input" name="nama" value="${esc(l.nama || '')}" required placeholder="Masjid Al-Ikhlas"></label>
  <label class="field"><span>Latitude *</span><input class="input mono" name="lat" value="${l.lat}" required inputmode="decimal"></label><label class="field"><span>Longitude *</span><input class="input mono" name="lng" value="${l.lng}" required inputmode="decimal"></label>
  <div class="full"><button type="button" class="btn btn-ghost btn-sm" data-act="lk-gps">${ic('my_location')} Gunakan lokasi saya</button></div>
  <label class="field full"><span>Radius presensi (meter) * <em>10–1000</em></span><input class="input" type="number" name="radius" min="10" max="1000" value="${l.radius}" required></label>
  <div class="modal-foot full"><button type="button" class="btn btn-ghost" data-act="modal-tutup">Batal</button><button class="btn btn-primary">Simpan lokasi</button></div></form>` });
}
Acts['lk-baru'] = () => lokasiForm(); Acts['lk-ubah'] = (el) => lokasiForm(LK.list.find((x) => x.id === el.dataset.id));
Acts['lk-gps'] = async (el) => { busy(el, true, 'Mencari…'); try { const p = await Gps.satu(); const f = el.closest('form'); f.elements.lat.value = p.lat.toFixed(6); f.elements.lng.value = p.lng.toFixed(6); toast(`Lokasi terisi (akurasi ±${Math.round(p.akurasi)} m).`, 'ok'); } catch (e) { toast(e.message, 'err'); } busy(el, false); };
Forms['lk-simpan'] = async (f) => { const d = ambilForm(f), b = $('button:not([type=button])', f); busy(b, true); try { await api('lokasi.simpan', { id: d.id || undefined, nama: d.nama, lat: d.lat.replace(',', '.'), lng: d.lng.replace(',', '.'), radius: d.radius }); $('.modal-back')._m.tutup(); toast('Lokasi disimpan.', 'ok'); Router.render(); } catch (e) { busy(b, false); toast(e.message, 'err'); } };
Acts['lk-hapus'] = async (el) => { if (!(await konfirmasi('Hapus titik lokasi?', 'Hanya bisa dihapus bila tidak dipakai jadwal.', 'Hapus', true))) return; try { await api('lokasi.hapus', { id: el.dataset.id }); toast('Lokasi dihapus.', 'ok'); Router.render(); } catch (e) { toast(e.message, 'err'); } };

// ================================================================ LAPORAN
const LP = { f: null, d: null };
PagesAdmin.laporan = async (v) => {
  if (!LP.f) { const t = todayWIB(); LP.f = { dari: t.slice(0, 8) + '01', sampai: t, idJenis: '', wilayah: '', status: '', q: '', page: 1, pageSize: 10 }; }
  await laporanMuat(v);
};
async function laporanMuat(v) {
  v = v || $('#view'); const fokus = document.activeElement && document.activeElement.name; v.innerHTML = skeleton(2);
  try { LP.d = await api('laporan.data', LP.f, { fresh: true }); } catch (e) { v.innerHTML = galat(e, 'lp-ulang'); return; }
  const d = LP.d, f = LP.f, hal = d.halaman, n = Math.ceil(d.total / d.ukuran) || 1;
  v.innerHTML = phead('Audit & rekapitulasi', 'Laporan & Rekap Kehadiran', 'Audit presensi terhubung ke Google Sheets, grafik tren pekanan, dan ekspor dokumen resmi majelis.', `<button class="btn btn-ghost" data-act="lp-ekspor" data-f="xlsx">${ic('table_view')} Unduh Excel (.xlsx)</button><button class="btn btn-primary" data-act="lp-ekspor" data-f="pdf">${ic('print')} Unduh PDF resmi</button>`) + `
  <section class="card"><form data-form="lp-filter" class="row wrap" style="align-items:flex-end"><label class="field"><span>Dari</span><input class="input" type="date" name="dari" value="${f.dari}"></label><label class="field"><span>Sampai</span><input class="input" type="date" name="sampai" value="${f.sampai}"></label><label class="field"><span>Jenis</span><select class="input" name="idJenis">${opt(d.jenis, f.idJenis, 'Semua jenis')}</select></label><label class="field"><span>Wilayah</span><select class="input" name="wilayah"><option value="">Semua wilayah</option>${d.wilayah.map((w) => `<option ${w === f.wilayah ? 'selected' : ''}>${esc(w)}</option>`).join('')}</select></label><label class="field"><span>Status</span><select class="input" name="status">${['', 'Hadir', 'Terlambat'].map((s) => `<option value="${s}" ${f.status === s ? 'selected' : ''}>${s || 'Semua status'}</option>`).join('')}</select></label><label class="field grow"><span>Cari jamaah / ID</span><input class="input" name="q" value="${esc(f.q)}" placeholder="Ketik nama atau ID…"></label><button class="btn btn-primary">${ic('filter_alt')} Terapkan</button></form></section>
  <div class="grid-4 mt"><div class="card stat"><div class="lbl">Total rekapitulasi</div><div class="val">${angka(d.total)} <small>record</small></div></div><div class="card stat"><div class="lbl">Tepat waktu</div><div class="val">${angka(d.tepat)}</div><p class="small muted">${d.total ? Math.round(d.tepat * 1000 / d.total) / 10 : 0}% dari total</p></div><div class="card stat"><div class="lbl">Terlambat</div><div class="val">${angka(d.terlambat)}</div><p class="small muted">${d.total ? Math.round(d.terlambat * 1000 / d.total) / 10 : 0}% dari total</p></div><div class="card stat"><div class="lbl">Rerata kehadiran</div><div class="val">${d.rerata}<small>%</small></div><p class="small ${d.rerata >= d.targetKehadiran ? '' : 'muted'}">${d.rerata >= d.targetKehadiran ? '✓ Target tercapai' : 'Target min. ' + d.targetKehadiran + '%'}</p></div></div>
  <div class="grid-3 mt"><section class="card"><h2 class="h-md">Tren kehadiran mingguan</h2><p class="small muted">Jumlah hadir per pekan pada rentang terpilih</p><div class="mt">${grafikBatang(d.tren.map((t) => ({ label: tglPendek(t.dari).slice(0, -5), nilai: t.hadir, sub: t.persen + '%' })))}</div></section>
  <section class="card"><h2 class="h-md">Distribusi jenis</h2><p class="small muted">Porsi catatan per jenis pengajian</p><div class="mt">${donat(Object.keys(d.perJenis).map((k) => ({ label: k, nilai: d.perJenis[k] })), String(d.total), 'CATATAN')}</div></section>
  <section class="card"><h2 class="h-md">5 jamaah teladan</h2><p class="small muted">Paling konsisten tepat waktu</p><div class="mt">${d.teladan.map((t, i) => `<div class="act-row"><b class="mono">${i + 1}</b><div class="grow"><b>${esc(t.nama)}</b><div class="bar mt-s"><i style="width:${Math.round(t.rasio * 100)}%"></i></div></div><span class="mono small">${t.tepat}/${t.sesi}</span></div>`).join('') || '<p class="muted small">Belum ada data.</p>'}</div></section></div>
  <section class="card mt"><h2 class="h-md">Log audit presensi</h2><p class="small muted">Catatan terbaru dengan verifikasi GPS radius & metode</p><div class="tbl-wrap mt"><table class="tbl"><thead><tr><th>Tanggal &amp; jam</th><th>Jenis</th><th>ID</th><th>Nama</th><th>Wilayah</th><th>Metode</th><th>Status</th></tr></thead><tbody>${d.baris.map((r) => `<tr><td class="mono small">${esc(r.tanggal.split('-').reverse().join('/'))}<br>${esc(r.jam)} WIB</td><td>${esc(r.jenis)}</td><td><span class="badge mono">${esc(r.idJamaah)}</span></td><td><b>${esc(r.nama)}</b></td><td class="small">${esc(r.wilayah)}</td><td><span class="badge mono">${esc(r.metode)}${r.jarak != null ? ' [GPS ' + r.jarak + 'm]' : ''}</span></td><td>${statusBadge(r.status)}</td></tr>`).join('') || '<tr><td colspan="7" class="center muted" style="padding:28px">Tidak ada catatan pada filter ini.</td></tr>'}</tbody></table></div>
  <div class="row between wrap mt"><span class="small muted">Menampilkan ${d.total ? (hal - 1) * d.ukuran + 1 : 0}–${Math.min(d.total, hal * d.ukuran)} dari ${angka(d.total)} data</span><div class="pager"><button data-act="lp-hal" data-n="${hal - 1}" ${hal <= 1 ? 'disabled' : ''} aria-label="Sebelumnya">${ic('chevron_left')}</button><span class="mono small">Halaman ${hal} / ${n}</span><button data-act="lp-hal" data-n="${hal + 1}" ${hal >= n ? 'disabled' : ''} aria-label="Berikutnya">${ic('chevron_right')}</button></div></div></section>`;
}
Acts['lp-ulang'] = () => laporanMuat();
Forms['lp-filter'] = (f) => { LP.f = Object.assign(LP.f, ambilForm(f), { page: 1 }); laporanMuat(); };
Acts['lp-hal'] = (el) => { LP.f.page = Number(el.dataset.n); laporanMuat(); };
Acts['lp-ekspor'] = async (el) => { busy(el, true, 'Menyiapkan…'); try { const r = await api('laporan.ekspor', Object.assign({}, LP.f, { format: el.dataset.f })); unduhBase64(r.nama, r.mime, r.base64); toast(`Berkas siap (${r.baris} baris).`, 'ok'); } catch (e) { toast(e.message, 'err'); } busy(el, false); };

// ================================================================ PENGATURAN
PagesAdmin.pengaturan = async (v) => {
  v.innerHTML = skeleton(2); let p, lg;
  try { [p, lg] = await apiBatch([{ action: 'pengaturan.get' }, { action: 'log.list' }]); } catch (e) { v.innerHTML = galat(e, 'muat-ulang'); return; }
  v.innerHTML = phead('Konfigurasi', 'Pengaturan Aplikasi', 'Aturan keterlambatan, jendela absen, dan ambang verifikasi wajah.') + `<section class="card"><form data-form="pg-simpan" class="form-grid">${p.pengaturan.map((x) => `<label class="field"><span>${esc(x.kunci.replace(/_/g, ' '))}</span><input class="input" name="${esc(x.kunci)}" value="${esc(x.nilai)}"><small>${esc(x.keterangan)}</small></label>`).join('')}<div class="modal-foot full"><button class="btn btn-primary">Simpan pengaturan</button></div></form></section>
  <section class="card mt"><h2 class="h-md">Log aktivitas pengurus</h2><div class="tbl-wrap mt"><table class="tbl"><thead><tr><th>Waktu</th><th>Pelaku</th><th>Aksi</th><th>Objek</th><th>Detail</th></tr></thead><tbody>${lg.log.map((l) => `<tr><td class="mono small">${esc(l.waktu)}</td><td>${esc(l.pelaku)}</td><td><span class="badge mono">${esc(l.aksi)}</span></td><td class="mono small">${esc(l.entitas)}</td><td class="small">${esc(l.detail)}</td></tr>`).join('') || '<tr><td colspan="5" class="center muted">Belum ada aktivitas.</td></tr>'}</tbody></table></div></section>`;
};
Forms['pg-simpan'] = async (f) => { const b = $('button', f); busy(b, true); try { await api('pengaturan.simpan', { nilai: ambilForm(f) }); toast('Pengaturan disimpan.', 'ok'); const me = (await api('me', {}, { fresh: true })).me; Sesi.set(null, me); App.me = me; } catch (e) { toast(e.message, 'err'); } busy(b, false); };
