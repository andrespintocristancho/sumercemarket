import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  // Tabla usuarios
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
  `);

  // Tabla ofertas
  db.exec(`
    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      department TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT,
      whatsapp TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      views INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Tabla imágenes
  db.exec(`
    CREATE TABLE IF NOT EXISTS offer_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
    );
  `);

  // Tabla contactos (clic en WhatsApp)
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
    );
  `);

  // Índices
  db.exec(`CREATE INDEX IF NOT EXISTS idx_offers_category ON offers(category);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_offers_city ON offers(city);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_offers_department ON offers(department);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_offers_price ON offers(price);`);

  console.log('🗄️  Base de datos SQLite inicializada');
}

export function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@sumercemarket.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = process.env.ADMIN_NAME || 'Administrador';

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return;

  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, 'admin')
  `).run(name, email, hash);

  console.log(`👑 Admin creado → ${email} / ${password}`);
}
