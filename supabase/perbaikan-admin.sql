-- Jalankan SEKALI di Supabase > SQL Editor. Aman diulang.
create or replace function is_admin() returns boolean language sql security definer stable set search_path = public as
$$ select exists(select 1 from admins where lower(email) = lower(auth.jwt()->>'email')) $$;
grant execute on function is_admin() to anon, authenticated;

do $$ declare t text; begin
 foreach t in array array['banners','products','payment_methods','shipping_methods','orders','tracking_events'] loop
  execute format('alter table %I enable row level security', t);
  execute format('drop policy if exists adm on %I', t);
  execute format('create policy adm on %I for all using (is_admin()) with check (is_admin())', t);
 end loop;
 foreach t in array array['banners','products','payment_methods','shipping_methods'] loop
  execute format('drop policy if exists pub on %I', t);
  execute format('create policy pub on %I for select using (active)', t);
 end loop;
end $$;

alter table orders add column if not exists user_id uuid references auth.users on delete set null;
drop policy if exists own_orders on orders;
create policy own_orders on orders for select using (user_id = auth.uid());
drop policy if exists own_events on tracking_events;
create policy own_events on tracking_events for select using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

insert into storage.buckets (id,name,public) values ('images','images',true) on conflict do nothing;
drop policy if exists "img read" on storage.objects;
create policy "img read" on storage.objects for select using (bucket_id='images');
drop policy if exists "img admin" on storage.objects;
create policy "img admin" on storage.objects for all using (bucket_id='images' and is_admin()) with check (bucket_id='images' and is_admin());

alter table payment_methods add column if not exists qris_url text;
update payment_methods set account_number='639 584 6969', account_name='SIXTYNINE PROJECT INDONESIA', active=true where name='BCA';
insert into payment_methods(name,account_name,account_number)
  select 'BCA','SIXTYNINE PROJECT INDONESIA','639 584 6969' where not exists (select 1 from payment_methods where name='BCA');
insert into payment_methods(name,account_name,active)
  select 'QRIS','SIXTYNINE PROJECT INDONESIA',false where not exists (select 1 from payment_methods where name='QRIS');
