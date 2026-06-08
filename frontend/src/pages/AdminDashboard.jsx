// ============================================================
// AdminDashboard.jsx — STUB LEGADO
// ============================================================
// Este panel pertenecía al antiguo backend Node + Express y ya
// NO está montado en App.jsx (la ruta /admin usa Admin.jsx, que
// lee de Supabase con RLS).
//
// Se conserva como stub mínimo para no romper builds si alguien
// la importa por error. No usa fetch('/api/...'), ni el viejo
// services/api.js, ni ningún backend local.
//
// Si necesitas administración, usa Admin.jsx.
// ============================================================

import { Link } from 'react-router-dom';

export default function AdminDashboard() {
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
        <h1 style={{ marginTop: 0 }}>🛡️ Panel admin (legado)</h1>
        <p className="text-muted">
          Esta pantalla es código legado y ya no se utiliza. El panel real está en{' '}
          <strong>/admin</strong> y consulta Supabase con políticas RLS.
        </p>
        <p style={{ marginTop: '1.5rem' }}>
          <Link className="btn btn-primary" to="/admin">Ir al panel admin</Link>
        </p>
      </div>
    </div>
  );
}
