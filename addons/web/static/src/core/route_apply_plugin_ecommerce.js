/**
 * Phase 1.250.13: route_apply_registry — #ecommerce placeholder.
 *
 * Extracted from main.js installRouteApplyRegistryPlugins so each route
 * handler lives in its own file and main.js stays thin.
 *
 * Renders an informational placeholder for the #ecommerce route until the
 * full eCommerce module is scaffolded.
 */
(function () {
  var R = window.AppCore && window.AppCore.routeApplyRegistry;
  if (!R || typeof R.registerBeforeDataRoutes !== "function") return;

  R.registerBeforeDataRoutes(function (hash, base) {
    if (base !== "ecommerce") return false;

    var main = document.getElementById("action-manager");
    if (!main) return false;

    var ui = window.UIComponents;
    if (ui && ui.EmptyState && typeof ui.EmptyState.renderHTML === "function") {
      main.innerHTML = ui.EmptyState.renderHTML({
        icon: "\u25C7",
        title: "eCommerce",
        subtitle: "Shop flows are partially scaffolded. Use Products, Sale Orders, or Invoicing for catalogue and orders.",
        actionLabel: "Go to Home",
        secondaryActionLabel: "Open Sale Orders",
      });
      ui.EmptyState.wire(main, {
        actionFn: function () { window.location.hash = "#home"; },
        secondaryActionFn: function () { window.location.hash = "#orders"; },
      });
    } else {
      main.innerHTML =
        '<section class="o-empty-state" role="status">' +
        '<h3 class="o-empty-state-title">eCommerce</h3>' +
        '<p class="o-empty-state-subtitle">Shop flows are partially scaffolded. Use Products, Sale Orders, or Invoicing for catalogue and orders.</p>' +
        '<button type="button" class="o-btn o-btn-primary" id="o-ecommerce-placeholder-home">Go to Home</button>' +
        '<button type="button" class="o-btn o-btn-secondary" id="o-ecommerce-placeholder-orders" style="margin-left:var(--space-sm)">Open Sale Orders</button>' +
        "</section>";
      var bHome = document.getElementById("o-ecommerce-placeholder-home");
      if (bHome) bHome.onclick = function () { window.location.hash = "#home"; };
      var bOrders = document.getElementById("o-ecommerce-placeholder-orders");
      if (bOrders) bOrders.onclick = function () { window.location.hash = "#orders"; };
    }
    return true;
  });
})();
