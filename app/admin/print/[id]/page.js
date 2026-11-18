'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
const SENDER = { name: 'sixtynineproject', phone: '085171040017', addr: 'Arcamanik, Kota Bandung' };
export default function Print() {
  const { id } = useParams(); const [o, setO] = useState(null); const [err, setErr] = useState('');
  useEffect(() => {
    supabase.from('orders').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error || !data) return setErr('Tidak bisa memuat. Pastikan sudah login di /admin.');
      setO(data); setTimeout(() => window.print(), 600);
    });
  }, [id]);
  if (err) return <p style={{ padding: 20 }}>{err}</p>;
  if (!o) return null;
  return <div className="label">
    <style>{`@page{size:100mm 150mm;margin:4mm}body{margin:0}.label{width:92mm;font:12px 'Courier New',monospace;color:#000}.label h2{margin:0 0 4px;font-size:14px;border-bottom:2px solid #000}.label section{border:2px solid #000;padding:8px;margin-bottom:6px}`}</style>
    <section><h2>PENGIRIM</h2><b>{SENDER.name}</b><br />{SENDER.phone}<br />{SENDER.addr}</section>
    <section><h2>PENERIMA</h2><b style={{ fontSize: 15 }}>{o.buyer_name}</b><br />{o.buyer_phone}<br />{o.address}</section>
    <section><h2>{o.code} · {o.courier || o.shipping_method}</h2>{o.items.map((i, k) => <div key={k}>{i.name} ({i.size}) x{i.qty}</div>)}{o.resi && <div>Resi: {o.resi}</div>}</section>
  </div>;
}
