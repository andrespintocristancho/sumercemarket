/**
 * ModuleRenderer.jsx
 * -------------------------------------------------------------
 * Selector modular para la pagina publica del vendedor.
 * Escoge que modulo renderizar segun la plantilla (template)
 * del negocio. En FASE 1 solo existe StoreModule, que tambien
 * actua como fallback cuando la plantilla no esta definida o
 * no tiene un modulo propio todavia.
 *
 * Props:
 *   - seller: objeto del perfil del negocio (equivale a "profile").
 *   - offers: array de ofertas del vendedor.
 *   - template: string con la plantilla (business_template).
 *   - primaryColor: color de acento (business_primary_color).
 *
 * NOTA: este componente NO realiza queries ni toca Supabase.
 * Solo recibe datos ya cargados por la pagina contenedora.
 * -------------------------------------------------------------
 */

import React from 'react';
import StoreModule from './templates/StoreModule.jsx';

// Mapa de plantillas -> modulo. En FASE 1 solo "store".
// Las demas plantillas se iran agregando en fases siguientes.
const MODULES = {
  store: StoreModule,
  // food: FoodModule,      (FASE 2+)
  // fashion: FashionModule,(FASE 2+)
  // beauty: BeautyModule,  (FASE 2+)
  // gym: GymModule,        (FASE 2+)
  // vehicles: VehiclesModule,
  // health: HealthModule,
  // services: ServicesModule,
};

export default function ModuleRenderer({ seller, offers = [], template, primaryColor }) {
  // Normaliza la plantilla y aplica fallback a StoreModule.
  const key = (template || '').toString().trim().toLowerCase();
  const SelectedModule = MODULES[key] || StoreModule;

  return (
    <SelectedModule
      seller={seller}
      offers={offers}
      primaryColor={primaryColor}
    />
  );
}
