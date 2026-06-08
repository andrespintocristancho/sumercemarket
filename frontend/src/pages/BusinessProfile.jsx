import { useEffect, useRef, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useNavigate } from 'react-router-dom'
import '../styles/BusinessProfile.css'

const BUCKET = 'business-assets'

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

  const [profile, setProfile] = useState({
    business_name: '',
    business_description: '',
    business_category: '',
    business_phone: '',
    business_address: '',
    business_city: '',
    business_cover_url: '',
    business_logo_url: '',
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
          .select('business_name, business_description, business_category, business_phone, business_address, business_city, business_cover_url, business_logo_url')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error

        if (data && mounted) {
          setProfile((p) => ({
            ...p,
            business_name: data.business_name || '',
            business_description: data.business_description || '',
            business_category: data.business_category || '',
            business_phone: data.business_phone || '',
            business_address: data.business_address || '',
            business_city: data.business_city || '',
            business_cover_url: data.business_cover_url || '',
            business_logo_url: data.business_logo_url || '',
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

      // Mantener nombre estable, pero permitir webp/jpg.
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

      // Cache buster para que el navegador refresque la imagen.
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
      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: profile.business_name,
          business_description: profile.business_description,
          business_category: profile.business_category,
          business_phone: profile.business_phone,
          business_address: profile.business_address,
          business_city: profile.business_city,
        })
        .eq('id', userId)
      if (error) throw error
      setOkMsg('Datos del negocio guardados.')
    } catch (e) {
      console.error(e)
      setError('No se pudieron guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bp-loading">
        <p>Cargando perfil del negocio...</p>
      </div>
    )
  }

  return (
    <div className="bp-wrapper">
      {/* Portada estilo Facebook */}
      <div className="bp-cover">
        {profile.business_cover_url ? (
          <img
            src={profile.business_cover_url}
            alt="Portada del negocio"
            className="bp-cover-img"
          />
        ) : (
          <div className="bp-cover-empty">
            <span>Sin portada</span>
          </div>
        )}

        <button
          type="button"
          className="bp-cover-btn"
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
      <div className="bp-header">
        <div className="bp-logo-wrap">
          <div className="bp-logo">
            {profile.business_logo_url ? (
              <img
                src={profile.business_logo_url}
                alt="Logo del negocio"
                className="bp-logo-img"
              />
            ) : (
              <div className="bp-logo-empty">Logo</div>
            )}
          </div>

          <button
            type="button"
            className="bp-logo-btn"
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

        <div className="bp-title">
          <h1>{profile.business_name || 'Mi Negocio'}</h1>
          {profile.business_category && (
            <p className="bp-subtitle">{profile.business_category}</p>
          )}
        </div>

        <div className="bp-actions">
          <button
            type="button"
            className="bp-btn-secondary"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
          >
            {uploadingLogo ? 'Subiendo logo...' : 'Cambiar logo'}
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {error && <div className="bp-alert bp-alert-error">{error}</div>}
      {okMsg && <div className="bp-alert bp-alert-ok">{okMsg}</div>}

      {/* Formulario de datos del negocio */}
      <form className="bp-form" onSubmit={handleSave}>
        <h2>Información del negocio</h2>

        <div className="bp-grid">
          <div className="bp-field">
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

          <div className="bp-field">
            <label htmlFor="business_category">Categoría</label>
            <input
              id="business_category"
              name="business_category"
              type="text"
              value={profile.business_category}
              onChange={handleChange}
              placeholder="Ej: Alimentos, Moda, Tecnología"
            />
          </div>

          <div className="bp-field">
            <label htmlFor="business_phone">Teléfono</label>
            <input
              id="business_phone"
              name="business_phone"
              type="tel"
              value={profile.business_phone}
              onChange={handleChange}
              placeholder="Ej: 3001234567"
            />
          </div>

          <div className="bp-field">
            <label htmlFor="business_city">Ciudad</label>
            <input
              id="business_city"
              name="business_city"
              type="text"
              value={profile.business_city}
              onChange={handleChange}
              placeholder="Ej: Bogotá"
            />
          </div>

          <div className="bp-field bp-field-full">
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

          <div className="bp-field bp-field-full">
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

        <div className="bp-form-actions">
          <button type="submit" className="bp-btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
