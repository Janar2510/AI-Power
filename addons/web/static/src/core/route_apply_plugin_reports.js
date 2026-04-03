/**
 * Post-1.250.11: route_apply_registry — #reports/* routes.
 *
 * Extracted from main.js installRouteApplyRegistryPlugins.
 * Delegates to window.__ERP_CHROME_BLOCK render helpers when available;
 * falls back to an informational panel otherwise.
 */
(function () {
  var R = window.AppCore && window.AppCore.routeApplyRegistry;
  if (!R || typeof R.registerBeforeDataRoutes !== "function") return;

  var REPORTS = [
    { pattern: /^reports\/trial-balance$/, type: "trial-balance", title: "Trial Balance" },
    { pattern: /^reports\/profit-loss$/, type: "profit-loss", title: "Profit & Loss" },
    { pattern: /^reports\/balance-sheet$/, type: "balance-sheet", title: "Balance Sheet" },
    { pattern: /^reports\/stock-valuation$/, type: null, title: "Stock Valuation" },
    { pattern: /^reports\/sales-revenue$/, type: null, title: "Sales Revenue" },
  ];

  R.registerBeforeDataRoutes(function (hash) {
    var h = String(hash || "").split("?")[0];
    for (var i = 0; i < REPORTS.length; i++) {
      if (!h.match(REPORTS[i].pattern)) continue;

      var CB = window.__ERP_CHROME_BLOCK || {};
      if (REPORTS[i].type) {
        if (typeof CB.renderAccountingReport === "function") {
          CB.renderAccountingReport(REPORTS[i].type, REPORTS[i].title);
          return true;
        }
      } else if (REPORTS[i].title === "Stock Valuation") {
        if (typeof CB.renderStockValuationReport === "function") {
          CB.renderStockValuationReport();
          return true;
        }
      } else if (REPORTS[i].title === "Sales Revenue") {
        if (typeof CB.renderSalesRevenueReport === "function") {
          CB.renderSalesRevenueReport();
          return true;
        }
      }

      var main = document.getElementById("action-manager");
      if (!main) return false;
      main.innerHTML =
        '<section class="o-empty-state" role="region" aria-label="' + REPORTS[i].title + '">' +
        '<h3 class="o-empty-state-title">' + REPORTS[i].title + "</h3>" +
        '<p class="o-empty-state-subtitle">Report module not fully loaded. Install the relevant accounting or reporting addon.</p>' +
        '<button type="button" class="o-btn o-btn-primary" id="o-report-home">Go to Home</button>' +
        "</section>";
      var bh = document.getElementById("o-report-home");
      if (bh) { bh.onclick = function () { window.location.hash = "#home"; }; }
      return true;
    }
    return false;
  });
})();
