// MyOffers.jsx
// Lista las ofertas del usuario autenticado. Permite cambiar estado,
// editar campos básicos en línea y eliminar oferta + imágenes asociadas
// (registro en BD + archivos en Storage).
//
// Estados de oferta soportados:
//   - active   : visible al público.
//   - paused   : oculta al público; visible al vendedor.
//   - sold     : vendida; oculta al público; visible al vendedor.
//   - archived : vendida + archivada por el vendedor para ocultarla
//                de su vista principal. No se borra. Sigue visible
//                para el admin y para estadísticas históricas.
//
// Acciones por oferta:
// - "Marcar vendida"  (active|paused -> sold)
// - "Reactivar"       (sold|archived -> active)
// - "Archivar"        (sold          -> archived)  ← NUEVO
//
// Reglas UX:
// - El filtro por defecto ("Todas") oculta las archivadas para que
//   no llenen la vista principal del vendedor.
// - Existe un filtro explícito "Archivadas" para consultarlas.
// - Los UPDATE se restringen por id Y por user_id = auth.uid() como
//   defensa en profundidad (además de RLS).
// - Tras el UPDATE se recarga la lista desde Supabase (fuente de verdad).
// - Los errores se muestran en el banner de error de la página (no alert).

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
// 'all' aquí significa "Todas (sin archivadas)". Las archivadas
// solo se muestran cuando el filtro es 'archived'.
const STATUS_OPTIONS = ['all', 'active', 'paused', 'sold', 'archived'];

