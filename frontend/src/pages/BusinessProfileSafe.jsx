import { useEffect } from 'react';
import BusinessProfile from './BusinessProfile';

/**
 * BusinessProfileSafe
 * Wrapper seguro que renderiza BusinessProfile y oculta temas oscuros
 * sin modificar el archivo original.
 */
export default function BusinessProfileSafe() {
  useEffect(() => {
    // Lista de temas oscuros a ocultar
    const darkThemes = [
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

    // Función para ocultar elementos que contengan texto de temas oscuros
    const hideDarkThemes = () => {
      // Buscar todos los elementos de texto en el DOM
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach(element => {
        const text = element.textContent?.trim();
        
        // Si el elemento contiene exactamente un nombre de tema oscuro
        if (text && darkThemes.includes(text)) {
          // Buscar el contenedor padre más cercano (card, button, etc.)
          let parent = element.closest('button, .theme-card, [class*="theme"], [class*="card"]');
          
          if (parent) {
            parent.style.display = 'none';
          } else {
            // Si no encuentra contenedor específico, ocultar el elemento
            element.style.display = 'none';
          }
        }
      });
    };

    // Ejecutar inmediatamente
    hideDarkThemes();

    // Observar cambios en el DOM para ocultar temas que se rendericen dinámicamente
    const observer = new MutationObserver(() => {
      hideDarkThemes();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return <BusinessProfile />;
}
