// Admin.jsx
// Panel de administración. Acceso restringido vía isAdmin del AuthContext.
// No hay consulta duplicada a profiles para resolver el rol: la fuente
// de verdad es el context.
//
// Fix: el schema de public.profiles NO tiene columna `name` ni `email`.
// Columnas reales: id, full_name, phone, department, city, role,
// created_at (+ otros campos del schema). Por eso las consultas y
// el render usan `full_name` en lugar de `name`.
//
// Fix botón Pausar/Activar:
// - El toggle escribe SIEMPRE en la columna `offers.status`
//   (valores válidos: 'active' | 'paused' | 'sold').
// - NO se usa `is_active` en ninguna parte.
// - Tras el UPDATE se llama a loadAll() para refrescar la lista
//   desde Supabase (fuente de verdad) y así garantizar persistencia.
// - Se usa .select() en el UPDATE para detectar fallos silenciosos
//   por RLS (0 filas afectadas sin error explícito).
// - Los errores de Supabase se muestran en el banner de error de la UI.
//
// Nuevo:
// - Botón "Marcar vendida" para ofertas en estado 'active' o 'paused'
//   (escribe offers.status = 'sold').
// - Botón "Reactivar" para ofertas en estado 'sold'
//   (escribe offers.status = 'active').
// - Ambas acciones usan el mismo flujo de persistencia + refresco
//   que el toggle Pausar/Activar.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPhone } from '../data/colombia.js';

const COMMISSION_RATES = [0.05, 0.06];

const IS_DEV =
  (typeof import.meta !== 'undefined' && import.meta?.env?.DEV) === true;

