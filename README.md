# API Hub

Website direktori API yang otomatis mendeteksi endpoint baru berdasarkan
struktur folder `pages/api/`, lalu menampilkannya dikelompokkan per kategori
(misalnya `downloader/tiktok`, `search/music`). Dibangun dengan Next.js dan
siap deploy langsung ke Vercel.

## Cara kerjanya

Saat proyek di-build (`next build`, termasuk otomatis saat deploy di Vercel),
`lib/scanEndpoints.js` membaca seluruh isi folder `pages/api/` secara
rekursif. Untuk tiap file endpoint, nama folder menjadi **kategori**, nama
file menjadi **nama endpoint**, dan komentar dokumentasi di bagian atas file
menjadi metadata yang ditampilkan di halaman utama (method, deskripsi,
parameter).

Jadi alurnya:

1. Kamu tambah file baru, misalnya `pages/api/downloader/youtube.js`.
2. Kamu isi komentar meta di bagian atas file (lihat contoh di bawah).
3. Push ke GitHub → Vercel otomatis build ulang → endpoint baru langsung
   muncul di halaman utama, dikelompokkan di kategori `downloader`.

Tidak ada file daftar endpoint yang perlu diedit manual.

## Menambah endpoint baru

Buat file di `pages/api/<kategori>/<nama>.js`. Contoh:

```js
/**
 * @method GET
 * @description Download video YouTube dalam format mp4.
 * @param url string required - URL video YouTube.
 * @param quality string optional - Kualitas video, mis. 720p.
 */
export default async function handler(req, res) {
  const { url, quality = "480p" } = req.query;

  if (!url) {
    return res.status(400).json({ status: false, message: "Parameter 'url' wajib diisi." });
  }

  // Tulis logic download/scraping kamu di sini.
  return res.status(200).json({
    status: true,
    result: { url, quality, download_url: "https://example.com/video.mp4" },
  });
}
```

Aturan komentar meta:

- `@method` — method HTTP (`GET`, `POST`, dll). Default `GET` jika tidak diisi.
- `@description` — satu baris deskripsi singkat, tampil di kartu endpoint.
- `@param <nama> <tipe> <required|optional> - <keterangan>` — satu baris per
  parameter. Boleh lebih dari satu baris `@param`.

File yang diawali `_` (misalnya `_middleware.js`) dan `hello.js` (contoh
bawaan Next.js) tidak akan ditampilkan.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` — halaman utama akan menampilkan semua endpoint
yang ada di `pages/api/`, dan tiap kartu endpoint punya tombol "Coba" untuk
langsung menguji lewat browser.

## Deploy ke Vercel

1. Push folder ini ke repository GitHub/GitLab/Bitbucket.
2. Buka [vercel.com/new](https://vercel.com/new), impor repository tersebut.
3. Framework preset otomatis terdeteksi sebagai **Next.js** — tidak perlu
   konfigurasi tambahan. Klik **Deploy**.
4. Setiap kali kamu menambah endpoint baru dan push ke branch utama, Vercel
   akan build ulang dan endpoint baru otomatis tampil di halaman utama.

Atau lewat CLI:

```bash
npm i -g vercel
vercel
```

## Struktur folder

```
pages/
  api/
    downloader/
      tiktok.js      → kategori "downloader", route /api/downloader/tiktok
    search/
      music.js        → kategori "search", route /api/search/music
  index.js             → halaman direktori (auto-generate dari pages/api)
lib/
  scanEndpoints.js      → logic pemindai endpoint
components/
  EndpointCard.js       → kartu endpoint + tombol uji coba
```

## Catatan

Dua endpoint contoh (`downloader/tiktok` dan `search/music`) masih berisi
data dummy — ganti bagian `// TODO` di masing-masing file dengan logic
scraping/API asli sebelum dipakai produksi.
