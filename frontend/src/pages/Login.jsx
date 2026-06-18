import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = mapError(err?.message || '');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div className="card" style={styles.card}>
        <h1 style={styles.title}>Iniciar sesión</h1>
        <p style={styles.subtitle}>Bienvenido de vuelta a SumerceCompra.</p>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <label style={styles.label}>
            Correo electrónico
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="tu@correo.com"
              required
            />
          </label>

          <label style={styles.label}>
            Contraseña
            <div style={styles.pwdWrap}>
              <input
                type={showPwd ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                required
              />
              <button
                type="button"
                className="btn btn-ghost"
                style={styles.pwdToggle}
                onClick={() => setShowPwd(s => !s)}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          {error && <div className="error-msg" role="alert">{error}</div>}

          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div style={styles.footer}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={styles.link}>Crear cuenta</Link>
        </div>
      </div>
    </div>
  );
}

function mapError(msg) {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (m.includes('email not confirmed')) {
    return 'Debes confirmar tu correo antes de iniciar sesión.';
  }
  if (m.includes('network')) {
    return 'Error de conexión. Verifica tu internet.';
  }
  return msg || 'No fue posible iniciar sesión.';
}

const styles = {
  wrap: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px 8px'
  },
  card: {
    width: '100%',
    maxWidth: 420
  },
  title: { margin: '0 0 4px 0', fontSize: 24 },
  subtitle: { margin: '0 0 16px 0', color: '#6b7280', fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#374151'
  },
  pwdWrap: { display: 'flex', gap: 8 },
  pwdToggle: { padding: '0 12px' },
  footer: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280'
  },
  link: { color: '#2563eb', fontWeight: 600 }
};
