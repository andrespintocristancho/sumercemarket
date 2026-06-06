import { db } from '../config/db.js';

export function dashboardStats(req, res) {
  const totalUsers = db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'user'`).get().c;
  const totalAdmins = db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'admin'`).get().c;
  const totalOffers = db.prepare(`SELECT COUNT(*) as c FROM offers`).get().c;
  const activeOffers = db.prepare(`SELECT COUNT(*) as c FROM offers WHERE status = 'active'`).get().c;
  const soldOffers = db.prepare(`SELECT COUNT(*) as c FROM offers WHERE status = 'sold'`).get().c;
  const totalContacts = db.prepare(`SELECT COUNT(*) as c FROM contacts`).get().c;
  const totalViews = db.prepare(`SELECT COALESCE(SUM(views), 0) as c FROM offers`).get().c;

  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as count FROM offers WHERE status = 'active' GROUP BY category ORDER BY count DESC
  `).all();

  const byDepartment = db.prepare(`
    SELECT department, COUNT(*) as count FROM offers WHERE status = 'active' GROUP BY department ORDER BY count DESC LIMIT 10
  `).all();

  const byCity = db.prepare(`
    SELECT city, COUNT(*) as count FROM offers WHERE status = 'active' GROUP BY city ORDER BY count DESC LIMIT 10
  `).all();

  const topUsers = db.prepare(`
    SELECT u.id, u.name, u.email, COUNT(o.id) as offer_count
    FROM users u LEFT JOIN offers o ON o.user_id = u.id
    WHERE u.role = 'user'
    GROUP BY u.id ORDER BY offer_count DESC LIMIT 10
  `).all();

  res.json({
    totals: { totalUsers, totalAdmins, totalOffers, activeOffers, soldOffers, totalContacts, totalViews },
    byCategory,
    byDepartment,
    byCity,
    topUsers
  });
}

export function listUsers(req, res) {
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
           (SELECT COUNT(*) FROM offers WHERE user_id = u.id) as offer_count
    FROM users u ORDER BY u.created_at DESC
  `).all();
  res.json(users);
}

export function deleteUser(req, res) {
  const { id } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (user.role === 'admin') return res.status(403).json({ error: 'No puedes eliminar un administrador' });

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ ok: true });
}

export function listAllOffers(req, res) {
  const offers = db.prepare(`
    SELECT o.*, u.name as seller_name, u.email as seller_email
    FROM offers o LEFT JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
  `).all();
  res.json(offers);
}
