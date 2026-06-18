import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  DEPARTMENTS,
  citiesOf,
  isValidColombianPhone
} from '../data/colombia.js';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    city: '',
    password: '',
    confirm: ''
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cities = useMemo(() => citiesOf(form.department), [form.department]);

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'department') next.city = '';
      return next;
    });
  };

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      return 'Ingresa tu nombre completo.';
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return 'Ingresa un correo válido.';
    }
    if (!isValidColombianPhone(form.phone)) {
      return 'El WhatsApp debe tener 10 dígitos y empezar por 3.';
    }
    if (!form.department) return 'Selecciona tu departamento.';
    if (!form.city) return 'Selecciona tu ciudad.';
    if (form.password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (form.password !== form.confirm) {
      return 'Las contraseñas no coinciden.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUp({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        department: form.department,
        city: form.city
      });

      // Si Supabase exige confirmación de email, session será null
      if (!result?.session) {
        setInfo('Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.');
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(mapError(err?.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div className="card" style={styles.card}>
        <h1 style={styles.title}>Crear cuenta</h1>
        <p style={styles.subtitle}>Únete a SumerceCompra y empieza a publicar tus ofertas.</p>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <label style={styles.label}>
            Nombre completo
            <input
              className="input"
              value={form.name}
              onChange={update('name')}
              autoComplete="name"
              placeholder="Ej: Andrés Pinto"
              required
            />
          </label>

          <label style={styles.label}>
            Correo electrónico
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
              placeholder="tu@correo.com"
              required
            />
          </label>

          <label style={styles.label}>
            WhatsApp (10 dígitos, empieza con 3)
            <input
              type="tel"
              className="input"
              value={form.phone}
              onChange={update('phone')}
              inputMode="numeric"
              maxLength={10}
              placeholder="3001234567"
              autoComplete="tel"
              required
            />
          </label>

          <div style={styles.row}>
            <label style={{ ...styles.label, flex: 1 }}>
              Departamento
              <select
                className="select"
                value={form.department}
                onChange={update('department')}
                required
              >
                <option value="">Selecciona…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>

            <label style={{ ...styles.label, flex: 1 }}>
              Ciudad
              <select
                className="select"
                value={form.city}
                onChange={update('city')}
                disabled={!form.department}
                required
              >
                <option value="">
                  {form.department ? 'Selecciona…' : 'Elige depto. primero'}
                </option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <label style={styles.label}>
            Contraseña (mínimo 8 caracteres)
            <div style={styles.pwdWrap}>
              <input
                type={showPwd ? 'text' : 'password'}
                className="input"
                value={form.password}
                onChange={update('password')}
                autoComplete="new-password"
                minLength={8}
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

          <label style={styles.label}>
            Confirmar contraseña
            <input
              type={showPwd ? 'text' : 'password'}
              className="input"
              value={form.confirm}
              onChange={update('confirm')}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          {error && <div className="error-msg" role="alert">{error}</div>}
          {info && <div className="success-msg" role="status">{info}</div>}

          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <div style={styles.footer}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={styles.link}>Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}

function mapError(msg) {
  const m = msg.toLowerCase();
  if (m.includes('already registered') || m.includes('user already')) {
    return 'Este correo ya está registrado.';
  }
  if (m.includes('password')) {
    return 'La contraseña no cumple los requisitos.';
  }
  if (m.includes('email')) {
    return 'El correo no es válido.';
  }
  return msg || 'No fue posible crear la cuenta.';
}

const styles = {
  wrap: { display: 'flex', justifyContent: 'center', padding: '24px 8px' },
  card: { width: '100%', maxWidth: 520 },
  title: { margin: '0 0 4px 0', fontSize: 24 },
  subtitle: { margin: '0 0 16px 0', color: '#6b7280', fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' },
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
