/**
 * Post-1.250.11: route_apply_registry — #settings/* routes.
 *
 * Extracted from main.js installRouteApplyRegistryPlugins.
 * Delegates to window.__ERP_SHELL_ROUTES render helpers when available;
 * falls back to an informational panel otherwise.
 */
(function () {
  var R = window.AppCore && window.AppCore.routeApplyRegistry;
  if (!R || typeof R.registerBeforeDataRoutes !== "function") return;

  R.registerBeforeDataRoutes(function (hash) {
    var h = String(hash || "").split("?")[0];
    var SR = window.__ERP_SHELL_ROUTES || {};

    if (h === "settings/apikeys") {
      if (typeof SR.renderApiKeysSettings === "function") { SR.renderApiKeysSettings(); return true; }
      _fallback("API Keys"); return true;
    }
    if (h === "settings/totp") {
      if (typeof SR.renderTotpSettings === "function") { SR.renderTotpSettings(); return true; }
      _fallback("Two-Factor Authentication"); return true;
    }
    if (h === "settings/dashboard-widgets") {
      if (typeof SR.renderDashboardWidgets === "function") { SR.renderDashboardWidgets(); return true; }
      _fallback("Dashboard Widgets"); return true;
    }
    if (h === "settings" || h === "settings/") {
      if (typeof SR.renderSettings === "function") { SR.renderSettings(); return true; }
      _fallback("Settings"); return true;
    }
    return false;
  });

  function _fallback(title) {
    var main = document.getElementById("action-manager");
    if (!main) return;
    main.innerHTML =
      '<section class="o-empty-state" role="region" aria-label="' + title + '">' +
      '<h3 class="o-empty-state-title">' + title + "</h3>" +
      '<p class="o-empty-state-subtitle">Settings module not fully loaded.</p>' +
      '<button type="button" class="o-btn o-btn-primary" id="o-settings-home">Go to Home</button>' +
      "</section>";
    var bh = document.getElementById("o-settings-home");
    if (bh) { bh.onclick = function () { window.location.hash = "#home"; }; }
  }
})();
