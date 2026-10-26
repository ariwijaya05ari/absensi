/* Halaman jamaah (mobile-first): login, beranda, jadwal, kegiatan, profil, absen, hasil, riwayat */
const Pages = {};
const Hasil = { v: null };
const Kegi = { list: [], kat: '', q: '' };
const KUTIPAN = ['“Menuntut ilmu adalah jalan lapang menuju surga.”', 'HR. Muslim'];

// ------------------------------------------------------------------ LOGIN
Pages.login = (root) => {
  root.innerHTML = `<div class="login"><div class="card">
    <div class="center"><div class="logo" style="width:68px;height:68px;border-radius:50%;margin:0 auto 14px;background:var(--cream);color:var(--navy)">${ic('mosque', 'fill')}</div>
    <p style="font-style:italic;font-family:var(--serif);color:var(--ink-2)">Assalamu'alaikum Warahmatullahi Wabarakatuh</p>
    <h1 class="h-xl" style="margin:6px 0">Absensi Pengajian</h1><p class="muted">Sistem presensi kehadiran jamaah pengajian kelompok</p></div>
    <div id="lg-err" class="alert err mt hide" role="alert">${ic('error')}<div><b>Autentikasi gagal</b><br><span id="lg-msg"></span></div></div>
    <form data-form="login" class="mt stack" autocomplete="off" novalidate>
      <label class="field"><span>ID Jamaah <em>FORMAT: JMH-XXX</em></span><div class="input-icon">${ic('badge')}<input class="input mono" name="id" data-in="id-up" placeholder="JMH-042" autocapitalize="characters" autocomplete="username" maxlength="12" required></div><small>Huruf besar diikuti nomor anggota</small></label>
      <label class="field"><span>PIN masuk</span><div class="input-icon">${ic('lock')}<input class="input mono" id="lg-pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="••••••" autocomplete="current-password" required><button type="button" class="icon-btn" data-act="pin-lihat" style="position:absolute;right:4px;top:3px;border:0;background:none" aria-label="Tampilkan PIN">${ic('visibility')}</button></div><small>Gunakan 6 digit PIN terdaftar</small></label>
      <button class="btn btn-primary btn-block" style="height:52px">Masuk ke aplikasi ${ic('arrow_forward')}</button>
    </form>
    <p class="center small muted mt">Lupa PIN atau kendala akses? <b>Hubungi pengurus majelis</b> untuk mengatur ulang PIN Anda.</p>
  </div>
  <div class="card flat small row mt" style="width:min(100%,440px);margin-top:14px">${ic('verified_user')}<div><b>Akses khusus jamaah majelis</b> — pastikan perangkat terhubung internet stabil saat presensi.</div></div>
  <div class="badge mono mt" id="lg-srv"><span class="spin" style="width:10px;height:10px"></span> Memeriksa server…</div></div>`;
  pingServer().then((ok) => { const e = $('#lg-srv'); if (e) e.innerHTML = ok ? `<span class="dot ok"></span> Server terhubung • v1.0 GAS &amp; Sheets` : `<span class="dot err"></span> Server tidak terjangkau`; });
};
Ins['id-up'] = (el) => { el.value = el.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); };
Acts['pin-lihat'] = () => { const i = $('#lg-pin'); i.type = i.type === 'password' ? 'text' : 'password'; };
Forms.login = async (f) => {
  const d = ambilForm(f), btn = $('button.btn', f), err = $('#lg-err');
  err.classList.add('hide');
  if (!/^[A-Z]{2,4}-\d{2,6}$/.test(d.id || '') || !/^\d{6}$/.test(d.pin || '')) { $('#lg-msg').textContent = 'Periksa format ID (contoh JMH-042) dan PIN 6 digit angka.'; err.classList.remove('hide'); return; }
  busy(btn, true, 'Memeriksa…');
  try { const r = await api('auth.login', { id: d.id, pin: d.pin }, { tanpaLogout: true }); Sesi.set(r.token, r.me); location.hash = '#/beranda'; App.mulai(); }
  catch (e) { busy(btn, false); $('#lg-msg').textContent = e.message; err.classList.remove('hide'); $('#lg-pin').value = ''; }
};

