import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'

/**
 * SellerPage - Mini sitio web profesional del vendedor
 * Ruta: /seller/:slug
 *
 * Lee de profiles:
 *  business_template, business_headline, business_about, business_schedule,
 *  business_primary_color, business_name, business_logo_url, business_cover_url,
 *  business_whatsapp, business_address, business_department, business_city
 *
 * Plantillas soportadas:
 *  store, fashion, beauty, health, gym, vehicles, food, services
 *
 * Ofertas: tabla `offers` filtrada por `user_id = profile.id` y `status = 'active'`.
 * Detalle de oferta en ruta `/offers/:id`.
 */

// ---------- Plantillas visuales ----------
const TEMPLATES = {
  store: {
    label: 'Tienda',
    emoji: '🛍️',
    fallbackColor: '#2563eb',
    heroGradient: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(37,99,235,0.55) 100%)',
    bg: '#f8fafc',
    accentSoft: '#eff6ff',
    font: "'Inter', system-ui, -apple-system, sans-serif",
    radius: '16px',
  },
  fashion: {
    label: 'Moda',
    emoji: '👗',
    fallbackColor: '#db2777',
    heroGradient: 'linear-gradient(135deg, rgba(30,0,20,0.75) 0%, rgba(219,39,119,0.5) 100%)',
    bg: '#fdf2f8',
    accentSoft: '#fce7f3',
    font: "'Playfair Display', 'Georgia', serif",
    radius: '4px',
  },
  beauty: {
    label: 'Belleza',
    emoji: '💄',
    fallbackColor: '#c026d3',
    heroGradient: 'linear-gradient(135deg, rgba(80,7,76,0.75) 0%, rgba(232,121,249,0.5) 100%)',
    bg: '#fdf4ff',
    accentSoft: '#fae8ff',
    font: "'Poppins', system-ui, sans-serif",
    radius: '24px',
  },
  health: {
    label: 'Salud',
    emoji: '🩺',
    fallbackColor: '#0ea5e9',
    heroGradient: 'linear-gradient(135deg, rgba(7,89,133,0.8) 0%, rgba(14,165,233,0.45) 100%)',
    bg: '#f0f9ff',
    accentSoft: '#e0f2fe',
    font: "'Inter', system-ui, sans-serif",
    radius: '12px',
  },
  gym: {
    label: 'Fitness',
    emoji: '💪',
    fallbackColor: '#f97316',
    heroGradient: 'linear-gradient(135deg, rgba(20,20,20,0.85) 0%, rgba(249,115,22,0.55) 100%)',
    bg: '#0f172a',
    accentSoft: '#1e293b',
    font: "'Bebas Neue', 'Inter', sans-serif",
    radius: '8px',
    dark: true,
  },
  vehicles: {
    label: 'Vehículos',
    emoji: '🚗',
    fallbackColor: '#334155',
    heroGradient: 'linear-gradient(135deg, rgba(2,6,23,0.9) 0%, rgba(51,65,85,0.6) 100%)',
    bg: '#f1f5f9',
    accentSoft: '#e2e8f0',
    font: "'Montserrat', system-ui, sans-serif",
    radius: '6px',
  },
  food: {
    label: 'Comida',
    emoji: '🍔',
    fallbackColor: '#dc2626',
    heroGradient: 'linear-gradient(135deg, rgba(69,10,10,0.8) 0%, rgba(220,38,38,0.5) 100%)',
    bg: '#fef2f2',
    accentSoft: '#fee2e2',
    font: "'Nunito', system-ui, sans-serif",
    radius: '20px',
  },
  services: {
    label: 'Servicios',
    emoji: '🛠️',
    fallbackColor: '#0d9488',
    heroGradient: 'linear-gradient(135deg, rgba(19,78,74,0.8) 0%, rgba(13,148,136,0.5) 100%)',
    bg: '#f0fdfa',
    accentSoft: '#ccfbf1',
    font: "'Inter', system-ui, sans-serif",
    radius: '14px',
  },
}

