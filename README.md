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


## Perbaikan login (rilis 1.0.1)
Versi ini memperbaiki pembacaan JSON request pada Vercel (mendukung `req.body` yang sudah diparse) dan membuat pesan error API menampilkan status HTTP serta respons server agar masalah login tidak lagi tersembunyi sebagai "Permintaan gagal".

Setelah mengganti file di GitHub dan deploy ulang:
1. Pastikan `ADMIN_PASSWORD` terisi.
2. Pastikan `SESSION_SECRET` minimal 32 karakter.
3. Redeploy dengan **Clear Build Cache** bila browser masih memuat JavaScript lama.
4. Buka ulang situs dan coba login.

## Perbaikan endpoint login (rilis 1.0.2)
Login sekarang memakai endpoint khusus `POST /api/login` melalui file `api/login.js`, tidak lagi memakai jalur `/api/auth/login`.
Setelah mengunggah seluruh isi ZIP ini ke repository, lakukan deploy ulang di Vercel. Pastikan `ADMIN_PASSWORD` dan `SESSION_SECRET` tetap tersedia pada Environment Variables untuk Production.
