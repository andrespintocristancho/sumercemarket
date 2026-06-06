import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';
import { DEPARTMENTS, citiesOf, VALID_CATEGORIES } from '../config/colombia.js';
import { HttpError } from '../middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

function hydrate(offer) {
  if (!offer) return null;
  const images = db.prepare(
    'SELECT url, position FROM offer_images WHERE offer_id = ? ORDER BY position ASC'
  ).all(offer.id);
  const seller = db.prepare(
    'SELECT id, name, phone, department, city FROM users WHERE id = ?'
  ).get(offer.user_id);
  return { ...offer, images: images.map(i => i.url), seller };
}

export function createOffer(user, body, files) {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const priceRaw = body.price;
  const category = String(body.category || '').trim().toLowerCase();
  const department = String(body.department || user.department).trim();
  const city = String(body.city || user.city).trim();

  if (!title || title.length < 3) throw new HttpError('Título muy corto', 400);
  if (!description || description.length < 10) throw new HttpError('Descripción muy corta', 400);

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) throw new HttpError('Precio inválido', 400);

  if (!VALID_CATEGORIES.includes(category)) {
    throw new HttpError(`Categoría inválida. Opciones: ${VALID_CATEGORIES.join(', ')}`, 400);
  }
  if (!DEPARTMENTS.includes(department)) throw new HttpError('Departamento inválido', 400);
  if (!citiesOf(department).includes(city)) throw new HttpError('Ciudad inválida', 400);

  const result = db.prepare(`
    INSERT INTO offers (user_id, title, description, price, category, department, city)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, title, description, Math.round(price), category, department, city);

  const offerId = result.lastInsertRowid;

  // Imágenes (multer ya las guardó en disco)
  if (Array.isArray(files) && files.length > 0) {
    const insertImg = db.prepare(
      'INSERT INTO offer_images (offer_id, url, position) VALUES (?, ?, ?)'
    );
    files.forEach((f, idx) => {
      const url = `/uploads/${f.filename}`;
      insertImg.run(offerId, url, idx);
    });
  }

  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(offerId);
  return hydrate(offer);
}

export function listOffers(filters = {}) {
  const where = ["status = 'active'"];
  const params = [];

  if (filters.q) {
    where.push('(title LIKE ? OR description LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }
  if (filters.category) {
    where.push('category = ?');
    params.push(String(filters.category).toLowerCase());
  }
  if (filters.department) {
    where.push('department = ?');
    params.push(filters.department);
  }
  if (filters.city) {
    where.push('city = ?');
    params.push(filters.city);
  }
  if (filters.minPrice != null && filters.minPrice !== '') {
    where.push('price >= ?');
    params.push(Number(filters.minPrice));
  }
  if (filters.maxPrice != null && filters.maxPrice !== '') {
    where.push('price <= ?');
    params.push(Number(filters.maxPrice));
  }

  const order = filters.sort === 'price_asc' ? 'price ASC'
              : filters.sort === 'price_desc' ? 'price DESC'
              : 'created_at DESC';

  const limit = Math.min(Number(filters.limit) || 50, 100);
  const offset = Math.max(Number(filters.offset) || 0, 0);

  const rows = db.prepare(
    `SELECT * FROM offers WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  const total = db.prepare(
    `SELECT COUNT(*) AS n FROM offers WHERE ${where.join(' AND ')}`
  ).get(...params).n;

  return { total, items: rows.map(hydrate) };
}

export function getOfferById(id) {
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  if (!offer) throw new HttpError('Oferta no encontrada', 404);
  return hydrate(offer);
}

export function listMyOffers(userId) {
  const rows = db.prepare(
    'SELECT * FROM offers WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId);
  return rows.map(hydrate);
}

export function updateOffer(user, id, body) {
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  if (!offer) throw new HttpError('Oferta no encontrada', 404);
  if (offer.user_id !== user.id && user.role !== 'admin') {
    throw new HttpError('No autorizado', 403);
  }

  const fields = [];
  const params = [];
  const allowed = ['title', 'description', 'price', 'category', 'department', 'city', 'status'];
  for (const k of allowed) {
    if (body[k] != null) {
      fields.push(`${k} = ?`);
      params.push(k === 'price' ? Math.round(Number(body[k])) : body[k]);
    }
  }
  if (!fields.length) return hydrate(offer);
  params.push(id);
  db.prepare(`UPDATE offers SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return hydrate(db.prepare('SELECT * FROM offers WHERE id = ?').get(id));
}

export function deleteOffer(user, id) {
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  if (!offer) throw new HttpError('Oferta no encontrada', 404);
  if (offer.user_id !== user.id && user.role !== 'admin') {
    throw new HttpError('No autorizado', 403);
  }
  // Borrar imágenes del disco
  const imgs = db.prepare('SELECT url FROM offer_images WHERE offer_id = ?').all(id);
  imgs.forEach(img => {
    const fname = path.basename(img.url);
    const full = path.join(uploadsDir, fname);
    if (fs.existsSync(full)) {
      try { fs.unlinkSync(full); } catch { /* ignore */ }
    }
  });
  db.prepare('DELETE FROM offers WHERE id = ?').run(id);
  return { ok: true };
}

export function registerContact(id) {
  const offer = db.prepare('SELECT id FROM offers WHERE id = ?').get(id);
  if (!offer) throw new HttpError('Oferta no encontrada', 404);
  db.prepare('UPDATE offers SET contacts = contacts + 1 WHERE id = ?').run(id);
  return { ok: true };
}
