// Admin.jsx
// Panel de administración básico.
// Acceso restringido a usuarios con role === 'admin' en la tabla `profiles`.
// Datos directos desde Supabase: profiles, offers, contact_events.
//
// Ajustes para el bug de detección admin:
// - Usamos `role` (expuesto por AuthContext) en lugar de leer
//   directamente profile?.role, para que cualquier consumidor
//   tenga la misma fuente de verdad.
// - Esperamos `profileLoading` antes de mostrar el 403, de modo que
//   un admin nunca vea "Sin permisos" durante la carga inicial.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPhone } from '../data/colombia.js';

const COMMISSION_RATES = [0.05, 0.06];

export default function Admin() {
  const {
    user,
    role,
    loading: authLoading,
    profileLoading
  } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [offers, setOffers] = useState([]);
  const [users, setUsers] = useState([]);

  // Filtros de tablas
  const [offerQ, setOfferQ] = useState('');
  const [offerStatus, setOfferStatus] = useState('all');
  const [userQ, setUserQ] = useState('');

  const isAdmin = role === 'admin';

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [
        usersCountRes,
        offersTotalRes,
        offersActiveRes,
        offersPausedRes,
        offersSoldRes,
        clicksCountRes,
        offersListRes,
        usersListRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('offers').select('id', { count: 'exact', head: true }),
        supabase.from('offers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('offers').select('id', { count: 'exact', head: true }).eq('status', 'paused'),
        supabase.from('offers').select('id', { count: 'exact', head: true }).eq('status', 'sold'),
        supabase.from('contact_events').select('id', { count: 'exact', head: true }),
        supabase
          .from('offers')
          .select('id, title, category, price, city, department, status, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('profiles')
          .select('id, name, email, phone, role, created_at')
          .order('created_at', { ascending: false })
          .limit(500)
      ]);

      const firstError =
        usersCountRes.error ||
        offersTotalRes.error ||
        offersActiveRes.error ||
        offersPausedRes.error ||
        offersSoldRes.error ||
        clicksCountRes.error ||
        offersListRes.error ||
        usersListRes.error;

      if (firstError) throw firstError;

      const offersList = offersListRes.data || [];
      const soldOffers = offersList.filter((o) => o.status === 'sold');
      const soldSum = soldOffers.reduce(
        (acc, o) => acc + (Number(o.price) || 0),
        0
      );

      setStats({
        usersTotal: usersCountRes.count || 0,
        offersTotal: offersTotalRes.count || 0,
        offersActive: offersActiveRes.count || 0,
        offersPaused: offersPausedRes.count || 0,
        offersSold: offersSoldRes.count || 0,
        whatsappClicks: clicksCountRes.count || 0,
        soldSum,
        commissions: COMMISSION_RATES.map((rate) => ({
          rate,
          amount: soldSum * rate
        }))
      });

      setOffers(offersList);
      setUsers(usersListRes.data || []);
    } catch (err) {
      setError(mapError(err?.message || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !profileLoading && isAdmin) {
      loadAll();
    }
  }, [authLoading, profileLoading, isAdmin, loadAll]);

  // ---------- Guardas de acceso ----------
  // Mostrar estado de carga mientras se resuelve sesión o perfil.
  if (authLoading || profileLoading) {
    return <div className="loading">Verificando acceso…</div>;
  }

  if (!user) {
    return (
      <div className="card" style={styles.gateCard}>
        <h2 style={{ marginTop: 0 }}>Acceso restringido</h2>
        <p>Debes iniciar sesión para acceder al panel.</p>
        <Link to="/login" className="btn">Iniciar sesión</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="card" style={styles.gateCard}>
        <h2 style={{ marginTop: 0 }}>403 · Sin permisos</h2>
        <p>Tu cuenta no tiene rol de administrador.</p>
        <Link to="/" className="btn btn-ghost">Volver al inicio</Link>
      </div>
    );
  }

  // ---------- Filtros aplicados ----------
  const filteredOffers = offers.filter((o) => {
    const matchStatus = offerStatus === 'all' || o.status === offerStatus;
    const q = offerQ.trim().toLowerCase();
    const matchQ =
      !q ||
      (o.title || '').toLowerCase().includes(q) ||
      (o.category || '').toLowerCase().includes(q) ||
      (o.city || '').toLowerCase().includes(q) ||
      (o.department || '').toLowerCase().includes(q);
    return matchStatus && matchQ;
  });

  const filteredUsers = users.filter((u) => {
    const q = userQ.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  // ---------- Acciones sobre ofertas ----------
  const handleToggleStatus = async (offer) => {
    const nextStatus = offer.status === 'paused' ? 'active' : 'paused';
    try {
      const { error: upErr } = await supabase
        .from('offers')
        .update({ status: nextStatus })
        .eq('id', offer.id);
      if (upErr) throw upErr;

      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, status: nextStatus } : o))
      );
      setStats((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (offer.status === 'active') next.offersActive--;
        if (offer.status === 'paused') next.offersPaused--;
        if (offer.status === 'sold') next.offersSold--;
        if (nextStatus === 'active') next.offersActive++;
        if (nextStatus === 'paused') next.offersPaused++;
        if (nextStatus === 'sold') next.offersSold++;
        return next;
      });
    } catch (err) {
      alert('No fue posible cambiar el estado: ' + (err?.message || ''));
    }
  };

  const handleDeleteOffer = async (offer) => {
    const ok = window.confirm(
      `Eliminar definitivamente la oferta "${offer.title}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    try {
      await supabase.from('offer_images').delete().eq('offer_id', offer.id);
      const { error: delErr } = await supabase
        .from('offers')
        .delete()
        .eq('id', offer.id);
      if (delErr) throw delErr;

      setOffers((prev) => prev.filter((o) => o.id !== offer.id));

      setStats((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        next.offersTotal = Math.max(0, next.offersTotal - 1);
        if (offer.status === 'active') next.offersActive = Math.max(0, next.offersActive - 1);
        if (offer.status === 'paused') next.offersPaused = Math.max(0, next.offersPaused - 1);
        if (offer.status === 'sold') {
          next.offersSold = Math.max(0, next.offersSold - 1);
          const price = Number(offer.price) || 0;
          next.soldSum = Math.max(0, next.soldSum - price);
          next.commissions = COMMISSION_RATES.map((rate) => ({
            rate,
            amount: next.soldSum * rate
          }));
        }
        return next;
      });
    } catch (err) {
      alert('No fue posible eliminar la oferta: ' + (err?.message || ''));
    }
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.h1}>Panel de administración</h1>
          <p style={styles.sub}>Resumen general de la plataforma.</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={loadAll}
          disabled={loading}
        >
          🔄 Refrescar
        </button>
      </div>

      {error && <div className="error-msg" style={{ marginTop: 12 }}>{error}</div>}

      {loading ? (
        <div className="loading">Cargando datos…</div>
      ) : (
        <>
          <StatsGrid stats={stats} />

          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.h2}>Ofertas</h2>
              <div style={styles.filterBar}>
                <input
                  type="search"
                  className="input"
                  placeholder="Buscar título, ciudad, categoría…"
                  value={offerQ}
                  onChange={(e) => setOfferQ(e.target.value)}
                  style={{ minWidth: 220 }}
                />
                <select
                  className="select"
                  value={offerStatus}
                  onChange={(e) => setOfferStatus(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activas</option>
                  <option value="paused">Pausadas</option>
                  <option value="sold">Vendidas</option>
                </select>
              </div>
            </div>

            <OffersTable
              offers={filteredOffers}
              onToggle={handleToggleStatus}
              onDelete={handleDeleteOffer}
            />
          </section>

          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.h2}>Usuarios</h2>
              <div style={styles.filterBar}>
                <input
                  type="search"
                  className="input"
                  placeholder="Buscar nombre, correo, rol…"
                  value={userQ}
                  onChange={(e) => setUserQ(e.target.value)}
                  style={{ minWidth: 260 }}
                />
              </div>
            </div>

            <UsersTable users={filteredUsers} />
          </section>
        </>
      )}
    </div>
  );
}

/* ----------------------- Subcomponentes ----------------------- */

function StatsGrid({ stats }) {
  if (!stats) return null;

  const items = [
    { label: 'Usuarios', value: formatInt(stats.usersTotal), icon: '👥' },
    { label: 'Ofertas totales', value: formatInt(stats.offersTotal), icon: '🛒' },
    { label: 'Activas', value: formatInt(stats.offersActive), icon: '✅', color: '#16a34a' },
    { label: 'Pausadas', value: formatInt(stats.offersPaused), icon: '⏸️', color: '#f59e0b' },
    { label: 'Vendidas', value: formatInt(stats.offersSold), icon: '💸', color: '#6b7280' },
    { label: 'Clics WhatsApp', value: formatInt(stats.whatsappClicks), icon: '💬', color: '#25D366' }
  ];

  return (
    <>
      <div style={styles.statsGrid}>
        {items.map((it) => (
          <div key={it.label} className="card" style={styles.statCard}>
            <div style={styles.statIcon}>{it.icon}</div>
            <div>
              <div style={styles.statLabel}>{it.label}</div>
              <div style={{ ...styles.statValue, color: it.color || '#111827' }}>
                {it.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={styles.commissionCard}>
        <div>
          <div style={styles.statLabel}>Total vendido (base de comisión)</div>
          <div style={{ ...styles.statValue, color: '#111827' }}>
            {formatMoney(stats.soldSum)}
          </div>
          <div style={styles.commissionHint}>
            Calculado sobre ofertas marcadas como vendidas.
          </div>
        </div>
        <div style={styles.commissionRow}>
          {stats.commissions.map((c) => (
            <div key={c.rate} style={styles.commissionItem}>
              <div style={styles.commissionLabel}>
                Comisión {Math.round(c.rate * 100)}%
              </div>
              <div style={styles.commissionValue}>{formatMoney(c.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function OffersTable({ offers, onToggle, onDelete }) {
  if (offers.length === 0) {
    return (
      <div className="card" style={styles.empty}>
        No hay ofertas para mostrar.
      </div>
    );
  }
  return (
    <div className="card" style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Título</th>
            <th style={styles.th}>Categoría</th>
            <th style={styles.th}>Precio</th>
            <th style={styles.th}>Ciudad</th>
            <th style={styles.th}>Departamento</th>
            <th style={styles.th}>Estado</th>
            <th style={styles.th}>Fecha</th>
            <th style={styles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((o) => (
            <tr key={o.id} style={styles.tr}>
              <td style={styles.td} title={o.title}>
                <span style={styles.titleCell}>{o.title}</span>
              </td>
              <td style={styles.td}>{o.category || '—'}</td>
              <td style={styles.td}>{formatMoney(o.price)}</td>
              <td style={styles.td}>{o.city || '—'}</td>
              <td style={styles.td}>{o.department || '—'}</td>
              <td style={styles.td}>
                <StatusPill status={o.status} />
              </td>
              <td style={styles.td}>{formatDate(o.created_at)}</td>
              <td style={styles.td}>
                <div style={styles.rowBtns}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => onToggle(o)}
                    title={o.status === 'paused' ? 'Reactivar' : 'Pausar'}
                  >
                    {o.status === 'paused' ? '▶️ Activar' : '⏸️ Pausar'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => onDelete(o)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersTable({ users }) {
  if (users.length === 0) {
    return (
      <div className="card" style={styles.empty}>
        No hay usuarios para mostrar.
      </div>
    );
  }
  return (
    <div className="card" style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Nombre</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>WhatsApp</th>
            <th style={styles.th}>Rol</th>
            <th style={styles.th}>Creado</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={styles.tr}>
              <td style={styles.td}>{u.name || '—'}</td>
              <td style={styles.td}>{u.email || '—'}</td>
              <td style={styles.td}>{u.phone ? formatPhone(u.phone) : '—'}</td>
              <td style={styles.td}>
                <RolePill role={u.role} />
              </td>
              <td style={styles.td}>{formatDate(u.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    active: { label: 'Activa', bg: '#dcfce7', color: '#166534' },
    paused: { label: 'Pausada', bg: '#fef3c7', color: '#92400e' },
    sold: { label: 'Vendida', bg: '#e5e7eb', color: '#374151' }
  };
  const cfg = map[status] || { label: status || '—', bg: '#e5e7eb', color: '#374151' };
  return (
    <span style={{ ...styles.pill, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function RolePill({ role }) {
  const isAdmin = role === 'admin';
  return (
    <span
      style={{
        ...styles.pill,
        background: isAdmin ? '#dbeafe' : '#f3f4f6',
        color: isAdmin ? '#1e40af' : '#374151'
      }}
    >
      {isAdmin ? '🛡️ Admin' : 'Usuario'}
    </span>
  );
}

/* ----------------------- Utilidades ----------------------- */

function formatInt(n) {
  return new Intl.NumberFormat('es-CO').format(Number(n) || 0);
}

function formatMoney(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(n) || 0);
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  } catch {
    return iso;
  }
}

function mapError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('row-level security') || m.includes('rls') || m.includes('permission')) {
    return 'No tienes permisos para leer estos datos. Verifica las políticas RLS para el rol admin.';
  }
  if (m.includes('relation') && m.includes('does not exist')) {
    return 'Falta alguna tabla esperada (profiles, offers, offer_images o contact_events).';
  }
  return msg || 'No fue posible cargar el panel.';
}

/* ----------------------- Estilos ----------------------- */

const styles = {
  gateCard: {
    maxWidth: 480,
    margin: '32px auto',
    textAlign: 'center'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    padding: '0 8px'
  },
  h1: { margin: 0, fontSize: 24 },
  sub: { margin: '4px 0 0 0', color: '#6b7280', fontSize: 14 },
  statsGrid: {
    marginTop: 16,
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16
  },
  statIcon: { fontSize: 28 },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' },
  statValue: { fontSize: 22, fontWeight: 800, marginTop: 2 },
  commissionCard: {
    marginTop: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    padding: 16
  },
  commissionHint: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  commissionRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap'
  },
  commissionItem: {
    background: '#f8fafc',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '10px 14px',
    minWidth: 140
  },
  commissionLabel: { fontSize: 12, color: '#6b7280', fontWeight: 600 },
  commissionValue: { fontSize: 18, fontWeight: 800, color: '#2563eb', marginTop: 2 },
  section: {
    marginTop: 24,
    padding: '0 8px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 8
  },
  h2: { margin: 0, fontSize: 18 },
  filterBar: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap'
  },
  tableWrap: {
    padding: 0,
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    background: '#f8fafc',
    borderBottom: '1px solid #e5e7eb',
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '10px 12px',
    verticalAlign: 'middle'
  },
  titleCell: {
    display: 'inline-block',
    maxWidth: 260,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  pill: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700
  },
  rowBtns: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap'
  },
  empty: {
    marginTop: 8,
    textAlign: 'center',
    padding: 24,
    color: '#6b7280'
  }
};
