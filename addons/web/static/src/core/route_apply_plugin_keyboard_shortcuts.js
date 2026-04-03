/**
 * Post-1.250.8: route_apply_registry plugin — #keyboard-shortcuts help surface (incremental P1).
 * Odoo reference: addons/web/static/src/webclient (command palette docs); ERP uses static shell copy.
 */
(function () {
  var R = window.AppCore && window.AppCore.routeApplyRegistry;
  if (!R || typeof R.registerBeforeDataRoutes !== "function") return;

  R.registerBeforeDataRoutes(function (hash, base) {
    var h = String(hash || "").split("?")[0];
    if (h !== "keyboard-shortcuts" && base !== "keyboard-shortcuts") {
      return false;
    }
    var main = document.getElementById("action-manager");
    if (!main) return false;
    main.innerHTML =
      '<section class="o-empty-state o-keyboard-shortcuts-help" role="region" aria-label="Keyboard shortcuts">' +
      '<h3 class="o-empty-state-title">Keyboard shortcuts</h3>' +
      '<ul class="o-keyboard-shortcuts-list">' +
      '<li><kbd class="o-kbd">Mod+K</kbd> <span class="o-error-panel__muted">Command palette</span></li>' +
      '<li><kbd class="o-kbd">Alt+H</kbd> <span class="o-error-panel__muted">Home</span> (modular shell)</li>' +
      '<li><kbd class="o-kbd">Alt+R</kbd> <span class="o-error-panel__muted">Refresh current route</span></li>' +
      '<li><kbd class="o-kbd">Alt+G</kbd> <span class="o-error-panel__muted">Contacts</span> (<code>#contacts</code>)</li>' +
      '<li><kbd class="o-kbd">Alt+D</kbd> <span class="o-error-panel__muted">Discuss</span> (<code>#discuss</code>)</li>' +
      '<li><kbd class="o-kbd">Alt+N</kbd> <span class="o-error-panel__muted">New record</span> (list)</li>' +
      '<li><kbd class="o-kbd">Alt+/</kbd> <span class="o-error-panel__muted">Focus list search</span></li>' +
      "</ul>" +
      '<p class="o-empty-state-subtitle">Diagnostics: <a class="breadcrumb-item" href="#client-info">#client-info</a>. Full contract: <code>webclient_shortcut_contract.js</code> and docs/frontend.md.</p>' +
      '<button type="button" class="o-btn o-btn-primary" id="o-kb-shortcuts-home">Go to Home</button>' +
      "</section>";
    var bh = document.getElementById("o-kb-shortcuts-home");
    if (bh) {
      bh.onclick = function () {
        window.location.hash = "#home";
      };
    }
    return true;
  });
})();
