/* ============================================================
   UJIAN — runner diagnostik / latihan / try out
   - timer dari server (anti manipulasi), autosave batch berkala
   - cadangan jawaban di perangkat bila koneksi putus
   ============================================================ */
const Ujian = (() => {
  const { $, esc, icon } = UI;
  let S = null;          // state ujian aktif
  let tTimer = null, tSave = null;

  const kunciLokal = id => 'siaptka_jwb_' + id;

  function hentikan() {
    clearInterval(tTimer); clearInterval(tSave); tTimer = tSave = null;
    document.removeEventListener('visibilitychange', onHidden);
    window.removeEventListener('beforeunload', onUnload);
    if (S && S.dirty && !S.selesai) simpan(true);
    S = null;
  }

  /** Dipanggil router: #/ujian/<id_paket | harian | bab-ID_KOMPETENSI> */
  async function dariRute(arg) {
    if (S && (S.id_paket === arg)) return render();
    hentikan();
    if (arg === 'hasil' || !arg) { location.replace('#/s/hasil'); return; }
    const v = $('#view-ujian');
    v.innerHTML = '<div class="exam"><div class="card" style="padding:3rem;text-align:center"><div class="spinner" style="margin:0 auto 1rem"></div><b>Menyiapkan soal…</b><p class="muted small mt-1">Mohon tunggu sebentar ya.</p></div></div>';
    try {
      let r;
      if (arg === 'harian') r = await API.call('mulaiLatihanHarian', {});
      else if (String(arg).indexOf('bab-') === 0) r = await API.call('mulaiLatihanKompetensi', { id_kompetensi: decodeURIComponent(arg.slice(4)) });
      else r = await API.call('mulaiPaket', { id_paket: decodeURIComponent(arg) });
      if (r.sudah_selesai) { history.replaceState(null, '', '#/ujian/hasil'); return tampilHasil(r.hasil); }
      mulai(r);
    } catch (e) {
      v.innerHTML = '<div class="exam"><div class="card center" style="padding:3rem">' + icon('alert') + '<h2 class="mt-1">Belum bisa dimulai</h2><p class="muted mt-1">' + esc(e.message) + '</p><a class="btn btn-primary mt-2" href="#/s/beranda">Kembali ke Beranda</a></div></div>';
      UI.hydrateIcons(v);
    }
  }

  function mulai(r) {
    let jawaban = r.jawaban || {}, ragu = r.ragu || [];
    try {
      const lokal = JSON.parse(localStorage.getItem(kunciLokal(r.id_pengerjaan)) || 'null');
      if (lokal) { jawaban = Object.assign({}, jawaban, lokal.jawaban || {}); ragu = lokal.ragu || ragu; }
    } catch (e) { /* abaikan */ }
    S = {
      id_pengerjaan: r.id_pengerjaan, id_paket: r.paket.id_paket, paket: r.paket, soal: r.soal,
      jawaban: jawaban, ragu: new Set(ragu), idx: 0, waktu: {}, mulaiSoal: Date.now(), cek: {},
      deadline: r.sisa_detik === null || r.sisa_detik === undefined ? null : Date.now() + r.sisa_detik * 1000,
      dirty: Object.keys(jawaban).length > Object.keys(r.jawaban || {}).length, menyimpan: false, gagalSimpan: 0, selesai: false
    };
    history.replaceState(null, '', '#/ujian/' + encodeURIComponent(S.id_paket));
    // Lompat ke soal pertama yang belum dijawab
    const belum = S.soal.findIndex(q => !S.jawaban[q.id_soal]);
    S.idx = belum > 0 ? belum : 0;
    render();
    if (S.deadline) { tTimer = setInterval(tick, 1000); tick(); }
    tSave = setInterval(() => { if (S && S.dirty) simpan(); }, (window.APP_CONFIG.AUTOSAVE_DETIK || 30) * 1000);
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('beforeunload', onUnload);
  }

  function onHidden() { if (document.hidden && S && S.dirty) simpan(); }
  function onUnload(e) { if (S && !S.selesai && S.dirty) { simpanLokal(); e.preventDefault(); e.returnValue = ''; } }

  function simpanLokal() {
    if (!S) return;
    try { localStorage.setItem(kunciLokal(S.id_pengerjaan), JSON.stringify({ jawaban: S.jawaban, ragu: Array.from(S.ragu) })); } catch (e) { /* abaikan */ }
  }

  function catatWaktu() {
    if (!S) return;
    const q = S.soal[S.idx];
    S.waktu[q.id_soal] = (S.waktu[q.id_soal] || 0) + (Date.now() - S.mulaiSoal) / 1000;
    S.mulaiSoal = Date.now();
  }

  async function simpan(diam) {
    if (!S || S.menyimpan || S.selesai) return;
    S.menyimpan = true; S.dirty = false; statusSimpan('menyimpan');
    const st = S;
    try {
      const r = await API.call('simpanJawaban', { id_pengerjaan: st.id_pengerjaan, jawaban: st.jawaban, ragu: Array.from(st.ragu) });
      st.gagalSimpan = 0;
      if (r.selesai) { st.selesai = true; bersihkan(st); if (r.hasil) tampilHasil(r.hasil); return; }
      if (r.sisa_detik !== null && r.sisa_detik !== undefined && st.deadline) st.deadline = Date.now() + r.sisa_detik * 1000;
      if (S === st) statusSimpan('ok');
    } catch (e) {
      st.dirty = true; st.gagalSimpan++;
      if (S === st) statusSimpan('gagal');
      if (!diam && st.gagalSimpan === 1) UI.toast('Koneksi bermasalah. Jawaban tetap tersimpan di perangkat ini.', 'warn');
    } finally { st.menyimpan = false; }
  }

  function statusSimpan(s) {
    const el = $('#save-state'); if (!el) return;
    el.innerHTML = s === 'menyimpan' ? '<span class="spinner sm"></span> Menyimpan…' : (s === 'gagal' ? icon('alert') + ' Tersimpan di perangkat' : icon('check-circle') + ' Tersimpan');
    el.style.color = s === 'gagal' ? 'var(--warn-dark)' : '';
  }

  function tick() {
    if (!S || !S.deadline) return;
    const sisa = Math.max(0, (S.deadline - Date.now()) / 1000);
    const el = $('#timer-val');
    if (el) { el.textContent = UI.durasi(sisa); el.parentElement.classList.toggle('warn', sisa <= 300); }
    if (sisa <= 0 && !S.selesai) { clearInterval(tTimer); UI.toast('Waktu habis! Jawabanmu dikumpulkan otomatis.', 'warn'); kumpul(true); }
  }

  // ---------------- RENDER ----------------
  function render() {
    if (!S) return;
    const v = $('#view-ujian');
    const q = S.soal[S.idx];
    const n = S.soal.length;
    const adaKiri = !!q.stimulus;
    const tipeLabel = q.tipe_soal === 'pgk' ? 'Pilihan Ganda Kompleks' : 'Pilihan Ganda Tunggal';
    const cek = S.cek[q.id_soal];
    const jw = String(S.jawaban[q.id_soal] || '').split(',').filter(Boolean);

    let kiri = '';
    if (adaKiri) {
      const st = q.stimulus;
      kiri = '<section class="stim"><div class="stim-head"><span class="row">' + icon('book') + 'Wacana / Stimulus</span><span class="chip chip-outline">' + esc(st.jenis === 'gambar' ? 'Stimulus Gambar' : 'Stimulus Teks') + '</span></div>' +
        '<div class="stim-body">' + (st.gambar_url ? '<img src="' + esc(st.gambar_url) + '" alt="Gambar stimulus" loading="lazy">' : '') +
        '<h3>' + esc(st.judul) + '</h3>' + UI.teksKaya(st.isi_teks, { drop: true }) + '</div>' +
        '<div class="stim-foot"><span class="row">' + icon('info') + 'Gulir untuk membaca wacana lengkap</span><b style="color:var(--primary-dark)">Soal ' + (S.idx + 1) + '</b></div></section>';
    }
    const opsi = ['A', 'B', 'C', 'D'].filter(L => q.opsi[L] !== '' && q.opsi[L] !== undefined && q.opsi[L] !== null).map(L => {
      let cls = jw.indexOf(L) >= 0 ? 'on' : '';
      if (cek) {
        const kunci = String(cek.kunci).split(',');
        cls = kunci.indexOf(L) >= 0 ? 'ok' : (jw.indexOf(L) >= 0 ? 'bad' : '');
      }
      return '<button type="button" class="opt ' + cls + (q.tipe_soal === 'pgk' ? ' multi' : '') + '" data-opsi="' + L + '"' + (cek ? ' disabled' : '') + ' aria-pressed="' + (jw.indexOf(L) >= 0) + '">' +
        '<span class="L">' + L + '</span><span class="t">' + esc(q.opsi[L]) + '</span><span class="tick">' + icon('check') + '</span></button>';
    }).join('');

    const kanan = '<section class="qcard">' +
      '<div class="row between wrap"><span class="chip chip-green">' + icon('check-circle') + tipeLabel + '</span>' + (q.skor > 1 ? '<span class="chip chip-outline">Bobot ' + q.skor + '</span>' : '') + '</div>' +
      (q.gambar_url ? '<img class="q-img" src="' + esc(q.gambar_url) + '" alt="Gambar soal" loading="lazy">' : '') +
      '<div class="qtext">' + esc(q.teks_soal) + '</div>' +
      (q.tipe_soal === 'pgk' ? '<div class="chip chip-amber" style="align-self:flex-start">' + icon('info') + 'Pilih lebih dari satu jawaban yang benar</div>' : '') +
      '<div class="opts">' + opsi + '</div>' +
      (S.paket.per_soal ? (cek
        ? '<div class="feedback ' + (cek.benar ? 'ok' : 'bad') + '"><b>' + (cek.benar ? 'Hebat, jawabanmu benar!' : 'Belum tepat, tidak apa-apa!') + '</b> Kunci: <b>' + esc(cek.kunci) + '</b>' + (cek.pembahasan ? '<div class="mt-1">' + esc(cek.pembahasan) + '</div>' : '') + '</div>'
        : '<button class="btn btn-outline" id="btn-cek"' + (jw.length ? '' : ' disabled') + '>' + icon('eye') + 'Periksa Jawaban &amp; Lihat Pembahasan</button>') : '') +
      '<div class="hintbox">' + icon('bulb') + '<span>Klik salah satu pilihan jawaban. Jawaban tersimpan otomatis secara berkala. <span id="save-state" class="save-state"></span></span></div>' +
      '</section>';

    const terjawab = S.soal.filter(x => S.jawaban[x.id_soal]).length;
    v.innerHTML = '<div class="exam">' +
      '<div class="exam-top">' +
        '<div class="row wrap" style="gap:1.2rem">' +
          '<div class="qnum"><div class="n">' + (S.idx + 1) + '</div><div><h2>Soal Nomor ' + (S.idx + 1) + '</h2><div class="muted small">Dari total ' + n + ' butir • ' + terjawab + ' terjawab</div></div></div>' +
          '<div class="row small"><span class="muted hide-sm">Ukuran Font:</span><div class="fontctl light" data-fontctl></div></div>' +
        '</div>' +
        '<div class="row wrap">' +
          '<button class="btn btn-sm" id="btn-info">' + icon('info') + '<span>Informasi Soal</span></button>' +
          (S.deadline ? '<div class="timer">' + icon('timer') + '<span class="hide-sm">Sisa Waktu:</span><b id="timer-val">--:--:--</b></div>' : '<span class="chip chip-gray">' + icon('clock') + 'Tanpa batas waktu</span>') +
          '<button class="btn btn-primary" id="btn-daftar">' + icon('grid') + 'Daftar Soal</button>' +
        '</div>' +
        '<div style="flex-basis:100%"><span class="chip">' + icon('book') + esc((q.nama_mapel || 'TKA SD') + ' • ' + S.paket.judul) + '</span></div>' +
      '</div>' +
      '<div class="exam-body ' + (adaKiri ? '' : 'single') + '">' + kiri + kanan + '</div>' +
      '</div>' +
      '<nav class="exam-nav"><div class="inner">' +
        '<button class="btn btn-prev" id="btn-prev"' + (S.idx === 0 ? ' disabled' : '') + '>' + icon('arrow-left') + '<span class="lbl-long">Soal sebelumnya</span></button>' +
        '<button class="btn btn-doubt ' + (S.ragu.has(q.id_soal) ? 'on' : '') + '" id="btn-ragu"><span class="box">' + (S.ragu.has(q.id_soal) ? icon('check') : '') + '</span>Ragu-ragu</button>' +
        (S.idx < n - 1
          ? '<button class="btn btn-primary" id="btn-next"><span class="lbl-long">Soal berikutnya</span>' + icon('arrow-right') + '</button>'
          : '<button class="btn btn-success" id="btn-kumpul">' + icon('send') + 'Selesai</button>') +
      '</div></nav>';

    UI.initFont();
    v.querySelectorAll('.opt').forEach(b => b.onclick = () => pilih(b.dataset.opsi));
    $('#btn-prev').onclick = () => pindah(S.idx - 1);
    if ($('#btn-next')) $('#btn-next').onclick = () => pindah(S.idx + 1);
    if ($('#btn-kumpul')) $('#btn-kumpul').onclick = () => konfirmasiKumpul();
    $('#btn-ragu').onclick = () => { S.ragu.has(q.id_soal) ? S.ragu.delete(q.id_soal) : S.ragu.add(q.id_soal); S.dirty = true; simpanLokal(); render(); };
    $('#btn-daftar').onclick = daftarSoal;
    $('#btn-info').onclick = () => UI.modal({ title: 'Informasi Soal', body: '<div class="stack"><div><span class="muted small">Paket</span><div class="bold">' + esc(S.paket.judul) + '</div></div><div><span class="muted small">Mata pelajaran</span><div class="bold">' + esc(q.nama_mapel || '-') + '</div></div><div><span class="muted small">Kompetensi</span><div class="bold">' + esc(q.nama_kompetensi || '-') + '</div></div><div><span class="muted small">Jenis soal</span><div class="bold">' + tipeLabel + '</div></div><div class="note-card">Jawabanmu disimpan otomatis setiap ' + (window.APP_CONFIG.AUTOSAVE_DETIK || 30) + ' detik dan saat kamu menekan Selesai.</div></div>' });
    if ($('#btn-cek')) $('#btn-cek').onclick = cekJawaban;
    if (S.deadline) tick();
    if (S.gagalSimpan > 0) statusSimpan('gagal'); else if (!S.dirty) statusSimpan('ok');
  }

  function pilih(L) {
    const q = S.soal[S.idx];
    if (S.cek[q.id_soal]) return;
    let jw = String(S.jawaban[q.id_soal] || '').split(',').filter(Boolean);
    if (q.tipe_soal === 'pgk') jw = jw.indexOf(L) >= 0 ? jw.filter(x => x !== L) : jw.concat(L).sort();
    else jw = [L];
    S.jawaban[q.id_soal] = jw.join(',');
    S.dirty = true; simpanLokal();
    render();
  }

  function pindah(i) {
    if (i < 0 || i >= S.soal.length) return;
    catatWaktu(); S.idx = i; render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function cekJawaban() {
    const q = S.soal[S.idx];
    const r = await UI.run(() => API.call('cekJawaban', { id_pengerjaan: S.id_pengerjaan, id_soal: q.id_soal, jawaban: S.jawaban[q.id_soal] }));
    if (r && S) { S.cek[q.id_soal] = r; render(); }
  }

  function gridSoal(onPick) {
    return '<div class="qgrid">' + S.soal.map((q, i) => {
      const c = S.ragu.has(q.id_soal) ? 'doubt' : (S.jawaban[q.id_soal] ? 'ans' : '');
      return '<button type="button" data-i="' + i + '" class="' + c + (i === S.idx ? ' cur' : '') + '">' + (i + 1) + '</button>';
    }).join('') + '</div>' +
      '<div class="legend mt-2"><span><i style="background:var(--success);border-color:var(--success)"></i>Sudah dijawab</span><span><i style="background:var(--doubt);border-color:var(--doubt)"></i>Ragu-ragu</span><span><i></i>Belum dijawab</span><span><i style="box-shadow:0 0 0 2px var(--primary)"></i>Posisi sekarang</span></div>';
  }

  function daftarSoal() {
    const m = UI.modal({ title: 'Daftar Soal', body: gridSoal(), foot: '<button class="btn" data-close>Tutup</button><button class="btn btn-success" data-kumpul>' + icon('send') + 'Selesai &amp; Kumpulkan</button>', noFocus: true });
    m.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { m.close(); pindah(Number(b.dataset.i)); });
    m.querySelector('[data-kumpul]').onclick = () => { m.close(); konfirmasiKumpul(); };
  }

  async function konfirmasiKumpul() {
    const kosong = S.soal.filter(q => !S.jawaban[q.id_soal]).length;
    const ragu = S.ragu.size;
    let pesan = '<p>Kamu sudah menjawab <b>' + (S.soal.length - kosong) + ' dari ' + S.soal.length + '</b> soal.</p>';
    if (kosong) pesan += '<p class="mt-1" style="color:var(--danger-dark)">Masih ada <b>' + kosong + '</b> soal yang belum dijawab.</p>';
    if (ragu) pesan += '<p class="mt-1" style="color:var(--warn-dark)">Ada <b>' + ragu + '</b> soal yang ditandai ragu-ragu.</p>';
    pesan += '<p class="mt-1 muted">Setelah dikumpulkan, jawaban tidak bisa diubah lagi.</p>';
    if (await UI.confirm('Kumpulkan jawaban?', pesan, { ok: 'Ya, kumpulkan', batal: 'Periksa lagi' })) kumpul(false);
  }

  async function kumpul(otomatis) {
    if (!S || S.selesai) return;
    catatWaktu();
    const st = S;
    st.selesai = true;
    clearInterval(tTimer); clearInterval(tSave);
    const v = $('#view-ujian');
    v.innerHTML = '<div class="exam"><div class="card" style="padding:3rem;text-align:center"><div class="spinner" style="margin:0 auto 1rem"></div><b>Mengumpulkan jawaban…</b><p class="muted small mt-1">Jangan tutup halaman ini.</p></div></div>';
    for (let coba = 0; coba < 4; coba++) {
      try {
        const r = await API.call('kumpulkan', { id_pengerjaan: st.id_pengerjaan, jawaban: st.jawaban, waktu: st.waktu });
        bersihkan(st);
        return tampilHasil(r);
      } catch (e) {
        if (!e.offline) { UI.toast(e.message, 'error'); break; }
        await new Promise(r => setTimeout(r, 2000 * (coba + 1)));
      }
    }
    st.selesai = false; S = st;
    v.innerHTML = '<div class="exam"><div class="card center" style="padding:3rem">' + icon('alert') + '<h2 class="mt-1">Belum berhasil mengumpulkan</h2><p class="muted mt-1">Jawabanmu aman tersimpan di perangkat ini. Periksa koneksi internet, lalu coba lagi.</p><button class="btn btn-primary mt-2" id="btn-ulang">' + icon('refresh') + 'Coba kumpulkan lagi</button></div></div>';
    $('#btn-ulang').onclick = () => kumpul(otomatis);
  }

  function bersihkan(st) {
    try { localStorage.removeItem(kunciLokal(st.id_pengerjaan)); } catch (e) { /* abaikan */ }
    clearInterval(tTimer); clearInterval(tSave);
    document.removeEventListener('visibilitychange', onHidden);
    window.removeEventListener('beforeunload', onUnload);
    S = null;
  }

  // ---------------- HASIL ----------------
  function pesanNilai(n) {
    if (n >= 85) return ['Luar biasa!', 'Kamu sudah sangat siap. Pertahankan semangat belajarmu!'];
    if (n >= 70) return ['Hebat!', 'Sedikit lagi menuju sempurna. Terus berlatih ya!'];
    if (n >= 50) return ['Bagus, kamu sedang berkembang!', 'Latih bagian yang masih kurang agar makin percaya diri.'];
    return ['Langkah awal yang baik!', 'Setiap latihan membuatmu lebih pintar. Yuk coba latihan untuk kamu!'];
  }

  function tampilHasil(h) {
    const v = $('#view-ujian');
    const p = pesanNilai(h.nilai);
    v.innerHTML = '<div class="exam" style="max-width:980px">' +
      '<div class="card card-lg result-hero">' +
        '<span class="chip">' + esc(UI.JENIS[h.jenis] || 'Latihan') + ' • ' + esc(h.judul || '') + '</span>' +
        '<div class="row" style="justify-content:center;margin:1.4rem 0">' + UI.ring(h.nilai, { label: 'NILAI', warna: h.nilai >= 75 ? 'var(--success)' : (h.nilai >= 55 ? 'var(--doubt)' : 'var(--primary)') }) + '</div>' +
        '<h1 style="font-size:1.8rem">' + p[0] + '</h1><p class="muted mt-1">' + p[1] + '</p>' +
        '<div class="row wrap mt-2" style="justify-content:center"><span class="chip chip-green">' + icon('check') + h.benar + ' benar</span><span class="chip chip-outline">' + h.jumlah_soal + ' soal</span></div>' +
      '</div>' +
      '<div class="card mt-2"><div class="card-title mb-2">Hasil per kompetensi</div><div class="stack">' +
        h.kompetensi.map(k => '<div><div class="row between small"><b>' + esc(k.nama_kompetensi) + '</b><span>' + k.benar + '/' + k.total + ' • ' + k.persen + '%</span></div><div class="mt-1">' + UI.bar(k.persen) + '</div></div>').join('') +
      '</div></div>' +
      '<div class="row wrap mt-2" style="justify-content:center">' +
        (h.bisa_review ? '<button class="btn btn-outline btn-lg" id="btn-review">' + icon('eye') + 'Lihat Pembahasan</button>' : '') +
        (h.jenis === 'harian' ? '<a class="btn btn-lg" href="#/ujian/harian">' + icon('refresh') + 'Latihan lagi</a>' : '') +
        '<a class="btn btn-primary btn-lg" href="#/s/beranda">' + icon('home') + 'Kembali ke Beranda</a>' +
      '</div></div>';
    if ($('#btn-review')) $('#btn-review').onclick = () => review(h.id_pengerjaan);
  }

  /** Review jawaban + pembahasan (dipakai siswa & guru). */
  async function review(idPengerjaan) {
    const d = await UI.run(() => API.call('detailPengerjaan', { id_pengerjaan: idPengerjaan }));
    if (!d) return;
    const body = '<div class="row wrap mb-2"><span class="chip">Nilai ' + UI.angka(d.nilai) + '</span><span class="chip chip-green">' + d.benar + '/' + d.jumlah_soal + ' benar</span></div><div class="stack">' +
      d.butir.map(b => {
        const jw = String(b.jawaban_siswa || '').split(','), kunci = String(b.kunci).split(',');
        return '<div class="card" style="box-shadow:none;border:1.5px solid ' + (b.benar ? 'var(--success-soft)' : 'var(--danger-soft)') + '">' +
          '<div class="row between wrap"><b>Soal ' + b.no + '</b><span class="chip ' + (b.benar ? 'chip-green' : 'chip-red') + '">' + (b.benar ? 'Benar' : (b.jawaban_siswa ? 'Belum tepat' : 'Tidak dijawab')) + '</span></div>' +
          '<div class="muted xs mt-1">' + esc(b.nama_kompetensi) + '</div>' +
          (b.gambar_url ? '<img class="q-img mt-1" style="max-height:220px" src="' + esc(b.gambar_url) + '" alt="">' : '') +
          '<p class="mt-1" style="font-weight:600">' + esc(b.teks_soal) + '</p><div class="stack mt-1" style="gap:.35rem">' +
          ['A', 'B', 'C', 'D'].filter(L => b.opsi[L]).map(L => '<div class="small" style="padding:.4rem .7rem;border-radius:.5rem;background:' + (kunci.indexOf(L) >= 0 ? 'var(--success-soft)' : (jw.indexOf(L) >= 0 ? 'var(--danger-soft)' : '#F8FAFC')) + '"><b>' + L + '.</b> ' + esc(b.opsi[L]) + (kunci.indexOf(L) >= 0 ? ' ✓' : '') + (jw.indexOf(L) >= 0 ? ' <i>(jawabanmu)</i>' : '') + '</div>').join('') +
          '</div>' + (b.pembahasan ? '<div class="note-card mt-1"><b>Pembahasan:</b> ' + esc(b.pembahasan) + '</div>' : '') + '</div>';
      }).join('') + '</div>';
    UI.modal({ title: 'Pembahasan — ' + esc(d.judul || ''), body: body, size: 'lg' });
  }

  return { dariRute, hentikan, review, tampilHasil };
})();
window.Ujian = Ujian;
