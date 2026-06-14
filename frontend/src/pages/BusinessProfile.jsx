import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../components/ImageUploader';
import '../styles/business-profile-builder.css';

const STYLE_PRESETS = [
  {
    name: 'Súmercé Clásico',
    primary: '#2563eb',
    bg: '#f8fafc',
    text: '#0f172a',
    btnBg: '#2563eb',
    btnText: '#ffffff',
    font: 'Plus Jakarta Sans'
  },
  {
    name: 'Elegancia Oscura',
    primary: '#38bdf8',
    bg: '#0f172a',
    text: '#f8fafc',
    btnBg: '#38bdf8',
    btnText: '#0f172a',
    font: 'Inter'
  },
  {
    name: 'Oro Lujoso',
    primary: '#d4af37',
    bg: '#1a1a1a',
    text: '#fdfbf7',
    btnBg: '#d4af37',
    btnText: '#1a1a1a',
    font: 'Cinzel'
  },
  {
    name: 'Terracota Cálido',
    primary: '#c2410c',
    bg: '#fdf8f5',
    text: '#292524',
    btnBg: '#c2410c',
    btnText: '#ffffff',
    font: 'Outfit'
  },
  {
    name: 'Esmeralda Natural',
    primary: '#059669',
    bg: '#f0fdf4',
    text: '#064e3b',
    btnBg: '#059669',
    btnText: '#ffffff',
    font: 'Plus Jakarta Sans'
  },
  {
    name: 'Artesanal Chic',
    primary: '#db2777',
    bg: '#fff5f7',
    text: '#500724',
    btnBg: '#db2777',
    btnText: '#ffffff',
    font: 'Caveat'
  },
  {
    name: 'Tecno Futurista',
    primary: '#6366f1',
    bg: '#0b0f19',
    text: '#f1f5f9',
    btnBg: '#6366f1',
    btnText: '#ffffff',
    font: 'Outfit'
  },
  {
    name: 'Aventura Naranja',
    primary: '#f97316',
    bg: '#18181b',
    text: '#f4f4f5',
    btnBg: '#f97316',
    btnText: '#18181b',
    font: 'Montserrat'
  },
  {
    name: 'Súper Fresh',
    primary: '#84cc16',
    bg: '#fafdf5',
    text: '#1a2e05',
    btnBg: '#84cc16',
    btnText: '#ffffff',
    font: 'Calibri'
  },
  {
    name: 'Motos Deportivas',
    primary: '#ef4444',
    bg: '#090d16',
    text: '#f8fafc',
    btnBg: '#ef4444',
    btnText: '#ffffff',
    font: 'Montserrat'
  },
  {
    name: 'Carros Premium',
    primary: '#fbbf24',
    bg: '#0f172a',
    text: '#f8fafc',
    btnBg: '#fbbf24',
    btnText: '#0f172a',
    font: 'Outfit'
  },
  {
    name: 'Moda Rosa',
    primary: '#ec4899',
    bg: '#fffbfb',
    text: '#3d0a21',
    btnBg: '#ec4899',
    btnText: '#ffffff',
    font: 'Raleway'
  },
  {
    name: 'Spa Menta',
    primary: '#0d9488',
    bg: '#f5fcf9',
    text: '#115e59',
    btnBg: '#0d9488',
    btnText: '#ffffff',
    font: 'Inter'
  },
  {
    name: 'Belleza Glam',
    primary: '#881337',
    bg: '#faf7f5',
    text: '#4c0519',
    btnBg: '#881337',
    btnText: '#ffffff',
    font: 'Playfair Display'
  },
  {
    name: 'Calzado Urbano',
    primary: '#eab308',
    bg: '#1e1e24',
    text: '#f4f4f5',
    btnBg: '#eab308',
    btnText: '#1e1e24',
    font: 'Bebas Neue'
  },
  {
    name: 'Tecnología Neón',
    primary: '#06b6d4',
    bg: '#030712',
    text: '#f3f4f6',
    btnBg: '#06b6d4',
    btnText: '#030712',
    font: 'Inter'
  },
  {
    name: 'Panadería Artesanal',
    primary: '#b45309',
    bg: '#fdfaf2',
    text: '#78350f',
    btnBg: '#b45309',
    btnText: '#ffffff',
    font: 'Outfit'
  }
];

const getTemplateLayout = (templateId) => {
  if (['motos', 'cars', 'vehicles'].includes(templateId)) return 'automotive';
  if (['beauty', 'fashion', 'clothing'].includes(templateId)) return 'elegant';
  if (['services', 'health', 'gym', 'veterinary'].includes(templateId)) return 'services';
  return 'retail';
};

const FONTS = [
  // === Sistema / Word ===
  { id: 'Arial', name: 'Arial — Clásica sin serifas' },
  { id: 'Calibri', name: 'Calibri — Estándar de Word' },
  { id: 'Times New Roman', name: 'Times New Roman — Formal y clásica' },
  { id: 'Georgia', name: 'Georgia — Elegante con serifas' },
  { id: 'Garamond', name: 'Garamond — Editorial y refinada' },
  { id: 'Verdana', name: 'Verdana — Alta legibilidad' },
  { id: 'Tahoma', name: 'Tahoma — Limpia y compacta' },
  { id: 'Trebuchet MS', name: 'Trebuchet MS — Redondeada amigable' },
  { id: 'Impact', name: 'Impact — Fuerte y llamativa' },
  { id: 'Comic Sans MS', name: 'Comic Sans — Casual y divertida' },
  // === Google Fonts — Modernas ===
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans — Moderna premium' },
  { id: 'Inter', name: 'Inter — Limpia y técnica' },
  { id: 'DM Sans', name: 'DM Sans — Geométrica suave' },
  { id: 'Figtree', name: 'Figtree — Fresca y contemporánea' },
  { id: 'Outfit', name: 'Outfit — Geométrica joven' },
  { id: 'Nunito', name: 'Nunito — Redondeada y amigable' },
  { id: 'Poppins', name: 'Poppins — Geométrica profesional' },
  { id: 'Montserrat', name: 'Montserrat — Urbana y versátil' },
  { id: 'Raleway', name: 'Raleway — Elegante y ligera' },
  { id: 'Josefin Sans', name: 'Josefin Sans — Delgada y estilizada' },
  { id: 'Ubuntu', name: 'Ubuntu — Humanista moderna' },
  { id: 'Open Sans', name: 'Open Sans — Neutral y legible' },
  { id: 'Source Sans 3', name: 'Source Sans 3 — Corporativa clara' },
  { id: 'Lato', name: 'Lato — Humanista equilibrada' },
  { id: 'Roboto', name: 'Roboto — Estándar Android' },
  { id: 'Oswald', name: 'Oswald — Condensada llamativa' },
  { id: 'PT Sans', name: 'PT Sans — Humanista completa' },
  // === Google Fonts — Elegantes/Serifas ===
  { id: 'Playfair Display', name: 'Playfair Display — Premium elegante' },
  { id: 'Merriweather', name: 'Merriweather — Legible con serifas' },
  // === Google Fonts — Display/Impacto ===
  { id: 'Bebas Neue', name: 'Bebas Neue — Impacto todo mayúsculas' },
];

