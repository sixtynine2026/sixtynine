const { Resend } = require('resend');
const { db, token } = require('./_lib');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const b = req.body || {}; const d = db();
  const { data: { user } } = await d.auth.getUser(token(req));
  if (!user) return res.status(401).json({ error: 'Silakan login dulu' });
  if (!b.buyer_name || !b.buyer_phone || !b.address || !b.items?.length) return res.status(400).json({ error: 'Data belum lengkap' });
  const { data: ps } = await d.from('products').select('*').in('id', b.items.map(i => i.id)).eq('active', true);
  const items = b.items.map(i => { const p = ps?.find(x => x.id === i.id); return p && { id: p.id, name: p.name, size: i.size, qty: Math.max(1, +i.qty || 1), price: p.price }; }).filter(Boolean);
  if (!items.length) return res.status(400).json({ error: 'Produk tidak tersedia' });
  const need = {}; items.forEach(i => { need[i.id] = (need[i.id] || 0) + i.qty; });
  for (const p of ps) if ((need[p.id] || 0) > p.stock) return res.status(400).json({ error: `Stok ${p.name} tinggal ${p.stock}` });
  const { data: sh } = await d.from('shipping_methods').select('*').eq('name', b.shipping_method).maybeSingle();
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0), shipping = sh?.cost || 0;
  const code = 'SP' + Date.now().toString(36).toUpperCase().slice(-6) + Math.floor(Math.random() * 90 + 10);
  const { error } = await d.from('orders').insert({ code, user_id: user.id, buyer_name: b.buyer_name, buyer_phone: b.buyer_phone, buyer_email: b.buyer_email || user.email, address: b.address, items, subtotal, shipping_cost: shipping, total: subtotal + shipping, payment_method: b.payment_method, shipping_method: b.shipping_method, courier: b.shipping_method });
  if (error) return res.status(500).json({ error: error.message });
  for (const p of ps) if (need[p.id]) await d.from('products').update({ stock: p.stock - need[p.id] }).eq('id', p.id);
  try {
    if (process.env.RESEND_API_KEY) {
      const to = [b.buyer_email || user.email, process.env.ADMIN_NOTIFY_EMAIL].filter(Boolean);
      const html = `<h2>Pesanan ${code}</h2><p>${b.buyer_name} - ${b.buyer_phone}</p><p>${b.address}</p><ul>${items.map(i => `<li>${i.name} (${i.size}) x${i.qty}</li>`).join('')}</ul><p>Total: Rp${(subtotal + shipping).toLocaleString('id-ID')}</p><p>Pantau status di menu Pesanan Saya.</p>`;
      await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.RESEND_FROM, to, subject: `Pesanan ${code} - SIXTYNINE PROJECT`, html });
    }
  } catch (e) {}
  res.json({ code });
};
