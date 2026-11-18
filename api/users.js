const { db, token } = require('./_lib');
module.exports = async (req, res) => {
  const d = db();
  const { data: { user } } = await d.auth.getUser(token(req));
  if (!user) return res.status(401).json({ error: 'Belum login' });
  const { data: a } = await d.from('admins').select('email');
  if (!a?.some(x => x.email.toLowerCase() === user.email.toLowerCase())) return res.status(403).json({ error: 'Bukan admin' });
  const { data, error } = await d.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data.users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at, confirmed: !!u.email_confirmed_at })) });
};
