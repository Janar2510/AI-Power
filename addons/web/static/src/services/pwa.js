/**
 * PWA service (Phase 401 / 1.250.16 fix).
 *
 * Production service worker is served by routes.py at /web/sw.js with proper
 * cache versioning and correct scope.  The static
 * addons/web/static/src/pwa/sw.js is a dev-only fallback that is NOT served
 * in production — registering it in production causes a 404 and silently
 * disables offline support.
 */
(function () {
  /**
   * Register the production service worker.
   * URL: /web/sw.js  (routes.py route — includes cache version header)
   * Scope: /  (entire app; required for PWA install on root origin)
   */
  function register() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/web/sw.js", { scope: "/" })
      .catch(function () { /* noop — SW is progressive enhancement */ });
  }

  window.Services = window.Services || {};
  window.Services.pwa = { register: register };
})();
