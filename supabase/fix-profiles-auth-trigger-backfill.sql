-- =====================================================================
-- fix-profiles-auth-trigger-backfill.sql
-- ---------------------------------------------------------------------
-- Objetivo:
--   1) Garantizar que cada usuario de Supabase Auth (auth.users) tenga
--      una fila correspondiente en public.profiles.
--   2) Crear automaticamente esa fila para los NUEVOS usuarios mediante
--      un trigger AFTER INSERT sobre auth.users.
--   3) Hacer backfill de los usuarios EXISTENTES que aun no tienen perfil.
--
-- Caracteristicas de seguridad:
--   - Idempotente: se puede ejecutar varias veces sin efectos adversos.
--   - NO borra datos.
--   - NO sobrescribe perfiles existentes (ON CONFLICT (id) DO NOTHING).
--   - NO cambia roles existentes (no toca admins ni otros roles).
--   - NO modifica RLS.
--
-- NOTA: Este script NO se ejecuta automaticamente. Aplicar manualmente
--       en Supabase (SQL Editor) cuando se desee.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Funcion: public.handle_new_user()
--    Inserta el perfil del nuevo usuario. SECURITY DEFINER para poder
--    escribir en public.profiles desde el contexto del trigger en
--    auth.users. ON CONFLICT (id) DO NOTHING evita sobrescrituras.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, department, city, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email, 'Usuario'),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'department', ''),
    coalesce(new.raw_user_meta_data->>'city', ''),
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2) Trigger: on_auth_user_created
--    Se elimina primero si ya existe (idempotencia) y luego se recrea.
-- ---------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3) Backfill: crear perfiles faltantes de usuarios ya existentes.
--    ON CONFLICT (id) DO NOTHING garantiza que NO se sobrescriba ningun
--    perfil existente (incluidos admins). Solo se crean los que faltan.
-- ---------------------------------------------------------------------
insert into public.profiles (id, full_name, phone, department, city, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'name', u.email, 'Usuario'),
  coalesce(u.raw_user_meta_data->>'phone', ''),
  coalesce(u.raw_user_meta_data->>'department', ''),
  coalesce(u.raw_user_meta_data->>'city', ''),
  'user'
from auth.users u
on conflict (id) do nothing;
