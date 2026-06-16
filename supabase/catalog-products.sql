-- ============================================================
-- Sumerce Market - Catalogo del negocio
-- ------------------------------------------------------------
-- Este archivo agrega las tablas para el "Catalogo del negocio",
-- separado de las ofertas (tabla offers). Permite que un vendedor
-- gestione articulos normales (no rebajados) con foto, precio,
-- stock y categoria.
--
-- No modifica nada del esquema actual (offers, profiles, etc.).
-- Es 100% aditivo e idempotente.
--
-- Como aplicar:
--   1. Abre tu proyecto en https://app.supabase.com
--   2. Ve a "SQL Editor" -> "New query".
--   3. Pega TODO este archivo y ejecuta ("Run").
--   4. Crea el bucket de Storage llamado "product-images":
--      Storage -> New bucket -> name: product-images -> Public: ON.
--   5. En Storage -> Policies, agrega:
--        - SELECT: publico (cualquiera puede leer).
--        - INSERT/UPDATE/DELETE: solo usuarios autenticados,
--          restringidos a carpetas con su auth.uid().
--
-- Semantica de status en products:
--   - 'active'   = visible al publico y al vendedor.
--   - 'paused'   = oculto al publico, visible al vendedor.
--   - 'archived' = oculto al publico, visible al vendedor
--                  (no se borra historico).
-- ============================================================


-- ------------------------------------------------------------
-- Extensiones
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";


-- ============================================================
-- Funcion utilitaria: trigger para updated_at
-- ------------------------------------------------------------
-- Se crea solo si no existe. Reutilizable por cualquier tabla
-- que tenga una columna updated_at timestamptz.
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- ============================================================
-- 1) products
--    Articulos normales del vendedor (no son ofertas rebajadas).
-- ============================================================
create table if not exists public.products (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references public.profiles(id) on delete cascade,
    name         text not null,
    description  text,
    category     text,
    price        numeric(12,2) default 0 check (price >= 0),
    stock        int default 0 check (stock >= 0),
    sku          text,
    status       text not null default 'active'
                     check (status in ('active','paused','archived')),
    image_url    text,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create index if not exists products_user_id_idx     on public.products (user_id);
create index if not exists products_status_idx      on public.products (status);
create index if not exists products_category_idx    on public.products (category);
create index if not exists products_created_at_idx  on public.products (created_at desc);

-- Trigger updated_at
drop trigger if exists trg_products_set_updated_at on public.products;
create trigger trg_products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();


-- ============================================================
-- 2) product_images
--    Imagenes asociadas a un producto. Las imagenes reales se
--    almacenan en Supabase Storage (bucket "product-images");
--    aqui guardamos:
--      - url:  URL publica servible (o firmada) para mostrar.
--      - path: ruta interna dentro del bucket (para borrar/mover).
-- ============================================================
create table if not exists public.product_images (
    id          uuid primary key default gen_random_uuid(),
    product_id  uuid not null references public.products(id) on delete cascade,
    url         text not null,
    path        text,
    position    int  not null default 0,
    created_at  timestamptz not null default now()
);

create index if not exists product_images_product_id_idx  on public.product_images (product_id);
create index if not exists product_images_position_idx    on public.product_images (product_id, position);


-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table public.products       enable row level security;
alter table public.product_images enable row level security;


-- ------------------------------------------------------------
-- products
-- ------------------------------------------------------------

-- Lectura publica SOLO de productos con status = 'active'.
drop policy if exists "products_select_active_public" on public.products;
create policy "products_select_active_public"
on public.products
for select
using (status = 'active');

-- El dueno siempre puede ver TODOS sus productos (cualquier status).
drop policy if exists "products_select_own" on public.products;
create policy "products_select_own"
on public.products
for select
using (auth.uid() = user_id);

-- Insertar: solo el propio usuario autenticado.
drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own"
on public.products
for insert
with check (auth.uid() = user_id);

-- Actualizar: solo el dueno.
drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
on public.products
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Borrar: solo el dueno.
drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own"
on public.products
for delete
using (auth.uid() = user_id);


-- ------------------------------------------------------------
-- product_images
-- ------------------------------------------------------------

-- Lectura publica de imagenes cuyo producto este activo.
drop policy if exists "product_images_select_public" on public.product_images;
create policy "product_images_select_public"
on public.product_images
for select
using (
    exists (
        select 1
        from public.products p
        where p.id = product_images.product_id
          and p.status = 'active'
    )
);

-- El dueno del producto puede ver todas sus imagenes.
drop policy if exists "product_images_select_own" on public.product_images;
create policy "product_images_select_own"
on public.product_images
for select
using (
    exists (
        select 1
        from public.products p
        where p.id = product_images.product_id
          and p.user_id = auth.uid()
    )
);

-- Insertar: solo si el producto pertenece al usuario autenticado.
drop policy if exists "product_images_insert_own" on public.product_images;
create policy "product_images_insert_own"
on public.product_images
for insert
with check (
    exists (
        select 1
        from public.products p
        where p.id = product_images.product_id
          and p.user_id = auth.uid()
    )
);

-- Actualizar: solo el dueno del producto.
drop policy if exists "product_images_update_own" on public.product_images;
create policy "product_images_update_own"
on public.product_images
for update
using (
    exists (
        select 1
        from public.products p
        where p.id = product_images.product_id
          and p.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.products p
        where p.id = product_images.product_id
          and p.user_id = auth.uid()
    )
);

-- Borrar: solo el dueno del producto.
drop policy if exists "product_images_delete_own" on public.product_images;
create policy "product_images_delete_own"
on public.product_images
for delete
using (
    exists (
        select 1
        from public.products p
        where p.id = product_images.product_id
          and p.user_id = auth.uid()
    )
);


-- ============================================================
-- Storage: bucket "product-images"
-- ------------------------------------------------------------
-- El bucket NO se crea por SQL en este archivo. Crealo desde la UI:
--
--   Supabase Dashboard -> Storage -> New bucket
--     name:   product-images
--     public: ON   (para servir las imagenes via URL publica)
--
-- Recomendacion de politicas en Storage -> Policies:
--   - SELECT: publico (cualquiera puede leer).
--   - INSERT/UPDATE/DELETE: solo usuarios autenticados, y
--     restringidos a carpetas con su auth.uid().
-- ============================================================
