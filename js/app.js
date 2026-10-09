/* ============================================================
   APP — boot, login, router (hash), menu pengguna
   ============================================================ */
const App = (() => {
  const { $, $$, esc, icon } = UI;
  let user = null;

  function tampil(view) {
    ['login', 'siswa', 'ujian', 'guru'].forEach(v => $('#view-' + v).classList.toggle('hidden', v !== view));
    window.scrollTo(0, 0);
  }

  // ---------------- LOGIN ----------------
  function pasangLogin() {
    $$('.login-card .seg button').forEach(b => b.onclick = () => pilihTab(b.dataset.tab));
    $('#form-siswa').onsubmit = e => { e.preventDefault(); login('siswa'); };
    $('#form-guru').onsubmit = e => { e.preventDefault(); login('guru'); };
    $('#toggle-pass').onclick = () => { const i = $('#g-pass'); i.type = i.type === 'password' ? 'text' : 'password'; };
    $('#btn-scan').onclick = scanQR;
    $('#btn-bantuan-login').onclick = () => bantuan();
    $('#lupa-sandi').onclick = e => {
      e.preventDefault();
      UI.modal({ title: 'Lupa kata sandi guru', body: '<p>Demi keamanan, kata sandi guru hanya dapat diatur ulang oleh pengelola aplikasi (pemilik akun Google Apps Script).</p><p class="mt-1 muted small">Pengelola dapat menjalankan fungsi <span class="mono">resetPasswordGuru("username", "SandiBaru123")</span> dari editor Apps Script.</p>' });
    };
    $('.js-sapa').textContent = UI.sapaan();
    const u = new URLSearchParams(location.search);
    if (u.get('peran') === 'guru') pilihTab('guru');
  }

  function pilihTab(tab) {
    $$('.login-card .seg button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('#form-siswa').classList.toggle('hidden', tab !== 'siswa');
    $('#form-guru').classList.toggle('hidden', tab !== 'guru');
    $('#hero-siswa').classList.toggle('hidden', tab !== 'siswa');
    $('#hero-guru').classList.toggle('hidden', tab !== 'guru');
  }

  async function login(peran) {
    const pre = peran === 'siswa' ? 's' : 'g';
    const err = $('#' + pre + '-err');
    err.classList.add('hidden');
    const username = $('#' + pre + '-user').value.trim();
    const password = $(peran === 'siswa' ? '#s-kode' : '#g-pass').value.trim();
    if (!username || !password) { err.textContent = peran === 'siswa' ? 'Isi NISN/nama pengguna dan kode siswa dulu ya.' : 'Isi nama pengguna dan kata sandi.'; err.classList.remove('hidden'); return; }
    const btn = $('#form-' + peran + ' button[type=submit]');
    btn.disabled = true;
    const label = btn.innerHTML;
    btn.innerHTML = '<span class="spinner sm"></span> Memeriksa…';
    try {
      const r = await API.call('login', { peran, username, password });
      API.simpanSesi({ token: r.token, user: r.user }, $('#' + pre + '-ingat').checked);
      $('#g-pass').value = ''; $('#s-kode').value = '';
      masuk(r.user, true);
    } catch (e) {
      err.textContent = e.message; err.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.innerHTML = label;
    }
  }

  // ---------------- QR scan ----------------
  async function scanQR() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return UI.toast('Kamera tidak tersedia di perangkat ini.', 'error');
    const m = UI.modal({ title: 'Pindai Kartu Login', body: '<video playsinline muted style="width:100%;border-radius:1rem;background:#000;aspect-ratio:4/3;object-fit:cover"></video><p class="muted small mt-1 center">Arahkan kode QR pada kartu ke kamera.</p>', onClose: () => stop() });
    const video = m.querySelector('video');
    let stream, aktif = true, detector = null;
    const stop = () => { aktif = false; if (stream) stream.getTracks().forEach(t => t.stop()); };
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = stream; await video.play();
    } catch (e) { m.close(); return UI.toast('Izin kamera ditolak.', 'error'); }
    if ('BarcodeDetector' in window) { try { detector = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { detector = null; } }
    if (!detector && !window.jsQR) {
      await new Promise(res => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
    }
    const cv = document.createElement('canvas'); const ctx = cv.getContext('2d', { willReadFrequently: true });
    const loop = async () => {
      if (!aktif) return;
      let teks = null;
      try {
        if (detector) { const r = await detector.detect(video); if (r.length) teks = r[0].rawValue; }
        else if (window.jsQR && video.videoWidth) {
          cv.width = video.videoWidth; cv.height = video.videoHeight; ctx.drawImage(video, 0, 0);
          const r = window.jsQR(ctx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height); if (r) teks = r.data;
        }
      } catch (e) { /* lanjut */ }
      const p = teks ? String(teks).split('|') : null;
      if (p && p[0] === 'SIAPTKA' && p.length >= 3) {
        m.close(); $('#s-user').value = p[1]; $('#s-kode').value = p[2]; login('siswa'); return;
      }
      setTimeout(loop, 250);
    };
    loop();
  }

  // ---------------- MASUK / KELUAR ----------------
  function masuk(u, baru) {
    user = u;
    $$('.js-nama').forEach(e => e.textContent = u.nama);
    $$('.js-kelas').forEach(e => e.textContent = (u.nama_kelas || '') + (u.nama_sekolah ? ' • ' + u.nama_sekolah : ''));
    $$('.js-initial').forEach(e => e.textContent = UI.initials(u.nama));
    $$('.js-sekolah').forEach(e => e.textContent = u.nama_sekolah || 'Persiapan TKA SD');
    $$('.js-ta').forEach(e => e.textContent = 'TA ' + (u.tahun_ajaran || '-'));
    if (baru) {
      const tujuan = u.peran === 'guru' ? '#/g/dashboard' : '#/s/beranda';
      if (!location.hash.startsWith(u.peran === 'guru' ? '#/g/' : '#/s/') && !location.hash.startsWith('#/ujian/')) location.hash = tujuan;
      UI.toast('Halo, ' + u.nama.split(' ')[0] + '! Selamat datang.', 'success');
    }
    route();
  }

  async function keluar(tanya) {
    if (tanya && !(await UI.confirm('Keluar dari aplikasi?', 'Pastikan pekerjaanmu sudah tersimpan.', { ok: 'Keluar' }))) return;
    try { await API.call('logout', {}, { diam: true }); } catch (e) { /* abaikan */ }
    if (window.Ujian) Ujian.hentikan();
    API.hapusSesi(); user = null;
    location.hash = '';
    tampil('login');
  }

  function sesiHabis() {
    if (!user) return;
    user = null;
    if (window.Ujian) Ujian.hentikan();
    UI.toast('Sesi berakhir karena tidak aktif. Silakan masuk lagi.', 'warn');
    tampil('login');
  }

  // ---------------- ROUTER ----------------
  function route() {
    if (!user) return tampil('login');
    const h = location.hash.replace(/^#\/?/, '').split('/');
    if (h[0] === 'ujian' && user.peran === 'siswa') { tampil('ujian'); return Ujian.dariRute(h[1]); }
    if (window.Ujian) Ujian.hentikan();
    if (user.peran === 'guru') {
      if (h[0] !== 'g') { location.replace('#/g/dashboard'); return; }
      tampil('guru'); Guru.render(h[1] || 'dashboard', h.slice(2));
    } else {
      if (h[0] !== 's') { location.replace('#/s/beranda'); return; }
      tampil('siswa'); Siswa.render(h[1] || 'beranda', h.slice(2));
    }
  }

  // ---------------- MENU & BANTUAN ----------------
  function menuPengguna(btn) {
    const ada = btn.parentElement.querySelector('.menu');
    if (ada) return ada.remove();
    const m = document.createElement('div');
    m.className = 'menu';
    m.innerHTML = '<div class="who"><b>' + esc(user.nama) + '</b><div class="muted xs">' + (user.peran === 'guru' ? 'Guru' : 'Siswa') + ' • ' + esc(user.username) + '</div></div>' +
      (user.peran === 'guru' ? '<button data-a="sandi">' + icon('key') + 'Ganti kata sandi</button><button data-a="atur">' + icon('sliders') + 'Pengaturan</button>' : '<button data-a="bantuan">' + icon('help') + 'Bantuan</button>') +
      '<button data-a="keluar">' + icon('logout') + 'Keluar</button>';
    btn.parentElement.appendChild(m);
    const tutup = e => { if (!m.contains(e.target) && e.target !== btn) { m.remove(); document.removeEventListener('click', tutup); } };
    setTimeout(() => document.addEventListener('click', tutup));
    m.onclick = e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      m.remove();
      if (a.dataset.a === 'keluar') keluar(true);
      if (a.dataset.a === 'bantuan') bantuan();
      if (a.dataset.a === 'sandi') Guru.gantiSandi();
      if (a.dataset.a === 'atur') location.hash = '#/g/pengaturan';
    };
  }

  function bantuan() {
    const siswa = !user || user.peran === 'siswa';
    UI.modal({
      title: 'Bantuan', body: siswa
        ? '<div class="stack"><div class="note-card"><b>Cara masuk:</b> ketik NISN atau nama pengguna, lalu kode siswa dari kartu (contoh TKA-1234).</div><div class="note-card"><b>Saat mengerjakan:</b> klik pilihan jawaban. Jawaban tersimpan otomatis. Tekan <b>Ragu-ragu</b> bila belum yakin, lalu periksa lagi lewat <b>Daftar Soal</b>.</div><div class="note-card"><b>Koneksi putus?</b> Tenang, jawabanmu juga disimpan di perangkat. Muat ulang halaman dan masuk lagi untuk melanjutkan.</div><div class="note-card"><b>Masih bingung?</b> Angkat tangan dan panggil guru atau pengawas ruang.</div></div>'
        : '<div class="stack"><div class="note-card"><b>Mulai cepat:</b> buka Data Siswa → Tambah/Impor siswa → Cetak Kartu Login. Lalu buat paket Diagnostik.</div><div class="note-card"><b>Dashboard</b> menjawab: siapa belum siap, kompetensi apa yang lemah, dan latihan apa berikutnya.</div><div class="note-card"><b>Diferensiasi:</b> mode Otomatis memilih tingkat soal sesuai kemampuan; mode Kelompok membuat paket hanya terlihat oleh kelompok tertentu.</div><div class="note-card"><b>Laporan PDF</b> tersimpan di Google Drive folder TKA-SD/Laporan-PDF.</div></div>'
    });
  }

  function jam() {
    const el = $('#jam'); if (!el) return;
    el.textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
  }

  async function cekServer() {
    const dot = $('#srv-dot'), t = $('#srv-text');
    const r = await API.ping();
    if (r.success && r.data && r.data.siap) {
      dot.className = 'status-dot on'; t.className = 'chip chip-green'; t.textContent = 'Siap • Server Aktif';
      if (r.data.nama_sekolah) $$('#view-login .js-sekolah').forEach(e => e.textContent = r.data.nama_sekolah);
      if (r.data.tahun_ajaran) $$('#view-login .js-ta').forEach(e => e.textContent = r.data.tahun_ajaran);
    } else {
      dot.className = 'status-dot off'; t.className = 'chip chip-red';
      t.textContent = r.success ? 'Server belum disiapkan' : (API.urlSiap() ? 'Tidak terhubung' : 'GAS_URL belum diisi');
    }
  }

  async function boot() {
    UI.hydrateIcons();
    UI.initFont();
    pasangLogin();
    $$('[data-usermenu]').forEach(b => b.onclick = () => menuPengguna(b));
    $$('[data-bantuan]').forEach(b => b.onclick = () => bantuan());
    window.addEventListener('hashchange', route);
    jam(); setInterval(jam, 30000);
    cekServer();
    const s = API.bacaSesi();
    if (s && s.token) {
      try {
        const r = await API.call('me', {}, { diam: true });
        masuk(r.user, false);
        return;
      } catch (e) {
        if (e.offline && s.user) { masuk(s.user, false); return; }
        API.hapusSesi();
      }
    }
    tampil('login');
  }

  document.addEventListener('DOMContentLoaded', boot);
  return { get user() { return user; }, keluar, sesiHabis, route, bantuan, tampil };
})();
window.App = App;
