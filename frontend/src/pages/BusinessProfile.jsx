// BusinessProfile.jsx
// Página protegida en /business-profile.
// Permite a un vendedor editar y guardar sus datos de negocio
// en la tabla public.profiles (columnas business_*).
//
// Campos editables:
//   - business_name
//   - business_slug          (único, validado)
//   - business_description
//   - business_whatsapp
//   - business_address
//   - business_department    (Colombia)
//   - business_city          (depende del departamento)
//   - business_logo_url      (URL pública)
//   - business_cover_url     (URL pública)
//
// No toca campos de auth ni email. No usa Google/OAuth.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  DEPARTMENTS,
  citiesOf,
  isValidColombianPhone
} from '../data/colombia.js';

// Convierte un texto cualquiera en un slug seguro para URL.
function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // sin tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])?$/;

export default function BusinessProfile() {
  const { user, profile, refreshProfile, profileLoading } = useAuth();

  const [form, setForm] = useState({
    business_name: '',
    business_slug: '',
    business_description: '',
    business_whatsapp: '',
    business_address: '',
    business_department: '',
    business_city: '',
    business_logo_url: '',
    business_cover_url: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  // Cuando el perfil esté disponible, precargamos el formulario.
  useEffect(() => {
    if (!profile) return;
    setForm({
      business_name: profile.business_name || '',
      business_slug: profile.business_slug || '',
      business_description: profile.business_description || '',
      business_whatsapp: profile.business_whatsapp || '',
      business_address: profile.business_address || '',
      business_department: profile.business_department || '',
      business_city: profile.business_city || '',
      business_logo_url: profile.business_logo_url || '',
      business_cover_url: profile.business_cover_url || ''
    });
    setSlugTouched(Boolean(profile.business_slug));
  }, [profile]);

  const cities = useMemo(
    () => citiesOf(form.business_department),
    [form.business_department]
  );

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'business_department') next.business_city = '';
      // Si el usuario no ha tocado manualmente el slug, lo
      // sincronizamos con el nombre del negocio.
      if (field === 'business_name' && !slugTouched) {
        next.business_slug = slugify(value);
      }
      if (field === 'business_slug') {
        setSlugTouched(true);
        next.business_slug = slugify(value);
      }
      return next;
    });
  };

  const validate = () => {
    if (form.business_name.trim().length < 3) {
      return 'El nombre del negocio debe tener al menos 3 caracteres.';
    }
    if (!SLUG_REGEX.test(form.business_slug)) {
      return 'El slug debe tener entre 2 y 60 caracteres y solo letras, números y guiones.';
    }
    if (
      form.business_whatsapp &&
      !isValidColombianPhone(form.business_whatsapp)
    ) {
      return 'WhatsApp inválido (10 dígitos, empieza con 3).';
    }
    if (form.business_department && !form.business_city) {
      return 'Selecciona la ciudad del negocio.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user?.id) {
      setError('Debes iniciar sesión para guardar tu negocio.');
      return;
    }

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);
    try {
      // 1) Verificar que el slug no esté tomado por otro perfil.
      const { data: clash, error: clashErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('business_slug', form.business_slug)
        .neq('id', user.id)
        .maybeSingle();

      if (clashErr) throw clashErr;
      if (clash) {
        setError('Ese slug ya está en uso por otro vendedor. Prueba con otro.');
        setSaving(false);
        return;
      }

      // 2) Actualizar el perfil del vendedor.
      const payload = {
        business_name: form.business_name.trim(),
        business_slug: form.business_slug,
        business_description: form.business_description.trim() || null,
        business_whatsapp: form.business_whatsapp.trim() || null,
        business_address: form.business_address.trim() || null,
        business_department: form.business_department || null,
        business_city: form.business_city || null,
        business_logo_url: form.business_logo_url.trim() || null,
        business_cover_url: form.business_cover_url.trim() || null
      };

      const { data, error: upErr } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id)
        .select('id, business_slug');

      if (upErr) throw upErr;
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(
          'No se guardó. Verifica que las políticas RLS permiten actualizar tu perfil.'
        );
      }

      await refreshProfile();
      setSuccess('Tu negocio se guardó correctamente.');
    } catch (err) {
      setError(err?.message || 'No fue posible guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = form.business_slug ? `/seller/${form.business_slug}` : '';

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h1 style={styles.h1}>Mi negocio</h1>
        {publicUrl && profile?.business_slug ? (
          <Link to={publicUrl} className="btn btn-ghost">
            Ver mi tienda pública ↗
          </Link>
        ) : null}
      </div>

      <p style={styles.intro}>
        Configura los datos públicos de tu tienda. Cualquiera podrá visitarla en{' '}
        <code style={styles.code}>/seller/&lt;slug&gt;</code> y ver tus ofertas activas.
      </p>

      {profileLoading && !profile ? (
        <div className="loading">Cargando tu perfil…</div>
      ) : (
        <form className="card" onSubmit={handleSubmit} style={styles.form} noValidate>
          <PreviewBanner form={form} />

          <label style={styles.label}>
            Nombre del negocio *
            <input
              className="input"
              value={form.business_name}
              onChange={update('business_name')}
              maxLength={80}
              placeholder="Ej: Artesanías Sumercé"
              required
            />
          </label>

          <label style={styles.label}>
            Slug (URL pública) *
            <input
              className="input"
              value={form.business_slug}
              onChange={update('business_slug')}
              maxLength={60}
              placeholder="artesanias-sumerce"
              required
            />
            <span style={styles.hint}>
              Tu tienda estará en{' '}
              <code style={styles.code}>
                /seller/{form.business_slug || 'tu-slug'}
              </code>
            </span>
          </label>

          <label style={styles.label}>
            Descripción
            <textarea
              className="input"
              value={form.business_description}
              onChange={update('business_description')}
              rows={4}
              maxLength={1000}
              placeholder="Cuéntale a tus clientes qué vendes, desde cuándo y qué te hace especial."
              style={{ resize: 'vertical' }}
            />
          </label>

          <div style={styles.row}>
            <label style={{ ...styles.label, flex: 1 }}>
              WhatsApp
              <input
                type="tel"
                className="input"
                value={form.business_whatsapp}
                onChange={update('business_whatsapp')}
                maxLength={10}
                inputMode="numeric"
                placeholder="3001234567"
              />
            </label>
            <label style={{ ...styles.label, flex: 2 }}>
              Dirección
              <input
                className="input"
                value={form.business_address}
                onChange={update('business_address')}
                maxLength={200}
                placeholder="Carrera 7 # 12-34"
              />
            </label>
          </div>

          <div style={styles.row}>
            <label style={{ ...styles.label, flex: 1 }}>
              Departamento
              <select
                className="select"
                value={form.business_department}
                onChange={update('business_department')}
              >
                <option value="">Selecciona…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <label style={{ ...styles.label, flex: 1 }}>
              Ciudad
              <select
                className="select"
                value={form.business_city}
                onChange={update('business_city')}
                disabled={!form.business_department}
              >
                <option value="">
                  {form.business_department ? 'Selecciona…' : 'Elige depto. primero'}
                </option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <label style={styles.label}>
            URL del logo
            <input
              type="url"
              className="input"
              value={form.business_logo_url}
              onChange={update('business_logo_url')}
              maxLength={500}
              placeholder="https://..."
            />
          </label>

          <label style={styles.label}>
            URL de la portada
            <input
              type="url"
              className="input"
              value={form.business_cover_url}
              onChange={update('business_cover_url')}
              maxLength={500}
              placeholder="https://..."
            />
          </label>

          {error && <div className="error-msg">{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <div style={styles.actions}>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar negocio'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* -------------------- Vista previa -------------------- */

function PreviewBanner({ form }) {
  const hasCover = Boolean(form.business_cover_url);
  const hasLogo = Boolean(form.business_logo_url);
  return (
    <div style={styles.preview}>
      <div
        style={{
          ...styles.previewCover,
          backgroundImage: hasCover ? `url(${form.business_cover_url})` : 'none',
          background: hasCover
            ? `url(${form.business_cover_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
        }}
        aria-label="Vista previa de la portada"
      />
      <div style={styles.previewBody}>
        <div style={styles.previewLogo}>
          {hasLogo ? (
            <img
              src={form.business_logo_url}
              alt="Logo del negocio"
              style={styles.previewLogoImg}
            />
          ) : (
            <span style={{ fontSize: 28 }} aria-hidden>🛍️</span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={styles.previewName}>
            {form.business_name || 'Nombre de tu negocio'}
          </div>
          <div style={styles.previewMeta}>
            {(form.business_city || form.business_department)
              ? `${form.business_city || ''}${form.business_city && form.business_department ? ', ' : ''}${form.business_department || ''}`
              : 'Ciudad / Departamento'}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { paddingTop: 16 },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    padding: '0 8px'
  },
  h1: { margin: 0, fontSize: 24 },
  intro: {
    color: '#6b7280',
    padding: '0 8px',
    margin: '8px 0 16px 0'
  },
  code: {
    background: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 13
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginTop: 8
  },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#374151'
  },
  hint: {
    fontWeight: 400,
    fontSize: 12,
    color: '#6b7280'
  },
  success: {
    background: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4
  },
  preview: {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4
  },
  previewCover: {
    height: 120,
    width: '100%'
  },
  previewBody: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    padding: 12,
    background: '#fff'
  },
  previewLogo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    flexShrink: 0
  },
  previewLogoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  previewName: {
    fontWeight: 700,
    fontSize: 18,
    color: '#1a1f36',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  previewMeta: {
    fontSize: 13,
    color: '#6b7280'
  }
};
