/**
 * Phase 614: Pivot view toolbar chrome — tokenized toolbar (delegates from legacy main.js).
 */
(function () {
  function escAttr(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * @param {{ viewSwitcherHtml?: string, searchTerm?: string, model?: string, addLabel?: string }} options
   */
  function buildToolbarHtml(options) {
    var o = options || {};
    var viewSwitcherHtml = o.viewSwitcherHtml || "";
    var searchTerm = o.searchTerm || "";
    var model = o.model || "";
    var addLabel = o.addLabel || "Add";
    var html = '<div class="o-pivot-toolbar o-pivot-toolbar-chrome">';
    html += viewSwitcherHtml;
    html +=
      '<button type="button" id="btn-pivot-flip" class="o-pivot-toolbar-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Flip axes</button>';
    html +=
      '<button type="button" id="btn-pivot-download" class="o-pivot-toolbar-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Download CSV</button>';
    html += '<div role="search" class="o-pivot-search-wrap o-list-fallback-search">';
    html +=
      '<input type="text" id="list-search" class="o-pivot-search-field o-list-search-field" placeholder="Search..." aria-label="Search records" value="' +
      escAttr(searchTerm) +
      '">';
    html +=
      '<button type="button" id="btn-search" class="o-btn o-pivot-search-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button>';
    if (model === "crm.lead") {
      html +=
        '<select id="list-stage-filter" class="o-pivot-stage-select o-list-toolbar-select" aria-label="Stage"><option value="">All stages</option></select>';
    }
    html +=
      '<button type="button" id="btn-add" class="o-btn o-pivot-add-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' +
      escAttr(addLabel) +
      "</button>";
    html += "</div></div>";
    return html;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.PivotViewChrome = { buildToolbarHtml: buildToolbarHtml };
})();
