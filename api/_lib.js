const { createClient } = require('@supabase/supabase-js');
exports.db = () => createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
exports.token = req => (req.headers.authorization || '').replace('Bearer ', '');
