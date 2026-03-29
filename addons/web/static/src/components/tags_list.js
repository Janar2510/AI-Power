/**
 * Read-only tag pill strip for list cells & summaries (Phase 1.246 H5).
 */
(function () {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * @param {{ id?: string|number, name?: string, display_name?: string }[]} items
   */
  function renderPills(items) {
    var list = Array.isArray(items) ? items : [];
    if (!list.length) {
      return '<span class="o-tags-list o-tags-list--empty">&mdash;</span>';
    }
    var html = '<span class="o-tags-list" role="list">';
    list.forEach(function (t) {
      var name = esc(t.name || t.display_name || t.id || "");
      html += '<span class="o-tags-list-pill" role="listitem">' + name + "</span>";
    });
    html += "</span>";
    return html;
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.TagsList = { renderPills: renderPills };
})();