// ------------------------------------------------------------------ BERANDA
function kegHero(k) {
  return `<div class="hero-img">${k.foto ? `<img src="${esc(k.foto)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ic('mosque', 'big fill')}
    <span class="badge" style="position:absolute;top:14px;left:14px;background:rgba(255,255,255,.92)">${ic('calendar_month')} ${esc(tglPendek(k.tanggal))}</span>
    ${k.kuota ? `<span class="badge navy" style="position:absolute;top:14px;right:14px">${k.kuota} Kuota</span>` : k.kategori ? `<span class="badge peach" style="position:absolute;top:14px;right:14px">${esc(k.kategori)}</span>` : ''}
    <h3 class="h-md" style="color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.4)">${esc(k.judul)}</h3></div>`;
}
function kegCard(k) {
  return `<article class="card" style="padding:0">${kegHero(k)}<div style="padding:16px 18px 18px"><p class="muted" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(k.deskripsi || '')}</p>
    <div class="row between mt">${k.tempat ? `<span class="small row gap-s">${ic('location_on')}${esc(k.tempat)}</span>` : k.jam ? `<span class="small row gap-s">${ic('schedule')}${esc(k.jam)} WIB</span>` : '<span></span>'}<button class="btn btn-ghost btn-sm" data-act="keg-detail" data-id="${esc(k.id)}">Detail</button></div></div></article>`;
}
Acts['keg-detail'] = (el) => {
  const k = Kegi.list.find((x) => x.id === el.dataset.id); if (!k) return;
  modal({ judul: k.judul, sub: [relTgl(k.tanggal), k.jam && k.jam + ' WIB'].filter(Boolean).join(' • '), isi: `${k.foto ? `<img src="${esc(k.foto)}" alt="" style="width:100%;border-radius:18px;margin-bottom:12px" referrerpolicy="no-referrer">` : ''}<p style="white-space:pre-line">${esc(k.deskripsi || 'Tanpa deskripsi.')}</p><div class="mt stack">${k.tempat ? `<div class="item-line">${ic('location_on')}<span>${esc(k.tempat)}</span></div>` : ''}${k.kuota ? `<div class="item-line">${ic('groups')}<span>Kuota ${k.kuota} orang</span></div>` : ''}${k.kategori ? `<div class="item-line">${ic('sell')}<span>${esc(k.kategori)}</span></div>` : ''}</div>` });
};
Acts['muat-ulang'] = () => Router.render();

Pages.beranda = async (v) => {
  v.innerHTML = skeleton(3);
  let d; try { d = await api('dashboard'); } catch (e) { v.innerHTML = galat(e, 'muat-ulang'); return; }
  const me = App.me, s = d.sesiUtama, st = d.statistik; Kegi.list = d.kegiatan;
  const tgl = dt(st.hariIni), pekanKe = Math.ceil(tgl.getUTCDate() / 7);
  let aksi = '';
  if (s) {
    if (s.sudahAbsen) aksi = `<div class="alert ok">${ic('check_circle', 'fill')}<div><b>Anda sudah tercatat ${esc(s.sudahAbsen.toLowerCase())}</b> pada sesi ini.</div></div>`;
    else if (s.absenBuka) aksi = `<a class="btn btn-primary btn-block" style="height:52px" href="#/absen/${esc(s.id)}">Absen Sekarang ${ic('arrow_forward')}</a>`;
    else aksi = `<button class="btn btn-ghost btn-block" disabled>${ic('lock_clock')} Absen dibuka sebelum jam ${esc(s.mulai)}</button>`;
  }
  v.innerHTML = `<div class="eyebrow">${ic('wb_twilight')} ${salam()}</div>
    <h1 class="h-xl" style="margin-top:4px">Halo, ${esc(me.nama)}</h1><p class="small muted">${esc(me.jenis.length ? 'Jamaah Pengajian ' + me.jenis.join(', ') : 'Jamaah')}${me.wilayah ? ` <span class="dot"></span> ${esc(me.wilayah)}` : ''}</p>
    <div class="stack mt">
    ${s ? `<section class="card"><div class="row between"><span class="badge">${esc(s.jenis)}</span>${statusBadge(s.status)}</div>
      <h2 class="h-lg mt-s">${esc(s.judul)}</h2>
      <div class="mt-s"><div class="item-line">${ic('schedule')}<span>${esc(relTgl(s.tanggal))}, ${esc(s.mulai)} – ${esc(s.selesai)} WIB</span></div>
      ${s.tempat ? `<div class="item-line">${ic('location_on')}<span>${esc(s.tempat)}</span></div>` : ''}${s.pemateri ? `<div class="item-line">${ic('record_voice_over')}<span>${esc(s.pemateri)}</span></div>` : ''}</div>
      <div class="mt">${aksi}</div></section>` : kosong('event_busy', 'Belum ada jadwal terdekat', 'Jadwal pengajian berikutnya akan tampil di sini.', '<a class="btn btn-ghost btn-sm mt" href="#/jadwal">Lihat jadwal</a>')}
    <section class="card"><div class="row between"><h2 class="h-md">Kehadiran Anda</h2><span class="badge mono">Target ${st.target}%</span></div>
      <p class="small muted">Pekan ke-${pekanKe} ${BLN[tgl.getUTCMonth()]} ${tgl.getUTCFullYear()}</p>
      <div class="rings mt">
        <div>${ringSvg(st.bulan.persen / 100, st.bulan.persen + '%')}<p>Bulan ini<br><small>${st.bulan.hadir}/${st.bulan.total} sesi</small></p></div>
        <div>${ringSvg(st.pekan.total ? st.pekan.hadir / st.pekan.total : 0, st.pekan.hadir + '/' + st.pekan.total)}<p>Minggu ini<br><small>Pekan ini</small></p></div>
        <div>${ringSvg(Math.min(1, st.tahun.hadir / 50), String(st.tahun.hadir))}<p>Total hadir<br><small>Tahun ${tgl.getUTCFullYear()}</small></p></div></div></section>
    <div class="row between" style="margin-top:24px"><div><h2 class="h-md">Kegiatan Terbaru</h2><p class="small muted">Agenda pengajian mendatang</p></div><a class="small" href="#/kegiatan"><b>Lihat semua</b> ›</a></div>
    ${d.kegiatan.length ? d.kegiatan.slice(0, 2).map(kegCard).join('') : kosong('celebration', 'Belum ada kegiatan', 'Kegiatan majelis akan diumumkan di sini.')}
    </div>`;
};

// ------------------------------------------------------------------ JADWAL
const J = { mulai: '', hari: '', jenis: '', bulan: false, data: null, jenisList: [] };
Pages.jadwal = async (v) => {
  if (!J.mulai) { J.mulai = senin(todayWIB()); J.hari = todayWIB(); }
  J.bulan = false; await jadwalMuat(v);
};
async function jadwalMuat(v) {
  v = v || $('#view'); v.innerHTML = skeleton(3);
  const dari = J.bulan ? J.mulai.slice(0, 8) + '01' : J.mulai, sampai = J.bulan ? tambahHari(dari, 31).slice(0, 8) + '01' : tambahHari(J.mulai, 6);
  try { const d = await api('jadwal.list', { dari, sampai: J.bulan ? tambahHari(sampai, -1) : sampai }); J.data = d.jadwal; J.jenisList = d.jenis; } catch (e) { v.innerHTML = galat(e, 'jadwal-ulang'); return; }
  jadwalGambar(v);
}
Acts['jadwal-ulang'] = () => jadwalMuat();
function jadwalGambar(v) {
  const d = dt(J.mulai), hariIni = todayWIB(), dot = {}; (J.data || []).forEach((s) => { dot[s.tanggal] = 1; });
  const tampil = (J.data || []).filter((s) => (J.bulan || !J.hari || s.tanggal === J.hari) && (!J.jenis || s.idJenis === J.jenis));
  const pil = J.jenisList.filter((j) => !J.jenisList.length || true);
  v.innerHTML = `<div class="row between"><div><div class="eyebrow">Majelis ta'lim &amp; dakwah</div><h1 class="h-lg">Jadwal Pengajian</h1></div></div>
  <section class="card mt"><div class="row between"><div class="row"><b>${BLN[d.getUTCMonth()]} ${d.getUTCFullYear()}</b><span class="badge peach">${J.bulan ? 'Seluruh bulan' : 'Pekan ke-' + Math.ceil(dt(J.hari || J.mulai).getUTCDate() / 7)}</span></div>
    <div class="row"><button class="icon-btn" data-act="j-geser" data-n="-1" aria-label="Sebelumnya">${ic('chevron_left')}</button><button class="icon-btn" data-act="j-geser" data-n="1" aria-label="Berikutnya">${ic('chevron_right')}</button></div></div>
    ${J.bulan ? '' : `<div class="week">${Array.from({ length: 7 }, (_, i) => { const t = tambahHari(J.mulai, i); return `<button class="${t === J.hari ? 'on' : ''}" data-act="j-hari" data-t="${t}" aria-label="${esc(tglPanjang(t))}">${esc(hariDari(t).slice(0, 3))}<b>${dt(t).getUTCDate()}</b>${dot[t] ? '<i class="pt"></i>' : '<i style="height:5px"></i>'}</button>`; }).join('')}</div>`}</section>
  <div class="chips mt"><button class="chip ${J.jenis ? '' : 'active'}" data-act="j-jenis" data-id="">Semua</button>${pil.map((j) => `<button class="chip ${J.jenis === j.id ? 'active' : ''}" data-act="j-jenis" data-id="${esc(j.id)}">${esc(j.nama)}</button>`).join('')}</div>
  <div class="stack mt">${tampil.length ? tampil.map(jadwalKartu).join('') : kosong('event_available', 'Tidak ada jadwal lagi', 'Pilih tanggal lain pada kalender untuk melihat agenda majelis ta\'lim dan pengajian mendatang.')}
  <div class="center"><button class="btn btn-ghost btn-sm" data-act="j-bulan">${ic('calendar_month')} ${J.bulan ? 'Kembali ke pekan' : 'Lihat seluruh bulan'}</button></div></div>`;
}
function jadwalKartu(s) {
  let kaki = '';
  if (s.sudahAbsen) kaki = `<div class="row between mt"><span class="row small" style="color:var(--copper-dk);font-weight:700">${ic('check_circle', 'fill')} Anda telah ${esc(s.sudahAbsen.toLowerCase())}</span></div>`;
  else if (s.absenBuka) kaki = `<div class="row between mt"><span class="small muted">${s.hadir} jamaah hadir</span><a class="btn btn-primary btn-sm" href="#/absen/${esc(s.id)}">Absen Sekarang ${ic('arrow_forward')}</a></div>`;
  else if (s.status === 'Selesai') kaki = `<p class="small muted mt">Sesi selesai • tidak tercatat hadir</p>`;
  return `<article class="card"><div class="row between"><span class="badge peach">${esc(s.jenis)}</span>${statusBadge(s.status)}</div><h3 class="h-md mt-s">${esc(s.judul)}</h3>
    <div class="mt-s"><div class="item-line">${ic('schedule')}<span>${esc(relTgl(s.tanggal))} • ${esc(s.mulai)} – ${esc(s.selesai)} WIB</span></div>${s.tempat ? `<div class="item-line">${ic('location_on')}<span>${esc(s.tempat)}</span></div>` : ''}${s.pemateri ? `<div class="item-line">${ic('person')}<span>${esc(s.pemateri)}</span></div>` : ''}${s.materi ? `<div class="item-line">${ic('menu_book')}<span>${esc(s.materi)}</span></div>` : ''}</div>${kaki}</article>`;
}
Acts['j-geser'] = (el) => { J.mulai = tambahHari(J.mulai, 7 * Number(el.dataset.n) * (J.bulan ? 4 : 1)); J.hari = J.bulan ? '' : J.mulai; jadwalMuat(); };
Acts['j-hari'] = (el) => { J.hari = J.hari === el.dataset.t ? '' : el.dataset.t; jadwalGambar($('#view')); };
Acts['j-jenis'] = (el) => { J.jenis = el.dataset.id; jadwalGambar($('#view')); };
Acts['j-bulan'] = () => { J.bulan = !J.bulan; if (!J.bulan) { J.mulai = senin(todayWIB()); J.hari = todayWIB(); } jadwalMuat(); };

// ------------------------------------------------------------------ KEGIATAN
Pages.kegiatan = async (v) => {
  v.innerHTML = skeleton(3);
  try { Kegi.list = (await api('kegiatan.list')).kegiatan; } catch (e) { v.innerHTML = galat(e, 'muat-ulang'); return; }
  Kegi.kat = ''; Kegi.q = '';
  const kats = Array.from(new Set(Kegi.list.map((k) => k.kategori).filter(Boolean)));
  v.innerHTML = `<div class="eyebrow">Majelis</div><h1 class="h-lg">Kegiatan</h1>
  <div class="row mt"><div class="input-icon grow">${ic('search')}<input class="input" placeholder="Cari kegiatan pengajian…" data-in="k-cari" aria-label="Cari kegiatan"></div></div>
  <div class="chips mt" id="k-chips"><button class="chip active" data-act="k-kat" data-k="">Semua</button>${kats.map((k) => `<button class="chip" data-act="k-kat" data-k="${esc(k)}">${esc(k)}</button>`).join('')}</div>
  <div id="k-list" class="stack mt"></div>
  <div class="card flat row mt-l">${ic('spa')}<p class="small muted" style="font-style:italic">“Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain.” Mari rekatkan ukhuwah dalam setiap majelis ilmu.</p></div>`;
  kegiatanDaftar();
};
function kegiatanDaftar() {
  const q = Kegi.q.toLowerCase(), l = Kegi.list.filter((k) => (!Kegi.kat || k.kategori === Kegi.kat) && (!q || (k.judul + ' ' + k.deskripsi + ' ' + k.tempat).toLowerCase().includes(q)));
  const utama = l.find((k) => k.akan), sisa = l.filter((k) => k !== utama), e = $('#k-list'); if (!e) return;
  e.innerHTML = !l.length ? kosong('search_off', 'Kegiatan tidak ditemukan', 'Coba kata kunci atau kategori lain.') :
    (utama ? `<article class="card" style="padding:0">${kegHero(utama)}<div style="padding:16px 18px"><span class="eyebrow">Kegiatan utama</span><p class="muted mt-s" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${esc(utama.deskripsi)}</p><div class="row between mt"><span class="small row gap-s">${ic('location_on')}${esc(utama.tempat || '-')}</span><button class="btn btn-primary btn-sm" data-act="keg-detail" data-id="${esc(utama.id)}">Baca selengkapnya</button></div></div></article>` : '') +
    (sisa.length ? `<div class="row between mt"><div><h2 class="h-md">Agenda Kegiatan Lainnya</h2><p class="small muted">Rangkaian amaliyah &amp; silaturahim jamaah</p></div><span class="badge peach mono">${sisa.length} agenda</span></div>` + sisa.map((k) => `<article class="card row" style="align-items:center;gap:14px;padding:14px"><div class="thumb">${k.foto ? `<img src="${esc(k.foto)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ic('mosque', 'fill')}</div><div class="grow"><div class="small" style="color:var(--copper-dk);font-weight:700">${ic('calendar_month')} ${esc(tglPanjang(k.tanggal))}</div><h3 class="h-sm">${esc(k.judul)}</h3><p class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(k.deskripsi)}</p><button class="small" style="color:var(--navy);font-weight:700;padding:4px 0" data-act="keg-detail" data-id="${esc(k.id)}">Detail ›</button></div></article>`).join('') : '');
}
Ins['k-cari'] = (el) => { Kegi.q = el.value; kegiatanDaftar(); };
Acts['k-kat'] = (el) => { Kegi.kat = el.dataset.k; $$('#k-chips .chip').forEach((c) => c.classList.toggle('active', c === el)); kegiatanDaftar(); };

