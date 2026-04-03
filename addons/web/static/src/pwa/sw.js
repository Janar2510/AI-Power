/**
 * DEV-ONLY fallback service worker (Phase 401).
 * NOT served in production. Production SW is at /web/sw.js (core/http/routes.py).
 * This file exists so local `npm run dev` can exercise offline paths without
 * requiring a running Python server.
 */
self.addEventListener("install", function () {
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", function (_event) {
  /* network-first passthrough */
});
