/**
 * SellerPreviewPage.jsx
 * -------------------------------------------------------------
 * Pagina de PRUEBA para la base modular creada en FASE 1.
 * Ruta publica: /seller-preview/:slug
 *
 * Esta pagina NO reemplaza a SellerPage.jsx. Sirve para validar
 * los modulos (ModuleRenderer / StoreModule) con datos reales,
 * sin tocar la pagina publica actual.
 *
 * Reglas respetadas:
 *   - Usa el cliente Supabase correcto: ../lib/supabaseClient.
 *   - profiles se busca por business_slug.
 *   - offers se filtran por user_id (= profile.id) y status active.
 *   - No cambia Supabase ni el schema.
 *   - No backend, no Base64.
 * -------------------------------------------------------------
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ModuleRenderer from '../modules/ModuleRenderer';
import '../styles/seller-modules.css';

export default function SellerPreviewPage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setNotFound(false);

      // 1) Perfil del negocio por business_slug.
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('business_slug', slug)
        .maybeSingle();

      if (!active) return;

      if (!prof) {
        setProfile(null);
        setOffers([]);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(prof);

      // 2) Ofertas activas del vendedor (user_id = profile.id).
      const { data: offs } = await supabase
        .from('offers')
        .select('*')
        .eq('user_id', prof.id)
        .eq('status', 'active');

      if (!active) return;

      setOffers(Array.isArray(offs) ? offs : []);
      setLoading(false);
    }

    if (slug) {
      load();
    } else {
      setNotFound(true);
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#5b6776' }}>
        Cargando tienda…
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#5b6776' }}>
        Tienda no encontrada
      </div>
    );
  }

  return (
    <ModuleRenderer
      seller={profile}
      offers={offers}
      template={profile?.business_template}
      primaryColor={profile?.business_primary_color}
    />
  );
}
