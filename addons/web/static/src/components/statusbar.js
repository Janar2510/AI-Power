/**
 * Statusbar component (Phase 391).
 */
(function () {
  function renderHTML(stages, active) {
    var html =
      '<div class="o-statusbar o-statusbar--pipeline" role="toolbar" aria-label="Stage pipeline">';
    (stages || []).forEach(function (s) {
      var v = String(s.value || s.id || "");
      var cls = "o-statusbar-stage" + (String(active || "") === v ? " o-statusbar-stage--active" : "");
      html +=
        '<button type="button" class="' +
        cls +
        '" data-value="' +
        v.replace(/"/g, "&quot;") +
        '" data-stage="' +
        v.replace(/"/g, "&quot;") +
        '">' +
        String(s.label || s.name || v).replace(/</g, "&lt;") +
        "</button>";
    });
    html += "</div>";
    return html;
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.Statusbar = { renderHTML: renderHTML };
})();
