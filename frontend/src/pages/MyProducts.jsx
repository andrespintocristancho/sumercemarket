// ============================================================
// frontend/src/pages/MyProducts.jsx
// ------------------------------------------------------------
// Pagina segura para que el vendedor autenticado gestione su
// "Catalogo del negocio": listar, crear, editar, eliminar,
// cambiar status (active/paused/archived) y subir imagen
// principal.
//
// Usa la capa de datos:
//   frontend/src/lib/products.js
//
// No modifica rutas globales (App.jsx). Para activarla habra
// que registrar su ruta despues. Aqui solo se exporta el
// componente para que pueda usarse de inmediato.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  listProductsByUser,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from "../lib/products";

// ------------------------------------------------------------
// Estilos locales (scoped por prefijo mp-*).
// Diseno simple, profesional, responsive. No pisa estilos globales.
// ------------------------------------------------------------
const STYLES = `
.mp-wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 20px 80px;
  color: #0f172a;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
               "Helvetica Neue", Arial, sans-serif;
}
.mp-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}
.mp-title {
  font-size: clamp(22px, 3vw, 30px);
  font-weight: 800;
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}
.mp-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}
.mp-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: filter .15s ease, transform .15s ease, box-shadow .2s ease;
  background: #2563eb;
  color: #fff;
}
.mp-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
.mp-btn:active { transform: translateY(0); }
.mp-btn-sec {
  background: #fff;
  color: #0f172a;
  border-color: #e2e8f0;
}
.mp-btn-danger {
  background: #dc2626;
  color: #fff;
}
.mp-btn-ghost {
  background: transparent;
  color: #475569;
  border: 1px solid #e2e8f0;
}
.mp-btn-sm {
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 8px;
}

.mp-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.mp-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}
.mp-field { display: flex; flex-direction: column; gap: 6px; }
.mp-label {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.mp-input, .mp-select, .mp-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  color: #0f172a;
  font-family: inherit;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.mp-input:focus, .mp-select:focus, .mp-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.mp-textarea { min-height: 80px; resize: vertical; }

.mp-form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
  flex-wrap: wrap;
}

.mp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
  margin-top: 24px;
}
.mp-item {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  transition: transform .2s ease, box-shadow .2s ease;
}
.mp-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}
.mp-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #f1f5f9;
  object-fit: cover;
  display: block;
}
.mp-img-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
  background: #f8fafc;
}
.mp-item-body { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.mp-item-name { margin: 0; font-size: 15px; font-weight: 700; }
.mp-item-meta { font-size: 12px; color: #64748b; }
.mp-price { font-size: 16px; font-weight: 800; color: #0f172a; }
.mp-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.mp-badge-active   { background: #dcfce7; color: #166534; }
.mp-badge-paused   { background: #fef9c3; color: #854d0e; }
.mp-badge-archived { background: #e2e8f0; color: #475569; }

.mp-item-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.mp-msg {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 16px;
}
.mp-msg-ok  { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.mp-msg-err { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.mp-msg-info{ background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }

.mp-empty {
  text-align: center;
  padding: 48px 16px;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  color: #64748b;
  background: #f8fafc;
}

.mp-loading { text-align: center; padding: 40px; color: #64748b; }

@media (max-width: 580px) {
  .mp-head { flex-direction: column; align-items: stretch; }
  .mp-form-actions { justify-content: stretch; }
  .mp-form-actions .mp-btn { flex: 1; justify-content: center; }
}
`;

// Estado inicial del formulario
const EMPTY_FORM = {
  name: "",
  description: "",
  category: "",
  price: 0,
  stock: 0,
  sku: "",
  status: "active",
};

