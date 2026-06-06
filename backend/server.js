import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { initDB, seedAdmin } from './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js';
import offerRoutes from './src/routes/offer.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import locationRoutes from './src/routes/location.routes.js';
import { errorMiddleware } from './src/middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Carpeta uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middlewares globales
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir imágenes
app.use('/uploads', express.static(uploadsDir));

// Healthcheck
app.get('/', (_req, res) => {
  res.json({
    name: 'SumerceMarket API',
    status: 'ok',
    country: '🇨🇴',
    version: '1.0.0'
  });
});
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);

// 404 JSON
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejo central de errores
app.use(errorMiddleware);

// Iniciar DB
initDB();
seedAdmin();

app.listen(PORT, () => {
  console.log(`\n✅ SumerceMarket API corriendo en http://localhost:${PORT}`);
  console.log(`📦 Uploads servidos desde /uploads`);
  console.log(`🇨🇴 Listo para Colombia\n`);
});
