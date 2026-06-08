# ⚠️ backend/ — Carpeta LEGADO (no se usa)

Esta carpeta es **código legado** del antiguo backend Node.js + Express + SQLite de SumerceMarket. **Ya no forma parte de la arquitectura del proyecto** y **no debe ejecutarse**.

## Por qué está aquí

La arquitectura actual de SumerceMarket es **100% serverless con Supabase**:

- **Auth** → Supabase Auth
- **Base de datos** → Supabase Postgres + RLS
- **Almacenamiento de imágenes** → Supabase Storage (bucket `offer-images`)
- **Frontend** → React + Vite + PWA

Toda la lógica de negocio corre **directamente desde el navegador contra Supabase**, respaldada por Row Level Security.

Esta carpeta `backend/` se conserva temporalmente como referencia histórica del bloque anterior del proyecto.

## ¿Por qué no se eliminó?

En el frontend aún quedan dos archivos legado que apuntan a `/api` y que **todavía no han sido migrados** a Supabase:

- `frontend/src/services/api.js` (cliente genérico HTTP contra el viejo backend)
- `frontend/src/pages/CreateOffer.jsx` (usa `api`)
- `frontend/src/pages/AdminDashboard.jsx` (usa `api`)
- `frontend/vite.config.js` (define un proxy `/api` y `/uploads` a `http://localhost:4000`)

Borrar `backend/` ahora **rompería estas pantallas** mientras no se complete su migración a Supabase. Para no romper el frontend, esta carpeta queda marcada como legado y será eliminada en un bloque posterior, cuando esas pantallas estén migradas.

## ❌ No hacer

- ❌ No correr `npm install` ni `npm start` aquí.
- ❌ No desplegar este código.
- ❌ No referenciar nada de `backend/` en código nuevo del frontend.
- ❌ No tratar este servidor como parte de la app actual.

## ✅ Hacer

- ✅ Si vas a tocar `CreateOffer.jsx` o `AdminDashboard.jsx`, **reescríbelos contra Supabase** (`@supabase/supabase-js`) usando el patrón ya presente en el resto del frontend (ver `frontend/src/lib/supabaseClient.js` y `frontend/src/services/`).
- ✅ Después de migrar esas pantallas y de borrar `frontend/src/services/api.js` y el proxy `/api`, `/uploads` de `frontend/vite.config.js`, esta carpeta `backend/` puede eliminarse por completo.

## Contenido legado

- `backend/server.js` — servidor Express antiguo.
- `backend/package.json` — dependencias antiguas (express, better-sqlite3, multer, jsonwebtoken, bcrypt…).
- `backend/.env.example` — variables del backend antiguo.
- `backend/src/` — rutas, controladores y servicios antiguos.

Nada de esto se usa en la versión actual de SumerceMarket.
