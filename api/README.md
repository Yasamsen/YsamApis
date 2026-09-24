# API Page

Struktur ini memakai Vercel Serverless Functions tanpa TypeScript/TSX.

## Endpoint

- `GET /api/downloader?platform=instagram&url=...`
- `GET /api/downloader/instagram?url=...`
- `GET /api/downloader/tiktok?url=...`
- `GET /api/downloader/youtube?url=...`
- `GET /api/search/example?q=...`

## Environment Variables

Set provider URL di Vercel:

- `INSTAGRAM_API_URL`
- `TIKTOK_API_URL`
- `YOUTUBE_API_URL`
- atau fallback `DOWNLOADER_API_URL`
- `SEARCH_API_URL`

Catatan: ZIP sumber hanya berisi dokumentasi endpoint, bukan implementasi provider downloader. Karena itu handler tidak mengarang scraper/downloader palsu; ia menjadi proxy ke provider yang kamu konfigurasi.
