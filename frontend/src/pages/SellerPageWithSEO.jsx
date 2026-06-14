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
 * Flujo:
 * 1. Extrae slug de la URL.
 * 2. Consulta profiles por business_slug para obtener datos mínimos de SEO.
 * 3. Pasa el perfil al hook useSellerSEO que inyecta meta tags.
 * 4. Renderiza SellerPage original sin cambios.
 */
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
            'business_name, business_slug, business_headline, business_about, business_description, business_cover_url, business_logo_url'
          )
          .eq('business_slug', slug)
          .maybeSingle();

        if (error) {
          console.error('[SellerPageWithSEO] Error fetching profile for SEO:', error.message);
          return;
        }

        if (!cancelled && data && data.business_name) {
          setSeoProfile(data);
        }
      } catch (err) {
        console.error('[SellerPageWithSEO] Unexpected error:', err);
      }
    };

    fetchSeoProfile();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Inyectar SEO tags (el hook internamente ignora si profile es null)
  useSellerSEO(seoProfile, slug);

  // Renderizar el SellerPage original sin cambios
  return <SellerPageOriginal />;
}
