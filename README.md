# Súmerce Market

> Plataforma web para ofertas y pedidos de productos locales colombianos, con foco en municipios de Boyacá. PWA construida sobre **React + Vite** y **Supabase** como backend gestionado.

## Arquitectura

| Capa | Tecnología |
|------|------------|
| Frontend / UI | **React 18 + Vite** |
| App instalable | **PWA** (service worker + manifest) |
| Autenticación | **Supabase Auth** |
| Base de datos | **Supabase Postgres** |
| Almacenamiento de fotos de ofertas | **Supabase Storage** (bucket `offer-images`) |
| Almacenamiento de logo/portada del negocio | **Supabase Storage** (bucket `business-assets`) |
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
│   ├── schema.sql              # Esquema SQL completo + RLS
│   └── business-profile.sql    # Columnas extra de "negocio" en profiles
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

> Las tablas se crean ejecutando los scripts SQL incluidos en este repo.

1. En el dashboard de Supabase, abre **SQL Editor** → **New query**.
2. Abre el archivo [`supabase/schema.sql`](./supabase/schema.sql) de este repositorio.
3. Copia **todo** su contenido y pégalo en el SQL Editor.
4. Pulsa **Run**.
5. Verifica en **Table Editor** que se crearon las tablas:
   - `profiles`
   - `offers`
   - `offer_images`
   - `contact_events`
6. Abre [`supabase/business-profile.sql`](./supabase/business-profile.sql), pégalo en otro **New query** y ejecútalo. Añadirá a `profiles` las columnas de negocio (`business_name`, `business_slug`, etc.). Es idempotente.

El mismo script habilita **RLS** en todas las tablas y crea las políticas básicas (ver sección "Modelo de datos" más abajo).

### 4. Configurar autenticación

1. En Supabase, ve a **Authentication → Providers**.
2. Habilita **Email** (mínimo). Si quieres login social (Google, etc.), actívalos también.
3. En **Authentication → URL Configuration** añade tu URL de desarrollo (`http://localhost:5173`) y, cuando despliegues, la URL de producción.

### 5. Crear los buckets de Storage

#### 5.1. Bucket `offer-images` (fotos de ofertas)

1. Ve a **Storage** en el menú lateral.
2. Pulsa **New bucket**.
3. Configura:
   - **Name:** `offer-images` (exacto, sin mayúsculas).
   - **Public bucket:** **ON** (para servir las imágenes vía URL pública).
4. Crea el bucket.
5. (Opcional) En **Storage → Policies**, ajusta quién puede subir/borrar archivos. Recomendado:
   - **SELECT:** público.
   - **INSERT / UPDATE / DELETE:** solo usuarios autenticados.

#### 5.2. Bucket `business-assets` (logo y portada del negocio)

1. En **Storage**, pulsa **New bucket**.
2. Configura:
   - **Name:** `business-assets`.
   - **Public bucket:** **ON**.
3. Crea el bucket.
4. Recomendado en **Storage → Policies** (sobre `storage.objects`, bucket `business-assets`):
   - **SELECT:** público.
   - **INSERT / UPDATE / DELETE:** solo el dueño de la ruta, p. ej. validando que el primer segmento del path coincida con `auth.uid()` (las rutas son `{userId}/cover.<ext>` y `{userId}/logo.<ext>`).

