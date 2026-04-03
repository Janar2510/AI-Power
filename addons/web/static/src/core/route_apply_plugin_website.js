/**
 * Phase 1.250.13: route_apply_registry — #website placeholder.
 *
 * Extracted from main.js installRouteApplyRegistryPlugins so each route
 * handler lives in its own file and main.js stays thin.
 *
 * Renders an informational placeholder for the #website route until the
 * full website module is scaffolded.
 */
(function () {
  var R = window.AppCore && window.AppCore.routeApplyRegistry;
  if (!R || typeof R.registerBeforeDataRoutes !== "function") return;

  R.registerBeforeDataRoutes(function (hash, base) {
    if (base !== "website") return false;

    var main = document.getElementById("action-manager");
    if (!main) return false;

    var ui = window.UIComponents;
    if (ui && ui.EmptyState && typeof ui.EmptyState.renderHTML === "function") {
      main.innerHTML = ui.EmptyState.renderHTML({
        icon: "\u25C7",
        title: "Website",
        subtitle: "Website pages and editor are scaffolded in modules; open Products for catalogue data, or Home.",
        actionLabel: "Go to Home",
        secondaryActionLabel: "Open Products",
      });
      ui.EmptyState.wire(main, {
        actionFn: function () { window.location.hash = "#home"; },
        secondaryActionFn: function () { window.location.hash = "#products"; },
      });
    } else {
      main.innerHTML =
        '<section class="o-empty-state" role="status">' +
        '<h3 class="o-empty-state-title">Website</h3>' +
        '<p class="o-empty-state-subtitle">Website pages and editor are scaffolded in modules; open Products for catalogue data, or Home.</p>' +
        '<button type="button" class="o-btn o-btn-primary" id="o-website-placeholder-home">Go to Home</button>' +
        '<button type="button" class="o-btn o-btn-secondary" id="o-website-placeholder-products" style="margin-left:var(--space-sm)">Open Products</button>' +
        "</section>";
      var bHome = document.getElementById("o-website-placeholder-home");
      if (bHome) bHome.onclick = function () { window.location.hash = "#home"; };
      var bProd = document.getElementById("o-website-placeholder-products");
      if (bProd) bProd.onclick = function () { window.location.hash = "#products"; };
    }
    return true;
  });
})();
