-- ============================================================
-- Súmerce Market — Perfil de negocio para vendedores
-- ------------------------------------------------------------
-- Este script EXTIENDE la tabla public.profiles con los campos
-- necesarios para que cada vendedor tenga una "tienda" pública
-- accesible en la ruta /seller/:slug del frontend.
--
-- NO se modifica el login, NO se crean nuevas tablas y NO se
-- tocan las políticas RLS existentes (las de profiles ya
-- permiten: select público y update self).
--
-- Cómo usar:
--   1. Abre tu proyecto en https://app.supabase.com
--   2. Ve a "SQL Editor" → "New query".
--   3. Pega TODO este archivo y ejecuta ("Run").
--
-- Notas:
--   - Es idempotente: usa ADD COLUMN IF NOT EXISTS y
--     CREATE INDEX IF NOT EXISTS, por lo que se puede correr
--     varias veces sin romper nada.
--   - Todas las columnas son NULL por defecto: los perfiles
--     existentes NO se ven afectados hasta que el vendedor
--     edite su negocio desde /business-profile.
-- ============================================================

-- ------------------------------------------------------------
-- Columnas de negocio en profiles
-- ------------------------------------------------------------
alter table public.profiles
    add column if not exists business_name        text;

alter table public.profiles
    add column if not exists business_slug        text;

alter table public.profiles
    add column if not exists business_description text;

alter table public.profiles
    add column if not exists business_logo_url    text;

alter table public.profiles
    add column if not exists business_cover_url   text;

alter table public.profiles
    add column if not exists business_whatsapp    text;

alter table public.profiles
    add column if not exists business_address     text;

alter table public.profiles
    add column if not exists business_department  text;

alter table public.profiles
    add column if not exists business_city        text;

-- ------------------------------------------------------------
-- Unicidad del slug
--   El slug se usa en la URL pública /seller/:slug, así que
--   debe ser único. Permitimos NULL (perfiles sin tienda aún).
-- ------------------------------------------------------------
create unique index if not exists profiles_business_slug_uidx
    on public.profiles (business_slug)
    where business_slug is not null;

-- ------------------------------------------------------------
-- Índices auxiliares para búsquedas/filtros por ubicación del
-- negocio (no obligatorios para que el frontend funcione,
-- pero útiles a futuro).
-- ------------------------------------------------------------
create index if not exists profiles_business_department_idx
    on public.profiles (business_department);

create index if not exists profiles_business_city_idx
    on public.profiles (business_city);

-- ============================================================
-- RLS
-- ------------------------------------------------------------
-- Las políticas existentes de public.profiles son suficientes:
--
--   profiles_select_public  (using true)             -> lectura pública
--   profiles_insert_self    (auth.uid() = id)        -> self-insert
--   profiles_update_self    (auth.uid() = id)        -> self-update
--
-- Eso significa que:
--   - Cualquiera puede leer business_name, business_slug, etc.
--     (necesario para la página pública /seller/:slug).
--   - Solo el dueño del perfil puede actualizar sus datos de
--     negocio (necesario para /business-profile).
--
-- NO se redefinen políticas aquí para no romper nada.
-- ============================================================
