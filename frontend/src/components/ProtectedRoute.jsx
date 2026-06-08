// ProtectedRoute.jsx
//
// Bloquea rutas privadas. Si se pasa `adminOnly`, exige isAdmin === true.
//
// Reglas:
// - Mientras `loading` o `profileLoading` sean true => NO redirige.
// - Sin `user` => redirige a /login.
// - `adminOnly` + `isAdmin === true`  => permite acceso.
// - `adminOnly` + `isAdmin === false` => redirige a /.

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const IS_DEV =
  (typeof import.meta !== 'undefined' && import.meta?.env?.DEV) === true;

export default function ProtectedRoute({ children, adminOnly = false }) {
  const {
    user,
    profile,
    role,
    isAdmin,
    loading,
    profileLoading
  } = useAuth();
  const location = useLocation();

  if (IS_DEV) {
    // eslint-disable-next-line no-console
    console.log('AUTH DEBUG', {
      userId: user?.id,
      profile,
      role,
      isAdmin
    });
  }

  // 1) Mientras se resuelve sesión o perfil, no decidir.
  if (loading || profileLoading) {
    return <div className="loading">Cargando…</div>;
  }

  // 2) Sin usuario => login
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // 3) Ruta admin: permitir solo si isAdmin
  if (adminOnly) {
    if (isAdmin) {
      return children;
    }
    return <Navigate to="/" replace />;
  }

  // 4) Ruta privada normal
  return children;
}