### 6. Probar la conexión desde el frontend

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173/`. Si las variables de entorno son correctas y las tablas están creadas, podrás registrarte, iniciar sesión y consultar/crear ofertas.

## Optimización de imágenes (en el navegador)

Para ahorrar espacio en Supabase Storage y acelerar la carga de la app, **las fotos se optimizan en el navegador antes de subirse**.

### Imágenes de ofertas

Esta lógica vive en `frontend/src/components/ImageUploader.jsx` (función `compressImage`) y se aplica de forma transparente al usuario:

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

### Logo y portada del negocio

En `frontend/src/pages/BusinessProfile.jsx` (función `optimizeImage`):

- **Portada (`business_cover_url`):** máx **1600×600 px**, WebP `quality = 0.75` con fallback JPG.
- **Logo (`business_logo_url`):** máx **600×600 px**, WebP `quality = 0.75` con fallback JPG.
- **Rutas en `business-assets`:**
  - Portada: `{userId}/cover.webp` (o `.jpg` si fallback).
  - Logo: `{userId}/logo.webp` (o `.jpg` si fallback).
- La URL pública se obtiene con `getPublicUrl` y se guarda en `profiles.business_cover_url` / `profiles.business_logo_url`. El vendedor **nunca** pega una URL manual.

## Modelo de datos

Todas las tablas viven en el esquema `public` y están definidas en [`supabase/schema.sql`](./supabase/schema.sql). Las columnas de **negocio** dentro de `profiles` se añaden con [`supabase/business-profile.sql`](./supabase/business-profile.sql). El esquema coincide **exactamente** con los campos que usa el frontend actual: no se usan `municipality`, ni `is_active`, ni `category_id`, ni una tabla `categories`, ni `business_category`, ni `business_phone`.

### `profiles`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, FK a `auth.users.id`. |
| `full_name` | `text` | |
| `phone` | `text` | Teléfono personal del usuario. |
| `department` | `text` | |
| `city` | `text` | |
| `role` | `text` | `'user'` o `'admin'` (default `'user'`). |
| `created_at` | `timestamptz` | default `now()`. |
| `updated_at` | `timestamptz` | default `now()`. |
| `business_name` | `text` | Nombre público del negocio. |
| `business_slug` | `text` | Identificador único para la URL `/seller/:slug`. Único cuando no es NULL. |
| `business_description` | `text` | Descripción pública del negocio. |
| `business_logo_url` | `text` | URL pública del logo (bucket `business-assets`). |
| `business_cover_url` | `text` | URL pública de la portada (bucket `business-assets`). |
| `business_whatsapp` | `text` | Número de WhatsApp del negocio (con indicativo, sin signos). |
| `business_address` | `text` | Dirección del negocio. |
| `business_department` | `text` | Departamento del negocio. |
| `business_city` | `text` | Ciudad/municipio del negocio. |

> ⚠️ El frontend (`BusinessProfile.jsx`) **solo lee y escribe estas columnas** de negocio. No usa `business_category` ni `business_phone`.

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
- `profiles(business_slug)` único cuando no es NULL, `profiles(business_department)`, `profiles(business_city)`
- `offers(user_id)`, `offers(status)`, `offers(category)`, `offers(department)`, `offers(city)`, `offers(created_at desc)`
- `offer_images(offer_id)`, `offer_images(offer_id, position)`
- `contact_events(offer_id)`, `contact_events(contacter_id)`, `contact_events(created_at desc)`

### Políticas RLS (resumen)

`schema.sql` deja RLS habilitado en las cuatro tablas. Las políticas básicas son:

- **`offers` — lectura pública de ofertas con `status = 'active'`.** El dueño además puede leer todas las suyas (cualquier `status`).
- **`offers` — el dueño gestiona las suyas:** solo el usuario autenticado cuyo `auth.uid()` coincide con `offers.user_id` puede `insert`, `update` y `delete` sobre sus ofertas.
- **`offer_images` — siguen a su oferta:** lectura pública si la oferta tiene `status = 'active'`; insert/update/delete solo si la oferta pertenece al usuario autenticado.
- **`profiles`:** lectura pública (incluye los campos `business_*`, necesarios para `/seller/:slug`); cada usuario solo puede insertar y actualizar su propio perfil (`auth.uid() = profiles.id`).
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
| `/seller/:slug` | `SellerPublic` | Pública | Página pública de un vendedor (usa `business_slug`). |
| `/publish` | `Publish` | `ProtectedRoute` | Publicar una oferta. |
| `/my-offers` | `MyOffers` | `ProtectedRoute` | Ofertas del usuario actual. |
| `/business-profile` | `BusinessProfile` | `ProtectedRoute` | Editar nombre, slug, logo, portada y datos del negocio. |
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
