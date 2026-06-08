// SellerPage.jsx
// Página PÚBLICA del vendedor: /seller/:slug
//
// Muestra:
//   - Portada (business_cover_url) o fallback con gradiente.
//   - Logo (business_logo_url) o ícono fallback.
//   - Nombre del negocio (business_name) y descripción.
//   - Ciudad/Departamento del negocio.
//   - Botón de WhatsApp si business_whatsapp está disponible.
//   - Listado de ofertas ACTIVAS del vendedor, reutilizando
//     el componente <OfferCard>.
//
// Acceso: público (no requiere login). El SELECT de profiles
// ya es público, y el SELECT de offers está restringido a
// status='active' (lo cual encaja con lo que queremos mostrar).

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import OfferCard from '../components/OfferCard.jsx';

export default function SellerPage() {
  const { slug } = useParams();
  const [seller, setSeller] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
    setSeller(null);
    setOffers([]);

    try {
      // 1) Buscar el vendedor por slug.
      const { data: profileRow, error: pErr } = await supabase
        .from('profiles')
        .select(
          'id, business_name, business_slug, business_description, business_logo_url, business_cover_url, business_whatsapp, business_address, business_department, business_city'
        )
        .eq('business_slug', slug)
        .maybeSingle();

      if (pErr) throw pErr;
      if (!profileRow) {
        setError('Esta tienda no existe o ya no está disponible.');
        return;
      }
      setSeller(profileRow);

      // 2) Cargar ofertas activas del vendedor.
      const { data: offerRows, error: oErr } = await supabase
        .from('offers')
        .select(
          'id, title, description, category, price, department, city, address, status, contact_phone, contact_name, created_at, offer_images(id, url, path, position)'
        )
        .eq('user_id', profileRow.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (oErr) throw oErr;
      setOffers(offerRows || []);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar la tienda.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="loading" style={{ paddingTop: 24 }}>Cargando tienda…</div>;
  }

  if (error || !seller) {
    return (
      <div className="card" style={styles.notFound}>
        <div style={{ fontSize: 48 }}>🏪</div>
        <h2 style={{ margin: '8px 0' }}>Tienda no encontrada</h2>
        <p style={{ color: '#6b7280', margin: '0 0 12px 0' }}>
          {error || 'Verifica el enlace e inténtalo de nuevo.'}
        </p>
        <Link to="/" className="btn">Volver al inicio</Link>
      </div>
    );
  }

  const hasCover = Boolean(seller.business_cover_url);
  const hasLogo = Boolean(seller.business_logo_url);
  const location = [seller.business_city, seller.business_department]
    .filter(Boolean)
    .join(', ');

  const whatsappHref = seller.business_whatsapp
    ? `https://wa.me/57${String(seller.business_whatsapp).replace(/\D/g, '')}`
    : null;

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Portada + cabecera */}
      <div style={styles.coverWrap}>
        <div
          style={{
            ...styles.cover,
            background: hasCover
              ? `url(${seller.business_cover_url}) center/cover no-repeat`
              : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
          }}
          aria-label="Portada de la tienda"
        />
      </div>

      <div className="card" style={styles.headerCard}>
        <div style={styles.headerRow}>
          <div style={styles.logoBox}>
            {hasLogo ? (
              <img
                src={seller.business_logo_url}
                alt={`Logo de ${seller.business_name || 'la tienda'}`}
                style={styles.logoImg}
              />
            ) : (
              <span style={{ fontSize: 36 }} aria-hidden>🛍️</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={styles.name}>
              {seller.business_name || 'Tienda sin nombre'}
            </h1>
            {location && <div style={styles.meta}>📍 {location}</div>}
            {seller.business_address && (
              <div style={styles.meta}>{seller.business_address}</div>
            )}
          </div>

          {whatsappHref && (
            <a
              href={whatsappHref}
              className="btn"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.waBtn}
            >
              💬 WhatsApp
            </a>
          )}
        </div>

        {seller.business_description && (
          <p style={styles.description}>{seller.business_description}</p>
        )}
      </div>

      {/* Ofertas activas */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.h2}>Ofertas activas</h2>
          <span style={styles.count}>{offers.length}</span>
        </div>

        {offers.length === 0 ? (
          <div className="card" style={styles.empty}>
            <div style={{ fontSize: 40 }}>📦</div>
            <h3 style={{ margin: '8px 0' }}>Aún no hay ofertas publicadas</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Este vendedor todavía no tiene productos activos.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {offers.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  coverWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    margin: '0 0 -56px 0'
  },
  cover: {
    height: 200,
    width: '100%'
  },
  headerCard: {
    marginTop: 0,
    position: 'relative',
    zIndex: 2
  },
  headerRow: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 16,
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '3px solid #fff',
    boxShadow: '0 2px 8px rgba(15,23,42,0.12)',
    marginTop: -44,
    flexShrink: 0
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  name: {
    margin: 0,
    fontSize: 24,
    color: '#1a1f36',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  meta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4
  },
  waBtn: {
    background: '#16a34a',
    borderColor: '#16a34a'
  },
  description: {
    marginTop: 16,
    marginBottom: 0,
    color: '#374151',
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap'
  },
  section: {
    marginTop: 24
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 8px'
  },
  h2: { margin: 0, fontSize: 20 },
  count: {
    background: '#e0e7ff',
    color: '#3730a3',
    fontWeight: 700,
    fontSize: 13,
    borderRadius: 999,
    padding: '2px 10px'
  },
  grid: {
    marginTop: 12,
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))'
  },
  empty: {
    marginTop: 12,
    textAlign: 'center',
    padding: 32
  },
  notFound: {
    textAlign: 'center',
    padding: 32,
    marginTop: 24
  }
};
