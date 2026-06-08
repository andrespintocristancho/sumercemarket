import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { buildWhatsAppLink, formatPhone } from '../data/colombia.js';
import './OfferDetail.css';

/**
 * Página de detalle de oferta.
 * - Lee :id de la URL.
 * - Consulta la tabla `offers` (Supabase) con embed opcional de
 *   `offer_images` y del perfil del vendedor (`profiles`).
 * - Muestra galería, datos completos y botón "Contactar por WhatsApp".
 * - Al contactar, inserta un registro en `contact_events` y luego
 *   abre WhatsApp en una nueva pestaña.
 */
export default function OfferDetail() {
  const { id } = useParams();

  const [offer, setOffer] = useState(null);
  const [images, setImages] = useState([]);
  const [seller, setSeller] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contacting, setContacting] = useState(false);

  // ---------------------------------------------------------------------------
  // Carga inicial de la oferta + imágenes + vendedor
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      setOffer(null);
      setImages([]);
      setSeller(null);
      setActiveImage(0);

      if (!id) {
        if (active) {
          setError('Oferta no encontrada.');
          setLoading(false);
        }
        return;
      }

      try {
        // 1) Intento con embeds (offer_images + profiles). Si la relación no
        //    está expuesta en PostgREST, capturamos el error y hacemos
        //    fallback a una consulta plana.
        let data = null;
        let qErr = null;

        const embedded = await supabase
          .from('offers')
          .select(
            `
              id, title, description, price, category,
              department, city, address,
              image_url, contact_phone, contact_name,
              status, created_at, user_id,
              offer_images ( id, url, position ),
              profiles ( id, full_name, phone, avatar_url )
            `
          )
          .eq('id', id)
          .maybeSingle();

        if (embedded.error) {
          qErr = embedded.error;
        } else {
          data = embedded.data;
        }

        // Fallback: sin embeds, y luego intentos sueltos
        if (!data) {
          const plain = await supabase
            .from('offers')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (plain.error) throw plain.error;
          data = plain.data;

          if (data) {
            // Imágenes por separado (si existe la tabla offer_images)
            const imgs = await supabase
              .from('offer_images')
              .select('id, url, position')
              .eq('offer_id', id)
              .order('position', { ascending: true });
            if (!imgs.error && Array.isArray(imgs.data)) {
              data.offer_images = imgs.data;
            }

            // Perfil del vendedor (si existe la tabla profiles)
            if (data.user_id) {
              const prof = await supabase
                .from('profiles')
                .select('id, full_name, phone, avatar_url')
                .eq('id', data.user_id)
                .maybeSingle();
              if (!prof.error && prof.data) {
                data.profiles = prof.data;
              }
            }
          }
        }

        if (!active) return;

        if (!data) {
          // Si hubo error de embed pero tampoco se encontró nada
          if (qErr) throw qErr;
          setOffer(null);
          setError('');
          setLoading(false);
          return;
        }

        // Normalizar imágenes: primero offer_images ordenadas, luego image_url
        const imgList = Array.isArray(data.offer_images)
          ? [...data.offer_images].sort(
              (a, b) => (a.position ?? 0) - (b.position ?? 0)
            )
          : [];

        const normalizedImages = imgList
          .map((img) => ({ id: img.id, url: img.url }))
          .filter((img) => !!img.url);

        if (normalizedImages.length === 0 && data.image_url) {
          normalizedImages.push({ id: 'main', url: data.image_url });
        }

        setOffer(data);
        setImages(normalizedImages);
        setSeller(data.profiles || null);
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'No se pudo cargar la oferta.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  // ---------------------------------------------------------------------------
  // Datos derivados para la UI
  // ---------------------------------------------------------------------------
  const sellerName = useMemo(() => {
    return (
      seller?.full_name ||
      offer?.contact_name ||
      'Vendedor SumerceMarket'
    );
  }, [seller, offer]);

  const sellerPhone = useMemo(() => {
    return seller?.phone || offer?.contact_phone || '';
  }, [seller, offer]);

  const hasImages = images.length > 0;
  const isActive = !offer?.status || offer.status === 'active';
  const isSold = offer?.status === 'sold';

  // ---------------------------------------------------------------------------
  // Handler: Contactar por WhatsApp
  // ---------------------------------------------------------------------------
  const handleWhatsApp = async () => {
    if (!offer) return;
    if (!sellerPhone) {
      setError('Esta oferta no tiene un teléfono de contacto disponible.');
      return;
    }

    setContacting(true);

    const message =
      `¡Hola ${sellerName}! Te escribo desde SumerceMarket 🇨🇴.\n\n` +
      `Me interesa tu publicación:\n` +
      `• ${offer.title}\n` +
      `• Precio: ${formatPrice(offer.price)}\n\n` +
      `¿Sigue disponible?`;

    const waUrl = buildWhatsAppLink(sellerPhone, message);

    // Registrar el evento de contacto (no bloqueante)
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      await supabase.from('contact_events').insert({
        offer_id: offer.id,
        contacter_id: user?.id || null,
        channel: 'whatsapp'
      });
    } catch (e) {
      // No interrumpimos el flujo si falla el log
      // eslint-disable-next-line no-console
      console.warn('[contact_events] No se pudo registrar el evento:', e?.message);
    } finally {
      setContacting(false);
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return <div className="loading">Cargando oferta…</div>;
  }

  if (error) {
    return (
      <div className="offer-detail">
        <Link to="/" className="back-link">← Volver al inicio</Link>
        <div className="alert alert-error" style={{ marginTop: 12 }}>
          {error}
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="offer-detail">
        <Link to="/" className="back-link">← Volver al inicio</Link>
        <div className="empty-state" style={{ marginTop: 12, textAlign: 'center' }}>
          <h3>Oferta no encontrada</h3>
          <p className="text-muted">
            La publicación puede haber sido eliminada o el enlace es inválido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="offer-detail">
      <Link to="/" className="back-link">← Volver al inicio</Link>

      <div className="offer-detail-grid">
        {/* GALERÍA */}
        <div className="offer-gallery">
          <div className="gallery-main">
            {hasImages ? (
              <img
                src={images[activeImage].url}
                alt={offer.title}
                loading="lazy"
              />
            ) : (
              <div className="gallery-placeholder">
                <span role="img" aria-label="Sin imagen">🛒</span>
              </div>
            )}
            {isSold && <span className="offer-detail-sold">VENDIDO</span>}
          </div>

          {hasImages && images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <button
                  key={img.id ?? i}
                  type="button"
                  className={`thumb ${i === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Imagen ${i + 1}`}
                >
                  <img src={img.url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="offer-info">
          {offer.category && (
            <span
              className="badge"
              style={{
                background: 'var(--amarillo, #fcd116)',
                color: 'var(--azul-dark, #003893)',
                padding: '0.25rem 0.6rem',
                borderRadius: 999,
                fontSize: '0.85rem',
                fontWeight: 700,
                alignSelf: 'flex-start'
              }}
            >
              {offer.category}
            </span>
          )}

          <h1>{offer.title}</h1>
          <p className="offer-detail-price">{formatPrice(offer.price)}</p>

          <p className="offer-detail-location">
            📍 {offer.city}
            {offer.department ? `, ${offer.department}` : ''}
          </p>

          {offer.address && (
            <p className="offer-detail-location" style={{ marginTop: -4 }}>
              🏠 {offer.address}
            </p>
          )}

          <div className="offer-detail-description">
            <h3>Descripción</h3>
            <p>{offer.description || 'Sin descripción.'}</p>
          </div>

          <div className="offer-detail-seller">
            <h3>Vendedor</h3>
            <p><strong>{sellerName}</strong></p>
            {sellerPhone && (
              <p className="text-muted">📞 {formatPhone(sellerPhone)}</p>
            )}
            <p className="text-muted">Miembro de SumerceMarket</p>
          </div>

          {isActive ? (
            <button
              type="button"
              className="btn btn-wa btn-block"
              onClick={handleWhatsApp}
              disabled={contacting || !sellerPhone}
              style={{
                fontSize: '1.1rem',
                padding: '1rem',
                background: '#25D366',
                borderColor: '#25D366',
                color: '#fff',
                fontWeight: 700,
                cursor: contacting || !sellerPhone ? 'not-allowed' : 'pointer',
                opacity: contacting || !sellerPhone ? 0.7 : 1
              }}
            >
              {contacting
                ? 'Abriendo WhatsApp…'
                : sellerPhone
                  ? '💬 Contactar por WhatsApp'
                  : 'Sin teléfono de contacto'}
            </button>
          ) : (
            <div className="alert alert-info">
              Esta oferta ya no está disponible.
            </div>
          )}

          <p
            className="text-muted text-center mt-2"
            style={{ fontSize: '0.8rem' }}
          >
            ⚠️ Acuerda el pago en persona. SumerceMarket no procesa transacciones.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers locales
// ---------------------------------------------------------------------------
function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(n);
}
