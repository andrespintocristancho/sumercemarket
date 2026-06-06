// MyOffers.jsx
// Lista las ofertas del usuario autenticado. Permite cambiar estado,
// editar campos básicos en línea y eliminar oferta + imágenes asociadas
// (registro en BD + archivos en Storage).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  DEPARTMENTS,
  citiesOf,
  CATEGORIES,
  isValidColombianPhone
} from '../data/colombia.js';
import OfferCard from '../components/OfferCard.jsx';

const BUCKET = 'offer-images';
const STATUS_OPTIONS = ['all', 'active', 'paused', 'sold'];

export default function MyOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null); // oferta en edición

  const fetchOffers = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: qErr } = await supabase
        .from('offers')
        .select(
          'id, title, description, category, price, department, city, address, status, contact_phone, contact_name, created_at, offer_images(id, url, path, position)'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (qErr) throw qErr;
      setOffers(data || []);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar tus ofertas.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const filtered = useMemo(() => {
    if (filter === 'all') return offers;
    return offers.filter((o) => o.status === filter);
  }, [offers, filter]);

  const counts = useMemo(() => {
    const c = { all: offers.length, active: 0, paused: 0, sold: 0 };
    for (const o of offers) {
      if (c[o.status] != null) c[o.status]++;
    }
    return c;
  }, [offers]);

  const handleChangeStatus = async (offer, nextStatus) => {
    if (offer.status === nextStatus) return;
    try {
      const { error: upErr } = await supabase
        .from('offers')
        .update({ status: nextStatus })
        .eq('id', offer.id);
      if (upErr) throw upErr;
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, status: nextStatus } : o))
      );
    } catch (err) {
      alert('No fue posible cambiar el estado: ' + (err?.message || ''));
    }
  };

  const handleDelete = async (offer) => {
    const ok = window.confirm(
      `¿Eliminar la oferta "${offer.title}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    try {
      // 1) Borrar archivos del Storage
      const paths = (offer.offer_images || [])
        .map((i) => i.path)
        .filter(Boolean);
      if (paths.length > 0) {
        const { error: rmErr } = await supabase.storage
          .from(BUCKET)
          .remove(paths);
        // No abortamos si falla el remove: seguimos con la BD
        if (rmErr) {
          // eslint-disable-next-line no-console
          console.warn('No se pudieron eliminar algunas imágenes:', rmErr);
        }
      }

      // 2) Borrar filas en offer_images (por si no hay ON DELETE CASCADE)
      await supabase.from('offer_images').delete().eq('offer_id', offer.id);

      // 3) Borrar la oferta
      const { error: delErr } = await supabase
        .from('offers')
        .delete()
        .eq('id', offer.id);
      if (delErr) throw delErr;

      setOffers((prev) => prev.filter((o) => o.id !== offer.id));
    } catch (err) {
      alert('No fue posible eliminar la oferta: ' + (err?.message || ''));
    }
  };

  const handleSavedEdit = (updated) => {
    setOffers((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
    setEditing(null);
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={styles.header}>
        <h1 style={styles.h1}>Mis ofertas</h1>
        <Link to="/publish" className="btn">+ Publicar nueva</Link>
      </div>

      <div className="card" style={styles.filters}>
        {STATUS_OPTIONS.map((s) => (
          <button
            type="button"
            key={s}
            className={`btn ${filter === s ? '' : 'btn-ghost'}`}
            onClick={() => setFilter(s)}
          >
            {labelOf(s)} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {error && <div className="error-msg" style={{ marginTop: 12 }}>{error}</div>}

      {loading ? (
        <div className="loading">Cargando…</div>
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div style={styles.grid}>
          {filtered.map((o) => (
            <OfferCard
              key={o.id}
              offer={o}
              showOwnerActions
              onEdit={(off) => setEditing(off)}
              onDelete={handleDelete}
              onChangeStatus={handleChangeStatus}
            />
          ))}
        </div>
      )}

      {editing && (
        <EditOfferModal
          offer={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSavedEdit}
        />
      )}
    </div>
  );
}

function labelOf(s) {
  return {
    all: 'Todas',
    active: 'Activas',
    paused: 'Pausadas',
    sold: 'Vendidas'
  }[s] || s;
}

function EmptyState({ filter }) {
  return (
    <div className="card" style={{ marginTop: 16, textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 48 }}>📭</div>
      <h3 style={{ margin: '8px 0' }}>
        {filter === 'all'
          ? 'Aún no tienes ofertas publicadas'
          : 'No tienes ofertas en este estado'}
      </h3>
      <p style={{ color: '#6b7280', margin: '0 0 12px 0' }}>
        Empieza a vender publicando tu primer producto.
      </p>
      <Link to="/publish" className="btn">+ Publicar oferta</Link>
    </div>
  );
}

/* -------------------- Modal de edición -------------------- */

function EditOfferModal({ offer, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: offer.title || '',
    description: offer.description || '',
    category: offer.category || '',
    price: offer.price ?? '',
    department: offer.department || '',
    city: offer.city || '',
    address: offer.address || '',
    contact_phone: offer.contact_phone || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cities = useMemo(() => citiesOf(form.department), [form.department]);

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'department') next.city = '';
      return next;
    });
  };

  const validate = () => {
    if (form.title.trim().length < 4) return 'Título demasiado corto.';
    if (!form.category) return 'Selecciona una categoría.';
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) return 'Precio inválido.';
    if (!form.department) return 'Selecciona el departamento.';
    if (!form.city) return 'Selecciona la ciudad.';
    if (!isValidColombianPhone(form.contact_phone)) {
      return 'WhatsApp inválido (10 dígitos, empieza con 3).';
    }
    return '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        price: Number(form.price),
        department: form.department,
        city: form.city,
        address: form.address.trim() || null,
        contact_phone: String(form.contact_phone).trim()
      };
      const { data, error: upErr } = await supabase
        .from('offers')
        .update(payload)
        .eq('id', offer.id)
        .select()
        .single();
      if (upErr) throw upErr;
      onSaved(data);
    } catch (err) {
      setError(err?.message || 'No fue posible guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className="card"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-offer-title"
      >
        <div style={styles.modalHeader}>
          <h2 id="edit-offer-title" style={{ margin: 0, fontSize: 20 }}>
            Editar oferta
          </h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} style={styles.form} noValidate>
          <label style={styles.label}>
            Título
            <input
              className="input"
              value={form.title}
              onChange={update('title')}
              maxLength={120}
              required
            />
          </label>

          <label style={styles.label}>
            Descripción
            <textarea
              className="input"
              value={form.description}
              onChange={update('description')}
              rows={3}
              maxLength={2000}
              style={{ resize: 'vertical' }}
            />
          </label>

          <div style={styles.row}>
            <label style={{ ...styles.label, flex: 1 }}>
              Categoría
              <select
                className="select"
                value={form.category}
                onChange={update('category')}
                required
              >
                <option value="">Selecciona…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={{ ...styles.label, flex: 1 }}>
              Precio (COP)
              <input
                type="number"
                className="input"
                value={form.price}
                onChange={update('price')}
                min="0"
                step="1000"
                inputMode="numeric"
                required
              />
            </label>
          </div>

          <div style={styles.row}>
            <label style={{ ...styles.label, flex: 1 }}>
              Departamento
              <select
                className="select"
                value={form.department}
                onChange={update('department')}
                required
              >
                <option value="">Selecciona…</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label style={{ ...styles.label, flex: 1 }}>
              Ciudad
              <select
                className="select"
                value={form.city}
                onChange={update('city')}
                disabled={!form.department}
                required
              >
                <option value="">
                  {form.department ? 'Selecciona…' : 'Elige depto. primero'}
                </option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <label style={styles.label}>
            Dirección (opcional)
            <input
              className="input"
              value={form.address}
              onChange={update('address')}
              maxLength={200}
            />
          </label>

          <label style={styles.label}>
            WhatsApp
            <input
              type="tel"
              className="input"
              value={form.contact_phone}
              onChange={update('contact_phone')}
              maxLength={10}
              inputMode="numeric"
              required
            />
          </label>

          {error && <div className="error-msg">{error}</div>}

          <div style={styles.modalActions}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    padding: '0 8px'
  },
  h1: { margin: 0, fontSize: 24 },
  filters: {
    marginTop: 12,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8
  },
  grid: {
    marginTop: 16,
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))'
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 16,
    zIndex: 100,
    overflowY: 'auto'
  },
  modal: {
    width: '100%',
    maxWidth: 640,
    marginTop: 24
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#374151'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4
  }
};
