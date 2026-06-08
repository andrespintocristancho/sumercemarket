// Publish.jsx
// Crea una nueva oferta en la tabla `offers`, sube imágenes al bucket
// `offer-images` y registra cada URL en la tabla `offer_images`.
//
// Notas sobre imágenes:
//   - ImageUploader devuelve archivos YA optimizados en el navegador
//     (redimensionados a 1200x1200 máx, WebP/JPEG q=0.75).
//   - Aquí simplemente subimos `images` tal cual (versión optimizada,
//     no la original pesada). Si el navegador no pudo optimizar,
//     ImageUploader ya hizo fallback al archivo original.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  DEPARTMENTS,
  citiesOf,
  CATEGORIES,
  isValidColombianPhone
} from '../data/colombia.js';
import ImageUploader from '../components/ImageUploader.jsx';

const BUCKET = 'offer-images';

export default function Publish() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    department: '',
    city: '',
    address: '',
    contact_phone: ''
  });
  const [images, setImages] = useState([]); // File[] (ya optimizados)
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  // Pre-rellena ubicación y teléfono desde el perfil si están vacíos
  useEffect(() => {
    if (!profile) return;
    setForm((prev) => ({
      ...prev,
      department: prev.department || profile.department || '',
      city: prev.city || profile.city || '',
      contact_phone: prev.contact_phone || profile.phone || ''
    }));
  }, [profile]);

  const cities = useMemo(() => citiesOf(form.department), [form.department]);

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'department') next.city = '';
      return next;
    });
  };

  const validate = () => {
    if (!user?.id) return 'Debes iniciar sesión para publicar.';
    if (form.title.trim().length < 4) return 'El título debe tener al menos 4 caracteres.';
    if (form.title.trim().length > 120) return 'El título es demasiado largo.';
    if (!form.category) return 'Selecciona una categoría.';
    const priceNum = Number(form.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return 'Ingresa un precio válido (0 o mayor).';
    }
    if (!form.department) return 'Selecciona el departamento.';
    if (!form.city) return 'Selecciona la ciudad.';
    if (!isValidColombianPhone(form.contact_phone)) {
      return 'El WhatsApp debe tener 10 dígitos y empezar por 3.';
    }
    if (images.length === 0) {
      return 'Agrega al menos una foto del producto.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    setProgress('Creando oferta…');

    let createdOfferId = null;
    const uploadedPaths = []; // para rollback de Storage si algo falla

    try {
      // 1) Insert oferta (sin image_url todavía; lo seteamos al final
      //    con la URL pública de la primera imagen).
      const payload = {
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        price: Number(form.price),
        department: form.department,
        city: form.city,
        address: form.address.trim() || null,
        contact_phone: String(form.contact_phone).trim(),
        contact_name: profile?.full_name || profile?.name || null,
        status: 'active'
      };

      const { data: offer, error: insertErr } = await supabase
        .from('offers')
        .insert(payload)
        .select('id')
        .single();

      if (insertErr) throw insertErr;
      createdOfferId = offer.id;

      // 2) Subir imágenes (ya optimizadas) al bucket
      const imageRows = [];
      let mainImageUrl = null;

      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        setProgress(`Subiendo imagen ${i + 1} de ${images.length}…`);

        const ext = guessExt(file);
        const path = `${user.id}/${createdOfferId}/${Date.now()}-${i}.${ext}`;
        const contentType = file.type || guessMimeFromExt(ext);

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType
          });

        if (upErr) throw upErr;
        uploadedPaths.push(path);

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        if (i === 0) mainImageUrl = pub.publicUrl;
        imageRows.push({
          offer_id: createdOfferId,
          url: pub.publicUrl,
          path,
          position: i
        });
      }

      // 3) Insert en offer_images
      if (imageRows.length > 0) {
        setProgress('Registrando imágenes…');
        const { error: imgErr } = await supabase
          .from('offer_images')
          .insert(imageRows);
        if (imgErr) throw imgErr;
      }

      // 4) Actualizar la oferta con la imagen principal
      if (mainImageUrl) {
        const { error: updErr } = await supabase
          .from('offers')
          .update({ image_url: mainImageUrl })
          .eq('id', createdOfferId);
        if (updErr) throw updErr;
      }

      setProgress('¡Listo!');
      navigate('/my-offers', { replace: true });
    } catch (err) {
      // Rollback best-effort
      try {
        if (uploadedPaths.length > 0) {
          await supabase.storage.from(BUCKET).remove(uploadedPaths);
        }
        if (createdOfferId) {
          await supabase.from('offers').delete().eq('id', createdOfferId);
        }
      } catch {
        /* silenciar errores de rollback */
      }
      setError(mapError(err?.message || ''));
    } finally {
      setSubmitting(false);
      setProgress('');
    }
  };

  return (
    <div style={styles.wrap}>
      <div className="card" style={styles.card}>
        <h1 style={styles.title}>Publicar oferta</h1>
        <p style={styles.subtitle}>
          Completa los datos del producto o servicio que quieres ofrecer.
        </p>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <label style={styles.label}>
            Título
            <input
              className="input"
              value={form.title}
              onChange={update('title')}
              placeholder="Ej: iPhone 13 128GB usado"
              maxLength={120}
              required
            />
          </label>

          <label style={styles.label}>
            Descripción
            <textarea
              className="input"
              value={form.description}
              onChange={update('description')}
              placeholder="Estado, detalles, motivo de venta, etc."
              rows={4}
              maxLength={2000}
              style={{ resize: 'vertical' }}
            />
          </label>

          <div style={styles.row}>
            <label style={{ ...styles.label, flex: 1 }}>
              Categoría
              <select
                className="select"
                value={form.category}
                onChange={update('category')}
                required
              >
                <option value="">Selecciona…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label style={{ ...styles.label, flex: 1 }}>
              Precio (COP)
              <input
                type="number"
                className="input"
                value={form.price}
                onChange={update('price')}
                placeholder="0"
                min="0"
                step="1000"
                inputMode="numeric"
                required
              />
            </label>
          </div>

          <div style={styles.row}>
            <label style={{ ...styles.label, flex: 1 }}>
              Departamento
              <select
                className="select"
                value={form.department}
                onChange={update('department')}
                required
              >
                <option value="">Selecciona…</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>

            <label style={{ ...styles.label, flex: 1 }}>
              Ciudad
              <select
                className="select"
                value={form.city}
                onChange={update('city')}
                disabled={!form.department}
                required
              >
                <option value="">
                  {form.department ? 'Selecciona…' : 'Elige depto. primero'}
                </option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <label style={styles.label}>
            Dirección (opcional)
            <input
              className="input"
              value={form.address}
              onChange={update('address')}
              placeholder="Barrio, punto de referencia…"
              maxLength={200}
            />
          </label>

          <label style={styles.label}>
            WhatsApp de contacto (10 dígitos, empieza con 3)
            <input
              type="tel"
              className="input"
              value={form.contact_phone}
              onChange={update('contact_phone')}
              inputMode="numeric"
              maxLength={10}
              placeholder="3001234567"
              required
            />
          </label>

          <ImageUploader
            value={images}
            onChange={setImages}
            disabled={submitting}
          />

          {error && <div className="error-msg" role="alert">{error}</div>}
          {progress && !error && (
            <div className="success-msg" role="status">{progress}</div>
          )}

          <div style={styles.actions}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Publicando…' : 'Publicar oferta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Prioriza el tipo MIME real del File (porque tras optimizar, el blob
// puede ser image/webp aunque el nombre original fuera .png). Cae al
// nombre del archivo y, en último caso, a 'jpg'.
function guessExt(file) {
  const mimeMap = {
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/png': 'png'
  };
  if (file?.type && mimeMap[file.type]) return mimeMap[file.type];

  const name = file?.name || '';
  if (name.includes('.')) {
    const fromName = name.split('.').pop().toLowerCase();
    if (fromName) return fromName;
  }
  return 'jpg';
}

function guessMimeFromExt(ext) {
  switch ((ext || '').toLowerCase()) {
    case 'webp': return 'image/webp';
    case 'png':  return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    default:     return 'image/jpeg';
  }
}

function mapError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('row-level security') || m.includes('rls')) {
    return 'No tienes permiso para realizar esta acción.';
  }
  if (m.includes('bucket') && m.includes('not found')) {
    return 'El bucket "offer-images" no existe en Supabase Storage.';
  }
  if (m.includes('payload too large')) {
    return 'Alguna imagen excede el tamaño permitido.';
  }
  return msg || 'No fue posible publicar la oferta.';
}

const styles = {
  wrap: { display: 'flex', justifyContent: 'center', padding: '24px 8px' },
  card: { width: '100%', maxWidth: 720 },
  title: { margin: '0 0 4px 0', fontSize: 24 },
  subtitle: { margin: '0 0 16px 0', color: '#6b7280', fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#374151'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8
  }
};
