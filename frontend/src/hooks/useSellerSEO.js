import { useEffect } from 'react';

/**
 * useSellerSEO
 * -----------
 * Custom hook que inyecta SEO dinamico para la pagina web profesional
 * del vendedor (/seller/:slug).
 *
 * - document.title
 * - meta description
 * - canonical
 * - OpenGraph (og:title, og:description, og:image, og:url, og:type, og:site_name)
 * - Twitter Card (twitter:card, twitter:title, twitter:description, twitter:image)
 *
 * Al desmontar el componente, restaura el titulo y limpia todas las
 * etiquetas meta/link inyectadas para no contaminar otras paginas.
 *
 * @param {Object|null} profile  - Fila de profiles con datos del negocio.
 * @param {string}      slug     - business_slug del vendedor.
 */

const SITE_NAME = 'SumerceMarket';
const BASE_URL = 'https://sumercemarket.com';

/**
 * Crea o actualiza una etiqueta <meta> en <head>.
 * Devuelve la referencia al elemento para limpieza posterior.
 */
function setMeta(attr, key, content) {
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

/**
 * Crea o actualiza una etiqueta <link> en <head>.
 * Devuelve la referencia al elemento para limpieza posterior.
 */
function setLink(rel, href) {
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
 * Construye una descripcion elegante a partir de los datos del negocio.
 * Prioridad: headline > about > description > fallback.
 * Trunca a 160 caracteres para SEO optimo.
 */
function buildDescription(profile) {
  const name = profile.business_name || '';
  const raw =
    profile.business_headline ||
    profile.business_about ||
    profile.business_description ||
    '';

  if (!raw) {
    return `${name} - Encuentra las mejores ofertas y productos en ${SITE_NAME}. Contacta directo por WhatsApp.`;
  }

  // Si la descripcion ya incluye el nombre, no lo duplicamos
  const prefix = raw.toLowerCase().includes(name.toLowerCase())
    ? ''
    : `${name} - `;

  const full = `${prefix}${raw}`;

  // Truncar a 160 caracteres sin cortar palabras
  if (full.length <= 160) return full;
  const truncated = full.substring(0, 157);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 120 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/**
 * Elige la mejor imagen para OpenGraph / Twitter Card.
 * Prioridad: cover > logo > null.
 */
function pickImage(profile) {
  return profile.business_cover_url || profile.business_logo_url || null;
}

export function useSellerSEO(profile, slug) {
  useEffect(() => {
    // Guardar titulo original para restaurar al desmontar
    const originalTitle = document.title;

    if (!profile || !slug) return;

    // --- 1. document.title ---
    const title = `${profile.business_name || slug} | ${SITE_NAME}`;
    document.title = title;

    // --- 2. Descripcion ---
    const description = buildDescription(profile);

    // --- 3. Imagen ---
    const image = pickImage(profile);

    // --- 4. URL canonica ---
    const canonicalUrl = `${BASE_URL}/seller/${slug}`;

    // --- Inyectar etiquetas ---
    const injected = [];

    // Meta description
    const metaDesc = setMeta('name', 'description', description);
    if (metaDesc) injected.push(metaDesc);

    // Canonical
    const linkCanonical = setLink('canonical', canonicalUrl);
    if (linkCanonical) injected.push(linkCanonical);

    // OpenGraph
    const ogTags = [
      ['property', 'og:type', 'website'],
      ['property', 'og:site_name', SITE_NAME],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:url', canonicalUrl],
    ];

    if (image) {
      ogTags.push(['property', 'og:image', image]);
      ogTags.push(['property', 'og:image:width', '1200']);
      ogTags.push(['property', 'og:image:height', '630']);
    }

    ogTags.forEach(([attr, key, content]) => {
      const el = setMeta(attr, key, content);
      if (el) injected.push(el);
    });

    // Twitter Card
    const twitterTags = [
      ['name', 'twitter:card', image ? 'summary_large_image' : 'summary'],
      ['name', 'twitter:title', title],
      ['name', 'twitter:description', description],
    ];

    if (image) {
      twitterTags.push(['name', 'twitter:image', image]);
    }

    twitterTags.forEach(([attr, key, content]) => {
      const el = setMeta(attr, key, content);
      if (el) injected.push(el);
    });

    // --- Cleanup al desmontar ---
    return () => {
      document.title = originalTitle;
      injected.forEach((el) => {
        // Solo removemos elementos que nosotros creamos (no pre-existentes)
        // Verificamos que sigan en el DOM
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    };
  }, [profile, slug]);
}
