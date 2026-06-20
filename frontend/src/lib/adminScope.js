// adminScope.js
// ---------------------------------------------------------------------------
// Helper puro para calcular el alcance territorial de administradores.
//
// Funciones exportadas:
//   isGlobalAdmin(profile)          → boolean
//   isDepartmentAdmin(profile)      → boolean
//   isCityAdmin(profile)            → boolean
//   getAdminScope(profile)          → { type, department?, city? }
//   filterByAdminScope(items, profile) → items filtrados
//   applyAdminScopeToQuery(query, profile) → query con filtros Supabase
//
// Reglas de alcance:
//   super_admin / admin       → ve todo (global).
//   department_admin          → solo items donde
//                                item.department === profile.admin_department.
//   city_admin                → solo items donde
//                                item.department === profile.admin_department
//                                AND item.city === profile.admin_city.
//   user / null / desconocido → lista vacía (sin acceso).
//
// Convenciones:
//   - Todas las comparaciones se normalizan con norm() para evitar
//     errores por mayúsculas, espacios o tildes invisibles.
//   - No depende de Supabase, React, ni de AuthContext.
//   - No modifica los items recibidos (función pura).
//   - applyAdminScopeToQuery recibe un query builder de Supabase
//     y le aplica .eq() según el alcance, sin ejecutar la query.
// ---------------------------------------------------------------------------

// -------------------- Utilidad interna --------------------

/**
 * Normaliza un string para comparaciones seguras.
 * Retorna string vacío si el valor es nulo o indefinido.
 */
function norm(value) {
  if (value == null) return '';
  return String(value).trim().toLowerCase();
}

// -------------------- Detección de rol --------------------

/**
 * ¿El perfil es administrador global (ve todo)?
 * Roles: 'admin', 'super_admin'.
 */
export function isGlobalAdmin(profile) {
  if (!profile) return false;
  const r = norm(profile.role);
  return r === 'admin' || r === 'super_admin';
}

/**
 * ¿El perfil es administrador de departamento?
 * Rol: 'department_admin'.
 */
export function isDepartmentAdmin(profile) {
  if (!profile) return false;
  return norm(profile.role) === 'department_admin';
}

/**
 * ¿El perfil es administrador de ciudad?
 * Rol: 'city_admin'.
 */
export function isCityAdmin(profile) {
  if (!profile) return false;
  return norm(profile.role) === 'city_admin';
}

// -------------------- Alcance --------------------

/**
 * Devuelve un objeto descriptor del alcance territorial del perfil.
 *
 * Retorno posible:
 *   { type: 'global' }
 *   { type: 'department', department: 'boyacá' }
 *   { type: 'city',       department: 'boyacá', city: 'tunja' }
 *   { type: 'none' }
 */
export function getAdminScope(profile) {
  if (!profile) return { type: 'none' };

  if (isGlobalAdmin(profile)) {
    return { type: 'global' };
  }

  if (isDepartmentAdmin(profile)) {
    return {
      type: 'department',
      department: norm(profile.admin_department)
    };
  }

  if (isCityAdmin(profile)) {
    return {
      type: 'city',
      department: norm(profile.admin_department),
      city: norm(profile.admin_city)
    };
  }

  // user, null o rol desconocido → sin acceso.
  return { type: 'none' };
}

// -------------------- Filtro en memoria --------------------

/**
 * Filtra un array de items según el alcance territorial del perfil.
 *
 * Cada item debe tener al menos las propiedades `department` y/o `city`
 * (como las filas de offers o profiles).
 *
 * - global          → devuelve todos los items.
 * - department      → items cuyo department coincide.
 * - city            → items cuyo department Y city coinciden.
 * - none            → devuelve array vacío.
 *
 * No muta el array original.
 */
export function filterByAdminScope(items, profile) {
  if (!Array.isArray(items)) return [];

  const scope = getAdminScope(profile);

  switch (scope.type) {
    case 'global':
      return items;

    case 'department':
      return items.filter(
        (item) => norm(item.department) === scope.department
      );

    case 'city':
      return items.filter(
        (item) =>
          norm(item.department) === scope.department &&
          norm(item.city) === scope.city
      );

    case 'none':
    default:
      return [];
  }
}

// -------------------- Filtro a nivel de query Supabase --------------------

/**
 * Aplica filtros territoriales directamente a un query builder de Supabase.
 *
 * Recibe el query builder (ej: supabase.from('offers').select('*'))
 * y el perfil del administrador. Retorna el mismo query con los .eq()
 * necesarios según el alcance territorial, SIN ejecutar la query.
 *
 * Alcance aplicado:
 *   - global (admin / super_admin) → query sin filtros adicionales.
 *   - department (department_admin) → .eq('department', profile.admin_department)
 *   - city (city_admin) → .eq('department', ...).eq('city', ...)
 *   - none (user / null / desconocido) → .eq('id', '__no_access__')
 *     (filtro intencionalmente imposible para garantizar 0 resultados).
 *
 * Uso:
 *   import { applyAdminScopeToQuery } from '@/lib/adminScope';
 *
 *   let query = supabase.from('offers').select('*');
 *   query = applyAdminScopeToQuery(query, profile);
 *   const { data, error } = await query;
 *
 * @param {object} query   - Supabase query builder (con .eq disponible).
 * @param {object} profile - Perfil del usuario con role, admin_department, admin_city.
 * @returns {object}       - El mismo query builder con filtros aplicados.
 */
export function applyAdminScopeToQuery(query, profile) {
  const scope = getAdminScope(profile);

  switch (scope.type) {
    case 'global':
      // admin / super_admin → sin restricción territorial.
      return query;

    case 'department':
      // department_admin → filtrar por departamento.
      return query.eq('department', profile.admin_department);

    case 'city':
      // city_admin → filtrar por departamento + ciudad.
      return query
        .eq('department', profile.admin_department)
        .eq('city', profile.admin_city);

    case 'none':
    default:
      // user, null o rol desconocido → 0 resultados garantizados.
      return query.eq('id', '__no_access__');
  }
}
