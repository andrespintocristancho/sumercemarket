import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Registro del service worker solo en producción.
// En desarrollo (Vite dev server) NO se registra para evitar caches
// que oculten cambios en caliente.
if (
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => {
        // No rompemos React si el SW falla; solo lo registramos en consola.
        console.warn('[PWA] No se pudo registrar el service worker:', err);
      });
  });
}
