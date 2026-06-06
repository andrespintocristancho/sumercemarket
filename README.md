# 🛒 SumerceMarket

> **Marketplace colombiano gratuito**. Publica ofertas de zapatos, ropa, carros, motos, belleza, gym, odontología, plaza de mercado y más. Conecta vendedores y compradores directamente por WhatsApp.

---

## 🎯 ¿Qué es SumerceMarket?

Plataforma web (y futura app móvil) donde:

- ✅ **Vendedores** publican ofertas **GRATIS** con fotos, precio, dirección, ciudad y contacto.
- ✅ **Compradores** ven ofertas filtradas por ciudad, departamento, categoría y precio.
- ✅ **Más barato primero**: el sistema ordena automáticamente las ofertas por precio.
- ✅ **Contacto directo** por WhatsApp entre comprador y vendedor.
- ✅ **Panel de administrador** con estadísticas en tiempo real.
- 💰 Modelo de comisión a conciencia (5-6%) que se cobra al vendedor cuando concreta venta.

---

## 🏗️ Estructura del proyecto

```
sumercemarket/
├── backend/                # API Node.js + Express + SQLite
│   ├── src/
│   │   ├── config/         # Conexión BD
│   │   ├── routes/         # Endpoints REST
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── middleware/     # Auth JWT, errores
│   │   └── services/       # Servicios auxiliares
│   ├── uploads/            # Imágenes subidas (creado en runtime)
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/               # React + Vite + PWA
│   ├── src/
│   │   ├── pages/          # Login, Registro, Home, Detalle, Admin, etc.
│   │   ├── components/     # Navbar, Card, Filtros, etc.
│   │   ├── services/       # Conexión con API
│   │   └── context/        # Estado global (auth)
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 📦 Categorías disponibles

- 👟 Zapatos
- 👕 Ropa
- 🚗 Carros
- 🏍️ Motos
- 🦷 Odontología
- 💪 Gym / Deportes
- 💅 Belleza
- 🥬 Plaza de mercado
- 📦 Otros

---

## 🇨🇴 Cobertura

Filtros por los **32 departamentos** de Colombia y sus principales ciudades.

---

## 🚀 Cómo correrlo (100% GRATIS, sin pagar nada)

### Requisitos previos (gratis)

- [Node.js 18+](https://nodejs.org/) (gratis)
- [Git](https://git-scm.com/) (gratis)
- Cualquier editor: [VS Code](https://code.visualstudio.com/) (gratis)

### 1. Clonar el repositorio

```bash
git clone https://github.com/andrespintocristancho/sumercemarket.git
cd sumercemarket
```

### 2. Levantar el BACKEND

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend correrá en: **http://localhost:4000**

### 3. Levantar el FRONTEND (en otra terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend correrá en: **http://localhost:5173**

---

## 👤 Usuario administrador por defecto

Al iniciar el backend por primera vez, se crea automáticamente:

- **Email:** `admin@sumercemarket.com`
- **Contraseña:** `admin123`

⚠️ **Cámbiala** desde el panel admin después del primer login.

---

## 🆓 Hosting gratuito recomendado

Cuando quieras publicarlo a internet sin pagar:

| Servicio | Para | Plan gratis |
|----------|------|-------------|
| [Render](https://render.com) | Backend Node.js + SQLite | ✅ Sí (con sleep) |
| [Vercel](https://vercel.com) | Frontend React | ✅ Generoso |
| [Netlify](https://netlify.com) | Frontend React (alt) | ✅ Generoso |
| [Railway](https://railway.app) | Fullstack | ✅ $5/mes gratis |
| [Supabase](https://supabase.com) | BD PostgreSQL gratis | ✅ Sí |
| [Cloudinary](https://cloudinary.com) | Imágenes en la nube | ✅ 25GB gratis |

---

## 📱 ¿Cómo convertirlo en app móvil?

El frontend está construido como **PWA (Progressive Web App)**, lo que significa:

- ✅ Desde el navegador móvil, el usuario puede pulsar **"Agregar a pantalla de inicio"** y se ve como app nativa.
- ✅ Funciona offline (cache básico).
- ✅ Notificaciones (futuro).

Si más adelante quieres app nativa real (Play Store / App Store), se puede usar:
- **Capacitor** (mismo código React → app Android/iOS)
- **React Native** (rescribir frontend)

---

## 🛣️ Funcionalidades incluidas en este MVP

### Para vendedores (registrados)
- Registro / Login con JWT
- Crear ofertas con múltiples fotos
- Editar / eliminar sus propias ofertas
- Ver sus publicaciones en su perfil

### Para compradores (visitantes)
- Ver todas las ofertas sin necesidad de cuenta
- Filtrar por: categoría, departamento, ciudad, rango de precio
- **Ordenamiento automático: más barato primero**
- Buscar por texto
- Ver galería de fotos por oferta
- Contactar al vendedor por **WhatsApp** con un clic

### Para administrador
- Dashboard con estadísticas (usuarios, ofertas, categorías, ciudades)
- Lista de usuarios y ofertas
- Eliminar usuarios y ofertas (moderación)
- Marcar ofertas como "vendidas" para registro de comisión

---

## 🔐 Seguridad

- Contraseñas con **bcrypt** (nunca en texto plano)
- Autenticación con **JWT**
- Validación de inputs en backend
- CORS configurado
- Variables sensibles en `.env` (nunca en el código)

---

## 📜 Licencia

MIT — Úsalo libremente. Hecho con ❤️ desde Colombia.

---

## 👨‍💻 Autor

**Andrés Leonardo Pinto Cristancho**

¿Ideas o sugerencias? Abre un issue.
