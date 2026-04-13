// ── service-worker.js ─────────────────────────────────────────────────────────
// Caches all app assets on install; serves from cache first when offline.

const CACHE_NAME = 'hindi-trainer-v2';

const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon.svg',
    './icons/icon-192.svg',
    './icons/icon-512.svg',
    './js/phrases.js',
    './js/scoring.js',
    './js/srs.js',
    './js/db.js',
    './js/app.js',
];

// ── Install: pre-cache everything ─────────────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// ── Activate: clear old caches ────────────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// ── Fetch: network-first strategy (falls back to cache when offline) ──────────
self.addEventListener('fetch', event => {
    // Only intercept same-origin GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Update the cache with the fresh response
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                // Network failed — serve from cache
                return caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    // Last resort for HTML requests
                    if (event.request.headers.get('Accept')?.includes('text/html')) {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});
