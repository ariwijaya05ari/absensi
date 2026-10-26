/* Router, kerangka (shell) dan siklus aplikasi */
const App = { me: null, mulaiLagi: 0 };
const NAV_USER = [['beranda', 'home', 'Beranda'], ['jadwal', 'calendar_month', 'Jadwal'], ['absen', 'qr_code_scanner', 'Absen', 1], ['kegiatan', 'celebration', 'Kegiatan'], ['profil', 'account_circle', 'Profil']];
const NAV_ADM = [['beranda', 'home', 'Beranda'], ['jadwal', 'calendar_month', 'Jadwal'], ['absen', 'qr_code_scanner', 'Absen', 1], ['laporan', 'bar_chart', 'Laporan'], ['kelola', 'apps', 'Kelola']];
const SIDE_ADM = [['beranda', 'dashboard', 'Dashboard'], ['jadwal', 'event_note', 'Jadwal Pengajian'], ['kegiatan', 'celebration', 'Kegiatan Majelis'], ['jamaah', 'groups', 'Data Jamaah'], ['lokasi', 'location_on', 'Lokasi GPS & Radius'], ['laporan', 'summarize', 'Laporan Kehadiran'], ['pengaturan', 'tune', 'Pengaturan']];
const brandHtml = () => `<div class="brand"><div class="logo">${ic('mosque', 'fill')}</div><div><b>Absensi Pengajian</b><span>${App.me && App.me.peran === 'Admin' ? 'Portal Pengurus' : esc((App.me && App.me.app && App.me.app.namaMajelis) || 'Jamaah')}</span></div></div>`;

const Router = {
  cleanup: null, seq: 0,
  nama() { const h = location.hash.replace(/^#\/?/, '').split('/'); return { name: h[0] || 'beranda', arg: h.slice(1).join('/') }; },
  async render() {
    if (!App.me || !$('#view')) return;
    if (this.cleanup) { try { this.cleanup(); } catch (e) { /* abaikan */ } this.cleanup = null; }
    const { name, arg } = this.nama(), v = $('#view'), adm = App.me.peran === 'Admin', fn = (adm && PagesAdmin[name]) || Pages[name], my = ++this.seq;
    if (!fn || name === 'login') { location.hash = '#/beranda'; return; }
    shellNav(name); window.scrollTo(0, 0);
    try { const c = await fn(v, arg); if (typeof c === 'function') { if (my === this.seq) this.cleanup = c; else c(); } }
    catch (e) { v.innerHTML = galat(e, 'muat-ulang'); }
  }
};
window.addEventListener('hashchange', () => Router.render());

function shellNav(name) {
  const rute = name === 'hasil' ? 'absen' : name === 'riwayat' ? 'profil' : name;
  $$('.nav-bottom [data-r]').forEach((a) => a.classList.toggle('on', a.dataset.r === rute || (a.dataset.r === 'kelola' && ['kegiatan', 'jamaah', 'lokasi', 'pengaturan', 'profil'].includes(rute))));
  $$('.side nav a').forEach((a) => a.classList.toggle('on', a.dataset.r === rute));
}
function shell() {
  const adm = App.me.peran === 'Admin', nav = adm ? NAV_ADM : NAV_USER;
  $('#root').innerHTML = `<div class="frame ${adm ? 'adm' : ''}">
    ${adm ? `<aside class="side">${brandHtml()}<nav aria-label="Navigasi majelis"><small>NAVIGASI MAJELIS</small>${SIDE_ADM.map((s) => `<a href="#/${s[0]}" data-r="${s[0]}">${ic(s[1])} ${s[2]}</a>`).join('')}</nav>
      <div class="me"><a class="row" href="#/profil"><span class="avatar">${esc(inisial(App.me.nama))}</span><span><b style="color:#fff">${esc(App.me.nama)}</b><br><span class="small" style="color:var(--peach)">${esc(App.me.jabatan || 'Admin majelis')}</span></span></a><div class="row between"><button class="row small" style="color:#cfd4ea" data-act="keluar">${ic('logout')} Keluar portal</button><span class="mono small" style="color:#8a92b1">v1.0</span></div></div></aside>` : ''}
    <header class="topbar">${brandHtml()}<a class="icon-btn dark" href="#/profil" aria-label="Profil">${ic('person')}</a></header>
    <main class="page" id="view" tabindex="-1"></main>
    <nav class="nav-bottom" aria-label="Navigasi utama">${nav.map((n) => n[3]
      ? `<a class="fab" href="#/${n[0]}" data-r="${n[0]}" aria-label="${n[2]}"><i>${ic(n[1], 'fill').replace('class="ms', 'style="font-size:30px" class="ms')}</i><span class="l">${n[2]}</span></a>`
      : n[0] === 'kelola' ? `<button data-act="kelola" data-r="kelola">${ic(n[1])}<span>${n[2]}</span></button>` : `<a href="#/${n[0]}" data-r="${n[0]}">${ic(n[1])}<span>${n[2]}</span></a>`).join('')}</nav></div>`;
}
Acts.kelola = () => modal({ judul: 'Kelola', isi: `<div class="stack">${[['kegiatan', 'celebration', 'Kegiatan majelis'], ['jamaah', 'groups', 'Data jamaah'], ['lokasi', 'location_on', 'Lokasi GPS & radius'], ['pengaturan', 'tune', 'Pengaturan'], ['profil', 'account_circle', 'Profil saya']].map((x) => `<a class="card flat row" href="#/${x[0]}" data-act="modal-tutup">${ic(x[1])}<b class="grow">${x[2]}</b>${ic('chevron_right')}</a>`).join('')}<button class="btn btn-ghost" data-act="keluar">${ic('logout')} Keluar</button></div>` });
Acts.keluar = async () => {
  if (!(await konfirmasi('Keluar dari akun?', 'Anda perlu memasukkan ID dan PIN lagi untuk masuk.', 'Keluar'))) return;
  Sesi.clear(); bersihkanCache(); App.me = null; Gps.henti(); Cam.henti(); location.hash = ''; Pages.login($('#root'));
};
window.addEventListener('ap:logout', () => { if (!App.me) return; App.me = null; Cam.henti(); Gps.henti(); toast('Sesi berakhir. Silakan masuk kembali.'); $$('.modal-back').forEach((b) => b._m && b._m.tutup()); Pages.login($('#root')); });

App.mulai = async function () {
  const root = $('#root');
  if (!Sesi.token) { Pages.login(root); return; }
  App.me = Sesi.me;
  if (!App.me) { try { App.me = (await api('me', {}, { fresh: true })).me; Sesi.set(null, App.me); } catch (e) { Sesi.clear(); Pages.login(root); return; } }
  shell();
  if (!location.hash || /^#\/?(login)?$/.test(location.hash)) location.hash = '#/beranda'; else Router.render();
  api('me', {}, { fresh: true }).then((d) => { App.me = d.me; Sesi.set(null, d.me); }).catch(() => {});
};
document.addEventListener('DOMContentLoaded', async () => {
  try { await App.mulai(); } finally { const s = $('#splash'); if (s) s.remove(); }
});
