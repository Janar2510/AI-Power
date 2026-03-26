(function () {
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderHTML(opts) {
    var o = opts || {};
    var icon = esc(o.icon || "○");
    var title = esc(o.title || "Nothing to show");
    var subtitle = esc(o.subtitle || "");
    var actionLabel = esc(o.actionLabel || "");
    var secondaryLabel = esc(o.secondaryActionLabel || "");
    var html = '<section class="o-empty-state" role="status">';
    html += '<div class="o-empty-state-icon" aria-hidden="true">' + icon + "</div>";
    html += '<h3 class="o-empty-state-title">' + title + "</h3>";
    if (subtitle) html += '<p class="o-empty-state-subtitle">' + subtitle + "</p>";
    if (actionLabel) html += '<button type="button" class="o-btn o-btn-primary o-empty-state-action">' + actionLabel + "</button>";
    if (secondaryLabel) {
      html +=
        '<button type="button" class="o-btn o-btn-secondary o-empty-state-secondary">' +
        secondaryLabel +
        "</button>";
    }
    html += "</section>";
    return html;
  }

  function wire(container, opts) {
    var o = opts || {};
    var btn = container && container.querySelector(".o-empty-state-action");
    if (btn && typeof o.actionFn === "function") btn.onclick = o.actionFn;
    var btn2 = container && container.querySelector(".o-empty-state-secondary");
    if (btn2 && typeof o.secondaryActionFn === "function") btn2.onclick = o.secondaryActionFn;
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.EmptyState = {
    renderHTML: renderHTML,
    wire: wire,
  };
})();