export default function MyOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null); // oferta en edición
  const [busyId, setBusyId] = useState(null);   // id de oferta cuyo status se está cambiando

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

  // 'all' = todo excepto archivadas (vista principal del vendedor).
  // 'archived' = solo archivadas.
  // resto = filtro exacto por estado.
  const filtered = useMemo(() => {
    if (filter === 'all') return offers.filter((o) => o.status !== 'archived');
    return offers.filter((o) => o.status === filter);
  }, [offers, filter]);

  const counts = useMemo(() => {
    const c = { all: 0, active: 0, paused: 0, sold: 0, archived: 0 };
    for (const o of offers) {
      if (c[o.status] != null) c[o.status]++;
      if (o.status !== 'archived') c.all++;
    }
    return c;
  }, [offers]);

  // Helper interno: actualiza offers.status para una oferta del usuario
  // autenticado. Restringe por id Y user_id (defensa en profundidad).
  // Usa .select() para detectar el caso silencioso de RLS (data = []).
  // Tras un OK, recarga la lista desde Supabase.
  const updateOwnOfferStatus = async (offerId, nextStatus) => {
    if (!user?.id) {
      throw new Error('Debes iniciar sesión para realizar esta acción.');
    }
    const { data, error: upErr } = await supabase
      .from('offers')
      .update({ status: nextStatus })
      .eq('id', offerId)
      .eq('user_id', user.id)
      .select('id, status');

    if (upErr) throw upErr;

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(
        'El cambio no se guardó. Verifica que la oferta es tuya y que las políticas RLS permiten actualizar offers.status.'
      );
    }

    await fetchOffers();
  };

  const handleChangeStatus = async (offer, nextStatus) => {
    if (offer.status === nextStatus) return;
    if (busyId) return;

    setBusyId(offer.id);
    setError('');
    try {
      await updateOwnOfferStatus(offer.id, nextStatus);
    } catch (err) {
      setError('No fue posible cambiar el estado: ' + (err?.message || 'error desconocido'));
    } finally {
      setBusyId(null);
    }
  };

  // Botón "Marcar vendida" / "Reactivar" en cada oferta propia.
  // - 'active' | 'paused'  -> 'sold' (con confirmación)
  // - 'sold' | 'archived'  -> 'active' (reactivar)
  const handleMarkSold = async (offer) => {
    if (!offer || busyId) return;

    const isSoldOrArchived = offer.status === 'sold' || offer.status === 'archived';
    const nextStatus = isSoldOrArchived ? 'active' : 'sold';

    if (!isSoldOrArchived) {
      const ok = window.confirm(
        `¿Marcar la oferta "${offer.title}" como VENDIDA? Dejará de aparecer en el catálogo público.`
      );
      if (!ok) return;
    }

    setBusyId(offer.id);
    setError('');
    try {
      await updateOwnOfferStatus(offer.id, nextStatus);
    } catch (err) {
      setError(
        (isSoldOrArchived
          ? 'No fue posible reactivar la oferta: '
          : 'No fue posible marcar la oferta como vendida: ') +
          (err?.message || 'error desconocido')
      );
    } finally {
      setBusyId(null);
    }
  };

  // Botón "Archivar" — solo visible cuando la oferta está vendida.
  // Cambia status de 'sold' a 'archived' para ocultarla de la vista
  // principal del vendedor sin borrar ningún dato histórico.
  const handleArchive = async (offer) => {
    if (!offer || busyId) return;
    if (offer.status !== 'sold') return;

    const ok = window.confirm(
      `¿Archivar la oferta "${offer.title}"? Dejará de aparecer en tu lista principal, pero seguirá guardada para tu historial y para el admin.`
    );
    if (!ok) return;

    setBusyId(offer.id);
    setError('');
    try {
      await updateOwnOfferStatus(offer.id, 'archived');
    } catch (err) {
      setError('No fue posible archivar la oferta: ' + (err?.message || 'error desconocido'));
    } finally {
      setBusyId(null);
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

      // 3) Borrar la oferta (restringido por user_id como defensa en profundidad)
      const { error: delErr } = await supabase
        .from('offers')
        .delete()
        .eq('id', offer.id)
        .eq('user_id', user?.id);
      if (delErr) throw delErr;

      setOffers((prev) => prev.filter((o) => o.id !== offer.id));
    } catch (err) {
      setError('No fue posible eliminar la oferta: ' + (err?.message || ''));
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
          {filtered.map((o) => {
            const isSold = o.status === 'sold';
            const isArchived = o.status === 'archived';
            const isSoldOrArchived = isSold || isArchived;
            const isBusy = busyId === o.id;
            return (
              <div key={o.id} style={styles.cardWrap}>
                <OfferCard
                  offer={o}
                  showOwnerActions
                  onEdit={(off) => setEditing(off)}
                  onDelete={handleDelete}
                  onChangeStatus={handleChangeStatus}
                />
                <div style={styles.cardActions}>
                  <button
                    type="button"
                    className={isSoldOrArchived ? 'btn btn-ghost' : 'btn'}
                    onClick={() => handleMarkSold(o)}
                    disabled={isBusy}
                    title={
                      isSoldOrArchived
                        ? 'Volver a publicar la oferta como activa'
                        : 'Marcar la oferta como vendida'
                    }
                    style={{ flex: 1 }}
                  >
                    {isBusy
                      ? '⏳ Guardando…'
                      : isSoldOrArchived
                        ? '♻️ Reactivar'
                        : '💸 Marcar vendida'}
                  </button>

                  {isSold && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => handleArchive(o)}
                      disabled={isBusy}
                      title="Ocultar de tu vista principal sin borrar datos"
                      style={{ flex: 1 }}
                    >
                      📦 Archivar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
    sold: 'Vendidas',
    archived: 'Archivadas'
  }[s] || s;
}

function EmptyState({ filter }) {
  const titles = {
    all: 'Aún no tienes ofertas publicadas',
    active: 'No tienes ofertas activas',
    paused: 'No tienes ofertas pausadas',
    sold: 'No tienes ofertas vendidas',
    archived: 'No tienes ofertas archivadas'
  };
  return (
    <div className="card" style={{ marginTop: 16, textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 48 }}>{filter === 'archived' ? '📦' : '📭'}</div>
      <h3 style={{ margin: '8px 0' }}>{titles[filter] || titles.all}</h3>
      <p style={{ color: '#6b7280', margin: '0 0 12px 0' }}>
        {filter === 'archived'
          ? 'Aquí aparecerán las ofertas vendidas que decidas archivar.'
          : 'Empieza a vender publicando tu primer producto.'}
      </p>
      {filter !== 'archived' && (
        <Link to="/publish" className="btn">+ Publicar oferta</Link>
      )}
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
  cardWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  cardActions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap'
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
