// Cliente único de Supabase para todo el frontend.
// Se importa desde cualquier servicio/página: import { supabase } from '@/lib/supabaseClient'

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Mensaje claro en consola para evitar errores opacos en dev
  // (no rompemos el build, pero avisamos en runtime).
  // eslint-disable-next-line no-console
  console.warn(
    '[supabaseClient] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
      'Copia .env.example a frontend/.env y completa los valores.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sumerce-auth'
  }
});

// Helper rápido para saber si el cliente está bien configurado.
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
