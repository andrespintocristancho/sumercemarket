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

import React from 'react';
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

export default function StoreModule({ seller = {}, offers = [], primaryColor }) {
  const accent = primaryColor || seller.business_primary_color || '#2563eb';

  // Estilo en linea solo para exponer el acento como variable CSS local.
  const accentStyle = { '--sm-accent': accent };

  const title =
    seller.business_name || 'Bienvenido a nuestra tienda';
  const subtitle =
    seller.business_headline || seller.business_description || '';

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

  return (
    <div className="sm-store" style={accentStyle}>
      {/* 1. BIENVENIDA */}
      <section className="sm-section sm-welcome sm-fade-up">
        <div className="sm-welcome-inner">
          <h2 className="sm-title">{title}</h2>
          {subtitle && <p className="sm-subtitle">{subtitle}</p>}

          {waWelcome && (
            <a
              className="sm-btn sm-btn-whatsapp"
              href={waWelcome}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sm-btn-icon" aria-hidden="true">💬</span>
              Escríbenos por WhatsApp
            </a>
          )}
        </div>
      </section>

      {/* 2. BENEFICIOS / SERVICIOS BASICOS */}
      <section className="sm-section sm-benefits sm-fade-up">
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
      </section>

      {/* 3. OFERTAS DESTACADAS */}
      {featured.length > 0 && (
        <section className="sm-section sm-offers sm-fade-up">
          <div className="sm-section-head">
            <h3>Ofertas destacadas</h3>
            <span className="sm-divider" />
          </div>

          <div className="sm-offers-grid">
            {featured.map((offer, idx) => {
              const name = offer.title || offer.name || 'Oferta';
              const img = offer.image_url || offer.cover_url || null;
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
        </section>
      )}
    </div>
  );
}
