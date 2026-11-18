# SIXTYNINE PROJECT (HTML + Supabase + Vercel)

Halaman: `/` toko, `/produk?id=`, `/login`, `/checkout`, `/pesanan`, `/admin`, `/print?id=`. Folder `api/` adalah fungsi server Vercel (buat pesanan + kirim email, daftar pelanggan).

1. Buka `js/config.js`, isi SUPABASE_URL dan SUPABASE_ANON_KEY.
2. Supabase SQL Editor: jalankan `supabase/schema.sql`, `migration-user-login.sql`, `perbaikan-admin.sql` (yang sudah pernah dijalankan boleh dilewati).
3. Vercel: import repo GitHub, **Framework Preset: Other**, kosongkan Build Command. Isi Environment Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_NOTIFY_EMAIL`.
4. Admin: buka `/admin` atau login di `/login` dengan email yang ada di tabel `admins`.
Tes lokal: `npx vercel dev`.
