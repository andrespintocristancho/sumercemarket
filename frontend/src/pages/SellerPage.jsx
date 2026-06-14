import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

/**
 * SellerPage
 * Mini web pública del vendedor.
 *
 * Orden de secciones (Bloque 3.1):
 *   1. Hero (más compacto)
 *   2. Sobre el negocio (con horario / ubicación / whatsapp)
 *   3. Servicios
 *   4. Ofertas destacadas (primeras 3)
 *   5. Catálogo (excluye las 3 destacadas, sin duplicar)
 *   6. CTA WhatsApp
 *
 * Columnas usadas en `profiles`:
 *   business_name, business_slug, business_description,
 *   business_address, business_department, business_city,
 *   business_template, business_headline, business_about,
 *   business_schedule, business_primary_color,
 *   business_whatsapp,
 *   business_logo_url, business_cover_url,
 *   business_services
 */

const TEMPLATE_SERVICES = {
  store: [
    { icon: "🛒", title: "Variedad de productos", desc: "Encuentra todo en un solo lugar." },
    { icon: "💳", title: "Pagos seguros", desc: "Múltiples medios de pago." },
    { icon: "🚚", title: "Envíos", desc: "A toda la ciudad." },
    { icon: "🤝", title: "Atención cercana", desc: "Te ayudamos a elegir lo mejor." },
  ],
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
  appliances: [
    { icon: "📺", title: "Televisores y Video", desc: "Pantallas de última tecnología para tu hogar." },
    { icon: "🧺", title: "Línea Blanca", desc: "Lavadoras, secadoras y neveras eficientes." },
    { icon: "🍳", title: "Línea Cocina", desc: "Licuadoras, cafeteras y freidoras de aire." },
    { icon: "🛡️", title: "Garantía Extendida", desc: "Respaldo y soporte técnico en tus compras." },
  ],
  tech: [
    { icon: "💻", title: "Computadores", desc: "Equipos de alto rendimiento para trabajo y gaming." },
    { icon: "📱", title: "Smartphones", desc: "Los últimos celulares y complementos premium." },
    { icon: "🎧", title: "Audio y Gadgets", desc: "Audífonos, parlantes y relojes inteligentes." },
    { icon: "🛠️", title: "Soporte Técnico", desc: "Asistencia profesional y mantenimiento." },
  ],
  footwear: [
    { icon: "👟", title: "Calzado Deportivo", desc: "Tenis cómodos para correr, entrenar y caminar." },
    { icon: "🥾", title: "Botas y Aventura", desc: "Calzado resistente para terrenos difíciles y diario." },
    { icon: "👠", title: "Calzado Formal", desc: "Zapatos elegantes para eventos y oficina." },
    { icon: "🧸", title: "Línea Infantil", desc: "Diseños divertidos y duraderos para niños." },
  ],
  clothing: [
    { icon: "👕", title: "Ropa Casual", desc: "Camisetas, jeans y prendas cómodas de diario." },
    { icon: "🧥", title: "Prendas de Abrigo", desc: "Chaquetas, sacos y abrigos para toda estación." },
    { icon: "👗", title: "Vestidos y Formal", desc: "Trajes y vestidos elegantes para ocasiones especiales." },
    { icon: "🧣", title: "Accesorios", desc: "Bolsos, bufandas y complementos perfectos." },
  ],
  motos: [
    { icon: "🏍️", title: "Venta de Motos", desc: "Modelos nuevos y usados garantizados para ti." },
    { icon: "⚙️", title: "Repuestos y Lujos", desc: "Partes originales y accesorios de personalización." },
    { icon: "🛠️", title: "Taller Especializado", desc: "Mantenimiento preventivo y correctivo experto." },
    { icon: "🪖", title: "Accesorios y Cascos", desc: "Equipo de protección certificado y chaquetas." },
  ],
  cars: [
    { icon: "🚗", title: "Catálogo de Autos", desc: "Carros de todas las marcas listos para traspaso." },
    { icon: "🔍", title: "Peritaje y Revisión", desc: "Diagnóstico completo del estado del vehículo." },
    { icon: "💳", title: "Financiación", desc: "Asesoría de crédito y gestión de documentos." },
    { icon: "🛞", title: "Servicios Post-Venta", desc: "Garantía de motor y asistencia en carretera." },
  ],
  veterinary: [
    { icon: "🩺", title: "Consulta Veterinaria", desc: "Atención médica general y chequeos de salud." },
    { icon: "💉", title: "Vacunación", desc: "Esquemas completos para cachorros y adultos." },
    { icon: "🧼", title: "Peluquería y Estética", desc: "Baño, corte de pelo y limpieza higiénica." },
    { icon: "🍖", title: "Pet Shop", desc: "Alimento premium, juguetes y medicamentos." },
  ],
  supermarket: [
    { icon: "🥦", title: "Frutas y Verduras", desc: "Productos frescos y seleccionados del campo." },
    { icon: "🥩", title: "Carnes de Primera", desc: "Cortes frescos de primera calidad." },
    { icon: "🥛", title: "Lácteos y Despensa", desc: "Variedad en abarrotes y productos básicos." },
    { icon: "🛵", title: "Domicilio Express", desc: "Recibe tu mercado completo en minutos." },
  ],
  hardware: [
    { icon: "🛠️", title: "Herramientas", desc: "Equipos profesionales para construcción y hogar." },
    { icon: "🎨", title: "Pinturas", desc: "Amplia gama de colores y complementos para pintar." },
    { icon: "🔌", title: "Eléctricos y Plomería", desc: "Tuberías, cables, tomacorrientes y grifería." },
    { icon: "🧱", title: "Materiales", desc: "Cemento, yeso y arena para tus obras." },
  ],
  bakery: [
    { icon: "🍞", title: "Pan Fresco Diario", desc: "Pan calientito de sal, dulce e integral." },
    { icon: "🍰", title: "Pastelería Fina", desc: "Tortas decoradas y postres para celebraciones." },
    { icon: "☕", title: "Cafetería", desc: "Acompaña tus panecillos con el mejor café." },
    { icon: "🥯", title: "Hojaldres", desc: "Pasteles de pollo, carne y buñuelos recién hechos." },
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

function buildFullAddress(profile) {
  if (!profile) return "";
  return [profile.business_address, profile.business_city, profile.business_department]
    .filter(Boolean)
    .join(", ");
}

const getTemplateLayout = (templateId) => {
  if (['motos', 'cars', 'vehicles'].includes(templateId)) return 'automotive';
  if (['beauty', 'fashion', 'clothing'].includes(templateId)) return 'elegant';
  if (['services', 'health', 'gym', 'veterinary'].includes(templateId)) return 'services';
  return 'retail';
};

export default function SellerPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

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
        .select("*, offer_images (id, url, path, position)")
        .eq("user_id", prof.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      setOffers(offs || []);
      setLoading(false);
    })();
  }, [slug]);

  const stylesConfig = useMemo(() => {
    let cfg = {
      primary: "#2563eb",
      bg: "#f8fafc",
      text: "#0f172a",
      btnBg: "#2563eb",
      btnText: "#ffffff",
      font: "Plus Jakarta Sans"
    };
    const colorVal = profile?.business_primary_color;
    if (colorVal) {
      if (colorVal.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(colorVal);
          cfg = { ...cfg, ...parsed };
        } catch (e) {
          cfg.primary = colorVal;
          cfg.btnBg = colorVal;
        }
      } else {
        cfg.primary = colorVal;
        cfg.btnBg = colorVal;
      }
    }
    return cfg;
  }, [profile]);

  const primary = stylesConfig.primary;

  const servicesData = useMemo(() => {
    let cards = [];
    let tags = [];
    if (profile?.business_services) {
      try {
        const parsed = typeof profile.business_services === 'string'
          ? JSON.parse(profile.business_services)
          : profile.business_services;
        
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          cards = parsed.cards || [];
          tags = parsed.tags || [];
        } else if (Array.isArray(parsed)) {
          if (parsed.length > 0 && typeof parsed[0] === 'object') {
            cards = parsed;
          } else {
            tags = parsed;
          }
        }
      } catch (e) {
        if (typeof profile.business_services === 'string') {
          tags = profile.business_services.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
    }
    
    // If we have no custom cards in business_services, load defaults from the template
    if (cards.length === 0) {
      cards = TEMPLATE_SERVICES[profile?.business_template] || TEMPLATE_SERVICES.store;
    }
    return { cards, tags };
  }, [profile]);

  const services = servicesData.cards;
  const servicesList = servicesData.tags;

  const coverStyle = useMemo(() => {
    if (!profile?.business_cover_url) return {};
    
    const zoom = stylesConfig.coverZoom !== undefined ? stylesConfig.coverZoom : 100;
    const posY = stylesConfig.coverPositionY !== undefined ? stylesConfig.coverPositionY : 50;
    const posX = stylesConfig.coverPositionX !== undefined ? stylesConfig.coverPositionX : 50;
    const fit = stylesConfig.coverFit !== undefined ? stylesConfig.coverFit : 'cover';
    
    if (fit === 'contain') {
      return {
        fit,
        bgStyle: {
          backgroundImage: `url(${profile.business_cover_url})`,
          filter: 'blur(20px)',
          opacity: 0.5,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'absolute',
          inset: 0
        },
        imgStyle: {
          backgroundImage: `url(${profile.business_cover_url})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'absolute',
          inset: 0
        }
      };
    }
    
    return {
      fit,
      imgStyle: {
        backgroundImage: `url(${profile.business_cover_url})`,
        backgroundSize: zoom === 100 ? 'cover' : `${zoom}%`,
        backgroundPosition: `${posX}% ${posY}%`,
        backgroundRepeat: 'no-repeat',
        position: 'absolute',
        inset: 0
      }
    };
  }, [profile, stylesConfig]);

  /**
   * Reglas anti-duplicado (Bloque 3.1):
   *  - Destacadas: primeras 3 ofertas (si hay menos, solo las que hay).
   *  - Catálogo: el resto (offers.slice(3)). Si hay <= 3 ofertas, el catálogo queda vacío
   *    y NO se vuelve a mostrar lo mismo que en destacadas.
   */
  const featured = useMemo(() => offers.slice(0, 3), [offers]);
  const catalog = useMemo(() => (offers.length > 3 ? offers.slice(3) : []), [offers]);
  const fullAddress = useMemo(() => buildFullAddress(profile), [profile]);

  function waLink(text = "") {
    if (!profile?.business_whatsapp) return null;
    const msg = encodeURIComponent(
      text || `Hola ${profile.business_name}, vi tu sitio y me interesa más información.`
    );
    return `https://wa.me/${profile.business_whatsapp}?text=${msg}`;
  }

  async function handleCopyLink() {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const tmp = document.createElement("textarea");
        tmp.value = url;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        document.body.removeChild(tmp);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("No se pudo copiar el enlace", e);
    }
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: profile?.business_name || "Mira este negocio",
      text: profile?.business_headline || profile?.business_description || "Te comparto este negocio",
      url,
    };
    try {
      if (navigator?.share) {
        await navigator.share(shareData);
      } else {
        await handleCopyLink();
      }
    } catch (e) {
      // El usuario canceló el share o no está soportado: hacemos fallback silencioso
      if (e?.name !== "AbortError") {
        await handleCopyLink();
      }
    }
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

  /* ───── Dynamic section rendering based on template layout ───── */
  const layout = getTemplateLayout(profile.business_template);

  // Section: About
  const sectionAbout = (profile.business_about || profile.business_description) ? (
    <section key="about" className="sp-section sp-section-about sp-slide-up">
      <div className="sp-section-inner">
        <div className="sp-section-head">
          <span className="sp-section-label">Nuestra historia</span>
          <h2>Sobre nosotros</h2>
          <span className="sp-divider" style={{ background: `linear-gradient(90deg, ${primary}, ${hexToRgba(primary, 0.35)})` }} />
        </div>
        <div className="sp-about-card" style={{ borderColor: hexToRgba(primary, 0.14) }}>
          <div className="sp-about-accent" style={{ background: `linear-gradient(180deg, ${primary}, ${hexToRgba(primary, 0.4)})` }} aria-hidden="true" />
          <div className="sp-about-quote-mark" style={{ color: hexToRgba(primary, 0.18) }} aria-hidden="true">&ldquo;</div>
          <p className="sp-about">{profile.business_about || profile.business_description}</p>
        </div>
      </div>
    </section>
  ) : null;

  // Section: Services
  const sectionServices = services.length > 0 ? (
    <section key="services" className="sp-section sp-section-services sp-slide-up">
      <div className="sp-section-inner">
        <div className="sp-section-head">
          <span className="sp-section-label">Lo que hacemos</span>
          <h2>Nuestros Servicios</h2>
          <span className="sp-divider" style={{ background: `linear-gradient(90deg, ${primary}, ${hexToRgba(primary, 0.35)})` }} />
        </div>
        <div className="sp-cards">
          {services.map((s, i) => (
            <article key={i} className="sp-card sp-card-service" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="sp-card-icon-wrap" style={{ background: hexToRgba(primary, 0.09), color: primary }}>
                <span className="sp-card-icon-emoji">{s.icon}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <div className="sp-card-accent-line" style={{ background: primary }} aria-hidden="true" />
            </article>
          ))}
        </div>
        {servicesList.length > 0 && (
          <div className="sp-tags">
            {servicesList.map((t, i) => (
              <span key={i} className="sp-tag" style={{ borderColor: hexToRgba(primary, 0.3), color: primary, background: hexToRgba(primary, 0.06) }}>
                <span style={{ color: primary }}>✓</span> {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  ) : null;

  // Section: Featured offers (top 3)
  const sectionFeatured = featured.length > 0 ? (
    <section key="featured" className="sp-section sp-slide-up">
      <div className="sp-section-inner">
        <div className="sp-section-head">
          <span className="sp-section-label">Top picks</span>
          <h2>Ofertas destacadas</h2>
          <span className="sp-divider" style={{ background: `linear-gradient(90deg, ${primary}, ${hexToRgba(primary, 0.35)})` }} />
        </div>
        <div className="sp-cards sp-cards-featured">
          {featured.map((o, i) => (
            <OfferCard key={o.id} offer={o} primary={primary} delay={i * 80} waLink={waLink} featured />
          ))}
        </div>
      </div>
    </section>
  ) : null;

  // Section: Catalog
  const sectionCatalog = (
    <section key="catalog" id="ofertas" className="sp-section sp-section-alt sp-slide-up">
      <div className="sp-section-inner">
        <div className="sp-section-head">
          <span className="sp-section-label">Toda la selección</span>
          <h2>Catálogo de Activos</h2>
          <span className="sp-divider" style={{ background: `linear-gradient(90deg, ${primary}, ${hexToRgba(primary, 0.35)})` }} />
        </div>
        {offers.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon">🛒</div>
            <h3>Aún no hay ofertas activas</h3>
            <p>Muy pronto publicaremos novedades. Escríbenos para conocer más.</p>
            {waLink() && (
              <a href={waLink()} target="_blank" rel="noreferrer" className="sp-btn sp-btn-primary" style={{ background: primary }}>
                Contactar por WhatsApp
              </a>
            )}
          </div>
        ) : catalog.length === 0 && featured.length > 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon">✨</div>
            <h3>Ya viste nuestras ofertas destacadas</h3>
            <p>Estas son todas las ofertas activas por ahora. Pronto habrá más novedades.</p>
            {waLink() && (
              <a href={waLink()} target="_blank" rel="noreferrer" className="sp-btn sp-btn-primary" style={{ background: primary }}>
                Contactar por WhatsApp
              </a>
            )}
          </div>
        ) : (
          <div className="sp-cards">
            {(catalog.length > 0 ? catalog : offers).map((o, i) => (
              <OfferCard key={o.id} offer={o} primary={primary} delay={i * 60} waLink={waLink} />
            ))}
          </div>
        )}
      </div>
    </section>
  );

  // Section: Info (Hours & Location)
  const sectionInfo = (profile.business_schedule || fullAddress) ? (
    <section key="info" className="sp-section sp-slide-up" style={{ paddingBottom: 60 }}>
      <div className="sp-section-inner">
        <div className="sp-hours-location-grid">
          {profile.business_schedule && (
            <div className="sp-hours-card">
              <div className="sp-card-icon-wrap" style={{ background: hexToRgba(primary, 0.09), color: primary }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3>Horarios de Atención</h3>
              <div className="sp-hours-content">
                <p className="sp-hours-text">{profile.business_schedule}</p>
              </div>
            </div>
          )}
          {fullAddress && (
            <div className="sp-location-card">
              <div className="sp-card-icon-wrap" style={{ background: hexToRgba(primary, 0.09), color: primary }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <h3>Ubicación</h3>
              <p className="sp-location-address">{fullAddress}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                target="_blank"
                rel="noreferrer"
                className="sp-btn sp-btn-secondary"
                style={{ marginTop: 16, width: 'fit-content' }}
              >
                Ver en Google Maps →
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  ) : null;

  /* ───── Layout order maps ─────
   * automotive (motos, cars, vehicles):  Catalog → Services → About → Info
   * elegant   (beauty, fashion, clothing): About → Services → Catalog → Info
   * services  (services, health, gym, vet): Services → About → Info → Catalog
   * retail    (default):                    Featured → Catalog → Services → About → Info
   */
  const LAYOUT_ORDERS = {
    automotive: [sectionCatalog, sectionFeatured, sectionServices, sectionAbout, sectionInfo],
    elegant:    [sectionAbout, sectionServices, sectionFeatured, sectionCatalog, sectionInfo],
    services:   [sectionServices, sectionAbout, sectionInfo, sectionFeatured, sectionCatalog],
    retail:     [sectionFeatured, sectionCatalog, sectionServices, sectionAbout, sectionInfo],
  };

  const orderedSections = LAYOUT_ORDERS[layout] || LAYOUT_ORDERS.retail;

  return (
    <div className="sp-wrap">
      <style>{styles(stylesConfig)}</style>

      {/* ═══ HEADER ═══ */}
      <header className={`sp-header-wrapper sp-slide-up sp-layout-${layout}`}>
        <div className="sp-banner-cover">
          {profile.business_cover_url && coverStyle.fit === 'contain' ? (
            <>
              <div aria-hidden="true" style={coverStyle.bgStyle} />
              <div aria-hidden="true" style={coverStyle.imgStyle} />
            </>
          ) : (
            <div
              className="sp-hero-cover"
              style={profile.business_cover_url && coverStyle.imgStyle
                ? coverStyle.imgStyle
                : {
                    backgroundImage: profile.business_cover_url
                      ? `url(${profile.business_cover_url})`
                      : "none",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'absolute',
                    inset: 0
                  }
              }
              aria-hidden="true"
            />
          )}
          <div className="sp-hero-overlay" />
        </div>

        <div className={`sp-header-info-bar sp-layout-${layout}`}>
          <div className={`sp-header-logo-container sp-anim-pop sp-layout-${layout}`}>
            <div className="sp-header-logo">
              {profile.business_logo_url ? (
                <img src={profile.business_logo_url} alt={profile.business_name} />
              ) : (
                <span>🏪</span>
              )}
            </div>
          </div>

          <div className="sp-header-details-wrap">
            <div className="sp-header-meta">
              <div className="sp-hero-badge" style={{ background: hexToRgba(primary, 0.12), borderColor: hexToRgba(primary, 0.3), color: primary }}>
                <span className="sp-hero-badge-dot" style={{ background: primary }} />
                Tienda verificada
              </div>
              <h1 className="sp-header-title">{profile.business_name}</h1>
              {(profile.business_headline || profile.business_description) && (
                <p className="sp-header-desc">
                  {profile.business_headline || profile.business_description}
                </p>
              )}
            </div>

            <div className="sp-header-actions sp-anim-fade sp-delay-2">
              {waLink() && (
                <a
                  href={waLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="sp-btn sp-btn-whats"
                  aria-label="Contactar por WhatsApp"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              )}
              <button
                type="button"
                onClick={handleCopyLink}
                className="sp-btn sp-btn-secondary"
                aria-label="Copiar enlace del sitio"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                {copied ? "¡Copiado!" : "Copiar link"}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="sp-btn sp-btn-secondary"
                aria-label="Compartir sitio"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Compartir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ DYNAMIC SECTIONS — Ordered by template layout ═══ */}
      {orderedSections}

      {/* ═══ CTA WHATSAPP — Fixed at bottom for all templates ═══ */}
      <section className="sp-cta-final sp-slide-up">
        <div
          className="sp-cta-inner"
          style={{ background: `linear-gradient(135deg, ${primary} 0%, ${hexToRgba(primary, 0.8)} 100%)` }}
        >
          <div className="sp-cta-orb sp-cta-orb-1" aria-hidden="true" />
          <div className="sp-cta-orb sp-cta-orb-2" aria-hidden="true" />
          <div className="sp-cta-content">
            <span className="sp-cta-eyebrow">¿Listo para comprar?</span>
            <h2>¿Te interesa algo? Hablemos</h2>
            <p>Estamos listos para atenderte por WhatsApp.</p>
            {waLink() ? (
              <a href={waLink()} target="_blank" rel="noreferrer" className="sp-btn sp-btn-whats sp-btn-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Escribir por WhatsApp
              </a>
            ) : (
              <p className="sp-muted">El vendedor aún no ha configurado WhatsApp.</p>
            )}
          </div>
        </div>
      </section>

      <footer className="sp-footer">
        <div className="sp-footer-inner">
          <p className="sp-footer-brand">{profile.business_name}</p>
          <p className="sp-footer-copy">© {new Date().getFullYear()} · Sitio creado con <span className="sp-footer-sm">Sumercé Market</span></p>
        </div>
      </footer>
    </div>
  );
}

function OfferCard({ offer, primary, delay = 0, waLink, featured = false }) {
  let img = offer.image_url || offer.cover_url;
  if (Array.isArray(offer.offer_images) && offer.offer_images.length > 0) {
    const sorted = [...offer.offer_images].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );
    if (sorted[0]?.url) {
      img = sorted[0].url;
    }
  }
  const price = offer.price != null ? offer.price : null;
  const oldPrice = offer.old_price ?? offer.original_price ?? null;
  const discount = oldPrice && price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

  return (
    <article className={`sp-card sp-card-offer ${featured ? "sp-card-featured" : ""}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="sp-offer-img-wrap">
        <div
          className="sp-offer-img"
          style={{ backgroundImage: img ? `url(${img})` : "linear-gradient(135deg,#e2e8f0,#cbd5e1)" }}
        />
        {/* Zoom inner overlay */}
        <div className="sp-offer-img-overlay" aria-hidden="true" />
        {featured && (
          <span className="sp-badge sp-badge-featured" style={{ background: primary }}>
            ★ Destacada
          </span>
        )}
        {discount && discount > 0 && (
          <span className="sp-badge sp-badge-disc">-{discount}%</span>
        )}
      </div>
      <div className="sp-offer-body">
        <h3>{offer.title || offer.name || "Oferta"}</h3>
        {offer.description && <p className="sp-offer-desc">{offer.description}</p>}
        <div className="sp-offer-price-row">
          {price != null && (
            <span className="sp-price" style={{ color: primary }}>
              ${Number(price).toLocaleString()}
            </span>
          )}
          {oldPrice && (
            <span className="sp-price-old">${Number(oldPrice).toLocaleString()}</span>
          )}
          {discount && discount > 0 && (
            <span className="sp-price-save" style={{ background: `${primary}18`, color: primary }}>
              Ahorra {discount}%
            </span>
          )}
        </div>
        {waLink && waLink(`Hola, me interesa: ${offer.title || offer.name}`) && (
          <a
            href={waLink(`Hola, me interesa: ${offer.title || offer.name}`)}
            target="_blank" rel="noreferrer"
            className="sp-btn sp-btn-primary sp-btn-block"
            style={{ background: primary }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Contactar
          </a>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   STYLES — CSS-in-JS premium, luminoso, moderno
   ============================================================ */
const styles = (config) => {

  const primary = config.primary;
  
  // Detect if background is dark
  const isDark = (color) => {
    if (!color) return false;
    const hex = color.replace('#', '').toLowerCase();
    if (hex.length === 3) {
      const r = parseInt(hex[0], 16);
      const g = parseInt(hex[1], 16);
      const b = parseInt(hex[2], 16);
      return (r + g + b) / 3 < 8;
    } else if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (r + g + b) / 3 < 128;
    }
    return false;
  };

  const isDarkTheme = isDark(config.bg);
  const cardBg = isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
  const sectionAltBg = isDarkTheme ? 'rgba(255, 255, 255, 0.02)' : '#ffffff';
  const cardBorder = isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.05)';

  return `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Cinzel:wght@400;700&family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;600;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Montserrat:wght@400;700&display=swap');

:root {
  --sp-primary: ${config.primary};
  --sp-bg: ${config.bg};
  --sp-text: ${config.text};
  --sp-btn-bg: ${config.btnBg};
  --sp-btn-text: ${config.btnText};
  --sp-font: '${config.font}', 'Plus Jakarta Sans', sans-serif;
  --sp-card-bg: ${cardBg};
  --sp-section-alt-bg: ${sectionAltBg};
  --sp-card-border: ${cardBorder};
}

/* ============================
   BASE
   ============================ */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

.sp-wrap{
  font-family: var(--sp-font);
  color: var(--sp-text);
  background: var(--sp-bg);
  min-height:100vh;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  padding-bottom: 40px;
}

/* ============================
   LOADING / NOT FOUND
   ============================ */
.sp-loading,.sp-notfound{
  min-height:100vh;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:16px;color: var(--sp-text);text-align:center;padding:32px;
  background: var(--sp-bg);
}
.sp-spinner{
  width:44px;height:44px;border-radius:50%;
  border:3px solid #e2e8f0;
  border-top-color:${primary};
  animation:sp-spin 1s linear infinite;
}
@keyframes sp-spin{to{transform:rotate(360deg)}}

/* ============================
   ANIMACIONES
   ============================ */
@keyframes sp-fade-up{
  0%{opacity:0;transform:translateY(28px)}
  100%{opacity:1;transform:translateY(0)}
}
@keyframes sp-fade{
  0%{opacity:0}
  100%{opacity:1}
}
@keyframes sp-pop{
  0%{transform:scale(.72);opacity:0}
  70%{transform:scale(1.04)}
  100%{transform:scale(1);opacity:1}
}
@keyframes sp-slide-in{
  0%{opacity:0;transform:translateY(36px)}
  100%{opacity:1;transform:translateY(0)}
}

.sp-anim-fade-up{animation:sp-fade-up .7s cubic-bezier(0.4,0,0.2,1) both}
.sp-anim-fade{animation:sp-fade .6s cubic-bezier(0.4,0,0.2,1) both}
.sp-anim-pop{animation:sp-pop .65s cubic-bezier(0.4,0,0.2,1) both}
.sp-slide-up{animation:sp-slide-in .75s cubic-bezier(0.4,0,0.2,1) both}
.sp-delay-1{animation-delay:.12s}
.sp-delay-2{animation-delay:.24s}
.sp-delay-3{animation-delay:.36s}
.sp-delay-4{animation-delay:.48s}

/* ============================
   HEADER BANNER (FOTO 3)
   ============================ */
.sp-header-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 0 24px;
}

.sp-banner-cover {
  position: relative;
  width: 100%;
  height: 280px;
  border-radius: 24px;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.sp-hero-cover {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 8s ease;
}

.sp-banner-cover:hover .sp-hero-cover {
  transform: scale(1.03);
}

.sp-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15,23,42,0) 40%, rgba(15,23,42,0.45) 100%);
}

.sp-header-info-bar {
  display: flex;
  position: relative;
  padding: 0 32px;
  margin-top: -60px; /* Hace que el logo solape el banner */
  z-index: 10;
  gap: 24px;
  align-items: flex-end;
}

.sp-header-logo-container {
  flex-shrink: 0;
}

.sp-header-logo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #fff;
  border: 4px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15,23,42,0.15);
}

.sp-header-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sp-header-details-wrap {
  display: flex;
  flex: 1;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
  padding-bottom: 8px;
}

.sp-header-meta {
  flex: 1;
  min-width: 280px;
}

.sp-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #fff;
}

.sp-hero-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: sp-pulse 2s ease infinite;
}

@keyframes sp-pulse{
  0%,100%{opacity:1;transform:scale(1)}
  50%{opacity:.4;transform:scale(.8)}
}

.sp-header-title {
  font-size: clamp(24px, 3.5vw, 36px);
  font-weight: 800;
  color: var(--sp-text);
  letter-spacing: -0.025em;
  margin: 6px 0 2px 0;
  line-height: 1.2;
}

.sp-header-desc {
  font-size: 15px;
  color: var(--sp-text);
  opacity: 0.7;
  line-height: 1.45;
  margin: 0;
}

.sp-header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* ============================
   BOTONES
   ============================ */
.sp-btn{
  display:inline-flex;align-items:center;gap:8px;
  padding:12px 22px;border-radius:12px;border:none;
  font-weight:700;font-size:14px;cursor:pointer;
  text-decoration:none;letter-spacing:.01em;
  font-family:inherit;
  transition:transform .2s ease, box-shadow .2s ease, filter .2s ease;
  white-space:nowrap;
}
.sp-btn:hover{transform:translateY(-2px)}
.sp-btn:active{transform:translateY(0)}

.sp-btn-primary{
  background: var(--sp-btn-bg);color: var(--sp-btn-text);
  box-shadow:0 6px 20px ${hexToRgba(primary,.25)};
}
.sp-btn-primary:hover{
  box-shadow:0 10px 24px ${hexToRgba(primary,.35)};
  filter:brightness(1.05);
}

.sp-btn-whats{
  background:#25d366;color:#fff;
  box-shadow:0 6px 20px rgba(37,211,102,.25);
}
.sp-btn-whats:hover{
  background:#22c55e;
  box-shadow:0 10px 24px rgba(37,211,102,.35);
}

.sp-btn-secondary {
  background: var(--sp-bg);
  color: var(--sp-text);
  border: 1px solid rgba(15,23,42,0.12);
  box-shadow: 0 2px 8px rgba(15,23,42,0.03);
}

.sp-btn-secondary:hover {
  background: #fff;
  border-color: rgba(15,23,42,0.22);
  box-shadow: 0 6px 14px rgba(15,23,42,0.06);
}

.sp-btn-lg{padding:16px 32px;font-size:16px;border-radius:14px}
.sp-btn-block{width:100%;justify-content:center;margin-top:14px}

/* ============================
   SECCIONES
   ============================ */
.sp-section{
  width: 100%;
  padding: 48px 0;
}
.sp-section-inner{
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
.sp-section-alt{
  background: var(--sp-section-alt-bg);
  border-top: 1px solid var(--sp-card-border);
  border-bottom: 1px solid var(--sp-card-border);
}
.sp-section-about{background: transparent}

.sp-section-label{
  display:inline-block;
  font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:${primary};margin-bottom:8px;
}
.sp-section-head{text-align:left;margin-bottom:32px}
.sp-section-head h2{
  font-size: clamp(24px, 3vw, 36px);
  font-weight: 800;letter-spacing:-.025em;
  color: var(--sp-text);margin:2px 0 0;
  font-family: var(--sp-font);
}
.sp-divider{
  display:block;width:40px;height:4px;
  border-radius:99px;margin:8px 0 0;
}

/* ============================
   ABOUT CARD
   ============================ */
.sp-about-card{
  position:relative;width:100%;
  padding:36px 36px 36px 48px;
  border:1px solid var(--sp-card-border);border-radius:24px;
  background: var(--sp-card-bg);
  box-shadow:0 8px 30px rgba(15,23,42,.04);
  overflow:hidden;
}
.sp-about-accent{
  position:absolute;left:0;top:0;bottom:0;
  width:6px;
  background: linear-gradient(180deg, ${primary}, ${hexToRgba(primary, 0.4)});
}
.sp-about-quote-mark{
  font-family:Georgia,'Times New Roman',serif;
  font-size:72px;line-height:1;
  position:absolute;top:12px;left:40px;
  pointer-events:none;
  font-weight:900;
  opacity: 0.1;
  user-select:none;
}
.sp-about{
  position:relative;z-index:1;
  font-size: 16.5px;
  line-height:1.7;color: var(--sp-text);opacity:0.85;font-weight:400;
}

/* ============================
   CARDS (servicios / ofertas)
   ============================ */
.sp-cards{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(280px, 1fr));
  gap:24px;
}
.sp-cards-featured{
  grid-template-columns:repeat(auto-fill,minmax(320px, 1fr));
}

.sp-card{
  background: var(--sp-card-bg);
  border:1px solid var(--sp-card-border);
  border-radius:20px;
  box-shadow:0 4px 20px rgba(15,23,42,.03);
  transition:transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  animation:sp-fade-up .5s ease both;
  overflow:hidden;
  position:relative;
}
.sp-card:hover{
  transform:translateY(-6px);
  box-shadow:0 16px 36px rgba(15,23,42,.08);
  border-color:${hexToRgba(primary,.2)};
}

/* Servicios */
.sp-card-service{
  padding: 32px;
  text-align: left;
  display:flex;flex-direction:column;align-items:flex-start;gap:4px;
}
.sp-card-icon-wrap{
  width:56px;height:56px;border-radius:14px;
  display:flex;align-items:center;justify-content:center;
  margin-bottom:12px;
  transition:transform .25s ease;
}
.sp-card:hover .sp-card-icon-wrap{transform:scale(1.08) rotate(-2deg)}
.sp-card-icon-emoji{font-size:26px;line-height:1}
.sp-card-service h3{font-size:18px;font-weight:700;color: var(--sp-text);margin:4px 0 6px}
.sp-card-service p{font-size:14px;color: var(--sp-text);opacity:0.75;line-height:1.5;margin:0}
.sp-card-accent-line{
  width:28px;height:3px;border-radius:99px;
  margin-top:14px;
  transform:scaleX(0);transform-origin:left;
  transition:transform .25s ease;
}
.sp-card:hover .sp-card-accent-line{transform:scaleX(1)}

/* Tags */
.sp-tags{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-start;margin-top:24px}
.sp-tag{
  padding:6px 14px;border-radius:99px;border:1.5px solid;
  font-size:13px;font-weight:600;
  display:inline-flex;align-items:center;gap:6px;
}

/* ============================
   OFFER CARDS
   ============================ */
.sp-card-offer{
  display:flex;flex-direction:column;padding:0;
}
.sp-offer-img-wrap{
  position:relative;overflow:hidden;
  height: 200px;
}
.sp-card-featured .sp-offer-img-wrap{height: 230px}
.sp-offer-img{
  position:absolute;inset:0;
  background-size:cover;background-position:center;
  transition:transform .45s ease;
}
.sp-card:hover .sp-offer-img{transform:scale(1.05)}
.sp-offer-img-overlay{
  position:absolute;inset:0;
  background:linear-gradient(180deg,transparent 60%,rgba(0,0,0,.15) 100%);
}
.sp-badge{
  position:absolute;top:12px;left:12px;color:#fff;
  font-size:11px;font-weight:700;
  padding:4px 10px;border-radius:99px;
  box-shadow:0 4px 10px rgba(0,0,0,0.15);
}
.sp-badge-disc{left:auto;right:12px;background:#ef4444}

.sp-offer-body{padding:20px;display:flex;flex-direction:column;flex:1}
.sp-offer-body h3{
  margin:0 0 6px;font-size:16px;font-weight:700;
  color: var(--sp-text);line-height:1.35;
}
.sp-offer-desc{
  margin:0 0 12px;color: var(--sp-text);opacity:0.75;font-size:13px;line-height:1.45;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.sp-offer-price-row{display:flex;align-items:baseline;flex-wrap:wrap;gap:8px;margin-top:auto;margin-bottom:2px}
.sp-price{font-size:20px;font-weight:800;line-height:1;}
.sp-price-old{color: var(--sp-text);opacity:0.45;text-decoration:line-through;font-size:13px}
.sp-price-save{
  padding:2px 8px;border-radius:6px;
  font-size:11px;font-weight:700;
}

/* ============================
   HORARIOS & UBICACIÓN GRID (FOTO 3)
   ============================ */
.sp-hours-location-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.sp-hours-card, .sp-location-card {
  background: var(--sp-card-bg);
  border: 1px solid var(--sp-card-border);
  border-radius: 24px;
  padding: 36px;
  box-shadow: 0 4px 20px rgba(15,23,42,0.03);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.sp-hours-card:hover, .sp-location-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(15,23,42,0.06);
}

.sp-hours-card h3, .sp-location-card h3 {
  font-size: 19px;
  font-weight: 750;
  color: var(--sp-text);
  margin: 12px 0 8px 0;
}

.sp-hours-text {
  font-size: 15px;
  line-height: 1.6;
  color: var(--sp-text);
  opacity: 0.8;
  white-space: pre-line;
}

.sp-location-address {
  font-size: 15px;
  line-height: 1.5;
  color: var(--sp-text);
  opacity: 0.8;
}

/* ============================
   EMPTY STATE
   ============================ */
.sp-empty{
  text-align:center;padding:56px 24px;
  background: transparent;border:2px dashed rgba(15,23,42,.1);
  border-radius:20px;
  max-width:440px;margin:0 auto;
}
.sp-empty-icon{font-size:48px;margin-bottom:12px;display:block}
.sp-empty h3{margin:0 0 8px;font-size:19px;font-weight:700}
.sp-empty p{margin:0 0 20px;color: var(--sp-text);opacity:0.8;font-size:14px;line-height:1.5}

/* ============================
   CTA FINAL
   ============================ */
.sp-cta-final{
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
.sp-cta-inner{
  position:relative;overflow:hidden;
  border-radius:24px;
  padding: 64px 32px;
  text-align:center;color:#fff;
  box-shadow:0 16px 48px rgba(15,23,42,.15);
}
.sp-cta-orb{
  position:absolute;border-radius:50%;pointer-events:none;
}
.sp-cta-orb-1{
  width:400px;height:400px;
  background:rgba(255,255,255,.08);
  top:-120px;right:-80px;
}
.sp-cta-orb-2{
  width:260px;height:260px;
  background:rgba(255,255,255,.06);
  bottom:-80px;left:-40px;
}
.sp-cta-content{position:relative;z-index:1}
.sp-cta-eyebrow{
  display:inline-block;
  font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  opacity:.75;margin-bottom:12px;
}
.sp-cta-final h2{margin:0 0 10px;font-size:clamp(24px,3.5vw,36px);font-weight:800;letter-spacing:-.02em;font-family: var(--sp-font)}
.sp-cta-final p{margin:0 0 24px;opacity:.92;font-size:15px}
.sp-muted{opacity:.8;font-size:14px}

/* ============================
   FOOTER
   ============================ */
.sp-footer{
  background: transparent;
  border-top:1px solid rgba(15,23,42,.05);
  padding:32px 24px;text-align:center;
  margin-top: 40px;
}
.sp-footer-inner{display:flex;flex-direction:column;align-items:center;gap:4px}
.sp-footer-brand{font-size:15px;font-weight:700;color: var(--sp-text)}
.sp-footer-copy{font-size:13px;color: var(--sp-text);opacity:0.5}
.sp-footer-sm{font-weight:600;color:${primary}}

/* ============================
   RESPONSIVE
   ============================ */
@media(max-width:768px){
  .sp-header-wrapper {
    padding: 16px 16px 0 16px;
  }
  .sp-banner-cover {
    height: 180px;
    border-radius: 16px;
  }
  .sp-header-info-bar {
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-top: -50px;
    padding: 0 16px;
    gap: 12px;
  }
  .sp-header-logo {
    width: 100px;
    height: 100px;
  }
  .sp-header-details-wrap {
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
  }
  .sp-header-meta {
    text-align: center;
  }
  .sp-header-actions {
    justify-content: center;
    width: 100%;
    margin-top: 8px;
  }
  .sp-section{padding: 32px 16px}
  .sp-about-card{padding:28px 24px 28px 32px;border-radius:16px}
  .sp-about-quote-mark{font-size:56px;top:10px;left:24px}
}
}

@media(max-width:580px){
  .sp-btn{width:100%;justify-content:center}
  .sp-header-actions{flex-direction:column;width:100%}
  .sp-cards,.sp-cards-featured{grid-template-columns:1fr}
  .sp-hours-location-grid{grid-template-columns:1fr}
}

/* ── Layout Overrides ── */

/* Automotive Layout: tall banner, sharp/border logo, high contrast */
.sp-layout-automotive .sp-banner-cover {
  height: 380px;
}
.sp-header-info-bar.sp-layout-automotive {
  margin-top: -90px;
  gap: 24px;
}
.sp-header-logo-container.sp-layout-automotive .sp-header-logo {
  border-radius: 12px;
  border: 4px solid var(--sp-primary);
  background: #090d16;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
}
.sp-layout-automotive .sp-header-title {
  text-transform: uppercase;
  font-weight: 900;
  letter-spacing: -0.01em;
}

/* Elegant Layout: centered header, circular logo, premium font */
.sp-header-wrapper.sp-layout-elegant {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sp-header-info-bar.sp-layout-elegant {
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-top: -64px;
  width: 100%;
}
.sp-layout-elegant .sp-header-details-wrap {
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
}
.sp-layout-elegant .sp-header-meta {
  text-align: center;
}
.sp-layout-elegant .sp-header-actions {
  justify-content: center;
  width: 100%;
  margin-top: 12px;
}
.sp-header-logo-container.sp-layout-elegant .sp-header-logo {
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* Retail Layout: interlocking grid logo */
.sp-layout-retail .sp-banner-cover {
  height: 280px;
}
.sp-header-logo-container.sp-layout-retail .sp-header-logo {
  border-radius: 18px;
  border: 4px solid #fff;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}

/* Services Layout: foco propuesta de valor y servicios destacados */
.sp-layout-services .sp-banner-cover {
  height: 230px;
}
.sp-header-logo-container.sp-layout-services .sp-header-logo {
  border-radius: 20px;
  border: 3px solid var(--sp-primary);
}

@media(max-width:768px){
  .sp-layout-automotive .sp-banner-cover {
    height: 220px;
  }
  .sp-layout-elegant .sp-banner-cover {
    height: 180px;
  }
}
`;
};

