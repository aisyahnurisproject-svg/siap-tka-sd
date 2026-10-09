# Siap TKA SD

Aplikasi pendamping belajar & latihan soal persiapan **Tes Kemampuan Akademik (TKA) SD**.
Alur siswa: **Diagnostik → Latihan Harian → Latihan per Bab → Evaluasi → Try Out → Hasil & Rekomendasi**.
Dashboard guru menjawab dalam satu layar: *siapa belum siap, kurang di mana, dan belajar apa berikutnya.*

- Frontend: HTML/CSS/JS murni (folder ini) — di-host di GitHub Pages.
- Backend: Google Apps Script sebagai REST API JSON (`Kode.gs`, tidak ikut di repo ini) + Google Sheets + Google Drive.

## Struktur
```
index.html          kerangka halaman (login, siswa, ujian, guru)
css/style.css       design system "Ramah Cerdas TKA"
js/config.js        ← ISI GAS_URL di sini
js/api.js           fetch ke GAS (POST text/plain, token sesi)
js/ui.js            ikon, modal, toast, grafik SVG, CSV
js/ujian.js         runner ujian: timer server, autosave, ragu-ragu, daftar soal
js/siswa.js         halaman siswa
js/guru.js          halaman guru
js/app.js           login, router, menu
```

Panduan lengkap: lihat `PANDUAN-INSTALASI.md`.
