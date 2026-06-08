-- ============================================================
-- Súmerce Market — Esquema de base de datos en Supabase
-- ------------------------------------------------------------
-- Cómo usar:
--   1. Abre tu proyecto en https://app.supabase.com
--   2. Ve a "SQL Editor" → "New query"
--   3. Pega TODO este archivo y ejecuta ("Run").
--   4. Crea el bucket de Storage llamado "offer-images"
--      (Storage → New bucket → Public: ON).
--
-- Notas:
--   - Este archivo es idempotente en la medida de lo posible
--     (usa IF NOT EXISTS / DROP POLICY IF EXISTS).
--   - Supabase ya provee el esquema `auth` con la tabla
--     `auth.users`. Aquí solo extendemos con datos de perfil
--     y datos del marketplace.
-- ============================================================

-- ------------------------------------------------------------
-- Extensiones útiles
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ============================================================
-- 1) profiles
--    Datos públicos del usuario, ligados 1:1 con auth.users.
-- ============================================================
create table if not exists public.profiles (
    id           uuid primary key references auth.users(id) on delete cascade,
    full_name    text,
    phone        text,
    municipality text,
    avatar_url   text,
    is_admin     boolean not null default false,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create index if not exists profiles_municipality_idx
    on public.profiles (municipality);

-- ============================================================
-- 2) categories
--    Catálogo de categorías para clasificar ofertas.
-- ============================================================
create table if not exists public.categories (
    id          uuid primary key default gen_random_uuid(),
    slug        text not null unique,
    name        text not null,
    description text,
    created_at  timestamptz not null default now()
);

create index if not exists categories_slug_idx
    on public.categories (slug);

-- ============================================================
-- 3) offers
--    Ofertas publicadas por los usuarios.
--    OJO: usa user_id (NO owner_id, NO seller_id).
-- ============================================================
create table if not exists public.offers (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users(id) on delete cascade,
    category_id   uuid references public.categories(id) on delete set null,
    title         text not null,
    description   text,
    price         numeric(12,2) not null check (price >= 0),
    currency      text not null default 'COP',
    municipality  text,
    is_active     boolean not null default true,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create index if not exists offers_user_id_idx       on public.offers (user_id);
create index if not exists offers_category_id_idx   on public.offers (category_id);
create index if not exists offers_is_active_idx     on public.offers (is_active);
create index if not exists offers_created_at_idx    on public.offers (created_at desc);
create index if not exists offers_municipality_idx  on public.offers (municipality);

-- ============================================================
-- 4) offer_images
--    Imágenes asociadas a una oferta. Las imágenes reales se
--    almacenan en Supabase Storage (bucket "offer-images");
--    aquí guardamos la ruta/URL pública.
-- ============================================================
create table if not exists public.offer_images (
    id         uuid primary key default gen_random_uuid(),
    offer_id   uuid not null references public.offers(id) on delete cascade,
    image_url  text not null,
    position   int  not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists offer_images_offer_id_idx
    on public.offer_images (offer_id);

-- ============================================================
-- 5) contact_events
--    Registro de contactos hacia una oferta (WhatsApp, llamada,
--    ver teléfono, etc.).
--    OJO: usa contacter_id (NO user_id).
-- ============================================================
create table if not exists public.contact_events (
    id           uuid primary key default gen_random_uuid(),
    offer_id     uuid not null references public.offers(id) on delete cascade,
    contacter_id uuid references auth.users(id) on delete set null,
    channel      text not null check (channel in ('whatsapp','phone','view','other')),
    created_at   timestamptz not null default now()
);

create index if not exists contact_events_offer_id_idx
    on public.contact_events (offer_id);
create index if not exists contact_events_contacter_id_idx
    on public.contact_events (contacter_id);
create index if not exists contact_events_created_at_idx
    on public.contact_events (created_at desc);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.offers         enable row level security;
alter table public.offer_images   enable row level security;
alter table public.contact_events enable row level security;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
on public.profiles
for select
using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- ------------------------------------------------------------
-- categories  (lectura pública; escritura controlada por
--              backend/admin — sin política de insert/update
--              para usuarios anónimos)
-- ------------------------------------------------------------
drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public"
on public.categories
for select
using (true);

