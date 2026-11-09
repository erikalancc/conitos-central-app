// Service worker mínimo: solo hace que el navegador ofrezca "Instalar" la app.
// No guarda nada en caché a propósito: el POS siempre trabaja con datos en vivo del API
// y cada versión nueva que se sube se ve de inmediato (sin versiones viejas atoradas).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // Sin respondWith: cada petición va directo a la red, como sin service worker
});
