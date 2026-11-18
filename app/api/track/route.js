import { NextResponse } from 'next/server';
import { sb } from '../../../lib/server';
const n = s => String(s || '').replace(/\D/g, '').replace(/^62/, '0');
export async function GET(req) {
  const q = new URL(req.url).searchParams; const db = sb();
  const { data: o } = await db.from('orders').select('*').eq('code', (q.get('code') || '').trim().toUpperCase()).maybeSingle();
  if (!o || n(o.buyer_phone) !== n(q.get('phone'))) return NextResponse.json({ error: 'Pesanan tidak ditemukan. Cek kode dan no. HP.' }, { status: 404 });
  const { data: events } = await db.from('tracking_events').select('*').eq('order_id', o.id).order('created_at', { ascending: false });
  const { data: payment } = await db.from('payment_methods').select('*').eq('name', o.payment_method).maybeSingle();
  const { code, status, courier, resi, total, items, shipping_method, created_at } = o;
  return NextResponse.json({ order: { code, status, courier, resi, total, items, shipping_method, created_at }, events: events || [], payment });
}
