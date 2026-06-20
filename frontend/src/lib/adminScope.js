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
//   applyAdminScopeToQuery(query, profile) → query con filtros territoriales
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
//     y devuelve el mismo query con filtros .eq() aplicados.
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

// -------------------- Filtro --------------------

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

// -------------------- Query Builder --------------------

/**
 * Aplica filtros territoriales a un query builder de Supabase
 * según el alcance del perfil del administrador.
 *
 * Reutiliza getAdminScope(profile) para determinar el tipo de filtro.
 *
 * Comportamiento:
 *   - global (admin / super_admin) → devuelve query sin filtros adicionales.
 *   - department (department_admin) → aplica .eq('department', ...).
 *   - city (city_admin) → aplica .eq('department', ...).eq('city', ...).
 *   - none (user / null / desconocido) → aplica .eq('id', '__no_access__')
 *     para garantizar resultado vacío sin error de Supabase.
 *
 * @param {object} query  - Query builder de Supabase (resultado de supabase.from(...).select(...)).
 * @param {object} profile - Perfil del usuario con role, admin_department, admin_city.
 * @returns {object} El mismo query builder con los filtros .eq() aplicados.
 *
 * Ejemplo de uso:
 *   import { applyAdminScopeToQuery } from '../lib/adminScope';
 *
 *   let query = supabase.from('offers').select('*');
 *   query = applyAdminScopeToQuery(query, profile);
 *   const { data, error } = await query;
 */
export function applyAdminScopeToQuery(query, profile) {
  const scope = getAdminScope(profile);

  switch (scope.type) {
    case 'global':
      // Admin global: sin restricciones territoriales.
      return query;

    case 'department':
      // Admin de departamento: filtra por departamento asignado.
      return query.eq('department', scope.department);

    case 'city':
      // Admin de ciudad: filtra por departamento Y ciudad asignados.
      return query.eq('department', scope.department).eq('city', scope.city);

    case 'none':
    default:
      // Sin acceso: filtro imposible que garantiza 0 resultados.
      return query.eq('id', '__no_access__');
  }
}
