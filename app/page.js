import Link from 'next/link';
import Slider from '../components/Slider';
import { supabase, rp, disc } from '../lib/supabase';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const [{ data: b }, { data: p }] = await Promise.all([
    supabase.from('banners').select('*').eq('active', true).order('sort'),
    supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false }),
  ]);
  const prods = p || [];
  const cats = [...new Set(prods.map(x => x.category))];
  return <>
    <Slider items={b || []} />
    <div id="shop" className="wrap">
      {cats.map(c => <section key={c} id={c}>
        <h2 className="ttl"><span>NEW PRODUCT {c}</span></h2>
        <div className="grid">
          {prods.filter(x => x.category === c).map(x => <Link href={`/product/${x.id}`} key={x.id} className="card">
            {disc(x) > 0 && <i className="badge">-{disc(x)}%</i>}
            {x.stock <= 0 && <i className="sold">HABIS</i>}
            <img src={x.image_url} alt={x.name} />
            <small>{x.category}</small>
            <p>{x.name}</p>
            <b>{x.strike_price > x.price && <s>{rp(x.strike_price)}</s>} {rp(x.price)}</b>
          </Link>)}
        </div>
      </section>)}
      {!cats.length && <p className="empty-txt">Belum ada produk. Tambahkan lewat /admin.</p>}
      {cats.length > 0 && <>
        <h2 className="ttl"><span>PILIH KATEGORI</span></h2>
        <div className="tiles">{cats.map(c => {
          const first = prods.find(x => x.category === c);
          return <a href={`#${c}`} key={c} className="tile"><img src={first.image_url} alt="" /><span>{c}</span></a>;
        })}</div>
      </>}
    </div>
  </>;
}
