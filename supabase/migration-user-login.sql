-- Jalankan SEKALI di Supabase > SQL Editor (setelah schema.sql)
alter table orders add column if not exists user_id uuid references auth.users on delete set null;
create policy own_orders on orders for select using (user_id = auth.uid());
create policy own_events on tracking_events for select
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
