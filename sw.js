const CACHE_NAME = 'edebiyat-yani-basinda-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
  })());
});

self.addEventListener('push', event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Yakınında bir edebiyat durağı var';
  const options = {
    body: payload.body || 'Yakınındaki edebiyat mekânlarını keşfet.',
    data: payload.data || payload,
    tag: payload.tag || 'edebiyat-yakindaki-mekanlar',
    renotify: false
  };

  if (payload.icon) options.icon = payload.icon;
  if (payload.badge) options.badge = payload.badge;

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const data = event.notification.data || {};
  let target = new URL('./', self.registration.scope);

  if (Array.isArray(data.recordIds) && data.recordIds.length) {
    target.searchParams.set('mekanlar', data.recordIds.map(String).join(','));
  } else if (data.recordId != null) {
    target.searchParams.set('mekan', String(data.recordId));
  } else if (typeof data.url === 'string') {
    try {
      const candidate = new URL(data.url, self.registration.scope);
      if (candidate.origin === self.location.origin) target = candidate;
    } catch (_) {}
  }

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin)) {
        const navigated = await client.navigate(target.href);
        if (navigated) return navigated.focus();
        return client.focus();
      }
    }
    return self.clients.openWindow(target.href);
  })());
});
