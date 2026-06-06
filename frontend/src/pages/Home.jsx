import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { CATEGORIES } from '../utils/categories.js';
import OfferCard from '../components/OfferCard.jsx';
import './Home.css';

export default function Home() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    department: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    sort: 'price_asc'
  });

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    if (filters.department) {
      api.getCities(filters.department).then(setCities).catch(() => setCities([]));
    } else {
      setCities([]);
    }
  }, [filters.department]);

  useEffect(() => {
    setLoading(true);
    setError('');
    const sortMap = { price_asc: '', price_desc: 'price_desc', recent: 'recent' };
    const payload = { ...filters, sort: sortMap[filters.sort] };
    api.listOffers(payload)
      .then(setOffers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((f) => ({
      ...f,
      [name]: value,
      ...(name === 'department' ? { city: '' } : {})
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '', category: '', department: '', city: '',
      minPrice: '', maxPrice: '', sort: 'price_asc'
    });
  };

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            <span style={{ color: 'var(--amarillo)' }}>Su</span>
            <span style={{ color: 'white' }}>merce</span>
            <span style={{ color: '#fff' }}>Market</span>
            <span style={{ marginLeft: 8 }}>🇨🇴</span>
          </h1>
          <p>El marketplace gratuito para los colombianos. Vende y compra cerca de ti.</p>
          <div className="hero-search">
            <input
              type="text"
              name="search"
              placeholder="¿Qué estás buscando? Ej: zapatos, moto, almuerzo..."
              value={filters.search}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      {/* CATEGORÍAS RÁPIDAS */}
      <section className="categories-quick">
        <button
          className={`cat-chip ${!filters.category ? 'active' : ''}`}
          onClick={() => setFilters(f => ({ ...f, category: '' }))}
        >
          🛍️ Todas
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`cat-chip ${filters.category === cat.id ? 'active' : ''}`}
            onClick={() => setFilters(f => ({ ...f, category: cat.id }))}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </section>

      {/* FILTROS AVANZADOS */}
      <section className="filters">
        <div className="filters-grid">
          <select name="department" value={filters.department} onChange={handleChange}>
            <option value="">Todos los departamentos</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select name="city" value={filters.city} onChange={handleChange} disabled={!filters.department}>
            <option value="">Todas las ciudades</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="number"
            name="minPrice"
            placeholder="Precio mín (COP)"
            value={filters.minPrice}
            onChange={handleChange}
            min="0"
          />
          <input
            type="number"
            name="maxPrice"
            placeholder="Precio máx (COP)"
            value={filters.maxPrice}
            onChange={handleChange}
            min="0"
          />
          <select name="sort" value={filters.sort} onChange={handleChange}>
            <option value="price_asc">💰 Más baratos primero</option>
            <option value="price_desc">💎 Más caros primero</option>
            <option value="recent">🆕 Más recientes</option>
          </select>
          <button className="btn btn-outline" onClick={clearFilters}>Limpiar</button>
        </div>
      </section>

      {/* RESULTADOS */}
      <section className="results">
        <div className="results-header">
          <h2>{offers.length} {offers.length === 1 ? 'oferta' : 'ofertas'} disponibles</h2>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">Cargando ofertas...</div>
        ) : offers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No encontramos ofertas con esos filtros</h3>
            <p>Intenta ampliar tu búsqueda o limpiar los filtros.</p>
          </div>
        ) : (
          <div className="offers-grid">
            {offers.map(offer => <OfferCard key={offer.id} offer={offer} />)}
          </div>
        )}
      </section>
    </div>
  );
}
