'use client';
import { useEffect, useState } from 'react';
export default function Slider({ items }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI(x => (x + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);
  if (!items.length) return <div className="hero empty">SIXTYNINE PROJECT</div>;
  const go = d => setI(x => (x + d + items.length) % items.length);
  return <div className="hero">
    <img src={items[i].image_url} alt="Banner" />
    {items.length > 1 && <><button className="arr l" onClick={() => go(-1)} aria-label="Sebelumnya">‹</button><button className="arr r" onClick={() => go(1)} aria-label="Berikutnya">›</button></>}
  </div>;
}
