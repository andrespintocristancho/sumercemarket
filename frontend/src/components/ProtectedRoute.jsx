// ProtectedRoute.jsx
//
// Bloquea rutas privadas. Si se pasa `adminOnly`, exige role === 'admin'.
//
// Bug previo: cuando el usuario acababa de autenticarse, `loading` ya era
// false pero el `profile` (con el role) seguía cargando. El componente
// leía `profile?.role !== 'admin'` y redirigía a '/'. Ahora también
// esperamos a `profileLoading` cuando hay usuario, antes de decidir.

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, role, loading, profileLoading } = useAuth();
  const location = useLocation();

  // 1) Mientras no sepamos si hay sesión, no decidimos nada.
  if (loading) {
    return <div className="loading">Cargando…</div>;
  }

  // 2) Sin usuario => al login.
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // 3) Si la ruta exige admin y aún estamos cargando el perfil desde
  //    `profiles`, NO redirigir todavía: mostrar estado de carga.
  if (adminOnly && profileLoading) {
    return <div className="loading">Verificando permisos…</div>;
  }

  // 4) Ya tenemos perfil. Validar role.
  if (adminOnly && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
