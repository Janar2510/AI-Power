/**
 * Phase 609: Graph view toolbar chrome — tokenized toolbar (delegates from legacy main.js when AppCore.GraphViewChrome is present).
 */
(function () {
  function escAttr(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * @param {{ viewSwitcherHtml?: string, graphType?: string, searchTerm?: string, model?: string, addLabel?: string }} options
   */
  function buildToolbarHtml(options) {
    var o = options || {};
    var viewSwitcherHtml = o.viewSwitcherHtml || "";
    var graphType = o.graphType || "bar";
    var searchTerm = o.searchTerm || "";
    var model = o.model || "";
    var addLabel = o.addLabel || "Add";
    var types = ["bar", "line", "pie"];
    var html = '<div class="o-graph-toolbar o-graph-toolbar-chrome">';
    html += viewSwitcherHtml;
    html += '<span class="o-graph-type-switcher graph-type-switcher" role="group" aria-label="Chart type">';
    types.forEach(function (t) {
      var active = t === graphType;
      html +=
        '<button type="button" class="o-graph-type-btn btn-graph-type' +
        (active ? " active" : "") +
        '" data-type="' +
        escAttr(t) +
        '">' +
        (t.charAt(0).toUpperCase() + t.slice(1)) +
        "</button>";
    });
    html += "</span>";
    html += '<div role="search" class="o-graph-search-wrap o-list-fallback-search">';
    html +=
      '<input type="text" id="list-search" class="o-graph-search-field o-list-search-field" placeholder="Search..." aria-label="Search records" value="' +
      escAttr(searchTerm) +
      '">';
    html +=
      '<button type="button" id="btn-search" class="o-btn o-graph-search-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button>';
    if (model === "crm.lead") {
      html +=
        '<select id="list-stage-filter" class="o-graph-stage-select o-list-toolbar-select" aria-label="Stage"><option value="">All stages</option></select>';
    }
    html +=
      '<button type="button" id="btn-add" class="o-btn o-graph-add-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' +
      escAttr(addLabel) +
      "</button>";
    html += "</div></div>";
    return html;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.GraphViewChrome = { buildToolbarHtml: buildToolbarHtml };
})();
