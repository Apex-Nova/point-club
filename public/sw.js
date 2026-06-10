// Point Club Service Worker — Phase 8 Offline Mode
const CACHE_NAME = 'point-club-v1';
const OFFLINE_URL = '/offline.html';

// App shell resources to pre-cache
const PRECACHE = [
  '/',
  '/offline.html',
];

// ── Install: cache app shell ─────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first with offline fallback ───────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // API calls: network only (never cache sensitive data)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;

  // Navigation: network-first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/').then(r => r ?? fetch(request)))
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(request);
      const networkPromise = fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => null);

      return cached ?? await networkPromise ?? new Response('Offline', { status: 503 });
    })
  );
});

// ── Background sync for offline drawings ─────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-drawings') {
    event.waitUntil(syncOfflineDrawings());
  }
});

async function syncOfflineDrawings() {
  // Read pending drawings from IndexedDB and POST to API
  // This is called when connectivity is restored
  const db = await openDB();
  const tx = db.transaction('pending_drawings', 'readwrite');
  const store = tx.objectStore('pending_drawings');
  const pending = await store.getAll();

  for (const drawing of pending) {
    try {
      await fetch('/api/drawings/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(drawing),
      });
      await store.delete(drawing.id);
    } catch { /* retry next sync */ }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('point-club-offline', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pending_drawings')) {
        db.createObjectStore('pending_drawings', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

// ── Push notifications ────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Point Club', {
      body:  data.body ?? data.message,
      icon:  '/icons.svg',
      badge: '/icons.svg',
      data:  data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const existing = clients.find(c => c.url === url && 'focus' in c);
      if (existing) return existing.focus();
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
