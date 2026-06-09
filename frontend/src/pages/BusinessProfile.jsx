import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

const BUCKET = 'business-assets'

// Plantillas disponibles para la mini web pública del vendedor.
// Los valores DEBEN coincidir con el CHECK constraint
// `profiles_business_template_check` definido en
// `supabase/business-templates.sql`.
const TEMPLATE_OPTIONS = [
  { value: 'store',    label: 'Tienda general',          emoji: '🛍️' },
  { value: 'fashion',  label: 'Moda / Ropa / Zapatos',   emoji: '👗' },
  { value: 'beauty',   label: 'Belleza',                 emoji: '💄' },
  { value: 'health',   label: 'Salud / Odontología',     emoji: '🩺' },
  { value: 'gym',      label: 'Gym / Deportes',          emoji: '🏋️' },
  { value: 'vehicles', label: 'Vehículos',               emoji: '🚗' },
  { value: 'food',     label: 'Plaza / Alimentos',       emoji: '🥬' },
  { value: 'services', label: 'Servicios',               emoji: '🛠️' },
]

const DEFAULT_PRIMARY_COLOR = '#2563eb'

// Lista única de columnas de perfil a leer/escribir.
const PROFILE_COLUMNS = [
  'business_name',
  'business_slug',
  'business_description',
  'business_logo_url',
  'business_cover_url',
  'business_whatsapp',
  'business_address',
  'business_department',
  'business_city',
  'business_template',
  'business_headline',
  'business_about',
  'business_schedule',
  'business_primary_color',
]

// Genera un slug URL-safe a partir de un texto libre.
function slugify(input) {
  return (input || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

// Valida un color HEX (#rgb o #rrggbb). Si no es válido, devuelve el default.
function normalizeHex(color) {
  if (!color) return DEFAULT_PRIMARY_COLOR
  const c = String(color).trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c)) return c
  return DEFAULT_PRIMARY_COLOR
}

// Aplica los datos crudos de Supabase al estado local del formulario.
function mapDbToState(data) {
  return {
    business_name: data?.business_name || '',
    business_slug: data?.business_slug || '',
    business_description: data?.business_description || '',
    business_logo_url: data?.business_logo_url || '',
    business_cover_url: data?.business_cover_url || '',
    business_whatsapp: data?.business_whatsapp || '',
    business_address: data?.business_address || '',
    business_department: data?.business_department || '',
    business_city: data?.business_city || '',
    business_template: data?.business_template || 'store',
    business_headline: data?.business_headline || '',
    business_about: data?.business_about || '',
    business_schedule: data?.business_schedule || '',
    business_primary_color: normalizeHex(data?.business_primary_color),
  }
}

// Optimiza una imagen en el navegador usando canvas.
// Devuelve { blob, ext, mime } intentando WebP y haciendo fallback a JPG.
async function optimizeImage(file, maxW, maxH, quality = 0.75) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const img = await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })

  // Escalar manteniendo aspecto, sin agrandar.
  const ratio = Math.min(maxW / img.width, maxH / img.height, 1)
  const targetW = Math.round(img.width * ratio)
  const targetH = Math.round(img.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, targetW, targetH)

  // Intentar WebP
  const webpBlob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/webp', quality)
  )
  if (webpBlob && webpBlob.size > 0) {
    return { blob: webpBlob, ext: 'webp', mime: 'image/webp' }
  }

  // Fallback JPG
  const jpgBlob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  )
  return { blob: jpgBlob, ext: 'jpg', mime: 'image/jpeg' }
}

