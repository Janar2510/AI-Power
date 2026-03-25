/**
 * Phase 615: Calendar view toolbar chrome — tokenized nav + search (delegates from legacy main.js).
 */
(function () {
  function escAttr(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * @param {{ viewSwitcherHtml?: string, monthTitle?: string, searchTerm?: string, addLabel?: string }} options
   */
  function buildToolbarHtml(options) {
    var o = options || {};
    var viewSwitcherHtml = o.viewSwitcherHtml || "";
    var monthTitle = o.monthTitle || "";
    var searchTerm = o.searchTerm || "";
    var addLabel = o.addLabel || "Add";
    var html = '<div class="o-calendar-toolbar o-calendar-toolbar-chrome">';
    html += viewSwitcherHtml;
    html +=
      '<button type="button" id="cal-prev" class="o-calendar-nav-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted" aria-label="Previous month">Prev</button>';
    html +=
      '<span id="cal-title" class="o-calendar-month-title">' + escAttr(monthTitle) + "</span>";
    html +=
      '<button type="button" id="cal-next" class="o-calendar-nav-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted" aria-label="Next month">Next</button>';
    html +=
      '<button type="button" id="cal-today" class="o-calendar-nav-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Today</button>';
    html += '<div role="search" class="o-calendar-search-wrap o-list-fallback-search">';
    html +=
      '<input type="text" id="list-search" class="o-calendar-search-field o-list-search-field" placeholder="Search..." aria-label="Search records" value="' +
      escAttr(searchTerm) +
      '">';
    html +=
      '<button type="button" id="btn-search" class="o-btn o-calendar-search-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button>';
    html +=
      '<button type="button" id="btn-add" class="o-btn o-calendar-add-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' +
      escAttr(addLabel) +
      "</button>";
    html += "</div></div>";
    return html;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.CalendarViewChrome = { buildToolbarHtml: buildToolbarHtml };
})();
