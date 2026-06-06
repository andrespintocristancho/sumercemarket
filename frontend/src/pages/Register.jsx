import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    city: ''
  });
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.department) {
      api.getCities(form.department).then(setCities).catch(() => setCities([]));
    } else { setCities([]); }
  }, [form.department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: value,
      ...(name === 'department' ? { city: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register({
        ...form,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.replace(/\D/g, '')
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '2rem auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.3rem', color: 'var(--azul)' }}>
          ¡Únete a SumerceMarket! 🇨🇴
        </h1>
        <p className="text-muted text-center mb-2">Crea tu cuenta gratis y empieza a vender.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input
              type="text" name="name" required minLength={2}
              value={form.name} onChange={handleChange}
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email" name="email" required
              value={form.email} onChange={handleChange}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password" name="password" required minLength={6}
              value={form.password} onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="form-group">
            <label>WhatsApp (con indicativo si aplica)</label>
            <input
              type="tel" name="phone" required
              value={form.phone} onChange={handleChange}
              placeholder="Ej: 3001234567"
            />
            <small className="text-muted">Los compradores te contactarán por aquí.</small>
          </div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label>Departamento</label>
              <select name="department" required value={form.department} onChange={handleChange}>
                <option value="">Selecciona...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Ciudad</label>
              <select name="city" required value={form.city} onChange={handleChange} disabled={!form.department}>
                <option value="">Selecciona...</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Registrarme gratis'}
          </button>
        </form>

        <p className="text-center mt-3">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
