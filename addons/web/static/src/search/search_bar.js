/**
 * Search bar HTML fragment — tokenized classes for list/kanban toolbars (Phase 1.246 G2).
 */
(function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  function renderSearchInputHtml(opts) {
    opts = opts || {};
    var placeholder = opts.placeholder || "Search…";
    var id = opts.inputId || "o-search-bar-input";
    return (
      '<div class="o-search-bar o-flex-gap-sm" role="search">' +
      '<label class="o-sr-only" for="' +
      esc(id) +
      '">Search</label>' +
      '<input type="search" id="' +
      esc(id) +
      '" class="o-control-input o-search-bar-input" placeholder="' +
      esc(placeholder) +
      '" autocomplete="off" /></div>'
    );
  }

  window.__ERP_SearchBar = { renderSearchInputHtml: renderSearchInputHtml };
})();
