import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

const SECRET = process.env.JWT_SECRET || 'sumerce-dev-secret-change-me';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
  try {
    const payload = jwt.verify(token, SECRET);
    const user = db.prepare(
      'SELECT id, name, email, phone, department, city, role FROM users WHERE id = ?'
    ).get(payload.id);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function adminMiddleware(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  }
  next();
}

// Aliases por compatibilidad
export const authRequired = authMiddleware;
export const adminRequired = adminMiddleware;
