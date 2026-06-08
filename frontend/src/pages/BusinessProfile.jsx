import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

const BUCKET = 'business-assets'

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

export default function BusinessProfile() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')

  // Columnas reales de profiles para el negocio:
  // business_name, business_slug, business_description,
  // business_logo_url, business_cover_url, business_whatsapp,
  // business_address, business_department, business_city
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
  })

  const coverInputRef = useRef(null)
  const logoInputRef = useRef(null)

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

        const { data, error } = await supabase
          .from('profiles')
          .select('business_name, business_slug, business_description, business_logo_url, business_cover_url, business_whatsapp, business_address, business_department, business_city')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error

        if (data && mounted) {
          setProfile((p) => ({
            ...p,
            business_name: data.business_name || '',
            business_slug: data.business_slug || '',
            business_description: data.business_description || '',
            business_logo_url: data.business_logo_url || '',
            business_cover_url: data.business_cover_url || '',
            business_whatsapp: data.business_whatsapp || '',
            business_address: data.business_address || '',
            business_department: data.business_department || '',
            business_city: data.business_city || '',
          }))
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

      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ [column]: publicUrl })
        .eq('id', userId)

      if (dbErr) throw dbErr

      setProfile((p) => ({ ...p, [column]: publicUrl }))
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

      const payload = {
        business_name: profile.business_name || null,
        business_slug: cleanSlug || null,
        business_description: profile.business_description || null,
        business_whatsapp: profile.business_whatsapp || null,
        business_address: profile.business_address || null,
        business_department: profile.business_department || null,
        business_city: profile.business_city || null,
      }

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)
      if (error) throw error

      setProfile((p) => ({ ...p, business_slug: cleanSlug }))
      setOkMsg('Datos del negocio guardados.')
    } catch (e) {
      console.error(e)
      // Slug duplicado típico: violación de índice único.
      if (e && (e.code === '23505' || /duplicate|unique/i.test(e.message || ''))) {
        setError('Ese identificador de tienda (slug) ya está en uso. Prueba con otro.')
      } else {
        setError('No se pudieron guardar los cambios.')
      }
    } finally {
      setSaving(false)
    }
  }

  // Estilos inline mínimos para no depender de un CSS externo.
  // Las clases base (container, btn, btn-primary, btn-secondary, alert, etc.)
  // se asumen presentes en App.css; aquí solo añadimos lo específico
  // (portada y logo circular estilo Facebook).
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
  }

  if (loading) {
    return (
      <div className="container">
        <p>Cargando perfil del negocio...</p>
      </div>
    )
  }

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

        <div style={styles.formActions}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
