import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { formatCOP, getCategory, buildWhatsAppLink } from '../utils/categories.js';
import './OfferDetail.css';

export default function OfferDetail() {
  const { id } = useParams();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.getOffer(id)
      .then(setOffer)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleWhatsApp = async () => {
    if (!offer) return;
    try { await api.contactOffer(offer.id); } catch { /* opcional */ }
    const msg = `¡Hola ${offer.sellerName}! Te escribo desde SumerceMarket 🇨🇴.\n\nMe interesa tu publicación:\n• ${offer.title}\n• Precio: ${formatCOP(offer.price)}\n\n¿Sigue disponible?`;
    window.open(buildWhatsAppLink(offer.sellerPhone, msg), '_blank', 'noopener');
  };

  if (loading) return <div className="loading">Cargando oferta...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!offer) return <div className="empty-state"><h3>Oferta no encontrada</h3></div>;

  const cat = getCategory(offer.category);
  const hasImages = offer.images && offer.images.length > 0;

  return (
    <div className="offer-detail">
      <Link to="/" className="back-link">← Volver al inicio</Link>

      <div className="offer-detail-grid">
        {/* GALERÍA */}
        <div className="offer-gallery">
          <div className="gallery-main">
            {hasImages ? (
              <img src={offer.images[activeImage].url} alt={offer.title} />
            ) : (
              <div className="gallery-placeholder">
                <span>{cat.icon}</span>
              </div>
            )}
            {offer.status === 'sold' && <span className="offer-detail-sold">VENDIDO</span>}
          </div>
          {hasImages && offer.images.length > 1 && (
            <div className="gallery-thumbs">
              {offer.images.map((img, i) => (
                <button
                  key={i}
                  className={`thumb ${i === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Imagen ${i + 1}`}
                >
                  <img src={img.url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="offer-info">
          <span className="badge" style={{ background: 'var(--amarillo)', color: 'var(--azul-dark)' }}>
            {cat.icon} {cat.label}
          </span>
          <h1>{offer.title}</h1>
          <p className="offer-detail-price">{formatCOP(offer.price)}</p>
          <p className="offer-detail-location">
            📍 {offer.city}, {offer.department}
          </p>

          <div className="offer-detail-description">
            <h3>Descripción</h3>
            <p>{offer.description}</p>
          </div>

          <div className="offer-detail-seller">
            <h3>Vendedor</h3>
            <p><strong>{offer.sellerName}</strong></p>
            <p className="text-muted">Miembro de SumerceMarket</p>
          </div>

          {offer.status === 'active' ? (
            <button
              className="btn btn-wa btn-block"
              onClick={handleWhatsApp}
              style={{ fontSize: '1.1rem', padding: '1rem' }}
            >
              💬 Contactar por WhatsApp
            </button>
          ) : (
            <div className="alert alert-info">Esta oferta ya fue vendida.</div>
          )}

          <p className="text-muted text-center mt-2" style={{ fontSize: '0.8rem' }}>
            ⚠️ Acuerda el pago en persona. SumerceMarket no procesa transacciones.
          </p>
        </div>
      </div>
    </div>
  );
}
