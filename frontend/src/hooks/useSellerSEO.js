import { useEffect, useRef } from 'react';

/**
 * useSellerSEO
 * -----------
 * Custom hook que inyecta SEO dinámico para la página web profesional
 * del vendedor (/seller/:slug).
 *
 * Inyecta:
 * - document.title
 * - meta description
 * - canonical
 * - OpenGraph (og:title, og:description, og:image, og:url, og:type, og:site_name)
 * - Twitter Card (twitter:card, twitter:title, twitter:description, twitter:image)
 *
 * Al desmontar restaura el título original y limpia meta tags inyectados.
 *
 * @param {Object|null} profile  - Fila de profiles con datos del negocio.
 * @param {string}      slug     - business_slug del vendedor.
 */

const SITE_NAME = 'SumerceMarket';
const BASE_URL = 'https://sumercemarket.com';

/* ── helpers ─────────────────────────────────────────── */

/** Crea o actualiza una etiqueta <meta> en <head>. */
function upsertMeta(attr, key, content) {
  if (!content) return null;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (el) {
    el.setAttribute('content', content);
  } else {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute('content', content);
    document.head.appendChild(el);
  }
  return el;
}

/** Crea o actualiza una etiqueta <link> en <head>. */
function upsertLink(rel, href) {
  if (!href) return null;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (el) {
    el.setAttribute('href', href);
  } else {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute('href', href);
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Construye una descripción elegante para meta tags.
 * Prioridad: headline > about > description > fallback.
 * Trunca a 160 caracteres sin cortar palabras.
 */
function buildDescription(profile) {
  const name = profile.business_name || '';
  const raw =
    profile.business_headline ||
    profile.business_about ||
    profile.business_description ||
    '';

  if (!raw) {
    return `${name} – Encuentra las mejores ofertas y productos en ${SITE_NAME}. Contacta directo por WhatsApp.`;
  }

  const prefix = raw.toLowerCase().includes(name.toLowerCase())
    ? ''
    : `${name} – `;

  const full = `${prefix}${raw}`;

  if (full.length <= 160) return full;
  const truncated = full.substring(0, 157);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 120 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/** Elige la mejor imagen para OG/Twitter. cover > logo > null. */
function pickImage(profile) {
  return profile.business_cover_url || profile.business_logo_url || null;
}

/* ── hook ────────────────────────────────────────────── */

export function useSellerSEO(profile, slug) {
  // Guardamos el título original UNA SOLA VEZ al montar el componente.
  // useRef garantiza que Strict Mode no lo sobrescriba.
  const originalTitleRef = useRef(document.title);
  const injectedRef = useRef([]);

  useEffect(() => {
    // ─── Guard: si no hay perfil o slug, no inyectar nada ───
    if (!profile || !profile.business_name || !slug) {
      return;
    }

    // ─── 1. document.title ───
    const title = `${profile.business_name} | ${SITE_NAME}`;
    document.title = title;

    // ─── 2. Descripción ───
    const description = buildDescription(profile);

    // ─── 3. Imagen ───
    const image = pickImage(profile);

    // ─── 4. URL canónica ───
    const canonicalUrl = `${BASE_URL}/seller/${slug}`;

    // ─── 5. Inyectar etiquetas ───
    const injected = [];

    // Meta description
    const metaDesc = upsertMeta('name', 'description', description);
    if (metaDesc) injected.push(metaDesc);

    // Canonical
    const linkCanonical = upsertLink('canonical', canonicalUrl);
    if (linkCanonical) injected.push(linkCanonical);

    // OpenGraph
    const ogEntries = [
      ['property', 'og:type', 'website'],
      ['property', 'og:site_name', SITE_NAME],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:url', canonicalUrl],
    ];
    if (image) {
      ogEntries.push(['property', 'og:image', image]);
      ogEntries.push(['property', 'og:image:width', '1200']);
      ogEntries.push(['property', 'og:image:height', '630']);
    }
    ogEntries.forEach(([attr, key, content]) => {
      const el = upsertMeta(attr, key, content);
      if (el) injected.push(el);
    });

    // Twitter Card
    const twEntries = [
      ['name', 'twitter:card', image ? 'summary_large_image' : 'summary'],
      ['name', 'twitter:title', title],
      ['name', 'twitter:description', description],
    ];
    if (image) {
      twEntries.push(['name', 'twitter:image', image]);
    }
    twEntries.forEach(([attr, key, content]) => {
      const el = upsertMeta(attr, key, content);
      if (el) injected.push(el);
    });

    // Guardar referencia para cleanup
    injectedRef.current = injected;

    // ─── Cleanup al desmontar o cuando cambien deps ───
    return () => {
      document.title = originalTitleRef.current;
      injectedRef.current.forEach((el) => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
      injectedRef.current = [];
    };
  }, [profile, slug]);
}
