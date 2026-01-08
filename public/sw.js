/* SuiteWaste OS Service Worker */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
if (workbox) {
  const { precacheAndRoute } = workbox.precaching;
  const { registerRoute } = workbox.routing;
  const { StaleWhileRevalidate, CacheFirst, NetworkOnly } = workbox.strategies;
  const { ExpirationPlugin } = workbox.expiration;
  const { BackgroundSyncPlugin } = workbox.backgroundSync; // Fixed: camelCase access
  // Precache manifest placeholder (injected by build tool)
  precacheAndRoute(self.__WB_MANIFEST || []);
  // Cache Google Fonts
  registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com',
    new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
  );
  registerRoute(
    ({ url }) => url.origin === 'https://fonts.gstatic.com',
    new CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365, maxEntries: 30 })],
    })
  );
  // Background sync for transaction uploads
  const bgSyncPlugin = new BackgroundSyncPlugin('syncQueue', {
    maxRetentionTime: 24 * 60 // 24 hours
  });
  registerRoute(
    ({ url }) => url.pathname.startsWith('/api/sync/'),
    new NetworkOnly({
      plugins: [bgSyncPlugin]
    }),
    'POST'
  );
  // General API caching for GET requests
  registerRoute(
    ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
    new StaleWhileRevalidate({
      cacheName: 'api-cache',
      plugins: [new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24, maxEntries: 100 })],
    })
  );
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
}