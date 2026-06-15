import { useEffect } from 'react';
import BusinessProfile from './BusinessProfile';

/**
 * BusinessProfileSafe
 * Wrapper seguro que renderiza BusinessProfile, oculta temas oscuros
 * e inyecta temas nuevos claros/pastel + oscuros suaves (NO negros).
 *
 * Usa MutationObserver + ejecución al montar para garantizar inyección.
 * Bloque inyectado: id="safe-extra-themes"
 */

/* ═══════════════════════════════════════════════════════════════════════
   TEMAS NUEVOS
   ═══════════════════════════════════════════════════════════════════ */

const SAFE_THEMES = [
  // ─── CLAROS ───
  { name: 'Azul Ejecutivo',      primary: '#1e40af', bg: '#f0f4ff', text: '#1e293b', btnBg: '#1e40af', btnText: '#ffffff', font: 'Plus Jakarta Sans' },
  { name: 'Verde Natural',       primary: '#15803d', bg: '#f0fdf4', text: '#14532d', btnBg: '#15803d', btnText: '#ffffff', font: 'Nunito' },
  { name: 'Arena Boutique',      primary: '#a16207', bg: '#fefce8', text: '#422006', btnBg: '#a16207', btnText: '#ffffff', font: 'Playfair Display' },
  { name: 'Lavanda Suave',       primary: '#7c3aed', bg: '#f5f3ff', text: '#3b0764', btnBg: '#7c3aed', btnText: '#ffffff', font: 'DM Sans' },
  { name: 'Coral Moderno',       primary: '#e11d48', bg: '#fff1f2', text: '#4c0519', btnBg: '#e11d48', btnText: '#ffffff', font: 'Outfit' },
  { name: 'Cielo Comercial',     primary: '#0284c7', bg: '#f0f9ff', text: '#0c4a6e', btnBg: '#0284c7', btnText: '#ffffff', font: 'Inter' },
  { name: 'Minimal Blanco',      primary: '#374151', bg: '#ffffff', text: '#111827', btnBg: '#374151', btnText: '#ffffff', font: 'Plus Jakarta Sans' },
  { name: 'Rosa Boutique',       primary: '#db2777', bg: '#fdf2f8', text: '#500724', btnBg: '#db2777', btnText: '#ffffff', font: 'Raleway' },
  { name: 'Menta Fresh',         primary: '#0d9488', bg: '#f0fdfa', text: '#134e4a', btnBg: '#0d9488', btnText: '#ffffff', font: 'Figtree' },
  { name: 'Dorado Claro',        primary: '#b45309', bg: '#fffbeb', text: '#78350f', btnBg: '#b45309', btnText: '#ffffff', font: 'Merriweather' },
  { name: 'Tecnología Clara',    primary: '#2563eb', bg: '#eff6ff', text: '#1e3a5f', btnBg: '#2563eb', btnText: '#ffffff', font: 'Roboto' },
  { name: 'Café Artesanal',      primary: '#92400e', bg: '#fef3c7', text: '#451a03', btnBg: '#92400e', btnText: '#ffffff', font: 'Outfit' },
  { name: 'Marfil Elegante',     primary: '#6d28d9', bg: '#faf5ff', text: '#2e1065', btnBg: '#6d28d9', btnText: '#ffffff', font: 'Playfair Display' },
  { name: 'Azul Cielo Pro',      primary: '#0369a1', bg: '#e0f2fe', text: '#0c4a6e', btnBg: '#0369a1', btnText: '#ffffff', font: 'Poppins' },
  { name: 'Verde Boutique',      primary: '#047857', bg: '#ecfdf5', text: '#064e3b', btnBg: '#047857', btnText: '#ffffff', font: 'DM Sans' },
  { name: 'Lila Comercial',      primary: '#9333ea', bg: '#faf5ff', text: '#581c87', btnBg: '#9333ea', btnText: '#ffffff', font: 'Montserrat' },
  { name: 'Salmón Moderno',      primary: '#ea580c', bg: '#fff7ed', text: '#7c2d12', btnBg: '#ea580c', btnText: '#ffffff', font: 'Nunito' },
  { name: 'Crema Natural',       primary: '#65a30d', bg: '#fefce8', text: '#365314', btnBg: '#65a30d', btnText: '#ffffff', font: 'Lato' },
  // ─── OSCUROS SUAVES ───
  { name: 'Azul Noche Suave',    primary: '#60a5fa', bg: '#1e3a5f', text: '#e0f2fe', btnBg: '#60a5fa', btnText: '#1e3a5f', font: 'Inter' },
  { name: 'Verde Bosque Claro',  primary: '#4ade80', bg: '#1a3a2a', text: '#dcfce7', btnBg: '#4ade80', btnText: '#1a3a2a', font: 'Plus Jakarta Sans' },
  { name: 'Vino Elegante',       primary: '#f472b6', bg: '#4a1942', text: '#fce7f3', btnBg: '#f472b6', btnText: '#4a1942', font: 'Playfair Display' },
  { name: 'Chocolate Premium',   primary: '#fbbf24', bg: '#3d2b1f', text: '#fef3c7', btnBg: '#fbbf24', btnText: '#3d2b1f', font: 'Outfit' },
  { name: 'Grafito Suave',       primary: '#a78bfa', bg: '#374151', text: '#f3f4f6', btnBg: '#a78bfa', btnText: '#1f2937', font: 'DM Sans' },
  { name: 'Petróleo Moderno',    primary: '#22d3ee', bg: '#164e63', text: '#cffafe', btnBg: '#22d3ee', btnText: '#164e63', font: 'Montserrat' },
];

