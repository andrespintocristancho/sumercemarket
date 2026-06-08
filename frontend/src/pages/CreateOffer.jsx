// ============================================================
// CreateOffer.jsx — STUB LEGADO
// ============================================================
// Esta pantalla pertenecía al antiguo backend Node + Express y
// ya NO está montada en App.jsx (la ruta /publish usa Publish.jsx,
// que sube ofertas e imágenes directo a Supabase).
//
// Se conserva como stub mínimo para no romper builds si alguien
// la importa por error. No usa fetch('/api/...'), ni el viejo
// services/api.js, ni ningún backend local.
//
// Si necesitas una pantalla de publicación, usa Publish.jsx.
// ============================================================

import { Link } from 'react-router-dom';

export default function CreateOffer() {
  return (
    <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <div
        className="card"
        style={{
          padding: '2rem',
          textAlign: 'center',
          border: '1px dashed var(--border, #ccc)'
        }}
        role="status"
        aria-live="polite"
      >
        <h1 style={{ marginTop: 0 }}>📢 Publicar oferta</h1>
        <p className="text-muted">
          Esta pantalla es código legado y ya no se utiliza. La publicación de ofertas
          se realiza ahora en <strong>/publish</strong>, directamente contra Supabase.
        </p>
        <p style={{ marginTop: '1.5rem' }}>
          <Link className="btn btn-primary" to="/publish">Ir a publicar oferta</Link>
        </p>
      </div>
    </div>
  );
}
