// Catálogo de categorías de SumerceMarket.
// Los `id` deben coincidir con los valores cargados en la tabla `categories` de Supabase.
// Se usan como referencia (FK) en `offers.category`.

export const CATEGORIES = [
  { id: 'vehiculos',    label: 'Vehículos',           icon: '🚗' },
  { id: 'motos',        label: 'Motos',               icon: '🏍️' },
  { id: 'inmuebles',    label: 'Inmuebles',           icon: '🏠' },
  { id: 'electronica',  label: 'Electrónica',         icon: '📱' },
  { id: 'computadores', label: 'Computadores',        icon: '💻' },
  { id: 'hogar',        label: 'Hogar y muebles',     icon: '🛋️' },
  { id: 'electrodomesticos', label: 'Electrodomésticos', icon: '🔌' },
  { id: 'moda',         label: 'Moda y accesorios',   icon: '👕' },
  { id: 'belleza',      label: 'Belleza y salud',     icon: '💄' },
  { id: 'deportes',     label: 'Deportes',            icon: '⚽' },
  { id: 'mascotas',     label: 'Mascotas',            icon: '🐶' },
  { id: 'bebes',        label: 'Bebés y niños',       icon: '🍼' },
  { id: 'juguetes',     label: 'Juguetes',            icon: '🧸' },
  { id: 'libros',       label: 'Libros y revistas',   icon: '📚' },
  { id: 'musica',       label: 'Música e instrumentos', icon: '🎸' },
  { id: 'arte',         label: 'Arte y coleccionables', icon: '🎨' },
  { id: 'herramientas', label: 'Herramientas',        icon: '🔧' },
  { id: 'agro',         label: 'Agro y campo',        icon: '🌾' },
  { id: 'servicios',    label: 'Servicios',           icon: '🛠️' },
  { id: 'empleos',      label: 'Empleos',             icon: '💼' },
  { id: 'otros',        label: 'Otros',               icon: '📦' }
];

// Lista plana de ids válidos (útil para validar formularios)
export const VALID_CATEGORY_IDS = CATEGORIES.map(c => c.id);

// Búsqueda rápida por id
export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || null;
}

// Etiqueta legible (fallback al id si no se encuentra)
export function categoryLabel(id) {
  const c = getCategoryById(id);
  return c ? c.label : id;
}
