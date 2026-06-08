# Súmerce Market

> Plataforma web para ofertas y pedidos de productos locales colombianos, con foco en municipios de Boyacá. PWA construida sobre **React + Vite** y **Supabase** como backend gestionado.

## Arquitectura

| Capa | Tecnología |
|------|------------|
| Frontend / UI | **React 18 + Vite** |
| App instalable | **PWA** (service worker + manifest) |
| Autenticación | **Supabase Auth** |
| Base de datos | **Supabase Postgres** |
| Almacenamiento de fotos | **Supabase Storage** (bucket `offer-images`) |
| Backend Node | ❌ No existe. Toda la lógica de datos vive en Supabase. |
| SQLite | ❌ No se usa. |

> Toda la persistencia (usuarios, ofertas, imágenes, contactos) está en Supabase. El frontend habla directamente con Supabase usando `@supabase/supabase-js`, protegido por **Row Level Security (RLS)**.

## Estructura del repositorio

```
sumercemarket/
├── frontend/                # App React + Vite (PWA)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── components/
│       ├── context/
│       └── pages/
├── supabase/
│   └── schema.sql           # Esquema SQL completo + RLS
├── .gitignore
└── README.md
```

## Variables de entorno

Crea un archivo `frontend/.env` (NO se commitea) con tus credenciales públicas de Supabase:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_PUBLIC_KEY
```

Estas dos claves son **públicas** (anon key); la seguridad real la garantizan las políticas RLS definidas en `supabase/schema.sql`. Nunca pongas la `service_role` key en el frontend.

## Configurar Supabase paso a paso

### 1. Crear el proyecto

1. Entra a <https://app.supabase.com> y crea una cuenta si no tienes.
2. Pulsa **New project**.
3. Define:
   - **Name:** `sumerce-market` (o el que prefieras).
   - **Database password:** guárdala bien.
   - **Region:** la más cercana a tus usuarios (ej. `South America (São Paulo)`).
4. Espera a que el proyecto termine de provisionarse.

### 2. Obtener las claves para el frontend

1. En el dashboard del proyecto, ve a **Project Settings → API**.
2. Copia:
   - `Project URL` → va en `VITE_SUPABASE_URL`.
   - `anon` `public` key → va en `VITE_SUPABASE_ANON_KEY`.
3. Pégalas en tu `frontend/.env`.

### 3. Crear las tablas (SQL Editor)

> Las tablas se crean ejecutando el script SQL incluido en este repo.

1. En el dashboard de Supabase, abre **SQL Editor** → **New query**.
2. Abre el archivo [`supabase/schema.sql`](./supabase/schema.sql) de este repositorio.
3. Copia **todo** su contenido y pégalo en el SQL Editor.
4. Pulsa **Run**.
5. Verifica en **Table Editor** que se crearon las tablas:
   - `profiles`
   - `categories`
   - `offers`
   - `offer_images`
   - `contact_events`

El mismo script habilita **RLS** en todas las tablas y crea las políticas básicas (ver sección "Modelo de datos" más abajo).

### 4. Configurar autenticación

1. En Supabase, ve a **Authentication → Providers**.
2. Habilita **Email** (mínimo). Si quieres login social (Google, etc.), actívalos también.
3. En **Authentication → URL Configuration** añade tu URL de desarrollo (`http://localhost:5173`) y, cuando despliegues, la URL de producción.

### 5. Crear el bucket de Storage para fotos

1. Ve a **Storage** en el menú lateral.
2. Pulsa **New bucket**.
3. Configura:
   - **Name:** `offer-images` (exacto, sin mayúsculas).
   - **Public bucket:** **ON** (para servir las imágenes vía URL pública).
4. Crea el bucket.
5. (Opcional) En **Storage → Policies**, ajusta quién puede subir/borrar archivos. Una política típica es: solo usuarios autenticados pueden hacer `insert`/`update`/`delete`, y lectura pública.

