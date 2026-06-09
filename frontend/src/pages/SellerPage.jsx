import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

/**
 * SellerPage
 * Mini web pública premium del vendedor:
 *  - Hero con portada, logo y CTA
 *  - Sobre el negocio
 *  - Servicios / Lo que ofrecemos (cards según business_template)
 *  - Horario
 *  - Ubicación
 *  - Ofertas destacadas
 *  - Todas las ofertas activas
 *  - CTA final a WhatsApp
 *
 * Color principal: business_primary_color
 * Animaciones: fade, slide y hover.
 */

const TEMPLATE_SERVICES = {
  fashion: [
    { icon: "👗", title: "Colecciones nuevas", desc: "Prendas y accesorios de temporada." },
    { icon: "✂️", title: "Arreglos a medida", desc: "Ajustes y confección personalizada." },
    { icon: "🛍️", title: "Asesoría de estilo", desc: "Te ayudamos a elegir tu look ideal." },
    { icon: "🚚", title: "Envíos a domicilio", desc: "Recibe tu pedido en la puerta de tu casa." },
  ],
  beauty: [
    { icon: "💅", title: "Manicure y pedicure", desc: "Cuidado y diseño profesional." },
    { icon: "💇‍♀️", title: "Cortes y peinados", desc: "Estilo a la última tendencia." },
    { icon: "✨", title: "Tratamientos faciales", desc: "Limpieza y rejuvenecimiento." },
    { icon: "💄", title: "Maquillaje", desc: "Para eventos y ocasiones especiales." },
  ],
  health: [
    { icon: "🩺", title: "Consultas", desc: "Atención profesional personalizada." },
    { icon: "💊", title: "Tratamientos", desc: "Planes adaptados a tu necesidad." },
    { icon: "🧘", title: "Bienestar", desc: "Acompañamiento integral." },
    { icon: "📅", title: "Agenda tu cita", desc: "Horarios flexibles." },
  ],
  gym: [
    { icon: "🏋️", title: "Entrenamiento", desc: "Rutinas guiadas para todo nivel." },
    { icon: "🥗", title: "Nutrición", desc: "Planes alimenticios personalizados." },
    { icon: "🤸", title: "Clases grupales", desc: "Energía y motivación en equipo." },
    { icon: "📈", title: "Seguimiento", desc: "Mide tu progreso real." },
  ],
  vehicles: [
    { icon: "🚗", title: "Venta", desc: "Vehículos seleccionados y revisados." },
    { icon: "🔧", title: "Mecánica", desc: "Mantenimiento y reparaciones." },
    { icon: "🛞", title: "Repuestos", desc: "Originales y garantizados." },
    { icon: "📄", title: "Trámites", desc: "Te asesoramos en todo el proceso." },
  ],
  food: [
    { icon: "🍽️", title: "Menú del día", desc: "Platos frescos y caseros." },
    { icon: "🍔", title: "Para llevar", desc: "Empaque listo para disfrutar." },
    { icon: "🛵", title: "Domicilios", desc: "Lo llevamos hasta tu puerta." },
    { icon: "🎉", title: "Eventos", desc: "Servicio para celebraciones." },
  ],
  services: [
    { icon: "🛠️", title: "Servicios técnicos", desc: "Soluciones rápidas y confiables." },
    { icon: "📞", title: "Atención personalizada", desc: "Te escuchamos y asesoramos." },
    { icon: "⏱️", title: "Respuesta rápida", desc: "Tiempo de respuesta corto." },
    { icon: "💼", title: "Profesionales", desc: "Equipo con experiencia." },
  ],
  store: [
    { icon: "🛒", title: "Variedad de productos", desc: "Encuentra todo en un solo lugar." },
    { icon: "💳", title: "Pagos seguros", desc: "Múltiples medios de pago." },
    { icon: "🚚", title: "Envíos", desc: "A toda la ciudad." },
    { icon: "🤝", title: "Atención cercana", desc: "Te ayudamos a elegir lo mejor." },
  ],
};

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(37,99,235,${alpha})`;
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function SellerPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("business_slug", slug)
        .maybeSingle();

      if (error || !prof) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(prof);

      const { data: offs } = await supabase
        .from("offers")
        .select("*")
        .eq("user_id", prof.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      setOffers(offs || []);
      setLoading(false);
    })();
  }, [slug]);

  const primary = profile?.business_primary_color || "#2563eb";
  const services = useMemo(() => TEMPLATE_SERVICES[profile?.business_template] || TEMPLATE_SERVICES.store, [profile]);
  const featured = useMemo(() => offers.slice(0, 3), [offers]);
  const servicesList = useMemo(() => {
    if (!profile?.business_services) return [];
    return profile.business_services.split(",").map((s) => s.trim()).filter(Boolean);
  }, [profile]);

  function waLink(text = "") {
    if (!profile?.business_whatsapp) return null;
    const msg = encodeURIComponent(text || `Hola ${profile.business_name}, vi tu sitio y me interesa más información.`);
    return `https://wa.me/${profile.business_whatsapp}?text=${msg}`;
  }

  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-spinner" />
        <p>Cargando…</p>
        <style>{styles("#2563eb")}</style>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="sp-notfound">
        <h1>😕 Negocio no encontrado</h1>
        <p>El enlace que buscas no existe o fue cambiado.</p>
        <a href="/" className="sp-btn sp-btn-primary">Volver al inicio</a>
        <style>{styles("#2563eb")}</style>
      </div>
    );
  }

  return (
    <div className="sp-wrap">
      <style>{styles(primary)}</style>

      {/* HERO PREMIUM */}
      <header
        className="sp-hero"
        style={{
          backgroundImage: `linear-gradient(135deg, ${hexToRgba(primary, .85)}, rgba(15,23,42,.75)), url(${profile.cover_url || ""})`,
        }}
      >
        <div className="sp-hero-inner">
          <div className="sp-hero-logo" style={{ borderColor: primary }}>
            {profile.logo_url
              ? <img src={profile.logo_url} alt={profile.business_name} />
              : <span>🏪</span>}
          </div>
          <h1 className="sp-fade-up">{profile.business_name}</h1>
          {profile.business_description && (
            <p className="sp-hero-desc sp-fade-up sp-delay-1">{profile.business_description}</p>
          )}
          <div className="sp-hero-cta sp-fade-up sp-delay-2">
            {waLink() && (
              <a href={waLink()} target="_blank" rel="noreferrer" className="sp-btn sp-btn-whats">
                📱 Escríbenos por WhatsApp
              </a>
            )}
            <a href="#ofertas" className="sp-btn sp-btn-outline-light">Ver ofertas</a>
          </div>
        </div>
      </header>

      {/* SOBRE EL NEGOCIO */}
      <section className="sp-section sp-slide-up">
        <div className="sp-section-head">
          <h2>Sobre nosotros</h2>
          <span className="sp-divider" />
        </div>
        <p className="sp-about">
          {profile.business_description || "Somos un negocio dedicado a ofrecerte lo mejor con atención cercana y de calidad."}
        </p>
      </section>

      {/* SERVICIOS */}
      <section className="sp-section sp-slide-up">
        <div className="sp-section-head">
          <h2>Lo que ofrecemos</h2>
          <span className="sp-divider" />
        </div>
        <div className="sp-cards">
          {services.map((s, i) => (
            <article key={i} className="sp-card sp-card-service" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="sp-card-icon" style={{ background: hexToRgba(primary, .12), color: primary }}>
                {s.icon}
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </article>
          ))}
        </div>

        {servicesList.length > 0 && (
          <div className="sp-tags">
            {servicesList.map((t, i) => (
              <span key={i} className="sp-tag" style={{ borderColor: hexToRgba(primary, .35), color: primary }}>
                ✓ {t}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* HORARIO Y UBICACIÓN */}
      {(profile.business_schedule || profile.business_address || profile.business_phone) && (
        <section className="sp-section sp-slide-up">
          <div className="sp-info-grid">
            {profile.business_schedule && (
              <div className="sp-info-card">
                <div className="sp-info-icon" style={{ background: hexToRgba(primary, .12), color: primary }}>🕒</div>
                <h3>Horario</h3>
                <p>{profile.business_schedule}</p>
              </div>
            )}
            {profile.business_address && (
              <div className="sp-info-card">
                <div className="sp-info-icon" style={{ background: hexToRgba(primary, .12), color: primary }}>📍</div>
                <h3>Ubicación</h3>
                <p>{profile.business_address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.business_address)}`}
                  target="_blank" rel="noreferrer"
                  className="sp-link" style={{ color: primary }}
                >
                  Ver en Google Maps →
                </a>
              </div>
            )}
            {profile.business_phone && (
              <div className="sp-info-card">
                <div className="sp-info-icon" style={{ background: hexToRgba(primary, .12), color: primary }}>📞</div>
                <h3>Teléfono</h3>
                <p><a href={`tel:${profile.business_phone}`} className="sp-link" style={{ color: primary }}>{profile.business_phone}</a></p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* OFERTAS DESTACADAS */}
      {featured.length > 0 && (
        <section className="sp-section sp-slide-up">
          <div className="sp-section-head">
            <h2>Ofertas destacadas</h2>
            <span className="sp-divider" />
          </div>
          <div className="sp-cards">
            {featured.map((o, i) => (
              <OfferCard key={o.id} offer={o} primary={primary} delay={i * 80} waLink={waLink} featured />
            ))}
          </div>
        </section>
      )}

      {/* TODAS LAS OFERTAS */}
      <section id="ofertas" className="sp-section sp-slide-up">
        <div className="sp-section-head">
          <h2>Todas nuestras ofertas</h2>
          <span className="sp-divider" />
        </div>
        {offers.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon">🛒</div>
            <h3>Aún no hay ofertas activas</h3>
            <p>Muy pronto publicaremos novedades. Escríbenos para conocer más.</p>
            {waLink() && (
              <a href={waLink()} target="_blank" rel="noreferrer" className="sp-btn sp-btn-primary">
                Contactar por WhatsApp
              </a>
            )}
          </div>
        ) : (
          <div className="sp-cards">
            {offers.map((o, i) => (
              <OfferCard key={o.id} offer={o} primary={primary} delay={i * 60} waLink={waLink} />
            ))}
          </div>
        )}
      </section>

      {/* CTA FINAL */}
      <section className="sp-cta-final sp-slide-up" style={{ background: `linear-gradient(135deg, ${primary}, ${hexToRgba(primary, .75)})` }}>
        <h2>¿Te interesa algo? Hablemos</h2>
        <p>Estamos listos para atenderte por WhatsApp.</p>
        {waLink() ? (
          <a href={waLink()} target="_blank" rel="noreferrer" className="sp-btn sp-btn-whats sp-btn-lg">
            📱 Escribir por WhatsApp
          </a>
        ) : (
          <p className="sp-muted">El vendedor aún no ha configurado WhatsApp.</p>
        )}
      </section>

      <footer className="sp-footer">
        <p>© {new Date().getFullYear()} {profile.business_name}. Sitio creado con Sumercé Market.</p>
      </footer>
    </div>
  );
}

function OfferCard({ offer, primary, delay = 0, waLink, featured = false }) {
  const img = offer.image_url || offer.cover_url;
  const price = offer.price != null ? offer.price : null;
  const oldPrice = offer.old_price ?? offer.original_price ?? null;
  const discount = oldPrice && price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

  return (
    <article className={`sp-card sp-card-offer ${featured ? "sp-card-featured" : ""}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="sp-offer-img" style={{ backgroundImage: img ? `url(${img})` : "linear-gradient(135deg,#e2e8f0,#cbd5e1)" }}>
        {featured && <span className="sp-badge" style={{ background: primary }}>★ Destacada</span>}
        {discount && discount > 0 && (
          <span className="sp-badge sp-badge-disc">-{discount}%</span>
        )}
      </div>
      <div className="sp-offer-body">
        <h3>{offer.title || offer.name || "Oferta"}</h3>
        {offer.description && <p className="sp-offer-desc">{offer.description}</p>}
        <div className="sp-offer-price">
          {price != null && (
            <span className="sp-price" style={{ color: primary }}>
              ${Number(price).toLocaleString()}
            </span>
          )}
          {oldPrice && (
            <span className="sp-price-old">${Number(oldPrice).toLocaleString()}</span>
          )}
        </div>
        {waLink && waLink(`Hola, me interesa: ${offer.title || offer.name}`) && (
          <a
            href={waLink(`Hola, me interesa: ${offer.title || offer.name}`)}
            target="_blank" rel="noreferrer"
            className="sp-btn sp-btn-primary sp-btn-block"
            style={{ background: primary }}
          >
            Lo quiero
          </a>
        )}
      </div>
    </article>
  );
}

const styles = (primary) => `
.sp-wrap{font-family:Inter,system-ui,-apple-system,sans-serif;color:#0f172a;background:#f8fafc;min-height:100vh}
.sp-loading,.sp-notfound{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#475569;text-align:center;padding:24px}
.sp-spinner{width:40px;height:40px;border-radius:50%;border:3px solid #e2e8f0;border-top-color:${primary};animation:sp-spin 1s linear infinite}
@keyframes sp-spin{to{transform:rotate(360deg)}}

/* HERO */
.sp-hero{position:relative;color:#fff;background-size:cover;background-position:center;padding:80px 20px 90px;text-align:center}
.sp-hero-inner{max-width:880px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:18px}
.sp-hero-logo{width:120px;height:120px;border-radius:50%;background:#fff;border:5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:48px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.25);animation:sp-pop .6s ease-out both}
.sp-hero-logo img{width:100%;height:100%;object-fit:cover}
.sp-hero h1{font-size:42px;margin:0;letter-spacing:-.02em;text-shadow:0 4px 20px rgba(0,0,0,.25)}
.sp-hero-desc{font-size:18px;max-width:680px;opacity:.95;margin:0;line-height:1.5}
.sp-hero-cta{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:10px}
@keyframes sp-pop{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}

/* Animaciones */
.sp-fade-up{animation:sp-fade-up .7s ease-out both}
.sp-delay-1{animation-delay:.15s}
.sp-delay-2{animation-delay:.3s}
@keyframes sp-fade-up{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
.sp-slide-up{animation:sp-slide .8s ease-out both}
@keyframes sp-slide{0%{opacity:0;transform:translateY(30px)}100%{opacity:1;transform:translateY(0)}}

/* Botones */
.sp-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:12px;border:none;font-weight:600;font-size:15px;cursor:pointer;text-decoration:none;transition:transform .2s,box-shadow .25s,opacity .2s}
.sp-btn:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.18)}
.sp-btn-primary{background:${primary};color:#fff}
.sp-btn-whats{background:#25d366;color:#fff}
.sp-btn-outline-light{background:rgba(255,255,255,.15);color:#fff;border:1.5px solid rgba(255,255,255,.6);backdrop-filter:blur(6px)}
.sp-btn-lg{padding:16px 32px;font-size:17px}
.sp-btn-block{width:100%;justify-content:center;margin-top:12px}

/* Secciones */
.sp-section{max-width:1080px;margin:0 auto;padding:60px 20px}
.sp-section-head{text-align:center;margin-bottom:34px}
.sp-section-head h2{font-size:30px;margin:0;letter-spacing:-.01em}
.sp-divider{display:block;width:60px;height:4px;border-radius:99px;background:${primary};margin:12px auto 0}
.sp-about{max-width:760px;margin:0 auto;text-align:center;font-size:17px;line-height:1.7;color:#475569}

/* Cards */
.sp-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px}
.sp-card{background:#fff;border-radius:16px;border:1px solid #e5e7eb;box-shadow:0 4px 14px rgba(15,23,42,.05);transition:transform .25s,box-shadow .25s;animation:sp-fade-up .6s ease-out both;overflow:hidden}
.sp-card:hover{transform:translateY(-4px);box-shadow:0 16px 36px rgba(15,23,42,.12)}
.sp-card-service{padding:24px;text-align:center}
.sp-card-service h3{margin:14px 0 6px;font-size:18px}
.sp-card-service p{margin:0;color:#64748b;font-size:14px;line-height:1.5}
.sp-card-icon{width:60px;height:60px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto;transition:transform .3s}
.sp-card:hover .sp-card-icon{transform:scale(1.08) rotate(-3deg)}

/* Tags */
.sp-tags{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:28px}
.sp-tag{padding:8px 14px;border-radius:99px;border:1.5px solid;font-size:14px;font-weight:600;background:#fff;transition:transform .2s}
.sp-tag:hover{transform:translateY(-2px)}

/* Info grid */
.sp-info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}
.sp-info-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;text-align:center;transition:transform .25s,box-shadow .25s}
.sp-info-card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(15,23,42,.08)}
.sp-info-icon{width:54px;height:54px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 12px}
.sp-info-card h3{margin:0 0 6px;font-size:17px}
.sp-info-card p{margin:0 0 6px;color:#475569;font-size:14px;line-height:1.5}
.sp-link{text-decoration:none;font-weight:600;font-size:14px}
.sp-link:hover{text-decoration:underline}

/* Ofertas */
.sp-card-offer{display:flex;flex-direction:column}
.sp-offer-img{position:relative;height:180px;background-size:cover;background-position:center}
.sp-card-featured .sp-offer-img{height:210px}
.sp-badge{position:absolute;top:12px;left:12px;color:#fff;font-size:12px;font-weight:700;padding:6px 12px;border-radius:99px;letter-spacing:.02em;box-shadow:0 4px 12px rgba(0,0,0,.18)}
.sp-badge-disc{left:auto;right:12px;background:#ef4444}
.sp-offer-body{padding:18px;display:flex;flex-direction:column;flex:1}
.sp-offer-body h3{margin:0 0 6px;font-size:17px}
.sp-offer-desc{margin:0 0 12px;color:#64748b;font-size:14px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sp-offer-price{display:flex;align-items:baseline;gap:10px;margin-top:auto}
.sp-price{font-size:22px;font-weight:800}
.sp-price-old{color:#94a3b8;text-decoration:line-through;font-size:14px}

/* Estado vacío */
.sp-empty{text-align:center;padding:60px 20px;background:#fff;border:1px dashed #cbd5e1;border-radius:18px}
.sp-empty-icon{font-size:54px;margin-bottom:12px}
.sp-empty h3{margin:0 0 6px;font-size:20px}
.sp-empty p{margin:0 0 18px;color:#64748b}

/* CTA final */
.sp-cta-final{max-width:1080px;margin:20px auto 40px;border-radius:24px;padding:54px 24px;text-align:center;color:#fff;box-shadow:0 14px 40px rgba(15,23,42,.15)}
.sp-cta-final h2{margin:0 0 10px;font-size:30px}
.sp-cta-final p{margin:0 0 22px;opacity:.95;font-size:17px}
.sp-muted{opacity:.85;font-size:14px}

/* Footer */
.sp-footer{text-align:center;padding:28px 20px;color:#64748b;font-size:13px;border-top:1px solid #e5e7eb;background:#fff}

/* Responsive */
@media (max-width:720px){
  .sp-hero{padding:60px 18px 70px}
  .sp-hero h1{font-size:30px}
  .sp-hero-desc{font-size:15px}
  .sp-hero-logo{width:92px;height:92px;font-size:38px;border-width:4px}
  .sp-section{padding:46px 16px}
  .sp-section-head h2{font-size:24px}
  .sp-cta-final{padding:40px 18px;margin:16px;border-radius:18px}
  .sp-cta-final h2{font-size:22px}
}
`;
