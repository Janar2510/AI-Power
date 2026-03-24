/**
 * Wave Q (Phase 562): list view control-panel HTML builders (extracted boundary).
 * Legacy list_view.js delegates here when window.AppCore.ListControlPanel is set
 * by the modern bundle (clean-room; no Odoo paste).
 */

function escHtml(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildSearchDropdownsHtml(options) {
  var searchFilters = options.searchFilters || [];
  var activeFilters = options.activeFilters || [];
  var searchGroupBys = options.searchGroupBys || [];
  var currentGroupBy = options.currentGroupBy;
  var savedFiltersList = options.savedFiltersList || [];
  var dropdownsHtml = "";
  if (searchFilters.length) {
    dropdownsHtml += '<div class="o-cp-dropdown-wrap" data-cp-dd="1"><button type="button" class="o-cp-dropdown-toggle">Filters</button><div class="o-cp-dropdown-menu">';
    searchFilters.forEach(function (f) {
      var active = activeFilters.indexOf(f.name) >= 0;
      dropdownsHtml +=
        '<button type="button" class="o-cp-dropdown-item cp-filter-item' +
        (active ? " active" : "") +
        '" data-filter-toggle="' +
        String(f.name || "").replace(/"/g, "&quot;") +
        '">' +
        escHtml(f.string || f.name || "") +
        "</button>";
    });
    dropdownsHtml += "</div></div>";
  }
  if (searchGroupBys.length) {
    dropdownsHtml += '<div class="o-cp-dropdown-wrap" data-cp-dd="1"><button type="button" class="o-cp-dropdown-toggle">Group by</button><div class="o-cp-dropdown-menu">';
    dropdownsHtml += '<button type="button" class="o-cp-dropdown-item cp-groupby-item" data-group-by="">(None)</button>';
    searchGroupBys.forEach(function (g) {
      dropdownsHtml +=
        '<button type="button" class="o-cp-dropdown-item cp-groupby-item' +
        (currentGroupBy === g.group_by ? " active" : "") +
        '" data-group-by="' +
        String(g.group_by || "").replace(/"/g, "&quot;") +
        '">' +
        escHtml(g.string || g.name || "") +
        "</button>";
    });
    dropdownsHtml += "</div></div>";
  }
  dropdownsHtml += '<div class="o-cp-dropdown-wrap" data-cp-dd="1"><button type="button" class="o-cp-dropdown-toggle">Favorites</button><div class="o-cp-dropdown-menu">';
  savedFiltersList.forEach(function (sf) {
    dropdownsHtml +=
      '<button type="button" class="o-cp-dropdown-item cp-fav-item" data-saved-filter-id="' +
      String(sf.id != null ? sf.id : "").replace(/"/g, "&quot;") +
      '">' +
      escHtml(sf.name || "Filter") +
      "</button>";
  });
  dropdownsHtml +=
    '<button type="button" class="o-cp-dropdown-item cp-save-fav" data-save-favorite="1">Save current search…</button></div></div>';
  return dropdownsHtml;
}

export function buildQuickFiltersHtml(options) {
  var searchFilters = options.searchFilters || [];
  var activeFilters = options.activeFilters || [];
  var searchGroupBys = options.searchGroupBys || [];
  var currentGroupBy = options.currentGroupBy;
  var savedFiltersList = options.savedFiltersList || [];
  var model = options.model || "";
  var currentListState = options.currentListState || {};
  var filtersHtml = "";
  searchFilters.forEach(function (f) {
    var active = activeFilters.indexOf(f.name) >= 0;
    filtersHtml +=
      '<button type="button" class="btn-search-filter o-btn ' +
      (active ? "o-btn-primary active" : "o-btn-secondary") +
      '" data-filter="' +
      String(f.name || "").replace(/"/g, "&quot;") +
      '">' +
      escHtml(f.string || f.name || "") +
      "</button>";
  });
  if (searchGroupBys.length) {
    filtersHtml += '<select id="list-group-by" class="o-list-select"><option value="">Group by</option>';
    searchGroupBys.forEach(function (g) {
      filtersHtml +=
        '<option value="' +
        String(g.group_by || "").replace(/"/g, "&quot;") +
        '"' +
        (currentGroupBy === g.group_by ? " selected" : "") +
        ">" +
        escHtml(g.string || g.name || "") +
        "</option>";
    });
    filtersHtml += "</select>";
  }
  filtersHtml += '<select id="list-saved-filter" class="o-list-select"><option value="">Saved filters</option>';
  savedFiltersList.forEach(function (f) {
    filtersHtml +=
      '<option value="' +
      String(f.id != null ? f.id : "").replace(/"/g, "&quot;") +
      '"' +
      (currentListState.savedFilterId == f.id ? " selected" : "") +
      ">" +
      escHtml(f.name || "Filter") +
      "</option>";
  });
  filtersHtml += "</select>";
  if (model === "crm.lead") {
    filtersHtml += '<select id="list-stage-filter" class="o-list-select"><option value="">All stages</option></select>';
  }
  return filtersHtml;
}

export function buildListActionsHtml(options) {
  var addLabel = options.addLabel || "Add";
  var reportName = options.reportName;
  var actionsHtml = "";
  actionsHtml += '<button type="button" id="btn-save-filter" class="o-btn o-btn-secondary">Save</button>';
  actionsHtml += '<button type="button" id="btn-export" class="o-btn o-btn-secondary">Export CSV</button>';
  actionsHtml += '<button type="button" id="btn-export-excel" class="o-btn o-btn-secondary">Export Excel</button>';
  actionsHtml += '<button type="button" id="btn-import" class="o-btn o-btn-secondary">Import</button>';
  if (reportName) actionsHtml += '<button type="button" id="btn-print" class="o-btn o-btn-secondary">Print</button>';
  if (reportName) actionsHtml += '<button type="button" id="btn-preview-pdf" class="o-btn o-btn-secondary">Preview</button>';
  actionsHtml += '<button type="button" id="btn-add" class="o-btn o-btn-primary">' + escHtml(addLabel) + "</button>";
  return actionsHtml;
}
