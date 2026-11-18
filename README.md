# SIXTYNINE PROJECT

Toko online streetwear (Next.js + Supabase + Resend). Ada sisi pembeli dan sisi admin di `/admin`.

## Setup
1. **Supabase**: buat project, buka SQL Editor, jalankan `supabase/schema.sql`.
1b. Jalankan juga `supabase/migration-user-login.sql` (menyimpan riwayat pesanan per akun pembeli).
2. Authentication > Users > Add user (email + password admin). Lalu jalankan: `insert into admins values ('emailadmin@kamu.com');`
3. Salin `.env.example` ke `.env.local`, isi dari Supabase (Project Settings > API). `SUPABASE_SERVICE_ROLE_KEY` rahasia, jangan di-commit.
4. **Resend**: buat API key, verifikasi domain, isi `RESEND_API_KEY` dan `RESEND_FROM`. Tanpa ini pesanan tetap masuk, hanya email tidak terkirim.
5. Lokal: `npm install && npm run dev`.
6. **Deploy**: push ke GitHub, import di Vercel, masukkan semua env di Project Settings > Environment Variables.

## Akun pembeli
Pembeli wajib daftar/masuk di `/login` untuk menambah keranjang dan checkout. Riwayat dan tracking ada di **Pesanan Saya** (`/track`), hanya terlihat oleh pemilik akunnya. Supabase > Authentication > Providers > Email: matikan *Confirm email* kalau mau pembeli bisa langsung masuk tanpa verifikasi email.

## Alur admin
- `/admin` > Banner / Produk (harga jual + harga coret) / Pembayaran / Jasa kirim: tambah, ubah, hapus, upload foto.
- Pesanan masuk: klik **Proses & cetak label** (status jadi Diproses, label pengirim sixtynineproject / 085171040017 / Arcamanik, Kota Bandung terbuka siap print).
- Isi ekspedisi + no. resi, lalu tempel teks tracking dari web resmi ekspedisi ke **Update tracking**. Pembeli melihatnya di `/track` (kode pesanan + no. HP).
