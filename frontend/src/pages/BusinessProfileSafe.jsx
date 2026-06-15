import React, { useEffect } from 'react';
import BusinessProfile from './BusinessProfile';

const BusinessProfileSafe = () => {
  useEffect(() => {
    const observer = new MutationObserver(() => {
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

      const buttons = document.querySelectorAll('button, .theme-card, .preset-card');
      buttons.forEach(btn => {
        if (darkThemes.some(theme => btn.textContent.includes(theme))) {
          btn.style.display = 'none';
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return <BusinessProfile />;
};

export default BusinessProfileSafe;
