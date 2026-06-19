-- =====================================================================
-- fix-profiles-auth-trigger-backfill.sql
-- Objetivo:
--   1) Garantizar que cada usuario de auth.users tenga fila en
--      public.profiles (backfill).
--   2) Crear automáticamente la fila en public.profiles cuando se
--      registre un nuevo usuario en auth.users (trigger).
--
-- Caracteristicas:
--   - Idempotente: se puede ejecutar varias veces sin efectos no deseados.
--   - Seguro: NO borra datos, NO sobrescribe perfiles ni roles existentes.
--   - No toca RLS, no modifica schema.sql, no afecta frontend.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Funcion: crea la fila en public.profiles para un nuevo usuario.
--    CREATE OR REPLACE => idempotente.
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
-- 2) Trigger: ejecuta la funcion despues de insertar en auth.users.
--    Se elimina primero si existe para evitar duplicados (idempotente).
-- ---------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3) Backfill: crea profiles faltantes para usuarios ya existentes.
--    ON CONFLICT (id) DO NOTHING => no sobrescribe perfiles ni roles
--    existentes (no cambia admins ni datos previos).
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

-- =====================================================================
-- Fin del script.
-- =====================================================================