-- ------------------------------------------------------------
-- offers
-- ------------------------------------------------------------
-- Lectura pública SOLO de ofertas activas.
drop policy if exists "offers_select_active_public" on public.offers;
create policy "offers_select_active_public"
on public.offers
for select
using (is_active = true);

-- El dueño siempre puede ver TODAS sus ofertas (activas o no).
drop policy if exists "offers_select_own" on public.offers;
create policy "offers_select_own"
on public.offers
for select
using (auth.uid() = user_id);

-- Insertar: solo el propio usuario autenticado.
drop policy if exists "offers_insert_own" on public.offers;
create policy "offers_insert_own"
on public.offers
for insert
with check (auth.uid() = user_id);

-- Actualizar: solo el dueño.
drop policy if exists "offers_update_own" on public.offers;
create policy "offers_update_own"
on public.offers
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Borrar: solo el dueño.
drop policy if exists "offers_delete_own" on public.offers;
create policy "offers_delete_own"
on public.offers
for delete
using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- offer_images
-- ------------------------------------------------------------
-- Lectura pública de imágenes cuya oferta esté activa.
drop policy if exists "offer_images_select_public" on public.offer_images;
create policy "offer_images_select_public"
on public.offer_images
for select
using (
    exists (
        select 1
        from public.offers o
        where o.id = offer_images.offer_id
          and o.is_active = true
    )
);

-- El dueño de la oferta puede ver todas sus imágenes.
drop policy if exists "offer_images_select_own" on public.offer_images;
create policy "offer_images_select_own"
on public.offer_images
for select
using (
    exists (
        select 1
        from public.offers o
        where o.id = offer_images.offer_id
          and o.user_id = auth.uid()
    )
);

-- Insertar/actualizar/borrar: solo el dueño de la oferta.
drop policy if exists "offer_images_insert_own" on public.offer_images;
create policy "offer_images_insert_own"
on public.offer_images
for insert
with check (
    exists (
        select 1
        from public.offers o
        where o.id = offer_images.offer_id
          and o.user_id = auth.uid()
    )
);

drop policy if exists "offer_images_update_own" on public.offer_images;
create policy "offer_images_update_own"
on public.offer_images
for update
using (
    exists (
        select 1
        from public.offers o
        where o.id = offer_images.offer_id
          and o.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.offers o
        where o.id = offer_images.offer_id
          and o.user_id = auth.uid()
    )
);

drop policy if exists "offer_images_delete_own" on public.offer_images;
create policy "offer_images_delete_own"
on public.offer_images
for delete
using (
    exists (
        select 1
        from public.offers o
        where o.id = offer_images.offer_id
          and o.user_id = auth.uid()
    )
);

-- ------------------------------------------------------------
-- contact_events
-- ------------------------------------------------------------
-- Insertar: cualquier usuario autenticado puede registrar un
-- evento de contacto sobre una oferta activa, siempre que el
-- contacter_id coincida con su propio auth.uid().
drop policy if exists "contact_events_insert_authenticated" on public.contact_events;
create policy "contact_events_insert_authenticated"
on public.contact_events
for insert
with check (
    auth.uid() is not null
    and auth.uid() = contacter_id
    and exists (
        select 1
        from public.offers o
        where o.id = contact_events.offer_id
          and o.is_active = true
    )
);

-- Lectura: el dueño de la oferta puede ver sus eventos de
-- contacto; y el propio contactante puede ver los suyos.
drop policy if exists "contact_events_select_owner_or_contacter" on public.contact_events;
create policy "contact_events_select_owner_or_contacter"
on public.contact_events
for select
using (
    auth.uid() = contacter_id
    or exists (
        select 1
        from public.offers o
        where o.id = contact_events.offer_id
          and o.user_id = auth.uid()
    )
);

-- ============================================================
-- Storage: bucket "offer-images"
-- ------------------------------------------------------------
-- El bucket NO se crea por SQL en este archivo. Crea el bucket
-- desde la UI:
--   Supabase Dashboard → Storage → New bucket
--     name: offer-images
--     public: ON  (para poder servir las imágenes vía URL pública)
--
-- Si quieres reglas finas sobre quién sube/borra archivos en
-- ese bucket, configúralas en Storage → Policies.
-- ============================================================
