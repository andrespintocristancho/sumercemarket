-- ============================================================
-- supabase/fix-product-images-upload-rls.sql
-- ------------------------------------------------------------
-- Objetivo:
--   Corregir el error al subir imagen en /mis-productos:
--     "new row violates row-level security policy"
--
--   Este error proviene de la capa RLS de storage.objects del
--   bucket "product-images", que NO estaba cubierta por SQL en
--   el repositorio (solo se recomendaba configurarla a mano).
--
-- Contexto de identidad en este proyecto:
--   - public.profiles.id  == auth.uid()
--   - public.products.user_id == auth.uid() (== profiles.id)
--   - El frontend sube al path: {auth.uid()}/{productId}/{archivo}
--     => la PRIMERA carpeta del objeto debe ser auth.uid().
--
-- Que hace este script:
--   1) Asegura que el bucket "product-images" exista y sea publico.
--   2) Habilita RLS en storage.objects (ya viene habilitada por
--      defecto en Supabase; se deja explicito e idempotente).
--   3) Borra (idempotente) politicas previas con estos nombres.
--   4) Crea politicas de storage.objects para el bucket:
--        - SELECT: publico (cualquiera puede leer).
--        - INSERT/UPDATE/DELETE: solo 'authenticated' y SOLO si la
--          primera carpeta del path == auth.uid().
--
-- Notas:
--   - NO modifica las tablas products ni product_images.
--   - NO rompe productos existentes (solo agrega politicas de
--     Storage que hoy no existen).
--   - Idempotente: se puede ejecutar varias veces.
--   - Pegar en Supabase > SQL Editor > Run.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1) Asegurar el bucket "product-images" (publico).
--    Si ya existe, solo se asegura que sea publico.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- ------------------------------------------------------------
-- 2) RLS habilitada en storage.objects (idempotente).
-- ------------------------------------------------------------
alter table storage.objects enable row level security;

-- ------------------------------------------------------------
-- 3) Limpieza idempotente de politicas previas.
-- ------------------------------------------------------------
drop policy if exists "product-images public read"      on storage.objects;
drop policy if exists "product-images owner insert"     on storage.objects;
drop policy if exists "product-images owner update"     on storage.objects;
drop policy if exists "product-images owner delete"     on storage.objects;

-- ------------------------------------------------------------
-- 4) Politicas para el bucket "product-images".
-- ------------------------------------------------------------

-- 4.1) Lectura publica: cualquiera puede leer objetos del bucket.
create policy "product-images public read"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-images'
);

-- 4.2) Insertar: solo usuario autenticado y SOLO en su carpeta
--      (primera carpeta del path == auth.uid()).
create policy "product-images owner insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4.3) Actualizar: solo el dueno de la carpeta.
create policy "product-images owner update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4.4) Eliminar: solo el dueno de la carpeta.
create policy "product-images owner delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;

-- ============================================================
-- Fin del script.
-- ============================================================
