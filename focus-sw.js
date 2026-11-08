// Notifications only: never used as a long-running timer or offline cache.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
    const url = new URL('focus.html', self.registration.scope).href;
    const client = clients.find(candidate => candidate.url === url);
    if (client) return client.focus();
    return self.clients.openWindow(url);
  }));
});