// ------------------------------------------------------------------ PROFIL
Pages.profil = async (v) => {
  v.innerHTML = skeleton(2);
  let me; try { me = (await api('me', {}, { fresh: true })).me; Sesi.set(null, me); App.me = me; } catch (e) { v.innerHTML = galat(e, 'muat-ulang'); return; }
  const svg = await qrSvg(me.kode, 200).catch(() => '');
  App.qrSvg = svg;
  v.innerHTML = `<div class="eyebrow">Data identitas &amp; presensi mandiri</div><h1 class="h-lg">Profil Jamaah</h1>
  <div class="stack mt"><section class="card"><div class="row" style="align-items:flex-start;gap:14px"><div class="avatar lg">${esc(inisial(me.nama))}</div><div class="grow"><div class="row between" style="align-items:flex-start"><h2 class="h-md">${esc(me.nama)}</h2><span class="badge ok">Aktif</span></div>
    <div class="row wrap mt-s"><span class="badge navy mono">${esc(me.id)}</span><span class="small muted">${esc(me.wilayah)}</span></div>${me.jabatan ? `<p class="small muted">${esc(me.jabatan)}</p>` : ''}</div></div>
    <div class="grid-2 mt" style="grid-template-columns:1fr 1fr;gap:10px"><div class="card flat" style="padding:12px"><div class="small muted">${ic('chat')} WhatsApp</div><b class="mono small">${esc(me.hp || '-')}</b></div><div class="card flat" style="padding:12px"><div class="small muted">${ic('event')} Bergabung</div><b class="mono small">${me.bergabung ? esc(tglPendek(me.bergabung)) : '-'}</b></div></div>
    <p class="small muted mt">Kategori pengajian terdaftar</p><div class="row wrap mt-s">${(me.jenis.length ? me.jenis : ['Semua']).map((j, i) => `<span class="badge ${i ? 'peach' : 'navy'}" style="height:30px;padding:0 14px">${esc(j)}</span>`).join('')}</div></section>
  <section class="card"><div class="row between"><b class="row">${ic('qr_code_2')} QR Kehadiran</b><span class="badge peach">Verifikasi cadangan</span></div>
    <div class="center mt"><div class="qr-box">${svg || '<p class="small">QR gagal dimuat</p>'}</div><div class="row mt" style="justify-content:center"><span class="badge mono">${ic('tag')} ${esc(me.kode)}</span><button class="btn btn-ghost btn-sm" data-act="salin-kode">${ic('content_copy')} Salin</button></div></div>
    <div class="alert info mt small">${ic('info')}<div>Tunjukkan QR ini kepada pengurus majelis apabila kamera ponsel mengalami kendala saat pemindaian wajah.</div></div>
    <button class="btn btn-ghost btn-block mt" data-act="qr-penuh">${ic('fullscreen')} Tampilkan layar penuh</button></section>
  <section class="card" style="padding:8px 18px"><h2 class="h-sm" style="padding:10px 0 4px">Pengaturan &amp; Layanan</h2>
    ${[['pin', 'dialpad', 'Ubah PIN masuk', 'Perbarui kode akses 6 digit kehadiran'], ['riwayat', 'history', 'Riwayat lengkap kehadiran saya', 'Rekap presensi bulanan & statistik'], ['izin', 'photo_camera', 'Panduan izin kamera & GPS', 'Solusi kendala browser & geofencing'], ['bantuan', 'support_agent', 'Hubungi pengurus majelis', 'Pusat bantuan jamaah & WhatsApp piket']].map((x) => `<button class="row" style="width:100%;text-align:left;padding:14px 0;border-top:1px solid var(--line);gap:12px" data-act="menu-${x[0]}"><span class="item-line" style="padding:0">${ic(x[1])}</span><span class="grow"><b>${x[2]}</b><br><span class="small muted">${x[3]}</span></span>${ic('chevron_right')}</button>`).join('')}</section>
  <button class="btn btn-ghost btn-block" style="color:var(--err)" data-act="keluar">${ic('logout')} Keluar dari akun</button>
  <p class="center small muted mono">● Terhubung ke Google Sheets • Versi 1.0.0</p></div>`;
};
Acts['salin-kode'] = async () => { try { await navigator.clipboard.writeText(App.me.kode); toast('Kode disalin', 'ok'); } catch (e) { toast(App.me.kode); } };
Acts['qr-penuh'] = async () => { modal({ judul: App.me.nama, sub: App.me.id, isi: `<div class="center"><div class="qr-box">${(await qrSvg(App.me.kode, 280)) || ''}</div><p class="mono mt">${esc(App.me.kode)}</p></div>` }); };
Acts['menu-riwayat'] = () => { location.hash = '#/riwayat'; };
Acts['menu-bantuan'] = () => { const wa = (App.me.app || {}).wa; if (wa) window.open('https://wa.me/' + wa, '_blank', 'noopener'); else toast('Nomor WhatsApp pengurus belum diatur. Hubungi pengurus secara langsung.'); };
Acts['menu-izin'] = () => modal({ judul: 'Panduan izin kamera & GPS', isi: `<div class="stack"><p>Presensi memerlukan <b>kamera</b> dan <b>lokasi (GPS)</b>. Jika muncul pesan ditolak:</p>
  <div class="card flat"><b>Android (Chrome)</b><p class="small muted">Ketuk ikon gembok di address bar → Izin → izinkan Kamera dan Lokasi → muat ulang halaman. Pastikan GPS/Lokasi perangkat menyala.</p></div>
  <div class="card flat"><b>iPhone (Safari)</b><p class="small muted">Pengaturan → Privasi &amp; Keamanan → Layanan Lokasi → Safari: “Saat Menggunakan”. Lalu di Safari ketuk “aA” → Pengaturan Situs Web → izinkan Kamera dan Lokasi.</p></div>
  <div class="card flat"><b>GPS tidak akurat?</b><p class="small muted">Keluar ke area terbuka beberapa saat, matikan mode hemat daya, dan tunggu hingga akurasi ±50 m atau lebih baik.</p></div>
  <div class="card flat"><b>Wajah tidak dikenali?</b><p class="small muted">Hadap kamera, cahaya cukup dari depan, lepas masker/kacamata gelap. Atau gunakan scan QR dari pengurus.</p></div></div>` });
