-- admin-scopes-columns.sql
-- Objetivo: soportar administradores por alcance territorial.
-- Agrega columnas de alcance (departamento y ciudad) a public.profiles.
-- SQL idempotente y seguro: no modifica columnas existentes, no borra datos,
-- no cambia roles, no toca RLS.

alter table public.profiles
add column if not exists admin_department text;

alter table public.profiles
add column if not exists admin_city text;
