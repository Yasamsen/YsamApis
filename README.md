# SamApi

Website dokumentasi API modern — HTML, CSS, JavaScript vanilla, dan Node.js (CommonJS). Tanpa React, tanpa TypeScript, siap deploy ke Vercel.

## Menjalankan build manifest

```
npm run build
```

Perintah ini membaca semua file di `api/**/*.js`, lalu membuat `public/api-manifest.json`. Homepage, Documentation, Search, Sidebar, Statistik, dan Category semuanya membaca file ini — tidak ada yang di-hardcode.

## Menambah API baru (tanpa mengedit frontend)

1. Buat file baru, misalnya `api/downloader/spotify.js`.
2. Gunakan pola yang sama seperti `api/downloader/tiktok.js`:

```js
const createApi = require("../_lib/createApi");

module.exports = createApi({
  name: "Spotify Downloader",
  description: "Download track dari Spotify",
  method: "GET",
  endpoint: "/api/downloader/spotify",
  category: "Downloader",
  parameters: [{ name: "url", type: "string", required: true, example: "https://open.spotify.com/track/xxxx" }],
  async handler(req, res) {
    // implementasi di sini
  }
});
```

3. Jalankan `npm run build` (Vercel menjalankan ini otomatis lewat `buildCommand` di `vercel.json`).
4. Selesai — endpoint otomatis muncul di homepage, API Explorer, Documentation, sidebar, search, dan statistik.

## Deploy ke Vercel

```
vercel deploy
```

Vercel akan menjalankan `npm run build` (menghasilkan manifest), lalu menyajikan `public/` sebagai static output dan setiap file di `api/` sebagai Serverless Function.

## Fitur status live (CPU, memori, request per hari)

Halaman `/status` menampilkan diagnostik nyata dari instance serverless yang sedang aktif (CPU load, memori, uptime) via `api/system/status.js`, menggunakan modul bawaan Node.js `os` — bukan angka rekaan.

Untuk mengaktifkan hitungan **request per hari** (bertahan lintas cold start), buat database gratis di [Upstash Redis](https://upstash.com), lalu isi di Environment Variables project Vercel:

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Tanpa konfigurasi ini, halaman status tetap berjalan normal dan hanya menampilkan jumlah request sejak instance terakhir cold start, dengan keterangan yang jujur bahwa hitungan harian belum diaktifkan (lihat `.env.example`).
