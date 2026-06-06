import { db } from '../config/db.js';

const VALID_CATEGORIES = ['zapatos', 'ropa', 'carros', 'motos', 'odontologia', 'gym', 'belleza', 'plaza', 'otros'];

function attachImages(offer) {
  if (!offer) return null;
  const images = db.prepare('SELECT id, url FROM offer_images WHERE offer_id = ?').all(offer.id);
  const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(offer.user_id);
  return { ...offer, images, seller: user };
}

export function createOffer(req, res) {
  const { title, description, price, category, department, city, address, whatsapp } = req.body;

  if (!title || !price || !category || !department || !city || !whatsapp) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Categoría inválida' });
  }
  const priceNum = parseFloat(price);
  if (isNaN(priceNum) || priceNum < 0) {
    return res.status(400).json({ error: 'El precio debe ser un número válido' });
  }

  const result = db.prepare(`
    INSERT INTO offers (user_id, title, description, price, category, department, city, address, whatsapp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    title.trim(),
    description?.trim() || null,
    priceNum,
    category,
    department,
    city,
    address?.trim() || null,
    whatsapp.trim()
  );

  const offerId = result.lastInsertRowid;

  // Guardar imágenes subidas
  if (req.files && req.files.length > 0) {
    const insertImg = db.prepare('INSERT INTO offer_images (offer_id, url) VALUES (?, ?)');
    for (const file of req.files) {
      insertImg.run(offerId, `/uploads/${file.filename}`);
    }
  }

  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(offerId);
  res.status(201).json(attachImages(offer));
}

export function listOffers(req, res) {
  const { category, department, city, minPrice, maxPrice, search, sort } = req.query;

  let query = `SELECT * FROM offers WHERE status = 'active'`;
  const params = [];

  if (category) { query += ` AND category = ?`; params.push(category); }
  if (department) { query += ` AND department = ?`; params.push(department); }
  if (city) { query += ` AND city = ?`; params.push(city); }
  if (minPrice) { query += ` AND price >= ?`; params.push(parseFloat(minPrice)); }
  if (maxPrice) { query += ` AND price <= ?`; params.push(parseFloat(maxPrice)); }
  if (search) {
    query += ` AND (title LIKE ? OR description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  // Orden por defecto: precio asc (más barato primero), como pidió el cliente
  if (sort === 'price_desc') query += ` ORDER BY price DESC`;
  else if (sort === 'recent') query += ` ORDER BY created_at DESC`;
  else query += ` ORDER BY price ASC, created_at DESC`;

  const offers = db.prepare(query).all(...params);
  res.json(offers.map(attachImages));
}

export function getOffer(req, res) {
  const { id } = req.params;
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  if (!offer) return res.status(404).json({ error: 'Oferta no encontrada' });

  // Incrementar vistas
  db.prepare('UPDATE offers SET views = views + 1 WHERE id = ?').run(id);
  offer.views += 1;

  // Incluir info del vendedor con teléfono
  const seller = db.prepare('SELECT id, name, phone FROM users WHERE id = ?').get(offer.user_id);
  const images = db.prepare('SELECT id, url FROM offer_images WHERE offer_id = ?').all(offer.id);

  res.json({ ...offer, seller, images });
}

export function myOffers(req, res) {
  const offers = db.prepare('SELECT * FROM offers WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(offers.map(attachImages));
}

export function updateOffer(req, res) {
  const { id } = req.params;
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  if (!offer) return res.status(404).json({ error: 'Oferta no encontrada' });
  if (offer.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permiso para editar esta oferta' });
  }

  const { title, description, price, category, department, city, address, whatsapp, status } = req.body;

  db.prepare(`
    UPDATE offers SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      category = COALESCE(?, category),
      department = COALESCE(?, department),
      city = COALESCE(?, city),
      address = COALESCE(?, address),
      whatsapp = COALESCE(?, whatsapp),
      status = COALESCE(?, status)
    WHERE id = ?
  `).run(
    title?.trim() || null,
    description?.trim() || null,
    price ? parseFloat(price) : null,
    category || null,
    department || null,
    city || null,
    address?.trim() || null,
    whatsapp?.trim() || null,
    status || null,
    id
  );

  const updated = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  res.json(attachImages(updated));
}

export function deleteOffer(req, res) {
  const { id } = req.params;
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  if (!offer) return res.status(404).json({ error: 'Oferta no encontrada' });
  if (offer.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permiso para eliminar esta oferta' });
  }

  db.prepare('DELETE FROM offers WHERE id = ?').run(id);
  res.json({ ok: true });
}

export function registerContact(req, res) {
  const { id } = req.params;
  const offer = db.prepare('SELECT id FROM offers WHERE id = ?').get(id);
  if (!offer) return res.status(404).json({ error: 'Oferta no encontrada' });

  db.prepare('INSERT INTO contacts (offer_id) VALUES (?)').run(id);
  res.json({ ok: true });
}
