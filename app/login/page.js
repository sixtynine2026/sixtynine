'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
export default function Login() {
  const [reg, setReg] = useState(false); const [busy, setBusy] = useState(false);
  const go = () => {
    const n = new URLSearchParams(location.search).get('next') || '/';
    location.href = n.startsWith('/') && !n.startsWith('//') ? n : '/';
  };
  const submit = async e => {
    e.preventDefault(); setBusy(true);
    const f = new FormData(e.target); const email = f.get('email'), password = f.get('password');
    const { data, error } = reg ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return alert(error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message);
    if (data.session) { const { data: a } = await supabase.rpc('is_admin'); if (a) { location.href = '/admin'; return; } go(); } else alert('Akun dibuat. Cek email kamu untuk konfirmasi, lalu masuk.');
  };
  return <div className="wrap tr">
    <h2 className="ttl"><span>{reg ? 'DAFTAR' : 'MASUK'}</span></h2>
    <form onSubmit={submit}>
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <label>Password<input name="password" type="password" required minLength={6} autoComplete={reg ? 'new-password' : 'current-password'} /></label>
      <button className="btn" disabled={busy}>{busy ? 'Memproses...' : reg ? 'Buat akun' : 'Masuk'}</button>
    </form>
    <p className="alt">{reg ? 'Sudah punya akun?' : 'Belum punya akun?'} <a href="#" onClick={e => { e.preventDefault(); setReg(!reg); }}>{reg ? 'Masuk' : 'Daftar'}</a></p>
  </div>;
}
