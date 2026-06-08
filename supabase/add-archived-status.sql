-- ============================================================
-- Súmerce Market — Migración incremental
-- ------------------------------------------------------------
-- Objetivo:
--   Permitir el valor 'archived' en la columna offers.status.
--
-- Contexto:
--   El CHECK constraint original solo aceptaba:
--     active | paused | sold
--   Ahora aceptará:
--     active | paused | sold | archived
--
-- Semántica del nuevo estado:
--   - 'archived' = oferta histórica que el vendedor decidió
--     ocultar de su vista principal después de venderla.
--   - NO se elimina ningún dato.
--   - NO debe aparecer en el catálogo público (Home, SellerPage).
--   - SÍ debe seguir visible en el panel admin.
--   - NO debe sumar a la base de comisión (esa se calcula
--     únicamente sobre status = 'sold').
--
-- Cómo aplicar:
--   1. Abre tu proyecto en https://app.supabase.com
--   2. Ve a "SQL Editor" → "New query".
--   3. Pega TODO este archivo y ejecuta ("Run").
--
-- Idempotente: el DROP CONSTRAINT usa IF EXISTS.
-- ============================================================

-- 1) Quitar el CHECK actual (si existe).
alter table public.offers
  drop constraint if exists offers_status_check;

-- 2) Recrear el CHECK aceptando 'archived'.
alter table public.offers
  add constraint offers_status_check
  check (status in ('active','paused','sold','archived'));

-- 3) Verificación rápida (opcional):
--    select status, count(*) from public.offers group by status;