export default function MyProducts() {
  const [user, setUser]         = useState(null);
  const [loadingUser, setLU]    = useState(true);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const [form, setForm]         = useState(EMPTY_FORM);
  const [editingId, setEditing] = useState(null);
  const [msg, setMsg]           = useState(null); // { type, text }

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  // --------------------------------------------------------
  // Cargar usuario autenticado
  // --------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error || !data?.user) {
        setUser(null);
      } else {
        setUser(data.user);
      }
      setLU(false);
    })();
    return () => { mounted = false; };
  }, []);

  // --------------------------------------------------------
  // Cargar productos del vendedor
  // --------------------------------------------------------
  async function reload() {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await listProductsByUser(user.id);
    if (error) {
      setMsg({ type: "err", text: "No se pudieron cargar los productos." });
    } else {
      setProducts(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user?.id) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --------------------------------------------------------
  // Helpers UI
  // --------------------------------------------------------
  function resetForm() {
    setForm(EMPTY_FORM);
    setEditing(null);
  }

  function startEdit(p) {
    setEditing(p.id);
    setForm({
      name:        p.name ?? "",
      description: p.description ?? "",
      category:    p.category ?? "",
      price:       p.price ?? 0,
      stock:       p.stock ?? 0,
      sku:         p.sku ?? "",
      status:      p.status ?? "active",
    });
    setMsg(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function onField(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  // --------------------------------------------------------
  // Submit (crear / actualizar)
  // --------------------------------------------------------
  async function onSubmit(e) {
    e.preventDefault();
    if (!user?.id) return;

    const payload = {
      ...form,
      price: Number(form.price) || 0,
      stock: parseInt(form.stock, 10) || 0,
    };

    setSaving(true);
    setMsg(null);

    if (isEditing) {
      const { error } = await updateProduct(editingId, user.id, payload);
      setSaving(false);
      if (error) {
        setMsg({ type: "err", text: "No se pudo actualizar el producto." });
        return;
      }
      setMsg({ type: "ok", text: "Producto actualizado." });
      resetForm();
      reload();
    } else {
      const { error } = await createProduct({ ...payload, user_id: user.id });
      setSaving(false);
      if (error) {
        setMsg({ type: "err", text: "No se pudo crear el producto." });
        return;
      }
      setMsg({ type: "ok", text: "Producto creado." });
      resetForm();
      reload();
    }
  }

  // --------------------------------------------------------
  // Eliminar
  // --------------------------------------------------------
  async function onDelete(p) {
    if (!user?.id) return;
    const ok = window.confirm(`Eliminar "${p.name}"? Esta accion no se puede deshacer.`);
    if (!ok) return;

    const { error } = await deleteProduct(p.id, user.id);
    if (error) {
      setMsg({ type: "err", text: "No se pudo eliminar el producto." });
      return;
    }
    setMsg({ type: "ok", text: "Producto eliminado." });
    reload();
  }

  // --------------------------------------------------------
  // Cambiar status
  // --------------------------------------------------------
  async function onStatus(p, newStatus) {
    if (!user?.id) return;
    const { error } = await updateProduct(p.id, user.id, { status: newStatus });
    if (error) {
      setMsg({ type: "err", text: "No se pudo cambiar el estado." });
      return;
    }
    setMsg({ type: "ok", text: `Estado cambiado a ${newStatus}.` });
    reload();
  }

  // --------------------------------------------------------
  // Subir imagen principal
  // --------------------------------------------------------
  async function onUpload(p, file) {
    if (!user?.id || !file) return;
    setUploadingId(p.id);
    setMsg(null);
    const { error } = await uploadProductImage(user.id, p.id, file);
    setUploadingId(null);
    if (error) {
      setMsg({ type: "err", text: "No se pudo subir la imagen." });
      return;
    }
    setMsg({ type: "ok", text: "Imagen subida correctamente." });
    reload();
  }

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------
  if (loadingUser) {
    return (
      <div className="mp-wrap">
        <style>{STYLES}</style>
        <div className="mp-loading">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mp-wrap">
        <style>{STYLES}</style>
        <div className="mp-card">
          <h1 className="mp-title">Catalogo del negocio</h1>
          <p className="mp-subtitle">
            Debes iniciar sesion para gestionar tu catalogo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mp-wrap">
      <style>{STYLES}</style>

      <header className="mp-head">
        <div>
          <h1 className="mp-title">Catalogo del negocio</h1>
          <p className="mp-subtitle">
            Gestiona los articulos que ofreces de forma habitual.
          </p>
        </div>
      </header>

      {msg && (
        <div
          className={
            msg.type === "ok"
              ? "mp-msg mp-msg-ok"
              : msg.type === "err"
              ? "mp-msg mp-msg-err"
              : "mp-msg mp-msg-info"
          }
        >
          {msg.text}
        </div>
      )}

      {/* Formulario crear / editar */}
      <section className="mp-card" style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>
          {isEditing ? "Editar producto" : "Nuevo producto"}
        </h2>

        <form onSubmit={onSubmit}>
          <div className="mp-form-grid">
            <div className="mp-field" style={{ gridColumn: "1 / -1" }}>
              <label className="mp-label" htmlFor="mp-name">Nombre *</label>
              <input
                id="mp-name"
                className="mp-input"
                name="name"
                value={form.name}
                onChange={onField}
                required
                maxLength={120}
                placeholder="Ej: Cafe arabigo 500g"
              />
            </div>

            <div className="mp-field" style={{ gridColumn: "1 / -1" }}>
              <label className="mp-label" htmlFor="mp-desc">Descripcion</label>
              <textarea
                id="mp-desc"
                className="mp-textarea"
                name="description"
                value={form.description}
                onChange={onField}
                maxLength={1000}
                placeholder="Descripcion breve del producto"
              />
            </div>

            <div className="mp-field">
              <label className="mp-label" htmlFor="mp-cat">Categoria</label>
              <input
                id="mp-cat"
                className="mp-input"
                name="category"
                value={form.category}
                onChange={onField}
                maxLength={60}
                placeholder="Ej: Alimentos"
              />
            </div>

            <div className="mp-field">
              <label className="mp-label" htmlFor="mp-sku">SKU</label>
              <input
                id="mp-sku"
                className="mp-input"
                name="sku"
                value={form.sku}
                onChange={onField}
                maxLength={60}
                placeholder="Codigo interno (opcional)"
              />
            </div>

            <div className="mp-field">
              <label className="mp-label" htmlFor="mp-price">Precio</label>
              <input
                id="mp-price"
                className="mp-input"
                type="number"
                name="price"
                value={form.price}
                onChange={onField}
                min="0"
                step="0.01"
              />
            </div>

            <div className="mp-field">
              <label className="mp-label" htmlFor="mp-stock">Stock</label>
              <input
                id="mp-stock"
                className="mp-input"
                type="number"
                name="stock"
                value={form.stock}
                onChange={onField}
                min="0"
                step="1"
              />
            </div>

            <div className="mp-field">
              <label className="mp-label" htmlFor="mp-status">Estado</label>
              <select
                id="mp-status"
                className="mp-select"
                name="status"
                value={form.status}
                onChange={onField}
              >
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
          </div>

          <div className="mp-form-actions">
            {isEditing && (
              <button
                type="button"
                className="mp-btn mp-btn-ghost"
                onClick={resetForm}
                disabled={saving}
              >
                Cancelar
              </button>
            )}
            <button type="submit" className="mp-btn" disabled={saving}>
              {saving
                ? "Guardando..."
                : isEditing
                ? "Guardar cambios"
                : "Crear producto"}
            </button>
          </div>
        </form>
      </section>

      {/* Listado */}
      <section>
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>
          Mis productos ({products.length})
        </h2>

        {loading ? (
          <div className="mp-loading">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="mp-empty">
            Aun no tienes productos. Crea el primero usando el formulario.
          </div>
        ) : (
          <div className="mp-grid">
            {products.map((p) => (
              <article key={p.id} className="mp-item">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="mp-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="mp-img mp-img-empty">Sin imagen</div>
                )}

                <div className="mp-item-body">
                  <h3 className="mp-item-name">{p.name}</h3>

                  <div className="mp-item-meta">
                    <span
                      className={
                        "mp-badge " +
                        (p.status === "active"
                          ? "mp-badge-active"
                          : p.status === "paused"
                          ? "mp-badge-paused"
                          : "mp-badge-archived")
                      }
                    >
                      {p.status}
                    </span>
                    {p.category && (
                      <span style={{ marginLeft: 8 }}>{p.category}</span>
                    )}
                  </div>

                  <div className="mp-price">
                    {Number(p.price || 0).toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      maximumFractionDigits: 0,
                    })}
                  </div>

                  <div className="mp-item-meta">Stock: {p.stock ?? 0}</div>

                  <div className="mp-item-actions">
                    <button
                      className="mp-btn mp-btn-sec mp-btn-sm"
                      onClick={() => startEdit(p)}
                    >
                      Editar
                    </button>

                    {p.status !== "active" && (
                      <button
                        className="mp-btn mp-btn-sec mp-btn-sm"
                        onClick={() => onStatus(p, "active")}
                      >
                        Activar
                      </button>
                    )}
                    {p.status !== "paused" && (
                      <button
                        className="mp-btn mp-btn-sec mp-btn-sm"
                        onClick={() => onStatus(p, "paused")}
                      >
                        Pausar
                      </button>
                    )}
                    {p.status !== "archived" && (
                      <button
                        className="mp-btn mp-btn-sec mp-btn-sm"
                        onClick={() => onStatus(p, "archived")}
                      >
                        Archivar
                      </button>
                    )}

                    <label
                      className="mp-btn mp-btn-sec mp-btn-sm"
                      style={{ cursor: "pointer" }}
                    >
                      {uploadingId === p.id ? "Subiendo..." : "Subir foto"}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        disabled={uploadingId === p.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onUpload(p, file);
                          e.target.value = "";
                        }}
                      />
                    </label>

                    <button
                      className="mp-btn mp-btn-danger mp-btn-sm"
                      onClick={() => onDelete(p)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
