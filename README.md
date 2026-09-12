# MyStorage

Private cloud file storage — akses file dari HP maupun PC dengan Access Key.

## Fitur

- **Login tunggal** dengan Access Key (Admin / User otomatis terdeteksi)
- **User**: read-only (lihat, preview, download, search)
- **Admin**: full control (upload, delete, rename, folder, User Key management)
- **Storage quota** berbasis environment variable (aman untuk R2 free plan)
- **Cloudflare R2** untuk penyimpanan file
- **MongoDB** untuk metadata & authentication
- **Session HTTP-only cookie** yang aman
- Dark mode, responsive (HP + PC)

## Persyaratan

- Node.js 18+
- Akun MongoDB (Atlas atau self-hosted)
- Cloudflare R2 bucket + API token

## Instalasi

```bash
cd mystorage
npm install
cp .env.example .env
```

Edit `.env` dan isi semua variabel.

### Pilih penyimpanan: Local, Cloudflare R2, atau Backblaze B2

```env
# local  = disk server (default)
# r2     = Cloudflare R2
# b2     = Backblaze B2
STORAGE_BACKEND=local
```

**Mode Local** (tidak butuh cloud storage):

```env
STORAGE_BACKEND=local
LOCAL_STORAGE_PATH=./data/files
STORAGE_LIMIT_BYTES=10737418240
MAX_FILE_SIZE_BYTES=104857600
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=minimal_32_karakter_random_string_disini
ADMIN_KEY_HASH=
```

**Mode Cloudflare R2**:

```env
STORAGE_BACKEND=r2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=mystorage
STORAGE_LIMIT_BYTES=10737418240
MAX_FILE_SIZE_BYTES=104857600
MONGODB_URI=...
SESSION_SECRET=...
ADMIN_KEY_HASH=
```

**Mode Backblaze B2**:

1. Buat bucket di https://secure.backblaze.com
2. Buat Application Key (keyID + applicationKey)
3. Catat region bucket (mis. `us-west-004`)

```env
STORAGE_BACKEND=b2
B2_KEY_ID=...
B2_APPLICATION_KEY=...
B2_BUCKET_NAME=mystorage
B2_REGION=us-west-004
STORAGE_LIMIT_BYTES=10737418240
MAX_FILE_SIZE_BYTES=104857600
MONGODB_URI=...
SESSION_SECRET=...
ADMIN_KEY_HASH=
```

### Generate Admin Key Hash

```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_ADMIN_SECRET_KEY', 12))"
```

Salin output hash ke `ADMIN_KEY_HASH` di `.env`.

### Jalankan lokal

```bash
npm start
```

Buka http://localhost:3000

Login dengan Admin Key yang Anda hash tadi.

## Deploy ke Vercel

1. Push project ke GitHub
2. Import project di Vercel
3. Set semua Environment Variables di Vercel Dashboard
4. Deploy

`vercel.json` sudah dikonfigurasi.

## Struktur

```
mystorage/
├── api/           # API route handlers
├── lib/           # mongodb, r2, auth, security, permissions
├── public/        # Frontend (HTML, CSS, JS)
├── server.js      # Express entry point
├── package.json
├── vercel.json
└── .env.example
```

## Keamanan

- Semua endpoint admin dilindungi middleware `requireAdmin` di server
- User key **read-only** di backend (upload/delete/rename ditolak dengan 403)
- Access key di-hash dengan bcrypt (tidak disimpan plaintext)
- Session: HTTP-only, Secure (production), SameSite
- Quota storage dicek **sebelum** upload (fail-closed)
- R2 credentials tidak pernah diekspos ke frontend
- Download/preview melalui backend (bucket tidak perlu public)

## Storage Quota

Quota dikontrol via:

- `STORAGE_LIMIT_BYTES` — total batas storage aplikasi (berlaku local & R2)
- `STORAGE_BACKEND` — `local`, `r2`, atau `b2`
- `MAX_FILE_SIZE_BYTES` — batas ukuran per file

Jika quota penuh, upload ditolak. User tetap bisa browse, preview, dan download.

## User Key

Admin dapat membuat User Key sebanyak yang diinginkan dari Admin Dashboard → User Keys.

Key hanya ditampilkan **sekali** saat dibuat. Setelah itu hanya hash yang disimpan.

## Lisensi

MIT
