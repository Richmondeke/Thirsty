const CACHE_NAME = 'thirsty-club-v22';
const ASSETS = [
  './',
  './index.html',
  './main.js',
  './style.css',
  './Retron2000.ttf',
  './manifest.json',
  './images/favicon.png',
  './images/GBEDS.jpeg'
];

// Install Event — cache shell assets and immediately take over
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event — delete ALL old caches and claim clients immediately
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event — NETWORK FIRST for HTML/JS/CSS, cache-first for images/fonts
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // For navigation requests and core assets (HTML, JS, CSS) — always try network first
  if (
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    e.respondWith(
      fetch(e.request).then((networkResponse) => {
        // Update cache with fresh response
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback — serve from cache
        return caches.match(e.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // For everything else (images, fonts, etc.) — cache first, then network
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          e.request.url.startsWith(self.location.origin) &&
          !e.request.url.includes('/api/')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Silent fail for non-critical assets
    })
  );
});

// Push Event — display native notification from admin broadcast
self.addEventListener('push', (e) => {
  let data = { title: 'ThirstyClub999', body: 'You have a new notification!', url: '/' };
  try {
    if (e.data) {
      data = Object.assign(data, e.data.json());
    }
  } catch (err) {
    // fallback to defaults
  }

  const options = {
    body: data.body,
    icon: './images/favicon.png',
    badge: './images/favicon.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open App' }
    ],
    tag: 'thirsty-push-' + Date.now(),
    renotify: true
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click — focus existing window or open new tab
self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  const targetUrl = e.notification.data?.url || '/';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Try to focus an existing window
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      return clients.openWindow(targetUrl);
    })
  );
});
