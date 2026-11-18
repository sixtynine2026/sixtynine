'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, rp } from '../../lib/supabase';
export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState([]); const [pay, setPay] = useState([]); const [ship, setShip] = useState([]);
  const [f, setF] = useState({ buyer_name: '', buyer_phone: '', buyer_email: '', address: '', payment_method: '', shipping_method: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
    supabase.from('payment_methods').select('*').eq('active', true).then(({ data }) => { setPay(data || []); if (data?.[0]) setF(x => ({ ...x, payment_method: data[0].name })); });
    supabase.from('shipping_methods').select('*').eq('active', true).then(({ data }) => { setShip(data || []); if (data?.[0]) setF(x => ({ ...x, shipping_method: data[0].name })); });
  }, []);
  const save = c => { setCart(c); localStorage.setItem('cart', JSON.stringify(c)); window.dispatchEvent(new Event('cart')); };
  const sub = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const cost = ship.find(s => s.name === f.shipping_method)?.cost || 0;
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setBusy(true);
    const r = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, items: cart }) });
    const d = await r.json(); setBusy(false);
    if (!r.ok) return alert(d.error || 'Gagal membuat pesanan');
    save([]); router.push(`/track?code=${d.code}&phone=${encodeURIComponent(f.buyer_phone)}`);
  };
  if (!cart.length) return <div className="wrap"><p className="empty-txt">Keranjang kosong. Pilih produk dulu di halaman utama.</p></div>;
  return <form className="wrap co" onSubmit={submit}>
    <div>
      <h2 className="ttl"><span>DATA PENERIMA</span></h2>
      <label>Nama penerima<input required value={f.buyer_name} onChange={set('buyer_name')} /></label>
      <label>No. HP penerima<input required inputMode="tel" value={f.buyer_phone} onChange={set('buyer_phone')} /></label>
      <label>Email (untuk konfirmasi)<input type="email" value={f.buyer_email} onChange={set('buyer_email')} /></label>
      <label>Alamat lengkap<textarea required rows={4} value={f.address} onChange={set('address')} /></label>
      <label>Jasa kirim<select value={f.shipping_method} onChange={set('shipping_method')}>{ship.map(s => <option key={s.id} value={s.name}>{s.name} - {rp(s.cost)}</option>)}</select></label>
      <label>Metode pembayaran<select value={f.payment_method} onChange={set('payment_method')}>{pay.map(s => <option key={s.id}>{s.name}</option>)}</select></label>
    </div>
    <div>
      <h2 className="ttl"><span>PESANAN</span></h2>
      {cart.map((i, k) => <div className="line" key={k}>
        <img src={i.image_url} alt="" /><div><p>{i.name}</p><small>Ukuran {i.size} × {i.qty}</small><b>{rp(i.price * i.qty)}</b></div>
        <button type="button" className="x" onClick={() => save(cart.filter((_, j) => j !== k))} aria-label="Hapus">×</button>
      </div>)}
      <p className="sum">Subtotal <b>{rp(sub)}</b></p><p className="sum">Ongkir <b>{rp(cost)}</b></p><p className="sum tot">Total <b>{rp(sub + cost)}</b></p>
      <button className="btn" disabled={busy}>{busy ? 'Memproses...' : 'Buat pesanan'}</button>
    </div>
  </form>;
}
