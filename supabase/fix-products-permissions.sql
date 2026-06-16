-- ============================================================
-- supabase/fix-products-permissions.sql
-- ------------------------------------------------------------
-- Objetivo:
--   Corregir el error en /mis-productos:
--     "permission denied for table products"
--
--   Da los GRANTs correctos sobre public.products y
--   public.product_images, y recrea de forma segura las
--   politicas RLS para que:
--
--     - El publico (anon, authenticated) pueda LEER productos
--       con status='active' y sus imagenes asociadas.
--     - El vendedor autenticado pueda LEER/CREAR/EDITAR/ELIMINAR
--       sus propios productos y las imagenes de esos productos.
--
--   Las politicas comparan products.user_id contra el PERFIL
--   (public.profiles) del usuario autenticado. Esto cubre los
--   dos esquemas posibles:
--     1) profiles.user_id = auth.uid()
--     2) profiles.id      = auth.uid()
--
-- Notas:
--   - Este script NO modifica frontend.
--   - Este script NO se ejecuta automaticamente. Debes
--     copiarlo y pegarlo en Supabase > SQL Editor > Run.
--   - El script es idempotente: se puede ejecutar varias
--     veces sin romper el estado.
-- ============================================================

begin;

-- ============================================================
-- 1) GRANTS basicos sobre las tablas
-- ============================================================
-- Lectura publica (anon + authenticated). La RLS sigue filtrando
-- por status='active' o por dueno.
grant select on public.products       to anon, authenticated;
grant select on public.product_images to anon, authenticated;

-- Escritura solo para usuarios autenticados. La RLS asegura
-- que cada vendedor solo opere sobre sus propias filas.
grant insert, update, delete on public.products       to authenticated;
grant insert, update, delete on public.product_images to authenticated;

-- Asegurar que la RLS este habilitada (por seguridad, aunque
-- normalmente ya viene habilitada en Supabase).
alter table public.products       enable row level security;
alter table public.product_images enable row level security;


-- ============================================================
-- 2) Limpieza de politicas previas (idempotente)
-- ------------------------------------------------------------
-- Borramos cualquier politica con los nombres que vamos a usar.
-- Tambien borramos nombres "legacy" tipicos para evitar
-- duplicados que puedan estar bloqueando el acceso.
-- ============================================================

-- products: politicas nuevas
drop policy if exists "products public read active"     on public.products;
drop policy if exists "products owner select"           on public.products;
drop policy if exists "products owner insert"           on public.products;
drop policy if exists "products owner update"           on public.products;
drop policy if exists "products owner delete"           on public.products;

-- products: posibles nombres legacy
drop policy if exists "Enable read access for all users"               on public.products;
drop policy if exists "Public read products"                            on public.products;
drop policy if exists "products_select_public"                          on public.products;
drop policy if exists "products_select_owner"                           on public.products;
drop policy if exists "products_insert_owner"                           on public.products;
drop policy if exists "products_update_owner"                           on public.products;
drop policy if exists "products_delete_owner"                           on public.products;

-- product_images: politicas nuevas
drop policy if exists "product_images public read active"   on public.product_images;
drop policy if exists "product_images owner select"         on public.product_images;
drop policy if exists "product_images owner insert"         on public.product_images;
drop policy if exists "product_images owner update"         on public.product_images;
drop policy if exists "product_images owner delete"         on public.product_images;

-- product_images: posibles nombres legacy
drop policy if exists "Enable read access for all users"          on public.product_images;
drop policy if exists "Public read product_images"                 on public.product_images;
drop policy if exists "product_images_select_public"               on public.product_images;
drop policy if exists "product_images_select_owner"                on public.product_images;
drop policy if exists "product_images_insert_owner"                on public.product_images;
drop policy if exists "product_images_update_owner"                on public.product_images;
drop policy if exists "product_images_delete_owner"                on public.product_images;


-- ============================================================
-- 3) Politicas para public.products
-- ------------------------------------------------------------
-- Patron seguro: comparamos products.user_id contra el perfil
-- del usuario autenticado. Esto cubre los dos esquemas:
--   profiles.user_id = auth.uid()   (perfil enlaza a auth.users)
--   profiles.id      = auth.uid()   (perfil tiene mismo id)
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
      and (p.user_id = auth.uid() or p.id = auth.uid())
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
      and (p.user_id = auth.uid() or p.id = auth.uid())
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
      and (p.user_id = auth.uid() or p.id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = products.user_id
      and (p.user_id = auth.uid() or p.id = auth.uid())
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
      and (p.user_id = auth.uid() or p.id = auth.uid())
  )
);


-- ============================================================
-- 4) Politicas para public.product_images
-- ------------------------------------------------------------
-- Las imagenes heredan permisos del producto al que pertenecen.
-- Comparamos product_images.product_id -> products.user_id ->
-- profiles -> auth.uid().
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
      and (p.user_id = auth.uid() or p.id = auth.uid())
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
      and (p.user_id = auth.uid() or p.id = auth.uid())
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
      and (p.user_id = auth.uid() or p.id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.products pr
    join public.profiles p on p.id = pr.user_id
    where pr.id = product_images.product_id
      and (p.user_id = auth.uid() or p.id = auth.uid())
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
      and (p.user_id = auth.uid() or p.id = auth.uid())
  )
);

commit;

-- ============================================================
-- Fin del script.
-- ============================================================
