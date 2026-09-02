# Yasam API Page

Modular REST API + documentation UI untuk Vercel.

## Tambah API

Buat file baru di `api/`, misalnya `api/facebook.js`, lalu export object dengan `name`, `description`, `method`, `endpoint`, dan `handler`. Dokumentasi serta homepage akan menemukannya otomatis.

## Deploy

Import repository ini ke Vercel. Tidak membutuhkan build command atau dependency tambahan.

Endpoint registry: `/api`
Health: `/api/health`
Documentation: `/docs`