const LIGHT_COUNT = 18; // primeros 18 son claros

/* ═══════════════════════════════════════════════════════════════════════
   TEMAS OSCUROS ORIGINALES A OCULTAR
   ═══════════════════════════════════════════════════════════════════ */

const DARK_THEMES_TO_HIDE = [
  'Elegancia Oscura',
  'Oro Lujoso',
  'Techno Futurista',
  'Tecno Futurista',
  'Aventura Naranja',
  'Motos Deportivas',
  'Carros Premium',
  'Calzado Urbano',
  'Tecnología Neón',
];

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS NATIVOS PARA REACT STATE SYNC
   ═══════════════════════════════════════════════════════════════════ */

function setNativeColorValue(input, hex) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;
  if (setter) setter.call(input, hex);
  else input.value = hex;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function setNativeSelectValue(select, value) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLSelectElement.prototype,
    'value',
  )?.set;
  if (setter) setter.call(select, value);
  else select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function isBackgroundDark(hex) {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

/* ═══════════════════════════════════════════════════════════════════════
   APLICAR TEMA VÍA COLOR PICKERS + SELECT FUENTES
   ═══════════════════════════════════════════════════════════════════ */

function applyInjectedTheme(theme) {
  // Color pickers: primary, bg, text, btnBg, btnText (en ese orden)
  const colorInputs = document.querySelectorAll(
    '.bp-sidebar input[type="color"], .bp-sidebar-section input[type="color"]',
  );
  const vals = [theme.primary, theme.bg, theme.text, theme.btnBg, theme.btnText];
  colorInputs.forEach((inp, i) => {
    if (i < vals.length) setNativeColorValue(inp, vals[i]);
  });

  // Select de tipografía
  const allSelects = document.querySelectorAll(
    '.bp-sidebar select.bp-select, .bp-sidebar-section select.bp-select, .bp-sidebar select, .bp-sidebar-section select',
  );
  allSelects.forEach((sel) => {
    const hasFont = Array.from(sel.options).some(
      (o) => o.value === 'Plus Jakarta Sans' || o.value === 'Inter',
    );
    if (hasFont && theme.font) setNativeSelectValue(sel, theme.font);
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   BUSCAR EL GRID DE "TEMAS RÁPIDOS" CON MÚLTIPLES FALLBACKS
   ═══════════════════════════════════════════════════════════════════ */

function findThemesGrid() {
  // Estrategia 1: .bp-sidebar-section con título que contenga "Temas"
  const sections = document.querySelectorAll('.bp-sidebar-section');
  for (const sec of sections) {
    const title = sec.querySelector('.bp-sidebar-title');
    if (title && /temas/i.test(title.textContent)) {
      // Buscar un div con display grid dentro
      const divs = sec.querySelectorAll('div');
      for (const d of divs) {
        const cs = window.getComputedStyle(d);
        if (cs.display === 'grid') return { grid: d, section: sec };
      }
      // Fallback: inline style con "grid"
      for (const d of divs) {
        if ((d.getAttribute('style') || '').includes('grid')) return { grid: d, section: sec };
      }
    }
  }

  // Estrategia 2: cualquier elemento con textContent "Temas Rápidos"
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    const el = walker.currentNode;
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
      if (/temas\s+r[aá]pidos/i.test(el.textContent.trim())) {
        const parent = el.closest('.bp-sidebar-section') || el.parentElement;
        if (parent) {
          const divs = parent.querySelectorAll('div');
          for (const d of divs) {
            const cs = window.getComputedStyle(d);
            if (cs.display === 'grid') return { grid: d, section: parent };
          }
          for (const d of divs) {
            if ((d.getAttribute('style') || '').includes('grid')) return { grid: d, section: parent };
          }
        }
      }
    }
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════
   CREAR UN BOTÓN DE TEMA
   ═══════════════════════════════════════════════════════════════════ */

function createThemeButton(theme, container) {
  const dark = isBackgroundDark(theme.bg);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'safe-extra-theme-btn';
  btn.dataset.themeName = theme.name;
  btn.dataset.themeBg = theme.bg;
  btn.dataset.themePrimary = theme.primary;
  btn.style.cssText = `
    font-size: 11px;
    padding: 8px 6px;
    border: 1.5px solid ${dark ? theme.primary + '55' : '#cbd5e1'};
    background: ${theme.bg};
    color: ${theme.text};
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 54px;
    border-radius: 10px;
    font-family: inherit;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  `;
  btn.innerHTML = `
    <span style="display:block;font-weight:700;line-height:1.2;margin-bottom:4px;font-size:11px;">${theme.name}</span>
    <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${theme.primary};border:2px solid ${dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.08)'};"></span>
  `;

  btn.addEventListener('mouseenter', () => {
    btn.style.borderColor = theme.primary;
    btn.style.boxShadow = `0 3px 12px ${theme.primary}30`;
    btn.style.transform = 'translateY(-2px) scale(1.02)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.borderColor = dark ? theme.primary + '55' : '#cbd5e1';
    btn.style.boxShadow = 'none';
    btn.style.transform = 'none';
  });

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    applyInjectedTheme(theme);
    // Feedback: resaltar el seleccionado
    container.querySelectorAll('.safe-extra-theme-btn').forEach((b) => {
      const d = isBackgroundDark(b.dataset.themeBg);
      b.style.borderColor = d ? b.dataset.themePrimary + '55' : '#cbd5e1';
      b.style.boxShadow = 'none';
      b.style.fontWeight = '';
    });
    btn.style.borderColor = theme.primary;
    btn.style.boxShadow = `0 0 0 2px ${theme.primary}40`;
  });

  return btn;
}

/* ═══════════════════════════════════════════════════════════════════════
   OCULTAR TEMAS OSCUROS ORIGINALES
   ═══════════════════════════════════════════════════════════════════ */

function hideDarkThemes() {
  const buttons = document.querySelectorAll(
    '.bp-sidebar-section button, .bp-sidebar button',
  );
  buttons.forEach((btn) => {
    const txt = btn.textContent?.trim();
    if (txt && DARK_THEMES_TO_HIDE.some((n) => txt.includes(n))) {
      btn.style.display = 'none';
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   INYECTAR BLOQUE DE TEMAS NUEVOS
   ═══════════════════════════════════════════════════════════════════ */

function injectNewThemes() {
  // Si ya existe, no duplicar
  if (document.getElementById('safe-extra-themes')) return;

  const found = findThemesGrid();
  if (!found) return;

  const { section } = found;

  // Crear bloque contenedor
  const wrapper = document.createElement('div');
  wrapper.id = 'safe-extra-themes';
  wrapper.style.cssText = 'margin-top: 12px;';

  // ── Separador: Temas Nuevos ──
  const sepLight = document.createElement('div');
  sepLight.style.cssText =
    'text-align:center;font-size:11px;font-weight:700;color:#64748b;padding:10px 0 6px;border-top:1px solid #e2e8f0;letter-spacing:0.5px;text-transform:uppercase;';
  sepLight.textContent = '✨ Temas Nuevos';
  wrapper.appendChild(sepLight);

  // ── Grid de temas claros ──
  const gridLight = document.createElement('div');
  gridLight.style.cssText =
    'display:grid;grid-template-columns:repeat(2,1fr);gap:8px;';
  SAFE_THEMES.slice(0, LIGHT_COUNT).forEach((t) => {
    gridLight.appendChild(createThemeButton(t, wrapper));
  });
  wrapper.appendChild(gridLight);

  // ── Separador: Oscuros Suaves ──
  const sepDark = document.createElement('div');
  sepDark.style.cssText =
    'text-align:center;font-size:11px;font-weight:700;color:#64748b;padding:10px 0 6px;border-top:1px solid #e2e8f0;margin-top:8px;letter-spacing:0.5px;text-transform:uppercase;';
  sepDark.textContent = '🌙 Oscuros Suaves';
  wrapper.appendChild(sepDark);

  // ── Grid de temas oscuros suaves ──
  const gridDark = document.createElement('div');
  gridDark.style.cssText =
    'display:grid;grid-template-columns:repeat(2,1fr);gap:8px;';
  SAFE_THEMES.slice(LIGHT_COUNT).forEach((t) => {
    gridDark.appendChild(createThemeButton(t, wrapper));
  });
  wrapper.appendChild(gridDark);

  // Insertar después de la sección de temas rápidos
  section.appendChild(wrapper);
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════════════ */

export default function BusinessProfileSafe() {
  useEffect(() => {
    const run = () => {
      hideDarkThemes();
      injectNewThemes();
    };

    // Ejecución inmediata
    run();

    // Reintentos escalonados (el sidebar puede tardar en montar)
    const t1 = setTimeout(run, 400);
    const t2 = setTimeout(run, 1000);
    const t3 = setTimeout(run, 2500);

    // MutationObserver: re-inyectar si React recrea el DOM
    const observer = new MutationObserver(() => {
      hideDarkThemes();
      if (!document.getElementById('safe-extra-themes')) {
        injectNewThemes();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      observer.disconnect();
    };
  }, []);

  return <BusinessProfile />;
}
