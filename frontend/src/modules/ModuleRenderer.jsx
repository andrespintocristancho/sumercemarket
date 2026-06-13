import React from 'react';
import StoreModule from './templates/StoreModule';

/**
 * ModuleRenderer
 *
 * Renderiza el módulo visual de la página del vendedor según su plantilla.
 *
 * Plantillas soportadas:
 *   store, fashion, beauty, health, gym, vehicles, food, services
 *
 * Mientras no existan módulos específicos para cada plantilla,
 * TODAS usan StoreModule como fallback seguro para evitar crashes.
 *
 * Cuando se cree un módulo nuevo (ej. FashionModule.jsx),
 * se agrega al templateMap y se importa con lazy().
 */

const VALID_TEMPLATES = [
  'store',
  'fashion',
  'beauty',
  'health',
  'gym',
  'vehicles',
  'food',
  'services',
];

export default function ModuleRenderer({ template, seller, offers }) {
  // Por ahora todos los templates renderizan StoreModule.
  // Cuando se creen módulos específicos, se hará:
  //   const templateMap = {
  //     store: lazy(() => import('./templates/StoreModule')),
  //     fashion: lazy(() => import('./templates/FashionModule')),
  //     ...
  //   };
  //   const Component = templateMap[template] || StoreModule;

  const Component = StoreModule;

  return <Component seller={seller} offers={offers} />;
}
