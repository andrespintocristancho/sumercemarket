import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { signToken } from '../middleware/auth.middleware.js';
import { DEPARTMENTS, citiesOf } from '../config/colombia.js';
import { HttpError } from '../middleware/error.middleware.js';

function normalize(str = '') {
  return String(str).trim();
}

function validateLocation(department, city) {
  if (!DEPARTMENTS.includes(department)) {
    throw new HttpError('Departamento inválido', 400);
  }
  if (!citiesOf(department).includes(city)) {
    throw new HttpError(`Ciudad inválida para ${department}`, 400);
  }
}

export function registerUser({ name, email, password, phone, department, city }) {
  name = normalize(name);
  email = normalize(email).toLowerCase();
  phone = normalize(phone);
  department = normalize(department);
  city = normalize(city);

  if (!name || name.length < 2) throw new HttpError('Nombre requerido', 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError('Correo inválido', 400);
  if (!password || password.length < 6) throw new HttpError('La contraseña debe tener al menos 6 caracteres', 400);
  if (!/^3\d{9}$/.test(phone)) throw new HttpError('Teléfono colombiano inválido (debe iniciar en 3 y tener 10 dígitos)', 400);
  validateLocation(department, city);

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) throw new HttpError('Ya existe un usuario con ese correo', 409);

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password, phone, department, city, role)
    VALUES (?, ?, ?, ?, ?, ?, 'user')
  `).run(name, email, hash, phone, department, city);

  const user = db.prepare(
    'SELECT id, name, email, phone, department, city, role FROM users WHERE id = ?'
  ).get(result.lastInsertRowid);

  const token = signToken(user);
  return { user, token };
}

export function loginUser({ email, password }) {
  email = normalize(email).toLowerCase();
  if (!email || !password) throw new HttpError('Correo y contraseña requeridos', 400);

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row) throw new HttpError('Credenciales inválidas', 401);

  const ok = bcrypt.compareSync(password, row.password);
  if (!ok) throw new HttpError('Credenciales inválidas', 401);

  const user = {
    id: row.id, name: row.name, email: row.email,
    phone: row.phone, department: row.department, city: row.city, role: row.role
  };
  const token = signToken(user);
  return { user, token };
}
