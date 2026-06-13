import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../styles/business-profile-builder.css';

const TEMPLATES = [
  { id: 'store', emoji: '🏪', name: 'Tienda' },
  { id: 'fashion', emoji: '👗', name: 'Moda' },
  { id: 'beauty', emoji: '💄', name: 'Belleza' },
  { id: 'health', emoji: '🏥', name: 'Salud' },
  { id: 'gym', emoji: '💪', name: 'Gym' },
  { id: 'vehicles', emoji: '🚗', name: 'Vehículos' },
  { id: 'food', emoji: '🍔', name: 'Comida' },
  { id: 'services', emoji: '🔧', name: 'Servicios' },
];

const DEPARTMENTS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas',
  'Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca',
  'Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño',
  'Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés y Providencia',
  'Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada','Bogotá D.C.'
];

export default function BusinessProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [userId, setUserId] = useState(null);

  // Profile fields
  const [businessName, setBusinessName] = useState('');
  const [businessSlug, setBusinessSlug] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessWhatsapp, setBusinessWhatsapp] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessDepartment, setBusinessDepartment] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [businessTemplate, setBusinessTemplate] = useState('store');
  const [businessHeadline, setBusinessHeadline] = useState('');
  const [businessAbout, setBusinessAbout] = useState('');
  const [businessSchedule, setBusinessSchedule] = useState('');
  const [businessPrimaryColor, setBusinessPrimaryColor] = useState('#6366f1');
  const [businessServices, setBusinessServices] = useState([]);
  const [newService, setNewService] = useState('');

  // Images
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Offers
  const [offers, setOffers] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ─── Load profile ────────────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setBusinessName(profile.business_name || '');
          setBusinessSlug(profile.business_slug || '');
          setBusinessDescription(profile.business_description || '');
          setBusinessWhatsapp(profile.business_whatsapp || '');
          setBusinessAddress(profile.business_address || '');
          setBusinessDepartment(profile.business_department || '');
          setBusinessCity(profile.business_city || '');
          setBusinessTemplate(profile.business_template || 'store');
          setBusinessHeadline(profile.business_headline || '');
          setBusinessAbout(profile.business_about || '');
          setBusinessSchedule(profile.business_schedule || '');
          setBusinessPrimaryColor(profile.business_primary_color || '#6366f1');
          setLogoUrl(profile.business_logo_url || '');
          setCoverUrl(profile.business_cover_url || '');

          let svc = [];
          if (profile.business_services) {
            try {
              svc = typeof profile.business_services === 'string'
                ? JSON.parse(profile.business_services)
                : profile.business_services;
            } catch { svc = []; }
          }
          setBusinessServices(Array.isArray(svc) ? svc : []);
        }

        // Load offers
        const { data: offerData } = await supabase
          .from('offers')
          .select('id, title, price, image_url, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setOffers(offerData || []);
      } catch (err) {
        console.error(err);
        showToast('Error cargando perfil', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [navigate, showToast]);

  // ─── Save profile ────────────────────────────────────────
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const updates = {
        business_name: businessName.trim(),
        business_slug: businessSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
        business_description: businessDescription.trim(),
        business_whatsapp: businessWhatsapp.trim(),
        business_address: businessAddress.trim(),
        business_department: businessDepartment,
        business_city: businessCity.trim(),
        business_template: businessTemplate,
        business_headline: businessHeadline.trim(),
        business_about: businessAbout.trim(),
        business_schedule: businessSchedule.trim(),
        business_primary_color: businessPrimaryColor,
        business_logo_url: logoUrl,
        business_cover_url: coverUrl,
        business_services: JSON.stringify(businessServices),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      showToast('¡Cambios guardados exitosamente!');
    } catch (err) {
      console.error(err);
      showToast('Error al guardar: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Upload image ────────────────────────────────────────
  const uploadImage = async (file, bucket, folder) => {
    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${userId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadImage(file, 'business-assets', 'covers');
      setCoverUrl(url);
      showToast('Portada actualizada');
    } catch (err) {
      showToast('Error subiendo portada: ' + err.message, 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadImage(file, 'business-assets', 'logos');
      setLogoUrl(url);
      showToast('Logo actualizado');
    } catch (err) {
      showToast('Error subiendo logo: ' + err.message, 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // ─── Services ────────────────────────────────────────────
  const addService = () => {
    const val = newService.trim();
    if (val && !businessServices.includes(val)) {
      setBusinessServices([...businessServices, val]);
      setNewService('');
    }
  };

  const removeService = (svc) => {
    setBusinessServices(businessServices.filter(s => s !== svc));
  };

  const handleServiceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addService();
    }
  };

  // ─── Copy slug ───────────────────────────────────────────
  const copySlugUrl = () => {
    const url = `${window.location.origin}/seller/${businessSlug}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('¡Enlace copiado!');
    });
  };

  // ─── Format price ────────────────────────────────────────
  const formatPrice = (price) => {
    if (!price && price !== 0) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // ─── Loading State ───────────────────────────────────────
  if (loading) {
    return (
      <div className="bp-builder">
        <div className="bp-loading">
          <div className="bp-spinner" />
          <p className="bp-loading-text">Cargando tu perfil de negocio...</p>
        </div>
      </div>
    );
  }

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="bp-builder">
      {/* ── Top Bar ─────────────────────────────────────── */}
      <header className="bp-topbar">
        <div className="bp-topbar-left">
          <button className="bp-topbar-back" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </button>
          <div>
            <div className="bp-topbar-title">Editor de Página Web</div>
            <div className="bp-topbar-subtitle">Personaliza tu presencia profesional en línea</div>
          </div>
        </div>
        <div className="bp-topbar-actions">
          {businessSlug && (
            <a
              href={`/seller/${businessSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bp-topbar-preview"
            >
              👁 Vista previa
            </a>
          )}
          <button
            className="bp-topbar-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '⏳ Guardando...' : '💾 Guardar cambios'}
          </button>
        </div>
      </header>

      {/* ── Layout ──────────────────────────────────────── */}
      <div className="bp-layout">
        {/* ── Main Content ─────────────────────────────── */}
        <main className="bp-main">

          {/* Hero & Logo */}
          <div className="bp-card">
            <div className="bp-card-header">
              <div className="bp-card-icon">🖼</div>
              <div>
                <div className="bp-card-title">Imagen de Portada & Logo</div>
                <div className="bp-card-desc">La primera impresión de tu negocio</div>
              </div>
            </div>

            {/* Cover */}
            <label className="bp-hero-preview">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                style={{ display: 'none' }}
              />
              {coverUrl ? (
                <>
                  <img src={coverUrl} alt="Portada" />
                  <div className="bp-hero-overlay">
                    <span className="bp-hero-overlay-text">
                      {uploadingCover ? '⏳ Subiendo...' : '📷 Cambiar portada'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="bp-hero-empty">
                  <span className="bp-hero-empty-icon">🏞️</span>
                  <span>{uploadingCover ? 'Subiendo...' : 'Clic para subir portada'}</span>
                </div>
              )}
            </label>

            {/* Logo */}
            <label className="bp-logo-preview">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
              {logoUrl ? (
                <>
                  <img src={logoUrl} alt="Logo" />
                  <div className="bp-logo-overlay">
                    {uploadingLogo ? '⏳' : '📷'}
                  </div>
                </>
              ) : (
                <div className="bp-hero-empty" style={{ fontSize: 28 }}>
                  {uploadingLogo ? '⏳' : '＋'}
                </div>
              )}
            </label>

            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--bp-text)', margin: '0 0 4px' }}>
                {businessName || 'Nombre de tu negocio'}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--bp-text-muted)', margin: 0 }}>
                {businessHeadline || 'Tu eslogan o frase principal'}
              </p>
            </div>

            {/* Slug preview */}
            {businessSlug && (
              <div className="bp-slug-preview">
                <div className="bp-slug-url">
                  sumercemarket.com/seller/<strong>{businessSlug}</strong>
                </div>
                <button className="bp-slug-copy" onClick={copySlugUrl} type="button">
                  Copiar enlace
                </button>
              </div>
            )}
          </div>

          {/* Información Principal */}
          <div className="bp-card">
            <div className="bp-card-header">
              <div className="bp-card-icon">✏️</div>
              <div>
                <div className="bp-card-title">Información Principal</div>
                <div className="bp-card-desc">Datos básicos de tu negocio</div>
              </div>
            </div>

            <div className="bp-field-row">
              <div className="bp-form-group">
                <label className="bp-label">Nombre del negocio</label>
                <input
                  type="text"
                  className="bp-input"
                  placeholder="Ej: Mi Tienda Premium"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                />
              </div>
              <div className="bp-form-group">
                <label className="bp-label">Slug (URL)</label>
                <input
                  type="text"
                  className="bp-input"
                  placeholder="mi-tienda-premium"
                  value={businessSlug}
                  onChange={e => setBusinessSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  )}
                />
              </div>
            </div>

            <div className="bp-form-group">
              <label className="bp-label">Frase principal (headline)</label>
              <input
                type="text"
                className="bp-input"
                placeholder="Ej: Los mejores productos para tu hogar"
                value={businessHeadline}
                onChange={e => setBusinessHeadline(e.target.value)}
              />
            </div>

            <div className="bp-form-group">
              <label className="bp-label">Descripción corta</label>
              <textarea
                className="bp-textarea"
                placeholder="Describe brevemente tu negocio..."
                value={businessDescription}
                onChange={e => setBusinessDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bp-form-group">
              <label className="bp-label">Sobre tu negocio</label>
              <textarea
                className="bp-textarea"
                placeholder="Cuenta la historia y valores de tu negocio..."
                value={businessAbout}
                onChange={e => setBusinessAbout(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* Contacto y Ubicación */}
          <div className="bp-card">
            <div className="bp-card-header">
              <div className="bp-card-icon">📍</div>
              <div>
                <div className="bp-card-title">Contacto & Ubicación</div>
                <div className="bp-card-desc">¿Dónde te encuentran tus clientes?</div>
              </div>
            </div>

            <div className="bp-field-row">
              <div className="bp-form-group">
                <label className="bp-label">WhatsApp</label>
                <input
                  type="text"
                  className="bp-input"
                  placeholder="573001234567"
                  value={businessWhatsapp}
                  onChange={e => setBusinessWhatsapp(e.target.value)}
                />
              </div>
              <div className="bp-form-group">
                <label className="bp-label">Dirección</label>
                <input
                  type="text"
                  className="bp-input"
                  placeholder="Calle 123 #45-67"
                  value={businessAddress}
                  onChange={e => setBusinessAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="bp-field-row">
              <div className="bp-form-group">
                <label className="bp-label">Departamento</label>
                <select
                  className="bp-select"
                  value={businessDepartment}
                  onChange={e => setBusinessDepartment(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="bp-form-group">
                <label className="bp-label">Ciudad</label>
                <input
                  type="text"
                  className="bp-input"
                  placeholder="Ej: Bogotá"
                  value={businessCity}
                  onChange={e => setBusinessCity(e.target.value)}
                />
              </div>
            </div>

            <div className="bp-form-group">
              <label className="bp-label">Horario de atención</label>
              <input
                type="text"
                className="bp-input"
                placeholder="Ej: Lun-Vie 8am-6pm, Sáb 9am-2pm"
                value={businessSchedule}
                onChange={e => setBusinessSchedule(e.target.value)}
              />
            </div>
          </div>

          {/* Servicios */}
          <div className="bp-card">
            <div className="bp-card-header">
              <div className="bp-card-icon">⭐</div>
              <div>
                <div className="bp-card-title">Servicios</div>
                <div className="bp-card-desc">Agrega los servicios que ofreces</div>
              </div>
            </div>

            <div className="bp-services-input-wrap">
              {businessServices.map((svc, i) => (
                <span className="bp-service-tag" key={i}>
                  {svc}
                  <button
                    className="bp-service-tag-remove"
                    onClick={() => removeService(svc)}
                    type="button"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="bp-services-input"
                placeholder="Escribe y presiona Enter..."
                value={newService}
                onChange={e => setNewService(e.target.value)}
                onKeyDown={handleServiceKeyDown}
              />
            </div>
          </div>

          {/* Catálogo / Ofertas */}
          <div className="bp-card">
            <div className="bp-card-header">
              <div className="bp-card-icon">🛍</div>
              <div>
                <div className="bp-card-title">Mi Catálogo</div>
                <div className="bp-card-desc">Ofertas publicadas en tu página</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className="bp-catalog-count">{offers.length} ofertas</span>
              </div>
            </div>

            {offers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>📦</p>
                <p style={{ color: 'var(--bp-text-muted)', fontSize: 15 }}>
                  Aún no tienes ofertas publicadas.
                </p>
                <button
                  className="bp-btn-secondary"
                  style={{ width: 'auto', marginTop: 16 }}
                  onClick={() => navigate('/create-offer')}
                >
                  ＋ Crear primera oferta
                </button>
              </div>
            ) : (
              <div className="bp-offer-grid">
                {offers.map(offer => (
                  <div
                    className="bp-offer-card"
                    key={offer.id}
                    onClick={() => navigate(`/offers/${offer.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {offer.image_url ? (
                      <img className="bp-offer-img" src={offer.image_url} alt={offer.title} />
                    ) : (
                      <div className="bp-offer-img" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 36, color: 'var(--bp-text-muted)'
                      }}>
                        📷
                      </div>
                    )}
                    <div className="bp-offer-body">
                      <div className="bp-offer-title">{offer.title}</div>
                      <div className="bp-offer-price">{formatPrice(offer.price)}</div>
                      {offer.status && (
                        <span className={`bp-offer-status ${offer.status}`}>
                          {offer.status === 'active' ? '● Activa' :
                           offer.status === 'paused' ? '⏸ Pausada' :
                           offer.status === 'sold' ? '✓ Vendida' : offer.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>

        {/* ── Sidebar (Panel derecho) ──────────────────── */}
        <aside className="bp-sidebar">

          {/* Estado */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Estado</div>
            {businessSlug ? (
              <div className="bp-badge bp-badge-live">Página activa</div>
            ) : (
              <div className="bp-badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                Sin slug configurado
              </div>
            )}
          </div>

          {/* Plantilla */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Plantilla</div>
            <div className="bp-template-grid">
              {TEMPLATES.map(t => (
                <div
                  key={t.id}
                  className={`bp-template-option ${businessTemplate === t.id ? 'active' : ''}`}
                  onClick={() => setBusinessTemplate(t.id)}
                >
                  <span className="bp-template-emoji">{t.emoji}</span>
                  <span className="bp-template-name">{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Color primario */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Color Principal</div>
            <div className="bp-color-row">
              <div className="bp-color-swatch" style={{ background: businessPrimaryColor }}>
                <input
                  type="color"
                  value={businessPrimaryColor}
                  onChange={e => setBusinessPrimaryColor(e.target.value)}
                />
              </div>
              <span className="bp-color-hex">{businessPrimaryColor.toUpperCase()}</span>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Acciones rápidas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {businessSlug && (
                <a
                  href={`/seller/${businessSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bp-btn-secondary"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  👁 Ver mi página web
                </a>
              )}
              <button
                className="bp-btn-secondary"
                onClick={() => navigate('/create-offer')}
              >
                ＋ Nueva oferta
              </button>
              <button
                className="bp-btn-secondary"
                onClick={() => navigate('/my-offers')}
              >
                📋 Gestionar ofertas
              </button>
            </div>
          </div>

          {/* Guardar (sidebar) */}
          <div className="bp-sidebar-section" style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button
              className="bp-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '⏳ Guardando...' : '💾 Guardar todos los cambios'}
            </button>
          </div>

        </aside>
      </div>

      {/* ── Toast ───────────────────────────────────────── */}
      {toast && (
        <div className={`bp-toast bp-toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
}