Acts['menu-pin'] = () => modal({ judul: 'Ubah PIN masuk', sub: 'Gunakan 6 digit angka yang mudah Anda ingat tetapi sulit ditebak.', isi: `<form data-form="ubah-pin" class="stack" autocomplete="off">
  <label class="field"><span>PIN lama</span><input class="input mono" name="pinLama" type="password" inputmode="numeric" maxlength="6" required></label>
  <label class="field"><span>PIN baru</span><input class="input mono" name="pinBaru" type="password" inputmode="numeric" maxlength="6" required></label>
  <label class="field"><span>Ulangi PIN baru</span><input class="input mono" name="ulang" type="password" inputmode="numeric" maxlength="6" required></label>
  <button class="btn btn-primary btn-block">Simpan PIN baru</button></form>` });
Forms['ubah-pin'] = async (f) => {
  const d = ambilForm(f); if (d.pinBaru !== d.ulang) return toast('Ulangi PIN baru tidak sama.', 'err');
  const b = $('button', f); busy(b, true);
  try { const r = await api('profil.ubahPin', { pinLama: d.pinLama, pinBaru: d.pinBaru }); Sesi.set(r.token); $('.modal-back')._m.tutup(); toast('PIN berhasil diubah.', 'ok'); } catch (e) { busy(b, false); toast(e.message, 'err'); }
};

