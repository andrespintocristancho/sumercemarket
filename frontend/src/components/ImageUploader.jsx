// ImageUploader.jsx
// Selección múltiple de imágenes con preview, validación de tipo/tamaño y
// posibilidad de quitar elementos antes de subir. No sube nada por sí mismo:
// expone los File seleccionados al padre vía onChange(files).

import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_MB = 5;
const DEFAULT_MAX_FILES = 5;

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

  // Genera URLs de preview y las libera al desmontar / cambiar lista
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

  const handleFiles = (fileList) => {
    setError('');
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    const valid = [];
    const errors = [];

    for (const f of incoming) {
      if (!accept.includes(f.type)) {
        errors.push(`Formato no permitido: ${f.name}`);
        continue;
      }
      if (f.size > maxSizeMB * 1024 * 1024) {
        errors.push(`Imagen muy grande (>${maxSizeMB}MB): ${f.name}`);
        continue;
      }
      valid.push(f);
    }

    // Respeta el cupo restante
    const next = [...value, ...valid].slice(0, maxFiles);

    if (value.length + valid.length > maxFiles) {
      errors.push(`Solo puedes subir hasta ${maxFiles} imágenes.`);
    }

    if (errors.length) setError(errors.join(' '));
    onChange?.(next);
  };

  const onPick = (e) => handleFiles(e.target.files);
  const onDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
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
    if (!disabled) inputRef.current?.click();
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
          ...(disabled ? styles.dropzoneDisabled : null)
        }}
        onClick={openPicker}
        onDrop={onDrop}
        onDragOver={onDragOver}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPicker()}
        aria-label="Seleccionar imágenes"
      >
        <div style={styles.dropIcon} aria-hidden>📷</div>
        <div style={styles.dropTitle}>
          {remaining === 0
            ? 'Has alcanzado el límite de imágenes'
            : 'Haz clic o arrastra imágenes aquí'}
        </div>
        <div style={styles.dropHint}>
          JPG, PNG o WebP · máx. {maxSizeMB} MB · hasta {maxFiles} fotos
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept.join(',')}
          multiple
          hidden
          onChange={onPick}
          disabled={disabled || remaining === 0}
        />
      </div>

      {error && <div className="error-msg" style={{ marginTop: 8 }}>{error}</div>}

      {value.length > 0 && (
        <ul style={styles.grid}>
          {previews.map((p, idx) => (
            <li key={`${p.file.name}-${idx}`} style={styles.thumb}>
              <img src={p.url} alt={p.file.name} style={styles.img} />
              {idx === 0 && <span style={styles.badge}>Principal</span>}
              <div style={styles.thumbActions}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={styles.iconBtn}
                  onClick={() => moveTo(idx, idx - 1)}
                  disabled={idx === 0 || disabled}
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
                  disabled={idx === value.length - 1 || disabled}
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
                  disabled={disabled}
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
