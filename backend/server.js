import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js';
import offerRoutes from './src/routes/offers.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import locationRoutes from './src/routes/locations.routes.js';
import { errorMiddleware } from './src/middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Inicializa base de datos (crea tablas y admin por defecto)
initDb();

// Middlewares globales
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Archivos subidos (imágenes de ofertas)
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'SumerceMarket API', country: '🇨🇴', time: new Date().toISOString() });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);

// 404 JSON para rutas API desconocidas
app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint no encontrado' }));

// Manejo central de errores
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`🇨🇴 SumerceMarket API escuchando en http://localhost:${PORT}`);
  console.log(`   Healthcheck: http://localhost:${PORT}/api/health`);
});