// Asegura que exista una fila en `profiles` para este usuario.
// Si no existe, la crea con id = user.id y role = 'user'.
// Devuelve la fila final (existente o recién creada) o null si falla.
async function ensureProfileRow(user) {
  if (!user) return null

  // 1) ¿Ya existe?
  const { data: existing, error: selErr } = await supabase
    .from('profiles')
    .select(['id', ...PROFILE_COLUMNS].join(', '))
    .eq('id', user.id)
    .maybeSingle()

  if (selErr) throw selErr
  if (existing) return existing

  // 2) Insertar fila mínima. Si el schema no acepta `role`, reintentamos sin él.
  const baseRow = {
    id: user.id,
    business_template: 'store',
    business_primary_color: DEFAULT_PRIMARY_COLOR,
  }

  let insertRes = await supabase
    .from('profiles')
    .insert({ ...baseRow, role: 'user' })
    .select(['id', ...PROFILE_COLUMNS].join(', '))
    .maybeSingle()

  if (insertRes.error) {
    const msg = insertRes.error.message || ''
    // Si la columna `role` no existe o no acepta ese valor, reintentar sin role.
    if (/role/i.test(msg) || insertRes.error.code === '42703') {
      insertRes = await supabase
        .from('profiles')
        .insert(baseRow)
        .select(['id', ...PROFILE_COLUMNS].join(', '))
        .maybeSingle()
    }
  }

  if (insertRes.error) {
    // Posible carrera: otro proceso creó la fila justo antes. Volvemos a leer.
    if (insertRes.error.code === '23505') {
      const { data: again } = await supabase
        .from('profiles')
        .select(['id', ...PROFILE_COLUMNS].join(', '))
        .eq('id', user.id)
        .maybeSingle()
      if (again) return again
    }
    throw insertRes.error
  }

  return insertRes.data
}

