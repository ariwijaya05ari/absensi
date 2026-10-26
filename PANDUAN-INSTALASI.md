# Panduan Instalasi — Absensi Pengajian

Aplikasi ini terdiri dari **dua bagian**:

| Bagian | Isi | Dipasang di |
|---|---|---|
| **Backend** | `Kode.gs` + `appsscript.json` | Google Apps Script (otomatis membuat Spreadsheet & folder Drive) |
| **Frontend** | ZIP `absensi-pengajian-frontend.zip` (`index.html`, `css/`, `js/`) | GitHub Pages |

Urutan wajib: **Backend dulu → salin URL → isi `js/config.js` → deploy frontend.**

---

## BAGIAN 1 — Pasang Backend (±10 menit)

### 1.1 Buat proyek Apps Script
1. Buka <https://script.google.com> → **Proyek baru** → beri nama `Absensi Pengajian`.
2. Hapus isi `Kode.gs` bawaan, **tempel seluruh isi berkas `Kode.gs`** dari paket ini.
3. Klik ikon **⚙ Setelan proyek** → centang **"Tampilkan file manifes appsscript.json di editor"**.
4. Kembali ke **Editor**, buka `appsscript.json`, hapus isinya, **tempel isi berkas `appsscript.json`** dari paket ini. Simpan (Ctrl+S).

### 1.2 Jalankan setup (sekali saja)
1. Di bilah atas editor pilih fungsi **`setupAppEnvironment`** → klik **▶ Jalankan**.
2. Klik **Tinjau izin** → pilih akun Google Anda → *Lanjutan* → *Buka Absensi Pengajian (tidak aman)* → **Izinkan**. (Peringatan ini normal untuk skrip buatan sendiri.)
3. Setelah selesai, buka **Log eksekusi** di bagian bawah. Anda akan melihat:
   ```
   ADMIN PERTAMA — catat sekarang, hanya tampil sekali
      ID Jamaah : JMH-001
      PIN       : 123456   (contoh — PIN Anda acak)
   ```
   **Catat ID dan PIN ini.** PIN tidak disimpan dalam bentuk asli dan tidak akan tampil lagi. Jika hilang: jalankan fungsi `resetPinAdmin`.
4. Setup otomatis membuat folder **📁 Absensi Pengajian** di Google Drive Anda berisi Spreadsheet database, folder foto, ekspor, dan cadangan.

> Setup aman dijalankan ulang — tidak menimpa data dan tidak mengganti PIN/rahasia.

### 1.3 (Opsional tapi disarankan)
- Jalankan **`installTriggers`** → cadangan spreadsheet otomatis tiap malam jam 02:00 (14 salinan terakhir disimpan).
- Untuk mencoba aplikasi dengan data tiruan, jalankan **`isiDataContoh`** (5 jamaah + 2 jadwal + 2 kegiatan; PIN-nya tercatat di log). Hapus data contoh sebelum dipakai sungguhan.

### 1.4 Deploy sebagai Web App
1. Klik **Deploy → Deployment baru** → ikon roda gigi → **Aplikasi web**.
2. **Jalankan sebagai: Saya** · **Siapa yang memiliki akses: Siapa saja**.
   > "Siapa saja" diperlukan agar frontend di GitHub Pages bisa memanggil API. Data tetap terlindungi: semua aksi (kecuali login) menolak permintaan tanpa token sesi yang sah, dan hak akses Admin/Jamaah dicek di server.
3. Klik **Deploy**, lalu **salin URL Aplikasi Web** (berakhiran `/exec`).
4. Uji: tempel URL itu di tab browser baru. Harus tampil teks JSON `{"success":true,...}`.

---

## BAGIAN 2 — Hubungkan & Deploy Frontend

### 2.1 Isi URL backend
1. Ekstrak `absensi-pengajian-frontend.zip` → hasilnya satu folder, di dalamnya **langsung** terlihat `index.html`, `css`, `js`.
2. Buka `js/config.js` dengan Notepad, ganti `GANTI_DENGAN_ID_DEPLOYMENT` sehingga seluruh alamat menjadi URL `/exec` yang Anda salin tadi. Simpan.

### 2.2 Push ke GitHub Pages (lewat terminal)
> ⚠️ **Folder kerja = folder hasil ekstraksi ZIP, yaitu folder yang langsung berisi `index.html`.** Jangan masuk lebih dalam, jangan naik satu level. Jangan gunakan "Upload files" di situs GitHub (struktur folder akan rusak dan CSS/JS jadi 404).

1. Buat repository **Public** baru di github.com (mis. `absensi-pengajian`), **jangan** centang README/.gitignore/license.
2. Buka terminal di folder hasil ekstraksi. **Cek dulu** bahwa `index.html` tampil di daftar:
   - Windows PowerShell: `dir`   ·   Mac/Linux: `ls`
3. Jalankan (ganti `USERNAME` dan nama repo):
   ```bash
   git init
   git add .
   git commit -m "Absensi Pengajian v1.0.0"
   git branch -M main
   git remote add origin https://github.com/USERNAME/absensi-pengajian.git
   git push -u origin main
   ```
   Saat diminta password, gunakan **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens → centang `repo`), bukan password akun.
4. Di GitHub: **Settings → Pages → Branch: `main`, folder `/ (root)` → Save**. Tunggu 1–3 menit.
5. Aplikasi hidup di `https://USERNAME.github.io/absensi-pengajian/`.

