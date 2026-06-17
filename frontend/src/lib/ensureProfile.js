import { supabase } from './supabaseClient.js';

/**
 * Garantiza que exista una fila en `profiles` para el usuario autenticado.
 * Si no existe, crea un perfil mínimo seguro usando datos disponibles
 * del contexto de auth y de user_metadata.
 *
 * Esto previene el error:
 *   "insert or update on table offers violates foreign key constraint offers_user_id_fkey"
 *
 * @param {object} user    - Objeto `user` de supabase.auth (requiere user.id)
 * @param {object|null} profile - Perfil cargado desde AuthContext (puede ser null)
 * @returns {object} El perfil existente o recién creado
 * @throws {Error} Si no hay user.id o si la creación falla
 */
export async function ensureProfileForUser(user, profile) {
  if (!user?.id) {
    throw new Error('No hay usuario autenticado.');
  }

  // 1) Verificar si ya existe row en profiles
  const { data: existing, error: selectErr } = await supabase
    .from('profiles')
    .select('id, full_name, phone, department, city, role')
    .eq('id', user.id)
    .maybeSingle();

  if (selectErr) throw selectErr;

  // Si ya existe, no hacer nada
  if (existing) return existing;

  // 2) No existe → crear perfil mínimo seguro
  const meta = user.user_metadata || {};
  const newProfile = {
    id: user.id,
    full_name: profile?.full_name || profile?.name || meta.name || null,
    phone: profile?.phone || meta.phone || null,
    department: profile?.department || meta.department || null,
    city: profile?.city || meta.city || null,
    role: 'user'
  };

  const { data: created, error: insertErr } = await supabase
    .from('profiles')
    .insert(newProfile)
    .select('id, full_name, phone, department, city, role')
    .single();

  if (insertErr) {
    throw new Error(
      'No se pudo crear tu perfil de usuario. Intenta cerrar sesión e iniciar de nuevo.'
    );
  }

  return created;
}