export default function Admin() {
  const {
    user,
    profile,
    role,
    isAdmin,
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

  // Estado de acción por fila (para deshabilitar el botón mientras se guarda)
  const [togglingId, setTogglingId] = useState(null);
  const [sellingId, setSellingId] = useState(null);

  // Debug en desarrollo
  useEffect(() => {
    if (!IS_DEV) return;
    if (authLoading || profileLoading) return;
    // eslint-disable-next-line no-console
    console.log('AUTH DEBUG', {
      userId: user?.id,
      profile,
      role,
      isAdmin
    });
  }, [user, profile, role, isAdmin, authLoading, profileLoading]);

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
        // Columnas reales de public.profiles. NO usar `name` ni `email`.
        supabase
          .from('profiles')
          .select('id, full_name, phone, department, city, role, created_at')
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
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.department || '').toLowerCase().includes(q) ||
      (u.city || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  // ---------- Acciones sobre ofertas ----------
  //
  // Helper interno: cambia offers.status para una oferta y refresca la lista.
  // Centraliza el patrón: UPDATE + .select() + detección de RLS + loadAll().
  // Devuelve true si todo OK, false si hubo error (ya seteado en el banner).
  const updateOfferStatus = async (offerId, nextStatus) => {
    const { data, error: upErr } = await supabase
      .from('offers')
      .update({ status: nextStatus })
      .eq('id', offerId)
      .select('id, status');

    if (upErr) throw upErr;

    // Si RLS bloquea el UPDATE, Supabase devuelve data = [] sin error.
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(
        'El cambio no se guardó. Es probable que las políticas RLS de la tabla offers no permitan a tu usuario actualizar la columna status.'
      );
    }

    // Refresca la lista desde Supabase para garantizar que el estado
    // visual coincide con la BD (fuente de verdad).
    await loadAll();
    return true;
  };

  // Botón Pausar / Activar.
  // Reglas:
  //  - Solo alterna entre 'active' <-> 'paused'.
  //  - Si la oferta está 'sold' no se permite el toggle (usar "Reactivar").
  //  - Escribe en la columna `status` de la tabla `offers`.
  const handleToggleStatus = async (offer) => {
    if (!offer || togglingId || sellingId) return;

    if (offer.status === 'sold') {
      setError('La oferta está marcada como vendida. Usa "Reactivar" para volver a publicarla.');
      return;
    }

    const nextStatus = offer.status === 'active' ? 'paused' : 'active';

    setTogglingId(offer.id);
    setError('');

    try {
      await updateOfferStatus(offer.id, nextStatus);
    } catch (err) {
      setError(
        'No fue posible cambiar el estado de la oferta: ' +
          (err?.message || 'error desconocido')
      );
    } finally {
      setTogglingId(null);
    }
  };

  // Botón Marcar vendida / Reactivar.
  // Reglas:
  //  - Si la oferta está 'active' o 'paused': pide confirmación y
  //    escribe offers.status = 'sold'.
  //  - Si la oferta está 'sold': la reactiva poniendo status = 'active'.
  //  - Mismo flujo de persistencia + refresco que el toggle.
  const handleMarkSold = async (offer) => {
    if (!offer || togglingId || sellingId) return;

    const isSold = offer.status === 'sold';
    const nextStatus = isSold ? 'active' : 'sold';

    if (!isSold) {
      const ok = window.confirm(
        `Marcar la oferta "${offer.title}" como VENDIDA? Esto la retira del listado público y la suma al total vendido (base de comisión).`
      );
      if (!ok) return;
    }

    setSellingId(offer.id);
    setError('');

    try {
      await updateOfferStatus(offer.id, nextStatus);
    } catch (err) {
      setError(
        (isSold
          ? 'No fue posible reactivar la oferta: '
          : 'No fue posible marcar la oferta como vendida: ') +
          (err?.message || 'error desconocido')
      );
    } finally {
      setSellingId(null);
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
      setError('No fue posible eliminar la oferta: ' + (err?.message || ''));
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
              onMarkSold={handleMarkSold}
              onDelete={handleDeleteOffer}
              togglingId={togglingId}
              sellingId={sellingId}
            />
          </section>

          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.h2}>Usuarios</h2>
              <div style={styles.filterBar}>
                <input
                  type="search"
                  className="input"
                  placeholder="Buscar nombre, ciudad, rol…"
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

function OffersTable({ offers, onToggle, onMarkSold, onDelete, togglingId, sellingId }) {
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
          {offers.map((o) => {
            const isSold = o.status === 'sold';
            const isPaused = o.status === 'paused';
            const isToggling = togglingId === o.id;
            const isSelling = sellingId === o.id;
            const rowBusy = isToggling || isSelling;
            return (
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
                    {!isSold && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => onToggle(o)}
                        disabled={rowBusy}
                        title={isPaused ? 'Activar oferta' : 'Pausar oferta'}
                      >
                        {isToggling
                          ? '⏳ Guardando…'
                          : isPaused
                            ? '▶️ Activar'
                            : '⏸️ Pausar'}
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => onMarkSold(o)}
                      disabled={rowBusy}
                      title={
                        isSold
                          ? 'Volver a publicar como activa'
                          : 'Marcar la oferta como vendida'
                      }
                    >
                      {isSelling
                        ? '⏳ Guardando…'
                        : isSold
                          ? '♻️ Reactivar'
                          : '💸 Marcar vendida'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => onDelete(o)}
                      disabled={rowBusy}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
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
            <th style={styles.th}>WhatsApp</th>
            <th style={styles.th}>Departamento</th>
            <th style={styles.th}>Ciudad</th>
            <th style={styles.th}>Rol</th>
            <th style={styles.th}>Creado</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={styles.tr}>
              <td style={styles.td}>{u.full_name || '—'}</td>
              <td style={styles.td}>{u.phone ? formatPhone(u.phone) : '—'}</td>
              <td style={styles.td}>{u.department || '—'}</td>
              <td style={styles.td}>{u.city || '—'}</td>
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
  if (m.includes('column') && m.includes('does not exist')) {
    return 'Una columna consultada no existe en el schema. Revisa los nombres reales en public.profiles / public.offers.';
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
