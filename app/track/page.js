'use client';
import { useEffect, useState } from 'react';
import { rp } from '../../lib/supabase';
export default function Track() {
  const [code, setCode] = useState(''); const [phone, setPhone] = useState(''); const [d, setD] = useState(null); const [err, setErr] = useState('');
  const look = async (c, p) => {
    setErr(''); setD(null);
    const r = await fetch(`/api/track?code=${encodeURIComponent(c)}&phone=${encodeURIComponent(p)}`);
    const j = await r.json(); if (!r.ok) return setErr(j.error); setD(j);
  };
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('code')) { setCode(q.get('code')); setPhone(q.get('phone') || ''); look(q.get('code'), q.get('phone') || ''); }
  }, []);
  const o = d?.order;
  return <div className="wrap tr">
    <h2 className="ttl"><span>CEK PESANAN</span></h2>
    <form onSubmit={e => { e.preventDefault(); look(code, phone); }}>
      <label>Kode pesanan<input required value={code} onChange={e => setCode(e.target.value.toUpperCase())} /></label>
      <label>No. HP saat order<input required value={phone} onChange={e => setPhone(e.target.value)} /></label>
      <button className="btn">Lihat status</button>
    </form>
    {err && <p className="err">{err}</p>}
    {o && <div className="res">
      <h3>{o.code} · {o.status}</h3>
      {o.status === 'Menunggu Pembayaran' && d.payment && <p className="note">Transfer {rp(o.total)} ke {d.payment.name} {d.payment.account_number} a.n. {d.payment.account_name}. {d.payment.note}</p>}
      <p>{o.shipping_method}{o.resi ? ` · Resi ${o.resi}` : ''}</p>
      {o.items.map((i, k) => <p key={k}>{i.name} ({i.size}) × {i.qty}</p>)}
      <p><b>Total {rp(o.total)}</b></p>
      <h3>Perjalanan paket</h3>
      {d.events.length ? <ol className="tl">{d.events.map(e => <li key={e.id}><small>{new Date(e.created_at).toLocaleString('id-ID')}</small><p>{e.note}</p></li>)}</ol> : <p>Belum ada update pengiriman.</p>}
    </div>}
  </div>;
}
