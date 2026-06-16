-- ============================================================
-- supabase/fix-products-permissions-v2.sql
-- ------------------------------------------------------------
-- Objetivo:
--   Corregir el error 42703 que arrojo la version anterior:
--     ERROR: 42703: column p.user_id does not exist
--
--   En este proyecto, public.profiles NO tiene columna user_id.
--   La columna que identifica al usuario es directamente
--   public.profiles.id (que coincide con auth.uid()).
--
--   Tambien se asume que public.products.user_id = auth.uid()
--   del vendedor (o equivalentemente, profiles.id).
--
-- Que hace este script:
--   1) GRANTs basicos sobre public.products y public.product_images.
--   2) Habilita RLS.
--   3) Borra (idempotente) cualquier politica previa con los
--      mismos nombres o nombres legacy comunes.
--   4) Crea politicas RLS simples:
--        - publico lee products status='active'
--        - dueno autenticado: select/insert/update/delete sobre
--          sus productos (products.user_id = auth.uid())
--        - publico lee imagenes de productos activos
--        - dueno autenticado: select/insert/update/delete sobre
--          imagenes de sus productos
--
-- Notas:
--   - Este script NO modifica frontend.
--   - Este script NO se ejecuta automaticamente. Debes copiarlo
--     y pegarlo en Supabase > SQL Editor > Run.
--   - El script es idempotente: se puede ejecutar varias veces
--     sin romper el estado.
-- ============================================================

begin;

-- ============================================================
-- 1) GRANTS basicos sobre las tablas
-- ============================================================
grant select on public.products       to anon, authenticated;
grant select on public.product_images to anon, authenticated;

grant insert, update, delete on public.products       to authenticated;
grant insert, update, delete on public.product_images to authenticated;

-- Asegurar RLS habilitada en ambas tablas.
alter table public.products       enable row level security;
alter table public.product_images enable row level security;


-- ============================================================
-- 2) Limpieza de politicas previas (idempotente)
-- ------------------------------------------------------------
-- Borramos cualquier politica con los nombres nuevos y con
-- nombres legacy comunes, para que el script sea seguro de
-- re-ejecutar.
-- ============================================================

-- products: nombres nuevos
drop policy if exists "products public read active"   on public.products;
drop policy if exists "products owner select"         on public.products;
drop policy if exists "products owner insert"         on public.products;
drop policy if exists "products owner update"         on public.products;
drop policy if exists "products owner delete"         on public.products;

-- products: nombres legacy comunes
drop policy if exists "Enable read access for all users"   on public.products;
drop policy if exists "Public read products"               on public.products;
drop policy if exists "products_select_public"             on public.products;
drop policy if exists "products_select_owner"              on public.products;
drop policy if exists "products_insert_owner"              on public.products;
drop policy if exists "products_update_owner"              on public.products;
drop policy if exists "products_delete_owner"              on public.products;

-- product_images: nombres nuevos
drop policy if exists "product_images public read active"  on public.product_images;
drop policy if exists "product_images owner select"        on public.product_images;
drop policy if exists "product_images owner insert"        on public.product_images;
drop policy if exists "product_images owner update"        on public.product_images;
drop policy if exists "product_images owner delete"        on public.product_images;

-- product_images: nombres legacy comunes
drop policy if exists "Enable read access for all users"   on public.product_images;
drop policy if exists "Public read product_images"         on public.product_images;
drop policy if exists "product_images_select_public"       on public.product_images;
drop policy if exists "product_images_select_owner"        on public.product_images;
drop policy if exists "product_images_insert_owner"        on public.product_images;
drop policy if exists "product_images_update_owner"        on public.product_images;
drop policy if exists "product_images_delete_owner"        on public.product_images;


-- ============================================================
-- 3) Politicas para public.products
-- ------------------------------------------------------------
-- Patron: profiles.id = auth.uid() y products.user_id = profiles.id
-- (equivalente a products.user_id = auth.uid()).
-- Mantenemos el join contra profiles como defensa: asi solo un
-- usuario con perfil valido puede operar.
-- ============================================================

-- 3.1) Lectura publica: cualquier visitante ve productos activos.
create policy "products public read active"
on public.products
for select
to anon, authenticated
using (
  status = 'active'
);

-- 3.2) Lectura para el dueno: ve TODOS sus productos (cualquier status).
create policy "products owner select"
on public.products
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = products.user_id
      and p.id = auth.uid()
  )
);

-- 3.3) Insertar: solo si la fila nueva pertenece al perfil del usuario.
create policy "products owner insert"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = products.user_id
      and p.id = auth.uid()
  )
);

-- 3.4) Actualizar: solo el dueno (chequea antes y despues).
create policy "products owner update"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = products.user_id
      and p.id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = products.user_id
      and p.id = auth.uid()
  )
);

-- 3.5) Eliminar: solo el dueno.
create policy "products owner delete"
on public.products
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = products.user_id
      and p.id = auth.uid()
  )
);


-- ============================================================
-- 4) Politicas para public.product_images
-- ------------------------------------------------------------
-- Las imagenes heredan permisos del producto al que pertenecen.
-- product_images.product_id -> products.user_id -> profiles.id = auth.uid()
-- ============================================================

-- 4.1) Lectura publica: imagenes de productos activos.
create policy "product_images public read active"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products pr
    where pr.id = product_images.product_id
      and pr.status = 'active'
  )
);

-- 4.2) Lectura para el dueno: imagenes de cualquier producto suyo.
create policy "product_images owner select"
on public.product_images
for select
to authenticated
using (
  exists (
    select 1
    from public.products pr
    join public.profiles p on p.id = pr.user_id
    where pr.id = product_images.product_id
      and p.id = auth.uid()
  )
);

-- 4.3) Insertar: solo si la imagen pertenece a un producto del usuario.
create policy "product_images owner insert"
on public.product_images
for insert
to authenticated
with check (
  exists (
    select 1
    from public.products pr
    join public.profiles p on p.id = pr.user_id
    where pr.id = product_images.product_id
      and p.id = auth.uid()
  )
);

-- 4.4) Actualizar: solo el dueno del producto al que pertenece la imagen.
create policy "product_images owner update"
on public.product_images
for update
to authenticated
using (
  exists (
    select 1
    from public.products pr
    join public.profiles p on p.id = pr.user_id
    where pr.id = product_images.product_id
      and p.id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.products pr
    join public.profiles p on p.id = pr.user_id
    where pr.id = product_images.product_id
      and p.id = auth.uid()
  )
);

-- 4.5) Eliminar: solo el dueno del producto al que pertenece la imagen.
create policy "product_images owner delete"
on public.product_images
for delete
to authenticated
using (
  exists (
    select 1
    from public.products pr
    join public.profiles p on p.id = pr.user_id
    where pr.id = product_images.product_id
      and p.id = auth.uid()
  )
);

commit;

-- ============================================================
-- Fin del script.
-- ============================================================
