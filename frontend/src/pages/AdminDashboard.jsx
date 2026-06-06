import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { formatCOP, getCategory } from '../utils/categories.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('stats');

  const loadAll = async () => {
    setLoading(true); setError('');
    try {
      const [s, u, o] = await Promise.all([
        api.adminStats(), api.adminUsers(), api.adminOffers()
      ]);
      setStats(s); setUsers(u); setOffers(o);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const handleDeleteUser = async (u) => {
    if (!confirm(`Eliminar al usuario ${u.email}? Esto borrará sus ofertas.`)) return;
    try { await api.adminDeleteUser(u.id); loadAll(); }
    catch (e) { alert(e.message); }
  };

  const handleDeleteOffer = async (o) => {
    if (!confirm(`Eliminar la oferta "${o.title}"?`)) return;
    try { await api.deleteOffer(o.id); loadAll(); }
    catch (e) { alert(e.message); }
  };

  if (loading) return <div className="loading">Cargando panel admin...</div>;

  return (
    <div>
      <h1 style={{ color: 'var(--azul)', marginBottom: '1rem' }}>🛡️ Panel de administración</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
        <button
          onClick={() => setTab('stats')}
          style={{
            padding: '0.7rem 1.2rem',
            background: tab === 'stats' ? 'var(--amarillo)' : 'transparent',
            color: tab === 'stats' ? 'var(--azul-dark)' : 'var(--text)',
            fontWeight: 700,
            borderRadius: '8px 8px 0 0'
          }}
        >📊 Estadísticas</button>
        <button
          onClick={() => setTab('users')}
          style={{
            padding: '0.7rem 1.2rem',
            background: tab === 'users' ? 'var(--amarillo)' : 'transparent',
            color: tab === 'users' ? 'var(--azul-dark)' : 'var(--text)',
            fontWeight: 700,
            borderRadius: '8px 8px 0 0'
          }}
        >👥 Usuarios ({users.length})</button>
        <button
          onClick={() => setTab('offers')}
          style={{
            padding: '0.7rem 1.2rem',
            background: tab === 'offers' ? 'var(--amarillo)' : 'transparent',
            color: tab === 'offers' ? 'var(--azul-dark)' : 'var(--text)',
            fontWeight: 700,
            borderRadius: '8px 8px 0 0'
          }}
        >📦 Ofertas ({offers.length})</button>
      </div>

      {tab === 'stats' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <StatCard label="Usuarios" value={stats.totalUsers} icon="👥" color="var(--azul)" />
          <StatCard label="Ofertas activas" value={stats.activeOffers} icon="✅" color="#10b981" />
          <StatCard label="Vendidas" value={stats.soldOffers} icon="💰" color="var(--rojo)" />
          <StatCard label="Total ofertas" value={stats.totalOffers} icon="📦" color="var(--amarillo-dark)" />
          <StatCard label="Contactos WA" value={stats.totalContacts} icon="💬" color="var(--verde-wa)" />
        </div>
      )}

      {tab === 'users' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 8, overflow: 'hidden' }}>
            <thead style={{ background: 'var(--azul)', color: 'white' }}>
              <tr>
                <th style={th}>Nombre</th><th style={th}>Email</th><th style={th}>Teléfono</th>
                <th style={th}>Ciudad</th><th style={th}>Rol</th><th style={th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={td}>{u.name}</td>
                  <td style={td}>{u.email}</td>
                  <td style={td}>{u.phone}</td>
                  <td style={td}>{u.city}, {u.department}</td>
                  <td style={td}><span className="badge">{u.role}</span></td>
                  <td style={td}>
                    {u.role !== 'admin' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u)}>
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'offers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {offers.map(o => {
            const cat = getCategory(o.category);
            return (
              <div key={o.id} className="card" style={{ padding: '0.8rem', display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <strong>{cat.icon} {o.title}</strong>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {formatCOP(o.price)} · {o.city} · Por: {o.sellerName} ({o.sellerEmail})
                  </p>
                </div>
                <span className={`badge ${o.status === 'active' ? 'badge-active' : 'badge-sold'}`}>
                  {o.status}
                </span>
                <Link to={`/offer/${o.id}`} className="btn btn-outline btn-sm">Ver</Link>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteOffer(o)}>Eliminar</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card" style={{ padding: '1.2rem', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: '1.8rem' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 900, color }}>{value}</div>
      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{label}</div>
    </div>
  );
}

const th = { padding: '0.7rem', textAlign: 'left', fontSize: '0.85rem' };
const td = { padding: '0.7rem', fontSize: '0.9rem' };
