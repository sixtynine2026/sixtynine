'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
export default function Shell({ children }) {
  const p = usePathname();
  const [n, setN] = useState(0);
  const [u, setU] = useState(null);
  useEffect(() => {
    const f = () => { try { setN(JSON.parse(localStorage.getItem('cart') || '[]').reduce((a, i) => a + i.qty, 0)); } catch {} };
    f(); window.addEventListener('cart', f);
    return () => window.removeEventListener('cart', f);
  }, []);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setU(data.session?.user || null));
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setU(s?.user || null));
    return () => l.subscription.unsubscribe();
  }, []);
  const out = async e => { e.preventDefault(); await supabase.auth.signOut(); localStorage.setItem('cart', '[]'); window.dispatchEvent(new Event('cart')); location.href = '/'; };
  if (p.startsWith('/admin')) return children;
  return <>
    <div className="bar">LEBIH HEMAT BELANJA DI WEBSITE RESMI SIXTYNINE PROJECT</div>
    <header className="hd">
      <Link href="/" className="logo">SIXTY<br />NINE</Link>
      <nav><Link href="/#shop">SHOP</Link><Link href="/track">PESANAN SAYA</Link><Link href="/checkout">KERANJANG ({n})</Link>{u ? <a href="#" onClick={out}>KELUAR</a> : <Link href="/login">MASUK</Link>}</nav>
    </header>
    <main>{children}</main>
    <footer className="ft">
      <div><h4>Lokasi</h4><p>Arcamanik, Kota Bandung</p></div>
      <div><h4>Cara order</h4><p>Pilih produk, isi data di checkout, transfer, lalu pantau kirimannya di Cek Pesanan.</p></div>
      <div><h4>Customer service</h4><p>+62 851-7104-0017</p></div>
    </footer>
    <div className="copy">Copyright 2026 © sixtynineproject</div>
    <a className="wa" href="https://wa.me/6285171040017" aria-label="WhatsApp">WA</a>
  </>;
}
