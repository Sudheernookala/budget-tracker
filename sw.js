/ ⚠️ IMPORTANT: Change 'budget-tracker' to your actual GitHub repo name
var GHPATH = '/budget-tracker';
var CACHE_NAME = 'budget-tracker-v3';

var ASSETS = [
  GHPATH + '/',
  GHPATH + '/index.html',
  GHPATH + '/manifest.json',
  GHPATH + '/sw.js'
];

// Install: cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
