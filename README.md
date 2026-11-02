# CodeVault

Website penyimpanan kode dengan dua role:
- Pengunjung: melihat daftar/detail kode, menyalin, dan mengunduh.
- Owner: login dengan password dari environment variable, menambah/mengedit/menghapus kode.

Stack: HTML/CSS/JS biasa, Node.js CommonJS, MongoDB Atlas, Vercel Functions.

## Deploy ke Vercel
1. Buat database MongoDB Atlas dan salin connection string.
2. Upload project ini ke GitHub.
3. Import repository ke Vercel.
4. Tambahkan Environment Variables:
   - `MONGODB_URI`: connection string Atlas
   - `MONGODB_DB`: `codevault`
   - `ADMIN_PASSWORD`: password admin yang kuat dan unik
   - `SESSION_SECRET`: string acak minimal 32 karakter
5. Deploy ulang setelah menambah Environment Variables.

## Catatan
- Jangan commit file `.env`.
- Jangan masukkan password admin, token, atau credential database ke source code.
- Gunakan HTTPS (Vercel sudah menyediakannya).
- Pengunjung tidak bisa menambah/mengubah/menghapus kode melalui UI maupun API tanpa sesi owner.
- Untuk mengembangkan aplikasi lokal, pasang Vercel CLI lalu jalankan `npm install` dan `vercel dev`.
