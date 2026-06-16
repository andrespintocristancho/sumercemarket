// ============================================================
// frontend/src/components/SellerProductsInjector.jsx
// ------------------------------------------------------------
// Componente "inyector" que muestra el catálogo de productos
// de un vendedor dentro de la página /seller/:slug SIN tocar
// SellerPage.jsx, App.jsx, main.jsx ni BusinessProfile.jsx.
//
// Estrategia:
//   1. Recibe `slug` como prop.
//   2. Busca el perfil en `profiles` por `business_slug`.
//   3. Consulta `products` filtrando user_id = profile.id
//      y status = "active".
//   4. Si no hay productos → no renderiza nada (null).
//   5. Usa React.createPortal para inyectar la sección
//      justo debajo de la sección "Ofertas destacadas"
//      (busca el <section> con key="featured" en el DOM).
//   6. Usa clases CSS con prefijo spi- para evitar colisiones.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";

// ── Formatear precio colombiano ──────────────────────────────
function formatCOP(value) {
  if (value == null || isNaN(value)) return "";
  return `$${Number(value).toLocaleString("es-CO")}`;
}

// ── Construir enlace de WhatsApp para un producto ────────────
function buildWhatsappUrl(whatsapp, productName) {
  if (!whatsapp) return null;
  // Dejar solo dígitos en el número (wa.me no admite símbolos)
  const phone = String(whatsapp).replace(/\D/g, "");
  if (!phone) return null;
  const message = `Hola, estoy interesado en este producto del catálogo: ${
    productName || "Sin nombre"
  }`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// ── Placeholder cuando no hay imagen ─────────────────────────
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23f0f0f0' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23bbb' font-size='14'%3ESin imagen%3C/text%3E%3C/svg%3E";

// ── Estilos scoped con prefijo spi- ──────────────────────────
const SPI_STYLES = `
  .spi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.25rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .spi-card {
    border-radius: var(--sp-radius, 12px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }

  .spi-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.10);
    transform: translateY(-2px);
  }

  .spi-card-img-wrap {
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: #f5f5f5;
    flex-shrink: 0;
  }

  .spi-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .spi-card-body {
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.25rem;
  }

  .spi-category {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888;
    display: block;
  }

  .spi-name {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.3;
    font-weight: 600;
    color: #222;
  }

  .spi-description {
    margin: 0.15rem 0 0.25rem;
    font-size: 0.82rem;
    line-height: 1.4;
    color: #666;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .spi-price {
    font-weight: 700;
    font-size: 1.05rem;
    color: #111;
    margin-top: 0.15rem;
  }

  .spi-wa-btn {
    margin-top: auto;
    padding: 0.55rem 1rem;
    text-align: center;
    text-decoration: none;
    display: block;
  }

  @media (max-width: 520px) {
    .spi-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.75rem;
    }

    .spi-card-body {
      padding: 0.65rem 0.75rem;
    }

    .spi-name {
      font-size: 0.88rem;
    }

    .spi-description {
      font-size: 0.78rem;
      -webkit-line-clamp: 2;
    }

    .spi-price {
      font-size: 0.95rem;
    }
  }
`;

// ============================================================
// Componente principal
// ============================================================
export default function SellerProductsInjector({ slug }) {
  const [products, setProducts] = useState([]);
  const [whatsapp, setWhatsapp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalTarget, setPortalTarget] = useState(null);
  const containerRef = useRef(null);

  // ── 1. Buscar perfil + productos activos ───────────────────
  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Paso A: obtener perfil por business_slug (incluye whatsapp)
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("id, business_whatsapp")
          .eq("business_slug", slug)
          .maybeSingle();

        if (profileErr || !profile) {
          if (!cancelled) setLoading(false);
          return;
        }

        // Guardar el WhatsApp del vendedor junto con el perfil
        if (!cancelled) setWhatsapp(profile.business_whatsapp || null);

        // Paso B: productos activos de ese vendedor (con description)
        const { data: prods, error: prodsErr } = await supabase
          .from("products")
          .select("id, name, description, price, category, image_url")
          .eq("user_id", profile.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (!cancelled) {
          setProducts(prodsErr ? [] : prods || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ── 2. Localizar anchor DOM para el portal ─────────────────
  // Buscamos la sección "Ofertas destacadas" y creamos un div
  // hermano justo después de ella.
  useEffect(() => {
    if (loading || products.length === 0) return;

    // Intentamos varias estrategias para encontrar la sección
    const findAnchor = () => {
      // Estrategia 1: buscar el h2 que contenga "Ofertas destacadas"
      const headings = document.querySelectorAll("h2");
      for (const h2 of headings) {
        if (h2.textContent?.includes("Ofertas destacadas")) {
          // Subir hasta la <section> padre
          const section = h2.closest("section") || h2.closest(".sp-section");
          if (section) return section;
        }
      }
      // Estrategia 2: buscar por clase sp-section (la primera)
      const sections = document.querySelectorAll(".sp-section");
      if (sections.length > 0) return sections[sections.length - 1];

      return null;
    };

    // Pequeño delay para asegurar que el DOM del seller page renderizó
    const timer = setTimeout(() => {
      const anchor = findAnchor();
      if (!anchor) return;

      // Crear contenedor portal si no existe ya
      const existingPortal = document.getElementById(
        "seller-products-injector-portal"
      );
      if (existingPortal) {
        setPortalTarget(existingPortal);
        return;
      }

      const portalDiv = document.createElement("div");
      portalDiv.id = "seller-products-injector-portal";
      anchor.parentNode.insertBefore(portalDiv, anchor.nextSibling);
      containerRef.current = portalDiv;
      setPortalTarget(portalDiv);
    }, 350);

    return () => {
      clearTimeout(timer);
      // Limpiar nodo portal al desmontar
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
        containerRef.current = null;
      }
    };
  }, [loading, products]);

  // ── 3. No renderizar si no hay datos ───────────────────────
  if (loading || products.length === 0 || !portalTarget) return null;

  // ── 4. Contenido de la sección ─────────────────────────────
  const sectionContent = (
    <>
      {/* Estilos scoped con prefijo spi- */}
      <style>{SPI_STYLES}</style>

      <section className="sp-section sp-slide-up" data-section="products">
        <div className="sp-section-inner">
          <div className="sp-section-head">
            <span className="sp-section-label">Catálogo</span>
            <h2>Productos del negocio</h2>
            <span className="sp-divider" />
          </div>

          <div className="spi-grid">
            {products.map((prod) => {
              const waUrl = buildWhatsappUrl(whatsapp, prod.name);
              return (
                <div key={prod.id} className="spi-card">
                  {/* Imagen */}
                  <div className="spi-card-img-wrap">
                    <img
                      className="spi-card-img"
                      src={prod.image_url || PLACEHOLDER}
                      alt={prod.name || "Producto"}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER;
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="spi-card-body">
                    {prod.category && (
                      <span className="spi-category">{prod.category}</span>
                    )}

                    <h3 className="spi-name">
                      {prod.name || "Sin nombre"}
                    </h3>

                    {prod.description && (
                      <p className="spi-description">{prod.description}</p>
                    )}

                    {prod.price != null && (
                      <span className="spi-price">
                        {formatCOP(prod.price)}
                      </span>
                    )}

                    {/* Botón Consultar por WhatsApp (solo si hay número) */}
                    {waUrl && (
                      <a
                        className="sp-btn sp-btn-primary spi-wa-btn"
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Consultar por WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );

  // ── 5. Inyectar vía createPortal ───────────────────────────
  return createPortal(sectionContent, portalTarget);
}
