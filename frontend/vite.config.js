import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// SumerceMarket — Vite config
// ---------------------------------------------------------------
// El frontend habla DIRECTO con Supabase (Auth + Postgres + Storage).
// No hay backend Node propio, por lo que NO se necesita ningún
// proxy a localhost. Mantener este archivo limpio evita reintroducir
// dependencias al backend legado.
// ---------------------------------------------------------------

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    host: true
  },
  preview: {
    port: 4173,
    strictPort: false,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
