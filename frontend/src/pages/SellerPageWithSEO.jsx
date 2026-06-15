import { useParams } from 'react-router-dom';
import SellerPageOriginal from './SellerPage.jsx';
import { useSellerSEO } from '../hooks/useSellerSEO';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * SellerPageWithSEO
 * -----------------
 * Wrapper ligero que agrega SEO dinámico (document.title, OpenGraph,
 * Twitter Card, canonical) a la página web profesional del vendedor
 * sin modificar SellerPage.jsx.
 *
 * Además inyecta un <style id="seller-card-text-style"> con el color
 * "cardText" (guardado dentro de business_primary_color JSON) aplicado
 * SOLO a títulos/textos dentro de cards/cajas. NO toca el hero, ni el
 * nombre del negocio, ni los botones.
 *
 * Flujo:
 * 1. Extrae slug de la URL.
 * 2. Consulta profiles por business_slug (SEO + business_primary_color).
 * 3. Pasa el perfil al hook useSellerSEO para meta tags.
 * 4. Parsea business_primary_color y aplica cardText vía <style>.
 * 5. Renderiza SellerPage original sin cambios.
 */

/* Selectores compartidos con BusinessProfileSafe.jsx */
const CARD_TEXT_SELECTORS = [
  '.sp-card h1', '.sp-card h2', '.sp-card h3', '.sp-card h4',
  '.sp-card-service h1', '.sp-card-service h2', '.sp-card-service h3',
  '.sp-card-offer h1', '.sp-card-offer h2', '.sp-card-offer h3',
  '.sp-offer-title',
  '.sp-card-title',
  '.sp-service-title',
  '.sp-about-card h1', '.sp-about-card h2', '.sp-about-card h3',
  '.sp-hours-card h1', '.sp-hours-card h2', '.sp-hours-card h3',
  '.sp-location-card h1', '.sp-location-card h2', '.sp-location-card h3',
  '.sp-card p', '.sp-card-service p', '.sp-card-offer p',
  '.sp-about-card p', '.sp-hours-card p', '.sp-location-card p',
];

function buildCardTextCSS(color) {
  if (!color) return '';
  const safe = String(color).trim();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(safe)) return '';
  return `${CARD_TEXT_SELECTORS.join(', ')} { color: ${safe} !important; }`;
}

function applySellerCardTextStyle(color) {
  const css = buildCardTextCSS(color);
  let styleEl = document.getElementById('seller-card-text-style');
  if (!css) {
    if (styleEl) styleEl.remove();
    return;
  }
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'seller-card-text-style';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}

function extractCardText(business_primary_color) {
  if (!business_primary_color) return null;
  try {
    const obj =
      typeof business_primary_color === 'string'
        ? JSON.parse(business_primary_color)
        : business_primary_color;
    if (obj && typeof obj === 'object' && obj.cardText) {
      return obj.cardText;
    }
  } catch {
    // business_primary_color puede ser un hex simple, sin cardText
    return null;
  }
  return null;
}

export default function SellerPageWithSEO() {
  const { slug } = useParams();
  const [seoProfile, setSeoProfile] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const fetchSeoProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            'business_name, business_slug, business_headline, business_about, business_description, business_cover_url, business_logo_url, business_primary_color'
          )
          .eq('business_slug', slug)
          .maybeSingle();

        if (error) {
          console.error('[SellerPageWithSEO] Error fetching profile for SEO:', error.message);
          return;
        }

        if (!cancelled && data && data.business_name) {
          setSeoProfile(data);

          // Aplicar cardText si está definido en business_primary_color
          const cardText = extractCardText(data.business_primary_color);
          if (cardText) {
            // Intentar varias veces porque SellerPage puede tardar en montar las cards
            applySellerCardTextStyle(cardText);
            setTimeout(() => applySellerCardTextStyle(cardText), 500);
            setTimeout(() => applySellerCardTextStyle(cardText), 1500);
            setTimeout(() => applySellerCardTextStyle(cardText), 3000);
          }
        }
      } catch (err) {
        console.error('[SellerPageWithSEO] Unexpected error:', err);
      }
    };

    fetchSeoProfile();

    return () => {
      cancelled = true;
      // Limpiar el style inyectado al desmontar para no afectar otras páginas
      const styleEl = document.getElementById('seller-card-text-style');
      if (styleEl) styleEl.remove();
    };
  }, [slug]);

  // Inyectar SEO tags (el hook internamente ignora si profile es null)
  useSellerSEO(seoProfile, slug);

  // Renderizar el SellerPage original sin cambios
  return <SellerPageOriginal />;
}
