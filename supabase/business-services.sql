-- ============================================================
-- Súmerce Market — Columna business_services en profiles
-- ------------------------------------------------------------
-- Este script añade la columna `business_services` a la tabla
-- public.profiles. La columna almacena, como texto libre, la
-- lista de servicios que ofrece el vendedor separados por coma.
-- Ese texto se renderiza como "tags" en la página pública
-- /seller/:slug y se edita desde /business-profile.
--
-- NO se modifica el login, NO se crean nuevas tablas y NO se
-- tocan las políticas RLS existentes.
--
-- Cómo usar:
--   1. Abre tu proyecto en https://app.supabase.com
--   2. Ve a "SQL Editor" → "New query".
--   3. Pega TODO este archivo y ejecuta ("Run").
--
-- Es idempotente: usa ADD COLUMN IF NOT EXISTS.
-- ============================================================

alter table public.profiles
    add column if not exists business_services text;

comment on column public.profiles.business_services is
  'Lista de servicios del negocio separados por coma. Se renderizan como tags en la página pública /seller/:slug.';

-- ============================================================
-- Verificación rápida (opcional). Pégalo en otro New query:
--
--   select column_name, data_type
--     from information_schema.columns
--    where table_schema = 'public'
--      and table_name   = 'profiles'
--      and column_name  = 'business_services';
-- ============================================================
