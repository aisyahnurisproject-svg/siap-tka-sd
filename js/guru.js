/* ============================================================
   GURU — dashboard, analisis, data siswa, bank soal, paket,
   diferensiasi, laporan, pengaturan
   ============================================================ */
const Guru = (() => {
  const { $, $$, esc, icon } = UI;
  let META = null, BANK = null;
  let kelasAktif = null, mapelAktif = '';
  try { kelasAktif = localStorage.getItem('siaptka_kelas'); } catch (e) { /* abaikan */ }

  const NAV = [
    ['#', 'Ringkasan'], ['dashboard', 'Dashboard Guru', 'grid'], ['analisis-kelas', 'Analisis Kelas', 'chart'], ['analisis-siswa', 'Analisis Siswa', 'user'],
    ['#', 'Kelola'], ['siswa', 'Data Siswa', 'users'], ['bank', 'Bank Soal & Materi', 'database'], ['latihan', 'Paket Latihan', 'book'],
    ['diagnostik', 'Diagnostik', 'target'], ['tryout', 'Try Out & Evaluasi', 'timer'], ['diferensiasi', 'Diferensiasi', 'split'],
    ['#', 'Lainnya'], ['laporan', 'Laporan PDF', 'file'], ['pengaturan', 'Pengaturan', 'sliders']
  ];
  const main = () => $('#g-main');

  // ---------------- Shell ----------------
  let shellSiap = false;
  function shell() {
    if (shellSiap) return;
    shellSiap = true;
    $('#g-menu').onclick = () => toggleSide(true);
    $('#g-sync').onclick = async () => { META = null; BANK = null; await App.route(); UI.toast('Data dimuat ulang dari Google Sheets.', 'success'); };
  }
  function toggleSide(buka) {
    $('#g-side').classList.toggle('open', buka);
    const ada = $('.g-backdrop');
    if (buka && !ada) { const b = document.createElement('div'); b.className = 'g-backdrop'; b.onclick = () => toggleSide(false); document.body.appendChild(b); }
    if (!buka && ada) ada.remove();
  }

  async function meta(paksa) {
    if (!META || paksa) META = await API.call('guruMeta');
    if (!META.kelas.some(k => k.id_kelas === kelasAktif)) kelasAktif = META.kelas.length ? META.kelas[0].id_kelas : null;
    return META;
  }
  async function bank(paksa) { if (!BANK || paksa) BANK = await API.call('listSoal'); return BANK; }

  function render(page, args) {
    shell();
    toggleSide(false);
    $('#g-nav').innerHTML = NAV.map(n => n[0] === '#' ? '<div class="sec">' + n[1] + '</div>' : '<a href="#/g/' + n[0] + '" class="' + (n[0] === page ? 'on' : '') + '">' + icon(n[2]) + n[1] + '</a>').join('');
    main().innerHTML = UI.skeleton(4);
    const fn = PAGES[page] || PAGES.dashboard;
    Promise.resolve().then(() => fn(args || [])).catch(e => {
      main().innerHTML = '<div class="card center" style="padding:2.5rem">' + icon('alert') + '<h3 class="mt-1">Data belum bisa dimuat</h3><p class="muted mt-1">' + esc(e.message) + '</p><button class="btn btn-primary mt-2" onclick="App.route()">' + icon('refresh') + 'Coba lagi</button></div>';
    });
  }
  const ulang = () => App.route();

  // ---------------- Helper tampilan ----------------
  function head(crumb, judul, desc, tombol) {
    return '<div class="panel-head"><div><div class="crumb">Panel Pendidik ' + icon('chevron-right') + ' <b>' + esc(crumb) + '</b></div><h1>' + judul + '</h1>' + (desc ? '<p>' + desc + '</p>' : '') + '</div>' +
      (tombol ? '<div class="row wrap" style="max-width:520px;justify-content:flex-end">' + tombol + '</div>' : '') + '</div>';
  }
  function selKelas(id) {
    return '<label class="sel-pill">' + icon('graduation') + '<span class="muted">Kelas:</span><select id="' + (id || 'sel-kelas') + '">' +
      (META.kelas.length ? META.kelas.map(k => '<option value="' + esc(k.id_kelas) + '"' + (k.id_kelas === kelasAktif ? ' selected' : '') + '>' + esc(k.nama_kelas) + '</option>').join('') : '<option value="">Belum ada kelas</option>') + '</select></label>';
  }
  function selMapel(id, semua) {
    return '<label class="sel-pill">' + icon('book') + '<span class="muted">Mapel:</span><select id="' + (id || 'sel-mapel') + '"><option value="">' + (semua || 'Semua mapel') + '</option>' +
      META.mapel.map(m => '<option value="' + esc(m.id_mapel) + '"' + (m.id_mapel === mapelAktif ? ' selected' : '') + '>' + esc(m.nama_mapel) + '</option>').join('') + '</select></label>';
  }
  function pasangSel(cb) {
    const k = $('#sel-kelas'); if (k) k.onchange = () => { kelasAktif = k.value; try { localStorage.setItem('siaptka_kelas', kelasAktif); } catch (e) { /* abaikan */ } cb(); };
    const m = $('#sel-mapel'); if (m) m.onchange = () => { mapelAktif = m.value; cb(); };
  }
  const optMapel = sel => META.mapel.map(m => '<option value="' + esc(m.id_mapel) + '"' + (m.id_mapel === sel ? ' selected' : '') + '>' + esc(m.nama_mapel) + '</option>').join('');
  const optKomp = (sel, idMapel) => META.kompetensi.filter(k => !idMapel || k.id_mapel === idMapel).map(k => '<option value="' + esc(k.id_kompetensi) + '"' + (k.id_kompetensi === sel ? ' selected' : '') + '>' + esc(k.nama_kompetensi) + '</option>').join('');
  const namaKomp = id => (META.kompetensi.find(k => k.id_kompetensi === id) || {}).nama_kompetensi || id;
  const namaMapel = id => (META.mapel.find(k => k.id_mapel === id) || {}).nama_mapel || '';
  const STATUS = {
    perlu_perhatian: ['chip-red', 'Perlu Bimbingan'], berkembang: ['chip-amber', 'Berkembang'], siap: ['chip-green', 'Siap / Mahir'], belum_mulai: ['chip-gray', 'Belum mulai']
  };
  const badgeStatus = s => '<span class="chip ' + STATUS[s][0] + '"><span class="dot"></span>' + STATUS[s][1] + '</span>';
  function tanpaKelas() {
    main().innerHTML = head('Mulai', 'Buat kelas pertama Anda', 'Anda belum memiliki kelas. Buat kelas terlebih dahulu, lalu tambahkan siswa.') +
      '<div class="card"><button class="btn btn-primary" id="btn-kelas-baru">' + icon('plus') + 'Buat Kelas</button></div>';
    $('#btn-kelas-baru').onclick = () => formKelas();
  }

  // ================= DASHBOARD (US-10) =================
  let filterDash = 'semua';
  async function dashboard() {
    await meta();
    if (!kelasAktif) return tanpaKelas();
    const d = await API.call('dashboard', { id_kelas: kelasAktif, id_mapel: mapelAktif });
    const r = d.ringkasan;
    const komp = d.kompetensi;
    const tab = (k, l, n) => '<button data-f="' + k + '" class="' + (filterDash === k ? 'on' : '') + '">' + l + ' (' + n + ')</button>';

    main().innerHTML =
      '<div class="toolbar"><div class="row wrap">' + selKelas() + selMapel('sel-mapel', 'Literasi & Numerasi') + '</div><div class="grow"></div>' +
        '<button class="btn btn-outline" id="btn-pdf">' + icon('download') + 'Unduh Laporan PDF</button><a class="btn btn-outline" href="#/g/diferensiasi">' + icon('split') + 'Atur Diferensiasi</a><button class="btn btn-primary" id="btn-tugas">' + icon('plus') + 'Tambah Tugas</button></div>' +
      '<div class="seg mb-2" id="tab-dash">' + tab('semua', 'Semua', r.jumlah_siswa) + tab('perlu_perhatian', 'Perlu Perhatian', r.perlu_perhatian) + tab('berkembang', 'Berkembang', r.berkembang) + tab('siap', 'Siap/Mahir', r.siap) + tab('belum_mulai', 'Belum mulai', r.belum_mulai) + '</div>' +
      '<div class="grid g3">' +
        // 1. Siapa belum siap
        '<div class="card"><div class="card-head"><div><span class="chip">TKA SD • US-10</span><div class="card-title mt-1">Tingkat Kesiapan Kelas</div></div><div class="icon-bubble">' + icon('shield') + '</div></div>' +
          '<div class="row" style="gap:1.2rem">' + UI.ring(r.rata_kelas, { label: 'PENGUASAAN', cls: 'ring-sm' }) + '<div class="stack grow" style="gap:.5rem">' +
            '<div class="row between chip-red" style="padding:.5rem .8rem;border-radius:.8rem"><span class="small">Perlu perhatian</span><b>' + r.perlu_perhatian + ' siswa</b></div>' +
            '<div class="row between chip-amber" style="padding:.5rem .8rem;border-radius:.8rem"><span class="small">Berkembang</span><b>' + r.berkembang + ' siswa</b></div>' +
            '<div class="row between chip-green" style="padding:.5rem .8rem;border-radius:.8rem"><span class="small">Siap / Mahir</span><b>' + r.siap + ' siswa</b></div></div></div>' +
          '<div class="card-sky card mt-2 row between small" style="padding:.7rem 1rem"><span>Target capaian sekolah: <b>≥ ' + d.kktp + '%</b></span><span>' + (r.belum_mulai ? '<b>' + r.belum_mulai + '</b> belum mulai' : 'Semua sudah mulai') + '</span></div></div>' +
        // 2. Kurang di mana
        '<div class="card"><div class="card-head"><div><span class="chip chip-red">Fokus Remedial</span><div class="card-title mt-1">Kompetensi Terlemah di Kelas</div></div><div class="icon-bubble red">' + icon('flag') + '</div></div>' +
          (d.terlemah.length ? d.terlemah.map((k, i) => '<div class="weak-item"><div class="row between"><span class="row"><span class="rk" style="background:' + ['#B91C1C', '#92400E', '#475569'][i] + '">' + (i + 1) + '</span><b>' + esc(k.nama_kompetensi) + '</b></span><span class="nowrap small bold" style="color:' + (k.rata < d.batas_bawah ? 'var(--danger-dark)' : 'var(--warn-dark)') + '">' + k.rata + '% rata-rata</span></div>' + UI.bar(k.rata, d.kktp, d.batas_bawah) + '<span class="xs muted">' + k.siswa_perlu.length + ' siswa di bawah target • ' + (k.persen_tuntas || 0) + '% tuntas</span></div>').join('')
            : '<div class="empty small">Belum ada hasil diagnostik/latihan di kelas ini.</div>') +
          '<div class="row between mt-1 small muted"><span>Tersinkron dari Google Sheets</span><a href="#/g/analisis-kelas" class="bold">Lihat analisis →</a></div></div>' +
        // 3. Belajar apa berikutnya
        '<div class="card"><div class="card-head"><div><span class="chip chip-green">Tindakan Cepat</span><div class="card-title mt-1">Rekomendasi Intervensi</div></div><div class="icon-bubble green">' + icon('sparkles') + '</div></div><div class="stack" style="gap:.6rem">' +
          (d.rekomendasi_intervensi.length ? d.rekomendasi_intervensi.map((x, i) => '<div class="interv"><div class="row between"><b>' + x.jumlah_siswa + ' siswa butuh penguatan ' + esc(x.nama_kompetensi) + '</b><span class="chip ' + (i ? 'chip-amber' : 'chip-red') + '">Prioritas ' + (i + 1) + '</span></div><span class="muted xs">' + esc(x.siswa.slice(0, 4).join(', ')) + (x.siswa.length > 4 ? ', +' + (x.siswa.length - 4) + ' lainnya' : '') + '</span>' + (x.materi ? '<span class="xs">Materi: <b>' + esc(x.materi.judul) + '</b></span>' : '') + '</div>').join('')
            : '<div class="empty small">Belum ada rekomendasi. Data muncul setelah siswa mengerjakan diagnostik.</div>') +
          (d.rekomendasi_intervensi.length ? '<button class="btn btn-success-dark btn-block" id="btn-tugaskan">' + icon('send') + 'Tugaskan Rekomendasi ke Siswa</button>' : '') + '</div></div>' +
      '</div>' +
      (d.sedang_ujian || d.paket_aktif.length ? '<div class="card mt-2"><div class="row wrap between"><div class="card-title">' + icon('activity') + ' Sesi Ujian Aktif</div><span class="chip ' + (d.sedang_ujian ? 'chip-amber' : 'chip-gray') + '">' + d.sedang_ujian + ' siswa sedang mengerjakan</span></div><div class="row wrap mt-1">' +
        d.paket_aktif.slice(0, 6).map(p => '<a class="chip chip-outline" href="#/g/' + (p.jenis === 'evaluasi' ? 'tryout' : p.jenis) + '">' + esc(p.judul) + ' • ' + p.selesai + '/' + r.jumlah_siswa + ' selesai' + (p.berlangsung ? ' • ' + p.berlangsung + ' berlangsung' : '') + '</a>').join('') + '</div></div>' : '') +
      '<div class="card mt-2" style="padding:0;overflow:hidden"><div class="row between wrap" style="padding:1.2rem 1.4rem"><div><div class="card-title" style="font-size:1.3rem">Matriks Kompetensi &amp; Diagnostik Siswa</div><div class="muted small">Klik nama siswa untuk melihat profil lengkap dan memberi catatan.</div></div>' +
        '<div class="row wrap small"><span class="chip lv-belum">Belum (&lt;' + d.batas_bawah + ')</span><span class="chip lv-berkembang">Berkembang</span><span class="chip lv-menguasai">Menguasai (≥' + d.kktp + ')</span><div class="input-icon" style="min-width:220px">' + icon('search') + '<input class="input" id="cari-dash" placeholder="Cari nama siswa…"></div></div></div>' +
        '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Nama Siswa</th><th class="num">Diagnostik Awal</th><th class="num">Try Out</th><th>Status Kesiapan</th>' + komp.map(k => '<th class="num" style="white-space:normal;min-width:110px">' + esc(k.nama_kompetensi) + '</th>').join('') + '</tr></thead><tbody id="tb-dash"></tbody></table></div></div>';

    const isi = () => {
      const q = ($('#cari-dash').value || '').toLowerCase();
      const rows = d.siswa.filter(s => (filterDash === 'semua' || s.status === filterDash) && (!q || s.nama.toLowerCase().includes(q)));
      $('#tb-dash').innerHTML = rows.length ? rows.map(s => '<tr class="clickable" data-u="' + esc(s.id_user) + '"><td><div class="person">' + UI.avatar(s.nama) + '<div><b>' + esc(s.nama) + '</b><span>NISN ' + esc(s.nisn || '-') + (s.kelompok ? ' • ' + esc(s.kelompok) : '') + '</span></div></div></td>' +
        '<td class="num bold">' + UI.angka(s.diagnostik) + '</td><td class="num bold" style="color:' + (s.tryout !== null && s.tryout < d.kktp ? 'var(--danger-dark)' : 'inherit') + '">' + UI.angka(s.tryout) + '</td><td>' + badgeStatus(s.status) + (s.sedang_ujian ? ' <span class="chip chip-amber">mengerjakan</span>' : '') + '</td>' +
        komp.map(k => '<td class="num">' + UI.heat(s.penguasaan[k.id_kompetensi], d.kktp, d.batas_bawah) + '</td>').join('') + '</tr>').join('')
        : '<tr><td colspan="' + (4 + komp.length) + '" class="empty">Tidak ada siswa pada filter ini.</td></tr>';
      $$('#tb-dash [data-u]').forEach(tr => tr.onclick = () => { location.hash = '#/g/analisis-siswa/' + tr.dataset.u; });
    };
    isi();
    $('#cari-dash').oninput = UI.debounce(isi, 150);
    $$('#tab-dash button').forEach(b => b.onclick = () => { filterDash = b.dataset.f; $$('#tab-dash button').forEach(x => x.classList.toggle('on', x === b)); isi(); });
    pasangSel(dashboard);
    $('#btn-pdf').onclick = () => buatPdf('laporanKelas', { id_kelas: kelasAktif, id_mapel: mapelAktif });
    $('#btn-tugas').onclick = () => editPaket(null, 'latihan');
    if ($('#btn-tugaskan')) $('#btn-tugaskan').onclick = async () => {
      const total = d.rekomendasi_intervensi.reduce((a, x) => a + x.jumlah_siswa, 0);
      if (!(await UI.confirm('Tugaskan rekomendasi?', 'Sebanyak <b>' + total + '</b> rekomendasi belajar akan muncul di halaman siswa terkait, lengkap dengan materi dan tombol latihan per kompetensi.'))) return;
      await UI.run(async () => {
        for (const x of d.rekomendasi_intervensi) await API.call('tambahRekomendasi', { id_user: x.id_siswa, id_kompetensi: x.id_kompetensi, alasan: 'Guru menugaskan penguatan ' + x.nama_kompetensi + '. Kerjakan latihan per bab ini ya!' });
        UI.toast('Rekomendasi berhasil dikirim ke siswa.', 'success');
      });
    };
  }

  async function buatPdf(aksi, data) {
    UI.toast('Membuat PDF… (5–20 detik)');
    const r = await UI.run(() => API.call(aksi, data));
    if (!r) return;
    UI.modal({ title: 'Laporan PDF siap', body: '<div class="row">' + '<div class="icon-bubble green">' + icon('check-circle') + '</div><div><b>' + esc(r.nama) + '</b><div class="muted small">Tersimpan di Google Drive • folder TKA-SD/Laporan-PDF</div></div></div>',
      foot: '<a class="btn" target="_blank" rel="noopener" href="' + esc(r.url) + '">' + icon('eye') + 'Buka</a><a class="btn btn-primary" target="_blank" rel="noopener" href="' + esc(r.unduh) + '">' + icon('download') + 'Unduh PDF</a>' });
  }

  // ================= ANALISIS KELAS (US-18) =================
  let filterAK = 'semua', urutAK = 'nama';
  async function analisisKelas() {
    await meta();
    if (!kelasAktif) return tanpaKelas();
    const d = await API.call('analisisKelas', { id_kelas: kelasAktif, id_mapel: mapelAktif });
    const r = d.ringkasan, n = Math.max(r.jumlah_siswa, 1);
    const kritis = d.terlemah[0];
    const kelompokKartu = (st, judul, warna, ket) => {
      const ss = d.siswa.filter(s => s.status === st);
      return '<div class="kcol ' + warna + '"><div class="row between"><span class="chip ' + STATUS[st][0] + '">' + judul + '</span><b style="font-size:1.3rem">' + ss.length + ' Siswa</b></div><div class="small">' + ket + '</div>' +
        '<div class="small muted">' + (ss.length ? esc(ss.slice(0, 6).map(s => s.nama).join(', ')) + (ss.length > 6 ? ', +' + (ss.length - 6) + ' lainnya' : '') : 'Tidak ada siswa.') + '</div></div>';
    };
    main().innerHTML = head('Analisis Kelas', 'Analisis Penguasaan Kelas', 'Evaluasi kesiapan kelas, distribusi kompetensi, dan pemetaan diferensiasi belajar ' + esc(d.kelas.nama_kelas) + ' (' + r.jumlah_siswa + ' siswa).',
        '<button class="btn btn-outline" id="btn-csv">' + icon('download') + 'Unduh Rekap CSV</button><button class="btn btn-primary" id="btn-pdf">' + icon('printer') + 'Cetak Laporan PDF Kelas</button>') +
      '<div class="toolbar">' + selKelas() + selMapel() + '</div>' +
      '<div class="grid g4">' +
        '<div class="card"><div class="row between"><span class="stat-label">Rata-rata penguasaan</span><div class="icon-bubble">' + icon('target') + '</div></div><div class="stat-num">' + UI.angka(r.rata_kelas) + '<span class="small muted">/100</span></div><div class="small muted mt-1">Diagnostik ' + UI.angka(r.rata_diagnostik) + ' → terakhir ' + UI.angka(r.rata_terakhir) + '</div></div>' +
        '<div class="card"><div class="row between"><span class="stat-label">Distribusi kesiapan</span><div class="icon-bubble">' + icon('users') + '</div></div><div class="stat-num" style="font-size:1.4rem">' + r.jumlah_siswa + ' Peserta Didik</div>' +
          '<div class="bar lg mt-1" style="display:flex"><i class="c-belum" style="width:' + 100 * r.perlu_perhatian / n + '%;border-radius:0"></i><i class="c-berkembang" style="width:' + 100 * r.berkembang / n + '%;border-radius:0"></i><i class="c-menguasai" style="width:' + 100 * r.siap / n + '%;border-radius:0"></i></div>' +
          '<div class="xs muted mt-1">' + r.perlu_perhatian + ' remedi • ' + r.berkembang + ' cakap • ' + r.siap + ' mahir • ' + r.belum_mulai + ' belum mulai</div></div>' +
        '<div class="card"><div class="row between"><span class="stat-label">Tingkat ketuntasan</span><div class="icon-bubble green">' + icon('check-circle') + '</div></div><div class="stat-num">' + UI.angka(r.ketuntasan, '%') + '</div><div class="mt-1">' + UI.bar(r.ketuntasan || 0, 75, 55, { mark: d.kktp }) + '</div><div class="xs muted mt-1">dari target ' + d.kktp + '% per siswa</div></div>' +
        '<div class="card" style="background:#FFF6F6"><div class="row between"><span class="stat-label" style="color:var(--danger-dark)">Kompetensi paling kritis</span><div class="icon-bubble red">' + icon('alert') + '</div></div><div class="bold mt-1" style="font-size:1.15rem">' + esc(kritis ? kritis.nama_kompetensi : '-') + '</div>' + (kritis ? '<div class="row wrap mt-1"><span class="small">Rata-rata ' + kritis.rata + '%</span><span class="chip chip-red">' + kritis.siswa_perlu.length + ' perlu remedi</span></div>' : '') + '</div>' +
      '</div>' +
      '<div class="card mt-2"><div class="row between wrap mb-2"><div><div class="card-title">Peta Penguasaan Kompetensi ' + esc(d.kelas.nama_kelas) + '</div><div class="muted small">Rata-rata pemahaman per kompetensi berdasarkan capaian kumulatif butir soal.</div></div><span class="small muted">│ Garis = target sekolah (' + d.kktp + '%)</span></div>' +
        d.kompetensi.map(k => '<div class="mastery-row ' + (k.rata !== null && k.rata < d.batas_bawah ? 'crit' : '') + '"><div><div class="row small"><span class="chip ' + (k.id_mapel === 'MP-BIN' ? '' : 'chip-outline') + '" style="font-size:.66rem">' + esc(namaMapel(k.id_mapel).toUpperCase()) + '</span><b>' + esc(k.nama_kompetensi) + '</b></div><div class="mt-1">' + UI.bar(k.rata || 0, d.kktp, d.batas_bawah, { lg: true, mark: d.kktp }) + '</div></div>' +
          '<div style="text-align:right"><span class="chip lv-' + UI.levelDari(k.rata, d.kktp, d.batas_bawah) + '">' + (k.rata === null ? 'Belum ada data' : k.rata + '% ' + UI.LEVEL[UI.levelDari(k.rata, d.kktp, d.batas_bawah)]) + '</span><div class="xs muted mt-1">' + k.siswa_perlu.length + ' siswa remedi</div></div></div>').join('') + '</div>' +
      '<div class="card mt-2"><div class="row between wrap mb-2"><div><div class="xs bold" style="color:var(--primary)">' + icon('sparkles') + ' PEMETAAN ADAPTIF (US-20)</div><div class="card-title">Kelompok Diferensiasi Pembelajaran</div><div class="muted small">Dikelompokkan otomatis dari rata-rata penguasaan kompetensi.</div></div><a class="btn btn-success-dark" href="#/g/diferensiasi">' + icon('split') + 'Atur Kelompok &amp; Paket</a></div>' +
        '<div class="kanban">' + kelompokKartu('perlu_perhatian', 'Kelompok Intervensi', 'red', 'Butuh peragaan konsep, bimbingan intensif, dan latihan bergradasi mudah.') + kelompokKartu('berkembang', 'Kelompok Cakap', 'amber', 'Perlu penguatan penalaran dan soal cerita dua langkah.') + kelompokKartu('siap', 'Kelompok Mahir', 'green', 'Siap tantangan soal HOTS dan simulasi Try Out.') + '</div></div>' +
      '<div class="card mt-2" style="padding:0;overflow:hidden"><div class="row between wrap" style="padding:1.2rem 1.4rem"><div><div class="card-title">Matriks Analisis Capaian Setiap Siswa</div><div class="muted small">Perbandingan diagnostik, nilai terkini, pertumbuhan, dan peta kompetensi.</div></div>' +
        '<div class="row wrap"><div class="seg" id="tab-ak">' + ['semua', 'perlu_perhatian', 'berkembang', 'siap'].map(k => '<button data-f="' + k + '" class="' + (filterAK === k ? 'on' : '') + '">' + (k === 'semua' ? 'Semua' : STATUS[k][1]) + '</button>').join('') + '</div>' +
        '<label class="sel-pill"><span class="muted">Urut:</span><select id="urut-ak"><option value="nama">Nama</option><option value="nilai"' + (urutAK === 'nilai' ? ' selected' : '') + '>Ranking nilai</option><option value="tumbuh"' + (urutAK === 'tumbuh' ? ' selected' : '') + '>Pertumbuhan</option></select></label></div></div>' +
        '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>#</th><th>Nama Siswa</th><th class="num">Diagnostik</th><th class="num">Terakhir</th><th class="num">Pertumbuhan</th><th>Status</th><th>Peta Kompetensi</th><th></th></tr></thead><tbody id="tb-ak"></tbody></table></div>' +
        '<div class="legend" style="padding:.8rem 1.4rem;background:var(--sky)"><span><i style="background:var(--success);border-color:var(--success)"></i>≥' + d.kktp + '% (tuntas)</span><span><i style="background:var(--doubt);border-color:var(--doubt)"></i>' + d.batas_bawah + '–' + (d.kktp - 1) + '% (cakap)</span><span><i style="background:var(--danger);border-color:var(--danger)"></i>&lt;' + d.batas_bawah + '% (kritis)</span></div></div>';

    const isi = () => {
      let rows = d.siswa.filter(s => filterAK === 'semua' || s.status === filterAK);
      if (urutAK === 'nama') rows.sort((a, b) => a.nama.localeCompare(b.nama));
      if (urutAK === 'nilai') rows.sort((a, b) => (b.nilai_terakhir || -1) - (a.nilai_terakhir || -1));
      if (urutAK === 'tumbuh') rows.sort((a, b) => (b.pertumbuhan || -999) - (a.pertumbuhan || -999));
      $('#tb-ak').innerHTML = rows.map((s, i) => '<tr><td class="muted">' + (i + 1) + '</td><td><div class="person">' + UI.avatar(s.nama) + '<div><b>' + esc(s.nama) + '</b><span>NISN ' + esc(s.nisn || '-') + '</span></div></div></td>' +
        '<td class="num">' + UI.angka(s.diagnostik) + '</td><td class="num bold">' + UI.angka(s.nilai_terakhir) + '</td><td class="num">' + (s.pertumbuhan === null ? '-' : '<span class="chip ' + (s.pertumbuhan >= 0 ? 'chip-green' : 'chip-red') + '">' + (s.pertumbuhan >= 0 ? '+' : '') + s.pertumbuhan + '</span>') + '</td>' +
        '<td>' + badgeStatus(s.status) + '</td><td><div class="row" style="gap:.25rem">' + d.kompetensi.map(k => { const p = s.penguasaan[k.id_kompetensi]; const lv = UI.levelDari(p, d.kktp, d.batas_bawah); return '<span title="' + esc(k.nama_kompetensi) + '" class="chip lv-' + lv + '" style="padding:.15rem .4rem;font-size:.68rem;min-width:30px;justify-content:center">' + (p === undefined ? '–' : Math.round(p)) + '</span>'; }).join('') + '</div></td>' +
        '<td><a class="btn btn-sm ' + (s.status === 'perlu_perhatian' ? 'btn-primary' : '') + '" href="#/g/analisis-siswa/' + esc(s.id_user) + '">' + (s.status === 'perlu_perhatian' ? 'Beri Remedi' : (s.status === 'siap' ? 'Pengayaan' : 'Catatan')) + '</a></td></tr>').join('') || '<tr><td colspan="8" class="empty">Tidak ada siswa.</td></tr>';
    };
    isi();
    $$('#tab-ak button').forEach(b => b.onclick = () => { filterAK = b.dataset.f; $$('#tab-ak button').forEach(x => x.classList.toggle('on', x === b)); isi(); });
    $('#urut-ak').onchange = e => { urutAK = e.target.value; isi(); };
    pasangSel(analisisKelas);
    $('#btn-pdf').onclick = () => buatPdf('laporanKelas', { id_kelas: kelasAktif, id_mapel: mapelAktif });
    $('#btn-csv').onclick = () => {
      const rows = [['Nama', 'NISN', 'Diagnostik', 'Try Out', 'Nilai Terakhir', 'Pertumbuhan', 'Rata Penguasaan', 'Status'].concat(d.kompetensi.map(k => k.nama_kompetensi))]
        .concat(d.siswa.map(s => [s.nama, s.nisn, s.diagnostik, s.tryout, s.nilai_terakhir, s.pertumbuhan, s.rata, STATUS[s.status][1]].concat(d.kompetensi.map(k => s.penguasaan[k.id_kompetensi] === undefined ? '' : s.penguasaan[k.id_kompetensi]))));
      UI.unduhTeks('Rekap_' + d.kelas.nama_kelas.replace(/\s+/g, '_') + '.csv', UI.keCSV(rows));
    };
  }

  // ================= ANALISIS SISWA (US-17) =================
  async function analisisSiswa(args) {
    await meta();
    if (!kelasAktif) return tanpaKelas();
    const daftar = await API.call('listSiswa', { id_kelas: kelasAktif });
    const id = args[0];
    const pilih = '<label class="sel-pill">' + icon('user') + '<span class="muted">Siswa:</span><select id="sel-siswa"><option value="">— pilih siswa —</option>' + daftar.filter(s => s.status_aktif).map(s => '<option value="' + esc(s.id_user) + '"' + (s.id_user === id ? ' selected' : '') + '>' + esc(s.nama) + '</option>').join('') + '</select></label>';
    if (!id) {
      main().innerHTML = head('Analisis Siswa', 'Profil Belajar Siswa', 'Pilih siswa untuk melihat grafik perkembangan, peta kekuatan-kelemahan, rekomendasi, dan catatan intervensi.') +
        '<div class="toolbar">' + selKelas() + pilih + '</div><div class="grid g3">' + daftar.filter(s => s.status_aktif).map(s => '<a class="act-card" style="text-decoration:none;color:inherit" href="#/g/analisis-siswa/' + esc(s.id_user) + '">' + UI.avatar(s.nama) + '<div class="grow"><h3>' + esc(s.nama) + '</h3><div class="small muted">Rata-rata ' + UI.angka(s.rata, '%') + ' • ' + s.jumlah_sesi + ' sesi</div></div>' + icon('chevron-right') + '</a>').join('') + '</div>';
      pasangSel(() => analisisSiswa([]));
      $('#sel-siswa').onchange = e => { if (e.target.value) location.hash = '#/g/analisis-siswa/' + e.target.value; };
      return;
    }
    const d = await API.call('analisisSiswa', { id_user: id });
    const s = d.siswa;
    const per = {};
    d.penguasaan.forEach(k => { (per[k.nama_mapel] = per[k.nama_mapel] || []).push(k); });
    const dicoba = d.penguasaan.filter(k => k.persen !== null);
    const kuat = dicoba.filter(k => k.level === 'menguasai'), lemah = dicoba.filter(k => k.level !== 'menguasai').sort((a, b) => a.persen - b.persen);
    main().innerHTML = head('Analisis Siswa', esc(s.nama), 'NISN ' + esc(s.nisn || '-') + ' • ' + esc(s.username) + (s.kelompok ? ' • Kelompok ' + esc(s.kelompok) : ''),
        '<button class="btn btn-outline" id="btn-pdf">' + icon('printer') + 'Laporan PDF Siswa</button><button class="btn btn-primary" id="btn-rek">' + icon('plus') + 'Tambah Rekomendasi</button>') +
      '<div class="toolbar">' + pilih + '<label class="sel-pill"><span class="muted">Level belajar:</span><select id="sel-level"><option value="">Otomatis (' + (s.level_otomatis || 'belum ada data') + ')</option>' + ['dasar', 'cakap', 'mahir'].map(l => '<option value="' + l + '"' + (s.level_manual === l ? ' selected' : '') + '>Tetapkan: ' + l + '</option>').join('') + '</select></label></div>' +
      '<div class="grid g3">' +
        '<div class="card center">' + '<div class="row" style="justify-content:center">' + UI.ring(s.rata, { label: 'PENGUASAAN', warna: s.rata >= d.kktp ? 'var(--success)' : (s.rata >= d.batas_bawah ? 'var(--doubt)' : 'var(--danger)') }) + '</div><div class="mt-1 small muted">Rata-rata dari ' + dicoba.length + ' kompetensi</div>' +
          '<div class="mt-2" style="text-align:left"><div class="small bold" style="color:var(--success-dark)">' + icon('award') + ' Kekuatan</div><div class="small mt-1">' + (kuat.length ? kuat.map(k => esc(k.nama_kompetensi)).join(', ') : '-') + '</div>' +
          '<div class="small bold mt-2" style="color:var(--danger-dark)">' + icon('flag') + ' Perlu dilatih kembali</div><div class="small mt-1">' + (lemah.length ? lemah.map(k => esc(k.nama_kompetensi) + ' (' + k.persen + '%)').join(', ') : '-') + '</div></div></div>' +
        '<div class="card" style="grid-column:span 2"><div class="card-title mb-2">Perkembangan nilai: diagnostik → latihan → try out</div>' + UI.lineChart(d.riwayat.map(r => ({ label: (UI.JENIS[r.jenis] || r.jenis).replace('Latihan ', ''), value: r.skor, jenis: r.jenis })), { kktp: d.kktp }) + '</div>' +
      '</div>' +
      '<div class="grid g2 mt-2">' +
        '<div class="card"><div class="card-title mb-2">Peta kekuatan &amp; kelemahan per kompetensi</div>' + Object.keys(per).map(m => '<div class="small bold muted mt-1 mb-1">' + esc(m) + '</div>' + per[m].map(k => '<div class="mastery-row"><div><b class="small">' + esc(k.nama_kompetensi) + '</b><div class="mt-1">' + UI.bar(k.persen || 0, d.kktp, d.batas_bawah, { mark: d.kktp }) + '</div></div><div class="row">' + UI.badgeLevel(k.level) + '<b class="small">' + (k.persen === null ? '' : k.persen + '%') + '</b></div></div>').join('')).join('') + '</div>' +
        '<div class="stack">' +
          '<div class="card"><div class="card-title mb-2">Rekomendasi kompetensi yang perlu dilatih</div><div class="stack" style="gap:.5rem">' + (d.rekomendasi.filter(r => r.status !== 'selesai').map(r => '<div class="interv"><div class="row between"><b>' + esc(r.nama_kompetensi) + '</b><span class="chip ' + (r.sumber === 'guru' ? 'chip-amber' : '') + '">' + (r.sumber === 'guru' ? 'Guru' : 'Sistem') + ' • ' + esc(r.status) + '</span></div><span class="xs muted">' + esc(r.alasan) + '</span></div>').join('') || '<p class="muted small">Tidak ada rekomendasi terbuka.</p>') + '</div></div>' +
          '<div class="card"><div class="card-title mb-2">Catatan &amp; intervensi guru</div>' +
            '<form id="f-catatan" class="stack" style="gap:.5rem"><textarea class="textarea" id="ct-isi" placeholder="Contoh: Bimbingan pecahan memakai kertas lipat, 2× seminggu." style="min-height:70px"></textarea><div class="row wrap between"><div class="row wrap"><select class="select" id="ct-jenis" style="width:auto;min-height:36px"><option value="intervensi">Intervensi</option><option value="pengayaan">Pengayaan</option></select><label class="check small"><input type="checkbox" id="ct-tampil"> Tampilkan ke siswa</label></div><button class="btn btn-primary btn-sm">' + icon('plus') + 'Simpan</button></div></form>' +
            '<div class="stack mt-2" style="gap:.5rem">' + (d.catatan.map(c => '<div class="note-card"><div class="row between"><span class="chip ' + (c.jenis === 'pengayaan' ? 'chip-green' : 'chip-amber') + '">' + esc(c.jenis) + '</span><span class="row xs muted">' + UI.tgl(c.tanggal) + (String(c.tampil_ke_siswa).toUpperCase() === 'TRUE' ? ' • terlihat siswa' : '') + '<button class="btn btn-ghost btn-icon btn-sm" data-hapus="' + esc(c.id_catatan) + '" aria-label="Hapus">' + icon('trash') + '</button></span></div><div class="mt-1 small">' + esc(c.catatan) + '</div></div>').join('') || '<p class="muted small">Belum ada catatan.</p>') + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="card mt-2"><div class="card-title mb-2">Riwayat pengerjaan</div>' + (d.pengerjaan.length ? '<div class="table-wrap" style="box-shadow:none"><table class="tbl"><thead><tr><th>Tanggal</th><th>Paket</th><th>Jenis</th><th class="num">Nilai</th><th></th></tr></thead><tbody>' +
        d.pengerjaan.map(p => '<tr><td class="nowrap">' + UI.tgl(p.waktu_selesai, true) + '</td><td>' + esc(p.judul) + '</td><td><span class="chip chip-outline">' + esc(UI.JENIS[p.jenis] || p.jenis) + '</span></td><td class="num bold">' + UI.angka(p.nilai) + '</td><td><button class="btn btn-sm" data-review="' + esc(p.id_pengerjaan) + '">' + icon('eye') + 'Detail jawaban</button></td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">Belum ada pengerjaan.</p>') + '</div>';

    $('#sel-siswa').onchange = e => { location.hash = '#/g/analisis-siswa/' + e.target.value; };
    $('#sel-level').onchange = async e => { if (await UI.run(() => API.call('setLevelSiswa', { id_user: id, level: e.target.value }))) UI.toast('Level belajar diperbarui.', 'success'); };
    $('#btn-pdf').onclick = () => buatPdf('laporanSiswa', { id_user: id });
    $('#btn-rek').onclick = () => formRekomendasi([id], lemah[0] && lemah[0].id_kompetensi, () => analisisSiswa(args));
    $$('[data-review]').forEach(b => b.onclick = () => Ujian.review(b.dataset.review));
    $$('[data-hapus]').forEach(b => b.onclick = async () => { if (await UI.confirm('Hapus catatan?', 'Catatan ini akan dihapus permanen.', { bahaya: true, ok: 'Hapus' })) { await UI.run(() => API.call('hapusCatatan', { id_catatan: b.dataset.hapus })); analisisSiswa(args); } });
    $('#f-catatan').onsubmit = async e => {
      e.preventDefault();
      const ok = await UI.run(() => API.call('simpanCatatan', { id_user: id, catatan: $('#ct-isi').value, jenis: $('#ct-jenis').value, tampil_ke_siswa: $('#ct-tampil').checked }));
      if (ok) { UI.toast('Catatan disimpan.', 'success'); analisisSiswa(args); }
    };
  }

  function formRekomendasi(ids, idKomp, selesai) {
    const m = UI.modal({ title: 'Tambah rekomendasi belajar', body: '<div class="stack"><div class="field"><label>Kompetensi</label><select class="select" id="rk-komp">' + optKomp(idKomp) + '</select></div>' +
      '<div class="field"><label>Materi (opsional)</label><select class="select" id="rk-mtr"><option value="">Otomatis sesuai kompetensi</option>' + META.materi.map(x => '<option value="' + esc(x.id_materi) + '">' + esc(x.judul) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Alasan / pesan untuk siswa</label><textarea class="textarea" id="rk-alasan" placeholder="Contoh: Ayo latih pecahan senilai sebelum Try Out berikutnya!"></textarea></div></div>',
      foot: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" id="rk-ok">Simpan</button>' });
    m.querySelector('#rk-ok').onclick = async () => {
      const r = await UI.run(() => API.call('tambahRekomendasi', { id_user: ids, id_kompetensi: $('#rk-komp').value, id_materi: $('#rk-mtr').value, alasan: $('#rk-alasan').value || undefined }));
      if (r) { m.close(); UI.toast('Rekomendasi ditambahkan.', 'success'); if (selesai) selesai(); }
    };
  }

  const PAGES = { dashboard, 'analisis-kelas': analisisKelas, 'analisis-siswa': analisisSiswa };
  // (halaman lain didaftarkan di bawah)

  // ================= DATA SISWA (US-02, US-11) =================
  let stSiswa = { q: '', kelompok: '', status: '', hal: 1, pilih: new Set() };
  async function siswa() {
    await meta(true);
    if (!kelasAktif) return tanpaKelas();
    const list = await API.call('listSiswa', { id_kelas: kelasAktif });
    const aktif = list.filter(s => s.status_aktif);
    const login = aktif.filter(s => s.login_terakhir).length;
    const cnt = lv => aktif.filter(s => (s.level_manual || s.level_otomatis) === lv).length;
    const rata = aktif.filter(s => s.rata !== null);
    const kelompokNama = Array.from(new Set(list.map(s => s.kelompok).filter(Boolean)));
    stSiswa.pilih = new Set(Array.from(stSiswa.pilih).filter(id => list.some(s => s.id_user === id)));

    main().innerHTML = head('Manajemen Data Siswa', 'Manajemen Data Siswa &amp; Akun Ujian', 'Kelola akun peserta didik, kode masuk, rombongan belajar, dan pemetaan diferensiasi (US-02 &amp; US-11).',
        '<button class="btn btn-outline" id="b-kartu">' + icon('printer') + 'Cetak Semua Kartu Login</button><button class="btn btn-outline" id="b-impor">' + icon('upload') + 'Impor CSV / Spreadsheet</button><button class="btn btn-outline" id="b-kelas">' + icon('graduation') + 'Kelola Kelas</button><button class="btn btn-primary" id="b-tambah">' + icon('plus') + 'Tambah Siswa Baru</button>') +
      '<div class="grid g4 mb-2">' +
        '<div class="card"><div class="row between"><span class="stat-label">Total siswa terdaftar</span><div class="icon-bubble">' + icon('graduation') + '</div></div><div class="stat-num">' + aktif.length + ' <span class="small" style="color:var(--success-dark)">aktif</span></div><div class="small muted">' + (list.length - aktif.length) + ' nonaktif</div></div>' +
        '<div class="card"><div class="row between"><span class="stat-label">Aktivitas login siswa</span><div class="icon-bubble">' + icon('key') + '</div></div><div class="stat-num">' + login + ' <span class="small muted">/ ' + aktif.length + ' sudah login</span></div><div class="mt-1">' + UI.bar(aktif.length ? 100 * login / aktif.length : 0, 1, 0) + '</div></div>' +
        '<div class="card"><div class="row between"><span class="stat-label">Level diferensiasi</span><div class="icon-bubble">' + icon('split') + '</div></div><div class="row wrap mt-1"><span class="chip chip-red">' + cnt('dasar') + ' Dasar</span><span class="chip chip-amber">' + cnt('cakap') + ' Cakap</span><span class="chip chip-green">' + cnt('mahir') + ' Mahir</span></div><div class="small muted mt-1">Dari hasil asesmen terkini</div></div>' +
        '<div class="card"><div class="row between"><span class="stat-label">Rata-rata penguasaan</span><div class="icon-bubble">' + icon('trending') + '</div></div><div class="stat-num blue">' + (rata.length ? UI.angka(rata.reduce((a, s) => a + s.rata, 0) / rata.length) : '–') + '<span class="small muted"> /100</span></div><div class="small muted">' + rata.length + ' siswa sudah punya data</div></div>' +
      '</div>' +
      '<div class="card mb-2"><div class="row wrap"><div class="input-icon grow" style="min-width:220px">' + icon('search') + '<input class="input" id="s-q" placeholder="Cari nama siswa, NISN, atau username…" value="' + esc(stSiswa.q) + '"></div>' + selKelas() +
        '<select class="select" id="s-kel" style="width:auto"><option value="">Semua kelompok</option>' + kelompokNama.map(k => '<option' + (stSiswa.kelompok === k ? ' selected' : '') + '>' + esc(k) + '</option>').join('') + '</select>' +
        '<select class="select" id="s-st" style="width:auto"><option value="">Status: Semua</option><option value="aktif"' + (stSiswa.status === 'aktif' ? ' selected' : '') + '>Aktif</option><option value="belum"' + (stSiswa.status === 'belum' ? ' selected' : '') + '>Belum login</option><option value="nonaktif"' + (stSiswa.status === 'nonaktif' ? ' selected' : '') + '>Nonaktif</option></select>' +
        '<button class="btn btn-outline" id="b-xls">' + icon('download') + 'Ekspor CSV</button></div>' +
        '<div class="bulkbar mt-2" style="margin-bottom:0"><span class="row"><span class="count" id="n-pilih">0</span>Siswa dipilih untuk tindakan massal</span><div class="row wrap">' +
          '<button class="btn btn-sm btn-outline" data-bulk="reset">' + icon('refresh') + 'Reset Kode</button><button class="btn btn-sm btn-outline" data-bulk="kartu">' + icon('printer') + 'Cetak Kartu</button><button class="btn btn-sm btn-outline" data-bulk="rek">' + icon('sparkles') + 'Beri Rekomendasi</button><button class="btn btn-sm btn-outline" data-bulk="nonaktif">' + icon('lock') + 'Nonaktifkan</button><button class="btn btn-sm btn-outline" data-bulk="aktif">' + icon('check') + 'Aktifkan</button></div></div></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th><input type="checkbox" id="cek-semua" aria-label="Pilih semua"></th><th>No</th><th>Nama Lengkap &amp; NISN</th><th>Username &amp; Kode Masuk</th><th>Kelompok / Level</th><th>Progres Asesmen</th><th>Status Akun</th><th></th></tr></thead><tbody id="tb-siswa"></tbody></table><div id="pg-siswa"></div></div>' +
      '<div class="helpbox mt-2"><div class="icon-bubble">' + icon('bulb') + '</div><div><b style="color:var(--primary-dark)">Panduan Ramah Pendidik — Asesmen Tanpa Cemas</b><br><span class="small">Kode masuk berbentuk <b>TKA-1234</b> agar mudah diketik siswa. Cetak kartu login (8 kartu per lembar A4) lalu bagikan sebelum asesmen dimulai. Siswa juga bisa masuk dengan memindai QR pada kartu.</span></div></div>';

    const saring = () => {
      const q = stSiswa.q.toLowerCase();
      return list.filter(s => (!q || (s.nama + ' ' + s.nisn + ' ' + s.username).toLowerCase().includes(q)) && (!stSiswa.kelompok || s.kelompok === stSiswa.kelompok) &&
        (!stSiswa.status || (stSiswa.status === 'aktif' && s.status_aktif) || (stSiswa.status === 'nonaktif' && !s.status_aktif) || (stSiswa.status === 'belum' && s.status_aktif && !s.login_terakhir)));
    };
    const isi = () => {
      const rows = saring(), per = 10;
      const maks = Math.max(1, Math.ceil(rows.length / per)); if (stSiswa.hal > maks) stSiswa.hal = maks;
      const tampil = rows.slice((stSiswa.hal - 1) * per, stSiswa.hal * per);
      $('#tb-siswa').innerHTML = tampil.length ? tampil.map((s, i) => {
        const lv = s.level_manual || s.level_otomatis;
        const st = !s.status_aktif ? '<span class="chip chip-gray">Nonaktif</span>' : (s.sedang_ujian ? '<span class="chip chip-amber"><span class="dot"></span>Mengerjakan</span>' : (s.login_terakhir ? '<span class="chip chip-green"><span class="dot"></span>Aktif</span>' : '<span class="chip">Belum login</span>'));
        return '<tr><td><input type="checkbox" data-pilih="' + esc(s.id_user) + '"' + (stSiswa.pilih.has(s.id_user) ? ' checked' : '') + '></td><td>' + ((stSiswa.hal - 1) * per + i + 1) + '</td>' +
          '<td><div class="person">' + UI.avatar(s.nama) + '<div><b>' + esc(s.nama) + '</b><span>NISN: ' + esc(s.nisn || '-') + (s.jenis_kelamin ? ' • ' + (s.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki') : '') + '</span></div></div></td>' +
          '<td><div class="mono small">' + esc(s.username) + '</div><span class="code-pill mt-1">' + esc(s.kode_siswa) + '<button class="btn btn-ghost btn-icon btn-sm" style="width:24px;min-height:24px" data-salin="' + esc(s.kode_siswa) + '" aria-label="Salin kode">' + icon('copy') + '</button></span></td>' +
          '<td>' + (s.kelompok ? '<span class="chip chip-outline">' + esc(s.kelompok) + '</span> ' : '') + (lv ? '<span class="chip ' + { dasar: 'chip-red', cakap: 'chip-amber', mahir: 'chip-green' }[lv] + '">' + (lv === 'dasar' ? icon('alert') + 'Intervensi' : (lv === 'cakap' ? 'Cakap' : 'Mahir')) + (s.level_manual ? ' •manual' : '') + '</span>' : '<span class="muted small">Belum ada data</span>') + '</td>' +
          '<td style="min-width:150px"><div class="row between small"><span>Rata-rata</span><b>' + UI.angka(s.rata, '%') + '</b></div>' + UI.bar(s.rata || 0) + '<div class="xs muted mt-1">' + (s.sudah_diagnostik ? 'Diagnostik selesai' : 'Belum diagnostik') + ' • ' + s.jumlah_sesi + ' sesi</div></td>' +
          '<td>' + st + '<div class="xs muted mt-1">' + UI.relatif(s.login_terakhir) + '</div></td>' +
          '<td><div class="row"><button class="btn btn-ghost btn-icon btn-sm" data-edit="' + esc(s.id_user) + '" aria-label="Ubah">' + icon('edit') + '</button><a class="btn btn-ghost btn-icon btn-sm" href="#/g/analisis-siswa/' + esc(s.id_user) + '" aria-label="Analisis">' + icon('chart') + '</a></div></td></tr>';
      }).join('') : '<tr><td colspan="8" class="empty">' + (list.length ? 'Tidak ada siswa yang cocok.' : 'Belum ada siswa. Klik "Tambah Siswa Baru" atau "Impor CSV".') + '</td></tr>';
      $('#pg-siswa').innerHTML = UI.pager(rows.length, stSiswa.hal, per, h => { stSiswa.hal = h; isi(); });
      $('#n-pilih').textContent = stSiswa.pilih.size;
      $$('#tb-siswa [data-pilih]').forEach(c => c.onchange = () => { c.checked ? stSiswa.pilih.add(c.dataset.pilih) : stSiswa.pilih.delete(c.dataset.pilih); $('#n-pilih').textContent = stSiswa.pilih.size; });
      $$('#tb-siswa [data-salin]').forEach(b => b.onclick = () => UI.salin(b.dataset.salin));
      $$('#tb-siswa [data-edit]').forEach(b => b.onclick = () => formSiswa(list.find(s => s.id_user === b.dataset.edit)));
      $('#cek-semua').checked = tampil.length && tampil.every(s => stSiswa.pilih.has(s.id_user));
    };
    isi();
    $('#s-q').oninput = UI.debounce(e => { stSiswa.q = $('#s-q').value; stSiswa.hal = 1; isi(); }, 200);
    $('#s-kel').onchange = e => { stSiswa.kelompok = e.target.value; stSiswa.hal = 1; isi(); };
    $('#s-st').onchange = e => { stSiswa.status = e.target.value; stSiswa.hal = 1; isi(); };
    $('#cek-semua').onchange = e => { const rows = saring().slice((stSiswa.hal - 1) * 10, stSiswa.hal * 10); rows.forEach(s => e.target.checked ? stSiswa.pilih.add(s.id_user) : stSiswa.pilih.delete(s.id_user)); isi(); };
    pasangSel(siswa);
    $('#b-tambah').onclick = () => formSiswa(null);
    $('#b-impor').onclick = imporSiswa;
    $('#b-kelas').onclick = () => kelolaKelas();
    $('#b-kartu').onclick = () => cetakKartu(list.filter(s => s.status_aktif));
    $('#b-xls').onclick = () => UI.unduhTeks('Data_Siswa.csv', UI.keCSV([['Nama', 'NISN', 'Jenis Kelamin', 'Username', 'Kode Siswa', 'Kelas', 'Kelompok', 'Rata Penguasaan', 'Status']].concat(list.map(s => [s.nama, s.nisn, s.jenis_kelamin, s.username, s.kode_siswa, s.nama_kelas, s.kelompok, s.rata, s.status_aktif ? 'Aktif' : 'Nonaktif']))));
    $$('[data-bulk]').forEach(b => b.onclick = async () => {
      const ids = Array.from(stSiswa.pilih);
      if (!ids.length) return UI.toast('Pilih siswa terlebih dahulu (centang di kolom kiri).', 'warn');
      const a = b.dataset.bulk;
      if (a === 'kartu') return cetakKartu(list.filter(s => stSiswa.pilih.has(s.id_user)));
      if (a === 'rek') return formRekomendasi(ids, null);
      if (a === 'reset') {
        if (!(await UI.confirm('Reset kode siswa?', 'Kode masuk <b>' + ids.length + ' siswa</b> akan diganti. Kartu lama tidak berlaku lagi.', { bahaya: true, ok: 'Reset kode' }))) return;
        const r = await UI.run(() => API.call('resetKodeSiswa', { ids }));
        if (r) { UI.modal({ title: 'Kode baru', body: '<div class="table-wrap" style="box-shadow:none"><table class="tbl"><tr><th>Nama</th><th>Username</th><th>Kode baru</th></tr>' + r.map(x => '<tr><td>' + esc(x.nama) + '</td><td class="mono">' + esc(x.username) + '</td><td><span class="code-pill">' + esc(x.kode_siswa) + '</span></td></tr>').join('') + '</table></div>', foot: '<button class="btn" data-close>Tutup</button><button class="btn btn-primary" id="ck">' + icon('printer') + 'Cetak kartu</button>' }).querySelector('#ck').onclick = () => cetakKartu(r.map(x => Object.assign({}, list.find(s => s.id_user === x.id_user), x))); siswa(); }
        return;
      }
      const aktifkan = a === 'aktif';
      if (!aktifkan && !(await UI.confirm('Nonaktifkan siswa?', ids.length + ' siswa tidak akan bisa masuk sampai diaktifkan lagi. Data hasil belajar tetap tersimpan.', { bahaya: true, ok: 'Nonaktifkan' }))) return;
      if (await UI.run(() => API.call('setStatusSiswa', { ids, aktif: aktifkan }))) { stSiswa.pilih.clear(); UI.toast('Status siswa diperbarui.', 'success'); siswa(); }
    });
  }

  function formSiswa(s) {
    const m = UI.modal({ title: s ? 'Ubah data siswa' : 'Tambah siswa baru', body: '<form class="grid-form" id="f-siswa">' +
      '<div class="field full"><label>Nama lengkap</label><input class="input" name="nama" required value="' + esc(s ? s.nama : '') + '"></div>' +
      '<div class="field"><label>NISN</label><input class="input mono" name="nisn" inputmode="numeric" maxlength="10" value="' + esc(s ? s.nisn : '') + '"></div>' +
      '<div class="field"><label>Jenis kelamin</label><select class="select" name="jenis_kelamin"><option value="">-</option><option value="L"' + (s && s.jenis_kelamin === 'L' ? ' selected' : '') + '>Laki-laki</option><option value="P"' + (s && s.jenis_kelamin === 'P' ? ' selected' : '') + '>Perempuan</option></select></div>' +
      '<div class="field"><label>Kelas</label><select class="select" name="kelas">' + META.kelas.map(k => '<option value="' + esc(k.id_kelas) + '"' + ((s ? s.kelas : kelasAktif) === k.id_kelas ? ' selected' : '') + '>' + esc(k.nama_kelas) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Username <span class="help">kosongkan = otomatis</span></label><input class="input mono" name="username" value="' + esc(s ? s.username : '') + '"></div>' +
      (s ? '<div class="field full"><label>Kode masuk</label><div class="row"><span class="code-pill">' + esc(s.kode_siswa) + '</span><span class="help">Gunakan "Reset Kode" pada tabel untuk mengganti.</span></div></div>' : '') + '</form>',
      foot: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" id="ok-siswa">' + icon('check') + 'Simpan</button>' });
    m.querySelector('#ok-siswa').onclick = async () => {
      const f = new FormData(m.querySelector('#f-siswa'));
      const data = Object.fromEntries(f.entries());
      if (s) data.id_user = s.id_user;
      const r = await UI.run(() => API.call('simpanSiswa', data));
      if (!r) return;
      m.close();
      if (!s) UI.modal({ title: 'Siswa berhasil ditambahkan', body: '<p>Bagikan data login berikut kepada siswa:</p><div class="card card-sky mt-1"><div>Username: <b class="mono">' + esc(r.username) + '</b></div><div class="mt-1">Kode siswa: <span class="code-pill">' + esc(r.kode_siswa) + '</span></div></div>' });
      else UI.toast('Data siswa diperbarui.', 'success');
      siswa();
    };
  }

  function imporSiswa() {
    const m = UI.modal({ title: 'Impor siswa dari CSV / Spreadsheet', size: 'lg', body: '<div class="stack"><div class="note-card small">Salin kolom dari Google Sheets/Excel lalu tempel di bawah (baris pertama = judul kolom). Kolom yang dikenali: <b>nama</b> (wajib), <b>nisn</b>, <b>jenis_kelamin</b> (L/P). Username dan kode dibuat otomatis.</div>' +
      '<div class="row wrap"><span class="muted small">Kelas tujuan:</span>' + selKelas('imp-kelas') + '<input type="file" accept=".csv,.tsv,.txt" id="imp-file" class="small"><button class="btn btn-sm" id="imp-tpl">' + icon('download') + 'Unduh templat</button></div>' +
      '<textarea class="textarea mono" id="imp-teks" style="min-height:180px" placeholder="nama\tnisn\tjenis_kelamin&#10;Budi Pratama\t0124859011\tL"></textarea><div id="imp-prev" class="small muted"></div></div>',
      foot: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" id="imp-ok">' + icon('upload') + 'Impor</button>' });
    const prev = () => { const rows = UI.parseCSV($('#imp-teks').value).filter(r => r.nama); $('#imp-prev').textContent = rows.length ? rows.length + ' siswa siap diimpor: ' + rows.slice(0, 5).map(r => r.nama).join(', ') + (rows.length > 5 ? ', …' : '') : 'Belum ada data valid.'; return rows; };
    $('#imp-teks').oninput = prev;
    $('#imp-file').onchange = e => { const f = e.target.files[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => { $('#imp-teks').value = fr.result; prev(); }; fr.readAsText(f); };
    $('#imp-tpl').onclick = () => UI.unduhTeks('templat_siswa.csv', 'nama,nisn,jenis_kelamin\nContoh Nama Siswa,0123456789,L\n');
    $('#imp-ok').onclick = async () => {
      const rows = prev();
      if (!rows.length) return UI.toast('Belum ada baris valid.', 'warn');
      const r = await UI.run(() => API.call('imporSiswa', { id_kelas: $('#imp-kelas').value, rows }));
      if (!r) return;
      m.close();
      UI.modal({ title: r.ditambahkan.length + ' siswa ditambahkan', size: 'lg', body: (r.dilewati.length ? '<div class="note-card small mb-2">Dilewati: ' + esc(r.dilewati.join('; ')) + '</div>' : '') + '<div class="table-wrap" style="box-shadow:none"><table class="tbl"><tr><th>Nama</th><th>Username</th><th>Kode</th></tr>' + r.ditambahkan.map(x => '<tr><td>' + esc(x.nama) + '</td><td class="mono">' + esc(x.username) + '</td><td><span class="code-pill">' + esc(x.kode_siswa) + '</span></td></tr>').join('') + '</table></div>' });
      siswa();
    };
  }

  function kelolaKelas() {
    const m = UI.modal({ title: 'Kelola kelas', body: '<div class="stack">' + META.kelas.map(k => '<div class="row between card card-sky" style="padding:.7rem 1rem"><div><b>' + esc(k.nama_kelas) + '</b><div class="xs muted">' + k.jumlah_siswa + ' siswa aktif • TA ' + esc(k.tahun_ajaran || '-') + '</div></div><button class="btn btn-sm" data-k="' + esc(k.id_kelas) + '">' + icon('edit') + 'Ubah</button></div>').join('') + '</div>',
      foot: '<button class="btn" data-close>Tutup</button><button class="btn btn-primary" id="k-baru">' + icon('plus') + 'Kelas baru</button>' });
    m.querySelector('#k-baru').onclick = () => { m.close(); formKelas(); };
    m.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { m.close(); formKelas(META.kelas.find(k => k.id_kelas === b.dataset.k)); });
  }

  function formKelas(k) {
    const m = UI.modal({ title: k ? 'Ubah kelas' : 'Kelas baru', body: '<div class="stack"><div class="field"><label>Nama kelas</label><input class="input" id="k-nama" placeholder="Kelas 6A" value="' + esc(k ? k.nama_kelas : '') + '"></div><div class="field"><label>Tahun ajaran</label><input class="input" id="k-ta" placeholder="2025/2026" value="' + esc(k ? k.tahun_ajaran : (META && META.pengaturan.TAHUN_AJARAN) || '') + '"></div></div>',
      foot: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" id="k-ok">Simpan</button>' });
    m.querySelector('#k-ok').onclick = async () => {
      const r = await UI.run(() => API.call('simpanKelas', { id_kelas: k && k.id_kelas, nama_kelas: $('#k-nama').value, tahun_ajaran: $('#k-ta').value }));
      if (r) { m.close(); kelasAktif = r.id_kelas; try { localStorage.setItem('siaptka_kelas', kelasAktif); } catch (e) { /* abaikan */ } META = null; UI.toast('Kelas disimpan.', 'success'); ulang(); }
    };
  }

  /** Cetak kartu login 8 per lembar A4 (dengan QR bila pustaka tersedia). */
  async function cetakKartu(list) {
    if (!list.length) return UI.toast('Tidak ada siswa untuk dicetak.', 'warn');
    UI.loading(true);
    if (!window.qrcode) await new Promise(res => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
    UI.loading(false);
    const qr = t => { try { const q = window.qrcode(0, 'M'); q.addData(t); q.make(); return q.createSvgTag({ cellSize: 3, margin: 0 }); } catch (e) { return ''; } };
    const kelas = id => (META.kelas.find(k => k.id_kelas === id) || {}).nama_kelas || '';
    const kartu = s => '<div class="login-kartu"><div style="flex:1;min-width:0"><div class="kh">KARTU LOGIN • SIAP TKA SD</div><div class="nm">' + esc(s.nama) + '</div><div class="kv">' + esc(kelas(s.kelas)) + (s.nisn ? ' • NISN ' + esc(s.nisn) : '') + '</div>' +
      '<div class="kv">Nama pengguna<b>' + esc(s.username) + '</b></div><div class="kv">Kode siswa<b>' + esc(s.kode_siswa) + '</b></div><div class="kv" style="font-size:7.5pt;color:#64748B;margin-top:2mm">' + esc(location.origin + location.pathname) + '</div></div>' +
      '<div class="qr">' + qr('SIAPTKA|' + s.username + '|' + s.kode_siswa) + '<span>Pindai untuk masuk</span></div></div>';
    let html = '';
    for (let i = 0; i < list.length; i += 8) html += '<div class="cards-sheet">' + list.slice(i, i + 8).map(kartu).join('') + '</div>';
    $('#print-area').innerHTML = html;
    setTimeout(() => window.print(), 150);
  }

  Object.assign(PAGES, { siswa });

  // ================= BANK SOAL & MATERI (US-12, US-13) =================
  let tabBank = 'soal';
  let fSoal = { q: '', mapel: '', komp: '', kes: '', tipe: '', status: '', hal: 1, per: 10 };
  async function bankPage(args) {
    if (args && args[0]) tabBank = args[0];
    await meta(true);
    const soal = await bank(true);
    const nLit = soal.filter(s => s.id_mapel === 'MP-BIN').length, nNum = soal.filter(s => s.id_mapel === 'MP-MAT').length;
    const revisi = soal.filter(s => s.status === 'revisi' || s.status === 'draft').length;
    main().innerHTML = '<div class="panel-head"><div><div class="crumb" style="color:var(--primary);font-weight:700;letter-spacing:.04em">' + icon('database') + ' TERHUBUNG GOOGLE SHEETS (CACHE AKTIF)</div><h1>Bank Soal &amp; Stimulus Asesmen</h1><p>Kelola butir soal literasi &amp; numerasi, stimulus wacana bergambar, materi PDF, dan daftar kompetensi.</p></div>' +
      '<div class="row wrap" style="max-width:520px;justify-content:flex-end"><button class="btn btn-outline" id="b-stim">' + icon('book') + 'Kelola Stimulus &amp; Wacana</button><button class="btn btn-outline" id="b-imp">' + icon('upload') + 'Impor Massal (CSV/Sheets)</button><button class="btn btn-primary" id="b-baru">' + icon('plus') + 'Tambah Butir Soal Baru</button></div></div>' +
      '<div class="grid g4 mb-2">' +
        '<div class="card"><div class="row between"><div><div class="stat-label">Total soal</div><div class="stat-num blue">' + soal.length + '</div></div><div class="icon-bubble">' + icon('clipboard') + '</div></div><div class="small muted">' + soal.filter(s => s.status === 'aktif').length + ' aktif</div></div>' +
        '<div class="card"><div class="row between"><div><div class="stat-label">Literasi (B. Indonesia)</div><div class="stat-num">' + nLit + '</div></div><div class="icon-bubble">' + icon('book') + '</div></div><div class="small muted">' + META.stimulus.length + ' stimulus/wacana</div></div>' +
        '<div class="card"><div class="row between"><div><div class="stat-label">Numerasi (Matematika)</div><div class="stat-num">' + nNum + '</div></div><div class="icon-bubble">' + icon('grid') + '</div></div><div class="small muted">' + META.kompetensi.length + ' kompetensi terdaftar</div></div>' +
        '<div class="card"><div class="row between"><div><div class="stat-label">Perlu review / draft</div><div class="stat-num" style="color:var(--doubt)">' + revisi + '</div></div><div class="icon-bubble amber">' + icon('edit') + '</div></div><div class="small muted">' + META.materi.length + ' materi belajar</div></div>' +
      '</div>' +
      '<div class="tabs-line mb-2" id="tab-bank">' + [['soal', 'Butir Soal', 'clipboard'], ['stimulus', 'Stimulus & Wacana', 'book'], ['materi', 'Materi Belajar', 'file'], ['kompetensi', 'Mapel & Kompetensi', 'layers']].map(t => '<button data-t="' + t[0] + '" class="' + (tabBank === t[0] ? 'on' : '') + '">' + icon(t[2]) + t[1] + '</button>').join('') + '</div><div id="bank-isi"></div>';
    $$('#tab-bank button').forEach(b => b.onclick = () => { tabBank = b.dataset.t; $$('#tab-bank button').forEach(x => x.classList.toggle('on', x === b)); isiBank(); });
    $('#b-baru').onclick = () => editSoal(null);
    $('#b-stim').onclick = () => { tabBank = 'stimulus'; $$('#tab-bank button').forEach(x => x.classList.toggle('on', x.dataset.t === 'stimulus')); isiBank(); };
    $('#b-imp').onclick = imporSoal;
    isiBank();
  }

  function isiBank() {
    const el = $('#bank-isi');
    if (tabBank === 'soal') return tabSoal(el);
    if (tabBank === 'stimulus') return tabStimulus(el);
    if (tabBank === 'materi') return tabMateri(el);
    return tabKompetensi(el);
  }

  function tabSoal(el) {
    const stim = {}; META.stimulus.forEach(s => { stim[s.id_stimulus] = s; });
    el.innerHTML = '<div class="card mb-2"><div class="row wrap"><div class="input-icon grow" style="min-width:200px">' + icon('search') + '<input class="input" id="fs-q" placeholder="Cari teks soal atau ID…" value="' + esc(fSoal.q) + '"></div>' +
      '<select class="select" id="fs-mapel" style="width:auto"><option value="">Semua Mapel</option>' + optMapel(fSoal.mapel) + '</select>' +
      '<select class="select" id="fs-komp" style="width:auto;max-width:260px"><option value="">Semua Kompetensi</option>' + optKomp(fSoal.komp, fSoal.mapel) + '</select>' +
      '<select class="select" id="fs-kes" style="width:auto"><option value="">Semua Level</option>' + ['mudah', 'sedang', 'sulit'].map(x => '<option' + (fSoal.kes === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select>' +
      '<select class="select" id="fs-tipe" style="width:auto"><option value="">Semua Tipe</option><option value="pg"' + (fSoal.tipe === 'pg' ? ' selected' : '') + '>Pilihan ganda</option><option value="pgk"' + (fSoal.tipe === 'pgk' ? ' selected' : '') + '>PG kompleks</option></select>' +
      '<select class="select" id="fs-st" style="width:auto"><option value="">Semua Status</option>' + ['aktif', 'draft', 'revisi'].map(x => '<option' + (fSoal.status === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></div></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>ID &amp; Mapel</th><th>Stimulus / Wacana</th><th>Teks Soal &amp; Kunci</th><th>Level &amp; Kognitif</th><th>Paket</th><th>Status</th><th></th></tr></thead><tbody id="tb-soal"></tbody></table><div id="pg-soal"></div></div>';
    const isi = () => {
      const q = fSoal.q.toLowerCase();
      const rows = BANK.filter(s => (!q || (s.id_soal + ' ' + s.teks_soal).toLowerCase().includes(q)) && (!fSoal.mapel || s.id_mapel === fSoal.mapel) && (!fSoal.komp || s.id_kompetensi === fSoal.komp) &&
        (!fSoal.kes || s.tingkat_kesulitan === fSoal.kes) && (!fSoal.tipe || s.tipe_soal === fSoal.tipe) && (!fSoal.status || s.status === fSoal.status));
      const maks = Math.max(1, Math.ceil(rows.length / fSoal.per)); if (fSoal.hal > maks) fSoal.hal = maks;
      const lvCls = { L1: 'chip-green', L2: 'chip-amber', L3: 'chip-red' }, lvNm = { L1: 'L1 – Pemahaman', L2: 'L2 – Penerapan', L3: 'L3 – Penalaran (HOTS)' };
      $('#tb-soal').innerHTML = rows.slice((fSoal.hal - 1) * fSoal.per, fSoal.hal * fSoal.per).map(s => {
        const st = stim[s.id_stimulus];
        return '<tr class="clickable" data-id="' + esc(s.id_soal) + '"><td style="min-width:130px"><b style="color:var(--primary)">' + esc(s.id_soal) + '</b><div class="xs" style="color:var(--primary)">' + esc(namaMapel(s.id_mapel)) + '</div><div class="xs muted">' + esc(namaKomp(s.id_kompetensi)) + '</div></td>' +
          '<td style="max-width:220px">' + (st ? '<div class="row">' + (st.gambar_url ? '<img src="' + esc(st.gambar_url) + '" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:.4rem">' : '<div class="icon-bubble" style="width:40px;height:40px">' + icon('book') + '</div>') + '<div><b class="small">' + esc(st.judul) + '</b><div class="xs muted">' + esc(st.id_stimulus) + '</div></div></div>' : (s.gambar_url ? '<img src="' + esc(s.gambar_url) + '" alt="" style="width:60px;height:44px;object-fit:cover;border-radius:.4rem">' : '<span class="muted xs">Tanpa stimulus</span>')) + '</td>' +
          '<td style="max-width:360px"><div>' + esc(s.teks_soal.length > 110 ? s.teks_soal.slice(0, 110) + '…' : s.teks_soal) + '</div><span class="chip chip-green mt-1">' + icon('check-circle') + 'Kunci: ' + esc(s.kunci) + ' (' + esc((s['opsi_' + String(s.kunci).split(',')[0].toLowerCase()] || '').slice(0, 30)) + ')</span><div class="xs muted mt-1">' + (s.tipe_soal === 'pgk' ? 'PG Kompleks' : 'Pilihan Ganda') + ' • Skor ' + esc(s.skor) + (s.pembahasan ? '' : ' • <span style="color:var(--warn-dark)">tanpa pembahasan</span>') + '</div></td>' +
          '<td><span class="chip ' + (lvCls[s.level_kognitif] || '') + '">' + esc(lvNm[s.level_kognitif] || s.level_kognitif) + '</span><div class="small mt-1">Tingkat: <b>' + esc(s.tingkat_kesulitan) + '</b></div></td>' +
          '<td>' + (s.paket.length ? s.paket.slice(0, 3).map(p => '<div class="chip mb-1" style="white-space:normal">' + esc(p) + '</div>').join('') : '<i class="muted small">Belum dipakai</i>') + '</td>' +
          '<td><span class="chip ' + (s.status === 'aktif' ? 'chip-green' : 'chip-amber') + '">' + esc(s.status) + '</span></td><td><button class="btn btn-ghost btn-icon btn-sm" data-del="' + esc(s.id_soal) + '" aria-label="Hapus">' + icon('trash') + '</button></td></tr>';
      }).join('') || '<tr><td colspan="7" class="empty">Tidak ada soal yang cocok.</td></tr>';
      $('#pg-soal').innerHTML = UI.pager(rows.length, fSoal.hal, fSoal.per, h => { fSoal.hal = h; isi(); });
      $$('#tb-soal tr[data-id]').forEach(tr => tr.onclick = e => { if (!e.target.closest('[data-del]')) editSoal(BANK.find(s => s.id_soal === tr.dataset.id)); });
      $$('#tb-soal [data-del]').forEach(b => b.onclick = async () => {
        const s = BANK.find(x => x.id_soal === b.dataset.del);
        if (!(await UI.confirm('Hapus soal ' + s.id_soal + '?', s.paket.length ? 'Soal ini dipakai di paket: <b>' + esc(s.paket.join(', ')) + '</b>. Soal akan otomatis dilewati di paket tersebut.' : 'Soal akan dihapus permanen.', { bahaya: true, ok: 'Hapus' }))) return;
        if (await UI.run(() => API.call('hapusSoal', { ids: [s.id_soal] }))) { UI.toast('Soal dihapus.', 'success'); await bank(true); isi(); }
      });
    };
    isi();
    $('#fs-q').oninput = UI.debounce(() => { fSoal.q = $('#fs-q').value; fSoal.hal = 1; isi(); }, 200);
    $('#fs-mapel').onchange = e => { fSoal.mapel = e.target.value; fSoal.komp = ''; fSoal.hal = 1; tabSoal(el); };
    [['fs-komp', 'komp'], ['fs-kes', 'kes'], ['fs-tipe', 'tipe'], ['fs-st', 'status']].forEach(p => { $('#' + p[0]).onchange = e => { fSoal[p[1]] = e.target.value; fSoal.hal = 1; isi(); }; });
  }

  function editSoal(s) {
    s = s || { tipe_soal: 'pg', tingkat_kesulitan: 'sedang', level_kognitif: 'L1', skor: 1, status: 'aktif', id_kompetensi: fSoal.komp || '', kunci: '' };
    const kunci = String(s.kunci || '').split(',');
    const m = UI.modal({ title: s.id_soal ? 'Ubah soal ' + esc(s.id_soal) : 'Tambah butir soal baru', size: 'lg', body: '<form class="grid-form" id="f-soal">' +
      '<div class="field"><label>Kompetensi / Bab</label><select class="select" name="id_kompetensi" required><option value="">— pilih —</option>' + META.mapel.map(mp => '<optgroup label="' + esc(mp.nama_mapel) + '">' + optKomp(s.id_kompetensi, mp.id_mapel) + '</optgroup>').join('') + '</select></div>' +
      '<div class="field"><label>Stimulus / wacana (opsional)</label><select class="select" name="id_stimulus"><option value="">Tanpa stimulus</option>' + META.stimulus.map(x => '<option value="' + esc(x.id_stimulus) + '"' + (x.id_stimulus === s.id_stimulus ? ' selected' : '') + '>' + esc(x.judul) + '</option>').join('') + '</select></div>' +
      '<div class="field full"><label>Teks soal</label><textarea class="textarea" name="teks_soal" required>' + esc(s.teks_soal || '') + '</textarea></div>' +
      '<div class="field full"><label>Gambar pendukung (grafik, tabel, ilustrasi) <span class="help">dikompres otomatis</span></label><div class="row wrap"><input type="file" accept="image/*" id="soal-img"><input type="hidden" name="id_file_gambar" value="' + esc(s.id_file_gambar || '') + '"><span id="soal-img-prev">' + (s.gambar_url ? '<img src="' + esc(s.gambar_url) + '" style="height:60px;border-radius:.4rem">' : '') + '</span>' + (s.id_file_gambar ? '<button type="button" class="btn btn-sm btn-ghost" id="soal-img-del">' + icon('x') + 'Lepas</button>' : '') + '</div></div>' +
      '<div class="field"><label>Tipe soal</label><select class="select" name="tipe_soal" id="soal-tipe"><option value="pg"' + (s.tipe_soal !== 'pgk' ? ' selected' : '') + '>Pilihan ganda (1 jawaban)</option><option value="pgk"' + (s.tipe_soal === 'pgk' ? ' selected' : '') + '>Pilihan ganda kompleks (≥1 jawaban)</option></select></div>' +
      '<div class="field"><label>Skor / bobot</label><input class="input" type="number" min="1" max="10" name="skor" value="' + esc(s.skor || 1) + '"></div>' +
      ['a', 'b', 'c', 'd'].map(L => '<div class="field"><div class="label"><span>Opsi ' + L.toUpperCase() + '</span><label class="check small"><input type="' + (s.tipe_soal === 'pgk' ? 'checkbox' : 'radio') + '" name="kunci" value="' + L.toUpperCase() + '"' + (kunci.indexOf(L.toUpperCase()) >= 0 ? ' checked' : '') + '> Kunci</label></div><input class="input" name="opsi_' + L + '" value="' + esc(s['opsi_' + L] || '') + '"' + (L < 'c' ? ' required' : '') + '></div>').join('') +
      '<div class="field full"><label>Pembahasan</label><textarea class="textarea" name="pembahasan" style="min-height:70px">' + esc(s.pembahasan || '') + '</textarea></div>' +
      '<div class="field"><label>Tingkat kesulitan</label><select class="select" name="tingkat_kesulitan">' + ['mudah', 'sedang', 'sulit'].map(x => '<option' + (s.tingkat_kesulitan === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Level kognitif</label><select class="select" name="level_kognitif">' + [['L1', 'L1 – Pemahaman'], ['L2', 'L2 – Penerapan'], ['L3', 'L3 – Penalaran (HOTS)']].map(x => '<option value="' + x[0] + '"' + (s.level_kognitif === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Indikator (opsional)</label><input class="input" name="indikator" value="' + esc(s.indikator || '') + '"></div>' +
      '<div class="field"><label>Status</label><select class="select" name="status">' + [['aktif', 'Aktif'], ['draft', 'Draft'], ['revisi', 'Perlu revisi']].map(x => '<option value="' + x[0] + '"' + (s.status === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div>' +
      '</form>', foot: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" id="ok-soal">' + icon('check') + 'Simpan Soal</button>' });
    const f = m.querySelector('#f-soal');
    m.querySelector('#soal-tipe').onchange = e => f.querySelectorAll('[name=kunci]').forEach(i => { i.type = e.target.value === 'pgk' ? 'checkbox' : 'radio'; });
    if (m.querySelector('#soal-img-del')) m.querySelector('#soal-img-del').onclick = () => { f.id_file_gambar.value = ''; m.querySelector('#soal-img-prev').innerHTML = ''; };
    m.querySelector('#soal-img').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      const b = await UI.bacaBerkas(file);
      const r = await UI.run(() => API.call('uploadFile', Object.assign(b, { tujuan: 'gambar' })));
      if (r) { f.id_file_gambar.value = r.id_file; m.querySelector('#soal-img-prev').innerHTML = '<img src="' + esc(b.base64) + '" style="height:60px;border-radius:.4rem">'; UI.toast('Gambar diunggah ke Drive.', 'success'); }
    };
    m.querySelector('#ok-soal').onclick = async () => {
      const data = Object.fromEntries(new FormData(f).entries());
      data.kunci = Array.from(f.querySelectorAll('[name=kunci]:checked')).map(i => i.value).join(',');
      if (s.id_soal) data.id_soal = s.id_soal;
      const r = await UI.run(() => API.call('simpanSoal', data));
      if (r) { m.close(); UI.toast('Soal ' + r.id_soal + ' disimpan.', 'success'); await bank(true); if ($('#bank-isi')) isiBank(); }
    };
  }

  function imporSoal() {
    const kolom = 'kompetensi,teks_soal,opsi_a,opsi_b,opsi_c,opsi_d,kunci,pembahasan,tingkat_kesulitan,level_kognitif,tipe_soal,id_stimulus,skor';
    const m = UI.modal({ title: 'Impor soal massal', size: 'lg', body: '<div class="stack"><div class="note-card small">Tempel data dari Google Sheets/Excel (baris pertama = judul kolom). Kolom: <span class="mono">' + kolom + '</span>. Kolom <b>kompetensi</b> boleh berisi ID (mis. K-N2) atau nama kompetensi persis.</div>' +
      '<div class="row wrap"><input type="file" accept=".csv,.tsv,.txt" id="is-file" class="small"><button class="btn btn-sm" id="is-tpl">' + icon('download') + 'Unduh templat + daftar kompetensi</button></div>' +
      '<textarea class="textarea mono" id="is-teks" style="min-height:200px"></textarea><div id="is-prev" class="small muted"></div></div>',
      foot: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" id="is-ok">' + icon('upload') + 'Impor</button>' });
    const prev = () => { const r = UI.parseCSV($('#is-teks').value); $('#is-prev').textContent = r.length ? r.length + ' baris terbaca.' : ''; return r; };
    $('#is-teks').oninput = prev;
    $('#is-file').onchange = e => { const fl = e.target.files[0]; if (!fl) return; const fr = new FileReader(); fr.onload = () => { $('#is-teks').value = fr.result; prev(); }; fr.readAsText(fl); };
    $('#is-tpl').onclick = () => UI.unduhTeks('templat_soal.csv', kolom + '\n' + UI.keCSV([[META.kompetensi[0] ? META.kompetensi[0].id_kompetensi : 'K-N1', 'Contoh: 12 + 30 = ...', '32', '42', '52', '62', 'B', '12 + 30 = 42', 'mudah', 'L1', 'pg', '', '1']]) +
      '\n\n# Daftar kompetensi (hapus baris ini sebelum impor)\n' + META.kompetensi.map(k => '# ' + k.id_kompetensi + ' = ' + k.nama_kompetensi).join('\n'));
    $('#is-ok').onclick = async () => {
      const rows = prev().filter(r => !String(r.kompetensi || '').startsWith('#'));
      if (!rows.length) return UI.toast('Belum ada baris.', 'warn');
      const r = await UI.run(() => API.call('imporSoal', { rows }));
      if (!r) return;
      m.close();
      UI.modal({ title: r.ditambahkan + ' soal berhasil diimpor', body: r.galat.length ? '<div class="note-card small"><b>Baris dilewati:</b><br>' + r.galat.map(esc).join('<br>') + '</div>' : '<p>Semua baris berhasil.</p>' });
      bankPage();
    };
  }

  function tabStimulus(el) {
    el.innerHTML = '<div class="row between mb-2"><p class="muted small">Stimulus dipakai bersama oleh beberapa soal (wacana cerita, tabel data, infografis). Untuk tabel, tulis baris dengan format <span class="mono">| kolom | kolom |</span>.</p><button class="btn btn-primary" id="st-baru">' + icon('plus') + 'Stimulus baru</button></div>' +
      '<div class="grid g3">' + (META.stimulus.map(s => '<div class="card pkg-card">' + (s.gambar_url ? '<img src="' + esc(s.gambar_url) + '" alt="" style="width:100%;height:140px;object-fit:cover;border-radius:.7rem">' : '') + '<div class="xs muted">' + esc(s.id_stimulus) + ' • dipakai ' + BANK.filter(b => b.id_stimulus === s.id_stimulus).length + ' soal</div><h3 style="font-size:1rem">' + esc(s.judul) + '</h3><p class="small muted">' + esc(String(s.isi_teks || '').slice(0, 140)) + (String(s.isi_teks || '').length > 140 ? '…' : '') + '</p><div class="row"><button class="btn btn-sm" data-ed="' + esc(s.id_stimulus) + '">' + icon('edit') + 'Ubah</button><button class="btn btn-sm btn-ghost" data-hp="' + esc(s.id_stimulus) + '">' + icon('trash') + 'Hapus</button></div></div>').join('') || '<div class="card empty">Belum ada stimulus.</div>') + '</div>';
    $('#st-baru').onclick = () => editStimulus(null);
    $$('[data-ed]', el).forEach(b => b.onclick = () => editStimulus(META.stimulus.find(s => s.id_stimulus === b.dataset.ed)));
    $$('[data-hp]', el).forEach(b => b.onclick = async () => { if (await UI.confirm('Hapus stimulus?', 'Stimulus yang masih dipakai soal tidak dapat dihapus.', { bahaya: true, ok: 'Hapus' }) && await UI.run(() => API.call('hapusStimulus', { id_stimulus: b.dataset.hp }))) { await meta(true); isiBank(); } });
  }

  function editStimulus(s) {
    s = s || {};
    const m = UI.modal({ title: s.id_stimulus ? 'Ubah stimulus' : 'Stimulus baru', size: 'lg', body: '<div class="stack"><div class="field"><label>Judul</label><input class="input" id="st-judul" value="' + esc(s.judul || '') + '"></div>' +
      '<div class="field"><label>Jenis</label><select class="select" id="st-jenis"><option value="teks">Teks / cerita</option><option value="gambar"' + (s.jenis === 'gambar' ? ' selected' : '') + '>Gambar / infografis</option></select></div>' +
      '<div class="field"><label>Gambar (opsional)</label><div class="row wrap"><input type="file" accept="image/*" id="st-img"><span id="st-prev">' + (s.gambar_url ? '<img src="' + esc(s.gambar_url) + '" style="height:60px;border-radius:.4rem">' : '') + '</span></div></div>' +
      '<div class="field"><label>Isi teks</label><textarea class="textarea" id="st-isi" style="min-height:220px">' + esc(s.isi_teks || '') + '</textarea><span class="help">Pisahkan paragraf dengan satu baris kosong.</span></div></div>',
      foot: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" id="st-ok">Simpan</button>' });
    let idGambar = s.id_file_gambar || '';
    m.querySelector('#st-img').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      const b = await UI.bacaBerkas(file);
      const r = await UI.run(() => API.call('uploadFile', Object.assign(b, { tujuan: 'gambar' })));
      if (r) { idGambar = r.id_file; m.querySelector('#st-prev').innerHTML = '<img src="' + esc(b.base64) + '" style="height:60px;border-radius:.4rem">'; }
    };
    m.querySelector('#st-ok').onclick = async () => {
      const r = await UI.run(() => API.call('simpanStimulus', { id_stimulus: s.id_stimulus, judul: $('#st-judul').value, jenis: $('#st-jenis').value, isi_teks: $('#st-isi').value, id_file_gambar: idGambar }));
      if (r) { m.close(); UI.toast('Stimulus disimpan.', 'success'); await meta(true); if ($('#bank-isi')) isiBank(); }
    };
  }

  function tabMateri(el) {
    el.innerHTML = '<div class="row between mb-2"><p class="muted small">Materi dikaitkan ke kompetensi dan otomatis muncul di rekomendasi belajar siswa.</p><button class="btn btn-primary" id="mt-baru">' + icon('plus') + 'Materi baru</button></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>Judul</th><th>Kompetensi</th><th>Isi</th><th>Berkas / Tautan</th><th></th></tr></thead><tbody>' +
      (META.materi.map(x => '<tr><td><b>' + esc(x.judul) + '</b></td><td>' + esc(namaKomp(x.id_kompetensi)) + '</td><td class="small" style="max-width:320px">' + esc(String(x.deskripsi || '').slice(0, 120)) + '</td><td>' + (x.url ? '<a target="_blank" rel="noopener" href="' + esc(x.url) + '">' + icon('link') + ' Buka</a>' : '<span class="muted small">-</span>') + '</td><td class="nowrap"><button class="btn btn-sm" data-ed="' + esc(x.id_materi) + '">' + icon('edit') + '</button> <button class="btn btn-sm btn-ghost" data-hp="' + esc(x.id_materi) + '">' + icon('trash') + '</button></td></tr>').join('') || '<tr><td colspan="5" class="empty">Belum ada materi.</td></tr>') + '</tbody></table></div>';
    $('#mt-baru').onclick = () => editMateri(null);
    $$('[data-ed]', el).forEach(b => b.onclick = () => editMateri(META.materi.find(x => x.id_materi === b.dataset.ed)));
    $$('[data-hp]', el).forEach(b => b.onclick = async () => { if (await UI.confirm('Hapus materi?', 'Materi akan dihapus dari daftar.', { bahaya: true, ok: 'Hapus' }) && await UI.run(() => API.call('hapusMateri', { id_materi: b.dataset.hp }))) { await meta(true); isiBank(); } });
  }

  function editMateri(x) {
    x = x || {};
    const m = UI.modal({ title: x.id_materi ? 'Ubah materi' : 'Materi baru', body: '<div class="stack"><div class="field"><label>Judul</label><input class="input" id="mt-judul" value="' + esc(x.judul || '') + '"></div>' +
      '<div class="field"><label>Kompetensi</label><select class="select" id="mt-komp">' + optKomp(x.id_kompetensi) + '</select></div>' +
      '<div class="field"><label>Ringkasan / isi singkat</label><textarea class="textarea" id="mt-desk">' + esc(x.deskripsi || '') + '</textarea></div>' +
      '<div class="field"><label>Tautan (video/artikel, opsional)</label><input class="input" id="mt-link" placeholder="https://…" value="' + esc(x.tautan || '') + '"></div>' +
      '<div class="field"><label>Unggah PDF (opsional, maks 8 MB)</label><input type="file" accept="application/pdf" id="mt-pdf"><span class="help" id="mt-pdf-st">' + (x.id_file_pdf ? 'PDF sudah terunggah.' : '') + '</span></div></div>',
      foot: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" id="mt-ok">Simpan</button>' });
    let idPdf = x.id_file_pdf || '';
    m.querySelector('#mt-pdf').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      if (file.size > 8 * 1024 * 1024) return UI.toast('PDF terlalu besar (maks 8 MB).', 'error');
      const b = await UI.bacaBerkas(file);
      const r = await UI.run(() => API.call('uploadFile', Object.assign(b, { tujuan: 'materi' })));
      if (r) { idPdf = r.id_file; m.querySelector('#mt-pdf-st').textContent = 'Terunggah: ' + r.nama; }
    };
    m.querySelector('#mt-ok').onclick = async () => {
      const r = await UI.run(() => API.call('simpanMateri', { id_materi: x.id_materi, judul: $('#mt-judul').value, id_kompetensi: $('#mt-komp').value, deskripsi: $('#mt-desk').value, tautan: $('#mt-link').value, id_file_pdf: idPdf }));
      if (r) { m.close(); UI.toast('Materi disimpan.', 'success'); await meta(true); if ($('#bank-isi')) isiBank(); }
    };
  }

  function tabKompetensi(el) {
    el.innerHTML = '<div class="grid g2">' + META.mapel.map(mp => '<div class="card"><div class="row between mb-2"><div class="card-title">' + esc(mp.nama_mapel) + '</div><button class="btn btn-sm" data-mp="' + esc(mp.id_mapel) + '">' + icon('edit') + '</button></div><div class="stack" style="gap:.4rem">' +
      META.kompetensi.filter(k => k.id_mapel === mp.id_mapel).map(k => '<div class="interv"><div class="row between"><b>' + esc(k.nama_kompetensi) + '</b><button class="btn btn-sm btn-ghost" data-k="' + esc(k.id_kompetensi) + '">' + icon('edit') + '</button></div><span class="xs muted">' + esc(k.id_kompetensi) + ' • ' + esc(k.bab) + ' • ' + BANK.filter(s => s.id_kompetensi === k.id_kompetensi).length + ' soal</span>' + (k.indikator ? '<span class="xs">' + esc(k.indikator) + '</span>' : '') + '</div>').join('') +
      '</div><button class="btn btn-sm btn-outline mt-2" data-baru="' + esc(mp.id_mapel) + '">' + icon('plus') + 'Kompetensi baru</button></div>').join('') + '</div><button class="btn btn-outline mt-2" id="mp-baru">' + icon('plus') + 'Mata pelajaran baru</button>';
    const formK = k => {
      k = k || {};
      const m = UI.modal({ title: k.id_kompetensi ? 'Ubah kompetensi' : 'Kompetensi baru', body: '<div class="stack"><div class="field"><label>Mata pelajaran</label><select class="select" id="kk-mp">' + optMapel(k.id_mapel) + '</select></div><div class="field"><label>Bab</label><input class="input" id="kk-bab" value="' + esc(k.bab || '') + '"></div><div class="field"><label>Nama kompetensi</label><input class="input" id="kk-nama" value="' + esc(k.nama_kompetensi || '') + '"></div><div class="field"><label>Indikator</label><textarea class="textarea" id="kk-ind">' + esc(k.indikator || '') + '</textarea></div></div>',
        foot: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" id="kk-ok">Simpan</button>' });
      m.querySelector('#kk-ok').onclick = async () => { if (await UI.run(() => API.call('simpanKompetensi', { id_kompetensi: k.id_kompetensi, id_mapel: $('#kk-mp').value, bab: $('#kk-bab').value, nama_kompetensi: $('#kk-nama').value, indikator: $('#kk-ind').value }))) { m.close(); await meta(true); isiBank(); } };
    };
    const formMp = mp => {
      mp = mp || {};
      const m = UI.modal({ title: mp.id_mapel ? 'Ubah mapel' : 'Mapel baru', body: '<div class="field"><label>Nama mata pelajaran</label><input class="input" id="mp-nama" value="' + esc(mp.nama_mapel || '') + '"></div>', foot: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" id="mp-ok">Simpan</button>' });
      m.querySelector('#mp-ok').onclick = async () => { if (await UI.run(() => API.call('simpanMapel', { id_mapel: mp.id_mapel, nama_mapel: $('#mp-nama').value }))) { m.close(); await meta(true); isiBank(); } };
    };
    $$('[data-k]', el).forEach(b => b.onclick = () => formK(META.kompetensi.find(k => k.id_kompetensi === b.dataset.k)));
    $$('[data-baru]', el).forEach(b => b.onclick = () => formK({ id_mapel: b.dataset.baru }));
    $$('[data-mp]', el).forEach(b => b.onclick = () => formMp(META.mapel.find(x => x.id_mapel === b.dataset.mp)));
    $('#mp-baru').onclick = () => formMp(null);
  }

  Object.assign(PAGES, { bank: bankPage });

  // ================= PAKET: LATIHAN / DIAGNOSTIK / TRY OUT (US-14..16) =================
  const INFO_PAKET = {
    latihan: ['Buat & Kelola Latihan', 'Susun paket latihan dari bank soal secara manual atau otomatis berdasarkan filter. Mendukung diferensiasi otomatis maupun kelompok.', ['latihan']],
    diagnostik: ['Kelola Diagnostik', 'Paket diagnostik memetakan kemampuan awal siswa per kompetensi dan menghasilkan rekomendasi pertama.', ['diagnostik']],
    tryout: ['Kelola Try Out & Evaluasi', 'Simulasi TKA berwaktu. Timer dihitung di server, jawaban tersimpan otomatis, dan dikumpulkan saat waktu habis.', ['tryout', 'evaluasi']]
  };

  async function paketPage(jenisHal) {
    await meta(true);
    const info = INFO_PAKET[jenisHal];
    const semua = await API.call('listPaket', {});
    const list = semua.filter(p => info[2].indexOf(p.jenis) >= 0);
    const jumlahSiswa = id => { const k = META.kelas.find(x => x.id_kelas === id); return k ? k.jumlah_siswa : META.kelas.reduce((a, x) => a + x.jumlah_siswa, 0); };
    main().innerHTML = head(UI.JENIS[info[2][0]], info[0], info[1], '<button class="btn btn-primary" id="pk-baru">' + icon('plus') + 'Buat Paket ' + esc(UI.JENIS[info[2][0]]) + '</button>') +
      (list.length ? '<div class="grid g3">' + list.map(p => {
        const n = jumlahSiswa(p.id_kelas);
        return '<div class="card pkg-card"><div class="row between"><span class="chip ' + (p.status === 'aktif' ? 'chip-green' : 'chip-gray') + '">' + (p.status === 'aktif' ? 'Aktif' : 'Draft') + '</span><span class="chip chip-outline">' + esc(UI.JENIS[p.jenis]) + '</span></div>' +
          '<h3 style="font-size:1.05rem">' + esc(p.judul) + '</h3><div class="meta"><span class="chip chip-outline">' + icon('list') + p.jumlah_soal + ' soal' + (Number(p.jumlah_tampil) ? ' (tampil ' + p.jumlah_tampil + ')' : '') + '</span>' + (Number(p.durasi_menit) ? '<span class="chip chip-outline">' + icon('timer') + p.durasi_menit + ' menit</span>' : '') +
          '<span class="chip chip-outline">' + icon('graduation') + esc(p.nama_kelas) + (p.nama_kelompok ? ' • ' + esc(p.nama_kelompok) : '') + '</span>' + (p.mode_diferensiasi ? '<span class="chip">' + icon('split') + esc(p.mode_diferensiasi) + '</span>' : '') + (p.sekali_kerjakan ? '<span class="chip chip-outline">1× kerja</span>' : '') + '</div>' +
          (p.buka_pada || p.tutup_pada ? '<div class="xs muted">' + (p.buka_pada ? 'Buka ' + UI.tgl(p.buka_pada, true) : '') + (p.tutup_pada ? ' • Tutup ' + UI.tgl(p.tutup_pada, true) : '') + '</div>' : '') +
          '<div><div class="row between small"><span>Selesai dikerjakan</span><b>' + p.jumlah_selesai + '/' + n + '</b></div>' + UI.bar(n ? 100 * p.jumlah_selesai / n : 0, 1, 0) + (p.jumlah_berlangsung ? '<div class="xs mt-1" style="color:var(--warn-dark)">' + icon('activity') + ' ' + p.jumlah_berlangsung + ' siswa sedang mengerjakan</div>' : '') + '</div>' +
          '<div class="row wrap"><button class="btn btn-primary btn-sm" data-hasil="' + esc(p.id_paket) + '">' + icon('chart') + 'Hasil</button><button class="btn btn-sm" data-ed="' + esc(p.id_paket) + '">' + icon('edit') + 'Ubah</button><button class="btn btn-sm btn-ghost" data-hp="' + esc(p.id_paket) + '">' + icon('trash') + '</button></div></div>';
      }).join('') + '</div>' : '<div class="card empty">' + icon('clipboard') + '<div>Belum ada paket. Klik "Buat Paket" untuk memulai.</div></div>');
    $('#pk-baru').onclick = () => editPaket(null, info[2][0]);
    $$('[data-ed]').forEach(b => b.onclick = () => editPaket(list.find(p => p.id_paket === b.dataset.ed)));
    $$('[data-hasil]').forEach(b => b.onclick = () => hasilPaket(b.dataset.hasil));
    $$('[data-hp]').forEach(b => b.onclick = async () => {
      if (!(await UI.confirm('Hapus paket?', 'Paket yang sudah dikerjakan siswa akan diarsipkan (hasil tetap tersimpan).', { bahaya: true, ok: 'Hapus' }))) return;
      const r = await UI.run(() => API.call('hapusPaket', { id_paket: b.dataset.hp }));
      if (r) { UI.toast(r.diarsipkan ? 'Paket diarsipkan.' : 'Paket dihapus.', 'success'); ulang(); }
    });
  }

  const isoKeLokal = v => { if (!v) return ''; const d = new Date(v); if (isNaN(d)) return ''; const z = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes()); };

  async function editPaket(p, jenis) {
    await meta(); await UI.run(() => bank());
    if (!BANK) return;
    p = p || { jenis: jenis || 'latihan', status: 'aktif', acak_soal: jenis === 'tryout', sekali_kerjakan: jenis !== 'latihan', tampil_pembahasan: jenis === 'latihan' ? 'per_soal' : 'akhir', durasi_menit: jenis === 'tryout' ? 60 : (jenis === 'diagnostik' ? 30 : 0), id_kelas: kelasAktif, daftar_id_soal: '' };
    const dipilih = new Set(String(p.daftar_id_soal || '').split(',').filter(Boolean));
    const kelompok = META.kelompok;
    const aktifSoal = BANK.filter(s => s.status === 'aktif');
    const m = UI.modal({ title: p.id_paket ? 'Ubah paket' : 'Paket baru', size: 'xl', body:
      '<div class="grid g2" style="align-items:start"><form class="grid-form" id="f-pk">' +
        '<div class="field full"><label>Judul paket</label><input class="input" name="judul" value="' + esc(p.judul || '') + '" placeholder="Contoh: Latihan Pecahan Minggu 2"></div>' +
        '<div class="field"><label>Jenis</label><select class="select" name="jenis">' + ['diagnostik', 'latihan', 'evaluasi', 'tryout'].map(j => '<option value="' + j + '"' + (p.jenis === j ? ' selected' : '') + '>' + UI.JENIS[j] + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Status</label><select class="select" name="status"><option value="aktif">Aktif (terlihat siswa)</option><option value="draft"' + (p.status === 'draft' ? ' selected' : '') + '>Draft</option></select></div>' +
        '<div class="field"><label>Kelas target</label><select class="select" name="id_kelas" id="pk-kelas"><option value="">Semua kelas saya</option>' + META.kelas.map(k => '<option value="' + esc(k.id_kelas) + '"' + (p.id_kelas === k.id_kelas ? ' selected' : '') + '>' + esc(k.nama_kelas) + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Kelompok target <span class="help">mode kelompok</span></label><select class="select" name="id_kelompok" id="pk-kel"></select></div>' +
        '<div class="field"><label>Mode diferensiasi</label><select class="select" name="mode_diferensiasi"><option value="">Ikuti pengaturan kelas</option><option value="otomatis"' + (p.mode_diferensiasi === 'otomatis' ? ' selected' : '') + '>Otomatis (sesuai kemampuan)</option><option value="kelompok"' + (p.mode_diferensiasi === 'kelompok' ? ' selected' : '') + '>Kelompok manual</option></select></div>' +
        '<div class="field"><label>Jumlah soal ditampilkan <span class="help">0 = semua</span></label><input class="input" type="number" min="0" name="jumlah_tampil" value="' + esc(Number(p.jumlah_tampil) || 0) + '"></div>' +
        '<div class="field"><label>Durasi (menit) <span class="help">0 = tanpa batas</span></label><input class="input" type="number" min="0" name="durasi_menit" value="' + esc(Number(p.durasi_menit) || 0) + '"></div>' +
        '<div class="field"><label>Pembahasan</label><select class="select" name="tampil_pembahasan"><option value="akhir">Setelah selesai</option><option value="per_soal"' + (p.tampil_pembahasan === 'per_soal' ? ' selected' : '') + '>Per soal (khusus latihan)</option><option value="tidak"' + (p.tampil_pembahasan === 'tidak' ? ' selected' : '') + '>Tidak ditampilkan</option></select></div>' +
        '<div class="field"><label>Jadwal buka</label><input class="input" type="datetime-local" name="buka_pada" value="' + isoKeLokal(p.buka_pada) + '"></div>' +
        '<div class="field"><label>Jadwal tutup</label><input class="input" type="datetime-local" name="tutup_pada" value="' + isoKeLokal(p.tutup_pada) + '"></div>' +
        '<label class="check"><input type="checkbox" name="acak_soal"' + (p.acak_soal === true || String(p.acak_soal).toUpperCase() === 'TRUE' ? ' checked' : '') + '> Acak urutan soal</label>' +
        '<label class="check"><input type="checkbox" name="sekali_kerjakan"' + (p.sekali_kerjakan === true || String(p.sekali_kerjakan).toUpperCase() === 'TRUE' ? ' checked' : '') + '> Hanya 1× pengerjaan</label>' +
        '<div class="full note-card small">' + icon('info') + ' Mode <b>Otomatis</b> + "jumlah ditampilkan" lebih kecil dari total soal → server memilih soal yang paling sesuai tingkat kemampuan tiap siswa. Mode <b>Kelompok</b> → paket hanya terlihat oleh anggota kelompok target.</div>' +
      '</form>' +
      '<div><div class="row between mb-1"><b>Pilih soal <span class="chip" id="pk-n">0</span></b><div class="row"><button type="button" class="btn btn-sm" id="pk-auto">' + icon('sparkles') + 'Pilih otomatis</button><button type="button" class="btn btn-sm btn-ghost" id="pk-clear">Kosongkan</button></div></div>' +
        '<div class="row wrap mb-1"><select class="select" id="pf-mapel" style="width:auto;min-height:36px"><option value="">Semua mapel</option>' + optMapel() + '</select><select class="select" id="pf-komp" style="width:auto;min-height:36px;max-width:220px"><option value="">Semua kompetensi</option>' + optKomp() + '</select><select class="select" id="pf-kes" style="width:auto;min-height:36px"><option value="">Semua level</option><option>mudah</option><option>sedang</option><option>sulit</option></select><label class="check small"><input type="checkbox" id="pf-pilih"> Hanya terpilih</label></div>' +
        '<div class="soal-pick" id="pk-list"></div></div></div>',
      foot: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" id="pk-ok">' + icon('check') + 'Simpan Paket</button>' });

    const isiKelompok = () => {
      const k = $('#pk-kelas').value;
      $('#pk-kel').innerHTML = '<option value="">Semua siswa di kelas</option>' + kelompok.filter(x => !k || x.id_kelas === k).map(x => '<option value="' + esc(x.id_kelompok) + '"' + (x.id_kelompok === p.id_kelompok ? ' selected' : '') + '>' + esc(x.nama_kelompok) + ' (' + x.anggota.length + ')</option>').join('');
    };
    isiKelompok(); $('#pk-kelas').onchange = isiKelompok;
    const saring = () => aktifSoal.filter(s => (!$('#pf-mapel').value || s.id_mapel === $('#pf-mapel').value) && (!$('#pf-komp').value || s.id_kompetensi === $('#pf-komp').value) && (!$('#pf-kes').value || s.tingkat_kesulitan === $('#pf-kes').value) && (!$('#pf-pilih').checked || dipilih.has(s.id_soal)));
    const isiList = () => {
      const rows = saring();
      $('#pk-list').innerHTML = rows.map(s => '<label><input type="checkbox" value="' + esc(s.id_soal) + '"' + (dipilih.has(s.id_soal) ? ' checked' : '') + '><div><b class="small">' + esc(s.id_soal) + '</b> <span class="chip chip-outline" style="font-size:.66rem">' + esc(s.tingkat_kesulitan) + '</span> <span class="xs muted">' + esc(namaKomp(s.id_kompetensi)) + '</span><div>' + esc(s.teks_soal.slice(0, 120)) + '</div></div></label>').join('') || '<div class="empty small">Tidak ada soal aktif yang cocok.</div>';
      $('#pk-n').textContent = dipilih.size + ' dipilih';
      $$('#pk-list input').forEach(c => c.onchange = () => { c.checked ? dipilih.add(c.value) : dipilih.delete(c.value); $('#pk-n').textContent = dipilih.size + ' dipilih'; });
    };
    isiList();
    $('#pf-mapel').onchange = () => { $('#pf-komp').innerHTML = '<option value="">Semua kompetensi</option>' + optKomp('', $('#pf-mapel').value); isiList(); };
    ['pf-komp', 'pf-kes', 'pf-pilih'].forEach(id => { $('#' + id).onchange = isiList; });
    $('#pk-clear').onclick = () => { dipilih.clear(); isiList(); };
    $('#pk-auto').onclick = () => {
      const am = UI.modal({ title: 'Pilih soal otomatis', body: '<p class="small muted mb-2">Soal diambil acak dari filter yang sedang aktif (mapel/kompetensi), dengan komposisi tingkat kesulitan berikut:</p><div class="grid g3"><div class="field"><label>Mudah</label><input class="input" type="number" min="0" id="au-1" value="3"></div><div class="field"><label>Sedang</label><input class="input" type="number" min="0" id="au-2" value="4"></div><div class="field"><label>Sulit</label><input class="input" type="number" min="0" id="au-3" value="3"></div></div>',
        foot: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" id="au-ok">Tambahkan</button>' });
      am.querySelector('#au-ok').onclick = () => {
        const basis = aktifSoal.filter(s => (!$('#pf-mapel').value || s.id_mapel === $('#pf-mapel').value) && (!$('#pf-komp').value || s.id_kompetensi === $('#pf-komp').value) && !dipilih.has(s.id_soal));
        let tambah = 0;
        [['mudah', '#au-1'], ['sedang', '#au-2'], ['sulit', '#au-3']].forEach(x => {
          const n = Number(am.querySelector(x[1]).value) || 0;
          basis.filter(s => s.tingkat_kesulitan === x[0]).sort(() => Math.random() - .5).slice(0, n).forEach(s => { dipilih.add(s.id_soal); tambah++; });
        });
        am.close(); isiList(); UI.toast(tambah + ' soal ditambahkan.', 'success');
      };
    };
    $('#pk-ok').onclick = async () => {
      const f = $('#f-pk');
      const d = Object.fromEntries(new FormData(f).entries());
      d.acak_soal = f.acak_soal.checked; d.sekali_kerjakan = f.sekali_kerjakan.checked;
      d.buka_pada = d.buka_pada ? new Date(d.buka_pada).toISOString() : '';
      d.tutup_pada = d.tutup_pada ? new Date(d.tutup_pada).toISOString() : '';
      d.daftar_id_soal = Array.from(dipilih);
      if (p.id_paket) d.id_paket = p.id_paket;
      const r = await UI.run(() => API.call('simpanPaket', d));
      if (r) { m.close(); UI.toast('Paket disimpan.', 'success'); BANK = null; const tujuan = d.jenis === 'evaluasi' ? 'tryout' : d.jenis; if (location.hash === '#/g/' + tujuan) ulang(); else location.hash = '#/g/' + tujuan; }
    };
  }

  async function hasilPaket(id) {
    const d = await UI.run(() => API.call('hasilPaket', { id_paket: id }));
    if (!d) return;
    const r = d.ringkasan;
    const m = UI.modal({ title: 'Hasil — ' + esc(d.paket.judul), size: 'xl', body:
      '<div class="grid g4 mb-2"><div class="card card-sky"><div class="stat-label">Selesai</div><div class="stat-num">' + r.selesai + '/' + r.total + '</div></div><div class="card card-sky"><div class="stat-label">Rata-rata</div><div class="stat-num blue">' + UI.angka(r.rata) + '</div></div><div class="card card-sky"><div class="stat-label">Tertinggi</div><div class="stat-num" style="color:var(--success-dark)">' + UI.angka(r.tertinggi) + '</div></div><div class="card card-sky"><div class="stat-label">Terendah</div><div class="stat-num" style="color:var(--danger-dark)">' + UI.angka(r.terendah) + '</div></div></div>' +
      '<div class="seg mb-2" id="hp-tab"><button class="on" data-t="siswa">Per siswa</button><button data-t="butir">Analisis butir soal</button></div>' +
      '<div id="hp-siswa"><div class="table-wrap" style="box-shadow:none"><table class="tbl"><thead><tr><th>Nama</th><th>Status</th><th class="num">Nilai</th><th>Waktu selesai</th><th>Durasi</th><th></th></tr></thead><tbody>' +
        d.siswa.sort((a, b) => (b.nilai || -1) - (a.nilai || -1)).map(s => '<tr><td>' + esc(s.nama) + '</td><td>' + (s.status === 'selesai' ? '<span class="chip chip-green">Selesai</span>' : (s.status === 'berlangsung' ? '<span class="chip chip-amber">Mengerjakan</span>' : '<span class="chip chip-gray">Belum</span>')) + '</td><td class="num bold">' + UI.angka(s.nilai) + '</td><td class="small">' + UI.tgl(s.waktu_selesai, true) + '</td><td class="small">' + (s.durasi_detik ? UI.durasi(s.durasi_detik) : '-') + '</td><td class="nowrap">' +
          (s.id_pengerjaan ? '<button class="btn btn-sm" data-rv="' + esc(s.id_pengerjaan) + '">' + icon('eye') + 'Jawaban</button> ' : '') + (s.status !== 'belum' ? '<button class="btn btn-sm btn-ghost" data-rs="' + esc(s.id_user) + '" title="Izinkan mengerjakan ulang">' + icon('refresh') + 'Buka ulang</button>' : '') + '</td></tr>').join('') + '</tbody></table></div></div>' +
      '<div id="hp-butir" class="hidden"><div class="table-wrap" style="box-shadow:none"><table class="tbl"><thead><tr><th>Soal</th><th>Kompetensi</th><th>Kunci</th><th>% Benar</th><th>Sebaran jawaban</th></tr></thead><tbody>' +
        d.butir.map(b => '<tr><td style="max-width:320px"><b class="small">' + esc(b.id_soal) + '</b> <span class="chip chip-outline" style="font-size:.66rem">' + esc(b.tingkat_kesulitan) + '</span><div class="small">' + esc(b.teks_soal) + '</div></td><td class="small">' + esc(b.nama_kompetensi) + '</td><td><b>' + esc(b.kunci) + '</b></td><td style="min-width:130px">' + (b.persen_benar === null ? '<span class="muted small">-</span>' : '<b>' + b.persen_benar + '%</b>' + UI.bar(b.persen_benar)) + '</td><td class="small nowrap">' + ['A', 'B', 'C', 'D'].map(L => '<span style="' + (String(b.kunci).indexOf(L) >= 0 ? 'color:var(--success-dark);font-weight:700' : '') + '">' + L + ':' + b.sebaran[L] + '</span>').join(' • ') + ' • kosong:' + b.sebaran.kosong + '</td></tr>').join('') + '</tbody></table></div><p class="xs muted mt-1">Soal dengan % benar sangat rendah perlu dicek ulang kunci/pembahasannya atau diajarkan ulang.</p></div>' });
    m.querySelectorAll('#hp-tab button').forEach(b => b.onclick = () => { m.querySelectorAll('#hp-tab button').forEach(x => x.classList.toggle('on', x === b)); m.querySelector('#hp-siswa').classList.toggle('hidden', b.dataset.t !== 'siswa'); m.querySelector('#hp-butir').classList.toggle('hidden', b.dataset.t !== 'butir'); });
    m.querySelectorAll('[data-rv]').forEach(b => b.onclick = () => Ujian.review(b.dataset.rv));
    m.querySelectorAll('[data-rs]').forEach(b => b.onclick = async () => {
      if (!(await UI.confirm('Buka ulang paket untuk siswa ini?', 'Siswa dapat mengerjakan paket ini lagi. Riwayat nilai sebelumnya tetap tersimpan.'))) return;
      if (await UI.run(() => API.call('resetPengerjaan', { id_paket: id, id_user: b.dataset.rs }))) { UI.toast('Paket dibuka ulang.', 'success'); m.close(); hasilPaket(id); }
    });
  }

  Object.assign(PAGES, { latihan: () => paketPage('latihan'), diagnostik: () => paketPage('diagnostik'), tryout: () => paketPage('tryout') });

  // ================= DIFERENSIASI (US-20) =================
  async function diferensiasi() {
    await meta(true);
    if (!kelasAktif) return tanpaKelas();
    const d = await API.call('getDiferensiasi', { id_kelas: kelasAktif });
    let kelompok = d.kelompok.map(k => ({ id_kelompok: k.id_kelompok, nama_kelompok: k.nama_kelompok, anggota: k.anggota.slice() }));
    const lvNm = { dasar: ['chip-red', 'Dasar'], cakap: ['chip-amber', 'Cakap'], mahir: ['chip-green', 'Mahir'] };
    main().innerHTML = head('Diferensiasi', 'Sistem Diferensiasi Pembelajaran', 'Pilih cara diferensiasi untuk kelas ini. Data tidak hilang saat berpindah mode. Di sisi siswa, label selalu memakai bahasa positif ("Latihan untuk kamu").') +
      '<div class="toolbar">' + selKelas() + '</div>' +
      '<div class="grid g2"><div class="card"><div class="card-title mb-2">Mode pembagian kelompok &amp; soal adaptif</div><div class="stack">' +
        '<label class="mode-card ' + (d.mode === 'otomatis' ? 'on' : '') + '"><input type="radio" name="mode" value="otomatis"' + (d.mode === 'otomatis' ? ' checked' : '') + '><div><b>Mode Otomatis</b> <span class="chip">Rekomendasi</span><div class="small muted mt-1">Sistem memilih tingkat kesulitan soal sesuai kemampuan tiap siswa. Patokannya hasil diagnostik yang terus diperbarui dari latihan harian.</div></div></label>' +
        '<label class="mode-card ' + (d.mode === 'kelompok' ? 'on' : '') + '"><input type="radio" name="mode" value="kelompok"' + (d.mode === 'kelompok' ? ' checked' : '') + '><div><b>Mode Kelompok Manual</b><div class="small muted mt-1">Guru menentukan kelompok (mis. Dasar, Cakap, Mahir) dan menugaskan paket berbeda ke tiap kelompok. Siswa hanya melihat paket kelompoknya.</div></div></label></div>' +
        '<div class="thr mt-2"><div class="r">INTERVENSI KHUSUS<b>Skor &lt; ' + d.batas_bawah + '</b>Modul remedial &amp; penguatan konsep.</div><div class="a">BERKEMBANG / CAKAP<b>' + d.batas_bawah + ' – ' + (d.kktp - 1) + '</b>Latihan mandiri tingkat standar.</div><div class="g">MAHIR &amp; PENGAYAAN<b>≥ ' + d.kktp + '</b>Soal HOTS &amp; pemecahan masalah.</div></div>' +
        '<p class="xs muted mt-1">Ambang dapat diubah di menu Pengaturan.</p></div>' +
        '<div class="card"><div class="card-title mb-1">Level siswa (bisa ditimpa manual)</div><p class="small muted mb-2">Level otomatis diperbarui setiap sesi latihan. Pilih level manual bila perlu menimpa.</p><div class="table-wrap" style="box-shadow:none;max-height:420px;overflow:auto"><table class="tbl"><thead><tr><th>Siswa</th><th class="num">Rata</th><th>Otomatis</th><th>Tetapkan manual</th></tr></thead><tbody>' +
          d.siswa.map(s => '<tr><td>' + esc(s.nama) + '</td><td class="num">' + UI.angka(s.rata) + '</td><td>' + (s.level_otomatis ? '<span class="chip ' + lvNm[s.level_otomatis][0] + '">' + lvNm[s.level_otomatis][1] + '</span>' : '<span class="muted xs">belum ada data</span>') + '</td><td><select class="select" style="min-height:34px;width:auto" data-lv="' + esc(s.id_user) + '"><option value="">— otomatis —</option>' + ['dasar', 'cakap', 'mahir'].map(l => '<option value="' + l + '"' + (s.level_manual === l ? ' selected' : '') + '>' + lvNm[l][1] + '</option>').join('') + '</select></td></tr>').join('') + '</tbody></table></div></div></div>' +
      '<div class="card mt-2"><div class="row between wrap mb-2"><div><div class="card-title">Kelompok belajar manual</div><div class="small muted">Dipakai saat mode Kelompok aktif. Satu siswa hanya berada di satu kelompok.</div></div><div class="row wrap"><button class="btn" id="kl-auto">' + icon('sparkles') + 'Isi otomatis dari hasil</button><button class="btn" id="kl-tambah">' + icon('plus') + 'Kelompok baru</button><button class="btn btn-primary" id="kl-simpan">' + icon('check') + 'Simpan Kelompok</button></div></div><div class="kanban" id="kl-board"></div></div>';

    const warna = ['red', 'amber', 'green', 'blue'];
    const board = () => {
      const tanpa = d.siswa.filter(s => !kelompok.some(k => k.anggota.indexOf(s.id_user) >= 0));
      const opsi = sel => '<option value="">Tanpa kelompok</option>' + kelompok.map((k, i) => '<option value="' + i + '"' + (sel === i ? ' selected' : '') + '>' + esc(k.nama_kelompok) + '</option>').join('');
      const chip = (s, i) => '<div class="kchip"><span>' + esc(s.nama) + ' <span class="xs muted">' + UI.angka(s.rata) + '</span></span><select class="select" style="min-height:30px;width:auto;font-size:.78rem;padding:.2rem .4rem" data-pindah="' + esc(s.id_user) + '">' + opsi(i) + '</select></div>';
      $('#kl-board').innerHTML = kelompok.map((k, i) => '<div class="kcol ' + warna[i % 4] + '"><div class="row between"><input class="input" style="min-height:34px;font-weight:700;background:transparent;border-color:transparent" value="' + esc(k.nama_kelompok) + '" data-nama="' + i + '"><button class="btn btn-ghost btn-icon btn-sm" data-hapus-kl="' + i + '" aria-label="Hapus kelompok">' + icon('trash') + '</button></div><div class="xs muted">' + k.anggota.length + ' siswa</div>' +
        k.anggota.map(id => d.siswa.find(s => s.id_user === id)).filter(Boolean).map(s => chip(s, i)).join('') + '</div>').join('') +
        '<div class="kcol" style="background:#F8FAFC;border:1.5px dashed var(--border-2)"><b>Belum berkelompok</b><div class="xs muted">' + tanpa.length + ' siswa</div>' + tanpa.map(s => chip(s, -1)).join('') + '</div>';
      $$('[data-pindah]').forEach(sel => sel.onchange = () => {
        kelompok.forEach(k => { k.anggota = k.anggota.filter(x => x !== sel.dataset.pindah); });
        if (sel.value !== '') kelompok[Number(sel.value)].anggota.push(sel.dataset.pindah);
        board();
      });
      $$('[data-nama]').forEach(inp => inp.oninput = () => { kelompok[Number(inp.dataset.nama)].nama_kelompok = inp.value; });
      $$('[data-hapus-kl]').forEach(b => b.onclick = () => { kelompok.splice(Number(b.dataset.hapusKl), 1); board(); });
    };
    board();
    pasangSel(diferensiasi);
    $$('input[name=mode]').forEach(r => r.onchange = async () => {
      const ok = await UI.run(() => API.call('simpanDiferensiasi', { id_kelas: kelasAktif, mode: r.value }));
      if (ok) { UI.toast('Mode diferensiasi: ' + r.value, 'success'); $$('.mode-card').forEach(c => c.classList.toggle('on', c.contains(r))); }
    });
    $$('[data-lv]').forEach(s => s.onchange = async () => { if (await UI.run(() => API.call('setLevelSiswa', { id_user: s.dataset.lv, level: s.value }))) UI.toast('Level siswa diperbarui.', 'success'); });
    $('#kl-tambah').onclick = () => { kelompok.push({ id_kelompok: '', nama_kelompok: 'Kelompok ' + (kelompok.length + 1), anggota: [] }); board(); };
    $('#kl-simpan').onclick = async () => { if (await UI.run(() => API.call('simpanKelompok', { id_kelas: kelasAktif, kelompok }))) { UI.toast('Kelompok disimpan.', 'success'); META = null; diferensiasi(); } };
    $('#kl-auto').onclick = async () => {
      if (!(await UI.confirm('Isi kelompok otomatis?', 'Siswa akan ditempatkan ke kelompok <b>Dasar</b>, <b>Cakap</b>, atau <b>Mahir</b> sesuai level (manual atau otomatis). Kelompok lain akan dikosongkan.'))) return;
      if (await UI.run(() => API.call('kelompokOtomatis', { id_kelas: kelasAktif }))) { UI.toast('Kelompok diisi otomatis.', 'success'); META = null; diferensiasi(); }
    };
  }

  // ================= LAPORAN (US-19) =================
  async function laporan() {
    await meta();
    if (!kelasAktif) return tanpaKelas();
    const list = (await API.call('listSiswa', { id_kelas: kelasAktif })).filter(s => s.status_aktif);
    main().innerHTML = head('Laporan', 'Laporan PDF', 'Buat laporan PDF per siswa dan per kelas: ringkasan nilai, grafik perkembangan, kompetensi yang dikuasai dan masih lemah, serta rekomendasi. PDF tersimpan di Google Drive dan dapat dicetak untuk sekolah dan orang tua.') +
      '<div class="toolbar">' + selKelas() + selMapel() + '</div>' +
      '<div class="grid g2"><div class="card"><div class="row"><div class="icon-bubble">' + icon('users') + '</div><div class="grow"><div class="card-title">Laporan Kelas</div><div class="small muted">Ringkasan kesiapan, penguasaan per kompetensi, rekomendasi intervensi, dan daftar siswa.</div></div></div><button class="btn btn-primary mt-2" id="lp-kelas">' + icon('file') + 'Buat PDF Kelas</button></div>' +
      '<div class="card"><div class="row"><div class="icon-bubble green">' + icon('printer') + '</div><div class="grow"><div class="card-title">Kartu Login Siswa</div><div class="small muted">Cetak kartu berisi username, kode, dan QR (8 kartu per A4).</div></div></div><button class="btn mt-2" id="lp-kartu">' + icon('printer') + 'Cetak Kartu</button></div></div>' +
      '<div class="table-wrap mt-2"><table class="tbl"><thead><tr><th>Siswa</th><th class="num">Rata-rata</th><th>Sesi</th><th></th></tr></thead><tbody>' +
        list.map(s => '<tr><td><div class="person">' + UI.avatar(s.nama) + '<div><b>' + esc(s.nama) + '</b><span>NISN ' + esc(s.nisn || '-') + '</span></div></div></td><td class="num">' + UI.angka(s.rata, '%') + '</td><td>' + s.jumlah_sesi + '</td><td><button class="btn btn-sm" data-pdf="' + esc(s.id_user) + '">' + icon('file') + 'PDF Siswa</button></td></tr>').join('') + '</tbody></table></div>' +
      '<p class="xs muted mt-1">Pembuatan PDF dilakukan sesuai permintaan untuk menghemat kuota harian Google Apps Script.</p>';
    pasangSel(laporan);
    $('#lp-kelas').onclick = () => buatPdf('laporanKelas', { id_kelas: kelasAktif, id_mapel: mapelAktif });
    $('#lp-kartu').onclick = async () => cetakKartu(await API.call('listSiswa', { id_kelas: kelasAktif }).then(l => l.filter(s => s.status_aktif)));
    $$('[data-pdf]').forEach(b => b.onclick = () => buatPdf('laporanSiswa', { id_user: b.dataset.pdf }));
  }

  // ================= PENGATURAN =================
  async function pengaturan() {
    await meta(true);
    const p = META.pengaturan;
    main().innerHTML = head('Pengaturan', 'Pengaturan &amp; Konfigurasi', 'Profil sekolah, ambang ketuntasan (KKTP), sesi login, dan keamanan akun.') +
      '<div class="grid g2"><form class="card" id="f-atur"><div class="card-title mb-2">' + icon('graduation') + ' Identitas &amp; ambang penilaian</div><div class="grid-form">' +
        '<div class="field full"><label>Nama sekolah</label><input class="input" name="NAMA_SEKOLAH" value="' + esc(p.NAMA_SEKOLAH) + '"></div>' +
        '<div class="field"><label>Tahun ajaran</label><input class="input" name="TAHUN_AJARAN" value="' + esc(p.TAHUN_AJARAN) + '"></div>' +
        '<div class="field"><label>Jumlah soal latihan harian</label><input class="input" type="number" min="3" max="30" name="JUMLAH_SOAL_HARIAN" value="' + esc(p.JUMLAH_SOAL_HARIAN) + '"></div>' +
        '<div class="field"><label>KKTP / ambang menguasai (%)</label><input class="input" type="number" min="1" max="100" name="KKTP" value="' + esc(p.KKTP) + '"></div>' +
        '<div class="field"><label>Batas bawah "belum" (%)</label><input class="input" type="number" min="0" max="99" name="BATAS_BAWAH" value="' + esc(p.BATAS_BAWAH) + '"></div>' +
        '<div class="field full"><label>Logout otomatis bila tidak aktif (menit)</label><input class="input" type="number" min="5" max="360" name="SESI_MENIT" value="' + esc(p.SESI_MENIT) + '"></div>' +
        '<div class="full thr"><div class="r">Belum<b>&lt; ' + esc(p.BATAS_BAWAH) + '%</b></div><div class="a">Berkembang<b>' + esc(p.BATAS_BAWAH) + '–' + (Number(p.KKTP) - 1) + '%</b></div><div class="g">Menguasai<b>≥ ' + esc(p.KKTP) + '%</b></div></div>' +
      '</div><button class="btn btn-primary mt-2">' + icon('check') + 'Simpan Pengaturan</button></form>' +
      '<div class="stack"><div class="card"><div class="card-title mb-2">' + icon('lock') + ' Keamanan akun</div><p class="small muted">Kata sandi disimpan sebagai hash + salt. Ganti kata sandi bawaan setelah pertama kali masuk.</p><button class="btn mt-2" id="b-sandi">' + icon('key') + 'Ganti kata sandi</button></div>' +
        '<div class="card"><div class="card-title mb-2">' + icon('database') + ' Backend Google Workspace</div><div class="small stack" style="gap:.4rem"><div class="row between"><span>Server</span><span class="chip chip-green">Terhubung</span></div><div class="row between"><span>Alamat API</span><span class="mono xs" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(window.APP_CONFIG.GAS_URL) + '</span></div><div class="row between"><span>Simpan otomatis jawaban</span><b>tiap ' + (window.APP_CONFIG.AUTOSAVE_DETIK || 30) + ' detik</b></div></div><p class="xs muted mt-1">Backup harian: jalankan fungsi <span class="mono">pasangTriggerBackup()</span> sekali di editor Apps Script.</p></div>' +
        '<div class="card"><div class="card-title mb-2">' + icon('graduation') + ' Kelas yang saya kelola</div>' + META.kelas.map(k => '<div class="row between small" style="padding:.3rem 0"><span>' + esc(k.nama_kelas) + '</span><span class="muted">' + k.jumlah_siswa + ' siswa</span></div>').join('') + '<button class="btn btn-sm mt-1" id="b-kelas2">' + icon('plus') + 'Kelola kelas</button></div></div></div>';
    $('#f-atur').onsubmit = async e => {
      e.preventDefault();
      const r = await UI.run(() => API.call('simpanPengaturan', Object.fromEntries(new FormData(e.target).entries())));
      if (r) { UI.toast('Pengaturan disimpan.', 'success'); META = null; pengaturan(); }
    };
    $('#b-sandi').onclick = gantiSandi;
    $('#b-kelas2').onclick = kelolaKelas;
  }

  function gantiSandi() {
    const m = UI.modal({ title: 'Ganti kata sandi', body: '<div class="stack"><div class="field"><label>Kata sandi lama</label><input class="input" type="password" id="pw-lama" autocomplete="current-password"></div><div class="field"><label>Kata sandi baru (min. 8 karakter)</label><input class="input" type="password" id="pw-baru" autocomplete="new-password"></div><div class="field"><label>Ulangi kata sandi baru</label><input class="input" type="password" id="pw-baru2" autocomplete="new-password"></div></div>',
      foot: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" id="pw-ok">Simpan</button>' });
    m.querySelector('#pw-ok').onclick = async () => {
      if ($('#pw-baru').value !== $('#pw-baru2').value) return UI.toast('Konfirmasi kata sandi tidak sama.', 'error');
      if (await UI.run(() => API.call('gantiPassword', { lama: $('#pw-lama').value, baru: $('#pw-baru').value }))) { m.close(); UI.toast('Kata sandi berhasil diganti.', 'success'); }
    };
  }

  Object.assign(PAGES, { diferensiasi, laporan, pengaturan });

  return { render, gantiSandi, editPaket };
})();
window.Guru = Guru;
