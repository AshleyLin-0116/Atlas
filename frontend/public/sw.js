self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Atlas', {
      body: data.body || '',
      icon: '/logo192.png'
    })
  );
});