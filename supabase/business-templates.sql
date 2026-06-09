-- =====================================================================
-- Súmerce Market — Plantillas profesionales para la página pública
-- del vendedor (/seller/:slug).
--
-- Este script es IDEMPOTENTE: se puede ejecutar varias veces sin error.
-- Solo añade columnas y un CHECK constraint a la tabla `profiles`.
--
-- NO toca:
--   - autenticación
--   - políticas RLS existentes
--   - tablas `offers`, `offer_images`, `contact_events`
--   - columnas previas de negocio (`business_name`, `business_slug`,
--     `business_description`, `business_logo_url`, `business_cover_url`,
--     `business_whatsapp`, `business_address`, `business_department`,
--     `business_city`).
--
-- Ejecutar en:  Supabase → SQL Editor → New query → pegar todo → Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Nuevas columnas en `profiles`
-- ---------------------------------------------------------------------

alter table public.profiles
  add column if not exists business_template      text default 'store',
  add column if not exists business_headline      text,
  add column if not exists business_about         text,
  add column if not exists business_schedule      text,
  add column if not exists business_primary_color text default '#2563eb';

-- Asegurar el default también si la columna ya existía sin él
alter table public.profiles
  alter column business_template      set default 'store';

alter table public.profiles
  alter column business_primary_color set default '#2563eb';

-- Rellenar valores nulos previos con los defaults para que el CHECK pase
update public.profiles
   set business_template = 'store'
 where business_template is null;

update public.profiles
   set business_primary_color = '#2563eb'
 where business_primary_color is null;

-- ---------------------------------------------------------------------
-- 2. CHECK constraint para `business_template`
--    Valores permitidos:
--      store, fashion, beauty, health, gym, vehicles, food, services
-- ---------------------------------------------------------------------

alter table public.profiles
  drop constraint if exists profiles_business_template_check;

alter table public.profiles
  add constraint profiles_business_template_check
  check (
    business_template in (
      'store',
      'fashion',
      'beauty',
      'health',
      'gym',
      'vehicles',
      'food',
      'services'
    )
  );

-- ---------------------------------------------------------------------
-- 3. Índice opcional por plantilla (útil si luego se filtra/agrupa por ella)
-- ---------------------------------------------------------------------

create index if not exists profiles_business_template_idx
  on public.profiles (business_template);

-- ---------------------------------------------------------------------
-- 4. Comentarios de documentación (visibles en el dashboard de Supabase)
-- ---------------------------------------------------------------------

comment on column public.profiles.business_template is
  'Plantilla visual de la página pública del vendedor. Valores: store | fashion | beauty | health | gym | vehicles | food | services.';

comment on column public.profiles.business_headline is
  'Frase corta / titular destacado de la página pública del vendedor.';

comment on column public.profiles.business_about is
  'Texto largo "sobre el negocio" mostrado en la página pública del vendedor.';

comment on column public.profiles.business_schedule is
  'Horario de atención del negocio (texto libre, ej. "Lun-Vie 9am-6pm").';

comment on column public.profiles.business_primary_color is
  'Color primario (HEX) usado por la plantilla de la página pública del vendedor.';

-- =====================================================================
-- Verificación rápida (opcional). Pégalo en otro New query y ejecútalo:
--
--   select column_name, data_type, column_default
--     from information_schema.columns
--    where table_schema = 'public'
--      and table_name   = 'profiles'
--      and column_name in (
--        'business_template',
--        'business_headline',
--        'business_about',
--        'business_schedule',
--        'business_primary_color'
--      )
--   order by column_name;
--
--   select conname, pg_get_constraintdef(oid)
--     from pg_constraint
--    where conname = 'profiles_business_template_check';
-- =====================================================================
