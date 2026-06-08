// ============================================================
// services/api.js — STUB LEGADO
// ============================================================
// Este módulo apuntaba al antiguo backend Node + Express en /api.
// En la arquitectura actual (Supabase) ya NO se usa.
//
// Se conserva como stub para no romper imports residuales mientras
// se migran las últimas pantallas legado. Toda llamada lanza un
// error claro indicando que el caller debe migrarse a Supabase.
//
// ❌ No reintroducir fetch('/api/...').
// ❌ No reintroducir tokens en localStorage.
// ✅ Para nuevas pantallas, usar:
//      import { supabase } from '../lib/supabaseClient.js';
// ============================================================

function legacyError(method) {
  const msg =
    `[api.${method}] El backend Node legado ya no existe. ` +
    'Esta pantalla debe migrarse a Supabase (ver frontend/src/lib/supabaseClient.js).';
  // eslint-disable-next-line no-console
  console.warn(msg);
  const err = new Error('Funcionalidad no disponible: migrar a Supabase.');
  err.code = 'LEGACY_API_REMOVED';
  return err;
}

function notImplemented(method) {
  return () => Promise.reject(legacyError(method));
}

export const api = {
  // Auth (gestionado ahora por Supabase Auth en AuthContext)
  register: notImplemented('register'),
  login: notImplemented('login'),
  me: notImplemented('me'),

  // Offers
  listOffers: notImplemented('listOffers'),
  getOffer: notImplemented('getOffer'),
  myOffers: notImplemented('myOffers'),
  createOffer: notImplemented('createOffer'),
  updateOffer: notImplemented('updateOffer'),
  deleteOffer: notImplemented('deleteOffer'),
  contactOffer: notImplemented('contactOffer'),

  // Locations (catálogo estático en frontend/src/data/colombia.js)
  getDepartments: notImplemented('getDepartments'),
  getCities: notImplemented('getCities'),

  // Admin
  adminStats: notImplemented('adminStats'),
  adminUsers: notImplemented('adminUsers'),
  adminDeleteUser: notImplemented('adminDeleteUser'),
  adminOffers: notImplemented('adminOffers')
};

export default api;
