import { useEffect, useRef } from 'react';
import BusinessProfile from './BusinessProfile';

/**
 * BusinessProfileSafe
 * Wrapper seguro que renderiza BusinessProfile, oculta temas oscuros
 * e inyecta temas nuevos claros/pastel + oscuros suaves (NO negros).
 */

const SAFE_THEMES = [
  // ═══ TEMAS CLAROS ═══
  {
    name: 'Azul Ejecutivo',
    primary: '#1e40af',
    bg: '#f0f4ff',
    text: '#1e293b',
    btnBg: '#1e40af',
    btnText: '#ffffff',
    font: 'Plus Jakarta Sans'
  },
  {
    name: 'Verde Natural',
    primary: '#15803d',
    bg: '#f0fdf4',
    text: '#14532d',
    btnBg: '#15803d',
    btnText: '#ffffff',
    font: 'Nunito'
  },
  {
    name: 'Arena Boutique',
    primary: '#a16207',
    bg: '#fefce8',
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
    font: 'DM Sans'
  },
  {
    name: 'Coral Moderno',
    primary: '#e11d48',
    bg: '#fff1f2',
    text: '#4c0519',
    btnBg: '#e11d48',
    btnText: '#ffffff',
    font: 'Outfit'
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
    name: 'Minimal Blanco',
    primary: '#374151',
    bg: '#ffffff',
    text: '#111827',
    btnBg: '#374151',
    btnText: '#ffffff',
    font: 'Plus Jakarta Sans'
  },
  {
    name: 'Rosa Boutique',
    primary: '#db2777',
    bg: '#fdf2f8',
    text: '#500724',
    btnBg: '#db2777',
    btnText: '#ffffff',
    font: 'Raleway'
  },
  {
    name: 'Menta Fresh',
    primary: '#0d9488',
    bg: '#f0fdfa',
    text: '#134e4a',
    btnBg: '#0d9488',
    btnText: '#ffffff',
    font: 'Figtree'
  },
  {
    name: 'Dorado Claro',
    primary: '#b45309',
    bg: '#fffbeb',
    text: '#78350f',
    btnBg: '#b45309',
    btnText: '#ffffff',
    font: 'Merriweather'
  },
  {
    name: 'Tecnología Clara',
    primary: '#2563eb',
    bg: '#eff6ff',
    text: '#1e3a5f',
    btnBg: '#2563eb',
    btnText: '#ffffff',
    font: 'Roboto'
  },
  {
    name: 'Café Artesanal',
    primary: '#92400e',
    bg: '#fef3c7',
    text: '#451a03',
    btnBg: '#92400e',
    btnText: '#ffffff',
    font: 'Outfit'
  },
  {
    name: 'Marfil Elegante',
    primary: '#6d28d9',
    bg: '#faf5ff',
    text: '#2e1065',
    btnBg: '#6d28d9',
    btnText: '#ffffff',
    font: 'Playfair Display'
  },
  {
    name: 'Azul Cielo Pro',
    primary: '#0369a1',
    bg: '#e0f2fe',
    text: '#0c4a6e',
    btnBg: '#0369a1',
    btnText: '#ffffff',
    font: 'Poppins'
  },
  {
    name: 'Verde Boutique',
    primary: '#047857',
    bg: '#ecfdf5',
    text: '#064e3b',
    btnBg: '#047857',
    btnText: '#ffffff',
    font: 'DM Sans'
  },
  {
    name: 'Lila Comercial',
    primary: '#9333ea',
    bg: '#faf5ff',
    text: '#581c87',
    btnBg: '#9333ea',
    btnText: '#ffffff',
    font: 'Montserrat'
  },
  {
    name: 'Salmón Moderno',
    primary: '#ea580c',
    bg: '#fff7ed',
    text: '#7c2d12',
    btnBg: '#ea580c',
    btnText: '#ffffff',
    font: 'Nunito'
  },
  {
    name: 'Crema Natural',
    primary: '#65a30d',
    bg: '#fefce8',
    text: '#365314',
    btnBg: '#65a30d',
    btnText: '#ffffff',
    font: 'Lato'
  },
  // ═══ TEMAS OSCUROS SUAVES (NO NEGROS) ═══
  {
    name: 'Azul Noche Suave',
    primary: '#60a5fa',
    bg: '#1e3a5f',
    text: '#e0f2fe',
    btnBg: '#60a5fa',
    btnText: '#1e3a5f',
    font: 'Inter'
  },
  {
    name: 'Verde Bosque Claro',
    primary: '#4ade80',
    bg: '#1a3a2a',
    text: '#dcfce7',
    btnBg: '#4ade80',
    btnText: '#1a3a2a',
    font: 'Plus Jakarta Sans'
  },
  {
    name: 'Vino Elegante',
    primary: '#f472b6',
    bg: '#4a1942',
    text: '#fce7f3',
    btnBg: '#f472b6',
    btnText: '#4a1942',
    font: 'Playfair Display'
  },
  {
    name: 'Chocolate Premium',
    primary: '#fbbf24',
    bg: '#3d2b1f',
    text: '#fef3c7',
    btnBg: '#fbbf24',
    btnText: '#3d2b1f',
    font: 'Outfit'
  },
  {
    name: 'Grafito Suave',
    primary: '#a78bfa',
    bg: '#374151',
    text: '#f3f4f6',
    btnBg: '#a78bfa',
    btnText: '#1f2937',
    font: 'DM Sans'
  },
  {
    name: 'Petróleo Moderno',
    primary: '#22d3ee',
    bg: '#164e63',
    text: '#cffafe',
    btnBg: '#22d3ee',
    btnText: '#164e63',
    font: 'Montserrat'
  }
];

