# Súmerce Market

> Plataforma web frontend para ofertas y pedidos de productos locales colombianos, con foco en municipios de Boyacá. Proyecto en evolución por bloques iterativos.

## Estado actual (Bloque 8c — Reset arquitectónico)

Tras el reset del Bloque 8c, el repositorio contiene **únicamente el frontend React + Vite**. Se eliminó todo el backend Express legado y los stubs sueltos que ya no se usan, dejando una base limpia para reconstruir la capa de servicios desde cero en bloques siguientes.

- **Frontend:** React 18 + Vite, ubicado en `frontend/`.
- **Backend:** ❌ No existe en el repo actualmente. Cualquier consumo real de API se reintroducirá en bloques futuros.
- **Tema visual:** Tema colombiano (amarillo / azul / rojo) heredado del Bloque 7, intacto.
- **Páginas Bloque 8a vigentes:** `Login`, `Register`, `Dashboard`, `OffersList`, `OfferDetail`, ya integradas en el router.
- **Páginas Bloque 8b retiradas:** `CreateOffer` y `AdminDashboard` se eliminaron junto con `services/api.js` (eran stubs sin backend). Sus rutas también se retiraron del router.

> ⚠️ Esta es una app **solo de UI**. No hay autenticación real ni persistencia. Los formularios y vistas son la base para conectar servicios cuando se reconstruya la capa de datos.

## Estructura del repositorio

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
│       ├── styles/
│       │   └── theme.css
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── Footer.jsx
│       └── pages/
│           ├── Home.jsx
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx
│           ├── OffersList.jsx
│           └── OfferDetail.jsx
├── .gitignore
└── README.md
```

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

## Rutas disponibles (Bloque 8c)

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | `Home` | Landing pública del proyecto. |
| `/login` | `Login` | Formulario de inicio de sesión (UI solamente). |
| `/register` | `Register` | Formulario de registro (UI solamente). |
| `/dashboard` | `Dashboard` | Panel posterior al login (UI solamente). |
| `/offers` | `OffersList` | Listado de ofertas (datos de muestra). |
| `/offers/:id` | `OfferDetail` | Detalle de una oferta (datos de muestra). |

Las rutas `/offers/new` y `/admin` del Bloque 8b fueron retiradas porque dependían de stubs eliminados.

## Roadmap inmediato

- **Bloque 8d (planeado):** Reintroducir un cliente HTTP limpio y servicios desacoplados, ahora sí pensados para un backend real.
- **Bloque 9 (planeado):** Reconstruir un backend mínimo (Node + Express o equivalente) en un repositorio o carpeta separada, con contratos claros.

## Notas importantes

- No hay workflows de GitHub Actions y no se planean en este bloque.
- El despliegue en GitHub Pages **solo aplicaría al frontend** y no está activado automáticamente. Si se activa manualmente desde Settings → Pages, debe apuntarse a la carpeta `frontend/dist` generada por el build, o servirse desde otra plataforma estática (Netlify, Vercel, etc.).
- No se incluyen claves, tokens ni secretos en el repositorio.
