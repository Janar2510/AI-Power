/* Minimal service worker (Phase 401) */
self.addEventListener("install", function () {
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", function (_event) {
  /* network-first passthrough */
});