// Temas oscuros/negros a ocultar del listado original
const DARK_THEMES_TO_HIDE = [
  'Elegancia Oscura',
  'Oro Lujoso',
  'Techno Futurista',
  'Tecno Futurista',
  'Aventura Naranja',
  'Motos Deportivas',
  'Carros Premium',
  'Calzado Urbano',
  'Tecnología Neón'
];

/**
 * Simula el cambio nativo de un <input type="color"> para que React lo detecte.
 */
function setNativeColorValue(input, hex) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  )?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(input, hex);
  } else {
    input.value = hex;
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simula la selección de una opción en un <select> para que React lo detecte.
 */
function setNativeSelectValue(select, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLSelectElement.prototype, 'value'
  )?.set;
  if (nativeSetter) {
    nativeSetter.call(select, value);
  } else {
    select.value = value;
  }
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Aplica un tema inyectado modificando los color pickers y el select de fuentes
 * que ya existen en el DOM de BusinessProfile.
 */
function applyInjectedTheme(theme) {
  // Los color pickers están dentro de .bp-color-swatch > input[type=color]
  // Orden en el sidebar: primary, bg, text, btnBg, btnText
  const colorInputs = document.querySelectorAll('.bp-sidebar input[type="color"], .bp-sidebar-section input[type="color"]');
  
  // Mapeo: los color pickers aparecen en orden:
  // [0] = primary, [1] = bg, [2] = text, [3] = btnBg, [4] = btnText
  const colorValues = [theme.primary, theme.bg, theme.text, theme.btnBg, theme.btnText];
  
  colorInputs.forEach((input, idx) => {
    if (idx < colorValues.length) {
      setNativeColorValue(input, colorValues[idx]);
    }
  });

  // Fuente: buscar el select de tipografía (es el último o único select en el sidebar con fuentes)
  const allSelects = document.querySelectorAll('.bp-sidebar select.bp-select, .bp-sidebar-section select.bp-select');
  // El select de tipografía tiene opciones como "Plus Jakarta Sans", "Inter", etc.
  allSelects.forEach(sel => {
    const hasFont = Array.from(sel.options).some(opt => opt.value === 'Plus Jakarta Sans' || opt.value === 'Inter');
    if (hasFont && theme.font) {
      setNativeSelectValue(sel, theme.font);
    }
  });
}

export default function BusinessProfileSafe() {
  const injectedRef = useRef(false);

  useEffect(() => {
    // ═══ PASO 1: Ocultar temas oscuros originales ═══
    const hideDarkThemes = () => {
      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        const text = element.textContent?.trim();
        if (text && DARK_THEMES_TO_HIDE.includes(text)) {
          let parent = element.closest('button, .theme-card, [class*="theme"], [class*="card"]');
          if (parent) {
            parent.style.display = 'none';
          } else {
            element.style.display = 'none';
          }
        }
      });
    };

    // ═══ PASO 2: Inyectar temas nuevos en la grilla ═══
    const injectNewThemes = () => {
      // Evitar inyectar duplicados
      if (document.querySelector('[data-safe-themes-injected]')) return;

      // Buscar la grilla de temas rápidos
      // Es un div con display:grid dentro de la sección "Temas Rápidos"
      const sidebarSections = document.querySelectorAll('.bp-sidebar-section');
      let themesGrid = null;
      
      for (const section of sidebarSections) {
        const title = section.querySelector('.bp-sidebar-title');
        if (title && title.textContent.includes('Temas Rápidos')) {
          themesGrid = section.querySelector('div[style*="grid"]');
          if (!themesGrid) {
            // Fallback: buscar cualquier div hijo que tenga grid
            const children = section.querySelectorAll('div');
            for (const child of children) {
              const style = child.getAttribute('style') || '';
              if (style.includes('grid')) {
                themesGrid = child;
                break;
              }
            }
          }
          break;
        }
      }

      if (!themesGrid) return;

      // Marcar como inyectado
      themesGrid.setAttribute('data-safe-themes-injected', 'true');

      // Agregar separador visual
      const separator = document.createElement('div');
      separator.style.cssText = 'grid-column: 1 / -1; text-align: center; font-size: 11px; font-weight: 700; color: #64748b; padding: 8px 0 4px; border-top: 1px solid #e2e8f0; margin-top: 4px; letter-spacing: 0.5px; text-transform: uppercase;';
      separator.textContent = '✨ Temas Nuevos';
      themesGrid.appendChild(separator);

      // Crear botones para cada tema nuevo
      SAFE_THEMES.forEach(theme => {
        const btn = document.createElement('button');
        btn.type = 'button';
        
        const isDark = isBackgroundDark(theme.bg);
        
        btn.style.cssText = `
          font-size: 11px;
          padding: 8px 4px;
          border: 1px solid ${isDark ? theme.primary + '60' : '#cbd5e1'};
          background: ${theme.bg};
          color: ${theme.text};
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: auto;
          border-radius: 8px;
          font-family: inherit;
          transition: all 0.2s ease;
          min-height: 52px;
        `;

        btn.innerHTML = `
          <span style="display:block;font-weight:700;line-height:1.2;margin-bottom:4px;">${theme.name}</span>
          <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${theme.primary};border:1px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'};"></span>
        `;

        // Hover effects
        btn.addEventListener('mouseenter', () => {
          btn.style.borderColor = theme.primary;
          btn.style.borderWidth = '2px';
          btn.style.padding = '7px 3px'; // Compensar el borde más grueso
          btn.style.boxShadow = `0 2px 8px ${theme.primary}30`;
          btn.style.transform = 'translateY(-1px)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.borderColor = isDark ? theme.primary + '60' : '#cbd5e1';
          btn.style.borderWidth = '1px';
          btn.style.padding = '8px 4px';
          btn.style.boxShadow = 'none';
          btn.style.transform = 'none';
        });

        // Click: aplicar tema usando los color pickers existentes
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          applyInjectedTheme(theme);
          
          // Feedback visual: marcar como seleccionado
          themesGrid.querySelectorAll('[data-safe-theme-btn]').forEach(b => {
            b.style.borderColor = isBackgroundDark(b.dataset.themeBg) ? b.dataset.themePrimary + '60' : '#cbd5e1';
            b.style.borderWidth = '1px';
            b.style.padding = '8px 4px';
          });
          btn.style.borderColor = theme.primary;
          btn.style.borderWidth = '2px';
          btn.style.padding = '7px 3px';
        });

        btn.setAttribute('data-safe-theme-btn', 'true');
        btn.dataset.themeBg = theme.bg;
        btn.dataset.themePrimary = theme.primary;

        themesGrid.appendChild(btn);
      });

      // Agregar separador para los oscuros suaves
      const darkSeparatorIndex = 18; // Los primeros 18 son claros
      const allBtns = themesGrid.querySelectorAll('[data-safe-theme-btn]');
      if (allBtns.length > darkSeparatorIndex) {
        const darkSep = document.createElement('div');
        darkSep.style.cssText = 'grid-column: 1 / -1; text-align: center; font-size: 11px; font-weight: 700; color: #64748b; padding: 8px 0 4px; border-top: 1px solid #e2e8f0; margin-top: 4px; letter-spacing: 0.5px; text-transform: uppercase;';
        darkSep.textContent = '🌙 Oscuros Suaves';
        themesGrid.insertBefore(darkSep, allBtns[darkSeparatorIndex]);
      }
    };

    // Ejecutar inmediatamente
    hideDarkThemes();
    
    // Dar tiempo a que React renderice BusinessProfile
    const initTimer = setTimeout(() => {
      hideDarkThemes();
      injectNewThemes();
    }, 500);

    // Segundo intento por si el sidebar tarda en montar
    const retryTimer = setTimeout(() => {
      hideDarkThemes();
      if (!document.querySelector('[data-safe-themes-injected]')) {
        injectNewThemes();
      }
    }, 1500);

    // Observer para ocultar temas que se rendericen dinámicamente
    const observer = new MutationObserver(() => {
      hideDarkThemes();
      if (!document.querySelector('[data-safe-themes-injected]')) {
        injectNewThemes();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      clearTimeout(initTimer);
      clearTimeout(retryTimer);
      observer.disconnect();
    };
  }, []);

  return <BusinessProfile />;
}

/**
 * Determina si un color de fondo es oscuro.
 */
function isBackgroundDark(hex) {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}