### 6. Probar la conexión desde el frontend

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173/`. Si las variables de entorno son correctas y las tablas están creadas, podrás registrarte, iniciar sesión y consultar/crear ofertas.

## Modelo de datos

Todas las tablas viven en el esquema `public` y están definidas en [`supabase/schema.sql`](./supabase/schema.sql).

### Tablas

- **`profiles`** — Datos públicos de cada usuario (ligados 1:1 a `auth.users`). Incluye `full_name`, `phone`, `municipality`, `avatar_url`, `is_admin`.
- **`categories`** — Catálogo de categorías (`slug`, `name`, `description`).
- **`offers`** — Ofertas publicadas. Usa la columna **`user_id`** (FK a `auth.users`) para el dueño. Incluye `title`, `description`, `price`, `currency`, `municipality`, `is_active`, `category_id`.
- **`offer_images`** — Imágenes de cada oferta. Guarda `image_url` (apuntando al bucket `offer-images`) y `position` para ordenarlas.
- **`contact_events`** — Eventos de contacto sobre una oferta (WhatsApp, llamada, vista de teléfono…). Usa la columna **`contacter_id`** (FK a `auth.users`) para quien realiza el contacto, **no `user_id`**.

### Índices básicos creados

- `profiles(municipality)`
- `categories(slug)`
- `offers(user_id)`, `offers(category_id)`, `offers(is_active)`, `offers(created_at desc)`, `offers(municipality)`
- `offer_images(offer_id)`
- `contact_events(offer_id)`, `contact_events(contacter_id)`, `contact_events(created_at desc)`

### Políticas RLS (resumen)

`schema.sql` deja RLS habilitado en las cinco tablas. Las políticas básicas son:

- **`offers` — lectura pública de ofertas activas:** cualquiera puede leer ofertas con `is_active = true`. El dueño además puede leer todas las suyas (activas o no).
- **`offers` — el dueño gestiona las suyas:** solo el usuario autenticado cuyo `auth.uid()` coincide con `offers.user_id` puede `insert`, `update` y `delete` sobre sus ofertas.
- **`offer_images` — siguen a su oferta:** lectura pública si la oferta es activa; insert/update/delete solo si la oferta pertenece al usuario autenticado.
- **`profiles`:** lectura pública; cada usuario solo puede insertar y actualizar su propio perfil (`auth.uid() = profiles.id`).
- **`categories`:** lectura pública. (La escritura queda restringida; gestiónala desde el Dashboard o con un rol admin si la necesitas).
- **`contact_events` — insertar:** cualquier usuario autenticado puede registrar un contacto sobre una oferta activa, siempre que `contacter_id = auth.uid()`.
- **`contact_events` — lectura:** el dueño de la oferta ve los contactos recibidos; el propio contactante ve los que generó.

## Rutas del frontend

Definidas en `frontend/src/App.jsx` con `react-router-dom`:

| Ruta | Componente | Protección | Descripción |
|------|------------|------------|-------------|
| `/` | `Home` | Pública | Landing. |
| `/login` | `Login` | Pública | Inicio de sesión vía Supabase Auth. |
| `/register` | `Register` | Pública | Registro vía Supabase Auth. |
| `/offers/:id` | `OfferDetail` | Pública | Detalle de una oferta. |
| `/publish` | `Publish` | `ProtectedRoute` | Publicar una oferta. |
| `/my-offers` | `MyOffers` | `ProtectedRoute` | Ofertas del usuario actual. |
| `/admin` | `Admin` | `ProtectedRoute adminOnly` | Panel de administración. |
| `*` | `NotFound` | — | 404. |

## Cómo ejecutar el frontend

Requisitos: Node.js 18+ y npm.

```bash
cd frontend
npm install
npm run dev      # desarrollo (http://localhost:5173)
npm run build    # build de producción en frontend/dist
npm run preview  # previsualizar el build
```

## PWA

La app está diseñada como **PWA**: incluye `manifest.webmanifest` e instala un service worker para soporte offline básico y experiencia tipo app en móvil. Tras `npm run build`, el navegador ofrecerá la opción **"Instalar app"** en sitios servidos por HTTPS (o en `localhost`).

## Despliegue

- Cualquier hosting estático sirve para el frontend: **Vercel**, **Netlify**, **Cloudflare Pages**, **GitHub Pages**, etc. Solo hay que publicar el contenido de `frontend/dist`.
- Recuerda añadir tus URLs de producción en **Supabase → Authentication → URL Configuration**.

## Reglas del proyecto

- ❌ Sin workflows de GitHub Actions.
- ❌ Sin backend Node propio.
- ❌ Sin SQLite.
- ❌ Sin secretos reales en el repo (solo `.env.example` si se necesitan ejemplos).
- ✅ Todo el backend lo provee Supabase (Auth + Postgres + Storage).
- ✅ La seguridad de datos se basa en **RLS**, no en código del cliente.
