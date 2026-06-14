/**
 * StoreModule.jsx
 * -------------------------------------------------------------
 * Modulo "tienda" (plantilla por defecto) para la pagina
 * publica del vendedor. Muestra contenido REAL del negocio:
 *   - Bienvenida profesional.
 *   - Beneficios / servicios basicos.
 *   - Ofertas destacadas (offers.slice(0,3)) con enlace a /offers/:id.
 *   - Boton WhatsApp usando seller.business_whatsapp.
 *
 * Reglas respetadas:
 *   - No realiza queries ni toca Supabase.
 *   - No usa datos genericos falsos: si un dato no existe, no se muestra.
 *   - No pide links de fotos al vendedor: usa las URLs ya guardadas
 *     (image_url / cover_url) que provienen de Supabase Storage.
 *
 * Props:
 *   - seller: objeto del perfil (equivale a "profile").
 *   - offers: array de ofertas.
 *   - primaryColor: color de acento (business_primary_color).
 * -------------------------------------------------------------
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

// Construye el enlace de WhatsApp a partir del numero del negocio.
function buildWaLink(whatsapp, text) {
  if (!whatsapp) return null;
  const phone = String(whatsapp).replace(/[^\d]/g, '');
  if (!phone) return null;
  const msg = encodeURIComponent(text || 'Hola, vengo desde tu tienda online.');
  return `https://wa.me/${phone}?text=${msg}`;
}

// Formatea un precio de forma simple (sin asumir moneda externa).
function formatPrice(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString('es-CO');
}

const getTemplateLayout = (templateId) => {
  if (['motos', 'cars', 'vehicles'].includes(templateId)) return 'automotive';
  if (['beauty', 'fashion', 'clothing'].includes(templateId)) return 'elegant';
  if (['services', 'health', 'gym', 'veterinary'].includes(templateId)) return 'services';
  return 'retail';
};

const pickOfferImage = (offer) => {
  if (Array.isArray(offer.offer_images) && offer.offer_images.length > 0) {
    const sorted = [...offer.offer_images].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );
    return sorted[0]?.url || offer.image_url || offer.cover_url || null;
  }
  return offer.image_url || offer.cover_url || null;
};

export default function StoreModule({ seller = {}, offers = [], primaryColor }) {
  const stylesConfig = useMemo(() => {
    let cfg = {
      primary: '#2563eb',
      bg: '#ffffff',
      text: '#0f172a',
      btnBg: '#25d366',
      btnText: '#ffffff',
      font: 'Plus Jakarta Sans'
    };

    if (seller.business_primary_color) {
      try {
        const parsed = JSON.parse(seller.business_primary_color);
        if (parsed && typeof parsed === 'object') {
          cfg = { ...cfg, ...parsed };
        }
      } catch {
        cfg.primary = seller.business_primary_color;
      }
    }

    if (primaryColor) {
      try {
        const parsed = JSON.parse(primaryColor);
        if (parsed && typeof parsed === 'object') {
          cfg = { ...cfg, ...parsed };
        }
      } catch {
        cfg.primary = primaryColor;
      }
    }

    return cfg;
  }, [primaryColor, seller.business_primary_color]);

  // Detect dark background
  const isDarkBg = (() => {
    const hex = (stylesConfig.bg || '').replace('#', '').toLowerCase();
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (r + g + b) / 3 < 128;
    }
    return false;
  })();

  const accentStyle = {
    '--sm-accent': stylesConfig.primary,
    '--sm-bg-1': stylesConfig.bg,
    '--sm-bg-2': stylesConfig.bg === '#ffffff' || stylesConfig.bg === '#fff' ? '#f6f8fc' : `color-mix(in srgb, ${stylesConfig.primary} 4%, ${stylesConfig.bg})`,
    '--sm-text': stylesConfig.text,
    '--sm-text-soft': `color-mix(in srgb, ${stylesConfig.text} 70%, ${stylesConfig.bg})`,
    '--sm-accent-soft': `color-mix(in srgb, ${stylesConfig.primary} 12%, ${stylesConfig.bg})`,
    '--sm-glass': isDarkBg ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.70)',
    '--sm-surface-card': isDarkBg ? 'rgba(255,255,255,0.06)' : '#ffffff',
    '--sm-border': isDarkBg ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    '--sm-on-surface': stylesConfig.text,
    '--sm-on-surface-variant': `color-mix(in srgb, ${stylesConfig.text} 65%, ${stylesConfig.bg})`,
    '--sm-midnight': isDarkBg ? stylesConfig.text : '#0f172a',
    fontFamily: `'${stylesConfig.font}', 'Plus Jakarta Sans', sans-serif`
  };

  const title = seller.business_name || 'Bienvenido a nuestra tienda';
  const subtitle = seller.business_headline || seller.business_description || '';

  // Ofertas destacadas: solo las primeras 3 reales.
  const featured = Array.isArray(offers) ? offers.slice(0, 3) : [];

  const location = [
    seller.business_address,
    seller.business_city,
    seller.business_department,
  ]
    .filter(Boolean)
    .join(', ');

  const waWelcome = buildWaLink(
    seller.business_whatsapp,
    `Hola ${seller.business_name || ''}, vengo desde tu tienda online.`
  );

  const layout = getTemplateLayout(seller.business_template);

  // ─── Block: Welcome ───────────────────────────────────────
  const blockWelcome = (
    <section key="welcome" className="sm-section sm-welcome sm-fade-up">
      <div className="sm-section-inner sm-welcome-inner">
        <h2 className="sm-title">{title}</h2>
        {subtitle && <p className="sm-subtitle">{subtitle}</p>}

        {waWelcome && (
          <a
            className="sm-btn sm-btn-whatsapp"
            href={waWelcome}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: stylesConfig.btnBg, color: stylesConfig.btnText }}
          >
            <span className="sm-btn-icon" aria-hidden="true">💬</span>
            Escríbenos por WhatsApp
          </a>
        )}
      </div>
    </section>
  );

  // ─── Block: Benefits ──────────────────────────────────────
  const blockBenefits = (
    <section key="benefits" className="sm-section sm-benefits sm-fade-up">
      <div className="sm-section-inner">
        <div className="sm-section-head">
          <h3>¿Por qué elegirnos?</h3>
          <span className="sm-divider" />
        </div>
        <div className="sm-benefits-grid">
          <article className="sm-benefit-card">
            <span className="sm-benefit-icon" aria-hidden="true">⚡</span>
            <h4>Atención rápida</h4>
            <p>Te respondemos directamente por WhatsApp, sin intermediarios.</p>
          </article>
          <article className="sm-benefit-card">
            <span className="sm-benefit-icon" aria-hidden="true">✅</span>
            <h4>Calidad garantizada</h4>
            <p>Productos y servicios cuidados y descritos con transparencia.</p>
          </article>
          <article className="sm-benefit-card">
            <span className="sm-benefit-icon" aria-hidden="true">📍</span>
            <h4>{location ? 'Cerca de ti' : 'Siempre disponibles'}</h4>
            <p>{location ? location : 'Te atendemos de forma online y personalizada.'}</p>
          </article>
        </div>
      </div>
    </section>
  );

  // ─── Block: Offers ────────────────────────────────────────
  const blockOffers = featured.length > 0 ? (
    <section key="offers" className="sm-section sm-offers sm-fade-up">
      <div className="sm-section-inner">
        <div className="sm-section-head">
          <h3>Ofertas destacadas</h3>
          <span className="sm-divider" />
        </div>

        <div className="sm-offers-grid">
          {featured.map((offer, idx) => {
            const name = offer.title || offer.name || 'Oferta';
            const img = pickOfferImage(offer);
            const price = formatPrice(offer.price);
            const oldPrice = formatPrice(offer.old_price ?? offer.original_price);
            const waOffer = buildWaLink(
              seller.business_whatsapp,
              `Hola, me interesa: ${name}`
            );

            return (
              <article
                className="sm-offer-card"
                key={offer.id != null ? offer.id : idx}
              >
                <div className="sm-offer-media">
                  {img ? (
                    <img src={img} alt={name} loading="lazy" />
                  ) : (
                    <div className="sm-offer-placeholder" aria-hidden="true">🛍️</div>
                  )}
                </div>

                <div className="sm-offer-body">
                  <h4 className="sm-offer-title">{name}</h4>
                  {offer.description && (
                    <p className="sm-offer-desc">{offer.description}</p>
                  )}

                  {price && (
                    <div className="sm-offer-prices">
                      <span className="sm-offer-price">${price}</span>
                      {oldPrice && (
                        <span className="sm-offer-oldprice">${oldPrice}</span>
                      )}
                    </div>
                  )}

                  <div className="sm-offer-actions">
                    {offer.id != null && (
                      <Link
                        className="sm-btn sm-btn-outline"
                        to={`/offers/${offer.id}`}
                      >
                        Ver detalle
                      </Link>
                    )}
                    {waOffer && (
                      <a
                        className="sm-btn sm-btn-whatsapp sm-btn-sm"
                        href={waOffer}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: stylesConfig.btnBg, color: stylesConfig.btnText }}
                      >
                        <span className="sm-btn-icon" aria-hidden="true">💬</span>
                        Lo quiero
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  ) : null;

  // ─── Layout Orders ────────────────────────────────────────
  // automotive (motos, cars, vehicles):  Offers → Benefits → Welcome
  // elegant   (beauty, fashion, clothing): Welcome → Benefits → Offers
  // services  (services, health, gym, vet): Benefits → Welcome → Offers
  // retail    (default):                    Offers → Benefits → Welcome
  const LAYOUT_ORDERS = {
    automotive: [blockOffers, blockBenefits, blockWelcome],
    elegant:    [blockWelcome, blockBenefits, blockOffers],
    services:   [blockBenefits, blockWelcome, blockOffers],
    retail:     [blockOffers, blockBenefits, blockWelcome],
  };

  const orderedBlocks = LAYOUT_ORDERS[layout] || LAYOUT_ORDERS.retail;

  return (
    <div className={`sm-store sm-store-layout-${layout}`} style={accentStyle}>
      {orderedBlocks}
    </div>
  );
}
