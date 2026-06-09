import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient";

/**
 * BusinessProfile
 * - Perfil del negocio tipo Facebook (portada + logo).
 * - Genera business_slug automáticamente desde business_name si está vacío.
 * - Muestra URL pública en vivo: /seller/{business_slug}.
 * - Botones: Ver mi web, Copiar link, Compartir por WhatsApp.
 * - Valida que el slug sea único en la tabla `profiles`.
 * - No pide URLs manuales para imágenes: usa Supabase Storage (bucket "business-assets").
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

const TEMPLATES = [
  { value: "fashion", label: "Moda" },
  { value: "beauty", label: "Belleza" },
  { value: "health", label: "Salud" },
  { value: "gym", label: "Gimnasio" },
  { value: "vehicles", label: "Vehículos" },
  { value: "food", label: "Comida" },
  { value: "services", label: "Servicios" },
  { value: "store", label: "Tienda" },
];

const STORAGE_BUCKET = "business-assets";

function slugify(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function BusinessProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ cover: false, logo: false });
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState(null);
  const [slugStatus, setSlugStatus] = useState({ checking: false, available: true, touched: false });
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    business_name: "",
    business_slug: "",
    business_description: "",
    business_template: "store",
    business_primary_color: "#2563eb",
    business_whatsapp: "",
    business_address: "",
    business_department: "",
    business_city: "",
    business_headline: "",
    business_about: "",
    business_schedule: "",
    business_services: "",
    business_cover_url: "",
    business_logo_url: "",
  });

  const publicUrl = useMemo(() => {
    if (!form.business_slug) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/seller/${form.business_slug}`;
  }, [form.business_slug]);

  // Cargar perfil actual
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) {
        setForm((prev) => ({
          ...prev,
          business_name: data.business_name || "",
          business_slug: data.business_slug || "",
          business_description: data.business_description || "",
          business_template: data.business_template || "store",
          business_primary_color: data.business_primary_color || "#2563eb",
          business_whatsapp: data.business_whatsapp || "",
          business_address: data.business_address || "",
          business_department: data.business_department || "",
          business_city: data.business_city || "",
          business_headline: data.business_headline || "",
          business_about: data.business_about || "",
          business_schedule: data.business_schedule || "",
          business_services: data.business_services || "",
          business_cover_url: data.business_cover_url || "",
          business_logo_url: data.business_logo_url || "",
        }));
      }
      setLoading(false);
    })();
  }, []);

  // Generar slug automáticamente si está vacío al escribir el nombre
  function handleNameChange(value) {
    setForm((prev) => {
      const next = { ...prev, business_name: value };
      if (!prev.business_slug || !slugStatus.touched) {
        next.business_slug = slugify(value);
      }
      return next;
    });
  }

  function handleSlugChange(value) {
    setSlugStatus((s) => ({ ...s, touched: true }));
    setForm((prev) => ({ ...prev, business_slug: slugify(value) }));
  }

  // Validar unicidad del slug con debounce
  useEffect(() => {
    if (!form.business_slug || !userId) {
      setSlugStatus((s) => ({ ...s, available: true, checking: false }));
      return;
    }
    setSlugStatus((s) => ({ ...s, checking: true }));
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("business_slug", form.business_slug)
        .neq("id", userId)
        .limit(1);
      if (error) {
        setSlugStatus({ checking: false, available: true, touched: true });
        return;
      }
      setSlugStatus({ checking: false, available: (data?.length ?? 0) === 0, touched: true });
    }, 400);
    return () => clearTimeout(t);
  }, [form.business_slug, userId]);

  async function uploadImage(file, kind) {
    if (!file || !userId) return;
    setUploading((u) => ({ ...u, [kind]: true }));
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      const field = kind === "cover" ? "business_cover_url" : "business_logo_url";
      setForm((prev) => ({ ...prev, [field]: pub.publicUrl }));
    } catch (e) {
      setMessage({
        type: "error",
        text: `No se pudo subir la imagen. Verifica el bucket '${STORAGE_BUCKET}' en Supabase Storage.`,
      });
    } finally {
      setUploading((u) => ({ ...u, [kind]: false }));
    }
  }

  async function handleSave(e) {
    e?.preventDefault?.();
    setMessage(null);
    if (!userId) return;
    if (!form.business_name.trim()) {
      setMessage({ type: "error", text: "El nombre del negocio es obligatorio." });
      return;
    }
    if (!form.business_slug) {
      setMessage({ type: "error", text: "La URL pública (slug) es obligatoria." });
      return;
    }
    if (!slugStatus.available) {
      setMessage({ type: "error", text: "Ese slug ya está en uso. Elige otro." });
      return;
    }

    setSaving(true);
    const payload = { id: userId, ...form, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: "No se pudo guardar: " + error.message });
    } else {
      setMessage({ type: "success", text: "Perfil guardado correctamente." });
    }
  }

  async function copyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // noop
    }
  }

  function shareWhatsApp() {
    if (!publicUrl) return;
    const text = encodeURIComponent(
      `${form.business_name ? "👋 " + form.business_name + "\n" : ""}Visita mi tienda: ${publicUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <div className="bp-loading">
        <div className="bp-spinner" />
        <p>Cargando perfil…</p>
        <style>{baseStyles}</style>
      </div>
    );
  }

  return (
    <div className="bp-wrap">
      <style>{baseStyles}</style>

      {/* Portada + logo tipo Facebook */}
      <section className="bp-cover-card">
        <div
          className="bp-cover"
          style={{
            backgroundImage: form.business_cover_url
              ? `url(${form.business_cover_url})`
              : "linear-gradient(135deg,#1f2937,#0f172a)",
          }}
        >
          <label className="bp-cover-btn">
            {uploading.cover ? "Subiendo…" : "📷 Cambiar portada"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => uploadImage(e.target.files?.[0], "cover")}
            />
          </label>
        </div>

        <div className="bp-logo-row">
          <div
            className="bp-logo"
            style={{
              backgroundImage: form.business_logo_url ? `url(${form.business_logo_url})` : "none",
              backgroundColor: form.business_logo_url ? "transparent" : "#e5e7eb",
              borderColor: form.business_primary_color,
            }}
          >
            {!form.business_logo_url && <span>🏪</span>}
            <label className="bp-logo-btn" title="Cambiar logo">
              {uploading.logo ? "…" : "📸"}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => uploadImage(e.target.files?.[0], "logo")}
              />
            </label>
          </div>
          <div className="bp-logo-info">
            <h1>{form.business_name || "Tu negocio"}</h1>
            <p>{form.business_description || "Cuéntale al mundo lo que ofreces."}</p>
          </div>
        </div>
      </section>

      {/* URL pública en vivo + acciones */}
      <section className="bp-card bp-url-card">
        <div className="bp-url-head">
          <div>
            <span className="bp-label">Tu URL pública</span>
            <div className="bp-url">
              {publicUrl || <em className="bp-muted">Escribe el nombre del negocio para generar la URL…</em>}
            </div>
            <div className="bp-slug-status">
              {slugStatus.checking && <span className="bp-muted">Verificando disponibilidad…</span>}
              {!slugStatus.checking && form.business_slug && slugStatus.available && (
                <span className="bp-ok">✓ Disponible</span>
              )}
              {!slugStatus.checking && form.business_slug && !slugStatus.available && (
                <span className="bp-err">✗ Ya está en uso</span>
              )}
            </div>
          </div>
        </div>
        <div className="bp-actions">
          <a
            className="bp-btn bp-btn-primary"
            href={publicUrl || "#"}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => { if (!publicUrl) e.preventDefault(); }}
            style={{ background: form.business_primary_color }}
          >
            🌐 Ver mi web
          </a>
          <button type="button" className="bp-btn bp-btn-outline" onClick={copyLink} disabled={!publicUrl}>
            {copied ? "✓ Copiado" : "🔗 Copiar link"}
          </button>
          <button
            type="button"
            className="bp-btn bp-btn-whats"
            onClick={shareWhatsApp}
            disabled={!publicUrl}
          >
            📱 Compartir por WhatsApp
          </button>
        </div>
      </section>

      {/* Formulario */}
      <form className="bp-card" onSubmit={handleSave}>
        <h2 className="bp-h2">Información del negocio</h2>

        <div className="bp-grid">
          <div className="bp-field">
            <label>Nombre del negocio *</label>
            <input
              type="text"
              value={form.business_name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Sumercé Market"
              required
            />
          </div>

          <div className="bp-field">
            <label>URL pública (slug) *</label>
            <div className="bp-slug-input">
              <span>/seller/</span>
              <input
                type="text"
                value={form.business_slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="mi-negocio"
                required
              />
            </div>
          </div>

          <div className="bp-field bp-col-2">
            <label>Titular destacado</label>
            <input
              type="text"
              value={form.business_headline}
              onChange={(e) => setForm({ ...form, business_headline: e.target.value })}
              placeholder="Frase corta que enganche a tus clientes"
            />
          </div>

          <div className="bp-field bp-col-2">
            <label>Descripción</label>
            <textarea
              rows={3}
              value={form.business_description}
              onChange={(e) => setForm({ ...form, business_description: e.target.value })}
              placeholder="¿Qué hace especial a tu negocio?"
            />
          </div>

          <div className="bp-field bp-col-2">
            <label>Sobre el negocio</label>
            <textarea
              rows={4}
              value={form.business_about}
              onChange={(e) => setForm({ ...form, business_about: e.target.value })}
              placeholder="Texto largo: historia, valores, equipo…"
            />
          </div>

          <div className="bp-field">
            <label>Tipo de negocio (plantilla)</label>
            <select
              value={form.business_template}
              onChange={(e) => setForm({ ...form, business_template: e.target.value })}
            >
              {TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="bp-field">
            <label>Color principal</label>
            <div className="bp-color">
              <input
                type="color"
                value={form.business_primary_color}
                onChange={(e) => setForm({ ...form, business_primary_color: e.target.value })}
              />
              <input
                type="text"
                value={form.business_primary_color}
                onChange={(e) => setForm({ ...form, business_primary_color: e.target.value })}
              />
            </div>
          </div>

          <div className="bp-field bp-col-2">
            <label>WhatsApp (con código país)</label>
            <input
              type="tel"
              value={form.business_whatsapp}
              onChange={(e) => setForm({ ...form, business_whatsapp: e.target.value })}
              placeholder="573001234567"
            />
            <small className="bp-hint">Se usa para los botones de contacto en tu web pública.</small>
          </div>

          <div className="bp-field bp-col-2">
            <label>Dirección / Ubicación</label>
            <input
              type="text"
              value={form.business_address}
              onChange={(e) => setForm({ ...form, business_address: e.target.value })}
              placeholder="Calle 123 #45-67"
            />
          </div>

          <div className="bp-field">
            <label>Departamento</label>
            <input
              type="text"
              value={form.business_department}
              onChange={(e) => setForm({ ...form, business_department: e.target.value })}
              placeholder="Ej: Boyacá"
            />
          </div>

          <div className="bp-field">
            <label>Ciudad</label>
            <input
              type="text"
              value={form.business_city}
              onChange={(e) => setForm({ ...form, business_city: e.target.value })}
              placeholder="Ej: Tunja"
            />
          </div>

          <div className="bp-field bp-col-2">
            <label>Horario de atención</label>
            <input
              type="text"
              value={form.business_schedule}
              onChange={(e) => setForm({ ...form, business_schedule: e.target.value })}
              placeholder="Lun–Sáb 9:00 a 18:00"
            />
          </div>

          <div className="bp-field bp-col-2">
            <label>Servicios / Lo que ofrecemos</label>
            <textarea
              rows={3}
              value={form.business_services}
              onChange={(e) => setForm({ ...form, business_services: e.target.value })}
              placeholder="Sepáralos por coma. Ej: Asesoría, Envíos, Domicilios, Pagos con tarjeta"
            />
            <small className="bp-hint">Sepáralos por coma. Se mostrarán como tarjetas en tu web pública.</small>
          </div>
        </div>

        {message && (
          <div className={`bp-msg ${message.type === "error" ? "bp-msg-err" : "bp-msg-ok"}`}>
            {message.text}
          </div>
        )}

        <div className="bp-save">
          <button type="submit" className="bp-btn bp-btn-primary" disabled={saving} style={{ background: form.business_primary_color }}>
            {saving ? "Guardando…" : "💾 Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

const baseStyles = `
.bp-wrap{max-width:1080px;margin:0 auto;padding:24px 16px;display:flex;flex-direction:column;gap:20px;font-family:Inter,system-ui,sans-serif;color:#0f172a}
.bp-loading{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#475569}
.bp-spinner{width:36px;height:36px;border-radius:50%;border:3px solid #e2e8f0;border-top-color:#2563eb;animation:bp-spin 1s linear infinite}
@keyframes bp-spin{to{transform:rotate(360deg)}}
.bp-cover-card{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,.06);border:1px solid #e5e7eb}
.bp-cover{position:relative;height:240px;background-size:cover;background-position:center;display:flex;align-items:flex-end;justify-content:flex-end;padding:16px}
.bp-cover-btn{background:rgba(0,0,0,.55);color:#fff;padding:8px 14px;border-radius:10px;font-size:14px;cursor:pointer;backdrop-filter:blur(6px);transition:transform .2s}
.bp-cover-btn:hover{transform:translateY(-1px)}
.bp-logo-row{display:flex;gap:18px;align-items:flex-end;padding:0 24px 20px;margin-top:-44px}
.bp-logo{position:relative;width:120px;height:120px;border-radius:50%;border:4px solid #fff;background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;font-size:42px;box-shadow:0 6px 20px rgba(15,23,42,.15)}
.bp-logo-btn{position:absolute;right:-2px;bottom:-2px;background:#0f172a;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;border:2px solid #fff}
.bp-logo-info{padding-bottom:6px}
.bp-logo-info h1{margin:0;font-size:24px}
.bp-logo-info p{margin:4px 0 0;color:#64748b;font-size:14px}
.bp-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:22px;box-shadow:0 6px 20px rgba(15,23,42,.04)}
.bp-url-card{display:flex;flex-direction:column;gap:14px}
.bp-url-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
.bp-label{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:600}
.bp-url{font-size:18px;font-weight:600;color:#0f172a;word-break:break-all;margin-top:4px}
.bp-muted{color:#94a3b8;font-style:italic}
.bp-slug-status{margin-top:6px;font-size:13px}
.bp-ok{color:#16a34a;font-weight:600}
.bp-err{color:#dc2626;font-weight:600}
.bp-actions{display:flex;gap:10px;flex-wrap:wrap}
.bp-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:10px;border:none;cursor:pointer;font-weight:600;font-size:14px;transition:transform .15s,box-shadow .2s,opacity .2s;text-decoration:none}
.bp-btn:disabled{opacity:.55;cursor:not-allowed}
.bp-btn:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(15,23,42,.12)}
.bp-btn-primary{background:#2563eb;color:#fff}
.bp-btn-outline{background:#fff;color:#0f172a;border:1px solid #cbd5e1}
.bp-btn-whats{background:#25d366;color:#fff}
.bp-h2{margin:0 0 16px;font-size:18px}
.bp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 18px}
.bp-field{display:flex;flex-direction:column;gap:6px}
.bp-field label{font-size:13px;font-weight:600;color:#334155}
.bp-field input,.bp-field textarea,.bp-field select{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font-size:14px;font-family:inherit;background:#fff;transition:border-color .2s,box-shadow .2s}
.bp-field input:focus,.bp-field textarea:focus,.bp-field select:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.15)}
.bp-col-2{grid-column:1 / -1}
.bp-slug-input{display:flex;align-items:center;border:1px solid #cbd5e1;border-radius:10px;overflow:hidden;background:#fff}
.bp-slug-input span{padding:0 10px;color:#64748b;background:#f1f5f9;font-size:14px;border-right:1px solid #e2e8f0;height:40px;display:flex;align-items:center}
.bp-slug-input input{border:none;border-radius:0;flex:1}
.bp-slug-input input:focus{box-shadow:none}
.bp-color{display:flex;gap:8px;align-items:center}
.bp-color input[type=color]{width:46px;height:40px;padding:2px;border-radius:8px;border:1px solid #cbd5e1;cursor:pointer}
.bp-hint{color:#64748b;font-size:12px}
.bp-msg{margin-top:14px;padding:10px 14px;border-radius:10px;font-size:14px}
.bp-msg-ok{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}
.bp-msg-err{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
.bp-save{display:flex;justify-content:flex-end;margin-top:18px}
@media (max-width:720px){
  .bp-cover{height:170px}
  .bp-logo{width:96px;height:96px;font-size:34px}
  .bp-logo-row{flex-direction:column;align-items:flex-start;margin-top:-36px}
  .bp-grid{grid-template-columns:1fr}
}
`;
