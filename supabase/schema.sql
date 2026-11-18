-- Jalankan di Supabase > SQL Editor
create table admins(email text primary key);
create function is_admin() returns boolean language sql security definer stable as
$$ select exists(select 1 from admins where email = auth.jwt()->>'email') $$;

create table banners(id uuid primary key default gen_random_uuid(), image_url text not null default '', sort int default 0, active bool default true);
create table products(id uuid primary key default gen_random_uuid(), name text not null, category text default 'JACKET', price int default 0, strike_price int, image_url text, stock int default 0, sizes text default 'S,M,L,XL', active bool default true, created_at timestamptz default now());
create table payment_methods(id uuid primary key default gen_random_uuid(), name text not null, account_name text, account_number text, note text, active bool default true);
create table shipping_methods(id uuid primary key default gen_random_uuid(), name text not null, cost int default 0, active bool default true);
create table orders(id uuid primary key default gen_random_uuid(), code text unique, buyer_name text, buyer_phone text, buyer_email text, address text, items jsonb, subtotal int, shipping_cost int, total int, payment_method text, shipping_method text, status text default 'Menunggu Pembayaran', courier text, resi text, created_at timestamptz default now());
create table tracking_events(id uuid primary key default gen_random_uuid(), order_id uuid references orders on delete cascade, note text, created_at timestamptz default now());

do $$ declare t text; begin
 foreach t in array array['banners','products','payment_methods','shipping_methods','orders','tracking_events'] loop
  execute format('alter table %I enable row level security', t);
  execute format('create policy adm on %I for all using (is_admin()) with check (is_admin())', t);
 end loop;
 foreach t in array array['banners','products','payment_methods','shipping_methods'] loop
  execute format('create policy pub on %I for select using (active)', t);
 end loop;
end $$;

insert into storage.buckets (id,name,public) values ('images','images',true) on conflict do nothing;
create policy "img read" on storage.objects for select using (bucket_id='images');
create policy "img admin" on storage.objects for all using (bucket_id='images' and is_admin()) with check (bucket_id='images' and is_admin());

insert into payment_methods(name,account_name,account_number) values ('BCA','SIXTYNINE PROJECT','000000000');
insert into shipping_methods(name,cost) values ('JNE REG',20000),('J&T',20000),('SiCepat',18000);
-- Setelah membuat user admin di Authentication > Users, jalankan:
-- insert into admins values ('emailadmin@kamu.com');
