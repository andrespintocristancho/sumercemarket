import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-flag" aria-hidden="true">
            <span className="flag-y"></span>
            <span className="flag-b"></span>
            <span className="flag-r"></span>
          </span>
          <span className="brand-name">SumerceMarket</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
        >
          ☰
        </button>

        <nav className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>Inicio</NavLink>
          {user && (
            <>
              <NavLink to="/create" onClick={() => setMenuOpen(false)}>Publicar</NavLink>
              <NavLink to="/my-offers" onClick={() => setMenuOpen(false)}>Mis ofertas</NavLink>
            </>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" onClick={() => setMenuOpen(false)}>Admin</NavLink>
          )}

          {!user ? (
            <>
              <NavLink to="/login" className="btn btn-outline btn-sm" onClick={() => setMenuOpen(false)}>
                Iniciar sesión
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
                Registrarse
              </NavLink>
            </>
          ) : (
            <div className="navbar-user">
              <span className="user-greeting">Hola, <strong>{user.name.split(' ')[0]}</strong></span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Salir</button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
