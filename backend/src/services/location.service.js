// Departamentos y principales ciudades de Colombia
export const COLOMBIA_LOCATIONS = {
  'Amazonas': ['Leticia', 'Puerto Nariño'],
  'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Turbo', 'Rionegro', 'Sabaneta', 'La Estrella', 'Copacabana'],
  'Arauca': ['Arauca', 'Saravena', 'Tame', 'Arauquita'],
  'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Sabanagrande', 'Puerto Colombia', 'Galapa'],
  'Bolívar': ['Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar'],
  'Boyacá': ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa', 'Villa de Leyva'],
  'Caldas': ['Manizales', 'La Dorada', 'Chinchiná', 'Villamaría', 'Riosucio'],
  'Caquetá': ['Florencia', 'San Vicente del Caguán', 'Puerto Rico'],
  'Casanare': ['Yopal', 'Aguazul', 'Villanueva', 'Tauramena'],
  'Cauca': ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía'],
  'Cesar': ['Valledupar', 'Aguachica', 'Codazzi', 'La Jagua de Ibirico'],
  'Chocó': ['Quibdó', 'Istmina', 'Tadó'],
  'Córdoba': ['Montería', 'Lorica', 'Cereté', 'Sahagún', 'Planeta Rica'],
  'Cundinamarca': ['Bogotá', 'Soacha', 'Facatativá', 'Chía', 'Zipaquirá', 'Fusagasugá', 'Mosquera', 'Madrid', 'Funza', 'Cajicá', 'Girardot'],
  'Guainía': ['Inírida'],
  'Guaviare': ['San José del Guaviare'],
  'Huila': ['Neiva', 'Pitalito', 'Garzón', 'La Plata'],
  'La Guajira': ['Riohacha', 'Maicao', 'Uribia', 'Manaure', 'San Juan del Cesar'],
  'Magdalena': ['Santa Marta', 'Ciénaga', 'Fundación', 'El Banco'],
  'Meta': ['Villavicencio', 'Acacías', 'Granada', 'Puerto López'],
  'Nariño': ['Pasto', 'Tumaco', 'Ipiales', 'Túquerres'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Villa del Rosario', 'Los Patios', 'Pamplona'],
  'Putumayo': ['Mocoa', 'Puerto Asís', 'Orito', 'Valle del Guamuez'],
  'Quindío': ['Armenia', 'Calarcá', 'La Tebaida', 'Montenegro'],
  'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia'],
  'San Andrés y Providencia': ['San Andrés', 'Providencia'],
  'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil'],
  'Sucre': ['Sincelejo', 'Corozal', 'Sampués', 'San Marcos'],
  'Tolima': ['Ibagué', 'Espinal', 'Honda', 'Melgar', 'Mariquita'],
  'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Buga', 'Jamundí', 'Yumbo'],
  'Vaupés': ['Mitú'],
  'Vichada': ['Puerto Carreño']
};

export function getDepartments() {
  return Object.keys(COLOMBIA_LOCATIONS).sort();
}

export function getCities(department) {
  return COLOMBIA_LOCATIONS[department] || [];
}
