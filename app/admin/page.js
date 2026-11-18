'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase, rp } from '../../lib/supabase';
import './admin.css';

const STATUS = ['Menunggu Pembayaran', 'Dibayar', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'];
const TABLES = {
  products: { label: 'Produk', order: 'created_at', def: { name: 'Produk baru', category: 'JACKET', price: 0, stock: 0 },
    fields: [['image_url', 'Foto', 'image'], ['name', 'Nama artikel'], ['category', 'Kategori'], ['price', 'Harga jual', 'number'], ['strike_price', 'Harga coret', 'number'], ['stock', 'Sisa stok', 'number'], ['sizes', 'Ukuran (pisah koma)'], ['active', 'Tampil', 'bool']] },
  banners: { label: 'Banner', order: 'sort', def: { sort: 0 },
    fields: [['image_url', 'Foto banner', 'image'], ['sort', 'Urutan', 'number'], ['active', 'Tampil', 'bool']] },
  payment_methods: { label: 'Pembayaran', order: 'name', def: { name: 'Metode baru' },
    fields: [['name', 'Metode'], ['account_name', 'Atas nama'], ['account_number', 'No. rekening'], ['qris_url', 'Gambar QRIS', 'image'], ['note', 'Catatan'], ['active', 'Aktif', 'bool']] },
  shipping_methods: { label: 'Jasa kirim', order: 'name', def: { name: 'Ekspedisi baru', cost: 0 },
    fields: [['name', 'Jasa kirim'], ['cost', 'Ongkir (Rp)', 'number'], ['active', 'Aktif', 'bool']] },
};
const tok = async () => (await supabase.auth.getSession()).data.session?.access_token;
const getUsers = async () => { const r = await fetch('/api/admin/users', { headers: { Authorization: 'Bearer ' + await tok() } }); const j = await r.json(); if (!r.ok) throw new Error(j.error); return j.users; };

function Dash() {
  const [s, setS] = useState(null);
  useEffect(() => { (async () => {
    const o = (await supabase.from('orders').select('total,status')).data || [];
    const p = (await supabase.from('products').select('name,stock,active')).data || [];
    let u = '?'; try { u = (await getUsers()).length; } catch {}
    setS({ o, p, u });
  })(); }, []);
  if (!s) return <p>Memuat...</p>;
  const paid = s.o.filter(x => ['Dibayar', 'Diproses', 'Dikirim', 'Selesai'].includes(x.status));
  const low = s.p.filter(x => x.stock <= 3);
  return <div>
    <div className="cards">
      <div><small>Total pesanan</small><b>{s.o.length}</b></div>
      <div><small>Menunggu pembayaran</small><b>{s.o.filter(x => x.status === 'Menunggu Pembayaran').length}</b></div>
      <div><small>Perlu diproses</small><b>{s.o.filter(x => x.status === 'Dibayar').length}</b></div>
      <div><small>Omzet (sudah dibayar)</small><b>{rp(paid.reduce((a, x) => a + x.total, 0))}</b></div>
      <div><small>Pelanggan terdaftar</small><b>{s.u}</b></div>
      <div><small>Jumlah produk</small><b>{s.p.length}</b></div>
    </div>
    <h3>Stok menipis (3 atau kurang)</h3>
    {low.length ? <ul>{low.map((x, k) => <li key={k}>{x.name}: sisa {x.stock}</li>)}</ul> : <p>Semua stok aman.</p>}
  </div>;
}

function Crud({ t }) {
  const c = TABLES[t]; const [rows, setRows] = useState(null);
  const load = useCallback(async () => { const { data, error } = await supabase.from(t).select('*').order(c.order); if (error) alert('Gagal memuat: ' + error.message); setRows(data || []); }, [t]);
  useEffect(() => { load(); }, [load]);
  const set = (id, k, v) => setRows(r => r.map(x => x.id === id ? { ...x, [k]: v } : x));
  const save = async x => { const { error } = await supabase.from(t).update(x).eq('id', x.id); alert(error ? 'Gagal: ' + error.message : 'Tersimpan'); };
  const del = async x => { if (!confirm('Hapus data ini?')) return; const { error } = await supabase.from(t).delete().eq('id', x.id); if (error) alert(error.message); load(); };
  const add = async () => { const { error } = await supabase.from(t).insert(c.def); if (error) return alert('Gagal menambah: ' + error.message); load(); };
  const up = async (x, k, e) => {
    const file = e.target.files[0]; if (!file) return;
    const path = Date.now() + '-' + file.name.replace(/[^\w.]/g, '_');
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) return alert('Upload gagal: ' + error.message);
    const url = supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
    await supabase.from(t).update({ [k]: url }).eq('id', x.id); set(x.id, k, url);
  };
  return <div>
    <button className="btn" onClick={add}>+ Tambah {c.label}</button>
    <div className="scroll"><table><thead><tr>{c.fields.map(f => <th key={f[0]}>{f[1]}</th>)}<th /></tr></thead><tbody>
      {(rows || []).map(x => <tr key={x.id}>
        {c.fields.map(([k, , ty]) => <td key={k}>
          {ty === 'image' ? <>{x[k] && <img src={x[k]} className="thumb" alt="" />}<input type="file" accept="image/*" onChange={e => up(x, k, e)} /></>
            : ty === 'bool' ? <input type="checkbox" checked={!!x[k]} onChange={e => set(x.id, k, e.target.checked)} />
            : <input className={k === 'stock' && x[k] <= 3 ? 'low' : ''} type={ty || 'text'} value={x[k] ?? ''} onChange={e => set(x.id, k, ty === 'number' ? (e.target.value === '' ? null : +e.target.value) : e.target.value)} />}
        </td>)}
        <td><button className="btn" onClick={() => save(x)}>Simpan</button> <button className="btn ghost" onClick={() => del(x)}>Hapus</button></td>
      </tr>)}
    </tbody></table></div>
    {rows && !rows.length && <p>Belum ada data. Klik tombol Tambah.</p>}
  </div>;
}