export default function BusinessProfile() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')

  const [profile, setProfile] = useState({
    business_name: '',
    business_slug: '',
    business_description: '',
    business_logo_url: '',
    business_cover_url: '',
    business_whatsapp: '',
    business_address: '',
    business_department: '',
    business_city: '',
    business_template: 'store',
    business_headline: '',
    business_about: '',
    business_schedule: '',
    business_primary_color: DEFAULT_PRIMARY_COLOR,
  })

  const coverInputRef = useRef(null)
  const logoInputRef = useRef(null)

  // Vuelve a leer el perfil desde Supabase y refresca el estado.
  async function reloadProfile(uid) {
    const id = uid || userId
    if (!id) return null
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS.join(', '))
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (data) {
      setProfile(mapDbToState(data))
    }
    return data
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/login')
          return
        }
        if (!mounted) return
        setUserId(user.id)

        // 1) Garantizar fila en profiles (crea si no existe).
        const row = await ensureProfileRow(user)
        if (!mounted) return
        if (row) {
          setProfile(mapDbToState(row))
        }
      } catch (e) {
        console.error(e)
        setError('No se pudo cargar el perfil del negocio.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [navigate])

  function handleChange(e) {
    const { name, value } = e.target
    setProfile((p) => ({ ...p, [name]: value }))
  }

  function handleSlugChange(e) {
    setProfile((p) => ({ ...p, business_slug: slugify(e.target.value) }))
  }

  async function uploadAsset(file, kind) {
    if (!userId) return
    setError('')
    setOkMsg('')

    const isCover = kind === 'cover'
    const maxW = isCover ? 1600 : 600
    const maxH = isCover ? 600 : 600

    if (isCover) setUploadingCover(true)
    else setUploadingLogo(true)

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen.')
      }

      const { blob, ext, mime } = await optimizeImage(file, maxW, maxH, 0.75)
      if (!blob) throw new Error('No se pudo procesar la imagen.')

      const fileName = isCover ? `cover.${ext}` : `logo.${ext}`
      const path = `${userId}/${fileName}`

      const { error: upErr } = await supabase
        .storage
        .from(BUCKET)
        .upload(path, blob, {
          contentType: mime,
          upsert: true,
          cacheControl: '3600',
        })

      if (upErr) throw upErr

      const { data: pub } = supabase
        .storage
        .from(BUCKET)
        .getPublicUrl(path)

      // Cache buster para refrescar la imagen en el navegador.
      const publicUrl = `${pub.publicUrl}?v=${Date.now()}`

      const column = isCover ? 'business_cover_url' : 'business_logo_url'

      // UPSERT seguro: si por alguna razón aún no existe la fila, se crea.
      const { data: upserted, error: dbErr } = await supabase
        .from('profiles')
        .upsert(
          { id: userId, [column]: publicUrl },
          { onConflict: 'id' }
        )
        .select(PROFILE_COLUMNS.join(', '))
        .maybeSingle()

      if (dbErr) throw dbErr

      if (upserted) {
        setProfile(mapDbToState(upserted))
      } else {
        setProfile((p) => ({ ...p, [column]: publicUrl }))
      }
      setOkMsg(isCover ? 'Portada actualizada.' : 'Logo actualizado.')
    } catch (e) {
      console.error(e)
      setError(e.message || 'Error al subir la imagen.')
    } finally {
      if (isCover) setUploadingCover(false)
      else setUploadingLogo(false)
    }
  }

  function onCoverChange(e) {
    const file = e.target.files?.[0]
    if (file) uploadAsset(file, 'cover')
    e.target.value = ''
  }

  function onLogoChange(e) {
    const file = e.target.files?.[0]
    if (file) uploadAsset(file, 'logo')
    e.target.value = ''
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setError('')
    setOkMsg('')
    try {
      // Normalizamos el slug por si el usuario lo dejó con espacios.
      const cleanSlug = slugify(profile.business_slug)

      // Validamos plantilla contra el listado permitido.
      const allowedTemplates = TEMPLATE_OPTIONS.map((t) => t.value)
      const cleanTemplate = allowedTemplates.includes(profile.business_template)
        ? profile.business_template
        : 'store'

      const cleanColor = normalizeHex(profile.business_primary_color)

      // Payload de UPSERT. Incluimos id para el conflict target.
      const payload = {
        id: userId,
        business_name: profile.business_name || null,
        business_slug: cleanSlug || null,
        business_description: profile.business_description || null,
        business_logo_url: profile.business_logo_url || null,
        business_cover_url: profile.business_cover_url || null,
        business_whatsapp: profile.business_whatsapp || null,
        business_address: profile.business_address || null,
        business_department: profile.business_department || null,
        business_city: profile.business_city || null,
        business_template: cleanTemplate,
        business_headline: profile.business_headline || null,
        business_about: profile.business_about || null,
        business_schedule: profile.business_schedule || null,
        business_primary_color: cleanColor,
      }

      // UPSERT con detección real de filas afectadas:
      // pedimos `select(...)` para obtener la fila persistida.
      const { data: saved, error: upErr } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select(PROFILE_COLUMNS.join(', '))
        .maybeSingle()

      if (upErr) throw upErr

      if (!saved) {
        // No hubo fila confirmada => no confirmamos éxito.
        throw new Error('Supabase no confirmó el guardado.')
      }

      // Re-lectura fresca desde Supabase para asegurar consistencia
      // (RLS, triggers, normalizaciones del servidor, etc.).
      const fresh = await reloadProfile(userId)
      if (!fresh) {
        throw new Error('Los datos se guardaron pero no se pudieron releer.')
      }

      setOkMsg('Datos del negocio guardados correctamente.')
    } catch (e) {
      console.error(e)
      const msg = e?.message || ''
      // Slug duplicado típico: violación de índice único.
      if (e && (e.code === '23505' || /duplicate|unique/i.test(msg))) {
        if (/business_slug/i.test(msg) || /slug/i.test(msg)) {
          setError(
            'Ese identificador de tienda (slug) ya está en uso por otro negocio. ' +
            'Prueba con otro slug.'
          )
        } else {
          setError('Ya existe un registro con esos datos. Verifica el slug u otros campos únicos.')
        }
      } else if (e && /business_template/i.test(msg)) {
        setError('La plantilla seleccionada no es válida.')
      } else if (/permission|denied|rls/i.test(msg)) {
        setError('No tienes permisos para guardar este perfil. Vuelve a iniciar sesión.')
      } else {
        setError(msg || 'No se pudieron guardar los cambios.')
      }
    } finally {
      setSaving(false)
    }
  }

  // Estilos inline mínimos para no depender de un CSS externo.
  const styles = {
    cover: {
      position: 'relative',
      width: '100%',
      height: '260px',
      background: '#e4e6eb',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '64px',
    },
    coverImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
    },
    coverEmpty: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#65676b',
      fontWeight: 600,
    },
    coverBtn: {
      position: 'absolute',
      right: '16px',
      bottom: '16px',
      padding: '8px 14px',
      borderRadius: '8px',
      border: '0',
      background: 'rgba(0,0,0,0.65)',
      color: '#fff',
      cursor: 'pointer',
      fontWeight: 600,
    },
    header: {
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-end',
      gap: '16px',
      marginTop: '-80px',
      padding: '0 16px',
      flexWrap: 'wrap',
    },
    logoWrap: {
      position: 'relative',
      width: '140px',
      height: '140px',
    },
    logo: {
      width: '140px',
      height: '140px',
      borderRadius: '50%',
      background: '#fff',
      border: '4px solid #fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    logoEmpty: {
      color: '#65676b',
      fontWeight: 700,
    },
    logoBtn: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      border: '2px solid #fff',
      background: '#1877f2',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '16px',
      lineHeight: 1,
    },
    title: {
      flex: 1,
      minWidth: '200px',
      paddingBottom: '8px',
    },
    subtitle: {
      color: '#65676b',
      margin: '4px 0 0',
      fontSize: '14px',
    },
    actions: {
      paddingBottom: '8px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '12px',
      marginTop: '16px',
    },
    fieldFull: {
      gridColumn: '1 / -1',
    },
    formActions: {
      marginTop: '16px',
      display: 'flex',
      justifyContent: 'flex-end',
    },
    sectionCard: {
      marginTop: 32,
      padding: '20px',
      background: '#fff',
      border: '1px solid #e4e6eb',
      borderRadius: '12px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '8px',
      marginBottom: '8px',
    },
    sectionTitle: {
      margin: 0,
      fontSize: '20px',
    },
    sectionHint: {
      color: '#65676b',
      fontSize: '14px',
      margin: 0,
    },
    templateGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '10px',
      marginTop: '12px',
    },
    templateCardBase: {
      cursor: 'pointer',
      border: '2px solid #e4e6eb',
      borderRadius: '10px',
      padding: '12px',
      background: '#fafbfc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '6px',
      transition: 'border-color 120ms ease, background 120ms ease',
      userSelect: 'none',
    },
    templateEmoji: {
      fontSize: '22px',
      lineHeight: 1,
    },
    templateLabel: {
      fontWeight: 600,
      fontSize: '14px',
      color: '#1c1e21',
    },
    templateValue: {
      fontSize: '12px',
      color: '#65676b',
    },
    colorRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
    },
    colorSwatch: (color) => ({
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: color,
      border: '2px solid #fff',
      boxShadow: '0 0 0 1px #e4e6eb',
    }),
    colorInput: {
      width: '52px',
      height: '40px',
      padding: 0,
      border: '1px solid #e4e6eb',
      borderRadius: '8px',
      background: '#fff',
      cursor: 'pointer',
    },
    colorText: {
      width: '110px',
    },
  }

  if (loading) {
    return (
      <div className="container">
        <p>Cargando perfil del negocio...</p>
      </div>
    )
  }

  const primaryColor = normalizeHex(profile.business_primary_color)

  return (
    <div className="container">
      {/* Portada estilo Facebook */}
      <div style={styles.cover}>
        {profile.business_cover_url ? (
          <img
            src={profile.business_cover_url}
            alt="Portada del negocio"
            style={styles.coverImg}
          />
        ) : (
          <div style={styles.coverEmpty}>
            <span>Sin portada</span>
          </div>
        )}

        <button
          type="button"
          style={styles.coverBtn}
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
        >
          {uploadingCover ? 'Subiendo...' : '📷 Cambiar portada'}
        </button>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={onCoverChange}
          hidden
        />
      </div>

      {/* Cabecera con logo */}
      <div style={styles.header}>
        <div style={styles.logoWrap}>
          <div style={styles.logo}>
            {profile.business_logo_url ? (
              <img
                src={profile.business_logo_url}
                alt="Logo del negocio"
                style={styles.logoImg}
              />
            ) : (
              <div style={styles.logoEmpty}>Logo</div>
            )}
          </div>

          <button
            type="button"
            style={styles.logoBtn}
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
            title="Cambiar logo"
          >
            {uploadingLogo ? '...' : '✏️'}
          </button>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={onLogoChange}
            hidden
          />
        </div>

        <div style={styles.title}>
          <h1 style={{ margin: 0 }}>{profile.business_name || 'Mi Negocio'}</h1>
          {profile.business_slug && (
            <p style={styles.subtitle}>
              URL pública: <code>/seller/{profile.business_slug}</code>
            </p>
          )}
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
          >
            {uploadingLogo ? 'Subiendo logo...' : 'Cambiar logo'}
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
      {okMsg && <div className="alert alert-success" style={{ marginTop: 16 }}>{okMsg}</div>}

      {/* Formulario de datos del negocio */}
      <form onSubmit={handleSave} style={{ marginTop: 24 }}>
        <h2>Información del negocio</h2>

        <div style={styles.grid}>
          <div className="form-group">
            <label htmlFor="business_name">Nombre del negocio</label>
            <input
              id="business_name"
              name="business_name"
              type="text"
              value={profile.business_name}
              onChange={handleChange}
              placeholder="Ej: Panadería La Espiga"
            />
          </div>

          <div className="form-group">
            <label htmlFor="business_slug">
              Identificador de tienda (slug)
            </label>
            <input
              id="business_slug"
              name="business_slug"
              type="text"
              value={profile.business_slug}
              onChange={handleSlugChange}
              placeholder="ej: panaderia-la-espiga"
            />
            <small>Se usa en la URL pública: /seller/&lt;slug&gt;</small>
          </div>

          <div className="form-group">
            <label htmlFor="business_whatsapp">WhatsApp</label>
            <input
              id="business_whatsapp"
              name="business_whatsapp"
              type="tel"
              value={profile.business_whatsapp}
              onChange={handleChange}
              placeholder="Ej: 573001234567"
            />
            <small>Incluye indicativo del país sin signos (ej: 57…).</small>
          </div>

          <div className="form-group">
            <label htmlFor="business_department">Departamento</label>
            <input
              id="business_department"
              name="business_department"
              type="text"
              value={profile.business_department}
              onChange={handleChange}
              placeholder="Ej: Boyacá"
            />
          </div>

          <div className="form-group">
            <label htmlFor="business_city">Ciudad / Municipio</label>
            <input
              id="business_city"
              name="business_city"
              type="text"
              value={profile.business_city}
              onChange={handleChange}
              placeholder="Ej: Tunja"
            />
          </div>

          <div className="form-group" style={styles.fieldFull}>
            <label htmlFor="business_address">Dirección</label>
            <input
              id="business_address"
              name="business_address"
              type="text"
              value={profile.business_address}
              onChange={handleChange}
              placeholder="Ej: Calle 123 #45-67"
            />
          </div>

          <div className="form-group" style={styles.fieldFull}>
            <label htmlFor="business_description">Descripción</label>
            <textarea
              id="business_description"
              name="business_description"
              rows="4"
              value={profile.business_description}
              onChange={handleChange}
              placeholder="Cuenta a tus clientes qué ofreces..."
            />
          </div>
        </div>

        {/* === Sección: Diseño de mi página === */}
        <section style={styles.sectionCard} aria-labelledby="design-section-title">
          <div style={styles.sectionHeader}>
            <h2 id="design-section-title" style={styles.sectionTitle}>
              🎨 Diseño de mi página
            </h2>
            <p style={styles.sectionHint}>
              Personaliza cómo se verá tu mini web pública en <code>/seller/{profile.business_slug || 'tu-slug'}</code>.
            </p>
          </div>

          {/* Selector de plantilla con tarjetas */}
          <div className="form-group" style={styles.fieldFull}>
            <label htmlFor="business_template">Plantilla del negocio</label>
            <small style={{ display: 'block', marginBottom: 8 }}>
              Elige la plantilla que mejor describe tu negocio. Cada plantilla
              tiene un estilo visual pensado para ese tipo de actividad.
            </small>

            {/* Tarjetas accesibles via radiogroup */}
            <div
              role="radiogroup"
              aria-label="Plantilla del negocio"
              style={styles.templateGrid}
            >
              {TEMPLATE_OPTIONS.map((opt) => {
                const selected = profile.business_template === opt.value
                const cardStyle = {
                  ...styles.templateCardBase,
                  borderColor: selected ? primaryColor : '#e4e6eb',
                  background: selected ? '#f0f6ff' : '#fafbfc',
                  outline: selected ? `0` : 'none',
                  boxShadow: selected
                    ? `0 0 0 2px ${primaryColor}33`
                    : 'none',
                }
                return (
                  <div
                    key={opt.value}
                    role="radio"
                    aria-checked={selected}
                    tabIndex={0}
                    onClick={() =>
                      setProfile((p) => ({ ...p, business_template: opt.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setProfile((p) => ({ ...p, business_template: opt.value }))
                      }
                    }}
                    style={cardStyle}
                  >
                    <span style={styles.templateEmoji} aria-hidden="true">
                      {opt.emoji}
                    </span>
                    <span style={styles.templateLabel}>{opt.label}</span>
                    <span style={styles.templateValue}>{opt.value}</span>
                  </div>
                )
              })}
            </div>

            {/* Select nativo como fallback accesible y para móviles */}
            <select
              id="business_template"
              name="business_template"
              value={profile.business_template}
              onChange={handleChange}
              style={{ marginTop: 12, maxWidth: 360 }}
            >
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.grid}>
            <div className="form-group" style={styles.fieldFull}>
              <label htmlFor="business_headline">Titular destacado</label>
              <input
                id="business_headline"
                name="business_headline"
                type="text"
                value={profile.business_headline}
                onChange={handleChange}
                maxLength={120}
                placeholder="Ej: Pan artesanal recién horneado todos los días"
              />
              <small>
                Frase corta que aparece grande en tu página pública. Máx. 120 caracteres.
              </small>
            </div>

            <div className="form-group" style={styles.fieldFull}>
              <label htmlFor="business_about">Sobre el negocio</label>
              <textarea
                id="business_about"
                name="business_about"
                rows="5"
                value={profile.business_about}
                onChange={handleChange}
                placeholder="Cuenta tu historia, qué te hace único, desde cuándo atiendes, etc."
              />
              <small>Texto largo que aparece en la sección “Sobre nosotros”.</small>
            </div>

            <div className="form-group" style={styles.fieldFull}>
              <label htmlFor="business_schedule">Horario de atención</label>
              <textarea
                id="business_schedule"
                name="business_schedule"
                rows="3"
                value={profile.business_schedule}
                onChange={handleChange}
                placeholder={'Ej:\nLunes a viernes: 8:00 a.m. – 6:00 p.m.\nSábados: 8:00 a.m. – 1:00 p.m.\nDomingos: cerrado'}
              />
              <small>Puedes usar varias líneas. Texto libre.</small>
            </div>

            <div className="form-group" style={styles.fieldFull}>
              <label htmlFor="business_primary_color">Color principal</label>
              <div style={styles.colorRow}>
                <input
                  id="business_primary_color"
                  name="business_primary_color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      business_primary_color: e.target.value,
                    }))
                  }
                  style={styles.colorInput}
                  aria-label="Selector de color principal"
                />
                <input
                  type="text"
                  value={profile.business_primary_color}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      business_primary_color: e.target.value,
                    }))
                  }
                  placeholder="#2563eb"
                  style={styles.colorText}
                  aria-label="Código HEX del color principal"
                />
                <div
                  aria-hidden="true"
                  style={styles.colorSwatch(primaryColor)}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      business_primary_color: DEFAULT_PRIMARY_COLOR,
                    }))
                  }
                >
                  Restablecer
                </button>
              </div>
              <small>
                Color principal de tu mini web pública (botones, acentos).
                Formato HEX, p. ej. <code>#2563eb</code>.
              </small>
            </div>
          </div>
        </section>

        <div style={styles.formActions}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
