-- admin-role-constraint.sql
-- Objetivo: ampliar los roles permitidos en public.profiles.role.
-- Roles permitidos: user, admin, super_admin, department_admin, city_admin.
--
-- SQL seguro e idempotente:
--   - No usa UPDATE ni DELETE.
--   - No borra datos.
--   - No cambia roles existentes.
--   - No toca RLS.
--
-- Nota: solo recrea el CHECK constraint del rol.

-- 1. Eliminar el constraint actual si existe.
alter table public.profiles
drop constraint if exists profiles_role_check;

-- 2. Crear nuevamente el constraint permitiendo el nuevo conjunto de roles.
alter table public.profiles
add constraint profiles_role_check
check (role in ('user', 'admin', 'super_admin', 'department_admin', 'city_admin'));