Pembaruan berikutnya: `git add .` → `git commit -m "pembaruan"` → `git push`.

---

## BAGIAN 3 — Pemakaian Pertama (urutan yang disarankan)

1. **Masuk** sebagai `JMH-001` dengan PIN dari log → buka **Profil → Ubah PIN**.
2. **Pengaturan**: isi nomor WhatsApp pengurus (format `62812…`), cek batas terlambat, dll.
3. **Lokasi GPS & Radius**: *datang ke lokasi pengajian*, buka menu ini di ponsel, **Tambah titik lokasi → Gunakan lokasi saya**, atur radius (disarankan 50–100 m).
4. **Data Jamaah**: tambah satu per satu atau **Impor Excel/CSV** (templat tersedia di dialog impor). **PIN awal tiap jamaah hanya tampil sekali** — unduh CSV-nya dan bagikan secara pribadi.
5. **Daftarkan wajah** tiap jamaah (ikon wajah di baris jamaah, 3 sampel). Jamaah tanpa wajah tetap bisa absen dengan scan QR.
6. **Cetak kartu QR** (pilih jamaah → *Cetak kartu*) — cadangan bila kamera jamaah bermasalah.
7. **Jadwal Pengajian**: buat sesi; aktifkan *Ulangi rutin setiap pekan* untuk 8 sesi sekaligus.

### Cara absen di hari-H
- Absen dibuka **30 menit sebelum** jam mulai (dapat diubah di Pengaturan).
- **Jamaah**: Beranda → *Absen Sekarang* → izinkan Kamera & Lokasi → *Verifikasi wajah*. Alternatif: tab *Scan QR* lalu pindai QR sesi.
- **Pengurus**: Dashboard → *Buka presensi* pada sesi → tab **QR sesi** (tampilkan di layar/proyektor; berganti tiap 30 detik), **Pindai kartu** (scan QR kartu jamaah), atau **Absen manual**.
- Status otomatis **Terlambat** bila absen lewat batas (default 15 menit setelah mulai).

---

## BAGIAN 4 — Memperbarui Backend
Setelah mengubah `Kode.gs`: **Deploy → Kelola deployment → ✏ Edit → Versi: Versi baru → Deploy**. URL `/exec` **tetap sama**, jadi frontend tidak perlu diubah.

## BAGIAN 5 — Keamanan (singkat)
- **Jangan bagikan Spreadsheet** database ke siapa pun (berisi hash PIN & data wajah). Akses hanya lewat akun Google pengelola.
- PIN disimpan sebagai hash HMAC dengan *salt* per akun dan *pepper* rahasia di Script Properties. 5× salah PIN → akun terkunci 15 menit.
- Reset PIN atau menonaktifkan akun langsung mencabut sesi yang sedang login.
- Untuk memaksa **semua orang login ulang**: jalankan `rotasiSecretSesi` di editor.
- Kode frontend & URL `/exec` bersifat publik — itu normal dan tidak berisi rahasia.

## Pemecahan masalah

| Gejala | Penyebab & solusi |
|---|---|
| Halaman GitHub Pages 404 | `index.html` tidak di root repo. Ulangi Bagian 2.2, pastikan `dir`/`ls` menampilkan `index.html` sebelum `git init`. |
| "Konfigurasi belum lengkap" | `js/config.js` belum diisi URL `/exec`. |
| "Tidak dapat terhubung ke server" | Deployment belum diset *Siapa saja*, atau URL salah. Buka URL `/exec` di browser, harus muncul JSON. |
| Perubahan backend tak berefek | Belum **Deployment → Versi baru** (Bagian 4). |
| Kamera/GPS tidak jalan | Wajib `https` (GitHub Pages sudah). Cek izin Kamera & Lokasi di browser (Profil → *Panduan izin kamera & GPS*). |
| "Wajah tidak cocok" terus | Cahaya dari depan, lepas masker. Daftarkan ulang wajah dengan pencahayaan baik, atau naikkan `AMBANG_WAJAH` sedikit (mis. 0.6) di Pengaturan. |
| "Di luar radius" padahal di lokasi | Koordinat titik kurang tepat atau radius terlalu kecil. Perbarui titik dengan *Gunakan lokasi saya* di lokasi. |
| Ikon tampil sebagai teks | Font ikon Google gagal dimuat — periksa koneksi internet. |
| PIN admin hilang | Jalankan `resetPinAdmin` di editor Apps Script, lihat log. |

## Batasan yang perlu diketahui
- Pencocokan wajah dilakukan **di server** (perbandingan angka pengenal wajah), tetapi sistem **tidak memiliki deteksi "kehidupan" (liveness)**: foto/layar yang ditunjukkan ke kamera bisa saja lolos. Kombinasi GPS + QR sesi + pengawasan pengurus tetap dianjurkan.
- GPS ponsel dapat dipalsukan dengan aplikasi tertentu; ini batas teknis aplikasi web.
- Kuota Google Apps Script (gratis) cukup untuk puluhan hingga ratusan jamaah; absen serentak ditangani dengan antrean kunci, sehingga bisa terasa melambat bila puluhan orang menekan tombol bersamaan.
- Pustaka wajah/QR dimuat dari CDN (jsDelivr/cdnjs) → perangkat jamaah butuh internet.
