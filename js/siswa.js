/* ============================================================
   SISWA — beranda, diagnostik, latihan, try out, hasil, rekomendasi
   Bahasa positif: tidak ada label yang merendahkan siswa (US-20).
   ============================================================ */
const Siswa = (() => {
  const { $, esc, icon } = UI;
  const NAV = [
    ['beranda', 'Beranda'], ['diagnostik', 'Tes Diagnostik'], ['harian', 'Latihan Harian'], ['bab', 'Latihan per Bab'],
    ['tryout', 'Evaluasi & Try Out'], ['hasil', 'Hasil & Progres'], ['rekomendasi', 'Rekomendasi']
  ];
  const main = () => $('#s-main');

  function render(page) {
    $('#s-nav').innerHTML = NAV.map(n => '<a href="#/s/' + n[0] + '" class="' + (n[0] === page ? 'on' : '') + '">' + n[1] + '</a>').join('');
    const el = $('#s-nav a.on'); if (el) el.scrollIntoView({ block: 'nearest', inline: 'center' });
    main().innerHTML = UI.skeleton(3);
    const fn = { beranda, diagnostik, harian, bab, tryout, hasil, rekomendasi }[page] || beranda;
    fn().catch(e => { main().innerHTML = errorBox(e.message); });
  }

  function errorBox(msg) {
    return '<div class="card center" style="padding:2.5rem">' + icon('alert') + '<h3 class="mt-1">Data belum bisa dimuat</h3><p class="muted mt-1">' + esc(msg) + '</p><button class="btn btn-primary mt-2" onclick="App.route()">' + icon('refresh') + 'Coba lagi</button></div>';
  }

  const head = (judul, sub, kanan) => '<div class="page-head"><div><h1>' + judul + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (kanan || '') + '</div>';

  function kartuPaket(p) {
    const ikon = { diagnostik: 'target', tryout: 'timer', evaluasi: 'clipboard', latihan: 'book' }[p.jenis] || 'book';
    const status = p.status_saya === 'selesai' ? '<span class="chip chip-green">' + icon('check') + 'Selesai • Nilai ' + UI.angka(p.nilai_terakhir) + '</span>'
      : (p.status_saya === 'berlangsung' ? '<span class="chip chip-amber">' + icon('clock') + 'Sedang dikerjakan</span>' : '<span class="chip chip-outline">Belum dikerjakan</span>');
    let aksi;
    if (p.alasan_tutup) aksi = '<button class="btn" disabled>' + icon('lock') + esc(p.alasan_tutup) + '</button>';
    else if (p.status_saya === 'selesai' && p.sekali_kerjakan) aksi = p.bisa_review ? '<button class="btn btn-outline" data-review="' + esc(p.id_pengerjaan_terakhir) + '">' + icon('eye') + 'Lihat Pembahasan</button>' : '<span class="muted small">Sudah dikumpulkan</span>';
    else aksi = '<a class="btn btn-primary" href="#/ujian/' + encodeURIComponent(p.id_paket) + '">' + icon('play') + (p.status_saya === 'berlangsung' ? 'Lanjutkan' : (p.status_saya === 'selesai' ? 'Kerjakan lagi' : 'Mulai')) + '</a>';
    return '<div class="card pkg-card"><div class="row"><div class="icon-bubble">' + icon(ikon) + '</div><div class="grow"><div class="xs muted">' + esc(UI.JENIS[p.jenis]) + '</div><h3 style="font-size:1.05rem">' + esc(p.judul) + '</h3></div></div>' +
      '<div class="meta"><span class="chip chip-outline">' + icon('list') + p.jumlah_soal + ' soal</span>' + (p.durasi_menit ? '<span class="chip chip-outline">' + icon('timer') + p.durasi_menit + ' menit</span>' : '<span class="chip chip-outline">Tanpa batas waktu</span>') +
      (p.sekali_kerjakan ? '<span class="chip chip-outline">1× pengerjaan</span>' : '') + (p.tutup_pada ? '<span class="chip chip-outline">Tutup ' + UI.tgl(p.tutup_pada, true) + '</span>' : '') + '</div>' +
      '<div class="row between wrap">' + status + aksi + '</div></div>';
  }

  function pasangReview(root) {
    root.querySelectorAll('[data-review]').forEach(b => b.onclick = () => Ujian.review(b.dataset.review));
  }

  // ---------------- BERANDA (US-03) ----------------
  async function beranda() {
    const d = await API.call('siswaBeranda');
    const nama = d.user.nama.split(' ')[0];
    const steps = d.langkah.map((l, i) => {
      const cls = l.selesai ? 'done' : (l.kode === d.tahap_aktif ? 'now' : '');
      return '<div class="step ' + cls + '"><span class="n">' + (l.selesai ? icon('check') : i + 1) + '</span><div><b>' + esc(l.judul) + '</b>' + (l.selesai ? 'Selesai' : (l.info || (cls ? 'Sekarang' : 'Berikutnya'))) + '</div></div>';
    }).join('');
    const aktivitas = d.aktivitas.length ? d.aktivitas.map(p => '<a class="act-card" href="#/ujian/' + encodeURIComponent(p.id_paket) + '" style="text-decoration:none;color:inherit"><div class="icon-bubble">' + icon({ diagnostik: 'target', tryout: 'timer', evaluasi: 'clipboard' }[p.jenis] || 'book') + '</div><div class="grow"><div class="xs muted">' + esc(UI.JENIS[p.jenis]) + (p.durasi_menit ? ' • ' + p.durasi_menit + ' menit' : '') + '</div><h3>' + esc(p.judul) + '</h3><div class="small muted">' + p.jumlah_soal + ' soal' + (p.status_saya === 'berlangsung' ? ' • <b style="color:var(--warn-dark)">lanjutkan</b>' : '') + '</div></div>' + icon('chevron-right') + '</a>').join('')
      : '<div class="note-card">Semua tugas dari guru sudah kamu kerjakan. Hebat! Lanjutkan dengan latihan harian ya.</div>';

    const rek = d.rekomendasi.length ? d.rekomendasi.map(r => '<div class="interv"><b>' + esc(r.nama_kompetensi) + '</b><span class="muted small">' + esc(r.alasan) + '</span><a class="small bold" href="#/ujian/bab-' + encodeURIComponent(r.id_kompetensi) + '">Latih sekarang →</a></div>').join('')
      : '<p class="muted small">Rekomendasi akan muncul setelah kamu mengerjakan tes diagnostik.</p>';

    main().innerHTML =
      '<div class="welcome"><div><div class="xs" style="opacity:.85;font-weight:600">' + esc(UI.sapaan()).toUpperCase() + '</div><h1>Halo, ' + esc(nama) + '! Siap belajar hari ini?</h1>' +
        '<p>Tahap kamu sekarang: <b>' + esc((d.langkah.find(l => l.kode === d.tahap_aktif) || {}).judul || '-') + '</b>. Selesaikan langkah demi langkah ya.</p><div class="steps">' + steps + '</div></div>' +
        UI.ring(d.progres, { label: 'PROGRES', warna: '#fff', track: 'rgba(255,255,255,.25)' }) + '</div>' +
      '<div class="grid g3 mt-3">' +
        '<div class="card" style="grid-column:span 2"><div class="card-head"><div><div class="card-title">Langkah berikutnya</div><div class="muted small">Tugas dari guru untukmu</div></div></div><div class="stack">' + aktivitas + '</div>' +
          '<a class="act-card mt-2" href="#/ujian/harian" style="text-decoration:none;color:inherit;background:var(--sky)"><div class="icon-bubble green">' + icon('sparkles') + '</div><div class="grow"><h3>Latihan untuk Kamu</h3><div class="small muted">10 soal pilihan yang disesuaikan dengan kemampuanmu</div></div><span class="btn btn-primary">Mulai</span></a>' +
        '</div>' +
        '<div class="card"><div class="card-head"><div><div class="card-title">Rata-rata Penguasaan</div><div class="muted small">Target ' + d.target + '%</div></div><div class="icon-bubble">' + icon('target') + '</div></div>' +
          '<div class="stat-num blue">' + (d.rata_penguasaan === null ? '–' : d.rata_penguasaan + '%') + '</div><div class="mt-1">' + UI.bar(d.rata_penguasaan || 0, d.target, 55, { lg: true, mark: d.target }) + '</div>' +
          '<div class="mt-2"><div class="small bold mb-1">' + icon('award') + ' Kekuatanmu</div>' + (d.kekuatan.length ? d.kekuatan.map(k => '<span class="chip chip-green" style="margin:0 .3rem .3rem 0">' + esc(k.nama_kompetensi) + '</span>').join('') : '<span class="muted small">Terus berlatih, kekuatanmu akan muncul di sini!</span>') + '</div>' +
          '<div class="mt-2"><div class="small bold mb-1">' + icon('flag') + ' Ayo latih lagi</div>' + (d.perlu_latihan.length ? d.perlu_latihan.map(k => '<a class="chip chip-amber" style="margin:0 .3rem .3rem 0" href="#/ujian/bab-' + encodeURIComponent(k.id_kompetensi) + '">' + esc(k.nama_kompetensi) + ' • ' + k.persen + '%</a>').join('') : '<span class="muted small">-</span>') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="grid g2 mt-3">' +
        '<div class="card"><div class="card-title mb-2">Perkembangan nilaimu</div>' + UI.lineChart(d.riwayat.map((r, i) => ({ label: UI.JENIS[r.jenis] ? UI.JENIS[r.jenis].replace('Latihan ', '') : r.jenis, value: r.skor, jenis: r.jenis })), { kktp: d.target }) + '</div>' +
        '<div class="card"><div class="card-title mb-2">Rekomendasi belajar</div><div class="stack">' + rek + '</div>' +
          (d.catatan.length ? '<div class="card-title mt-3 mb-1">Pesan dari guru</div><div class="stack">' + d.catatan.map(c => '<div class="note-card">' + esc(c.catatan) + '<div class="xs muted mt-1">' + UI.tgl(c.tanggal) + '</div></div>').join('') + '</div>' : '') +
        '</div>' +
      '</div>';
  }

  // ---------------- DIAGNOSTIK (US-04) ----------------
  async function diagnostik() {
    const list = await API.call('daftarPaketSiswa', { jenis: 'diagnostik' });
    main().innerHTML = head('Tes Diagnostik', 'Tes ini membantu guru mengenal kemampuan awalmu. Tidak perlu tegang — kerjakan sesuai yang kamu tahu ya!') +
      (list.length ? '<div class="grid g3">' + list.map(kartuPaket).join('') + '</div>' : '<div class="card empty">' + icon('target') + '<div>Belum ada tes diagnostik dari guru.</div></div>');
    pasangReview(main());
  }

  // ---------------- LATIHAN HARIAN (US-05) ----------------
  async function harian() {
    const list = await API.call('daftarPaketSiswa', { jenis: 'latihan' });
    main().innerHTML = head('Belajar & Latihan Harian', 'Latihan singkat setiap hari membuatmu makin siap.') +
      '<div class="welcome" style="grid-template-columns:1fr auto"><div><h1>Latihan untuk Kamu</h1><p>Soal dipilih otomatis dari kompetensi yang paling perlu kamu latih, dengan tingkat kesulitan yang pas. Kamu bisa langsung melihat pembahasan setiap soal.</p></div><a class="btn btn-white btn-lg" href="#/ujian/harian">' + icon('sparkles') + 'Mulai Latihan</a></div>' +
      '<h2 class="mt-3 mb-2" style="font-size:1.2rem">Latihan dari guru</h2>' +
      (list.length ? '<div class="grid g3">' + list.map(kartuPaket).join('') + '</div>' : '<div class="card empty">' + icon('book') + '<div>Belum ada paket latihan dari guru.</div></div>');
    pasangReview(main());
  }

  // ---------------- PER BAB (US-06) ----------------
  async function bab() {
    const list = await API.call('daftarKompetensiSiswa');
    const per = {};
    list.forEach(k => { (per[k.nama_mapel] = per[k.nama_mapel] || []).push(k); });
    main().innerHTML = head('Latihan per Bab / Kompetensi', 'Pilih bab yang ingin kamu latih. Soal disusun dari yang mudah ke yang lebih menantang.') +
      (list.length ? Object.keys(per).map(m => '<h2 class="mb-2 mt-2" style="font-size:1.15rem">' + esc(m) + '</h2><div class="grid g3">' + per[m].map(k =>
        '<div class="comp-card"><div class="xs muted">' + esc(k.bab) + '</div><h3>' + esc(k.nama_kompetensi) + '</h3>' +
        (k.persen === null ? '<span class="muted small">Belum pernah dicoba</span>' : '<div class="row small between"><span>Penguasaan</span><b>' + k.persen + '%</b></div>' + UI.bar(k.persen)) +
        '<div class="row between mt-1"><span class="chip chip-outline">' + k.jumlah_soal + ' soal</span><a class="btn btn-primary btn-sm" href="#/ujian/bab-' + encodeURIComponent(k.id_kompetensi) + '">' + icon('play') + 'Latih</a></div></div>').join('') + '</div>').join('')
        : '<div class="card empty">' + icon('book') + '<div>Bank soal masih kosong.</div></div>');
  }

  // ---------------- TRY OUT (US-07) ----------------
  async function tryout() {
    const list = await API.call('daftarPaketSiswa', { jenis: ['evaluasi', 'tryout'] });
    main().innerHTML = head('Evaluasi & Try Out', 'Simulasi TKA dengan batas waktu. Waktu dihitung oleh server — jawaban tersimpan otomatis dan dikumpulkan saat waktu habis.') +
      '<div class="note-card mb-2">' + icon('bulb') + ' Tips: kerjakan soal yang mudah dulu, tandai <b>Ragu-ragu</b> untuk soal yang ingin kamu periksa lagi.</div>' +
      (list.length ? '<div class="grid g3">' + list.map(kartuPaket).join('') + '</div>' : '<div class="card empty">' + icon('timer') + '<div>Belum ada Try Out yang dibuka.</div></div>');
    pasangReview(main());
  }

  // ---------------- HASIL (US-08) ----------------
  async function hasil() {
    const d = await API.call('hasilSaya');
    const per = {};
    d.penguasaan.forEach(k => { (per[k.nama_mapel] = per[k.nama_mapel] || []).push(k); });
    main().innerHTML = head('Hasil & Progres', 'Lihat perkembanganmu dari diagnostik sampai try out.') +
      '<div class="grid g2"><div class="card"><div class="card-title mb-2">Grafik perkembangan nilai</div>' + UI.lineChart(d.riwayat.map(r => ({ label: UI.tgl(r.tanggal).replace(/ \d{4}$/, ''), value: r.skor, jenis: r.jenis })), { kktp: d.target }) +
        '<div class="legend mt-1"><span><i style="border-color:#7C3AED"></i>Diagnostik</span><span><i style="border-color:#1D63D3"></i>Latihan</span><span><i style="border-color:#F59E0B"></i>Evaluasi</span><span><i style="border-color:#EF4444"></i>Try Out</span></div></div>' +
        '<div class="card"><div class="card-title mb-2">Kekuatan &amp; yang perlu diperbaiki</div>' +
          '<div class="small bold mb-1" style="color:var(--success-dark)">' + icon('award') + ' Sudah kamu kuasai</div>' + (d.kekuatan.length ? d.kekuatan.map(k => '<span class="chip chip-green" style="margin:0 .3rem .3rem 0">' + esc(k.nama_kompetensi) + ' ' + k.persen + '%</span>').join('') : '<p class="muted small">Belum ada — terus semangat!</p>') +
          '<div class="small bold mb-1 mt-2" style="color:var(--warn-dark)">' + icon('flag') + ' Perlu dilatih lagi</div>' + (d.perlu_diperbaiki.length ? d.perlu_diperbaiki.map(k => '<a class="chip chip-amber" style="margin:0 .3rem .3rem 0" href="#/ujian/bab-' + encodeURIComponent(k.id_kompetensi) + '">' + esc(k.nama_kompetensi) + ' ' + k.persen + '%</a>').join('') : '<p class="muted small">Tidak ada. Luar biasa!</p>') +
        '</div></div>' +
      '<div class="card mt-3"><div class="card-title mb-2">Penguasaan per kompetensi</div>' + (d.penguasaan.length ? Object.keys(per).map(m => '<div class="small bold muted mt-1 mb-1">' + esc(m) + '</div>' + per[m].map(k =>
        '<div class="mastery-row"><div><b class="small">' + esc(k.nama_kompetensi) + '</b><div class="mt-1">' + UI.bar(k.persen, d.target, d.batas_bawah, { mark: d.target }) + '</div></div><div class="row">' + UI.badgeLevel(k.level) + '<b>' + k.persen + '%</b></div></div>').join('')).join('') : '<p class="muted">Belum ada data.</p>') + '</div>' +
      '<div class="card mt-3"><div class="card-title mb-2">Riwayat pengerjaan</div>' + (d.pengerjaan.length ? '<div class="table-wrap" style="box-shadow:none"><table class="tbl"><thead><tr><th>Tanggal</th><th>Paket</th><th>Jenis</th><th class="num">Nilai</th><th></th></tr></thead><tbody>' +
        d.pengerjaan.map(p => '<tr><td class="nowrap">' + UI.tgl(p.waktu_selesai, true) + '</td><td>' + esc(p.judul) + '</td><td><span class="chip chip-outline">' + esc(UI.JENIS[p.jenis] || p.jenis) + '</span></td><td class="num bold">' + UI.angka(p.nilai) + '</td><td>' + (p.bisa_review ? '<button class="btn btn-sm" data-review="' + esc(p.id_pengerjaan) + '">' + icon('eye') + 'Pembahasan</button>' : '') + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">Belum ada pengerjaan.</p>') + '</div>';
    pasangReview(main());
  }

  // ---------------- REKOMENDASI (US-09) ----------------
  async function rekomendasi() {
    const list = await API.call('rekomendasiSaya');
    const aktif = list.filter(r => r.status !== 'selesai'), selesai = list.filter(r => r.status === 'selesai');
    const kartu = r => '<div class="card pkg-card"><div class="row"><div class="icon-bubble ' + (r.sumber === 'guru' ? 'amber' : '') + '">' + icon(r.sumber === 'guru' ? 'user' : 'sparkles') + '</div><div class="grow"><div class="xs muted">' + (r.sumber === 'guru' ? 'Dari guru' : 'Rekomendasi otomatis') + (r.persen !== null ? ' • penguasaan ' + r.persen + '%' : '') + '</div><h3 style="font-size:1.02rem">' + esc(r.nama_kompetensi) + '</h3></div>' + (r.status === 'baru' ? '<span class="chip">Baru</span>' : '') + '</div>' +
      '<p class="small">' + esc(r.alasan) + '</p>' +
      (r.materi ? '<div class="note-card small"><b>' + icon('book') + ' ' + esc(r.materi.judul) + '</b>' + (r.materi.deskripsi ? '<div class="mt-1">' + esc(r.materi.deskripsi) + '</div>' : '') + (r.materi.url ? '<a class="btn btn-sm btn-outline mt-1" target="_blank" rel="noopener" href="' + esc(r.materi.url) + '">' + icon('link') + 'Buka materi</a>' : '') + '</div>' : '') +
      '<div class="row wrap"><a class="btn btn-primary btn-sm" href="#/ujian/bab-' + encodeURIComponent(r.id_kompetensi) + '">' + icon('play') + 'Latih sekarang</a>' + (r.status !== 'selesai' ? '<button class="btn btn-sm" data-selesai="' + esc(r.id_rekomendasi) + '">' + icon('check') + 'Tandai selesai</button>' : '') + '</div></div>';
    main().innerHTML = head('Rekomendasi Belajar', 'Daftar materi dan kompetensi yang sebaiknya kamu latih berikutnya, lengkap dengan alasannya.') +
      (aktif.length ? '<div class="grid g3">' + aktif.map(kartu).join('') + '</div>' : '<div class="card empty">' + icon('award') + '<div>Tidak ada rekomendasi aktif. Kerjakan diagnostik atau latihan untuk mendapatkan saran belajar.</div></div>') +
      (selesai.length ? '<h2 class="mt-3 mb-2" style="font-size:1.1rem">Sudah selesai</h2><div class="grid g3">' + selesai.map(kartu).join('') + '</div>' : '');
    main().querySelectorAll('[data-selesai]').forEach(b => b.onclick = async () => {
      if (await UI.run(() => API.call('tandaiRekomendasi', { id_rekomendasi: b.dataset.selesai, status: 'selesai' }))) { UI.toast('Mantap! Rekomendasi ditandai selesai.', 'success'); rekomendasi(); }
    });
    // Tandai yang baru sebagai "dilihat" (tanpa menunggu)
    aktif.filter(r => r.status === 'baru').forEach(r => API.call('tandaiRekomendasi', { id_rekomendasi: r.id_rekomendasi, status: 'dilihat' }).catch(() => {}));
  }

  return { render };
})();
window.Siswa = Siswa;
