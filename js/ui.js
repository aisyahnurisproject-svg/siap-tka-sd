/* ============================================================
   UI HELPERS — ikon, toast, modal, grafik SVG, format, CSV
   ============================================================ */
const UI = (() => {
  const P = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    graduation: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M10 2h4"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 16v-5"/><path d="M12 16V8"/><path d="M17 16v-3"/>',
    trending: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    sliders: '<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/>',
    split: '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.2-2.8L3 3"/><path d="m15 9 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M3 21v-5h5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'arrow-left': '<circle cx="12" cy="12" r="10"/><path d="m12 8-4 4 4 4"/><path d="M16 12H8"/>',
    'arrow-right': '<circle cx="12" cy="12" r="10"/><path d="m12 16 4-4-4-4"/><path d="M8 12h8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0"/><path d="M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
    menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    idcard: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M7 16h10"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
    note: '<path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5z"/><path d="M15 3v6h6"/>',
    laptop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>',
    play: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
  };

  function icon(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || P.info) + '</svg>';
  }

  function hydrateIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(el => {
      if (el.dataset.iconDone) return;
      // <span data-icon> kosong → diganti langsung dengan <svg> agar selektor CSS (.input-icon > svg) bekerja
      if (el.tagName === 'SPAN' && !el.className && !el.textContent.trim()) { el.outerHTML = icon(el.dataset.icon); return; }
      el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
      el.dataset.iconDone = '1';
    });
  }

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ---------- Toast & loading ----------
  function toast(msg, type) {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.innerHTML = icon(type === 'error' ? 'alert' : (type === 'success' ? 'check-circle' : 'info')) + '<span>' + esc(msg) + '</span>';
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, type === 'error' ? 5200 : 3200);
    setTimeout(() => el.remove(), type === 'error' ? 5600 : 3600);
  }

  let loadCount = 0;
  function loading(on) {
    loadCount = Math.max(0, loadCount + (on ? 1 : -1));
    $('#loader').classList.toggle('hidden', loadCount === 0);
  }

  /** Jalankan aksi async dengan loader + toast error. */
  async function run(fn, opsi) {
    opsi = opsi || {};
    if (!opsi.tanpaLoader) loading(true);
    try { return await fn(); }
    catch (e) { toast(e.message, 'error'); if (opsi.lempar) throw e; return null; }
    finally { if (!opsi.tanpaLoader) loading(false); }
  }

  // ---------- Modal ----------
  function modal(opts) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal ' + (opts.size || '') + '" role="dialog" aria-modal="true">' +
      '<div class="modal-head"><h3>' + (opts.title || '') + '</h3><button class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Tutup">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' + (opts.body || '') + '</div>' +
      (opts.foot !== false ? '<div class="modal-foot">' + (opts.foot || '<button class="btn" data-close>Tutup</button>') + '</div>' : '') + '</div>';
    document.body.appendChild(bg);
    hydrateIcons(bg);
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); if (opts.onClose) opts.onClose(); };
    const onKey = e => { if (e.key === 'Escape' && !opts.wajib) close(); };
    document.addEventListener('keydown', onKey);
    bg.addEventListener('click', e => {
      if ((e.target === bg && !opts.wajib) || e.target.closest('[data-close]')) close();
    });
    const el = bg.querySelector('.modal');
    el.close = close;
    const first = el.querySelector('input, select, textarea');
    if (first && !opts.noFocus) setTimeout(() => first.focus(), 50);
    return el;
  }

  function confirm(title, message, opsi) {
    opsi = opsi || {};
    return new Promise(resolve => {
      let jawab = false;
      const m = modal({
        title: esc(title), body: '<div style="font-size:.95rem">' + message + '</div>',
        foot: '<button class="btn" data-close>' + esc(opsi.batal || 'Batal') + '</button><button class="btn ' + (opsi.bahaya ? 'btn-danger' : 'btn-primary') + '" data-ok>' + esc(opsi.ok || 'Ya, lanjutkan') + '</button>',
        onClose: () => resolve(jawab), noFocus: true
      });
      m.querySelector('[data-ok]').onclick = () => { jawab = true; m.close(); };
    });
  }

  // ---------- Format ----------
  function initials(n) { return String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join(''); }
  const WARNA = ['#1D63D3', '#047857', '#B91C1C', '#7C3AED', '#B45309', '#0E7490', '#9D174D', '#4D7C0F', '#475569'];
  function warnaNama(n) { let h = 0; String(n).split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return WARNA[h % WARNA.length]; }
  function avatar(n) { return '<div class="avatar" style="background:' + warnaNama(n) + '">' + esc(initials(n)) + '</div>'; }

  function tgl(v, jam) {
    if (!v) return '-';
    const d = new Date(isNaN(v) ? v : Number(v));
    if (isNaN(d)) return '-';
    const o = { day: 'numeric', month: 'short', year: 'numeric' };
    if (jam) { o.hour = '2-digit'; o.minute = '2-digit'; }
    return d.toLocaleString('id-ID', o);
  }
  function relatif(v) {
    if (!v) return 'Belum pernah';
    const d = new Date(isNaN(v) ? v : Number(v));
    const s = (Date.now() - d.getTime()) / 1000;
    if (s < 60) return 'Baru saja';
    if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
    if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
    if (s < 86400 * 7) return Math.floor(s / 86400) + ' hari lalu';
    return tgl(v);
  }
  function durasi(detik) {
    detik = Math.max(0, Math.floor(detik));
    const h = Math.floor(detik / 3600), m = Math.floor(detik % 3600 / 60), s = detik % 60;
    return [h, m, s].map(x => String(x).padStart(2, '0')).join(':');
  }
  function angka(v, d) { return v === null || v === undefined || v === '' ? '-' : (Math.round(Number(v) * 10) / 10).toLocaleString('id-ID') + (d || ''); }

  const JENIS = { diagnostik: 'Diagnostik', latihan: 'Latihan', evaluasi: 'Evaluasi', tryout: 'Try Out', harian: 'Latihan Harian', kompetensi: 'Latihan per Bab' };
  const LEVEL = { belum: 'Belum', berkembang: 'Berkembang', menguasai: 'Menguasai' };

  function levelDari(p, kktp, bawah) {
    if (p === null || p === undefined) return 'kosong';
    return p >= (kktp || 75) ? 'menguasai' : (p >= (bawah || 55) ? 'berkembang' : 'belum');
  }
  function badgeLevel(level, teks) {
    return '<span class="chip lv-' + (level || 'kosong') + '">' + esc(teks || LEVEL[level] || 'Belum dicoba') + '</span>';
  }
  function heat(p, kktp, bawah) {
    const lv = levelDari(p, kktp, bawah);
    if (lv === 'kosong') return '<span class="heat lv-kosong">—<small>belum dicoba</small></span>';
    return '<span class="heat lv-' + lv + '">' + angka(p, '%') + '<small>' + LEVEL[lv] + '</small></span>';
  }
  function bar(p, kktp, bawah, opsi) {
    opsi = opsi || {};
    const lv = levelDari(p, kktp, bawah);
    return '<div class="bar ' + (opsi.lg ? 'lg' : '') + '"><i class="c-' + lv + '" style="width:' + Math.max(0, Math.min(100, p || 0)) + '%"></i>' +
      (opsi.mark ? '<span class="mark" style="left:' + opsi.mark + '%"></span>' : '') + '</div>';
  }

  // ---------- Grafik SVG ----------
  function ring(persen, opsi) {
    opsi = opsi || {};
    const r = 52, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, persen || 0));
    const warna = opsi.warna || 'var(--primary)';
    return '<div class="ring ' + (opsi.cls || '') + '"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="' + (opsi.track || '#E2E8F0') + '" stroke-width="12"/>' +
      '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="' + warna + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + (c * p / 100) + ' ' + c + '"/></svg>' +
      '<div class="lbl"><div><b style="color:' + (opsi.warnaTeks || 'inherit') + '">' + (persen === null || persen === undefined ? '–' : Math.round(p) + '%') + '</b><span>' + esc(opsi.label || '') + '</span></div></div></div>';
  }

  /** Grafik garis perkembangan nilai. points: [{label, value, jenis}] */
  function lineChart(points, opsi) {
    opsi = opsi || {};
    if (!points || !points.length) return '<div class="empty">' + icon('chart') + '<div>Belum ada data perkembangan.</div></div>';
    const W = 640, H = 240, L = 36, R = 16, T = 18, B = 42;
    const n = points.length;
    const x = i => n === 1 ? (L + (W - L - R) / 2) : L + i * (W - L - R) / (n - 1);
    const y = v => T + (H - T - B) * (1 - Math.max(0, Math.min(100, v)) / 100);
    let s = '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik perkembangan nilai">';
    [0, 25, 50, 75, 100].forEach(g => {
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="#EEF2F7"/><text x="' + (L - 8) + '" y="' + (y(g) + 4) + '" font-size="11" fill="#94A3B8" text-anchor="end">' + g + '</text>';
    });
    if (opsi.kktp) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(opsi.kktp) + '" y2="' + y(opsi.kktp) + '" stroke="#10B981" stroke-dasharray="5 5" stroke-width="1.5"/><text x="' + (W - R) + '" y="' + (y(opsi.kktp) - 6) + '" font-size="10.5" fill="#047857" text-anchor="end">Target ' + opsi.kktp + '</text>';
    const pts = points.map((p, i) => x(i) + ',' + y(p.value)).join(' ');
    s += '<polygon points="' + x(0) + ',' + y(0) + ' ' + pts + ' ' + x(n - 1) + ',' + y(0) + '" fill="rgba(29,99,211,.08)"/>';
    s += '<polyline points="' + pts + '" fill="none" stroke="#1D63D3" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>';
    const warnaJenis = { diagnostik: '#7C3AED', tryout: '#EF4444', evaluasi: '#F59E0B' };
    const step = Math.ceil(n / 10);
    points.forEach((p, i) => {
      s += '<circle cx="' + x(i) + '" cy="' + y(p.value) + '" r="5.5" fill="#fff" stroke="' + (warnaJenis[p.jenis] || '#1D63D3') + '" stroke-width="3"><title>' + esc(p.label + ': ' + p.value) + '</title></circle>';
      if (n <= 14 || i % step === 0 || i === n - 1) {
        s += '<text x="' + x(i) + '" y="' + (y(p.value) - 11) + '" font-size="11" font-weight="700" fill="#1E293B" text-anchor="middle">' + Math.round(p.value) + '</text>';
        s += '<text x="' + x(i) + '" y="' + (H - B + 18) + '" font-size="10.5" fill="#64748B" text-anchor="middle">' + esc(p.label) + '</text>';
      }
    });
    return s + '</svg></div>';
  }

  // ---------- Font scale A A A ----------
  const SKALA = [1, 1.125, 1.25];
  function setFont(i) {
    document.documentElement.style.setProperty('--fs', SKALA[i] || 1);
    try { localStorage.setItem('siaptka_font', String(i)); } catch (e) { /* abaikan */ }
    $$('[data-fontctl]').forEach(c => c.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i)));
  }
  function fontCtl(el) {
    el.innerHTML = '<button type="button" aria-label="Huruf normal">A</button><button type="button" aria-label="Huruf sedang">A</button><button type="button" aria-label="Huruf besar">A</button>';
    el.querySelectorAll('button').forEach((b, i) => b.onclick = () => setFont(i));
  }
  function initFont() {
    $$('[data-fontctl]').forEach(fontCtl);
    let i = 0; try { i = Number(localStorage.getItem('siaptka_font') || 0); } catch (e) { /* abaikan */ }
    setFont(i);
  }

  // ---------- Teks stimulus: paragraf + tabel sederhana (baris "| a | b |") ----------
  function teksKaya(t, opsi) {
    opsi = opsi || {};
    const blok = String(t || '').split(/\n\s*\n/);
    return blok.map((b, i) => {
      const baris = b.split('\n').filter(x => x.trim());
      if (baris.length && baris.every(x => x.trim().startsWith('|'))) {
        return '<table>' + baris.map(x => '<tr>' + x.trim().replace(/^\||\|$/g, '').split('|').map(c => '<td>' + esc(c.trim()) + '</td>').join('') + '</tr>').join('') + '</table>';
      }
      return '<p class="' + (opsi.drop && i === 0 ? 'drop' : '') + '">' + esc(b).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  // ---------- CSV/TSV ----------
  function parseCSV(text) {
    text = String(text || '').replace(/^﻿/, '');
    const delim = (text.split('\n')[0].match(/\t/g) || []).length ? '\t' : ((text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',');
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const bersih = rows.filter(r => r.some(c => String(c).trim()));
    if (!bersih.length) return [];
    const head = bersih[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    return bersih.slice(1).map(r => { const o = {}; head.forEach((h, i) => { o[h] = (r[i] || '').trim(); }); return o; });
  }

  function unduhTeks(nama, isi, mime) {
    const blob = new Blob(['﻿' + isi], { type: mime || 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function keCSV(rows) {
    return rows.map(r => r.map(c => { const s = String(c === null || c === undefined ? '' : c); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n');
  }

  // ---------- Berkas → base64 (gambar dikompres) ----------
  function bacaBerkas(file, opsi) {
    opsi = opsi || {};
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('Gagal membaca berkas.'));
      fr.onload = () => {
        if (!/^image\//.test(file.type) || file.type === 'image/gif' || file.type === 'image/svg+xml') return resolve({ base64: fr.result, mime: file.type, nama: file.name });
        const img = new Image();
        img.onload = () => {
          const maks = opsi.maks || 1400;
          const k = Math.min(1, maks / Math.max(img.width, img.height));
          const cv = document.createElement('canvas');
          cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
          const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
          ctx.drawImage(img, 0, 0, cv.width, cv.height);
          resolve({ base64: cv.toDataURL('image/jpeg', .85), mime: 'image/jpeg', nama: file.name.replace(/\.\w+$/, '') + '.jpg' });
        };
        img.onerror = () => resolve({ base64: fr.result, mime: file.type, nama: file.name });
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  async function salin(t) {
    try { await navigator.clipboard.writeText(t); toast('Disalin: ' + t, 'success'); }
    catch (e) { toast('Tidak bisa menyalin otomatis. Salin manual: ' + t); }
  }

  /** Paginasi sederhana sisi klien. */
  function pager(total, hal, per, onGo) {
    const n = Math.max(1, Math.ceil(total / per));
    const id = 'pg' + Math.random().toString(36).slice(2, 8);
    let btn = '';
    for (let i = 1; i <= n; i++) {
      if (n > 7 && i > 2 && i < n - 1 && Math.abs(i - hal) > 1) { if (!btn.endsWith('…</span>')) btn += '<span class="muted">…</span>'; continue; }
      btn += '<button data-p="' + i + '" class="' + (i === hal ? 'on' : '') + '">' + i + '</button>';
    }
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => onGo(Number(b.dataset.p)));
    });
    const a = total ? (hal - 1) * per + 1 : 0, b = Math.min(total, hal * per);
    return '<div class="pager" id="' + id + '"><span class="small">Menampilkan <b>' + a + '–' + b + '</b> dari <b>' + total + '</b></span>' +
      '<div class="pages"><button data-p="' + Math.max(1, hal - 1) + '" aria-label="Sebelumnya">‹</button>' + btn + '<button data-p="' + Math.min(n, hal + 1) + '" aria-label="Berikutnya">›</button></div></div>';
  }

  function debounce(fn, ms) { let t; return function () { clearTimeout(t); const a = arguments; t = setTimeout(() => fn.apply(null, a), ms || 250); }; }

  function sapaan() {
    const h = new Date().getHours();
    return h < 11 ? 'Semangat Pagi' : (h < 15 ? 'Selamat Siang' : (h < 18 ? 'Selamat Sore' : 'Selamat Malam'));
  }

  function skeleton(n) { return '<div class="grid g3">' + Array(n || 3).fill('<div class="skeleton"></div>').join('') + '</div>'; }

  return { icon, hydrateIcons, $, $$, esc, toast, loading, run, modal, confirm, initials, avatar, warnaNama, tgl, relatif, durasi, angka,
    JENIS, LEVEL, levelDari, badgeLevel, heat, bar, ring, lineChart, initFont, setFont, teksKaya, parseCSV, unduhTeks, keCSV,
    bacaBerkas, salin, pager, debounce, sapaan, skeleton };
})();