const TEMPLATES = [
  { id: 'store',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>, name: 'Tienda' },
  { id: 'fashion',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg>, name: 'Moda' },
  { id: 'beauty',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a5 5 0 015 5c0 3-5 11-5 11S7 10 7 7a5 5 0 015-5z"/><circle cx="12" cy="7" r="1.5" fill="currentColor"/></svg>, name: 'Belleza' },
  { id: 'health',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, name: 'Salud' },
  { id: 'gym',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 6.5h11m-11 11h11M3 9.5h18M3 14.5h18"/></svg>, name: 'Gym' },
  { id: 'vehicles', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, name: 'Vehículos' },
  { id: 'food',     icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>, name: 'Comida' },
  { id: 'services', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>, name: 'Servicios' },
  
  // Nuevas plantillas
  { id: 'appliances', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="3" width="16" height="18" rx="2" ry="2"/><path d="M9 6h6M9 10h6"/><circle cx="12" cy="15" r="3"/><circle cx="12" cy="15" r="1"/></svg>, name: 'Electrodomésticos' },
  { id: 'tech',     icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, name: 'Tecnología' },
  { id: 'footwear', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 18h16a1 1 0 001-1V9a2 2 0 00-2-2h-3v4l-4-4H4a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>, name: 'Calzado' },
  { id: 'clothing', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h18l-2 13H5L3 7z"/><path d="M6 3h12v4H6V3z"/></svg>, name: 'Ropa y Accesorios' },
  { id: 'motos',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="M10 18v-4l3-3h5M14 6c0 1.1-.9 2-2 2H8L5 14h5v4"/></svg>, name: 'Motos' },
  { id: 'cars',     icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3C13 6.8 11.5 6 10 6H4C2.9 6 2 6.9 2 8v8c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/></svg>, name: 'Carros' },
  { id: 'veterinary', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5c-1.7-2.6-5.5-2.6-7.2 0-.8 1.2-.8 3.2 0 4.4L12 17l7.2-7.6c.8-1.2.8-3.2 0-4.4-1.7-2.6-5.5-2.6-7.2 0z"/><path d="M12 9v6M9 12h6"/></svg>, name: 'Veterinarias' },
  { id: 'supermarket', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 12.5c.2.9 1 1.5 2 1.5h9.7c1 0 1.8-.6 2-1.5L23 6H6"/></svg>, name: 'Supermercado' },
  { id: 'hardware', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.77 3.77z"/></svg>, name: 'Ferreterías' },
  { id: 'bakery',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 00-7.3 16.8L3 21h3.2a10 10 0 0013.1-2.2 10 10 0 00-7.3-16.8z"/><path d="M9 12h6M9 16h6"/></svg>, name: 'Panaderías' }
];

const TEMPLATE_SERVICES = {
  store: [
    { icon: "🛒", title: "Variedad de productos", desc: "Encuentra todo en un solo lugar." },
    { icon: "💳", title: "Pagos seguros", desc: "Múltiples medios de pago." },
    { icon: "🚚", title: "Envíos", desc: "A toda la ciudad." },
    { icon: "🤝", title: "Atención cercana", desc: "Te ayudamos a elegir lo mejor." },
  ],
  fashion: [
    { icon: "👗", title: "Colecciones nuevas", desc: "Prendas y accesorios de temporada." },
    { icon: "✂️", title: "Arreglos a medida", desc: "Ajustes y confección personalizada." },
    { icon: "🛍️", title: "Asesoría de estilo", desc: "Te ayudamos a elegir tu look ideal." },
    { icon: "🚚", title: "Envíos a domicilio", desc: "Recibe tu pedido en la puerta de tu casa." },
  ],
  beauty: [
    { icon: "💅", title: "Manicure y pedicure", desc: "Cuidado y diseño profesional." },
    { icon: "💇‍♀️", title: "Cortes y peinados", desc: "Estilo a la última tendencia." },
    { icon: "✨", title: "Tratamientos faciales", desc: "Limpieza y rejuvenecimiento." },
    { icon: "💄", title: "Maquillaje", desc: "Para eventos y ocasiones especiales." },
  ],
  health: [
    { icon: "🩺", title: "Consultas", desc: "Atención profesional personalizada." },
    { icon: "💊", title: "Tratamientos", desc: "Planes adaptados a tu necesidad." },
    { icon: "🧘", title: "Bienestar", desc: "Acompañamiento integral." },
    { icon: "📅", title: "Agenda tu cita", desc: "Horarios flexibles." },
  ],
  gym: [
    { icon: "🏋️", title: "Entrenamiento", desc: "Rutinas guiadas para todo nivel." },
    { icon: "🥗", title: "Nutrición", desc: "Planes alimenticios personalizados." },
    { icon: "🤸", title: "Clases grupales", desc: "Energía y motivación en equipo." },
    { icon: "📈", title: "Seguimiento", desc: "Mide tu progreso real." },
  ],
  vehicles: [
    { icon: "🚗", title: "Venta", desc: "Vehículos seleccionados y revisados." },
    { icon: "🔧", title: "Mecánica", desc: "Mantenimiento y reparaciones." },
    { icon: "🛞", title: "Repuestos", desc: "Originales y garantizados." },
    { icon: "📄", title: "Trámites", desc: "Te asesoramos en todo el proceso." },
  ],
  food: [
    { icon: "🍽️", title: "Menú del día", desc: "Platos frescos y caseros." },
    { icon: "🍔", title: "Para llevar", desc: "Empaque listo para disfrutar." },
    { icon: "🛵", title: "Domicilios", desc: "Lo llevamos hasta tu puerta." },
    { icon: "🎉", title: "Eventos", desc: "Servicio para celebraciones." },
  ],
  services: [
    { icon: "🛠️", title: "Servicios técnicos", desc: "Soluciones rápidas y confiables." },
    { icon: "📞", title: "Atención personalizada", desc: "Te escuchamos y asesoramos." },
    { icon: "⏱️", title: "Respuesta rápida", desc: "Tiempo de respuesta corto." },
    { icon: "💼", title: "Profesionales", desc: "Equipo con experiencia." },
  ],
  appliances: [
    { icon: "📺", title: "Televisores y Video", desc: "Pantallas de última tecnología para tu hogar." },
    { icon: "🧺", title: "Línea Blanca", desc: "Lavadoras, secadoras y neveras eficientes." },
    { icon: "🍳", title: "Línea Cocina", desc: "Licuadoras, cafeteras y freidoras de aire." },
    { icon: "🛡️", title: "Garantía Extendida", desc: "Respaldo y soporte técnico en tus compras." },
  ],
  tech: [
    { icon: "💻", title: "Computadores", desc: "Equipos de alto rendimiento para trabajo y gaming." },
    { icon: "📱", title: "Smartphones", desc: "Los últimos celulares y complementos premium." },
    { icon: "🎧", title: "Audio y Gadgets", desc: "Audífonos, parlantes y relojes inteligentes." },
    { icon: "🛠️", title: "Soporte Técnico", desc: "Asistencia profesional y mantenimiento." },
  ],
  footwear: [
    { icon: "👟", title: "Calzado Deportivo", desc: "Tenis cómodos para correr, entrenar y caminar." },
    { icon: "🥾", title: "Botas y Aventura", desc: "Calzado resistente para terrenos difíciles y diario." },
    { icon: "👠", title: "Calzado Formal", desc: "Zapatos elegantes para eventos y oficina." },
    { icon: "🧸", title: "Línea Infantil", desc: "Diseños divertidos y duraderos para niños." },
  ],
  clothing: [
    { icon: "👕", title: "Ropa Casual", desc: "Camisetas, jeans y prendas cómodas de diario." },
    { icon: "🧥", title: "Prendas de Abrigo", desc: "Chaquetas, sacos y abrigos para toda estación." },
    { icon: "👗", title: "Vestidos y Formal", desc: "Trajes y vestidos elegantes para ocasiones especiales." },
    { icon: "🧣", title: "Accesorios", desc: "Bolsos, bufandas y complementos perfectos." },
  ],
  motos: [
    { icon: "🏍️", title: "Venta de Motos", desc: "Modelos nuevos y usados garantizados para ti." },
    { icon: "⚙️", title: "Repuestos y Lujos", desc: "Partes originales y accesorios de personalización." },
    { icon: "🛠️", title: "Taller Especializado", desc: "Mantenimiento preventivo y correctivo experto." },
    { icon: "🪖", title: "Accesorios y Cascos", desc: "Equipo de protección certificado y chaquetas." },
  ],
  cars: [
    { icon: "🚗", title: "Catálogo de Autos", desc: "Carros de todas las marcas listos para traspaso." },
    { icon: "🔍", title: "Peritaje y Revisión", desc: "Diagnóstico completo del estado del vehículo." },
    { icon: "💳", title: "Financiación", desc: "Asesoría de crédito y gestión de documentos." },
    { icon: "🛞", title: "Servicios Post-Venta", desc: "Garantía de motor y asistencia en carretera." },
  ],
  veterinary: [
    { icon: "🩺", title: "Consulta Veterinaria", desc: "Atención médica general y chequeos de salud." },
    { icon: "💉", title: "Vacunación", desc: "Esquemas completos para cachorros y adultos." },
    { icon: "🧼", title: "Peluquería y Estética", desc: "Baño, corte de pelo y limpieza higiénica." },
    { icon: "🍖", title: "Pet Shop", desc: "Alimento premium, juguetes y medicamentos." },
  ],
  supermarket: [
    { icon: "🥦", title: "Frutas y Verduras", desc: "Productos frescos y seleccionados del campo." },
    { icon: "🥩", title: "Carnes de Primera", desc: "Cortes frescos de primera calidad." },
    { icon: "🥛", title: "Lácteos y Despensa", desc: "Variedad en abarrotes y productos básicos." },
    { icon: "🛵", title: "Domicilio Express", desc: "Recibe tu mercado completo en minutos." },
  ],
  hardware: [
    { icon: "🛠️", title: "Herramientas", desc: "Equipos profesionales para construcción y hogar." },
    { icon: "🎨", title: "Pinturas", desc: "Amplia gama de colores y complementos para pintar." },
    { icon: "🔌", title: "Eléctricos y Plomería", desc: "Tuberías, cables, tomacorrientes y grifería." },
    { icon: "🧱", title: "Materiales", desc: "Cemento, yeso y arena para tus obras." },
  ],
  bakery: [
    { icon: "🍞", title: "Pan Fresco Diario", desc: "Pan calientito de sal, dulce e integral." },
    { icon: "🍰", title: "Pastelería Fina", desc: "Tortas decoradas y postres para celebraciones." },
    { icon: "☕", title: "Cafetería", desc: "Acompaña tus panecillos con el mejor café." },
    { icon: "🥯", title: "Hojaldres", desc: "Pasteles de pollo, carne y buñuelos recién hechos." },
  ],
};

const DEPARTMENTS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas',
  'Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca',
  'Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño',
  'Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés y Providencia',
  'Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada','Bogotá D.C.'
];

export default function BusinessProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('negocio');

  // Profile fields
  const [businessName, setBusinessName] = useState('');
  const [businessSlug, setBusinessSlug] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessWhatsapp, setBusinessWhatsapp] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessDepartment, setBusinessDepartment] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [businessTemplate, setBusinessTemplate] = useState('store');
  const [businessHeadline, setBusinessHeadline] = useState('');
  const [businessAbout, setBusinessAbout] = useState('');
  const [businessSchedule, setBusinessSchedule] = useState('');
  const [businessPrimaryColor, setBusinessPrimaryColor] = useState('#6366f1');
  const [businessBgColor, setBusinessBgColor] = useState('#f8fafc');
  const [businessTextColor, setBusinessTextColor] = useState('#0f172a');
  const [businessBtnBgColor, setBusinessBtnBgColor] = useState('#6366f1');
  const [businessBtnTextColor, setBusinessBtnTextColor] = useState('#ffffff');
  const [businessFontFamily, setBusinessFontFamily] = useState('Plus Jakarta Sans');
  const [businessServices, setBusinessServices] = useState([]);
  const [newService, setNewService] = useState('');
  const [businessTags, setBusinessTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [coverPositionY, setCoverPositionY] = useState(50);
  const [coverPositionX, setCoverPositionX] = useState(50);
  const [coverZoom, setCoverZoom] = useState(100);
  const [coverFit, setCoverFit] = useState('cover');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('form');

  const layout = getTemplateLayout(businessTemplate);

  const applyPreset = (preset) => {
    setBusinessPrimaryColor(preset.primary);
    setBusinessBgColor(preset.bg);
    setBusinessTextColor(preset.text);
    setBusinessBtnBgColor(preset.btnBg);
    setBusinessBtnTextColor(preset.btnText);
    setBusinessFontFamily(preset.font);
  };

  // Images
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Offers
  const [offers, setOffers] = useState([]);
  const [uploadingOfferId, setUploadingOfferId] = useState(null);
  const offerFileRefs = useRef({});
  const [selectedOfferForImages, setSelectedOfferForImages] = useState(null);

  const handleRefreshOffers = async () => {
    if (!userId) return;
    try {
      const { data: offerData } = await supabase
        .from('offers')
        .select('id, title, price, image_url, status, offer_images(id, url, path, position)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setOffers(offerData || []);
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ─── Load profile ────────────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setBusinessName(profile.business_name || '');
          setBusinessSlug(profile.business_slug || '');
          setBusinessDescription(profile.business_description || '');
          setBusinessWhatsapp(profile.business_whatsapp || '');
          setBusinessAddress(profile.business_address || '');
          setBusinessDepartment(profile.business_department || '');
          setBusinessCity(profile.business_city || '');
          setBusinessTemplate(profile.business_template || 'store');
          setBusinessHeadline(profile.business_headline || '');
          setBusinessAbout(profile.business_about || '');
          setBusinessSchedule(profile.business_schedule || '');
          
          let stylesObj = {
            primary: '#6366f1',
            bg: '#f8fafc',
            text: '#0f172a',
            btnBg: '#6366f1',
            btnText: '#ffffff',
            font: 'Plus Jakarta Sans',
            coverPositionY: 50,
            coverPositionX: 50,
            coverZoom: 100,
            coverFit: 'cover'
          };
          if (profile.business_primary_color) {
            if (profile.business_primary_color.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(profile.business_primary_color);
                stylesObj = { ...stylesObj, ...parsed };
              } catch (e) {
                stylesObj.primary = profile.business_primary_color;
                stylesObj.btnBg = profile.business_primary_color;
              }
            } else {
              stylesObj.primary = profile.business_primary_color;
              stylesObj.btnBg = profile.business_primary_color;
            }
          }
          setBusinessPrimaryColor(stylesObj.primary);
          setBusinessBgColor(stylesObj.bg);
          setBusinessTextColor(stylesObj.text);
          setBusinessBtnBgColor(stylesObj.btnBg);
          setBusinessBtnTextColor(stylesObj.btnText);
          setBusinessFontFamily(stylesObj.font);
          setCoverPositionY(stylesObj.coverPositionY !== undefined ? stylesObj.coverPositionY : 50);
          setCoverPositionX(stylesObj.coverPositionX !== undefined ? stylesObj.coverPositionX : 50);
          setCoverZoom(stylesObj.coverZoom !== undefined ? stylesObj.coverZoom : 100);
          setCoverFit(stylesObj.coverFit !== undefined ? stylesObj.coverFit : 'cover');

          setLogoUrl(profile.business_logo_url || '');
          setCoverUrl(profile.business_cover_url || '');

          let cards = [];
          let tags = [];
          if (profile.business_services) {
            try {
              const parsed = typeof profile.business_services === 'string'
                ? JSON.parse(profile.business_services)
                : profile.business_services;
              
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                cards = parsed.cards || [];
                tags = parsed.tags || [];
              } else if (Array.isArray(parsed)) {
                if (parsed.length > 0 && typeof parsed[0] === 'object') {
                  cards = parsed;
                } else {
                  tags = parsed;
                }
              }
            } catch {
              if (typeof profile.business_services === 'string') {
                tags = profile.business_services.split(',').map(s => s.trim()).filter(Boolean);
              }
            }
          }
          
          setBusinessServices(cards);
          setBusinessTags(tags);
        }

        // Load offers
        const { data: offerData } = await supabase
          .from('offers')
          .select('id, title, price, image_url, status, offer_images(id, url, path, position)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setOffers(offerData || []);
      } catch (err) {
        console.error(err);
        showToast('Error cargando perfil', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [navigate, showToast]);

  // ─── Save profile ────────────────────────────────────────
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const updates = {
        business_name: businessName.trim(),
        business_slug: businessSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
        business_description: businessDescription.trim(),
        business_whatsapp: businessWhatsapp.trim(),
        business_address: businessAddress.trim(),
        business_department: businessDepartment,
        business_city: businessCity.trim(),
        business_template: businessTemplate,
        business_headline: businessHeadline.trim(),
        business_about: businessAbout.trim(),
        business_schedule: businessSchedule.trim(),
        business_primary_color: JSON.stringify({
          primary: businessPrimaryColor,
          bg: businessBgColor,
          text: businessTextColor,
          btnBg: businessBtnBgColor,
          btnText: businessBtnTextColor,
          font: businessFontFamily,
          coverPositionY,
          coverPositionX,
          coverZoom,
          coverFit
        }),
        business_logo_url: logoUrl,
        business_cover_url: coverUrl,
        business_services: JSON.stringify({ cards: businessServices, tags: businessTags }),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      showToast('¡Cambios guardados exitosamente!');
    } catch (err) {
      console.error(err);
      showToast('Error al guardar: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Upload image (general) ──────────────────────────────
  const uploadImage = async (file, bucket, folder) => {
    const ext = file.name.split('.').pop();
    const fileName = `${userId}/${folder}/${Date.now()}.${ext}`;
    
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (err) {
      console.warn(`Failed to upload to bucket '${bucket}', trying fallback to 'offer-images'`, err);
      if (bucket !== 'offer-images') {
        const fallbackFileName = `${userId}/fallback-${folder}/${Date.now()}.${ext}`;
        const { error: fallbackError } = await supabase.storage
          .from('offer-images')
          .upload(fallbackFileName, file, { upsert: true });
        if (fallbackError) {
          throw new Error(`Error al subir imagen (bucket '${bucket}' y 'offer-images' fallaron). Asegúrate de crear el bucket '${bucket}' en tu Supabase dashboard.`);
        }
        const { data: urlData } = supabase.storage
          .from('offer-images')
          .getPublicUrl(fallbackFileName);
        return urlData.publicUrl;
      }
      throw err;
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadImage(file, 'business-assets', 'covers');
      setCoverUrl(url);
      showToast('Portada actualizada');
    } catch (err) {
      showToast('Error subiendo portada: ' + err.message, 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadImage(file, 'business-assets', 'logos');
      setLogoUrl(url);
      showToast('Logo actualizado');
    } catch (err) {
      showToast('Error subiendo logo: ' + err.message, 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // ─── Upload offer image ──────────────────────────────────
  const handleOfferImageUpload = async (e, offerId) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadingOfferId(offerId);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${userId}/${offerId}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('offer-images')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('offer-images')
        .getPublicUrl(filePath);

      const newUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('offers')
        .update({ image_url: newUrl })
        .eq('id', offerId)
        .eq('user_id', userId);
      if (updateError) throw updateError;

      setOffers(prev =>
        prev.map(o => o.id === offerId ? { ...o, image_url: newUrl } : o)
      );

      showToast('Imagen de oferta actualizada');
    } catch (err) {
      console.error(err);
      showToast('Error subiendo imagen: ' + err.message, 'error');
    } finally {
      setUploadingOfferId(null);
    }
  };

  const triggerOfferFileInput = (offerId) => {
    if (offerFileRefs.current[offerId]) {
      offerFileRefs.current[offerId].click();
    }
  };

  // ─── Tags ────────────────────────────────────────────
  const addTag = () => {
    const val = newTag.trim();
    if (val && !businessTags.includes(val)) {
      setBusinessTags([...businessTags, val]);
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setBusinessTags(businessTags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // ─── Custom Service Cards ──────────────────────────────
  const updateServiceCard = (index, field, value) => {
    const updated = [...businessServices];
    if (!updated[index]) {
      updated[index] = { icon: '✨', title: '', desc: '' };
    }
    updated[index] = { ...updated[index], [field]: value };
    setBusinessServices(updated);
  };

  const addServiceCard = () => {
    if (businessServices.length >= 8) {
      showToast('Máximo 8 servicios permitidos', 'error');
      return;
    }
    setBusinessServices([...businessServices, { icon: '✨', title: 'Nuevo Servicio', desc: 'Descripción del servicio' }]);
  };

  const removeServiceCard = (index) => {
    setBusinessServices(businessServices.filter((_, idx) => idx !== index));
  };

  const resetServicesToTemplate = (templateId = businessTemplate) => {
    const defaults = TEMPLATE_SERVICES[templateId] || TEMPLATE_SERVICES.store;
    setBusinessServices(defaults.map(item => ({ ...item })));
    showToast('Servicios reiniciados a los predeterminados de la plantilla');
  };

  const handleTemplateChange = (templateId) => {
    setBusinessTemplate(templateId);
    // Automatically load new default services if current list is empty
    if (businessServices.length === 0) {
      const defaults = TEMPLATE_SERVICES[templateId] || TEMPLATE_SERVICES.store;
      setBusinessServices(defaults.map(item => ({ ...item })));
    }
  };

  // ─── Copy slug ───────────────────────────────────────────
  const copySlugUrl = () => {
    const url = `${window.location.origin}/seller/${businessSlug}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('¡Enlace copiado!');
    });
  };

  // ─── Format price ────────────────────────────────────────
  const formatPrice = (price) => {
    if (!price && price !== 0) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // ─── Profile completion ──────────────────────────────────
  const profileCompletion = (() => {
    const checks = [
      { label: 'Nombre del negocio', done: !!businessName },
      { label: 'URL personalizada (slug)', done: !!businessSlug },
      { label: 'Frase principal', done: !!businessHeadline },
      { label: 'Descripción', done: !!businessDescription },
      { label: 'Logo', done: !!logoUrl },
      { label: 'Portada', done: !!coverUrl },
      { label: 'WhatsApp', done: !!businessWhatsapp },
      { label: 'Dirección / Ciudad', done: !!businessAddress || !!businessCity },
      { label: 'Sobre el negocio', done: !!businessAbout },
      { label: 'Productos / Ofertas', done: offers.length > 0 },
    ];
    const done = checks.filter(c => c.done).length;
    return { checks, done, total: checks.length, pct: Math.round((done / checks.length) * 100) };
  })();

  // ─── Loading State ───────────────────────────────────────
  if (loading) {
    return (
      <div className="bp-builder">
        <div className="bp-loading">
          <div className="bp-spinner" />
          <p className="bp-loading-text">Cargando tu perfil de negocio...</p>
        </div>
      </div>
    );
  }

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="bp-builder">
      {/* ── Top Bar ─────────────────────────────────────── */}
      <header className="bp-topbar">
        <div className="bp-topbar-left">
          <button className="bp-topbar-back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            Inicio
          </button>
          <div>
            <div className="bp-topbar-title">Editor de Página Web</div>
            <div className="bp-topbar-subtitle">Personaliza tu presencia profesional en línea</div>
          </div>
        </div>
        <div className="bp-topbar-actions">
          {businessSlug && (
            <a
              href={`/seller/${businessSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bp-topbar-preview"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Vista previa
            </a>
          )}
          <button
            className="bp-topbar-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'bp-spin 1s linear infinite'}} aria-hidden="true"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg> Guardando...</> 
            ) : (
              <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Guardar cambios</>
            )}
          </button>
        </div>
      </header>

      {/* ── Mobile Navigation Tabs ──────────────────────── */}
      <div className="bp-mobile-tabs">
        <button
          type="button"
          className={`bp-mobile-tab-btn ${activeWorkspaceTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveWorkspaceTab('form')}
        >
          📝 Datos
        </button>
        <button
          type="button"
          className={`bp-mobile-tab-btn ${activeWorkspaceTab === 'styling' ? 'active' : ''}`}
          onClick={() => setActiveWorkspaceTab('styling')}
        >
          🎨 Estilos
        </button>
        <button
          type="button"
          className={`bp-mobile-tab-btn ${activeWorkspaceTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveWorkspaceTab('preview')}
        >
          📱 Vista Previa
        </button>
      </div>

      {/* ── Layout ──────────────────────────────────────── */}
      <div className="bp-layout bp-layout-premium">
        
        {/* ── Column 1: Main Content Editor Form ─────────── */}
        <main className={`bp-main ${activeWorkspaceTab === 'form' ? 'active' : ''}`}>

          {/* Hero & Logo */}
          <div className="bp-card">
            <div className="bp-card-header">
              <div className="bp-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div>
                <div className="bp-card-title">Imagen de Portada &amp; Logo</div>
                <div className="bp-card-desc">La primera impresión de tu negocio</div>
              </div>
            </div>

            {/* Cover */}
            <label className="bp-hero-preview">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                style={{ display: 'none' }}
              />
              {coverUrl ? (
                coverFit === 'contain' ? (
                  <div className="bp-hero-preview-contain-wrap">
                    <div className="bp-hero-preview-contain-blur" style={{ backgroundImage: `url(${coverUrl})` }} />
                    <img src={coverUrl} alt="Portada" className="bp-hero-preview-contain-img" />
                    <div className="bp-hero-overlay">
                      <span className="bp-hero-overlay-text">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        {uploadingCover ? 'Subiendo...' : 'Cambiar portada'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src={coverUrl}
                      alt="Portada"
                      style={{
                        transform: `scale(${coverZoom / 100})`,
                        objectPosition: `${coverPositionX}% ${coverPositionY}%`,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div className="bp-hero-overlay">
                      <span className="bp-hero-overlay-text">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        {uploadingCover ? 'Subiendo...' : 'Cambiar portada'}
                      </span>
                    </div>
                  </>
                )
              ) : (
                <div className="bp-hero-empty">
                  <span className="bp-hero-empty-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </span>
                  <span>{uploadingCover ? 'Subiendo...' : 'Clic para subir portada'}</span>
                </div>
              )}
            </label>

            {/* Banner Position and Zoom Controls */}
            {coverUrl && (
              <div className="bp-banner-adjust-panel">
                <div className="bp-banner-adjust-header">
                  <span>⚙️ Ajustar posición y zoom del banner</span>
                </div>
                
                <div className="bp-form-group">
                  <label className="bp-label">Ajuste de Imagen (Fit)</label>
                  <div className="bp-fit-toggle-group">
                    <button
                      type="button"
                      className={`bp-fit-toggle-btn ${coverFit === 'cover' ? 'active' : ''}`}
                      onClick={() => setCoverFit('cover')}
                    >
                      Rellenar (Cover)
                    </button>
                    <button
                      type="button"
                      className={`bp-fit-toggle-btn ${coverFit === 'contain' ? 'active' : ''}`}
                      onClick={() => setCoverFit('contain')}
                    >
                      Completo (Contain)
                    </button>
                  </div>
                </div>

                {coverFit === 'cover' && (
                  <div className="bp-banner-sliders">
                    <div className="bp-slider-group">
                      <div className="bp-slider-labels">
                        <span className="bp-label">Zoom del Banner ({coverZoom}%)</span>
                        <button type="button" className="bp-slider-reset-btn" onClick={() => setCoverZoom(100)}>Reiniciar</button>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="250"
                        value={coverZoom}
                        onChange={e => setCoverZoom(Number(e.target.value))}
                        className="bp-range-slider"
                      />
                    </div>

                    <div className="bp-slider-group">
                      <div className="bp-slider-labels">
                        <span className="bp-label">Posición Vertical Y ({coverPositionY}%)</span>
                        <button type="button" className="bp-slider-reset-btn" onClick={() => setCoverPositionY(50)}>Centrar</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={coverPositionY}
                        onChange={e => setCoverPositionY(Number(e.target.value))}
                        className="bp-range-slider"
                      />
                    </div>

                    <div className="bp-slider-group">
                      <div className="bp-slider-labels">
                        <span className="bp-label">Posición Horizontal X ({coverPositionX}%)</span>
                        <button type="button" className="bp-slider-reset-btn" onClick={() => setCoverPositionX(50)}>Centrar</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={coverPositionX}
                        onChange={e => setCoverPositionX(Number(e.target.value))}
                        className="bp-range-slider"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logo */}
            <label className="bp-logo-preview" style={{ marginTop: coverUrl ? '-50px' : '16px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
              {logoUrl ? (
                <>
                  <img src={logoUrl} alt="Logo" />
                  <div className="bp-logo-overlay">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </div>
                </>
              ) : (
                <div className="bp-hero-empty" style={{ fontSize: 28 }}>
                  {uploadingLogo
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'bp-spin 1s linear infinite'}} aria-hidden="true"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  }
                </div>
              )}
            </label>

            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--bp-text)', margin: '0 0 4px' }}>
                {businessName || 'Nombre de tu negocio'}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--bp-text-muted)', margin: 0 }}>
                {businessHeadline || 'Tu eslogan o frase principal'}
              </p>
            </div>

            {/* Slug preview */}
            {businessSlug && (
              <div className="bp-slug-preview">
                <div className="bp-slug-url">
                  sumercemarket.com/seller/<strong>{businessSlug}</strong>
                </div>
                <button className="bp-slug-copy" onClick={copySlugUrl} type="button">
                  Copiar enlace
                </button>
              </div>
            )}
          </div>

          {/* ── Progreso del Perfil ─────────────────────── */}
          <div className="bp-card bp-completion-card">
            <div className="bp-card-header">
              <div className="bp-card-icon" style={{ background: profileCompletion.pct >= 80 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: profileCompletion.pct >= 80 ? '#10b981' : '#f59e0b' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div>
                <div className="bp-card-title">Progreso del Perfil</div>
                <div className="bp-card-desc">Completa tu perfil para mayor visibilidad</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div className="bp-completion-pct" style={{ color: profileCompletion.pct >= 80 ? '#10b981' : profileCompletion.pct >= 50 ? '#f59e0b' : '#ef4444' }}>
                  {profileCompletion.pct}%
                </div>
                <div style={{ fontSize: 12, color: 'var(--bp-text-muted)' }}>{profileCompletion.done}/{profileCompletion.total} completados</div>
              </div>
            </div>
            <div className="bp-completion-bar-wrap">
              <div className="bp-completion-bar" style={{ width: `${profileCompletion.pct}%`, background: profileCompletion.pct >= 80 ? '#10b981' : profileCompletion.pct >= 50 ? '#f59e0b' : '#ef4444' }} />
            </div>
            <div className="bp-completion-checks">
              {profileCompletion.checks.map((c, i) => (
                <div key={i} className={`bp-completion-check ${c.done ? 'done' : ''}`}>
                  <span className="bp-completion-dot">
                    {c.done
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    }
                  </span>
                  {c.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Stats Row ─────────────────────────────────── */}
          <div className="bp-stats-row">
            <div className="bp-stat-card">
              <div className="bp-stat-icon">🛍️</div>
              <div className="bp-stat-value">{offers.length}</div>
              <div className="bp-stat-label">Ofertas activas</div>
            </div>
            <div className="bp-stat-card">
              <div className="bp-stat-icon">✅</div>
              <div className="bp-stat-value">{profileCompletion.pct}%</div>
              <div className="bp-stat-label">Perfil completo</div>
            </div>
            <div className="bp-stat-card">
              <div className="bp-stat-icon">🌐</div>
              <div className="bp-stat-value">{businessSlug ? '✓' : '—'}</div>
              <div className="bp-stat-label">Página publicada</div>
            </div>
          </div>

          {/* Información Principal */}
          <div className="bp-card">
            <div className="bp-card-header">
              <div className="bp-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <div>
                <div className="bp-card-title">Información Principal</div>
                <div className="bp-card-desc">Datos básicos de tu negocio</div>
              </div>
            </div>

            <div className="bp-field-row">
              <div className="bp-form-group">
                <label className="bp-label">Nombre del negocio</label>
                <input
                  type="text"
                  className="bp-input"
                  placeholder="Ej: Mi Tienda Premium"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                />
              </div>
              <div className="bp-form-group">
                <label className="bp-label">Slug (URL)</label>
                <input
                  type="text"
                  className="bp-input"
                  placeholder="mi-tienda-premium"
                  value={businessSlug}
                  onChange={e => setBusinessSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  )}
                />
              </div>
            </div>

            <div className="bp-form-group">
              <label className="bp-label">Frase principal (headline)</label>
              <input
                type="text"
                className="bp-input"
                placeholder="Ej: Los mejores productos para tu hogar"
                value={businessHeadline}
                onChange={e => setBusinessHeadline(e.target.value)}
              />
            </div>

            <div className="bp-form-group">
              <label className="bp-label">Descripción corta</label>
              <textarea
                className="bp-textarea"
                placeholder="Describe brevemente tu negocio..."
                value={businessDescription}
                onChange={e => setBusinessDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bp-form-group">
              <label className="bp-label">Sobre tu negocio</label>
              <textarea
                className="bp-textarea"
                placeholder="Cuenta la historia y valores de tu negocio..."
                value={businessAbout}
                onChange={e => setBusinessAbout(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* Contacto y Ubicación */}
          <div className="bp-card">
            <div className="bp-card-header">
              <div className="bp-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <div className="bp-card-title">Contacto &amp; Ubicación</div>
                <div className="bp-card-desc">¿Dónde te encuentran tus clientes?</div>
              </div>
            </div>

            <div className="bp-field-row">
              <div className="bp-form-group">
                <label className="bp-label">WhatsApp</label>
                <input
                  type="text"
                  className="bp-input"
                  placeholder="573001234567"
                  value={businessWhatsapp}
                  onChange={e => setBusinessWhatsapp(e.target.value)}
                />
              </div>
              <div className="bp-form-group">
                <label className="bp-label">Dirección</label>
                <input
                  type="text"
                  className="bp-input"
                  placeholder="Calle 123 #45-67"
                  value={businessAddress}
                  onChange={e => setBusinessAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="bp-field-row">
              <div className="bp-form-group">
                <label className="bp-label">Departamento</label>
                <select
                  className="bp-select"
                  value={businessDepartment}
                  onChange={e => setBusinessDepartment(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="bp-form-group">
                <label className="bp-label">Ciudad</label>
                <input
                  type="text"
                  className="bp-input"
                  placeholder="Ej: Bogotá"
                  value={businessCity}
                  onChange={e => setBusinessCity(e.target.value)}
                />
              </div>
            </div>

            <div className="bp-form-group">
              <label className="bp-label">Horario de atención</label>
              <input
                type="text"
                className="bp-input"
                placeholder="Ej: Lun-Vie 8am-6pm, Sáb 9am-2pm"
                value={businessSchedule}
                onChange={e => setBusinessSchedule(e.target.value)}
              />
            </div>
          </div>

          {/* Servicios Destacados (Editable Cards) */}
          <div className="bp-card">
            <div className="bp-card-header">
              <div className="bp-card-icon">🎴</div>
              <div>
                <div className="bp-card-title">Servicios / Beneficios Destacados</div>
                <div className="bp-card-desc">Personaliza las tarjetas principales de tu sitio web</div>
              </div>
              <button
                type="button"
                className="bp-slider-reset-btn"
                style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => resetServicesToTemplate()}
              >
                Cargar Predeterminados
              </button>
            </div>

            <div className="bp-services-cards-editor">
              {(businessServices.length > 0 ? businessServices : (TEMPLATE_SERVICES[businessTemplate] || TEMPLATE_SERVICES.store)).map((svc, idx) => (
                <div className="bp-service-card-form" key={idx}>
                  <div className="bp-service-card-form-header">
                    <span className="bp-service-card-number">Servicio #{idx + 1}</span>
                    <button
                      type="button"
                      className="bp-service-card-delete-btn"
                      onClick={() => removeServiceCard(idx)}
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="bp-service-card-inputs">
                    <div className="bp-service-card-row-top">
                      <div className="bp-form-group bp-col-icon">
                        <label className="bp-label">Icono</label>
                        <input
                          type="text"
                          className="bp-input text-center"
                          placeholder="✨"
                          value={svc.icon || ''}
                          onChange={e => updateServiceCard(idx, 'icon', e.target.value)}
                        />
                      </div>
                      <div className="bp-form-group bp-col-title">
                        <label className="bp-label">Título del Servicio</label>
                        <input
                          type="text"
                          className="bp-input"
                          placeholder="Ej: Entrega rápida"
                          value={svc.title || ''}
                          onChange={e => updateServiceCard(idx, 'title', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="bp-form-group mb-0">
                      <label className="bp-label">Descripción</label>
                      <textarea
                        className="bp-textarea"
                        rows={2}
                        placeholder="Describe brevemente este servicio..."
                        value={svc.desc || ''}
                        onChange={e => updateServiceCard(idx, 'desc', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {businessServices.length < 8 && (
                <button
                  type="button"
                  className="bp-btn-secondary mt-2"
                  onClick={addServiceCard}
                  style={{ marginTop: '12px' }}
                >
                  + Agregar Nueva Tarjeta de Servicio
                </button>
              )}
            </div>
          </div>

          {/* Etiquetas / Tags */}
          <div className="bp-card">
            <div className="bp-card-header">
              <div className="bp-card-icon">🏷️</div>
              <div>
                <div className="bp-card-title">Etiquetas / Tags de Búsqueda</div>
                <div className="bp-card-desc">Baches o palabras claves adicionales para tu tienda</div>
              </div>
            </div>

            <div className="bp-services-input-wrap">
              {businessTags.map((tag, i) => (
                <span className="bp-service-tag" key={i}>
                  {tag}
                  <button
                    className="bp-service-tag-remove"
                    onClick={() => removeTag(tag)}
                    type="button"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="bp-services-input"
                placeholder="Escribe etiqueta y presiona Enter..."
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
          </div>

          {/* Catálogo / Ofertas */}
          <div className="bp-card">
            <div className="bp-card-header">
              <div className="bp-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              </div>
              <div>
                <div className="bp-card-title">Mi Catálogo</div>
                <div className="bp-card-desc">Ofertas publicadas en tu página</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className="bp-catalog-count">{offers.length} ofertas</span>
              </div>
            </div>

            {offers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ display:'flex',justifyContent:'center',marginBottom:12,color:'#94a3b8' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                </div>
                <p style={{ color: 'var(--bp-text-muted)', fontSize: 15 }}>
                  Aún no tienes ofertas publicadas.
                </p>
                <button
                  className="bp-btn-secondary"
                  style={{ width: 'auto', marginTop: 16 }}
                  onClick={() => navigate('/publish')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Crear primera oferta
                </button>
              </div>
            ) : (
              <div className="bp-offer-grid">
                {offers.map(offer => {
                  const isUploading = uploadingOfferId === offer.id;
                  return (
                    <div className="bp-offer-card" key={offer.id}>
                      {/* ── Imagen con overlay para cambiar ── */}
                      <div
                        className="bp-offer-img-wrap"
                        onClick={() => triggerOfferFileInput(offer.id)}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          ref={el => { offerFileRefs.current[offer.id] = el; }}
                          onChange={e => handleOfferImageUpload(e, offer.id)}
                        />

                        {offer.image_url ? (
                          <img
                            className="bp-offer-img"
                            src={offer.image_url}
                            alt={offer.title}
                          />
                        ) : (
                          <div className="bp-offer-img-empty">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                          </div>
                        )}

                        {/* Overlay */}
                        <div className={`bp-offer-img-overlay${isUploading ? ' bp-offer-img-overlay-uploading' : ''}`}>
                          <span className="bp-offer-img-overlay-pill">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            {isUploading ? 'Subiendo...' : 'Cambiar imagen'}
                          </span>
                        </div>
                      </div>

                      {/* ── Body de la oferta ── */}
                      <div
                        className="bp-offer-body"
                        onClick={() => navigate(`/offers/${offer.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="bp-offer-title">{offer.title}</div>
                        <div className="bp-offer-price">{formatPrice(offer.price)}</div>
                        {offer.status && (
                          <span className={`bp-offer-status ${offer.status}`}>
                            {offer.status === 'active' ? 'Activa' :
                             offer.status === 'paused' ? 'Pausada' :
                             offer.status === 'sold' ? 'Vendida' :
                             offer.status === 'archived' ? 'Archivada' : offer.status}
                          </span>
                        )}
                      </div>

                      {/* ── Botón gestionar múltiples fotos ── */}
                      <div className="bp-offer-card-actions" style={{ padding: '0 12px 12px', display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="bp-btn-secondary"
                          style={{ flex: 1, padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOfferForImages(offer);
                          }}
                        >
                          🖼️ Fotos ({offer.offer_images?.length || 0})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>

        {/* ── Column 2: Phone Live Preview Mockup ────────── */}
        <section className={`bp-preview-col ${activeWorkspaceTab === 'preview' ? 'active' : ''}`}>
          <div className="bp-phone-mockup">
            <div className="bp-phone-header">
              <div className="bp-phone-speaker" />
              <div className="bp-phone-camera" />
            </div>
            
            <div
              className="bp-phone-screen"
              style={{
                backgroundColor: businessBgColor,
                fontFamily: FONTS.some(f => f.id === businessFontFamily) ? `'${businessFontFamily}', sans-serif` : 'inherit',
                color: businessTextColor
              }}
            >
              <div className={`phone-shop-wrap phone-shop-layout-${layout}`}>
                {(() => {
                  const partBanner = (
                    <div className="phone-shop-banner" style={{ background: '#0f172a' }}>
                      {coverUrl ? (
                        coverFit === 'contain' ? (
                          <div className="phone-shop-banner-contain-wrap">
                            <div className="phone-shop-banner-contain-blur" style={{ backgroundImage: `url(${coverUrl})` }} />
                            <img src={coverUrl} className="phone-shop-banner-contain-img" alt="Portada" />
                          </div>
                        ) : (
                          <img
                            src={coverUrl}
                            className="phone-shop-banner-cover-img"
                            style={{
                              transform: `scale(${coverZoom / 100})`,
                              objectPosition: `${coverPositionX}% ${coverPositionY}%`,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            alt="Portada"
                          />
                        )
                      ) : (
                        <div className="phone-shop-banner-empty">🏪</div>
                      )}
                      <div className="phone-shop-banner-overlay" />
                    </div>
                  );

                  const partHeaderInfo = (
                    <div className={`phone-shop-header-info phone-shop-layout-${layout}`}>
                      <div className="phone-shop-logo-wrap">
                        {logoUrl ? (
                          <img src={logoUrl} className="phone-shop-logo" alt="Logo" />
                        ) : (
                          <div className="phone-shop-logo-empty">🏪</div>
                        )}
                      </div>

                      <div className="phone-shop-meta">
                        <div className="phone-shop-badge" style={{ color: businessPrimaryColor, borderColor: `${businessPrimaryColor}50`, background: `${businessPrimaryColor}10` }}>
                          <span className="phone-shop-badge-dot" style={{ background: businessPrimaryColor }} />
                          Tienda Verificada
                        </div>
                        <h1
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setBusinessName(e.target.innerText)}
                          className="phone-shop-title"
                          style={{ fontFamily: businessFontFamily }}
                        >
                          {businessName || 'Nombre de tu negocio'}
                        </h1>
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setBusinessHeadline(e.target.innerText)}
                          className="phone-shop-headline"
                        >
                          {businessHeadline || 'Tu eslogan o frase principal'}
                        </p>
                      </div>
                    </div>
                  );

                  const partAbout = (
                    <div className="phone-shop-section">
                      <div className="phone-shop-section-title">Sobre nosotros</div>
                      <div className="phone-shop-about-card" style={{ borderLeftColor: businessPrimaryColor }}>
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setBusinessAbout(e.target.innerText)}
                          className="phone-shop-about-text"
                        >
                          {businessAbout || 'Cuenta la historia y valores de tu negocio aquí...'}
                        </p>
                      </div>
                    </div>
                  );

                  const partServices = (
                    <div className="phone-shop-section">
                      <div className="phone-shop-section-title">Nuestros Servicios</div>
                      <div className="phone-shop-services-grid">
                        {(businessServices.length > 0 ? businessServices : (TEMPLATE_SERVICES[businessTemplate] || TEMPLATE_SERVICES.store)).map((svc, i) => (
                          <div key={i} className="phone-shop-service-card" style={{ borderBottomColor: `${businessPrimaryColor}20` }}>
                            <span className="phone-shop-service-icon">{svc.icon || '✨'}</span>
                            <h3
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => {
                                const currentList = businessServices.length > 0 
                                  ? [...businessServices] 
                                  : (TEMPLATE_SERVICES[businessTemplate] || TEMPLATE_SERVICES.store).map(item => ({ ...item }));
                                currentList[i] = { ...currentList[i], title: e.target.innerText };
                                setBusinessServices(currentList);
                              }}
                            >
                              {svc.title || 'Servicio'}
                            </h3>
                            <p
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => {
                                const currentList = businessServices.length > 0 
                                  ? [...businessServices] 
                                  : (TEMPLATE_SERVICES[businessTemplate] || TEMPLATE_SERVICES.store).map(item => ({ ...item }));
                                currentList[i] = { ...currentList[i], desc: e.target.innerText };
                                setBusinessServices(currentList);
                              }}
                            >
                              {svc.desc || 'Descripción...'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );

                  const partTags = businessTags.length > 0 && (
                    <div className="phone-shop-tags-wrap">
                      {businessTags.map((tag, i) => (
                        <span key={i} className="phone-shop-tag" style={{ color: businessPrimaryColor, borderColor: `${businessPrimaryColor}40`, background: `${businessPrimaryColor}10` }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  );

                  const partOffers = (
                    <div className="phone-shop-section">
                      <div className="phone-shop-section-title">
                        {layout === 'automotive' ? 'Vehículos / Motos destacados' : 'Productos destacados'}
                      </div>
                      {offers.length === 0 ? (
                        <div className="phone-shop-empty-catalog">Aún no hay productos en catálogo</div>
                      ) : (
                        <div className="phone-shop-offers-list">
                          {offers.slice(0, 3).map((offer, idx) => (
                            <div key={offer.id || idx} className="phone-shop-offer-item">
                              <div className="phone-shop-offer-img" style={{ backgroundImage: offer.image_url ? `url(${offer.image_url})` : 'none' }}>
                                {!offer.image_url && '🛍️'}
                              </div>
                              <div className="phone-shop-offer-details">
                                <div className="phone-shop-offer-name">{offer.title}</div>
                                <div className="phone-shop-offer-price" style={{ color: businessPrimaryColor }}>{formatPrice(offer.price)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );

                  const partContact = (
                    <div className="phone-shop-section phone-shop-contact">
                      {businessSchedule && (
                        <div className="phone-shop-info-row">
                          <span>⏰ Horario:</span>
                          <strong>{businessSchedule}</strong>
                        </div>
                      )}
                      {(businessAddress || businessCity) && (
                        <div className="phone-shop-info-row">
                          <span>📍 Ubicación:</span>
                          <strong>{businessAddress} {businessCity && `, ${businessCity}`}</strong>
                        </div>
                      )}
                      <button
                        type="button"
                        className="phone-shop-wa-btn"
                        style={{ backgroundColor: businessBtnBgColor, color: businessBtnTextColor }}
                      >
                        💬 Contactar por WhatsApp
                      </button>
                    </div>
                  );

                  const partFooter = (
                    <div className="phone-shop-footer">
                      <p>{businessName || 'Tu Negocio'}</p>
                      <span>© {new Date().getFullYear()} · Súmercé Market</span>
                    </div>
                  );

                  if (layout === 'elegant') {
                    return (
                      <>
                        {partBanner}
                        {partHeaderInfo}
                        {partAbout}
                        {partServices}
                        {partTags}
                        {partOffers}
                        {partContact}
                        {partFooter}
                      </>
                    );
                  }

                  if (layout === 'services') {
                    return (
                      <>
                        {partBanner}
                        {partHeaderInfo}
                        {partServices}
                        {partTags}
                        {partAbout}
                        {partContact}
                        {partOffers}
                        {partFooter}
                      </>
                    );
                  }

                  // Default layouts (retail / automotive)
                  return (
                    <>
                      {partBanner}
                      {partHeaderInfo}
                      {partOffers}
                      {partServices}
                      {partTags}
                      {partAbout}
                      {partContact}
                      {partFooter}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
          <div className="bp-preview-tip">
            💡 <strong>Edición directa:</strong> ¡Puedes hacer clic sobre los textos en la pantalla del celular y editarlos al instante!
          </div>
        </section>

        {/* ── Column 3: Styles & Sidebar Panel ───────────── */}
        <aside className={`bp-sidebar ${activeWorkspaceTab === 'styling' ? 'active' : ''}`}>

          {/* Estado */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Estado</div>
            {businessSlug ? (
              <div className="bp-badge bp-badge-live">Página activa</div>
            ) : (
              <div className="bp-badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                Sin slug configurado
              </div>
            )}
          </div>

          {/* Plantilla */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Plantilla</div>
            <div className="bp-template-grid">
              {TEMPLATES.map(t => (
                <div
                  key={t.id}
                  className={`bp-template-option ${businessTemplate === t.id ? 'active' : ''}`}
                  onClick={() => handleTemplateChange(t.id)}
                >
                  <span className="bp-template-emoji">{t.icon}</span>
                  <span className="bp-template-name">{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Temas Rápidos Preconfigurados */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Temas Rápidos</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {STYLE_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  className="bp-btn-secondary"
                  style={{
                    fontSize: 11,
                    padding: '8px 4px',
                    borderColor: businessPrimaryColor === preset.primary && businessBgColor === preset.bg ? 'var(--bp-primary)' : '#cbd5e1',
                    background: preset.bg,
                    color: preset.text,
                    borderWidth: businessPrimaryColor === preset.primary && businessBgColor === preset.bg ? 2 : 1,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 'auto',
                    borderRadius: 8
                  }}
                  onClick={() => applyPreset(preset)}
                >
                  <span style={{ display: 'block', fontWeight: 700 }}>{preset.name}</span>
                  <span style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: preset.primary,
                    marginTop: 4
                  }} />
                </button>
              ))}
            </div>
          </div>

          {/* Color primario */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Color Principal (Acentos)</div>
            <div className="bp-color-row">
              <div className="bp-color-swatch" style={{ background: businessPrimaryColor }}>
                <input
                  type="color"
                  value={businessPrimaryColor}
                  onChange={e => setBusinessPrimaryColor(e.target.value)}
                />
              </div>
              <span className="bp-color-hex">{businessPrimaryColor.toUpperCase()}</span>
            </div>
          </div>

          {/* Fondo de página */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Fondo de Página</div>
            <div className="bp-color-row">
              <div className="bp-color-swatch" style={{ background: businessBgColor }}>
                <input
                  type="color"
                  value={businessBgColor}
                  onChange={e => setBusinessBgColor(e.target.value)}
                />
              </div>
              <span className="bp-color-hex">{businessBgColor.toUpperCase()}</span>
            </div>
          </div>

          {/* Color del texto */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Color de Letra</div>
            <div className="bp-color-row">
              <div className="bp-color-swatch" style={{ background: businessTextColor }}>
                <input
                  type="color"
                  value={businessTextColor}
                  onChange={e => setBusinessTextColor(e.target.value)}
                />
              </div>
              <span className="bp-color-hex">{businessTextColor.toUpperCase()}</span>
            </div>
          </div>

          {/* Color del botón */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Fondo del Botón</div>
            <div className="bp-color-row">
              <div className="bp-color-swatch" style={{ background: businessBtnBgColor }}>
                <input
                  type="color"
                  value={businessBtnBgColor}
                  onChange={e => setBusinessBtnBgColor(e.target.value)}
                />
              </div>
              <span className="bp-color-hex">{businessBtnBgColor.toUpperCase()}</span>
            </div>
          </div>

          {/* Color texto botón */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Texto del Botón</div>
            <div className="bp-color-row">
              <div className="bp-color-swatch" style={{ background: businessBtnTextColor }}>
                <input
                  type="color"
                  value={businessBtnTextColor}
                  onChange={e => setBusinessBtnTextColor(e.target.value)}
                />
              </div>
              <span className="bp-color-hex">{businessBtnTextColor.toUpperCase()}</span>
            </div>
          </div>

          {/* Tipografía */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Tipografía</div>
            <select
              className="bp-select"
              value={businessFontFamily}
              onChange={e => setBusinessFontFamily(e.target.value)}
            >
              {FONTS.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Acciones rápidas */}
          <div className="bp-sidebar-section">
            <div className="bp-sidebar-title">Acciones rápidas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {businessSlug && (
                <a
                  href={`/seller/${businessSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bp-btn-secondary"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Ver mi página web
                </a>
              )}
              <button
                className="bp-btn-secondary"
                onClick={() => navigate('/publish')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nueva oferta
              </button>
              <button
                className="bp-btn-secondary"
                onClick={() => navigate('/my-offers')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Gestionar ofertas
              </button>
            </div>
          </div>

          {/* Guardar (sidebar) */}
          <div className="bp-sidebar-section" style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button
              className="bp-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'bp-spin 1s linear infinite'}} aria-hidden="true"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg> Guardando...</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Guardar cambios</>
              )}
            </button>
          </div>

        </aside>
      </div>

      {/* ── Manage Offer Images Modal ──────────────────── */}
      {selectedOfferForImages && (
        <ManageOfferImagesModal
          offer={selectedOfferForImages}
          onClose={() => setSelectedOfferForImages(null)}
          userId={userId}
          showToast={showToast}
          onRefresh={handleRefreshOffers}
        />
      )}

      {/* ── Toast ───────────────────────────────────────── */}
      {toast && (
        <div className={`bp-toast bp-toast-${toast.type}`}>
          {toast.type === 'success'
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          }
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ─── Manage Offer Images Modal Component ───────────────────
function ManageOfferImagesModal({ offer, onClose, userId, showToast, onRefresh }) {
  const [images, setImages] = useState(offer.offer_images || []);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadLatestImages = async () => {
    try {
      const { data, error } = await supabase
        .from('offer_images')
        .select('*')
        .eq('offer_id', offer.id)
        .order('position', { ascending: true });
      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error(err);
      showToast('Error cargando imágenes', 'error');
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      const BUCKET = 'offer-images';
      const maxPosition = images.reduce((max, img) => img.position > max ? img.position : max, -1);
      
      const newImageRows = [];
      let firstNewPublicUrl = null;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        let optimized = file;
        try {
          optimized = await compressImage(file);
        } catch (err) {
          console.warn('Compression failed, using original', err);
        }

        const ext = optimized.name.split('.').pop() || 'jpg';
        const path = `${userId}/${offer.id}/${Date.now()}-${i}.${ext}`;
        const contentType = optimized.type || 'image/jpeg';

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, optimized, {
            cacheControl: '3600',
            upsert: false,
            contentType
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const publicUrl = urlData.publicUrl;
        
        if (i === 0) firstNewPublicUrl = publicUrl;

        newImageRows.push({
          offer_id: offer.id,
          url: publicUrl,
          path: path,
          position: maxPosition + 1 + i
        });
      }

      if (newImageRows.length > 0) {
        const { error: insertError } = await supabase
          .from('offer_images')
          .insert(newImageRows);
        if (insertError) throw insertError;
      }

      if (!offer.image_url && firstNewPublicUrl) {
        const { error: updateError } = await supabase
          .from('offers')
          .update({ image_url: firstNewPublicUrl })
          .eq('id', offer.id);
        if (updateError) throw updateError;
      }

      showToast('Imágenes subidas exitosamente');
      await loadLatestImages();
      onRefresh();
    } catch (err) {
      console.error(err);
      showToast('Error al subir imágenes: ' + err.message, 'error');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (img) => {
    const confirm = window.confirm('¿Estás seguro de que deseas eliminar esta imagen?');
    if (!confirm) return;

    setDeletingId(img.id);
    try {
      const { error: dbError } = await supabase
        .from('offer_images')
        .delete()
        .eq('id', img.id);
      if (dbError) throw dbError;

      const { error: storageError } = await supabase.storage
        .from('offer-images')
        .remove([img.path]);
      if (storageError) {
        console.warn('Storage deletion failed, continuing', storageError);
      }

      if (offer.image_url === img.url) {
        const remainingImages = images.filter(i => i.id !== img.id);
        const nextMainUrl = remainingImages.length > 0 ? remainingImages[0].url : null;
        
        const { error: updateError } = await supabase
          .from('offers')
          .update({ image_url: nextMainUrl })
          .eq('id', offer.id);
        if (updateError) throw updateError;
      }

      showToast('Imagen eliminada');
      await loadLatestImages();
      onRefresh();
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar imagen: ' + err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bp-modal-backdrop" onClick={onClose}>
      <div className="bp-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="bp-modal-header">
          <h3>Gestionar imágenes</h3>
          <button className="bp-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="bp-modal-body">
          <p className="bp-modal-offer-title">{offer.title}</p>
          {images.length === 0 ? (
            <div className="bp-modal-empty">
              <span style={{ fontSize: '48px' }}>📷</span>
              <p>Esta oferta no tiene fotos adicionales aún.</p>
            </div>
          ) : (
            <div className="bp-modal-image-grid">
              {images.map((img) => (
                <div className="bp-modal-image-card" key={img.id}>
                  <img src={img.url} alt="Producto" />
                  {img.url === offer.image_url && (
                    <span className="bp-modal-image-badge">Principal</span>
                  )}
                  <button
                    className="bp-modal-image-delete"
                    disabled={deletingId === img.id}
                    onClick={() => handleDelete(img)}
                  >
                    {deletingId === img.id ? '...' : '✕'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bp-modal-upload-section">
            <label className="bp-modal-upload-btn">
              {uploading ? (
                <span>⏳ Subiendo y optimizando...</span>
              ) : (
                <>
                  <span>➕ Seleccionar Fotos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </>
              )}
            </label>
            <p className="bp-modal-upload-hint">Puedes seleccionar varias fotos. Formatos JPG, PNG, WebP.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
