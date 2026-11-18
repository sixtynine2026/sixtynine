'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase, rp } from '../../lib/supabase';
import './admin.css';

const STATUS = ['Menunggu Pembayaran', 'Dibayar', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'];
const TABLES = {
  products: { label: 'Produk', order: 'created_at', def: { name: 'Produk baru', category: 'JACKET', price: 0, stock: 0 },
    fields: [['image_url', 'Foto', 'image'], ['name', 'Nama artikel'], ['category', 'Kategori'], ['price', 'Harga jual', 'number'], ['strike_price', 'Harga coret (kosongkan jika tidak ada)', 'number'], ['stock', 'Stok', 'number'], ['sizes', 'Ukuran (pisah koma)'], ['active', 'Tampil di toko', 'bool']] },
  banners: { label: 'Banner', order: 'sort', def: { sort: 0 },
    fields: [['image_url', 'Foto banner', 'image'], ['sort', 'Urutan', 'number'], ['active', 'Tampil', 'bool']] },
  payment_methods: { label: 'Pembayaran', order: 'name', def: { name: 'Metode baru' },
    fields: [['name', 'Nama metode (mis. BCA, QRIS)'], ['account_name', 'Atas nama'], ['account_number', 'No. rekening'], ['note', 'Catatan untuk pembeli'], ['active', 'Aktif', 'bool']] },
  shipping_methods: { label: 'Jasa kirim', order: 'name', def: { name: 'Ekspedisi baru', cost: 0 },
    fields: [['name', 'Nama jasa kirim'], ['cost', 'Ongkir (Rp)', 'number'], ['active', 'Aktif', 'bool']] },
};

function Crud({ t }) {
  const c = TABLES[t]; const [rows, setRows] = useState([]);
  const load = useCallback(async () => { const { data } = await supabase.from(t).select('*').order(c.order); setRows(data || []); }, [t]);
  useEffect(() => { load(); }, [load]);
  const set = (id, k, v) => setRows(r => r.map(x => x.id === id ? { ...x, [k]: v } : x));
  const save = async x => { const { error } = await supabase.from(t).update(x).eq('id', x.id); alert(error ? error.message : 'Tersimpan'); };
  const del = async x => { if (confirm('Hapus data ini?')) { await supabase.from(t).delete().eq('id', x.id); load(); } };
  const add = async () => { await supabase.from(t).insert(c.def); load(); };
  const up = async (x, e) => {
    const file = e.target.files[0]; if (!file) return;
    const path = Date.now() + '-' + file.name.replace(/[^\w.]/g, '_');
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) return alert(error.message);
    set(x.id, 'image_url', supabase.storage.from('images').getPublicUrl(path).data.publicUrl);
  };
  return <div>
    <button className="btn" onClick={add}>+ Tambah {c.label}</button>
    <div className="list">{rows.map(x => <div className="box" key={x.id}>
      {c.fields.map(([k, l, ty]) => <label key={k}>{l}
        {ty === 'image' ? <>{x[k] && <img src={x[k]} className="thumb" alt="" />}<input type="file" accept="image/*" onChange={e => up(x, e)} /></>
          : ty === 'bool' ? <input type="checkbox" checked={!!x[k]} onChange={e => set(x.id, k, e.target.checked)} />
          : <input type={ty || 'text'} value={x[k] ?? ''} onChange={e => set(x.id, k, ty === 'number' ? (e.target.value === '' ? null : +e.target.value) : e.target.value)} />}
      </label>)}
      <div className="row"><button className="btn" onClick={() => save(x)}>Simpan</button><button className="btn ghost" onClick={() => del(x)}>Hapus</button></div>
    </div>)}</div>
  </div>;
}

function Orders() {
  const [rows, setRows] = useState([]); const [ev, setEv] = useState([]); const [note, setNote] = useState({});
  const load = useCallback(async () => {
    const a = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const b = await supabase.from('tracking_events').select('*').order('created_at', { ascending: false });
    setRows(a.data || []); setEv(b.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const patch = async (o, p) => { await supabase.from('orders').update(p).eq('id', o.id); load(); };
  const proses = async o => { await patch(o, { status: 'Diproses' }); window.open('/admin/print/' + o.id, '_blank'); };
  const addEv = async o => { if (!note[o.id]?.trim()) return; await supabase.from('tracking_events').insert({ order_id: o.id, note: note[o.id].trim() }); setNote({ ...note, [o.id]: '' }); load(); };
  return <div className="list">{rows.map(o => <div className="box" key={o.id}>
    <h3>{o.code} · {rp(o.total)}</h3>
    <p>{o.buyer_name} · {o.buyer_phone}<br />{o.address}</p>
    <p>{o.items.map(i => `${i.name} (${i.size}) x${i.qty}`).join(', ')}</p>
    <p>{o.shipping_method} · bayar via {o.payment_method}</p>
    <label>Status<select value={o.status} onChange={e => patch(o, { status: e.target.value })}>{STATUS.map(s => <option key={s}>{s}</option>)}</select></label>
    <label>Ekspedisi<input defaultValue={o.courier || ''} onBlur={e => patch(o, { courier: e.target.value })} /></label>
    <label>No. resi<input defaultValue={o.resi || ''} onBlur={e => patch(o, { resi: e.target.value })} /></label>
    <div className="row"><button className="btn" onClick={() => proses(o)}>Proses &amp; cetak label</button><a className="btn ghost" target="_blank" href={'/admin/print/' + o.id}>Cetak ulang</a></div>
    <label>Update tracking (tempel dari web resmi ekspedisi)<textarea rows={3} value={note[o.id] || ''} onChange={e => setNote({ ...note, [o.id]: e.target.value })} /></label>
    <button className="btn" onClick={() => addEv(o)}>Tambah update</button>
    {ev.filter(e => e.order_id === o.id).map(e => <p className="evt" key={e.id}><small>{new Date(e.created_at).toLocaleString('id-ID')}</small> {e.note} <a onClick={async () => { await supabase.from('tracking_events').delete().eq('id', e.id); load(); }}>hapus</a></p>)}
  </div>)}{!rows.length && <p>Belum ada pesanan.</p>}</div>;
}

export default function Admin() {
  const [ok, setOk] = useState(null); const [tab, setTab] = useState('orders');
  useEffect(() => { supabase.auth.getSession().then(async ({ data }) => { if (!data.session) return setOk(false); const { data: a } = await supabase.rpc('is_admin'); setOk(!!a); }); }, []);
  const login = async e => {
    e.preventDefault(); const f = new FormData(e.target);
    const { error } = await supabase.auth.signInWithPassword({ email: f.get('email'), password: f.get('password') });
    if (error) return alert(error.message);
    const { data } = await supabase.rpc('is_admin'); data ? setOk(true) : alert('Akun ini belum terdaftar sebagai admin');
  };
  if (ok === null) return <div className="adm">Memuat...</div>;
  if (!ok) return <form className="adm login" onSubmit={login}><h1>SIXTYNINE ADMIN</h1><label>Email<input name="email" type="email" required /></label><label>Password<input name="password" type="password" required /></label><button className="btn">Masuk</button></form>;
  return <div className="adm">
    <div className="tabs"><b>SIXTYNINE ADMIN</b>
      {[['orders', 'Pesanan'], ...Object.entries(TABLES).map(([k, v]) => [k, v.label])].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      <button onClick={() => { location.href = '/'; }}>Lihat toko</button><button onClick={async () => { await supabase.auth.signOut(); setOk(false); }}>Keluar</button></div>
    {tab === 'orders' ? <Orders /> : <Crud key={tab} t={tab} />}
  </div>;
}
