// Departamentos y ciudades principales de Colombia
// Fuente: división político-administrativa DANE (subset de ciudades principales)
export const COLOMBIA = {
  'Amazonas': ['Leticia', 'Puerto Nariño'],
  'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Rionegro', 'Turbo', 'Sabaneta', 'Copacabana', 'La Estrella'],
  'Arauca': ['Arauca', 'Saravena', 'Tame', 'Arauquita'],
  'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Puerto Colombia', 'Galapa'],
  'Bolívar': ['Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar'],
  'Boyacá': ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa'],
  'Caldas': ['Manizales', 'La Dorada', 'Chinchiná', 'Villamaría'],
  'Caquetá': ['Florencia', 'San Vicente del Caguán', 'Puerto Rico'],
  'Casanare': ['Yopal', 'Aguazul', 'Villanueva', 'Tauramena'],
  'Cauca': ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía'],
  'Cesar': ['Valledupar', 'Aguachica', 'Codazzi', 'Bosconia'],
  'Chocó': ['Quibdó', 'Istmina', 'Tadó'],
  'Córdoba': ['Montería', 'Cereté', 'Lorica', 'Sahagún', 'Planeta Rica'],
  'Cundinamarca': ['Bogotá', 'Soacha', 'Facatativá', 'Zipaquirá', 'Chía', 'Mosquera', 'Madrid', 'Fusagasugá', 'Girardot', 'Cajicá'],
  'Guainía': ['Inírida'],
  'Guaviare': ['San José del Guaviare'],
  'Huila': ['Neiva', 'Pitalito', 'Garzón', 'La Plata'],
  'La Guajira': ['Riohacha', 'Maicao', 'Uribia', 'Manaure'],
  'Magdalena': ['Santa Marta', 'Ciénaga', 'Fundación', 'Aracataca'],
  'Meta': ['Villavicencio', 'Acacías', 'Granada', 'Puerto López'],
  'Nariño': ['Pasto', 'Tumaco', 'Ipiales', 'Túquerres'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario', 'Los Patios'],
  'Putumayo': ['Mocoa', 'Puerto Asís', 'Orito'],
  'Quindío': ['Armenia', 'Calarcá', 'La Tebaida', 'Montenegro'],
  'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia'],
  'San Andrés y Providencia': ['San Andrés', 'Providencia'],
  'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil'],
  'Sucre': ['Sincelejo', 'Corozal', 'Sampués', 'San Marcos'],
  'Tolima': ['Ibagué', 'Espinal', 'Honda', 'Melgar', 'Líbano'],
  'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Buga', 'Jamundí', 'Yumbo'],
  'Vaupés': ['Mitú'],
  'Vichada': ['Puerto Carreño']
};

export const DEPARTMENTS = Object.keys(COLOMBIA).sort();

export function citiesOf(dept) {
  return (COLOMBIA[dept] || []).slice().sort();
}

export const VALID_CATEGORIES = [
  'zapatos','ropa','carros','motos','odontologia','gym','belleza','plaza','otros'
];
