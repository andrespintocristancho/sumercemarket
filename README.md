# SumerceMarket 🇨🇴

Marketplace colombiano de compra y venta entre personas. Permite publicar ofertas con fotos, filtrar por categoría, departamento y ciudad, contactar al vendedor y gestionar publicaciones propias. Pensado para Colombia: validación de teléfono móvil (3XXXXXXXXX), catálogo de departamentos y ciudades reales del país, y experiencia móvil primero.

> **Esta versión migra a una arquitectura 100% serverless con Supabase. Ya no hay backend Node.js ni SQLite ni uploads locales.**

---

## 🏗️ Arquitectura nueva

| Pieza | Tecnología |
|---|---|
| Frontend | React 18 + Vite + React Router 6 (PWA) |
| Autenticación | Supabase Auth (email + contraseña) |
| Base de datos | Supabase Postgres |
| Almacenamiento de imágenes | Supabase Storage (bucket público `offer-images`) |
| Reglas de seguridad | Row Level Security (RLS) en Postgres |
| Hosting | Cualquier estático: Vercel, Netlify, Cloudflare Pages, GitHub Pages |

**Eliminado en esta versión:**
- Backend Node.js + Express
- SQLite (`better-sqlite3`)
- Multer y uploads en disco local
- JWT manual / bcrypt manual (lo gestiona Supabase Auth)

---

## 🔐 Variables de entorno

Crea un archivo `frontend/.env` (o `.env.local`) a partir de `.env.example`:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...tu-clave-anon-publica
```

Solo se usa la **anon key pública**. No subas la `service_role`.

---

## 🚀 Crear el proyecto en Supabase (gratis)

1. Entra a https://supabase.com/ y crea una cuenta.
2. **New project** → nombre `sumercemarket`, contraseña fuerte para la BD, región más cercana (ej. `South America (São Paulo)`).
3. Espera 1-2 minutos a que el proyecto quede listo.
4. En **Project Settings → API** copia:
   - `Project URL` → va en `VITE_SUPABASE_URL`
   - `anon public` key → va en `VITE_SUPABASE_ANON_KEY`
5. En **Authentication → Providers** deja habilitado **Email** (viene por defecto). Desactiva "Confirm email" si quieres pruebas rápidas (recomendado activarlo en producción).
6. En **Storage** crea un bucket llamado `offer-images` y márcalo como **Public**.

---

## 🗄️ SQL para crear las tablas

Ve a **SQL Editor** en el panel de Supabase y ejecuta este bloque completo:

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

Habilita RLS y crea políticas mínimas:

```sql
-- ============================================================
-- Activar RLS
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.offers         enable row level security;
alter table public.offer_images   enable row level security;
alter table public.contact_events enable row level security;
alter table public.categories     enable row level security;

-- ------------------------------------------------------------
-- categories: lectura pública, escritura solo admin
-- ------------------------------------------------------------
create policy "categories_read_all"
  on public.categories for select
  using (true);

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
-- Cualquiera autenticado puede ver perfiles públicos básicos
create policy "profiles_read_all"
  on public.profiles for select
  using (true);

-- El usuario solo puede insertar su propio perfil
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

-- El usuario solo puede actualizar su propio perfil
create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- offers
-- ------------------------------------------------------------
-- Cualquiera puede leer ofertas activas
create policy "offers_read_active"
  on public.offers for select
  using (status = 'active' or auth.uid() = user_id);

-- Solo usuarios autenticados pueden crear, y siempre como dueños
create policy "offers_insert_owner"
  on public.offers for insert
  with check (auth.uid() = user_id);

-- Solo el dueño puede actualizar
create policy "offers_update_owner"
  on public.offers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Solo el dueño puede borrar
create policy "offers_delete_owner"
  on public.offers for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- offer_images
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- contact_events
-- ------------------------------------------------------------
-- Cualquiera autenticado puede registrar que contactó a un vendedor
create policy "contact_events_insert_any_auth"
  on public.contact_events for insert
  with check (auth.role() = 'authenticated');

-- El dueño de la oferta puede ver sus contactos
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

## 💻 Correr el frontend localmente

```bash
cd frontend
cp ../.env.example .env
# Edita .env y pega tus claves de Supabase
npm install
npm run dev
```

Abre http://localhost:5173

---

## 📂 Estructura prevista del frontend

```
frontend/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── lib/
    │   └── supabaseClient.js
    ├── data/
    │   ├── categories.js
    │   └── colombia.js
    ├── components/
    ├── pages/
    ├── context/
    └── services/
```

---

## ⚠️ Nota importante

**El backend Node.js + Express + SQLite queda eliminado en esta versión.** La carpeta `backend/` del repo es legado y será removida en bloques posteriores. Toda la lógica (auth, datos, fotos) corre ahora directamente contra Supabase desde el navegador, respaldada por RLS en Postgres.

No hay GitHub Actions, ni workflows, ni despliegue automático configurado en este repositorio.
