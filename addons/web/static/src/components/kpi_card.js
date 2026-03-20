/**
 * KPI card — gradient border, value/label/trend; wraps UIComponents.Card (dashboard-home spec).
 */
(function () {
  window.UIComponents = window.UIComponents || {};

  function formatTrend(trend) {
    if (trend == null || trend === "") return null;
    const n = Number(trend);
    if (Number.isNaN(n)) return null;
    return n;
  }

  window.UIComponents.KpiCard = function KpiCard(options) {
    const opts = options || {};
    const href = opts.href || "#";
    const label = String(opts.label || "");
    const rawVal = opts.value;
    const val =
      typeof rawVal === "number"
        ? rawVal % 1 === 0
          ? String(rawVal)
          : rawVal.toFixed(1)
        : String(rawVal != null ? rawVal : "0");
    const trendNum = formatTrend(opts.trend);

    const link = document.createElement("a");
    link.href = href;
    link.className = "o-kpi-card-link";
    link.setAttribute("aria-label", label + ": " + val);

    const valueEl = document.createElement("div");
    valueEl.className = "o-kpi-card-value";
    valueEl.textContent = val;

    const labelEl = document.createElement("div");
    labelEl.className = "o-kpi-card-label";
    labelEl.textContent = label;

    const body = document.createDocumentFragment();
    body.appendChild(valueEl);
    body.appendChild(labelEl);

    if (trendNum !== null) {
      const trendEl = document.createElement("div");
      trendEl.className =
        "o-kpi-trend" +
        (trendNum > 0 ? " o-kpi-trend-up" : trendNum < 0 ? " o-kpi-trend-down" : " o-kpi-trend-neutral");
      trendEl.setAttribute("aria-hidden", "true");
      trendEl.textContent = trendNum > 0 ? "▲" : trendNum < 0 ? "▼" : "—";
      body.appendChild(trendEl);
    }

    if (!window.UIComponents.Card) {
      link.textContent = val + " " + label;
      return link;
    }

    const card = window.UIComponents.Card({ gradient: true, content: body });
    link.appendChild(card);
    return link;
  };
})();
