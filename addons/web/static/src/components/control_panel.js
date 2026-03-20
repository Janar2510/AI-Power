(function () {
  window.UIComponents = window.UIComponents || {};

  window.UIComponents.ControlPanel = {
    renderHTML: function renderHTML(options) {
      var opts = options || {};
      var viewSwitcherHtml = opts.viewSwitcherHtml || "";
      var searchTerm = (opts.searchTerm || "").replace(/"/g, "&quot;");
      var filtersHtml = opts.filtersHtml || "";
      var actionsHtml = opts.actionsHtml || "";
      return '<div class="o-control-panel">' +
        '<div class="o-control-panel-main">' +
        viewSwitcherHtml +
        '<div class="o-search-bar" role="search">' +
        '<input type="text" id="list-search" class="o-list-search-input" placeholder="Search..." aria-label="Search records" value="' + searchTerm + '">' +
        '<button type="button" id="btn-search" class="o-btn o-btn-primary">Search</button>' +
        '<button type="button" id="btn-ai-search" class="o-btn o-btn-secondary o-search-ai-btn" title="Natural language search">AI Search</button>' +
        "</div>" +
        "</div>" +
        '<div class="o-control-panel-filters">' + filtersHtml + "</div>" +
        '<div class="o-control-panel-actions">' + actionsHtml + "</div>" +
        "</div>";
    },
  };
})();