// ------------------------------------------------------------------ ABSEN
const Ab = { cur: null, d: null, tab: 'wajah', gps: null, gpsErr: null, sibuk: false, qrKunci: false, qrToast: 0 };
Pages.absen = async (v, arg) => {
  v.innerHTML = skeleton(2);
  try { Ab.d = await api('absen.sesiAktif', {}, { fresh: true }); } catch (e) { v.innerHTML = galat(e, 'muat-ulang'); return; }
  const aktif = Ab.d.sesi.filter((s) => !s.sudahAbsen);
  if (!Ab.d.sesi.length) { v.innerHTML = `<h1 class="h-lg">Absen</h1><div class="mt">${kosong('event_busy', 'Belum ada sesi yang dibuka', 'Absen dibuka sebelum sesi pengajian dimulai. Lihat jadwal untuk sesi berikutnya.', '<a class="btn btn-primary btn-sm mt" href="#/jadwal">Lihat jadwal</a>')}</div>`; return; }
  if (!aktif.length) { v.innerHTML = `<h1 class="h-lg">Absen</h1><div class="mt">${kosong('task_alt', 'Anda sudah absen', 'Kehadiran Anda pada sesi yang sedang dibuka sudah tercatat. Terima kasih.', '<a class="btn btn-primary btn-sm mt" href="#/beranda">Kembali ke beranda</a>')}</div>`; return; }
  Ab.cur = aktif.find((s) => s.id === arg) || aktif[0]; Ab.gps = null; Ab.gpsErr = null; Ab.sibuk = false; Ab.qrKunci = false;
  Ab.tab = Ab.d.wajah ? 'wajah' : 'qr';
  v.innerHTML = `<div id="ab-head"></div><div id="ab-gps" class="mt"></div><div id="ab-tabs" class="mt"></div><div id="ab-cam" class="mt"></div><div id="ab-act" class="mt"></div>`;
  abHead(); abGps(); abTabs(); abKamera();
  Gps.mulai((p, err) => { Ab.gps = p || Ab.gps; Ab.gpsErr = p ? null : err; abGps(); });
  return () => { Gps.henti(); Cam.henti(); Pemindai.henti(); };
};
function abHead() {
  const s = Ab.cur, lain = Ab.d.sesi.filter((x) => !x.sudahAbsen);
  $('#ab-head').innerHTML = `<section class="card flat"><div class="row"><span class="badge navy"><span class="dot"></span>Sesi berlangsung</span><span class="badge mono" style="margin-left:auto">${esc(s.id)}</span></div><h1 class="h-md mt-s">${esc(s.judul)}</h1><p class="small muted">${ic('schedule')} ${esc(s.mulai)} – ${esc(s.selesai)} WIB • ${ic('mosque')} ${esc(s.tempat || (s.lokasi && s.lokasi.nama) || '')}</p>
  ${lain.length > 1 ? `<div class="chips mt-s">${lain.map((x) => `<button class="chip ${x.id === s.id ? 'active' : ''}" data-act="ab-pilih" data-id="${esc(x.id)}">${esc(x.judul)}</button>`).join('')}</div>` : ''}</section>`;
}
Acts['ab-pilih'] = (el) => { location.hash = '#/absen/' + el.dataset.id; };
function abGps() {
  const e = $('#ab-gps'); if (!e) return; const s = Ab.cur, l = s.lokasi, g = Ab.gps;
  let isi;
  if (!g && Ab.gpsErr) isi = `<div class="alert err">${ic('location_off')}<div>${esc(Ab.gpsErr.message)}</div></div>`;
  else if (!g) isi = `<div class="row"><span class="spin"></span><span class="muted">Mencari sinyal GPS…</span></div>`;
  else {
    const jarak = l ? Math.round(Gps.jarak(g.lat, g.lng, l.lat, l.lng)) : null, dalam = l && jarak <= l.radius, buruk = g.akurasi > Ab.d.ambangGpsAkurasi;
    isi = `<div class="row between"><span class="mono small muted">${g.lat.toFixed(4)}, ${g.lng.toFixed(4)}</span><span class="small muted">Akurasi ±${Math.round(g.akurasi)} m</span></div>
      <div class="row mt-s wrap">${l ? (dalam ? `<span class="badge ok">${ic('check_circle', 'fill')} Dalam jangkauan radius (maks. ${l.radius} m)</span><span class="small muted">${jarak} m dari titik</span>` : `<span class="badge err">${ic('wrong_location')} Di luar radius — ${jarak} m (maks. ${l.radius} m)</span>`) : '<span class="badge warn">Titik lokasi belum diatur pengurus</span>'}</div>
      ${buruk ? `<p class="small mt-s" style="color:var(--warn)">${ic('warning')} Akurasi GPS rendah. Pindah ke area terbuka agar presensi diterima.</p>` : ''}`;
  }
  e.innerHTML = `<section class="card" style="padding:16px"><div class="row" style="align-items:flex-start;gap:12px"><span class="item-line" style="padding:0">${ic('my_location')}</span><div class="grow"><b>Status validasi GPS</b>${isi}</div></div></section>`;
}
function abTabs() {
  $('#ab-tabs').innerHTML = `<div class="card" style="padding:6px;border-radius:999px;display:grid;grid-template-columns:1fr 1fr;gap:4px"><button class="btn ${Ab.tab === 'wajah' ? 'btn-ghost' : ''}" style="${Ab.tab === 'wajah' ? 'background:#fff;box-shadow:var(--sh-1)' : ''}" data-act="ab-tab" data-t="wajah">${ic('face')} Verifikasi wajah</button><button class="btn ${Ab.tab === 'qr' ? 'btn-ghost' : ''}" style="${Ab.tab === 'qr' ? 'background:#fff;box-shadow:var(--sh-1)' : ''}" data-act="ab-tab" data-t="qr">${ic('qr_code_scanner')} Scan QR</button></div>`;
}
Acts['ab-tab'] = (el) => { if (Ab.tab === el.dataset.t) return; Ab.tab = el.dataset.t; Ab.qrKunci = false; abTabs(); abKamera(); };
async function abKamera() {
  const w = $('#ab-cam'), act = $('#ab-act'); if (!w) return; Cam.henti(); Pemindai.henti();
  const wajah = Ab.tab === 'wajah';
  w.innerHTML = `<div class="cam ${wajah ? '' : 'qr'}"><video id="ab-video" playsinline muted></video><div class="guide"></div><div class="msg" id="ab-msg"><span class="spin"></span><p class="mt-s">Menyalakan kamera…</p></div><div class="hint hide" id="ab-hint"></div></div>`;
  act.innerHTML = wajah ? `<button class="btn btn-primary btn-block" style="height:54px" id="ab-btn" data-act="ab-wajah" disabled>${ic('face')} Verifikasi wajah &amp; catat kehadiran</button>` : `<div class="alert info small">${ic('info')}<div>Arahkan kamera ke <b>QR sesi</b> yang ditampilkan pengurus. Kehadiran dicatat otomatis saat QR terbaca.</div></div>`;
  act.innerHTML += `<p class="small muted center mt-s">Kamera bermasalah atau gagal verifikasi? Hubungi pengurus untuk absen manual.</p>`;
  const msg = $('#ab-msg'), hint = $('#ab-hint'), jaga = Ab.tab;
  try {
    if (wajah && !Ab.d.wajah) throw new Error('Wajah Anda belum didaftarkan oleh pengurus. Gunakan Scan QR atau minta pengurus mendaftarkan wajah.');
    await Cam.mulai($('#ab-video'), wajah);
    if (jaga !== Ab.tab) return;
    if (wajah) { await Face.muat((t) => { msg.innerHTML = `<span class="spin"></span><p class="mt-s">${esc(t)}</p>`; }); if (jaga !== Ab.tab) return; $('#ab-btn').disabled = false; hint.textContent = 'Posisikan wajah Anda tepat di dalam bingkai'; }
    else { hint.textContent = 'Arahkan ke QR sesi pengurus'; await Pemindai.mulai($('#ab-video'), abKode); }
    msg.classList.add('hide'); hint.classList.remove('hide');
  } catch (e) { msg.innerHTML = `${ic('videocam_off')}<p class="mt-s">${esc(e.message)}</p>`; }
}
async function abKirim(extra) {
  if (!Ab.gps) { toast(Ab.gpsErr ? Ab.gpsErr.message : 'Menunggu sinyal GPS…', 'err'); throw new Error('gps'); }
  const g = Ab.gps;
  try { const r = await api('absen.kirim', Object.assign({ idJadwal: Ab.cur.id, lat: g.lat, lng: g.lng, akurasi: g.akurasi }, extra)); Hasil.v = { ok: true, r, sesi: Ab.cur, jarakLokasi: r.jarak }; }
  catch (e) { if (!(e instanceof ApiError) || e.code === 'NET' || e.code === 'CONFIG') throw e; Hasil.v = { ok: false, msg: e.message, code: e.code, sesi: Ab.cur }; }
  location.hash = '#/hasil';
}
Acts['ab-wajah'] = async (el) => {
  if (Ab.sibuk) return; Ab.sibuk = true; busy(el, true, 'Memindai wajah…');
  try { const desc = await Face.ambil($('#ab-video')); busy(el, true, 'Mengirim ke server…'); await abKirim({ metode: 'Wajah', descriptor: desc }); }
  catch (e) { if (e.message !== 'gps') toast(e.message, 'err'); busy(el, false); Ab.sibuk = false; }
};
function abKode(teks) {
  if (Ab.qrKunci) return;
  if (!/^ABSEN\|/.test(teks)) { if (Date.now() - Ab.qrToast > 2500) { Ab.qrToast = Date.now(); toast('QR ini bukan kode presensi sesi.', 'err'); } return; }
  Ab.qrKunci = true; const h = $('#ab-hint'); if (h) h.textContent = 'QR terbaca — mengirim…';
  abKirim({ metode: 'Barcode', kodeSesi: teks }).catch((e) => { if (e.message !== 'gps') toast(e.message, 'err'); Ab.qrKunci = false; });
}

