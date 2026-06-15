/* ==========================================================================
   Temas rápidos del editor de perfil de negocio — SumerceMarket
   --------------------------------------------------------------------------
   TODOS los temas son claros o semi-claros.
   Ningún fondo oscuro dominante (#0xxxxx, #1xxxxx).
   Garantiza buena visual en la página pública /seller/:slug.
   Compatible con business_primary_color como JSON.
   ========================================================================== */

const STYLE_PRESETS = [
  // ─── ORIGINALES CLAROS (mantenidos) ───
  {
    name: 'Súmercé Clásico',
    primary: '#2563eb',
    bg: '#ffffff',
    text: '#0f172a',
    btnBg: '#2563eb',
    btnText: '#ffffff',
    font: 'Plus Jakarta Sans'
  },
  {
    name: 'Terracota Cálido',
    primary: '#c2410c',
    bg: '#fdf6f0',
    text: '#431407',
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
    font: 'Inter'
  },
  {
    name: 'Artesanal Chic',
    primary: '#92400e',
    bg: '#fefbf3',
    text: '#451a03',
    btnBg: '#92400e',
    btnText: '#ffffff',
    font: 'Playfair Display'
  },
  {
    name: 'Súper Fresh',
    primary: '#0891b2',
    bg: '#f0fdfa',
    text: '#134e4a',
    btnBg: '#0891b2',
    btnText: '#ffffff',
    font: 'Plus Jakarta Sans'
  },
  {
    name: 'Naturaleza Viva',
    primary: '#84cc16',
    bg: '#fafdf5',
    text: '#365314',
    btnBg: '#84cc16',
    btnText: '#ffffff',
    font: 'Calibri'
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
    name: 'Panadería Artesanal',
    primary: '#b45309',
    bg: '#fdfaf2',
    text: '#78350f',
    btnBg: '#b45309',
    btnText: '#ffffff',
    font: 'Outfit'
  },

  // ─── NUEVOS TEMAS CLAROS PREMIUM ───
  {
    name: 'Azul Ejecutivo',
    primary: '#1e40af',
    bg: '#f0f4ff',
    text: '#1e293b',
    btnBg: '#1e40af',
    btnText: '#ffffff',
    font: 'Inter'
  },
  {
    name: 'Verde Natural',
    primary: '#15803d',
    bg: '#f0fdf4',
    text: '#14532d',
    btnBg: '#15803d',
    btnText: '#ffffff',
    font: 'Plus Jakarta Sans'
  },
  {
    name: 'Arena Boutique',
    primary: '#a16207',
    bg: '#fefdf6',
    text: '#422006',
    btnBg: '#a16207',
    btnText: '#ffffff',
    font: 'Playfair Display'
  },
  {
    name: 'Lavanda Suave',
    primary: '#7c3aed',
    bg: '#f5f3ff',
    text: '#3b0764',
    btnBg: '#7c3aed',
    btnText: '#ffffff',
    font: 'Outfit'
  },
  {
    name: 'Coral Moderno',
    primary: '#e11d48',
    bg: '#fff1f2',
    text: '#4c0519',
    btnBg: '#e11d48',
    btnText: '#ffffff',
    font: 'Plus Jakarta Sans'
  },
  {
    name: 'Cielo Comercial',
    primary: '#0284c7',
    bg: '#f0f9ff',
    text: '#0c4a6e',
    btnBg: '#0284c7',
    btnText: '#ffffff',
    font: 'Inter'
  },
  {
    name: 'Café Artesanal',
    primary: '#78350f',
    bg: '#fdf8f0',
    text: '#451a03',
    btnBg: '#78350f',
    btnText: '#ffffff',
    font: 'Outfit'
  },
  {
    name: 'Minimal Blanco',
    primary: '#334155',
    bg: '#ffffff',
    text: '#0f172a',
    btnBg: '#334155',
    btnText: '#ffffff',
    font: 'Inter'
  },
  {
    name: 'Rosa Boutique',
    primary: '#be185d',
    bg: '#fdf2f8',
    text: '#500724',
    btnBg: '#be185d',
    btnText: '#ffffff',
    font: 'Raleway'
  },
  {
    name: 'Menta Fresh',
    primary: '#0f766e',
    bg: '#f0fdfa',
    text: '#134e4a',
    btnBg: '#0f766e',
    btnText: '#ffffff',
    font: 'Plus Jakarta Sans'
  },
  {
    name: 'Dorado Claro',
    primary: '#b45309',
    bg: '#fffbeb',
    text: '#78350f',
    btnBg: '#b45309',
    btnText: '#ffffff',
    font: 'Cinzel'
  },
  {
    name: 'Tecnología Clara',
    primary: '#4f46e5',
    bg: '#eef2ff',
    text: '#312e81',
    btnBg: '#4f46e5',
    btnText: '#ffffff',
    font: 'Inter'
  }
];

export default STYLE_PRESETS;