const getTemplate = (key) => TEMPLATES[key] || TEMPLATES.store

// ---------- Utilidades ----------
const formatCOP = (value) => {
  const n = Number(value || 0)
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `$${n.toLocaleString('es-CO')}`
  }
}

const sanitizePhone = (phone) => String(phone || '').replace(/[^\d]/g, '')

const buildWhatsAppLink = (phone, message) => {
  const p = sanitizePhone(phone)
  if (!p) return '#'
  const text = encodeURIComponent(message || 'Hola, vi tu tienda en SumercéMarket.')
  return `https://wa.me/${p}?text=${text}`
}

// ---------- Componente ----------
export default function SellerPage() {
  const { slug } = useParams()
  const [profile, setProfile] = useState(null)
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        // 1) Buscar perfil por slug
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()

        if (profErr) throw profErr
        if (!prof) {
          if (!cancelled) {
            setProfile(null)
            setLoading(false)
          }
          return
        }

        // 2) Ofertas activas del vendedor (offers.user_id = profile.id)
        const { data: offs, error: offErr } = await supabase
          .from('offers')
          .select('*')
          .eq('user_id', prof.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (offErr) throw offErr

        if (!cancelled) {
          setProfile(prof)
          setOffers(offs || [])
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Error cargando la tienda')
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  const template = useMemo(
    () => getTemplate(profile?.business_template),
    [profile?.business_template]
  )

  const primary = profile?.business_primary_color || template.fallbackColor

  const featured = useMemo(() => offers.slice(0, 3), [offers])
  const rest = useMemo(() => offers.slice(3), [offers])

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const businessName = profile?.business_name || profile?.full_name || 'Mi negocio'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const handleShare = async () => {
    const data = {
      title: businessName,
      text: profile?.business_headline || `Visita ${businessName} en SumercéMarket`,
      url: shareUrl,
    }
    try {
      if (navigator.share) {
        await navigator.share(data)
      } else {
        await handleCopy()
      }
    } catch {
      /* cancelado por el usuario */
    }
  }

  // ---------- Estados base ----------
  if (loading) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.spinner} />
        <p style={{ color: '#64748b', marginTop: 12 }}>Cargando tienda…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.centerScreen}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Ups</h2>
        <p style={{ color: '#64748b' }}>{error}</p>
        <Link to="/" style={styles.linkBtn}>Volver al inicio</Link>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={styles.centerScreen}>
        <div style={{ fontSize: 56 }}>🔎</div>
        <h2 style={{ margin: '8px 0', color: '#0f172a' }}>Tienda no encontrada</h2>
        <p style={{ color: '#64748b', maxWidth: 380, textAlign: 'center' }}>
          No encontramos una tienda con el enlace <strong>/{slug}</strong>.
        </p>
        <Link to="/" style={styles.linkBtn}>Volver al inicio</Link>
      </div>
    )
  }

  const cover = profile.business_cover_url
  const logo = profile.business_logo_url
  const headline = profile.business_headline
  const about = profile.business_about
  const schedule = profile.business_schedule
  const address = profile.business_address
  const department = profile.business_department
  const city = profile.business_city
  const whatsapp = profile.business_whatsapp

  const locationText = [address, city, department].filter(Boolean).join(', ')

  const pageBg = template.dark ? '#0f172a' : template.bg
  const textOnBg = template.dark ? '#f8fafc' : '#0f172a'
  const subText = template.dark ? '#94a3b8' : '#475569'
  const cardBg = template.dark ? '#1e293b' : '#ffffff'

  return (
    <div style={{ ...styles.page, background: pageBg, color: textOnBg, fontFamily: template.font }}>
      {/* Inyectamos estilos responsive y animaciones */}
      <style>{globalCss}</style>

      {/* ---------- HERO ---------- */}
      <header className="sm-hero" style={styles.hero}>
        <div
          className="sm-hero-bg"
          style={{
            ...styles.heroBg,
            backgroundImage: cover
              ? `${template.heroGradient}, url(${cover})`
              : `${template.heroGradient}, linear-gradient(135deg, ${primary} 0%, #0f172a 100%)`,
          }}
        />

        <div className="sm-container sm-hero-inner" style={styles.heroInner}>
          <div className="sm-hero-top">
            <span className="sm-chip" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
              {template.emoji} {template.label}
            </span>
          </div>

          <div className="sm-hero-main">
            <div
              className="sm-logo"
              style={{
                ...styles.logoCircle,
                borderColor: primary,
                background: logo ? `url(${logo}) center/cover no-repeat` : '#fff',
              }}
              aria-label={`Logo de ${businessName}`}
            >
              {!logo && (
                <span style={{ color: primary, fontWeight: 800, fontSize: 36 }}>
                  {businessName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <h1 className="sm-hero-title" style={styles.heroTitle}>
              {businessName}
            </h1>

            {headline && (
              <p className="sm-hero-headline" style={styles.heroHeadline}>
                {headline}
              </p>
            )}

            {locationText && (
              <p className="sm-hero-loc" style={styles.heroLoc}>
                📍 {locationText}
              </p>
            )}

            <div className="sm-hero-actions">
              {whatsapp && (
                <a
                  className="sm-btn sm-btn-primary"
                  href={buildWhatsAppLink(whatsapp, `Hola ${businessName}, vi tu tienda en SumercéMarket`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: '#25D366', color: '#fff' }}
                >
                  💬 WhatsApp
                </a>
              )}
              <button
                className="sm-btn sm-btn-ghost"
                onClick={handleCopy}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
                type="button"
              >
                {copied ? '✅ Copiado' : '🔗 Copiar link'}
              </button>
              <button
                className="sm-btn sm-btn-ghost"
                onClick={handleShare}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
                type="button"
              >
                📤 Compartir tienda
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- SOBRE EL NEGOCIO ---------- */}
      {about && (
        <section className="sm-container sm-section">
          <SectionTitle color={primary} dark={template.dark}>Sobre el negocio</SectionTitle>
          <div
            className="sm-about-card"
            style={{
              ...styles.card,
              background: cardBg,
              borderRadius: template.radius,
              color: textOnBg,
            }}
          >
            <p style={{ margin: 0, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{about}</p>
          </div>
        </section>
      )}

      {/* ---------- HORARIO Y UBICACIÓN ---------- */}
      {(schedule || locationText) && (
        <section className="sm-container sm-section">
          <div className="sm-grid-2">
            {schedule && (
              <InfoCard
                title="🕒 Horario"
                primary={primary}
                bg={cardBg}
                radius={template.radius}
                textColor={textOnBg}
                subColor={subText}
              >
                <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.7 }}>{schedule}</p>
              </InfoCard>
            )}

            {locationText && (
              <InfoCard
                title="📍 Ubicación"
                primary={primary}
                bg={cardBg}
                radius={template.radius}
                textColor={textOnBg}
                subColor={subText}
              >
                <p style={{ margin: '0 0 12px 0', lineHeight: 1.6 }}>{locationText}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: primary,
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Ver en Google Maps →
                </a>
              </InfoCard>
            )}
          </div>
        </section>
      )}

      {/* ---------- OFERTAS DESTACADAS ---------- */}
      <section className="sm-container sm-section">
        <SectionTitle color={primary} dark={template.dark}>
          ✨ Ofertas destacadas
        </SectionTitle>

        {offers.length === 0 ? (
          <EmptyOffers
            primary={primary}
            whatsapp={whatsapp}
            businessName={businessName}
            bg={cardBg}
            radius={template.radius}
            textColor={textOnBg}
            subColor={subText}
          />
        ) : (
          <div className="sm-grid-3">
            {featured.map((o) => (
              <OfferCard
                key={o.id}
                offer={o}
                primary={primary}
                template={template}
                whatsapp={whatsapp}
                businessName={businessName}
                featured
                bg={cardBg}
                textColor={textOnBg}
                subColor={subText}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------- TODAS LAS OFERTAS ---------- */}
      {rest.length > 0 && (
        <section className="sm-container sm-section">
          <SectionTitle color={primary} dark={template.dark}>
            Todas las ofertas
          </SectionTitle>
          <div className="sm-grid-3">
            {rest.map((o) => (
              <OfferCard
                key={o.id}
                offer={o}
                primary={primary}
                template={template}
                whatsapp={whatsapp}
                businessName={businessName}
                bg={cardBg}
                textColor={textOnBg}
                subColor={subText}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---------- FOOTER ---------- */}
      <footer style={{ ...styles.footer, color: subText }}>
        <div className="sm-container" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            © {new Date().getFullYear()} {businessName} · Página creada con{' '}
            <Link to="/" style={{ color: primary, fontWeight: 700, textDecoration: 'none' }}>
              SumercéMarket
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

// ---------- Subcomponentes ----------
function SectionTitle({ children, color, dark }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 'clamp(22px, 3vw, 30px)',
          fontWeight: 800,
          color: dark ? '#f8fafc' : '#0f172a',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 28,
            background: color,
            borderRadius: 4,
          }}
        />
        {children}
      </h2>
    </div>
  )
}

function InfoCard({ title, children, primary, bg, radius, textColor, subColor }) {
  return (
    <div
      style={{
        background: bg,
        borderRadius: radius,
        padding: 24,
        boxShadow: '0 4px 18px rgba(15,23,42,0.06)',
        border: '1px solid rgba(15,23,42,0.06)',
        color: textColor,
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 700, color: primary }}>
        {title}
      </h3>
      <div style={{ color: subColor, fontSize: 15 }}>{children}</div>
    </div>
  )
}

function OfferCard({ offer, primary, template, whatsapp, businessName, featured, bg, textColor, subColor }) {
  const img =
    offer.image_url ||
    offer.cover_url ||
    `https://placehold.co/600x400/${primary.replace('#', '')}/ffffff?text=${encodeURIComponent(
      offer.title || 'Oferta'
    )}`

  const waLink = buildWhatsAppLink(
    whatsapp,
    `Hola ${businessName}, me interesa tu oferta: "${offer.title}"`
  )

  return (
    <article
      className="sm-offer-card"
      style={{
        background: bg,
        borderRadius: template.radius,
        overflow: 'hidden',
        boxShadow: featured
          ? '0 12px 30px rgba(15,23,42,0.12)'
          : '0 4px 18px rgba(15,23,42,0.06)',
        border: '1px solid rgba(15,23,42,0.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform .2s ease, box-shadow .2s ease',
        color: textColor,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '62%',
          background: `url(${img}) center/cover no-repeat, #e2e8f0`,
        }}
      >
        {featured && (
          <span
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: primary,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 10px',
              borderRadius: 999,
              letterSpacing: 0.3,
            }}
          >
            ⭐ Destacada
          </span>
        )}
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.3,
            color: textColor,
          }}
        >
          {offer.title}
        </h3>

        {offer.description && (
          <p
            style={{
              margin: 0,
              color: subColor,
              fontSize: 14,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {offer.description}
          </p>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: primary }}>
            {formatCOP(offer.price)}
          </span>
          {offer.old_price && Number(offer.old_price) > Number(offer.price || 0) && (
            <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>
              {formatCOP(offer.old_price)}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <Link
            to={`/offers/${offer.id}`}
            className="sm-btn"
            style={{
              background: primary,
              color: '#fff',
              flex: '1 1 auto',
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Ver oferta
          </Link>
          {whatsapp && (
            <a
              className="sm-btn"
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#25D366',
                color: '#fff',
                flex: '1 1 auto',
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              💬 WhatsApp
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function EmptyOffers({ primary, whatsapp, businessName, bg, radius, textColor, subColor }) {
  return (
    <div
      style={{
        background: bg,
        borderRadius: radius,
        padding: '40px 24px',
        textAlign: 'center',
        border: `2px dashed ${primary}33`,
        color: textColor,
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 8 }}>🛒</div>
      <h3 style={{ margin: '0 0 8px 0', fontSize: 20, color: textColor }}>
        Este negocio aún no tiene ofertas activas
      </h3>
      <p style={{ margin: '0 0 18px 0', color: subColor, maxWidth: 440, marginInline: 'auto' }}>
        Puedes contactarlo por WhatsApp para conocer sus productos y servicios.
      </p>
      {whatsapp && (
        <a
          className="sm-btn"
          href={buildWhatsAppLink(
            whatsapp,
            `Hola ${businessName}, vi tu tienda en SumercéMarket y quiero más información`
          )}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#25D366',
            color: '#fff',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          💬 Contactar por WhatsApp
        </a>
      )}
    </div>
  )
}

// ---------- Estilos inline base ----------
const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
  },
  hero: {
    position: 'relative',
    width: '100%',
    minHeight: 'min(560px, 70vh)',
    color: '#fff',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-end',
  },
  heroBg: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 0,
  },
  heroInner: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    padding: '40px 20px 56px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: '50%',
    border: '4px solid #fff',
    boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  heroTitle: {
    margin: '14px 0 0 0',
    fontSize: 'clamp(30px, 6vw, 52px)',
    fontWeight: 900,
    lineHeight: 1.05,
    letterSpacing: -0.5,
    textShadow: '0 2px 12px rgba(0,0,0,0.35)',
  },
  heroHeadline: {
    margin: '6px 0 0 0',
    fontSize: 'clamp(15px, 2vw, 20px)',
    maxWidth: 720,
    opacity: 0.95,
    textShadow: '0 1px 8px rgba(0,0,0,0.3)',
  },
  heroLoc: {
    margin: '4px 0 0 0',
    fontSize: 14,
    opacity: 0.9,
  },
  card: {
    padding: 24,
    boxShadow: '0 4px 18px rgba(15,23,42,0.06)',
    border: '1px solid rgba(15,23,42,0.06)',
  },
  footer: {
    borderTop: '1px solid rgba(15,23,42,0.08)',
    marginTop: 32,
  },
  centerScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: '#f8fafc',
  },
  spinner: {
    width: 38,
    height: 38,
    border: '4px solid #e2e8f0',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'sm-spin 0.9s linear infinite',
  },
  linkBtn: {
    marginTop: 16,
    background: '#0f172a',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: 10,
    textDecoration: 'none',
    fontWeight: 600,
  },
}

// ---------- CSS global responsive ----------
const globalCss = `
@keyframes sm-spin { to { transform: rotate(360deg); } }

.sm-container {
  max-width: 1180px;
  margin: 0 auto;
  padding-left: 20px;
  padding-right: 20px;
  width: 100%;
  box-sizing: border-box;
}

.sm-section {
  padding-top: 40px;
  padding-bottom: 8px;
}

.sm-chip {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(6px);
}

.sm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: transform .15s ease, opacity .15s ease, box-shadow .15s ease;
  box-shadow: 0 4px 14px rgba(0,0,0,0.08);
}
.sm-btn:hover { transform: translateY(-1px); opacity: .95; }
.sm-btn:active { transform: translateY(0); }

.sm-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.sm-grid-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}
.sm-grid-3 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.sm-offer-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 36px rgba(15,23,42,0.14) !important;
}

@media (min-width: 640px) {
  .sm-grid-2 { grid-template-columns: 1fr 1fr; }
  .sm-grid-3 { grid-template-columns: 1fr 1fr; }
}

@media (min-width: 980px) {
  .sm-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
  .sm-hero-inner { padding: 60px 24px 72px 24px !important; }
}

@media (max-width: 480px) {
  .sm-btn { width: 100%; }
}
`
