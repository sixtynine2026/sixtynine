import { NextResponse } from 'next/server';
import { sb } from '../../../../lib/server';
export async function GET(req) {
  const db = sb();
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  const { data: a } = await db.from('admins').select('email');
  if (!a?.some(x => x.email.toLowerCase() === user.email.toLowerCase())) return NextResponse.json({ error: 'Bukan admin' }, { status: 403 });
  const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data.users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at, confirmed: !!u.email_confirmed_at })) });
}
