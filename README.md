# SumerceMarket 🇨🇴

Marketplace colombiano de compra y venta entre personas. Permite publicar ofertas con fotos, filtrar por categoría, departamento y ciudad, contactar al vendedor y gestionar publicaciones propias. Pensado para Colombia: validación de teléfono móvil (3XXXXXXXXX), catálogo de departamentos y ciudades reales del país, y experiencia móvil primero.

> **El frontend ya NO depende del backend Node.** Toda la lógica (auth, datos, fotos) corre directo contra Supabase desde el navegador.

---

## 🏗️ Arquitectura final

| Pieza | Tecnología |
|---|---|
| Frontend | **React 18 + Vite** |
| Routing | React Router 6 |
| Autenticación | **Supabase Auth** (email + contraseña) |
| Base de datos | **Supabase Postgres** |
| Almacenamiento de imágenes | **Supabase Storage** (bucket público `offer-images`) |
| Seguridad | Row Level Security (RLS) en Postgres |
| App instalable | **PWA** (`manifest.json` + service worker en `sw.js`) |
| Hosting | Cualquier estático con HTTPS: Vercel, Netlify, Cloudflare Pages, GitHub Pages |

**Lo que ya NO se usa:**
- ❌ Backend Node.js + Express
- ❌ SQLite (`better-sqlite3`)
- ❌ Multer y uploads en disco local
- ❌ JWT manual / bcrypt manual (lo gestiona Supabase Auth)
- ❌ Proxy `/api` o `/uploads` en Vite
- ❌ GitHub Actions / workflows

> 📁 La carpeta `backend/` del repo está **marcada como LEGADO** (ver `backend/README.md`). No se ejecuta, no forma parte de la app y se eliminará en un bloque posterior.

---

## 🧭 Estado de la migración a Supabase

El frontend ya **no llama a ningún endpoint HTTP propio**. Verificaciones:

| Comprobación | Estado |
|---|---|
| `axios` en `frontend/` | ✅ No existe |
| `fetch('/api/...')` en código activo | ✅ No existe |
| `VITE_API_URL` o similar | ✅ No existe |
| Proxy a `localhost:4000` en `vite.config.js` | ✅ Eliminado |
| `services/api.js` | ✅ Reducido a **stub legado** que lanza error claro si se invoca |
| `pages/CreateOffer.jsx` | ✅ Convertido en **stub legado** (no montado en `App.jsx`; la ruta real es `Publish.jsx`) |
| `pages/AdminDashboard.jsx` | ✅ Convertido en **stub legado** (no montado en `App.jsx`; la ruta real es `Admin.jsx`) |
| Llamadas a Supabase desde el navegador | ✅ Sí (`@supabase/supabase-js`) |

Las pantallas reales que el Router monta hoy son:

- `/` → `Home.jsx`
- `/login` → `Login.jsx`
- `/register` → `Register.jsx`
- `/offers/:id` → `OfferDetail.jsx`
- `/publish` → `Publish.jsx` *(protegida)*
- `/my-offers` → `MyOffers.jsx` *(protegida)*
- `/admin` → `Admin.jsx` *(protegida, solo admin)*

---

## 🚀 Pasos finales para dejar SumerceMarket andando

### 1. Crear el proyecto en Supabase

1. Entra a https://supabase.com/ y crea una cuenta.
2. **New project** → nombre `sumercemarket`, contraseña fuerte para la BD, región más cercana (ej. `South America (São Paulo)`).
3. Espera 1-2 minutos a que el proyecto quede listo.
4. En **Project Settings → API** copia:
   - `Project URL` → va en `VITE_SUPABASE_URL`
   - `anon public` key → va en `VITE_SUPABASE_ANON_KEY`
5. En **Authentication → Providers** deja habilitado **Email**. Desactiva "Confirm email" si quieres pruebas rápidas (recomendado activarlo en producción).

### 2. Ejecutar el SQL en Supabase

