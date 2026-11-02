# CodeVault v2.0

Library kode dengan tampilan baru: kategori, filter bahasa, pencarian langsung, perintah `curl` per snippet,
penghitung dilihat/disalin, halaman detail, dan dashboard admin responsif di `/admin`.

## Struktur
- `public/` — `index.html` (beranda), `view.html` (detail), `admin.html` (dashboard), `styles.css`, `common.js`, `home.js`, `view.js`, `admin.js`
- `api/` — `codes.js` (daftar/tambah), `code.js` (detail/edit/hapus/hitung), `raw.js` (kode mentah), `login.js`, `logout.js`, `me.js`
- `lib/common.js` — koneksi MongoDB, sesi, helper

## Deploy ke Vercel
1. Ekstrak ZIP, lalu ganti seluruh isi repository dengan isinya (`api/`, `public/`, `lib/`, `package.json`, `vercel.json` harus di root). **Hapus `api/[...slug].js` lama** bila masih ada di repo.
2. Environment Variables: `MONGODB_URI`, `MONGODB_DB`, `ADMIN_PASSWORD`, `SESSION_SECRET` (min. 32 karakter).
3. Commit, push, redeploy.

## Fitur baru
- `curl -sL https://domainmu/raw/<slug>` mengambil kode mentah (juga menambah hitungan "disalin" bila dipanggil lewat curl/wget).
- Field baru per snippet: `category`, `install`, `views`, `copies`. Data lama tetap jalan (kategori otomatis "Lainnya").
- Admin: `/admin` — statistik, cari, tambah/edit di panel geser, hapus dengan konfirmasi, `Ctrl/Cmd+S` untuk simpan.
- Beranda: tekan `/` untuk fokus ke pencarian; filter tersimpan di URL sehingga bisa dibagikan.