// ------------------------------------------------------------------ HASIL ABSEN
Pages.hasil = async (v) => {
  const H = Hasil.v; if (!H) { location.hash = '#/beranda'; return; }
  if (!H.ok) {
    const tip = { RADIUS: 'Dekatkan diri ke lokasi pengajian lalu coba lagi.', GPS: 'Aktifkan GPS dan tunggu akurasi membaik.', VERIFIKASI: 'Perbaiki pencahayaan, atau gunakan metode scan QR.', DUPLIKAT: 'Kehadiran Anda sudah tercatat — tidak perlu absen lagi.', WAKTU: 'Absen hanya dibuka di sekitar jam sesi.' }[H.code] || 'Coba lagi, atau hubungi pengurus untuk absen manual.';
    v.innerHTML = `<h1 class="h-lg">Absen</h1><section class="card center mt" style="padding:32px 20px"><div style="width:96px;height:96px;border-radius:50%;background:var(--err-bg);color:var(--err);display:grid;place-items:center;margin:0 auto">${ic('close', 'fill').replace('class="ms', 'style="font-size:52px" class="ms')}</div>
    <h2 class="h-lg mt">Absen Belum Berhasil</h2><p class="muted mt-s">${esc(H.msg)}</p><div class="alert info mt" style="text-align:left">${ic('lightbulb')}<div>${esc(tip)}</div></div></section>
    <div class="stack mt"><a class="btn btn-primary btn-block" style="height:52px" href="#/absen/${esc(H.sesi.id)}">${ic('refresh')} Coba lagi</a><a class="btn btn-ghost btn-block" href="#/beranda">${ic('home')} Kembali ke beranda</a></div>`; return;
  }
  const r = H.r, wkt = r.waktu.replace(' ', 'T'), tgl = r.waktu.slice(0, 10), terlambat = r.status === 'Terlambat';
  v.innerHTML = `<h1 class="h-lg">Absen</h1><section class="card center mt" style="padding:28px 20px"><div style="width:100px;height:100px;border-radius:50%;background:${terlambat ? 'var(--warn-bg)' : 'var(--ok-bg)'};color:${terlambat ? 'var(--warn)' : 'var(--ok)'};display:grid;place-items:center;margin:0 auto"><span class="ms fill" style="font-size:56px">${terlambat ? 'schedule' : 'check_circle'}</span></div>
    <h2 class="h-lg mt">Absen Berhasil Dicatat!</h2><p class="muted mt-s">Alhamdulillah, kehadiran Anda telah terverifikasi secara sah dalam sistem majelis.</p><span class="badge ${terlambat ? 'warn' : 'ok'} mt" style="height:32px;padding:0 16px"><span class="dot ${terlambat ? '' : 'ok'}"></span> Status: ${terlambat ? 'Hadir terlambat' : 'Hadir tepat waktu'}</span></section>
  <section class="card mt"><div class="row between"><h2 class="h-md">Rincian Kehadiran</h2><span class="badge peach mono">TERVERIFIKASI</span></div><div class="stack mt">
    ${[['tag', 'ID verifikasi', `<span class="mono">${esc(r.idAbsen)}</span>`], ['person', 'Nama jamaah', `<b>${esc(r.nama)}</b><br><span class="small muted">${esc(r.idJamaah)}</span>`], ['menu_book', 'Sesi kegiatan', esc(r.sesi.judul)], ['schedule', 'Waktu server', `${esc(tglPanjang(tgl))} • <span class="mono">${esc(r.waktu.slice(11))} WIB</span>`], ['mail', 'Metode & GPS', `${r.metode === 'Wajah' ? 'Biometrik wajah' : 'Scan QR sesi'}<br><span class="small" style="color:var(--copper-dk)">Akurat (${r.jarak == null ? '-' : r.jarak + ' m dari titik pusat'})</span>`]].map((x) => `<div class="card flat row" style="padding:12px 14px;align-items:flex-start"><span class="small muted row" style="min-width:118px">${ic(x[0])} ${x[1]}</span><div class="grow" style="text-align:right">${x[2]}</div></div>`).join('')}</div></section>
  <section class="card row mt">${ic('spa')}<div><p style="font-family:var(--serif);font-style:italic;font-size:18px;line-height:24px;color:var(--navy)">${KUTIPAN[0]}</p><p class="small muted">${KUTIPAN[1]} • Semoga berkah dan bernilai ibadah.</p></div></section>
  <div class="stack mt"><a class="btn btn-primary btn-block" style="height:52px" href="#/beranda">${ic('home')} Kembali ke beranda</a><button class="btn btn-ghost btn-block" data-act="bagikan">${ic('share')} Bagikan bukti kehadiran</button></div>
  <section class="card mt" id="rekap-bln"><div class="skel" style="height:80px"></div></section>`;
  api('riwayat.saya', {}, { fresh: true }).then((d) => { const e = $('#rekap-bln'); if (e) e.innerHTML = `<div class="row between"><h2 class="h-sm">Rekap Kehadiran Bulan Ini</h2><span class="small" style="color:var(--copper-dk)">${BLN[dt(tgl).getUTCMonth()]}</span></div><div class="rings mt" style="gap:10px">${[[d.rekap.hadir, 'Hadir'], [d.rekap.terlambat, 'Terlambat'], [d.rekap.konsistensi + '%', 'Konsistensi']].map((x) => `<div class="card flat" style="padding:12px"><b class="h-md">${x[0]}</b><br><span class="small muted">${x[1]}</span></div>`).join('')}</div>`; }).catch(() => {});
};
Acts.bagikan = async () => {
  const H = Hasil.v; if (!H || !H.ok) return; const r = H.r;
  const t = `Bukti kehadiran ${r.nama} (${r.idJamaah})\nSesi: ${r.sesi.judul}\nWaktu: ${r.waktu} WIB\nStatus: ${r.status}\nID verifikasi: ${r.idAbsen}`;
  try { if (navigator.share) await navigator.share({ title: 'Bukti Kehadiran', text: t }); else { await navigator.clipboard.writeText(t); toast('Bukti kehadiran disalin ke clipboard.', 'ok'); } } catch (e) { /* dibatalkan */ }
};