function Orders() {
  const [rows, setRows] = useState([]); const [ev, setEv] = useState([]); const [note, setNote] = useState({}); const [f, setF] = useState('');
  const load = useCallback(async () => {
    const a = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const b = await supabase.from('tracking_events').select('*').order('created_at', { ascending: false });
    if (a.error) alert(a.error.message); setRows(a.data || []); setEv(b.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const patch = async (o, p) => {
    if (p.status === 'Dibatalkan' && o.status !== 'Dibatalkan') for (const i of o.items) {
      const { data: pr } = await supabase.from('products').select('stock').eq('id', i.id).maybeSingle();
      if (pr) await supabase.from('products').update({ stock: pr.stock + i.qty }).eq('id', i.id);
    }
    const { error } = await supabase.from('orders').update(p).eq('id', o.id); if (error) alert(error.message); load();
  };
  const proses = async o => { await patch(o, { status: 'Diproses' }); window.open('/admin/print/' + o.id, '_blank'); };
  const addEv = async o => { if (!note[o.id]?.trim()) return; await supabase.from('tracking_events').insert({ order_id: o.id, note: note[o.id].trim() }); setNote({ ...note, [o.id]: '' }); load(); };
  return <div>
    <label>Filter status<select value={f} onChange={e => setF(e.target.value)}><option value="">Semua</option>{STATUS.map(s => <option key={s}>{s}</option>)}</select></label>
    <div className="list">{rows.filter(o => !f || o.status === f).map(o => <div className="box" key={o.id}>
      <h3>{o.code} · {rp(o.total)} · {o.status}</h3>
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
    </div>)}{!rows.length && <p>Belum ada pesanan.</p>}</div>
  </div>;
}

function Users() {
  const [u, setU] = useState(null); const [o, setO] = useState([]);
  useEffect(() => { (async () => { try { setU(await getUsers()); } catch (e) { alert(e.message); setU([]); } setO((await supabase.from('orders').select('user_id,total,status')).data || []); })(); }, []);
  if (!u) return <p>Memuat...</p>;
  return <div><p><b>{u.length}</b> pelanggan terdaftar</p><div className="scroll"><table><thead><tr><th>Email</th><th>Daftar</th><th>Email terkonfirmasi</th><th>Jumlah pesanan</th></tr></thead><tbody>
    {u.map(x => <tr key={x.id}><td>{x.email}</td><td>{new Date(x.created_at).toLocaleDateString('id-ID')}</td><td>{x.confirmed ? 'Ya' : 'Belum'}</td><td>{o.filter(y => y.user_id === x.id).length}</td></tr>)}
  </tbody></table></div></div>;
}

export default function Admin() {
  const [ok, setOk] = useState(null); const [tab, setTab] = useState('dash');
  useEffect(() => { supabase.auth.getSession().then(async ({ data }) => { if (!data.session) return setOk(false); const { data: a } = await supabase.rpc('is_admin'); setOk(!!a); }); }, []);
  const login = async e => {
    e.preventDefault(); const f = new FormData(e.target);
    const { error } = await supabase.auth.signInWithPassword({ email: f.get('email'), password: f.get('password') });
    if (error) return alert(error.message);
    const { data } = await supabase.rpc('is_admin'); data ? setOk(true) : alert('Akun ini belum terdaftar sebagai admin');
  };
  if (ok === null) return <div className="adm">Memuat...</div>;
  if (!ok) return <form className="adm login" onSubmit={login}><h1>SIXTYNINE ADMIN</h1><label>Email<input name="email" type="email" required /></label><label>Password<input name="password" type="password" required /></label><button className="btn">Masuk</button></form>;
  const tabs = [['dash', 'Ringkasan'], ['orders', 'Pesanan'], ['products', 'Produk & stok'], ['banners', 'Banner'], ['payment_methods', 'Pembayaran'], ['shipping_methods', 'Jasa kirim'], ['users', 'Pelanggan']];
  return <div className="adm">
    <div className="tabs"><b>SIXTYNINE ADMIN</b>
      {tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      <button onClick={() => { location.href = '/'; }}>Lihat toko</button>
      <button onClick={async () => { await supabase.auth.signOut(); setOk(false); }}>Keluar</button></div>
    {tab === 'dash' ? <Dash /> : tab === 'orders' ? <Orders /> : tab === 'users' ? <Users /> : <Crud key={tab} t={tab} />}
  </div>;
}
