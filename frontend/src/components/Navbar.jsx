import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, profile, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      setOpen(false);
      navigate('/');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error al cerrar sesión:', err);
    }
  };

  const close = () => setOpen(false);

  return (
    <header style={styles.header}>
      <div style={styles.bar}>
        <Link to="/" style={styles.brand} onClick={close}>
          <span style={styles.brandIcon} aria-hidden>🛍️</span>
          <span>SumerceMarket</span>
        </Link>

        <button
          type="button"
          style={styles.toggle}
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          ☰
        </button>

        <nav style={{ ...styles.nav, ...(open ? styles.navOpen : null) }}>
          <NavLink to="/" end style={navStyle} onClick={close}>Inicio</NavLink>

          {loading ? null : user ? (
            <>
              <NavLink to="/publish" style={navStyle} onClick={close}>Publicar</NavLink>
              <NavLink to="/my-offers" style={navStyle} onClick={close}>Mis ofertas</NavLink>
              {isAdmin && (
                <NavLink to="/admin" style={navStyle} onClick={close}>Admin</NavLink>
              )}
              <span style={styles.userInfo} title={profile?.name || user.email}>
                Hola, {profile?.name?.split(' ')[0] || user.email}
              </span>
              <button type="button" onClick={handleLogout} className="btn btn-ghost">
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" style={navStyle} onClick={close}>Iniciar sesión</NavLink>
              <Link to="/register" className="btn" onClick={close}>Crear cuenta</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const navStyle = ({ isActive }) => ({
  padding: '8px 10px',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 14,
  color: isActive ? '#2563eb' : '#1a1f36',
  background: isActive ? 'rgba(37,99,235,0.08)' : 'transparent'
});

const styles = {
  header: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 50
  },
  bar: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 800,
    fontSize: 18,
    color: '#1a1f36',
    flex: 1
  },
  brandIcon: { fontSize: 22 },
  toggle: {
    display: 'inline-flex',
    border: '1px solid #d1d5db',
    background: '#fff',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 18
  },
  nav: {
    display: 'none',
    width: '100%',
    flexDirection: 'column',
    gap: 8,
    paddingTop: 8
  },
  navOpen: {
    display: 'flex'
  },
  userInfo: {
    fontSize: 13,
    color: '#6b7280',
    padding: '8px 4px'
  }
};

// Media query no se puede expresar en inline-styles; en desktop forzamos via CSS embebido:
if (typeof document !== 'undefined' && !document.getElementById('navbar-media')) {
  const style = document.createElement('style');
  style.id = 'navbar-media';
  style.textContent = `
    @media (min-width: 760px) {
      header [aria-label="Abrir menú"] { display: none !important; }
      header nav { display: flex !important; flex-direction: row !important; width: auto !important; align-items: center; gap: 8px !important; padding-top: 0 !important; }
    }
  `;
  document.head.appendChild(style);
}
