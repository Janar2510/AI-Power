/**
 * Post-1.250.9: route_apply_registry — #client-info (diagnostics / nav hub, no backend).
 */
(function () {
  var R = window.AppCore && window.AppCore.routeApplyRegistry;
  if (!R || typeof R.registerBeforeDataRoutes !== "function") return;

  R.registerBeforeDataRoutes(function (hash, base) {
    var h = String(hash || "").split("?")[0];
    if (h !== "client-info" && base !== "client-info") {
      return false;
    }
    var main = document.getElementById("action-manager");
    if (!main) return false;
    var rpcMs =
      typeof window !== "undefined" && window.__ERP_RPC_DEADLINE_DEFAULT_MS != null
        ? String(window.__ERP_RPC_DEADLINE_DEFAULT_MS)
        : "25000";
    main.innerHTML =
      '<section class="o-empty-state o-client-info-panel" role="region" aria-label="Client information">' +
      '<h3 class="o-empty-state-title">Client information</h3>' +
      '<ul class="o-keyboard-shortcuts-list">' +
      '<li><span class="o-error-panel__muted">Default ORM / JSON-RPC race</span> <strong>' +
      rpcMs +
      " ms</strong></li>" +
      '<li><a class="breadcrumb-item" href="#keyboard-shortcuts">Keyboard shortcuts</a></li>' +
      '<li><a class="breadcrumb-item" href="#contacts">Contacts list</a></li>' +
      "</ul>" +
      '<p class="o-empty-state-subtitle">Use <kbd class="o-kbd">Alt+R</kbd> to refresh the current route; <kbd class="o-kbd">Alt+G</kbd> opens Contacts.</p>' +
      '<button type="button" class="o-btn o-btn-primary" id="o-client-info-home">Go to Home</button>' +
      "</section>";
    var bh = document.getElementById("o-client-info-home");
    if (bh) {
      bh.onclick = function () {
        window.location.hash = "#home";
      };
    }
    return true;
  });
})();
