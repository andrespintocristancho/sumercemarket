// RolePill.jsx
// ---------------------------------------------------------------------------
// Componente de presentación AISLADO para mostrar la etiqueta visual del rol
// en el panel de administración.
//
// Motivo:
//   La versión previa (RolePill dentro de Admin.jsx) calculaba el rol con una
//   comparación estricta `role === 'admin'`, lo que hacía que super_admin,
//   department_admin y city_admin se mostraran incorrectamente como "Usuario".
//
// Este componente NO toca:
//   - consultas a Supabase
//   - lógica de permisos / RLS
//   - AuthContext.jsx
//   - ProtectedRoute.jsx
//
// Es puramente visual: recibe `role` (string) y renderiza una píldora.
//
// Uso:
//   import RolePill from '../components/RolePill';
//   <RolePill role={role} />
// ---------------------------------------------------------------------------

// Roles considerados administrativos (alineados con AuthContext / constraint SQL).
const ADMIN_ROLES = ['admin', 'super_admin', 'department_admin', 'city_admin'];

// Mapa de etiquetas legibles por rol.
const ROLE_LABELS = {
  super_admin: '🛡️ Super admin',
  admin: '🛡️ Admin',
  department_admin: '🛡️ Admin departamento',
  city_admin: '🛡️ Admin ciudad',
  user: 'Usuario',
};

export default function RolePill({ role }) {
  const isAdmin = ADMIN_ROLES.includes(role);

  // Etiqueta: usa el mapa; si el rol es desconocido o nulo, cae a "Usuario".
  const label = ROLE_LABELS[role] || 'Usuario';

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.6,
        color: isAdmin ? '#1f3a8a' : '#374151',
        background: isAdmin ? '#e0e7ff' : '#f3f4f6',
        border: `1px solid ${isAdmin ? '#c7d2fe' : '#e5e7eb'}`,
      }}
    >
      {label}
    </span>
  );
}
