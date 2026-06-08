-- ============================================================
-- Súmerce Market — Esquema Supabase
-- ------------------------------------------------------------
-- Este esquema está alineado EXACTAMENTE con los campos que
-- el frontend usa hoy. No usa: municipality, is_active ni
-- category_id. Las ofertas usan `status`
-- (active/paused/sold/archived) y `category` como texto libre.
--
-- Semántica de status:
--   - 'active'   = visible al público y al vendedor.
--   - 'paused'   = oculta al público, visible para el vendedor.
--   - 'sold'     = vendida; oculta al público; visible para el
--                  vendedor y para el admin. Suma a comisión.
--   - 'archived' = vendida + archivada por el vendedor para
--                  ocultarla de su vista principal. Sigue
--                  visible para el admin. NO suma a comisión.
--                  No se borran datos históricos.
--
-- Cómo usar:
--   1. Abre tu proyecto en https://app.supabase.com
--   2. Ve a "SQL Editor" → "New query".
--   3. Pega TODO este archivo y ejecuta ("Run").
--   4. Crea el bucket de Storage llamado "offer-images"
--      (Storage → New bucket → Public: ON).
--
-- Notas:
--   - Idempotente en lo posible (IF NOT EXISTS / DROP POLICY IF EXISTS).
--   - Supabase provee `auth.users`. Aquí extendemos con perfiles
--     y datos del marketplace.
-- ============================================================

-- ------------------------------------------------------------
-- Extensiones
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ============================================================
-- 1) profiles
--    Datos del usuario, ligados 1:1 con auth.users.
-- ============================================================
create table if not exists public.profiles (
    id          uuid primary key references auth.users(id) on delete cascade,
    full_name   text,
    phone       text,
    department  text,
    city        text,
    role        text not null default 'user' check (role in ('user','admin')),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index if not exists profiles_department_idx on public.profiles (department);
create index if not exists profiles_city_idx       on public.profiles (city);
create index if not exists profiles_role_idx       on public.profiles (role);

-- ============================================================
-- 2) offers
--    Ofertas publicadas por los usuarios.
--    OJO: usa user_id (NO owner_id, NO seller_id).
--    OJO: usa `category` como texto, NO category_id.
--    OJO: usa `status` (active|paused|sold|archived), NO is_active.
-- ============================================================
create table if not exists public.offers (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null references auth.users(id) on delete cascade,
    title          text not null,
    description    text,
    category       text,
    price          numeric(12,2) not null check (price >= 0),
    department     text,
    city           text,
    address        text,
    contact_phone  text,
    contact_name   text,
    status         text not null default 'active'
                       check (status in ('active','paused','sold','archived')),
    image_url      text,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

create index if not exists offers_user_id_idx     on public.offers (user_id);
create index if not exists offers_status_idx      on public.offers (status);
create index if not exists offers_category_idx    on public.offers (category);
create index if not exists offers_department_idx  on public.offers (department);
create index if not exists offers_city_idx        on public.offers (city);
create index if not exists offers_created_at_idx  on public.offers (created_at desc);

-- ============================================================
-- 3) offer_images
--    Imágenes asociadas a una oferta. Las imágenes reales se
--    almacenan en Supabase Storage (bucket "offer-images");
--    aquí guardamos:
--      - url:  URL pública servible (o firmada) para mostrar.
--      - path: ruta interna dentro del bucket (para borrar/mover).
-- ============================================================
create table if not exists public.offer_images (
    id         uuid primary key default gen_random_uuid(),
    offer_id   uuid not null references public.offers(id) on delete cascade,
    url        text not null,
    path       text not null,
    position   int  not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists offer_images_offer_id_idx  on public.offer_images (offer_id);
create index if not exists offer_images_position_idx  on public.offer_images (offer_id, position);

-- ============================================================
-- 4) contact_events
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

create index if not exists contact_events_offer_id_idx     on public.contact_events (offer_id);
create index if not exists contact_events_contacter_id_idx on public.contact_events (contacter_id);
create index if not exists contact_events_created_at_idx   on public.contact_events (created_at desc);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table public.profiles       enable row level security;
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
-- offers
-- ------------------------------------------------------------
-- Lectura pública SOLO de ofertas con status = 'active'.
drop policy if exists "offers_select_active_public" on public.offers;
create policy "offers_select_active_public"
on public.offers
for select
using (status = 'active');

-- El dueño siempre puede ver TODAS sus ofertas (cualquier status).
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
          and o.status = 'active'
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

-- Insertar: solo si la oferta pertenece al usuario autenticado.
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

-- Actualizar: solo el dueño de la oferta.
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

-- Borrar: solo el dueño de la oferta.
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
-- evento de contacto sobre una oferta activa, siempre que
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
          and o.status = 'active'
    )
);

-- Lectura: el dueño de la oferta ve sus eventos; el propio
-- contactante ve los suyos.
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
-- El bucket NO se crea por SQL en este archivo. Créalo desde la UI:
--
--   Supabase Dashboard → Storage → New bucket
--     name:   offer-images
--     public: ON   (para servir las imágenes vía URL pública)
--
-- Recomendación de políticas en Storage → Policies:
--   - SELECT: público (cualquiera puede leer).
--   - INSERT/UPDATE/DELETE: solo usuarios autenticados, y
--     opcionalmente restringidos a carpetas con su auth.uid().
-- ============================================================
