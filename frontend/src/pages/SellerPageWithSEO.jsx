import { useParams } from 'react-router-dom';
import SellerPageOriginal from './SellerPage.jsx';
import { useSellerSEO } from '../hooks/useSellerSEO';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * SellerPageWithSEO
 * -----------------
 * Wrapper ligero que agrega SEO dinamico (document.title, OpenGraph,
 * Twitter Card, canonical) a la pagina publica del vendedor sin
 * modificar SellerPage.jsx.
 *
 * Carga el perfil minimo para inyectar meta tags y luego renderiza
 * el SellerPage original completo.
 */
export default function SellerPageWithSEO() {
  const { slug } = useParams();
  const [seoProfile, setSeoProfile] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const fetchSeoProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('business_name, business_slug, business_headline, business_about, business_description, business_cover_url, business_logo_url')
        .eq('business_slug', slug)
        .maybeSingle();

      if (!cancelled && data) {
        setSeoProfile(data);
      }
    };

    fetchSeoProfile();
    return () => { cancelled = true; };
  }, [slug]);

  // Inyectar SEO tags
  useSellerSEO(seoProfile, slug);

  // Renderizar el SellerPage original sin cambios
  return <SellerPageOriginal />;
}
