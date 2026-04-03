/**
 * Post-1.250.10: route_apply_registry — #discuss / #discuss/<channelId>.
 *
 * Extracted from main.js installRouteApplyRegistryPlugins so the route
 * handler lives in its own file and main.js stays thin.
 * Calls window.__ERP_SHELL_ROUTES.renderDiscuss when registered (discuss addon);
 * falls back to an informational panel when not yet scaffolded.
 */
(function () {
  var R = window.AppCore && window.AppCore.routeApplyRegistry;
  if (!R || typeof R.registerBeforeDataRoutes !== "function") return;

  R.registerBeforeDataRoutes(function (hash, base) {
    var h = String(hash || "").split("?")[0];
    var discussMatch = h === "discuss";
    var discussChannelMatch = h.match(/^discuss\/(\d+)$/);
    if (!discussMatch && !discussChannelMatch) return false;

    var channelId = discussChannelMatch ? discussChannelMatch[1] : null;
    var SR = window.__ERP_SHELL_ROUTES || {};
    if (typeof SR.renderDiscuss === "function") {
      SR.renderDiscuss(channelId);
      return true;
    }

    var main = document.getElementById("action-manager");
    if (!main) return false;
    var channelLabel = channelId ? " — Channel #" + channelId : "";
    main.innerHTML =
      '<section class="o-empty-state o-discuss-panel" role="region" aria-label="Discuss">' +
      '<h3 class="o-empty-state-title">Discuss' + channelLabel + "</h3>" +
      '<p class="o-empty-state-subtitle">Messaging module not installed. Install the Discuss addon to enable real-time messaging.</p>' +
      '<p class="o-empty-state-subtitle"><a class="breadcrumb-item" href="#keyboard-shortcuts">Keyboard shortcuts</a> | <a class="breadcrumb-item" href="#client-info">Client info</a></p>' +
      '<button type="button" class="o-btn o-btn-primary" id="o-discuss-home">Go to Home</button>' +
      "</section>";
    var bh = document.getElementById("o-discuss-home");
    if (bh) {
      bh.onclick = function () { window.location.hash = "#home"; };
    }
    return true;
  });
})();
