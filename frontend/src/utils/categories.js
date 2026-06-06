// Categorías oficiales de SumerceMarket con etiquetas e iconos
export const CATEGORIES = [
  { id: 'zapatos', label: 'Zapatos', icon: '👟' },
  { id: 'ropa', label: 'Ropa', icon: '👕' },
  { id: 'carros', label: 'Carros', icon: '🚗' },
  { id: 'motos', label: 'Motos', icon: '🏍️' },
  { id: 'odontologia', label: 'Servicios de odontología', icon: '🦷' },
  { id: 'gym', label: 'Servicios de gym', icon: '🏋️' },
  { id: 'belleza', label: 'Servicios de belleza', icon: '💅' },
  { id: 'plaza', label: 'Plaza de mercado', icon: '🥬' },
  { id: 'otros', label: 'Otros', icon: '📦' }
];

export function getCategory(id) {
  return CATEGORIES.find(c => c.id === id) || { id, label: id, icon: '📦' };
}

// Formato de precio en pesos colombianos
export function formatCOP(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(price);
}

// Construye link WhatsApp con mensaje pre-llenado
export function buildWhatsAppLink(phone, message) {
  // Quitar todo lo que no sea dígito
  let clean = (phone || '').replace(/\D/g, '');
  // Si no empieza con 57 y tiene 10 dígitos, anteponer indicativo Colombia
  if (clean.length === 10 && !clean.startsWith('57')) clean = '57' + clean;
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
