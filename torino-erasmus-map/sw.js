const CACHE_NAME = 'torino-erasmus-map-v10';
const APP_SHELL = [
  './',
  './index.html',
  './offline.html',
  './robots.txt',
  './sitemap.xml',
  './assets/vendor/leaflet/leaflet.css',
  './assets/vendor/leaflet/leaflet.js',
  './assets/vendor/leaflet/images/layers.png',
  './assets/vendor/leaflet/images/layers-2x.png',
  './assets/vendor/leaflet/images/marker-icon.png',
  './assets/vendor/leaflet/images/marker-icon-2x.png',
  './assets/vendor/leaflet/images/marker-shadow.png',
  './assets/vendor/leaflet-markercluster/MarkerCluster.css',
  './assets/vendor/leaflet-markercluster/MarkerCluster.Default.css',
  './assets/vendor/leaflet-markercluster/leaflet.markercluster.js',
  './assets/vendor/fuse/fuse.min.js',
  './assets/css/styles.css',
  './assets/js/app.js',
  './assets/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './manifest.webmanifest',
  './data/pois-core.json',
  './data/erasmus-guide.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith('torino-erasmus-map-') && key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.searchParams.has('__ping')) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(event));
    return;
  }

  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function navigationResponse(event) {
  try {
    const request = event.request;
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put('./', response.clone());
    return response;
  } catch {
    notifyClient(event.clientId, { type: 'OFFLINE_FALLBACK' });
    const cachedApp = (await caches.match('./')) || (await caches.match('./index.html'));
    if (cachedApp) return offlineMarkedResponse(cachedApp);
    return caches.match('./offline.html');
  }
}

async function offlineMarkedResponse(response) {
  const text = await response.text();
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(text.replace('<body', '<body data-offline-fallback="true"'), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function notifyClient(clientId, message) {
  if (clientId) {
    const client = await self.clients.get(clientId);
    if (client) {
      client.postMessage(message);
      return;
    }
  }
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}
