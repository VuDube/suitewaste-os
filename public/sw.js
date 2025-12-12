import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
// This will be replaced by Vite PWA plugin with the actual precache manifest.
precacheAndRoute(self.__WB_MANIFEST || []);
// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);
// Cache the underlying font files with a cache-first strategy for 1 year.
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  })
);
// Cache API calls with a stale-while-revalidate strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24, // 1 day
        maxEntries: 50,
      }),
    ],
  })
);
// Fallback to offline page if navigation fails (optional)
// import { warmStrategyCache } from 'workbox-recipes';
// import { offlineFallback } from 'workbox-recipes';
// const pageStrategy = new StaleWhileRevalidate();
// warmStrategyCache({ urls: ['/offline.html'], strategy: pageStrategy });
// offlineFallback({ pageFallback: '/offline.html' });
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});