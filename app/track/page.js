'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, rp } from '../../lib/supabase';
export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState(null); const [ev, setEv] = useState([]); const [pay, setPay] = useState([]); const [open, setOpen] = useState('');
  useEffect(() => {
    setOpen(new URLSearchParams(location.search).get('code') || '');
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return router.replace('/login?next=/track');
      const a = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      const b = await supabase.from('tracking_events').select('*').order('created_at', { ascending: false });
      const c = await supabase.from('payment_methods').select('*');
      setOrders(a.data || []); setEv(b.data || []); setPay(c.data || []);
    });
  }, []);
  if (!orders) return <div className="wrap"><p className="empty-txt">Memuat pesanan...</p></div>;
  return <div className="wrap tr">
    <h2 className="ttl"><span>PESANAN SAYA</span></h2>
    {!orders.length && <p className="empty-txt">Belum ada pesanan.</p>}
    {orders.map(o => {
      const p = pay.find(x => x.name === o.payment_method); const events = ev.filter(e => e.order_id === o.id);
      return <details className="res" key={o.id} open={o.code === open}>
        <summary><b>{o.code}</b> · {o.status} · {rp(o.total)}<br /><small>{new Date(o.created_at).toLocaleDateString('id-ID')}</small></summary>
        {o.status === 'Menunggu Pembayaran' && p && <p className="note">Transfer {rp(o.total)} ke {p.name} {p.account_number} a.n. {p.account_name}. {p.note}</p>}
        <p>{o.shipping_method}{o.resi ? ` · Resi ${o.resi}` : ''}</p>
        {o.items.map((i, k) => <p key={k}>{i.name} ({i.size}) × {i.qty}</p>)}
        <h3>Perjalanan paket</h3>
        {events.length ? <ol className="tl">{events.map(e => <li key={e.id}><small>{new Date(e.created_at).toLocaleString('id-ID')}</small><p>{e.note}</p></li>)}</ol> : <p>Belum ada update pengiriman.</p>}
      </details>;
    })}
  </div>;
}
