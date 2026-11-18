import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { sb } from '../../../lib/server';
export async function POST(req) {
  const b = await req.json(); const db = sb();
  if (!b.buyer_name || !b.buyer_phone || !b.address || !b.items?.length) return NextResponse.json({ error: 'Data belum lengkap' }, { status: 400 });
  const { data: ps } = await db.from('products').select('*').in('id', b.items.map(i => i.id)).eq('active', true);
  const items = b.items.map(i => { const p = ps?.find(x => x.id === i.id); return p && { id: p.id, name: p.name, size: i.size, qty: Math.max(1, +i.qty || 1), price: p.price }; }).filter(Boolean);
  if (!items.length) return NextResponse.json({ error: 'Produk tidak tersedia' }, { status: 400 });
  const { data: sh } = await db.from('shipping_methods').select('*').eq('name', b.shipping_method).maybeSingle();
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0); const shipping = sh?.cost || 0;
  const code = 'SP' + Date.now().toString(36).toUpperCase().slice(-6) + Math.floor(Math.random() * 90 + 10);
  const { error } = await db.from('orders').insert({ code, buyer_name: b.buyer_name, buyer_phone: b.buyer_phone, buyer_email: b.buyer_email || null, address: b.address, items, subtotal, shipping_cost: shipping, total: subtotal + shipping, payment_method: b.payment_method, shipping_method: b.shipping_method, courier: b.shipping_method });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try {
    if (process.env.RESEND_API_KEY) {
      const to = [b.buyer_email, process.env.ADMIN_NOTIFY_EMAIL].filter(Boolean);
      const html = `<h2>Pesanan ${code}</h2><p>${b.buyer_name} - ${b.buyer_phone}</p><p>${b.address}</p><ul>${items.map(i => `<li>${i.name} (${i.size}) x${i.qty}</li>`).join('')}</ul><p>Total: Rp${(subtotal + shipping).toLocaleString('id-ID')}</p><p>Cek status di website dengan kode ${code}.</p>`;
      if (to.length) await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.RESEND_FROM, to, subject: `Pesanan ${code} - SIXTYNINE PROJECT`, html });
    }
  } catch {}
  return NextResponse.json({ code });
}
