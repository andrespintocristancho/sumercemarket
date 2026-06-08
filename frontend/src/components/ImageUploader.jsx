// ImageUploader.jsx
// Selección múltiple de imágenes con preview, validación de tipo/tamaño y
// posibilidad de quitar elementos antes de subir.
//
// NOVEDAD (optimización en navegador):
//   - Comprime cada imagen antes de exponerla al padre.
//   - Redimensiona a un máximo de MAX_WIDTH x MAX_HEIGHT manteniendo proporción.
//   - Convierte a WebP si el navegador puede; si no, JPEG. Quality 0.75.
//   - Usa canvas (createImageBitmap → fallback a HTMLImageElement).
//   - Si la optimización falla, deja el archivo ORIGINAL como fallback.
//   - El padre recibe en `value` los File ya optimizados.

import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_MB = 5;
const DEFAULT_MAX_FILES = 5;

// Límites de optimización
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const QUALITY = 0.75;

export default function ImageUploader({
  value = [],
  onChange,
  maxFiles = DEFAULT_MAX_FILES,
  maxSizeMB = DEFAULT_MAX_MB,
  accept = DEFAULT_ACCEPT,
  disabled = false,
  label = 'Fotos del producto'
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Genera URLs de preview y las libera al desmontar / cambiar lista.
  // Importante: previews se generan sobre los File ya optimizados,
  // así el usuario ve EXACTAMENTE lo que se va a subir.
  const previews = useMemo(
    () => value.map((file) => ({
      file,
      url: URL.createObjectURL(file)
    })),
    [value]
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previews]);

  const remaining = Math.max(0, maxFiles - value.length);

  const handleFiles = async (fileList) => {
    setError('');
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    const errors = [];
    const accepted = [];

    // 1) Validación previa de tipo y tamaño (sobre el archivo original)
    for (const f of incoming) {
      if (!accept.includes(f.type)) {
        errors.push(`Formato no permitido: ${f.name}`);
        continue;
      }
      if (f.size > maxSizeMB * 1024 * 1024) {
        errors.push(`Imagen muy grande (>${maxSizeMB}MB): ${f.name}`);
        continue;
      }
      accepted.push(f);
    }

    if (accepted.length === 0) {
      if (errors.length) setError(errors.join(' '));
      return;
    }

    // 2) Optimización en navegador (con fallback al archivo original)
    setBusy(true);
    const optimized = [];
    try {
      for (const f of accepted) {
        try {
          const out = await compressImage(f);
          optimized.push(out || f);
        } catch {
          // Si la compresión falla por cualquier razón, usamos el original
          optimized.push(f);
        }
      }
    } finally {
      setBusy(false);
    }

    // 3) Respeta el cupo restante
    const next = [...value, ...optimized].slice(0, maxFiles);

    if (value.length + optimized.length > maxFiles) {
      errors.push(`Solo puedes subir hasta ${maxFiles} imágenes.`);
    }

    if (errors.length) setError(errors.join(' '));
    onChange?.(next);
  };

  const onPick = (e) => {
    handleFiles(e.target.files);
    // Permitir volver a seleccionar el mismo archivo si se quita
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (disabled || busy) return;
    handleFiles(e.dataTransfer.files);
  };
  const onDragOver = (e) => e.preventDefault();

  const removeAt = (idx) => {
    const next = value.filter((_, i) => i !== idx);
    onChange?.(next);
    setError('');
  };

  const moveTo = (from, to) => {
    if (to < 0 || to >= value.length) return;
    const next = value.slice();
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange?.(next);
  };

  const openPicker = () => {
    if (!disabled && !busy) inputRef.current?.click();
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.label}>{label}</span>
        <span style={styles.counter}>
          {value.length} / {maxFiles}
        </span>
      </div>

      <div
        style={{
          ...styles.dropzone,
          ...(disabled || busy ? styles.dropzoneDisabled : null)
        }}
        onClick={openPicker}
        onDrop={onDrop}
        onDragOver={onDragOver}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPicker()}
        aria-label="Seleccionar imágenes"
        aria-busy={busy ? 'true' : 'false'}
      >
        <div style={styles.dropIcon} aria-hidden>📷</div>
        <div style={styles.dropTitle}>
          {busy
            ? 'Optimizando imágenes…'
            : remaining === 0
              ? 'Has alcanzado el límite de imágenes'
              : 'Haz clic o arrastra imágenes aquí'}
        </div>
        <div style={styles.dropHint}>
          JPG, PNG o WebP · máx. {maxSizeMB} MB · hasta {maxFiles} fotos
          {` · se optimizan a ${MAX_WIDTH}×${MAX_HEIGHT} WebP (q=${QUALITY})`}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept.join(',')}
          multiple
          hidden
          onChange={onPick}
          disabled={disabled || busy || remaining === 0}
        />
      </div>

      {error && <div className="error-msg" style={{ marginTop: 8 }}>{error}</div>}

      {value.length > 0 && (
        <ul style={styles.grid}>
          {previews.map((p, idx) => (
            <li key={`${p.file.name}-${idx}`} style={styles.thumb}>
              <img src={p.url} alt={p.file.name} style={styles.img} />
              {idx === 0 && <span style={styles.badge}>Principal</span>}
              <span style={styles.sizeBadge} title={p.file.type || ''}>
                {formatBytes(p.file.size)}
              </span>
              <div style={styles.thumbActions}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={styles.iconBtn}
                  onClick={() => moveTo(idx, idx - 1)}
                  disabled={idx === 0 || disabled || busy}
                  aria-label="Mover arriba"
                  title="Mover a izquierda"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={styles.iconBtn}
                  onClick={() => moveTo(idx, idx + 1)}
                  disabled={idx === value.length - 1 || disabled || busy}
                  aria-label="Mover abajo"
                  title="Mover a derecha"
                >
                  →
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={styles.iconBtn}
                  onClick={() => removeAt(idx)}
                  disabled={disabled || busy}
                  aria-label="Quitar imagen"
                  title="Quitar"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Optimización
// ────────────────────────────────────────────────────────────────────────────

/**
 * Comprime una imagen en el navegador:
 *   - Redimensiona a un máximo de MAX_WIDTH x MAX_HEIGHT manteniendo proporción.
 *   - Devuelve un nuevo File con extensión .webp (o .jpg de fallback).
 *   - Si el resultado fuese MÁS grande que el original, devuelve el original.
 *   - Si algo falla, lanza para que el llamador caiga al fallback.
 */
export async function compressImage(file) {
  if (!file || !(file instanceof Blob)) return file;

  // 1) Cargar como bitmap (rápido) o como HTMLImageElement (fallback)
  let bitmap = null;
  let img = null;
  let width = 0;
  let height = 0;

  if (typeof createImageBitmap === 'function') {
    try {
      bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
    } catch {
      bitmap = null;
    }
  }

  if (!bitmap) {
    img = await loadHtmlImage(file);
    width = img.naturalWidth;
    height = img.naturalHeight;
  }

  if (!width || !height) {
    throw new Error('No se pudieron leer las dimensiones de la imagen.');
  }

  // 2) Calcular nuevas dimensiones manteniendo proporción
  const { w, h } = fitInside(width, height, MAX_WIDTH, MAX_HEIGHT);

  // 3) Pintar en canvas
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D no disponible.');

  // Mejora la calidad al reescalar
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (bitmap) {
    ctx.drawImage(bitmap, 0, 0, w, h);
    if (typeof bitmap.close === 'function') bitmap.close();
  } else if (img) {
    ctx.drawImage(img, 0, 0, w, h);
  }

  // 4) Intentar WebP; si no, JPEG
  let blob = await canvasToBlob(canvas, 'image/webp', QUALITY);
  let outType = 'image/webp';
  let outExt = 'webp';

  if (!blob || blob.size === 0) {
    blob = await canvasToBlob(canvas, 'image/jpeg', QUALITY);
    outType = 'image/jpeg';
    outExt = 'jpg';
  }

  if (!blob) throw new Error('No se pudo generar la imagen optimizada.');

  // 5) Si la "optimización" pesa más que el original, devolver el original
  //    (manteniendo nombre y tipo). Mejor para fotos ya pequeñas.
  if (blob.size >= file.size) {
    return file;
  }

  const baseName = stripExt(file.name || 'image');
  const outName = `${baseName}.${outExt}`;
  return new File([blob], outName, {
    type: outType,
    lastModified: Date.now()
  });
}

function fitInside(srcW, srcH, maxW, maxH) {
  if (srcW <= maxW && srcH <= maxH) {
    return { w: srcW, h: srcH };
  }
  const ratio = Math.min(maxW / srcW, maxH / srcH);
  return {
    w: Math.max(1, Math.round(srcW * ratio)),
    h: Math.max(1, Math.round(srcH * ratio))
  };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), type, quality);
    } catch {
      resolve(null);
    }
  });
}

function loadHtmlImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      resolve(im);
    };
    im.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    im.src = url;
  });
}

function stripExt(name) {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(0, i) : name;
}

function formatBytes(n) {
  if (!Number.isFinite(n)) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 8 },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline'
  },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  counter: { fontSize: 12, color: '#6b7280' },
  dropzone: {
    border: '2px dashed #cbd5e1',
    background: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'background .15s ease, border-color .15s ease'
  },
  dropzoneDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  dropIcon: { fontSize: 32 },
  dropTitle: { fontSize: 14, fontWeight: 600, color: '#1f2937', marginTop: 4 },
  dropHint: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  grid: {
    listStyle: 'none',
    padding: 0,
    margin: '8px 0 0 0',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 8
  },
  thumb: {
    position: 'relative',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
    background: '#fff',
    aspectRatio: '1 / 1'
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    background: '#2563eb',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 999
  },
  sizeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    background: 'rgba(17,24,39,0.75)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 999
  },
  thumbActions: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    display: 'flex',
    gap: 4,
    justifyContent: 'space-between'
  },
  iconBtn: {
    padding: '4px 8px',
    fontSize: 12,
    borderRadius: 8
  }
};
