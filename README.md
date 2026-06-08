# Súmerce Market

> Plataforma web frontend para ofertas y pedidos de productos locales colombianos, con foco en municipios de Boyacá. Proyecto en evolución por bloques iterativos.

## Estado actual (Bloque 8c — Reset arquitectónico)

Tras el reset del Bloque 8c, el repositorio contiene **únicamente el frontend React + Vite**. Se eliminó todo el backend Express legado (`backend/src/controllers`, `backend/src/services`, `backend/src/routes`, `backend/src/middleware`) y los stubs sueltos de frontend que ya no se usaban (`frontend/src/services/api.js`, `frontend/src/pages/CreateOffer.jsx`, `frontend/src/pages/AdminDashboard.jsx`), dejando una base limpia para reconstruir la capa de servicios desde cero en bloques siguientes.

- **Frontend:** React 18 + Vite, ubicado en `frontend/`.
- **Backend:** ❌ No existe en el repo actualmente. Cualquier consumo real de API se reintroducirá en bloques futuros.
- **Tema visual:** Tema colombiano (amarillo / azul / rojo) heredado de bloques previos, intacto.
- **Router:** definido en `frontend/src/App.jsx` con `react-router-dom`, envuelto en `AuthProvider` y usando `ProtectedRoute` para rutas privadas y de administración.

> ⚠️ Esta es una app **solo de UI**. No hay backend ni persistencia real en este repo. Los formularios y vistas son la base para conectar servicios cuando se reconstruya la capa de datos.

## Estructura real del repositorio

```
sumercemarket/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── README.md
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── ProtectedRoute.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       └── pages/
│           ├── Home.jsx
│           ├── Home.css
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Publish.jsx
│           ├── MyOffers.jsx
│           ├── Admin.jsx
│           ├── OfferDetail.jsx
│           ├── OfferDetail.css
│           └── NotFound.jsx
├── .gitignore
└── README.md
```

> Nota: si tu copia local muestra carpetas o archivos distintos a los listados arriba (por ejemplo, un `backend/` viejo), sincroniza con `git pull` para reflejar el reset del Bloque 8c.

## Cómo ejecutar el frontend

Requisitos: Node.js 18+ y npm.

```bash
cd frontend
npm install
npm run dev
```

Vite levantará la app en `http://localhost:5173/` (o el puerto que indique la consola).

Para generar el build de producción:

```bash
npm run build
npm run preview
```

## Rutas definidas en `App.jsx`

| Ruta | Componente | Protección | Descripción |
|------|------------|------------|-------------|
| `/` | `Home` | Pública | Landing del proyecto. |
| `/login` | `Login` | Pública | Formulario de inicio de sesión (UI). |
| `/register` | `Register` | Pública | Formulario de registro (UI). |
| `/offers/:id` | `OfferDetail` | Pública | Detalle de una oferta. |
| `/publish` | `Publish` | `ProtectedRoute` | Publicar una nueva oferta. |
| `/my-offers` | `MyOffers` | `ProtectedRoute` | Ofertas del usuario autenticado. |
| `/admin` | `Admin` | `ProtectedRoute adminOnly` | Panel de administración. |
| `*` | `NotFound` (interno) | — | Página 404 mostrada por el router. |

Las rutas `/offers/new` y los componentes `CreateOffer` / `AdminDashboard` del intento anterior fueron retirados porque dependían de stubs y de un backend que ya no está en el repo.

## Roadmap inmediato

- **Bloque 8d (planeado):** Reintroducir un cliente HTTP limpio y servicios desacoplados, ahora sí pensados para un backend real.
- **Bloque 9 (planeado):** Reconstruir un backend mínimo (Node + Express o equivalente), con contratos claros, en una carpeta o repositorio separado.

## Notas importantes

- No hay workflows de GitHub Actions y no se planean en este bloque.
- El despliegue en GitHub Pages **solo aplicaría al frontend** y no está activado automáticamente. Si se activa manualmente desde Settings → Pages, debe apuntarse a la carpeta `frontend/dist` generada por `npm run build`, o servirse desde otra plataforma estática (Netlify, Vercel, etc.).
- No se incluyen claves, tokens ni secretos en el repositorio.
