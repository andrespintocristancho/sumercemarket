/* SumerceMarket - Service Worker
 *
 * Estrategias:
 *  - Precache de archivos principales del app shell.
 *  - cache-first para assets estáticos (JS, CSS, imágenes, fuentes, íconos).
 *  - network-first para navegaciones (HTML / SPA routing) con fallback a /index.html.
 *  - NUNCA se cachean las llamadas a Supabase (auth, REST, storage, realtime).
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `sumerce-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `sumerce-runtime-${CACHE_VERSION}`;

// App shell mínimo. El resto se cachea bajo demanda en runtime.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Dominios o patrones que NO deben cachearse (datos sensibles / dinámicos).
const NEVER_CACHE_HOST_PATTERNS = [
  /\.supabase\.co$/i,
  /\.supabase\.in$/i
];

const NEVER_CACHE_PATH_PATTERNS = [
  /\/auth\//i,
  /\/rest\/v1\//i,
  /\/storage\/v1\//i,
  /\/realtime\/v1\//i
];

function shouldNeverCache(url) {
  try {
    const u = new URL(url);
    if (NEVER_CACHE_HOST_PATTERNS.some((re) => re.test(u.hostname))) return true;
    if (NEVER_CACHE_PATH_PATTERNS.some((re) => re.test(u.pathname))) return true;
  } catch (_) {
    return false;
  }
  return false;
}

function isStaticAsset(request) {
  const dest = request.destination;
  return (
    dest === 'style' ||
    dest === 'script' ||
    dest === 'image' ||
    dest === 'font' ||
    dest === 'worker'
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Solo manejamos GET. Otros métodos van directo a la red.
  if (request.method !== 'GET') return;

  // No interferir con peticiones a Supabase ni a endpoints sensibles.
  if (shouldNeverCache(request.url)) return;

  // Network-first para navegación (HTML / SPA routing).
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first para assets estáticos del mismo origen.
  const sameOrigin = new URL(request.url).origin === self.location.origin;
  if (sameOrigin && isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Por defecto: intenta red y, si falla, busca en cache.
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const fallback = await caches.match(request);
    if (fallback) return fallback;
    throw err;
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const shell = await caches.match('/index.html');
    if (shell) return shell;
    throw err;
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
