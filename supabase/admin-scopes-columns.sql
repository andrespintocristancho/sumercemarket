-- =====================================================================
-- admin-scopes-columns.sql
-- Objetivo:
--   Soportar administradores por alcance territorial agregando columnas
--   a public.profiles:
--     - admin_department text
--     - admin_city text
--
-- Caracteristicas:
--   - Idempotente: usa ADD COLUMN IF NOT EXISTS (re-ejecutable sin error).
--   - Seguro: NO modifica columnas existentes, NO borra datos,
--     NO cambia roles existentes, NO toca RLS, NO afecta frontend.
-- =====================================================================

alter table public.profiles
add column if not exists admin_department text;

alter table public.profiles
add column if not exists admin_city text;

-- =====================================================================
-- Fin del script.
-- =====================================================================
