import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data.sqlite');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT NOT NULL,
      department TEXT NOT NULL,
      city TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      department TEXT NOT NULL,
      city TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      contacts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS offer_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_offers_category ON offers(category);
    CREATE INDEX IF NOT EXISTS idx_offers_city ON offers(city);
    CREATE INDEX IF NOT EXISTS idx_offers_price ON offers(price);
    CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
  `);
  console.log('🗄️  Base de datos inicializada');
}

export function seedAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@sumercemarket.co').toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!exists) {
    const hash = bcrypt.hashSync(adminPass, 10);
    db.prepare(`
      INSERT INTO users (name, email, password, phone, department, city, role)
      VALUES (?, ?, ?, ?, ?, ?, 'admin')
    `).run('Administrador', adminEmail, hash, '3000000000', 'Cundinamarca', 'Bogotá');
    console.log(`✅ Admin creado: ${adminEmail} / ${adminPass} (cambia esto en .env en producción)`);
  } else {
    console.log(`👤 Admin existente: ${adminEmail}`);
  }
}
