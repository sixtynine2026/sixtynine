import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const rp = n => 'Rp' + Number(n || 0).toLocaleString('id-ID');
export const disc = p => (p.strike_price > p.price ? Math.round((1 - p.price / p.strike_price) * 100) : 0);
