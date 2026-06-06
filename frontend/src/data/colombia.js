// Catálogo de departamentos y ciudades principales de Colombia.
// Se usa en formularios (registro, crear oferta) y filtros del Home.
// Lista pragmática: capital + ciudades grandes/medianas por departamento.

export const COLOMBIA = {
  'Amazonas': ['Leticia', 'Puerto Nariño'],
  'Antioquia': [
    'Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Turbo', 'Rionegro',
    'Sabaneta', 'Caldas', 'La Estrella', 'Copacabana', 'Girardota'
  ],
  'Arauca': ['Arauca', 'Saravena', 'Tame', 'Arauquita'],
  'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Puerto Colombia', 'Galapa'],
  'Bolívar': ['Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar'],
  'Boyacá': ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa', 'Villa de Leyva'],
  'Caldas': ['Manizales', 'La Dorada', 'Chinchiná', 'Villamaría', 'Riosucio'],
  'Caquetá': ['Florencia', 'San Vicente del Caguán', 'Puerto Rico'],
  'Casanare': ['Yopal', 'Aguazul', 'Villanueva', 'Tauramena'],
  'Cauca': ['Popayán', 'Santander de Quilichao', 'Patía', 'Puerto Tejada'],
  'Cesar': ['Valledupar', 'Aguachica', 'Bosconia', 'Codazzi'],
  'Chocó': ['Quibdó', 'Istmina', 'Tadó'],
  'Córdoba': ['Montería', 'Lorica', 'Cereté', 'Sahagún', 'Planeta Rica'],
  'Cundinamarca': [
    'Bogotá', 'Soacha', 'Facatativá', 'Zipaquirá', 'Chía', 'Mosquera', 'Madrid',
    'Funza', 'Cajicá', 'Girardot', 'Fusagasugá', 'La Calera', 'Cota', 'Tenjo'
  ],
  'Guainía': ['Inírida'],
  'Guaviare': ['San José del Guaviare'],
  'Huila': ['Neiva', 'Pitalito', 'Garzón', 'La Plata'],
  'La Guajira': ['Riohacha', 'Maicao', 'Uribia', 'San Juan del Cesar'],
  'Magdalena': ['Santa Marta', 'Ciénaga', 'Fundación', 'El Banco'],
  'Meta': ['Villavicencio', 'Acacías', 'Granada', 'Puerto López'],
  'Nariño': ['Pasto', 'Tumaco', 'Ipiales', 'Túquerres'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario', 'Los Patios'],
  'Putumayo': ['Mocoa', 'Puerto Asís', 'Orito'],
  'Quindío': ['Armenia', 'Calarcá', 'Montenegro', 'La Tebaida'],
  'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia'],
  'San Andrés y Providencia': ['San Andrés', 'Providencia'],
  'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil'],
  'Sucre': ['Sincelejo', 'Corozal', 'Sampués', 'San Marcos'],
  'Tolima': ['Ibagué', 'Espinal', 'Melgar', 'Honda', 'Mariquita'],
  'Valle del Cauca': [
    'Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Buga', 'Yumbo', 'Jamundí'
  ],
  'Vaupés': ['Mitú'],
  'Vichada': ['Puerto Carreño']
};

// Lista ordenada de departamentos (para selects)
export const DEPARTMENTS = Object.keys(COLOMBIA).sort((a, b) =>
  a.localeCompare(b, 'es')
);

// Ciudades de un departamento (vacío si no existe)
export function citiesOf(department) {
  if (!department) return [];
  return COLOMBIA[department] || [];
}

// Validación combinada
export function isValidLocation(department, city) {
  if (!DEPARTMENTS.includes(department)) return false;
  return citiesOf(department).includes(city);
}

// Validación de teléfono móvil colombiano: empieza con 3 y tiene 10 dígitos
export function isValidColombianPhone(phone) {
  return /^3\d{9}$/.test(String(phone || '').trim());
}

// Formatea un número COL a "300 123 4567" (solo presentación visual)
export function formatPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length !== 10) return phone || '';
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

// Construye URL de WhatsApp con prefijo +57 y mensaje opcional
export function buildWhatsAppLink(phone, message = '') {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length !== 10) return null;
  const full = `57${digits}`;
  const text = encodeURIComponent(message || '');
  return `https://wa.me/${full}${text ? `?text=${text}` : ''}`;
}

// Categorías canónicas para el marketplace
export const CATEGORIES = [
  'Vehículos',
  'Inmuebles',
  'Tecnología',
  'Hogar',
  'Electrodomésticos',
  'Moda',
  'Belleza y salud',
  'Deportes',
  'Bebés y niños',
  'Mascotas',
  'Servicios',
  'Empleos',
  'Otros'
];
