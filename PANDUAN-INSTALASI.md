# Panduan Instalasi — Siap TKA SD

Aplikasi ini terdiri dari dua bagian yang dipasang terpisah:

| Bagian | Isi | Dipasang di |
|---|---|---|
| **Backend** | `Kode.gs` + `appsscript.json` | Google Apps Script (akun Google sekolah) |
| **Frontend** | folder `siap-tka-sd` (isi ZIP) | GitHub Pages |

Urutannya wajib: **Backend dulu → salin URL `/exec` → isi `js/config.js` → baru Frontend.**

---

## TAHAP A — Backend (Google Apps Script)

### A1. Buat proyek
1. Buka <https://script.google.com> → **Proyek baru**.
2. Ganti nama proyek (kiri atas), misalnya `Siap TKA SD API`.
3. Hapus isi `Code.gs`, lalu tempel **seluruh** isi `Kode.gs`. (Boleh rename file menjadi `Kode`.)
4. Klik ⚙️ **Setelan proyek** → centang **Tampilkan file manifes "appsscript.json"**. Kembali ke Editor, buka `appsscript.json`, ganti isinya dengan file `appsscript.json` dari paket ini. Simpan (Ctrl+S).

### A2. Jalankan setup — HANYA SEKALI
1. Pada dropdown fungsi (sebelah tombol ▶ Jalankan), pilih **`setupAppEnvironment`** → ▶ **Jalankan**.
2. Muncul "Otorisasi diperlukan" → **Tinjau izin** → pilih akun → **Lanjutan** → **Buka … (tidak aman)** → **Izinkan**. (Peringatan ini normal untuk skrip buatan sendiri.)
3. Buka **Log eksekusi**. Pastikan muncul `✅ SETUP SELESAI` beserta tautan spreadsheet dan folder.

Yang otomatis dibuat di Google Drive Anda:

```
TKA-SD/
├── Database — Siap TKA SD   (spreadsheet: 19 sheet)
├── Gambar-Soal/
├── Materi-PDF/
├── Laporan-PDF/
└── Backup/
```

Data contoh yang ikut dibuat: 1 kelas (Kelas 5A), 3 siswa, 2 mapel, 7 kompetensi, 2 stimulus, 18 soal, 3 paket (Diagnostik, Latihan, Try Out).

| Akun contoh | Username | Kata sandi / kode |
|---|---|---|
| Guru | `guru` | `guru12345` → **segera ganti** di menu Pengaturan |
| Siswa | `budi.pratama` atau NISN `0124859011` | `TKA-7729` |

> ⚠️ Jangan jalankan `setupAppEnvironment` dua kali. Fungsi ini sudah dijaga agar menolak jika setup sudah pernah dilakukan.

### A3. Deploy sebagai Web App
1. Kanan atas: **Terapkan → Deployment baru**.
2. Ikon ⚙️ di "Pilih jenis" → **Aplikasi web**.
3. Isi:
   - **Jalankan sebagai:** *Saya*
   - **Yang memiliki akses:** *Siapa saja* (Anyone)
4. **Terapkan** → salin **URL aplikasi web** yang berakhiran **`/exec`**.

> Akses "Siapa saja" aman: semua data tetap dilindungi login kustom (token sesi, hash+salt kata sandi, pengecekan peran di server). Siswa tidak dapat melihat data siswa lain.

**Uji cepat:** buka URL `/exec` tadi di browser. Harus tampil JSON seperti `{"success":true,"data":{"app":"Siap TKA SD","siap":true,...}}`.

### A4. (Disarankan) Backup harian
Pilih fungsi **`pasangTriggerBackup`** → ▶ Jalankan sekali. Spreadsheet akan disalin otomatis ke folder `Backup` setiap malam (14 salinan terakhir disimpan).

### Fungsi bantu lain (dijalankan dari editor)
| Fungsi | Kegunaan |
|---|---|
| `buatAkunGuru('Nama', 'username', 'Sandi123')` | Menambah akun guru baru (ubah isi `contohBuatGuruBaru` lalu jalankan) |
| `resetPasswordGuru('guru', 'SandiBaru123')` | Mengatur ulang kata sandi guru yang lupa |

### Setiap kali `Kode.gs` diubah
**Terapkan → Kelola deployment → ✏️ Edit → Versi: *Versi baru* → Terapkan.** URL `/exec` tetap sama.

