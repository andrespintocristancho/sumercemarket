import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import OfferCard from '../components/OfferCard.jsx';
import { DEPARTMENTS, citiesOf } from '../data/colombia.js';

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
        // Traemos todos los campos que OfferCard necesita:
        // id, título, descripción, precio, categoría, ciudad, departamento,
        // estado, teléfono de contacto, imagen legacy (image_url) y
        // las imágenes nuevas vía relación offer_images (url, position).
        let query = supabase
          .from('offers')
          .select(
            `
              id,
              title,
              description,
              price,
              category,
              department,
              city,
              status,
              image_url,
              contact_phone,
              contact_name,
              created_at,
              offer_images ( id, url, position )
            `,
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
          aria-label="Buscar ofertas por título"
        />
        <select
          className="select"
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setCity(''); }}
          aria-label="Filtrar por departamento"
        >
          <option value="">Todos los departamentos</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          className="select"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={!department}
          aria-label="Filtrar por ciudad"
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
            {offers.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
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
