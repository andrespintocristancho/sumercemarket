import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { formatCOP, getCategory } from '../utils/categories.js';

export default function MyOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.myOffers()
      .then(setOffers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleSold = async (offer) => {
    const newStatus = offer.status === 'active' ? 'sold' : 'active';
    try {
      await api.updateOffer(offer.id, { status: newStatus });
      load();
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (offer) => {
    if (!confirm(`¿Eliminar definitivamente "${offer.title}"?`)) return;
    try {
      await api.deleteOffer(offer.id);
      load();
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div className="loading">Cargando tus ofertas...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ color: 'var(--azul)' }}>📦 Mis ofertas</h1>
        <Link to="/create" className="btn btn-primary">+ Nueva oferta</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {offers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>Aún no has publicado nada</h3>
          <p>¡Publica tu primera oferta gratis!</p>
          <Link to="/create" className="btn btn-primary mt-2">Publicar ahora</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {offers.map(offer => {
            const cat = getCategory(offer.category);
            const cover = offer.images?.[0]?.url;
            return (
              <div key={offer.id} className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f0f1f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                  {cover ? <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : cat.icon}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1rem' }}>{offer.title}</h3>
                    <span className={`badge ${offer.status === 'active' ? 'badge-active' : 'badge-sold'}`}>
                      {offer.status === 'active' ? 'Activa' : 'Vendida'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--azul)', fontWeight: 700 }}>{formatCOP(offer.price)}</p>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {cat.icon} {cat.label} · 📍 {offer.city}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <Link to={`/offer/${offer.id}`} className="btn btn-outline btn-sm">Ver</Link>
                  <button className="btn btn-secondary btn-sm" onClick={() => toggleSold(offer)}>
                    {offer.status === 'active' ? 'Marcar vendida' : 'Reactivar'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(offer)}>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
