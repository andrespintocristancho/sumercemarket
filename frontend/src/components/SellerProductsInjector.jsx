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
//   6. Reutiliza las clases CSS existentes del seller page.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";

// ── Formatear precio colombiano ──────────────────────────────
function formatCOP(value) {
  if (value == null || isNaN(value)) return "";
  return `$${Number(value).toLocaleString("es-CO")}`;
}

// ── Placeholder cuando no hay imagen ─────────────────────────
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23f0f0f0' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23bbb' font-size='14'%3ESin imagen%3C/text%3E%3C/svg%3E";

// ============================================================
// Componente principal
// ============================================================
export default function SellerProductsInjector({ slug }) {
  const [products, setProducts] = useState([]);
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
        // Paso A: obtener perfil por business_slug
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("business_slug", slug)
          .maybeSingle();

        if (profileErr || !profile) {
          if (!cancelled) setLoading(false);
          return;
        }

        // Paso B: productos activos de ese vendedor
        const { data: prods, error: prodsErr } = await supabase
          .from("products")
          .select("id, name, price, category, image_url")
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
    <section className="sp-section sp-slide-up" data-section="products">
      <div className="sp-section-inner">
        <div className="sp-section-head">
          <span className="sp-section-label">Catálogo</span>
          <h2>Productos del negocio</h2>
          <span className="sp-divider" />
        </div>

        <div
          className="sp-cards"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {products.map((prod) => (
            <div
              key={prod.id}
              className="sp-card"
              style={{
                borderRadius: "var(--sp-radius, 12px)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Imagen */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                  background: "#f5f5f5",
                }}
              >
                <img
                  src={prod.image_url || PLACEHOLDER}
                  alt={prod.name || "Producto"}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER;
                  }}
                />
              </div>

              {/* Info */}
              <div style={{ padding: "0.85rem 1rem" }}>
                {prod.category && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#888",
                      marginBottom: "0.25rem",
                      display: "block",
                    }}
                  >
                    {prod.category}
                  </span>
                )}

                <h3
                  className="sp-card-title"
                  style={{
                    margin: "0 0 0.4rem",
                    fontSize: "0.95rem",
                    lineHeight: 1.3,
                  }}
                >
                  {prod.name || "Sin nombre"}
                </h3>

                {prod.price != null && (
                  <span
                    className="sp-price"
                    style={{
                      fontWeight: 700,
                      fontSize: "1.05rem",
                    }}
                  >
                    {formatCOP(prod.price)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // ── 5. Inyectar vía createPortal ───────────────────────────
  return createPortal(sectionContent, portalTarget);
}