Ve a **SQL Editor** y ejecuta el bloque completo de [Esquema base](#-sql-para-crear-las-tablas) y luego el de [Políticas RLS](#-políticas-rls-básicas).

### 3. Crear el bucket `offer-images`

1. En **Storage** crea un bucket llamado `offer-images` y márcalo como **Public**.
2. En **Storage → Policies** del bucket aplica las reglas descritas en [Política mínima del bucket](#política-mínima-del-bucket-offer-images).

### 4. Configurar variables de entorno

Crea `frontend/.env` (o `frontend/.env.local`) a partir de `.env.example`:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...tu-clave-anon-publica
```

Solo se usa la **anon key pública**. Nunca subas la `service_role`. Los archivos `.env` y `.env.local` están en `.gitignore`.

### 5. Instalar dependencias

```bash
cd frontend
npm install
```

### 6. Correr en desarrollo

```bash
npm run dev
```

Abre http://localhost:5173

> En desarrollo el service worker **no se registra** para no interferir con el HMR de Vite. Vite tampoco hace proxy a ningún backend local: ya no se necesita.

### 7. Build de producción

```bash
npm run build
npm run preview
```

`npm run build` genera el bundle en `frontend/dist/`. Sube ese directorio a cualquier hosting estático con HTTPS (Vercel, Netlify, Cloudflare Pages, GitHub Pages). La PWA se activa automáticamente en producción.

---

## 🗄️ SQL para crear las tablas

```sql
-- ============================================================
-- SumerceMarket - Esquema base
-- ============================================================

-- Catálogo de categorías
create table if not exists public.categories (
  id text primary key,
  label text not null,
  icon text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Perfiles de usuario (extiende auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  department text not null,
  city text not null,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

-- Ofertas
create table if not exists public.offers (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  price integer not null check (price >= 0),
  category text not null references public.categories(id),
  department text not null,
  city text not null,
  status text not null default 'active' check (status in ('active','sold','hidden')),
  views integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_offers_category on public.offers(category);
create index if not exists idx_offers_city on public.offers(city);
create index if not exists idx_offers_department on public.offers(department);
create index if not exists idx_offers_price on public.offers(price);
create index if not exists idx_offers_status on public.offers(status);
create index if not exists idx_offers_user on public.offers(user_id);

-- Imágenes de cada oferta (URL pública del bucket offer-images)
create table if not exists public.offer_images (
  id bigserial primary key,
  offer_id bigint not null references public.offers(id) on delete cascade,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_offer_images_offer on public.offer_images(offer_id);

-- Registro de contactos hechos sobre una oferta (analítica simple)
create table if not exists public.contact_events (
  id bigserial primary key,
  offer_id bigint not null references public.offers(id) on delete cascade,
  contacter_id uuid references auth.users(id) on delete set null,
  channel text not null default 'whatsapp' check (channel in ('whatsapp','phone','other')),
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_events_offer on public.contact_events(offer_id);
```

---

## 🛡️ Políticas RLS básicas

```sql
-- Activar RLS
alter table public.profiles       enable row level security;
alter table public.offers         enable row level security;
alter table public.offer_images   enable row level security;
alter table public.contact_events enable row level security;
alter table public.categories     enable row level security;

-- categories: lectura pública
create policy "categories_read_all"
  on public.categories for select
  using (true);

-- profiles
create policy "profiles_read_all"
  on public.profiles for select
  using (true);

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- offers
create policy "offers_read_active"
  on public.offers for select
  using (status = 'active' or auth.uid() = user_id);

create policy "offers_insert_owner"
  on public.offers for insert
  with check (auth.uid() = user_id);

create policy "offers_update_owner"
  on public.offers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "offers_delete_owner"
  on public.offers for delete
  using (auth.uid() = user_id);

-- offer_images
create policy "offer_images_read_all"
  on public.offer_images for select
  using (true);

create policy "offer_images_insert_owner"
  on public.offer_images for insert
  with check (
    exists (
      select 1 from public.offers o
      where o.id = offer_id and o.user_id = auth.uid()
    )
  );

create policy "offer_images_delete_owner"
  on public.offer_images for delete
  using (
    exists (
      select 1 from public.offers o
      where o.id = offer_id and o.user_id = auth.uid()
    )
  );

-- contact_events
create policy "contact_events_insert_any_auth"
  on public.contact_events for insert
  with check (auth.role() = 'authenticated');

create policy "contact_events_read_owner"
  on public.contact_events for select
  using (
    exists (
      select 1 from public.offers o
      where o.id = offer_id and o.user_id = auth.uid()
    )
  );
```

### Política mínima del bucket `offer-images`

En **Storage → Policies** del bucket `offer-images`:

- **SELECT (lectura)**: pública (`true`).
- **INSERT (subir)**: solo usuarios autenticados (`auth.role() = 'authenticated'`).
- **DELETE**: solo el dueño (la app sube cada archivo dentro de una carpeta `{user_id}/...`, y la política valida `auth.uid()::text = (storage.foldername(name))[1]`).

---

## 📂 Estructura del frontend

```
frontend/
├── index.html
├── manifest.json
├── sw.js
├── package.json
├── vite.config.js          ← sin proxy, sin localhost
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── lib/
    │   └── supabaseClient.js
    ├── data/
    ├── components/
    ├── pages/
    │   ├── Home.jsx
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── Publish.jsx          ← publicar oferta (Supabase)
    │   ├── MyOffers.jsx         ← mis publicaciones (Supabase)
    │   ├── Admin.jsx            ← panel admin (Supabase + RLS)
    │   ├── OfferDetail.jsx
    │   ├── CreateOffer.jsx      ← stub legado, no se monta
    │   └── AdminDashboard.jsx   ← stub legado, no se monta
    ├── context/
    ├── services/
    │   └── api.js               ← stub legado (no llama a ningún backend)
    ├── styles/
    └── utils/
```

---

## 📱 PWA

SumerceMarket es instalable como app en Android, escritorio (Chrome / Edge) y, con limitaciones, en iOS.

- `frontend/manifest.json` → `name`, `short_name: Sumerce`, `display: standalone`, `theme_color: #fcd116`, íconos.
- `frontend/sw.js` →
  - **cache-first** para assets estáticos (JS, CSS, imágenes, fuentes).
  - **network-first** para navegaciones, con fallback a `/index.html`.
  - **Nunca cachea** llamadas a Supabase (`*.supabase.co`, `/auth`, `/rest/v1`, `/storage/v1`, `/realtime/v1`).
- `frontend/index.html` → enlaza el manifest, define `theme-color`, descripción y `apple-touch-icon`.
- `frontend/src/main.jsx` → registra el service worker **solo en producción**.

### Cómo probar la PWA

```bash
cd frontend
npm run build
npm run preview
```

DevTools → **Application → Manifest / Service Workers** para validar.

### Instalación

- **Android (Chrome):** menú **⋮ → Instalar aplicación**.
- **Escritorio (Chrome/Edge):** ícono de instalar en la barra de direcciones.
- **iOS (Safari):** botón **Compartir → Agregar a pantalla de inicio**.

---

## ⚠️ Notas finales

- La carpeta `backend/` es **legado** y no se ejecuta. Ver `backend/README.md`.
- Toda la lógica nueva debe escribirse contra Supabase usando `frontend/src/lib/supabaseClient.js`.
- No hay GitHub Actions, ni workflows, ni despliegue automático configurado en este repositorio.
