import { db } from '../config/db.js';
import { HttpError } from '../middleware/error.middleware.js';

export function listUsers() {
  return db.prepare(
    'SELECT id, name, email, phone, department, city, role, created_at FROM users ORDER BY created_at DESC'
  ).all();
}

export function deleteUser(adminId, userId) {
  if (adminId === userId) throw new HttpError('No puedes eliminarte a ti mismo', 400);
  const u = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId);
  if (!u) throw new HttpError('Usuario no encontrado', 404);
  if (u.role === 'admin') throw new HttpError('No se puede eliminar otro admin', 403);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  return { ok: true };
}

export function stats() {
  const totalUsers = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  const totalOffers = db.prepare('SELECT COUNT(*) AS n FROM offers').get().n;
  const activeOffers = db.prepare("SELECT COUNT(*) AS n FROM offers WHERE status='active'").get().n;
  const totalContacts = db.prepare('SELECT IFNULL(SUM(contacts),0) AS n FROM offers').get().n;

  const byCategory = db.prepare(`
    SELECT category, COUNT(*) AS n FROM offers WHERE status='active'
    GROUP BY category ORDER BY n DESC
  `).all();

  const byDept = db.prepare(`
    SELECT department, COUNT(*) AS n FROM offers WHERE status='active'
    GROUP BY department ORDER BY n DESC LIMIT 10
  `).all();

  return { totalUsers, totalOffers, activeOffers, totalContacts, byCategory, byDept };
}
