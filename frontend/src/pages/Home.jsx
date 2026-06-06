import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import {
  DEPARTMENTS,
  citiesOf,
  buildWhatsAppLink,
  formatPhone
} from '../data/colombia.js';

const PAGE_SIZE = 12;

export default function Home() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [q, setQ] = useState('');
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const cities = useMemo(() => citiesOf(department), [department]);

  useEffect(() => {
    let active = true;

    async function fetchOffers() {
      setLoading(true);
      setError('');

      try {
        let query = supabase
          .from('offers')
          .select(
            'id, title, description, price, department, city, image_url, contact_phone, contact_name, created_at',
            { count: 'exact' }
          )
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

        if (q.trim()) {
          query = query.ilike('title', `%${q.trim()}%`);
        }
        if (department) query = query.eq('department', department);
        if (city) query = query.eq('city', city);

        const { data, error: qErr, count } = await query;
        if (qErr) throw qErr;

        if (!active) return;
        setOffers(data || []);
        setTotal(count || 0);
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'No se pudieron cargar las ofertas.');
        setOffers([]);
        setTotal(0);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchOffers();
    return () => { active = false; };
  }, [q, department, city, page]);

  // Reset paginación cuando cambian filtros
  useEffect(() => { setPage(0); }, [q, department, city]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ paddingTop: 16 }}>
      <section style={styles.hero}>
        <h1 style={styles.h1}>Encuentra ofertas cerca de ti</h1>
        <p style={styles.heroText}>
          Marketplace para Colombia. Publica gratis o contacta vendedores por WhatsApp.
        </p>
      </section>

      <section className="card" style={styles.filters}>
        <input
          type="search"
          className="input"
          placeholder="Buscar por título…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="select"
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setCity(''); }}
        >
          <option value="">Todos los departamentos</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          className="select"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={!department}
        >
          <option value="">{department ? 'Todas las ciudades' : 'Elige depto.'}</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </section>

      {error && <div className="error-msg" style={{ marginTop: 12 }}>{error}</div>}

      {loading ? (
        <div className="loading">Cargando ofertas…</div>
      ) : offers.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div style={styles.grid}>
            {offers.map((o) => <OfferCard key={o.id} offer={o} />)}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function OfferCard({ offer }) {
  const phone = offer.contact_phone || '';
  const waMessage = `Hola, vi tu oferta "${offer.title}" en SumerceMarket. ¿Sigue disponible?`;
  const waLink = phone ? buildWhatsAppLink(phone, waMessage) : null;

  return (
    <article className="card" style={styles.card}>
      <div style={styles.imgWrap}>
        {offer.image_url ? (
          <img src={offer.image_url} alt={offer.title} style={styles.img} loading="lazy" />
        ) : (
          <div style={styles.imgPlaceholder} aria-hidden>🛒</div>
        )}
      </div>
      <div style={styles.cardBody}>
        <h3 style={styles.cardTitle}>{offer.title}</h3>
        <div style={styles.price}>{formatPrice(offer.price)}</div>
        <div style={styles.location}>
          📍 {offer.city}, {offer.department}
        </div>
        {offer.description && (
          <p style={styles.desc}>
            {offer.description.length > 120
              ? offer.description.slice(0, 120) + '…'
              : offer.description}
          </p>
        )}
        <div style={styles.cardActions}>
          {waLink ? (
            <a
              className="btn"
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: '#25D366', borderColor: '#25D366' }}
            >
              💬 WhatsApp
            </a>
          ) : (
            <span style={styles.noPhone}>Sin contacto</span>
          )}
          {phone && (
            <span style={styles.phoneText}>{formatPhone(phone)}</span>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="card" style={{ marginTop: 16, textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 48 }}>🔎</div>
      <h3 style={{ margin: '8px 0' }}>No hay ofertas para mostrar</h3>
      <p style={{ color: '#6b7280', margin: 0 }}>
        Prueba con otros filtros o <Link to="/publish" style={{ color: '#2563eb', fontWeight: 600 }}>publica la primera</Link>.
      </p>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={styles.pagination}>
      <button
        className="btn btn-ghost"
        disabled={page === 0}
        onClick={() => onChange(Math.max(0, page - 1))}
      >
        ← Anterior
      </button>
      <span style={{ fontSize: 14, color: '#6b7280' }}>
        Página {page + 1} de {totalPages}
      </span>
      <button
        className="btn btn-ghost"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
      >
        Siguiente →
      </button>
    </div>
  );
}

function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(n);
}

const styles = {
  hero: {
    padding: '24px 8px 8px 8px'
  },
  h1: { margin: 0, fontSize: 28 },
  heroText: { margin: '6px 0 0 0', color: '#6b7280' },
  filters: {
    marginTop: 12,
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 8
  },
  grid: {
    marginTop: 16,
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))'
  },
  card: { padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  imgWrap: { width: '100%', aspectRatio: '4 / 3', background: '#f3f4f6', overflow: 'hidden' },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgPlaceholder: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 48, color: '#9ca3af'
  },
  cardBody: { padding: 12, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  cardTitle: { margin: 0, fontSize: 16, lineHeight: 1.3 },
  price: { fontSize: 18, fontWeight: 800, color: '#16a34a' },
  location: { fontSize: 13, color: '#6b7280' },
  desc: { margin: '4px 0', fontSize: 14, color: '#374151', flex: 1 },
  cardActions: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  phoneText: { fontSize: 12, color: '#6b7280' },
  noPhone: { fontSize: 13, color: '#9ca3af' },
  pagination: {
    marginTop: 16,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap'
  }
};

// Filtros en desktop: 3 columnas
if (typeof document !== 'undefined' && !document.getElementById('home-media')) {
  const style = document.createElement('style');
  style.id = 'home-media';
  style.textContent = `
    @media (min-width: 720px) {
      .card[style*="grid-template-columns: 1fr"] { grid-template-columns: 2fr 1fr 1fr !important; }
    }
  `;
  document.head.appendChild(style);
}
