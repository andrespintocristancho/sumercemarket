import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export function register(req, res) {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Este email ya está registrado' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password, phone, role)
    VALUES (?, ?, ?, ?, 'user')
  `).run(name.trim(), email.toLowerCase().trim(), hash, phone || null);

  const user = db.prepare('SELECT id, name, email, role, phone FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = signToken(user);

  res.status(201).json({ user, token });
}

export function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone };
  const token = signToken(safeUser);

  res.json({ user: safeUser, token });
}

export function me(req, res) {
  res.json({ user: req.user });
}
