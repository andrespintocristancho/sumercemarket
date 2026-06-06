import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CATEGORIES } from '../utils/categories.js';

export default function CreateOffer() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    department: user?.department || '',
    city: user?.city || ''
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
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

  const handleFiles = (e) => {
    const files = Array.from(e.target.files).slice(0, 6);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('price', form.price);
      fd.append('category', form.category);
      fd.append('department', form.department);
      fd.append('city', form.city);
      images.forEach((file) => fd.append('images', file));

      const offer = await api.createOffer(fd);
      navigate(`/offer/${offer.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '1rem auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ color: 'var(--azul)', marginBottom: '0.3rem' }}>📢 Publicar oferta</h1>
        <p className="text-muted mb-2">Gratis, sin comisiones. Vende fácil en tu ciudad.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título *</label>
            <input
              type="text" name="title" required maxLength={120}
              value={form.title} onChange={handleChange}
              placeholder="Ej: Tenis Nike Air talla 42"
            />
          </div>

          <div className="form-group">
            <label>Categoría *</label>
            <select name="category" required value={form.category} onChange={handleChange}>
              <option value="">Selecciona...</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Precio (COP) *</label>
            <input
              type="number" name="price" required min="0" step="1"
              value={form.price} onChange={handleChange}
              placeholder="Ej: 80000"
            />
          </div>

          <div className="form-row cols-2">
            <div className="form-group">
              <label>Departamento *</label>
              <select name="department" required value={form.department} onChange={handleChange}>
                <option value="">Selecciona...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Ciudad *</label>
              <select name="city" required value={form.city} onChange={handleChange} disabled={!form.department}>
                <option value="">Selecciona...</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descripción *</label>
            <textarea
              name="description" required minLength={10} maxLength={2000} rows={5}
              value={form.description} onChange={handleChange}
              placeholder="Detalla el estado, características, motivo de venta, condiciones..."
            />
          </div>

          <div className="form-group">
            <label>Fotos (hasta 6, opcional)</label>
            <input
              type="file" accept="image/*" multiple
              onChange={handleFiles}
            />
            {previews.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {previews.map((src, i) => (
                  <img key={i} src={src} alt="preview"
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ fontSize: '1.05rem', padding: '0.9rem' }}
          >
            {loading ? 'Publicando...' : '🚀 Publicar gratis'}
          </button>
        </form>
      </div>
    </div>
  );
}
