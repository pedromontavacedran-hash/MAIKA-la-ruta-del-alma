/*
 * Service worker mínimo de MAIKA PWA.
 *
 * Solo existe para cumplir el criterio de instalabilidad de Chrome
 * (un SW con handler `fetch`). NO cachea nada a propósito: mientras
 * MAIKA está en desarrollo queremos que la PWA siempre muestre el
 * contenido más reciente del servidor — cada petición va a red.
 *
 * Si más adelante queremos modo offline real, aquí irá la estrategia
 * de caché (stale-while-revalidate para estáticos, network-first para la API).
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
