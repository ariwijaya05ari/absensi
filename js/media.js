/* Kamera, GPS, pengenalan wajah (face-api), pemindai & pembuat QR — pustaka dimuat saat dibutuhkan */
const CDN = {
  face: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.js',
  model: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/',
  jsqr: 'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js',
  qr: 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js',
  xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
};
const Lib = {
  _p: {},
  muat(url) {
    if (!this._p[url]) this._p[url] = new Promise((ok, no) => { const s = document.createElement('script'); s.src = url; s.async = true; s.onload = ok; s.onerror = () => { delete this._p[url]; no(new Error('Gagal memuat pustaka dari internet. Periksa sambungan Anda.')); }; document.head.appendChild(s); });
    return this._p[url];
  }
};

const Cam = {
  stream: null,
  async mulai(video, depan) {
    this.henti();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Browser ini tidak mendukung kamera. Gunakan Chrome/Safari terbaru lewat alamat https.');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: depan ? 'user' : { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    } catch (e) {
      const n = e && e.name;
      throw new Error(n === 'NotAllowedError' || n === 'SecurityError' ? 'Izin kamera ditolak. Ketuk ikon gembok di address bar → izinkan Kamera, lalu muat ulang.' : n === 'NotFoundError' ? 'Kamera tidak ditemukan di perangkat ini.' : n === 'NotReadableError' ? 'Kamera sedang dipakai aplikasi lain.' : 'Kamera tidak dapat dibuka: ' + (e && e.message));
    }
    video.setAttribute('playsinline', ''); video.muted = true; video.srcObject = this.stream; video.classList.toggle('rear', !depan);
    await video.play();
  },
  henti() { if (this.stream) { this.stream.getTracks().forEach((t) => t.stop()); this.stream = null; } }
};

const Gps = {
  pos: null, id: null,
  mulai(cb) {
    this.henti();
    if (!navigator.geolocation) { cb(null, { message: 'Browser tidak mendukung GPS.' }); return; }
    this.id = navigator.geolocation.watchPosition(
      (p) => { this.pos = { lat: p.coords.latitude, lng: p.coords.longitude, akurasi: p.coords.accuracy, t: Date.now() }; cb(this.pos); },
      (e) => cb(null, { kode: e.code, message: e.code === 1 ? 'Izin lokasi ditolak. Ketuk ikon gembok di address bar → izinkan Lokasi, lalu muat ulang.' : e.code === 2 ? 'Posisi tidak tersedia. Aktifkan GPS/Lokasi di perangkat Anda.' : 'Waktu pencarian lokasi habis. Pindah ke area terbuka.' }),
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 25000 });
  },
  henti() { if (this.id != null) { navigator.geolocation.clearWatch(this.id); this.id = null; } },
  satu() { return new Promise((ok, no) => { if (!navigator.geolocation) return no(new Error('Browser tidak mendukung GPS.')); navigator.geolocation.getCurrentPosition((p) => ok({ lat: p.coords.latitude, lng: p.coords.longitude, akurasi: p.coords.accuracy }), (e) => no(new Error(e.code === 1 ? 'Izin lokasi ditolak.' : 'Lokasi tidak tersedia.')), { enableHighAccuracy: true, timeout: 20000 }); }); },
  jarak(a, b, c, d) { const R = 6371000, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r, h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)); }
};

const Face = {
  siap: false,
  async muat(setStatus) {
    if (this.siap) return;
    if (setStatus) setStatus('Memuat mesin pengenal wajah…');
    await Lib.muat(CDN.face);
    const n = window.faceapi.nets;
    await Promise.all([n.tinyFaceDetector.loadFromUri(CDN.model), n.faceLandmark68Net.loadFromUri(CDN.model), n.faceRecognitionNet.loadFromUri(CDN.model)]);
    this.siap = true;
  },
  // Ambil 128 angka pengenal dari wajah di video (coba hingga ±3 detik)
  async ambil(video) {
    const opt = new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
    const mulai = Date.now();
    while (Date.now() - mulai < 3200) {
      const r = await window.faceapi.detectSingleFace(video, opt).withFaceLandmarks().withFaceDescriptor();
      if (r) return Array.from(r.descriptor);
      await new Promise((ok) => setTimeout(ok, 160));
    }
    throw new Error('Wajah tidak terdeteksi. Hadapkan wajah ke kamera, pastikan cahaya cukup dan lepas masker.');
  }
};

const Pemindai = {
  aktif: false,
  async mulai(video, onKode) {
    await Lib.muat(CDN.jsqr);
    this.aktif = true;
    const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
    const loop = () => {
      if (!this.aktif) return;
      if (video.readyState >= 2 && video.videoWidth) {
        const w = 420, h = Math.round(w * video.videoHeight / video.videoWidth); cv.width = w; cv.height = h; cx.drawImage(video, 0, 0, w, h);
        const k = window.jsQR(cx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
        if (k && k.data) { if (onKode(k.data) === false) { /* tetap memindai */ } }
      }
      setTimeout(() => requestAnimationFrame(loop), 140);
    };
    loop();
  },
  henti() { this.aktif = false; }
};

// QR → SVG (dibuat sendiri dari matriks modul agar tak bergantung versi pustaka)
async function qrSvg(teks, ukuran) {
  await Lib.muat(CDN.qr);
  const q = window.qrcode(0, 'M'); q.addData(String(teks)); q.make();
  const n = q.getModuleCount(), m = 2; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
  return `<svg viewBox="0 0 ${n + m * 2} ${n + m * 2}" width="${ukuran || 200}" height="${ukuran || 200}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kode QR"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#0e162f"/></svg>`;
}
// Kecilkan foto sebelum diunggah (maks sisi 1000px, JPEG)
function kecilkanFoto(file, maks) {
  return new Promise((ok, no) => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, (maks || 1000) / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', 0.78).split(',')[1]); };
    img.onerror = () => no(new Error('Berkas bukan gambar yang valid.')); img.src = u;
  });
}
