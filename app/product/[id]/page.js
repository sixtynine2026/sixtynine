'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, rp, disc } from '../../../lib/supabase';
export default function Product() {
  const { id } = useParams(); const router = useRouter();
  const [p, setP] = useState(null); const [size, setSize] = useState(''); const [qty, setQty] = useState(1);
  useEffect(() => { supabase.from('products').select('*').eq('id', id).single().then(({ data }) => { setP(data); setSize((data?.sizes || '').split(',')[0]?.trim() || ''); }); }, [id]);
  if (!p) return <div className="wrap"><p className="empty-txt">Memuat produk...</p></div>;
  const add = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const ex = cart.find(i => i.id === p.id && i.size === size);
    if (ex) ex.qty += qty; else cart.push({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, size, qty });
    localStorage.setItem('cart', JSON.stringify(cart)); window.dispatchEvent(new Event('cart')); router.push('/checkout');
  };
  return <div className="wrap pd">
    <img src={p.image_url} alt={p.name} />
    <div>
      <small>{p.category}</small><h1>{p.name}</h1>
      <b className="price">{p.strike_price > p.price && <s>{rp(p.strike_price)}</s>} {rp(p.price)} {disc(p) > 0 && <i className="badge inl">-{disc(p)}%</i>}</b>
      <div className="sizes">{p.sizes.split(',').map(s => s.trim()).map(s => <button key={s} className={s === size ? 'on' : ''} onClick={() => setSize(s)}>{s}</button>)}</div>
      <div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>-</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>+</button></div>
      <button className="btn" disabled={p.stock <= 0} onClick={add}>{p.stock <= 0 ? 'Stok habis' : 'Tambah ke keranjang'}</button>
    </div>
  </div>;
}
