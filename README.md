# Alya OCR Copilot

Website Vercel: screenshot → OCR di browser → teks → Gemini.

## 1. Install

```bash
npm install
npm install -g vercel
```

## 2. Local

Buat `.env.local`:

```env
GEMINI_API_KEY=API_KEY_GEMINI_KAMU
```

Lalu:

```bash
vercel dev
```

## 3. Deploy ke Vercel

Upload project ini ke GitHub lalu import ke Vercel, atau:

```bash
vercel
```

Setelah project dibuat, buka:

**Vercel → Project → Settings → Environment Variables**

Tambahkan:

```text
GEMINI_API_KEY = API key Gemini kamu
```

Pilih Production/Preview/Development sesuai kebutuhan, lalu redeploy.

## Catatan

OCR dijalankan di browser menggunakan Tesseract.js, jadi gambar tidak dikirim ke endpoint Gemini.
Backend `/api/chat` hanya menerima teks OCR + pertanyaan pengguna.

Untuk screenshot kode/error, bahasa OCR `English / kode` biasanya lebih cocok.
