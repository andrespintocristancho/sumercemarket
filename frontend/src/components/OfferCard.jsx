// OfferCard.jsx
// Tarjeta reutilizable para mostrar una oferta. Acepta acciones opcionales
// (editar/eliminar/cambiar estado) cuando el dueño la visualiza desde MyOffers.

import { Link } from 'react-router-dom';
import { buildWhatsAppLink, formatPhone } from '../data/colombia.js';
import { supabase } from '../lib/supabaseClient.js';

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
  const waMessage = `Hola, vi tu oferta "${offer.title}" en SumerceCompra. ¿Sigue disponible?`;
  const waLink = phone && offer.status === 'active'
    ? buildWhatsAppLink(phone, waMessage)
    : null;

  const status = offer.status || 'active';
  const detailHref = offer.id != null ? `/offers/${offer.id}` : null;

  async function handleWhatsAppClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!waLink) return;

    // Registrar evento en contact_events antes de abrir WhatsApp.
    // Si falla, no bloqueamos al usuario: igual abrimos el enlace.
    try {
      const { data: userData } = await supabase.auth.getUser();
      const contacterId = userData?.user?.id ?? null;
      await supabase.from('contact_events').insert({
        offer_id: offer.id,
        contacter_id: contacterId,
        channel: 'whatsapp'
      });
    } catch (err) {
      // Silenciar: no impedir el contacto si la métrica falla
      console.warn('No se pudo registrar contact_event:', err);
    }

    window.open(waLink, '_blank', 'noopener,noreferrer');
  }

  return (
    <article className="card" style={styles.card}>
      <div style={styles.imgWrap}>
        {detailHref ? (
          <Link to={detailHref} style={styles.imgLink} aria-label={`Ver detalle de ${offer.title}`}>
            {mainImage ? (
              <img src={mainImage} alt={offer.title} style={styles.img} loading="lazy" />
            ) : (
              <div style={styles.imgPlaceholder} aria-hidden>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
            )}
          </Link>
        ) : (
          mainImage ? (
            <img src={mainImage} alt={offer.title} style={styles.img} loading="lazy" />
          ) : (
            <div style={styles.imgPlaceholder} aria-hidden>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
          )
        )}
        <StatusBadge status={status} />
      </div>

      <div style={styles.body}>
        <h3 style={styles.title} title={offer.title}>
          {detailHref ? (
            <Link to={detailHref} style={styles.titleLink}>{offer.title}</Link>
          ) : (
            offer.title
          )}
        </h3>
        <div style={styles.price}>{formatPrice(offer.price)}</div>

        <div style={styles.meta}>
          {offer.category && <span style={styles.tag}>{offer.category}</span>}
          <span style={styles.location}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ verticalAlign: 'middle' }}>{offer.city}{offer.department ? `, ${offer.department}` : ''}</span>
          </span>
        </div>

        {offer.profiles?.business_name && (
          <div style={styles.shopMeta}>
            <span style={styles.shopLabel}>Tienda:</span>{' '}
            {offer.profiles.business_slug ? (
              <Link to={`/seller/${offer.profiles.business_slug}`} style={styles.shopLink}>
                {offer.profiles.business_name}
              </Link>
            ) : (
              <span style={{ fontWeight: 700 }}>{offer.profiles.business_name}</span>
            )}
          </div>
        )}

        <div style={styles.actions}>
          {detailHref && (
            <Link to={detailHref} className="btn btn-ghost" style={styles.detailBtn}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Ver detalle
            </Link>
          )}
          {waLink ? (
            <button
              type="button"
              className="btn"
              onClick={handleWhatsAppClick}
              style={styles.waBtn}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              WhatsApp
            </button>
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
                style={{ flex: 1 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onDelete?.(offer)}
                style={{ flex: 1 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Eliminar
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
  imgLink: {
    display: 'block',
    width: '100%',
    height: '100%',
    textDecoration: 'none'
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
  titleLink: { color: 'inherit', textDecoration: 'none' },
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
  shopMeta: {
    fontSize: 13,
    color: '#374151',
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  shopLabel: {
    color: '#6b7280',
    fontWeight: 500
  },
  shopLink: {
    color: '#2563eb',
    fontWeight: 700,
    textDecoration: 'none'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap'
  },
  detailBtn: { textDecoration: 'none' },
  waBtn: { background: '#25D366', borderColor: '#25D366', color: '#fff' },
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
