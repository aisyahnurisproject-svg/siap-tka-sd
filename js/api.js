/* ============================================================
   API — komunikasi ke Google Apps Script (fetch + JSON)
   POST wajib Content-Type text/plain agar tidak memicu CORS preflight.
   ============================================================ */
const API = (() => {
  const KEY = 'siaptka_sesi';
  let sesi = null;

  function bacaSesi() {
    try {
      const raw = localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
      sesi = raw ? JSON.parse(raw) : null;
    } catch (e) { sesi = null; }
    return sesi;
  }

  function simpanSesi(data, ingat) {
    sesi = data;
    try {
      localStorage.removeItem(KEY); sessionStorage.removeItem(KEY);
      (ingat ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(data));
    } catch (e) { /* mode privat: sesi hanya di memori */ }
  }

  function hapusSesi() {
    sesi = null;
    try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (e) { /* abaikan */ }
  }

  function urlSiap() {
    const u = (window.APP_CONFIG && window.APP_CONFIG.GAS_URL) || '';
    return /^https?:\/\//.test(u) && u.indexOf('GANTI_DENGAN') < 0;
  }

  async function ping() {
    if (!urlSiap()) return { success: false, message: 'GAS_URL belum diisi di js/config.js' };
    try {
      const res = await fetch(window.APP_CONFIG.GAS_URL + '?action=ping', { method: 'GET' });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Server tidak dapat dihubungi.' };
    }
  }

  /**
   * Panggil aksi API. Melempar Error bila gagal (pesan ramah).
   * opsi.diam = true → tidak memicu logout otomatis.
   */
  async function call(action, data, opsi) {
    opsi = opsi || {};
    if (!urlSiap()) throw new Error('Alamat server belum diatur (GAS_URL di js/config.js).');
    let res;
    try {
      res = await fetch(window.APP_CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: action, token: sesi && sesi.token, data: data || {} })
      });
    } catch (e) {
      const err = new Error('Koneksi internet terputus. Coba lagi.');
      err.offline = true;
      throw err;
    }
    let json;
    try { json = await res.json(); } catch (e) { throw new Error('Balasan server tidak valid. Pastikan Web App sudah di-deploy dengan akses "Anyone".'); }
    if (!json.success) {
      if (json.kode === 'SESI_HABIS' && !opsi.diam) {
        hapusSesi();
        if (window.App) window.App.sesiHabis();
      }
      const err = new Error(json.message || 'Terjadi kesalahan.');
      err.kode = json.kode;
      throw err;
    }
    return json.data;
  }

  return { call, ping, bacaSesi, simpanSesi, hapusSesi, get sesi() { return sesi; }, urlSiap };
})();
