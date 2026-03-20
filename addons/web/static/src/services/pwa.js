/**
 * PWA service (Phase 401).
 */
(function () {
  function register() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/web/static/src/pwa/sw.js").catch(function () { /* noop */ });
  }
  window.Services = window.Services || {};
  window.Services.pwa = { register: register };
})();