// ------------------------------------------------------------------ RIWAYAT
const Rw = { bulan: '' };
Pages.riwayat = async (v) => {
  if (!Rw.bulan) Rw.bulan = todayWIB().slice(0, 7);
  v.innerHTML = skeleton(2);
  try {
    const d = await api('riwayat.saya', { bulan: Rw.bulan }), [y, m] = Rw.bulan.split('-').map(Number);
    v.innerHTML = `<a class="small" href="#/profil">‹ Profil</a><h1 class="h-lg">Riwayat Kehadiran</h1>
    <div class="row between mt"><button class="icon-btn" data-act="rw-geser" data-n="-1" aria-label="Bulan sebelumnya">${ic('chevron_left')}</button><b class="h-sm">${BLN[m - 1]} ${y}</b><button class="icon-btn" data-act="rw-geser" data-n="1" aria-label="Bulan berikutnya">${ic('chevron_right')}</button></div>
    <div class="rings mt" style="gap:10px">${[[d.rekap.hadir, 'Hadir'], [d.rekap.terlambat, 'Terlambat'], [d.rekap.konsistensi + '%', 'Konsistensi']].map((x) => `<div class="card" style="padding:14px"><b class="h-lg">${x[0]}</b><br><span class="small muted">${x[1]}</span></div>`).join('')}</div>
    <div class="stack mt">${d.riwayat.length ? d.riwayat.map((r) => `<div class="card row" style="padding:14px"><div class="grow"><b>${esc(r.judul)}</b><br><span class="small muted">${esc(tglPanjang(r.tanggal))} • ${esc(r.jam)} • ${esc(r.metode)}</span></div>${statusBadge(r.status)}</div>`).join('') : kosong('event_note', 'Belum ada catatan', 'Tidak ada kehadiran tercatat pada bulan ini.')}</div>`;
  } catch (e) { v.innerHTML = galat(e, 'muat-ulang'); }
};
Acts['rw-geser'] = (el) => { const [y, m] = Rw.bulan.split('-').map(Number), d = new Date(Date.UTC(y, m - 1 + Number(el.dataset.n), 1)); Rw.bulan = d.toISOString().slice(0, 7); Router.render(); };
