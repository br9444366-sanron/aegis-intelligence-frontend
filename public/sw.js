/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Service Worker
 * ============================================================
 * Strategy overview:
 *  - API calls (/api/*)        → Network-first, fallback to cache
 *  - Static assets (JS/CSS)    → Cache-first, fallback to network
 *  - Navigation requests       → Network-first, fallback to index.html
 *  - Images / fonts            → Cache-first with long TTL
 * ============================================================
 */
/* global self */
self.__WB_MANIFEST;

const CACHE_VERSION = 'v2.1.0';
const SHELL_CACHE   = `aegis-shell-${CACHE_VERSION}`;
const STATIC_CACHE  = `aegis-static-${CACHE_VERSION}`;
const API_CACHE     = `aegis-api-${CACHE_VERSION}`;

/** Files that make up the application shell — cached on install */
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
];

/** Old cache names to delete on activate */
const KNOWN_CACHES = [SHELL_CACHE, STATIC_CACHE, API_CACHE];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !KNOWN_CACHES.includes(key)) // Remove old caches
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // Take control of all open tabs
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension / devtools requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // ── 1. API calls → Network-first ────────────────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstAPI(request));
    return;
  }

  // ── 2. Navigation (HTML pages) → Network-first, offline → index.html ───
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // ── 3. Static assets (JS, CSS, fonts, images) → Cache-first ────────────
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }

  // ── 4. Everything else → Network with cache fallback ────────────────────
  event.respondWith(networkWithCacheFallback(request));
});

// ─── Strategies ───────────────────────────────────────────────────────────────

/**
 * Network-first for API calls.
 * Caches successful responses for offline graceful degradation.
 * Stale data shown when offline; fresh data always preferred.
 */
async function networkFirstAPI(request) {
  try {
    const networkResponse = await fetch(request.clone());

    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Offline — return cached API response if available
    const cached = await caches.match(request);
    if (cached) return cached;

    // No cache — return a structured offline JSON response
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Aegis is offline. Data will sync when connection is restored.',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Navigation handler.
 * Try network first; if offline, serve cached index.html (SPA shell).
 */
async function navigationHandler(request) {
  try {
    const networkResponse = await fetch(request);

    // Update shell cache with the latest index.html
    if (networkResponse.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put('/index.html', networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Offline — serve the cached app shell so the SPA still loads
    const cached =
      (await caches.match(request)) ||
      (await caches.match('/index.html')) ||
      (await caches.match('/'));

    if (cached) return cached;

    // Absolute last resort offline page
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aegis — Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      background: #0a1628;
      color: #e8eaf6;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: system-ui, sans-serif;
      text-align: center;
      padding: 2rem;
    }
    .bolt { font-size: 4rem; margin-bottom: 1rem; }
    h1 { color: #00d4ff; font-size: 1.5rem; margin-bottom: 0.5rem; }
    p  { color: #64748b; font-size: 0.9rem; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="bolt">⚡</div>
  <h1>Aegis is Offline</h1>
  <p>No internet connection detected.<br>Your data is safe and will sync when you're back online.</p>
</body>
</html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

/**
 * Cache-first for static assets (JS chunks, CSS, fonts, images).
 * Falls back to network and stores the response for next time.
 */
async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Nothing we can do for a missing static asset offline
    return new Response('', { status: 404 });
  }
}

/**
 * Network with cache fallback — for everything else.
 */
async function networkWithCacheFallback(request) {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match(request)) || new Response('', { status: 404 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isStaticAsset(url) {
  return (
    /\.(js|jsx|css|woff2?|ttf|otf|eot|png|jpg|jpeg|gif|webp|svg|ico)(\?.*)?$/.test(
      url.pathname
    )
  );
}

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Aegis', body: event.data.text() };
  }

  const options = {
    body: data.body || 'You have a new notification from Aegis.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open',    title: 'Open Aegis' },
      { action: 'dismiss', title: 'Dismiss'    },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Aegis Intelligence', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});
