/**
 * Home / dashboard KPI strip (design-system/specs/dashboard-home.md).
 * Phase 590: RPC search_count via wireHomeKpiStrip.
 */
(function () {
  function buildHtml() {
    return (
      '<section class="o-home-kpi-strip" aria-label="Key metrics">' +
      '<div class="o-dashboard-kpis o-kpi-strip-grid">' +
      '<a href="#pipeline" class="o-kpi-strip-card o-card-gradient" data-kpi-metric="pipeline" aria-label="Open pipeline">' +
      '<span class="o-kpi-strip-label">Pipeline</span>' +
      '<span class="o-kpi-strip-value" data-kpi-count-for="crm.lead">—</span>' +
      "</a>" +
      '<a href="#orders" class="o-kpi-strip-card o-card-gradient" data-kpi-metric="orders" aria-label="Open sales orders">' +
      '<span class="o-kpi-strip-label">Sales</span>' +
      '<span class="o-kpi-strip-value" data-kpi-count-for="sale.order">—</span>' +
      "</a>" +
      '<a href="#contacts" class="o-kpi-strip-card o-card-gradient" data-kpi-metric="contacts" aria-label="Open contacts">' +
      '<span class="o-kpi-strip-label">Network</span>' +
      '<span class="o-kpi-strip-value" data-kpi-count-for="res.partner">—</span>' +
      "</a>" +
      "</div></section>"
    );
  }

  function wireHomeKpiStrip(root, rpc) {
    if (!root || !rpc || typeof rpc.callKw !== "function") return;
    var metrics = [
      { model: "crm.lead", domain: [["type", "=", "opportunity"]] },
      { model: "sale.order", domain: [] },
      { model: "res.partner", domain: [] },
    ];
    metrics.forEach(function (m) {
      var el = root.querySelector('.o-kpi-strip-value[data-kpi-count-for="' + m.model.replace(/"/g, "") + '"]');
      if (!el) return;
      rpc
        .callKw(m.model, "search_count", [m.domain], {})
        .then(function (n) {
          el.textContent = n != null ? String(n) : "0";
        })
        .catch(function () {
          el.textContent = "—";
        });
    });
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.DashboardKpiStrip = {
    buildHtml: buildHtml,
    wireHomeKpiStrip: wireHomeKpiStrip,
  };
})();
