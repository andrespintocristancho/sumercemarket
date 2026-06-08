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
5. (Opcional) En **Storage → Policies**, ajusta quién puede subir/borrar archivos. Recomendado:
   - **SELECT:** público.
   - **INSERT / UPDATE / DELETE:** solo usuarios autenticados.

### 6. Probar la conexión desde el frontend

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173/`. Si las variables de entorno son correctas y las tablas están creadas, podrás registrarte, iniciar sesión y consultar/crear ofertas.

## Optimización de imágenes (en el navegador)

Para ahorrar espacio en Supabase Storage y acelerar la carga de la app, **las fotos se optimizan en el navegador antes de subirse**. Esta lógica vive en `frontend/src/components/ImageUploader.jsx` (función `compressImage`) y se aplica de forma transparente al usuario:

- **Formatos aceptados de entrada:** JPG, JPEG, PNG y WebP.
- **Validación previa:** tipo MIME y tamaño máximo (5 MB por archivo).
- **Redimensionado:** ancho/alto máximo **1200×1200 px**, manteniendo proporción.
- **Recompresión** con `canvas.toBlob`:
  - **Formato preferido:** `image/webp` con `quality = 0.75`.
  - **Fallback:** `image/jpeg` con `quality = 0.75` si el navegador no soporta WebP.
- **Si la versión "optimizada" pesara más que la original**, se devuelve la original (mejor para fotos ya pequeñas).
- **Fallback de seguridad:** si por cualquier razón el proceso de optimización falla, se usa el archivo original. **La publicación nunca se rompe por la compresión.**
- **Límite de fotos por oferta:** **5**.
- **Preview**: el `ImageUploader` muestra la previsualización y el tamaño en KB/MB de la **versión optimizada**, no de la original.

En `Publish.jsx`, esa lista de archivos optimizados es la que se sube al bucket `offer-images`. Por cada imagen se guarda un registro en `offer_images` con `offer_id`, `url`, `path` y `position`, y la primera se asigna a `offers.image_url` como imagen principal.

## Modelo de datos

Todas las tablas viven en el esquema `public` y están definidas en [`supabase/schema.sql`](./supabase/schema.sql). El esquema coincide **exactamente** con los campos que usa el frontend actual: no se usan `municipality`, ni `is_active`, ni `category_id`, ni una tabla `categories`.

### `profiles`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, FK a `auth.users.id`. |
| `full_name` | `text` | |
| `phone` | `text` | |
| `department` | `text` | |
| `city` | `text` | |
| `role` | `text` | `'user'` o `'admin'` (default `'user'`). |
| `created_at` | `timestamptz` | default `now()`. |
| `updated_at` | `timestamptz` | default `now()`. |

### `offers`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()`. |
| `user_id` | `uuid` | FK a `auth.users.id`. **Dueño de la oferta.** |
| `title` | `text` | obligatorio. |
| `description` | `text` | |
| `category` | `text` | texto libre. **No** hay `category_id`. |
| `price` | `numeric(12,2)` | `>= 0`. |
| `department` | `text` | |
| `city` | `text` | |
| `address` | `text` | |
| `contact_phone` | `text` | |
| `contact_name` | `text` | |
| `status` | `text` | `'active'` \| `'paused'` \| `'sold'` (default `'active'`). **No** hay `is_active`. |
| `image_url` | `text` | imagen principal (las adicionales viven en `offer_images`). |
| `created_at` | `timestamptz` | default `now()`. |
| `updated_at` | `timestamptz` | default `now()`. |

### `offer_images`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK. |
| `offer_id` | `uuid` | FK a `offers.id` (ON DELETE CASCADE). |
| `url` | `text` | URL pública/servible para mostrar la imagen. |
| `path` | `text` | ruta dentro del bucket `offer-images` (para borrar/mover). |
| `position` | `int` | orden de la imagen (default `0`). |
| `created_at` | `timestamptz` | default `now()`. |

### `contact_events`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK. |
| `offer_id` | `uuid` | FK a `offers.id`. |
| `contacter_id` | `uuid` | FK a `auth.users.id`. **No es `user_id`.** |
| `channel` | `text` | `'whatsapp'` \| `'phone'` \| `'view'` \| `'other'`. |
| `created_at` | `timestamptz` | default `now()`. |

### Índices básicos creados

- `profiles(department)`, `profiles(city)`, `profiles(role)`
- `offers(user_id)`, `offers(status)`, `offers(category)`, `offers(department)`, `offers(city)`, `offers(created_at desc)`
- `offer_images(offer_id)`, `offer_images(offer_id, position)`
- `contact_events(offer_id)`, `contact_events(contacter_id)`, `contact_events(created_at desc)`

### Políticas RLS (resumen)

`schema.sql` deja RLS habilitado en las cuatro tablas. Las políticas básicas son:

- **`offers` — lectura pública de ofertas con `status = 'active'`.** El dueño además puede leer todas las suyas (cualquier `status`).
- **`offers` — el dueño gestiona las suyas:** solo el usuario autenticado cuyo `auth.uid()` coincide con `offers.user_id` puede `insert`, `update` y `delete` sobre sus ofertas.
- **`offer_images` — siguen a su oferta:** lectura pública si la oferta tiene `status = 'active'`; insert/update/delete solo si la oferta pertenece al usuario autenticado.
- **`profiles`:** lectura pública; cada usuario solo puede insertar y actualizar su propio perfil (`auth.uid() = profiles.id`).
- **`contact_events` — insertar:** cualquier usuario autenticado puede registrar un contacto sobre una oferta `active`, siempre que `contacter_id = auth.uid()`.
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
