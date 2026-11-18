const sb = supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
const $ = s => document.querySelector(s);
const rp = n => "Rp" + Number(n || 0).toLocaleString("id-ID");
const disc = p => (p.strike_price > p.price ? Math.round((1 - p.price / p.strike_price) * 100) : 0);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
const cart = { get: () => JSON.parse(localStorage.getItem("cart") || "[]"), set(c) { localStorage.setItem("cart", JSON.stringify(c)); const e = $("#cc"); if (e) e.textContent = c.reduce((a, i) => a + i.qty, 0); } };
const me = async () => (await sb.auth.getSession()).data.session;
const isAdmin = async () => !!(await sb.rpc("is_admin")).data;
async function requireLogin() {
  const s = await me();
  if (!s) { location.href = "/login?next=" + encodeURIComponent(location.pathname + location.search); throw new Error("login"); }
  return s;
}
async function layout() {
  const s = await me(); const adm = s ? await isAdmin() : false;
  $("#hd").innerHTML = `<div class="bar">LEBIH HEMAT BELANJA DI WEBSITE RESMI SIXTYNINE PROJECT</div>
  <header class="hd"><a href="/" class="logo">SIXTY<br>NINE</a><nav>
    <a href="/#shop">SHOP</a><a href="/pesanan">PESANAN SAYA</a><a href="/checkout">KERANJANG (<span id="cc">0</span>)</a>
    ${adm ? "<a href=\"/admin\" class=\"adm-link\">ADMIN</a>" : ""}
    ${s ? `<a href="#" id="out">KELUAR</a><span class="who">${esc(s.user.email)}</span>` : "<a href=\"/login\">MASUK</a>"}
  </nav></header>`;
  $("#ft").innerHTML = `<footer class="ft"><div><h4>Lokasi</h4><p>Arcamanik, Kota Bandung</p></div>
  <div><h4>Cara order</h4><p>Pilih produk, isi data di checkout, transfer, lalu pantau kirimannya di Pesanan Saya.</p></div>
  <div><h4>Customer service</h4><p>+62 851-7104-0017</p></div></footer>
  <div class="copy">Copyright 2026 © sixtynineproject</div><a class="wa" href="https://wa.me/6285171040017">WA</a>`;
  cart.set(cart.get());
  const o = $("#out"); if (o) o.onclick = async e => { e.preventDefault(); await sb.auth.signOut(); localStorage.setItem("cart", "[]"); location.href = "/"; };
}
function card(x) {
  return `<a href="/produk?id=${x.id}" class="card">${disc(x) ? `<i class="badge">-${disc(x)}%</i>` : ""}${x.stock <= 0 ? "<i class=\"sold\">HABIS</i>" : ""}
  <img src="${esc(x.image_url)}" alt="${esc(x.name)}"><small>${esc(x.category)}</small><p>${esc(x.name)}</p>
  <b>${x.strike_price > x.price ? `<s>${rp(x.strike_price)}</s> ` : ""}${rp(x.price)}</b></a>`;
}
function slider(items) {
  const h = $("#hero");
  if (!items.length) { h.className = "hero empty"; h.textContent = "SIXTYNINE PROJECT"; return; }
  h.className = "hero"; let i = 0;
  const draw = () => {
    h.innerHTML = `<img src="${esc(items[i].image_url)}" alt="Banner">` + (items.length > 1 ? "<button class=\"arr l\" id=\"pv\">‹</button><button class=\"arr r\" id=\"nx\">›</button>" : "");
    if (items.length > 1) { $("#pv").onclick = () => { i = (i - 1 + items.length) % items.length; draw(); }; $("#nx").onclick = () => { i = (i + 1) % items.length; draw(); }; }
  };
  draw(); if (items.length > 1) setInterval(() => { i = (i + 1) % items.length; draw(); }, 5000);
}