---

## TAHAP B — Frontend (GitHub Pages)

### B1. Ekstrak ZIP dan isi alamat server
1. Ekstrak `siap-tka-sd.zip`. Anda akan mendapat folder **`siap-tka-sd`** yang langsung berisi `index.html`, `css/`, `js/`.
2. Buka `js/config.js` dengan Notepad/VS Code, lalu ganti:

```js
GAS_URL: 'https://script.google.com/macros/s/GANTI_DENGAN_ID_DEPLOYMENT/exec',
```
dengan URL `/exec` dari langkah A3. Simpan.

### B2. Push ke GitHub (lewat terminal)
**Folder kerja = folder `siap-tka-sd` hasil ekstrak** (folder yang berisi `index.html`). Di sanalah `git init` dijalankan — jangan satu level di atasnya.

1. Buat repository baru di github.com → **Public**, **jangan** centang README.
2. Buka terminal di folder `siap-tka-sd`, cek isinya:
   ```bash
   dir        # Windows PowerShell   (Mac/Linux: ls)
   ```
   Harus terlihat `index.html`, `css`, `js` di baris teratas.
3. Jalankan satu per satu:
   ```bash
   git init
   git add .
   git commit -m "Upload pertama Siap TKA SD"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
   Saat diminta **Password**, tempel **Personal Access Token** (buat di <https://github.com/settings/tokens> → *Generate new token (classic)* → centang **repo**). Layar memang tidak menampilkan apa pun saat token ditempel — itu normal.
4. Di repo GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save**. Centang **Enforce HTTPS** (diperlukan untuk fitur pindai QR dengan kamera).
5. Tunggu 1–2 menit. Situs tampil di `https://USERNAME.github.io/NAMA-REPO/`.

> Jangan pakai tombol "Upload files" di web GitHub — struktur folder `css/` dan `js/` bisa rusak sehingga tampilan tanpa gaya.

### B3. Update berikutnya
```bash
git add .
git commit -m "Perbarui aplikasi"
git push
```
Jika tampilan belum berubah: tekan **Ctrl+Shift+R** atau buka jendela Incognito.

---

## TAHAP C — Uji coba setelah online

1. Buka situs → bilah **Status Server** harus hijau "Siap • Server Aktif".
2. Tab **Guru & Proktor** → masuk `guru` / `guru12345` → buka **Pengaturan** → ganti kata sandi dan nama sekolah.
3. **Data Siswa** → Tambah/Impor siswa → **Cetak Semua Kartu Login**.
4. Keluar → tab **Siswa** → masuk `budi.pratama` / `TKA-7729` → kerjakan Diagnostik.
5. Masuk lagi sebagai guru → **Dashboard** menampilkan kesiapan, kompetensi terlemah, dan rekomendasi.
6. Tekan F12 → tab **Console**: tidak boleh ada error merah bertuliskan CORS.

---

## Pemecahan masalah

| Gejala | Penyebab & solusi |
|---|---|
| Status server "GAS_URL belum diisi" | `js/config.js` belum diisi → isi, lalu `git push` lagi |
| Status server "Tidak terhubung" | URL salah / deployment bukan "Siapa saja" / belum di-deploy ulang setelah edit |
| "Server belum disiapkan" | `setupAppEnvironment` belum dijalankan |
| "Balasan server tidak valid" | Web App meminta login Google → ubah akses deployment menjadi **Siapa saja** |
| Gambar soal tidak tampil | Pastikan berkas di folder `Gambar-Soal` berbagi "Siapa saja yang memiliki link" (otomatis saat unggah lewat aplikasi) |
| Situs GitHub 404 | `index.html` tidak berada di root repo → push ulang dari folder `siap-tka-sd` |
| "Server sedang sibuk" saat Try Out serentak | Normal pada beban puncak; aplikasi otomatis mencoba lagi dan jawaban tetap tersimpan di perangkat siswa |

## Batasan & kapasitas
- Dirancang untuk ±10 pengguna aktif bersamaan, stabil hingga <50 (Try Out serentak). Jawaban dikirim berkala per 30 detik (atur di `AUTOSAVE_DETIK`), bukan per klik.
- Pembuatan PDF dilakukan per permintaan guru untuk menghemat kuota harian Apps Script.
- Ukuran unggahan maks 8 MB; gambar otomatis dikompres di browser sebelum diunggah.
