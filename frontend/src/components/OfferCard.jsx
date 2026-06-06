// OfferCard.jsx
// Tarjeta reutilizable para mostrar una oferta. Acepta acciones opcionales
// (editar/eliminar/cambiar estado) cuando el dueño la visualiza desde MyOffers.

import { buildWhatsAppLink, formatPhone } from '../data/colombia.js';

export default function OfferCard({
  offer,
  showOwnerActions = false,
  onEdit,
  onDelete,
  onChangeStatus
}) {
  if (!offer) return null;

  const mainImage = pickMainImage(offer);
  const phone = offer.contact_phone || '';
  const waMessage = `Hola, vi tu oferta "${offer.title}" en SumerceMarket. ¿Sigue disponible?`;
  const waLink = phone && offer.status === 'active'
    ? buildWhatsAppLink(phone, waMessage)
    : null;

  const status = offer.status || 'active';

  return (
    <article className="card" style={styles.card}>
      <div style={styles.imgWrap}>
        {mainImage ? (
          <img src={mainImage} alt={offer.title} style={styles.img} loading="lazy" />
        ) : (
          <div style={styles.imgPlaceholder} aria-hidden>🛒</div>
        )}
        <StatusBadge status={status} />
      </div>

      <div style={styles.body}>
        <h3 style={styles.title} title={offer.title}>{offer.title}</h3>
        <div style={styles.price}>{formatPrice(offer.price)}</div>

        <div style={styles.meta}>
          {offer.category && <span style={styles.tag}>{offer.category}</span>}
          <span style={styles.location}>
            📍 {offer.city}{offer.department ? `, ${offer.department}` : ''}
          </span>
        </div>

        <div style={styles.actions}>
          {waLink ? (
            <a
              className="btn"
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.waBtn}
            >
              💬 WhatsApp
            </a>
          ) : phone ? (
            <span style={styles.phoneText}>{formatPhone(phone)}</span>
          ) : (
            <span style={styles.muted}>Sin contacto</span>
          )}
        </div>

        {showOwnerActions && (
          <div style={styles.ownerActions}>
            <select
              className="select"
              value={status}
              onChange={(e) => onChangeStatus?.(offer, e.target.value)}
              aria-label="Estado de la oferta"
              style={styles.statusSelect}
            >
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
              <option value="sold">Vendida</option>
            </select>
            <div style={styles.ownerBtns}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => onEdit?.(offer)}
              >
                ✏️ Editar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onDelete?.(offer)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: { label: 'Activa', bg: '#16a34a' },
    paused: { label: 'Pausada', bg: '#f59e0b' },
    sold: { label: 'Vendida', bg: '#6b7280' }
  };
  const cfg = map[status] || map.active;
  if (status === 'active') return null; // No saturar cuando es lo normal
  return (
    <span style={{ ...styles.statusBadge, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function pickMainImage(offer) {
  // 1) Si trae array de offer_images, toma la primera por position
  if (Array.isArray(offer.offer_images) && offer.offer_images.length > 0) {
    const sorted = [...offer.offer_images].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );
    return sorted[0]?.url || null;
  }
  // 2) Fallback al campo legacy image_url usado en el Home del Bloque 2
  if (offer.image_url) return offer.image_url;
  return null;
}

function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(n);
}

const styles = {
  card: {
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  imgWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    background: '#f3f4f6',
    overflow: 'hidden'
  },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48,
    color: '#9ca3af'
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: 999
  },
  body: {
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1
  },
  title: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  },
  price: { fontSize: 18, fontWeight: 800, color: '#16a34a' },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#6b7280'
  },
  tag: {
    background: 'rgba(37,99,235,0.08)',
    color: '#2563eb',
    fontWeight: 700,
    fontSize: 12,
    padding: '2px 8px',
    borderRadius: 999
  },
  location: { fontSize: 13, color: '#6b7280' },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8
  },
  waBtn: { background: '#25D366', borderColor: '#25D366' },
  phoneText: { fontSize: 12, color: '#6b7280' },
  muted: { fontSize: 13, color: '#9ca3af' },
  ownerActions: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  statusSelect: { width: '100%' },
  ownerBtns: { display: 'flex', gap: 8 }
};
