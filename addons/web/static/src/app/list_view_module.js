/**
 * Phase 738: extracted fallback list rendering from main.js.
 * Keeps legacy behavior while allowing main.js to delegate.
 */
(function () {
  function render(main, opts) {
    opts = opts || {};
    if (!main || !opts.model || !opts.route) return false;

    var model = opts.model;
    var route = opts.route;
    var records = opts.records || [];
    var searchTerm = opts.searchTerm || "";
    var totalCount = opts.totalCount;
    var offset = opts.offset;
    var limit = opts.limit;
    var savedFiltersList = opts.savedFiltersList || [];
    var currentListState = opts.currentListState || {};
    var rpc = opts.rpc;
    var viewsSvc = opts.viewsSvc;
    var showToast = opts.showToast || function () {};
    var helpers = opts.helpers || {};

    var getListColumns = helpers.getListColumns || function () { return []; };
    var getTitle = helpers.getTitle || function () { return route; };
    var getReportName = helpers.getReportName || function () { return null; };
    var loadRecords = helpers.loadRecords || function () {};
    var setViewAndReload = helpers.setViewAndReload || function () {};
    var deleteRecord = helpers.deleteRecord || function () {};
    var getMany2oneComodel = helpers.getMany2oneComodel || function () { return null; };
    var getMany2manyInfo = helpers.getMany2manyInfo || function () { return null; };
    var isMonetaryField = helpers.isMonetaryField || function () { return false; };
    var getMonetaryCurrencyField = helpers.getMonetaryCurrencyField || function () { return null; };
    var getSelectionLabel = helpers.getSelectionLabel || function (_model, _field, value) { return value; };
    var getDisplayNames = helpers.getDisplayNames || function () { return Promise.resolve({}); };
    var getDisplayNamesForMany2many = helpers.getDisplayNamesForMany2many || function () { return Promise.resolve({}); };
    var getActionForRoute = helpers.getActionForRoute || function () { return null; };
    var parseActionDomain = helpers.parseActionDomain || function () { return []; };
    var buildSearchDomain = helpers.buildSearchDomain || function () { return []; };
    var parseFilterDomain = helpers.parseFilterDomain || function () { return []; };
    var saveSavedFilter = helpers.saveSavedFilter || function () { return Promise.resolve(); };
    var showImportModal = helpers.showImportModal || function () {};
    /** Domain from hash for list reloads; avoids bare `getHashDomainParam` in nested callbacks (Safari + bundled `let` blocks can drop the closure). */
    function resolveListHashDomain() {
      var fn = helpers.getHashDomainParam;
      if (fn && typeof fn === "function") return fn();
      if (typeof window !== "undefined" && typeof window.__ERP_getHashDomainParam === "function") {
        return window.__ERP_getHashDomainParam();
      }
      return null;
    }
    var confirmModal = helpers.confirmModal || function () { return Promise.resolve(false); };
    var applyActionStackForList = helpers.applyActionStackForList || function () {};
    var renderViewSwitcher = helpers.renderViewSwitcher || function () { return ""; };
    var dispatchListActWindowThenFormHash = helpers.dispatchListActWindowThenFormHash || function () {};

    if (typeof window !== "undefined") window.chatContext = { model: model, active_id: null };
    var cols = getListColumns(model);
    var title = getTitle(route);
    var addLabel = route === "contacts" ? "Add contact" : route === "leads" ? "Add lead" : route === "orders" ? "Add order" : route === "products" ? "Add product" : route === "settings/users" ? "Add user" : "Add";
    var stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    var currentView = (currentListState.route === route && currentListState.viewType) || "list";
    var order = (currentListState.route === route && currentListState.order) || null;
    applyActionStackForList(route, title);
    var html = "<h2>" + title + "</h2>";
    html += '<p class="o-list-fallback-toolbar">';
    html += renderViewSwitcher(route, currentView);
    html += '<div role="search" class="o-list-fallback-search"><input type="text" id="list-search" placeholder="Search..." aria-label="Search records" class="o-list-search-field" value="' + searchTerm.replace(/"/g, "&quot;") + '">';
    html += '<button type="button" id="btn-search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button>';
    html += '<button type="button" id="btn-ai-search" title="Natural language search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--accent">AI Search</button></div>';
    var searchView = viewsSvc && viewsSvc.getView ? viewsSvc.getView(model, "search") : null;
    var searchFilters = (searchView && searchView.filters) || [];
    var searchGroupBys = (searchView && searchView.group_bys) || [];
    var activeFilters = currentListState.activeSearchFilters || [];
    var currentGroupBy = currentListState.groupBy || null;
    searchFilters.forEach(function (f) {
      var active = activeFilters.indexOf(f.name) >= 0;
      html += '<button type="button" class="btn-search-filter' + (active ? " active" : "") + '" data-filter="' + (f.name || "").replace(/"/g, "&quot;") + '">' + (f.string || f.name || "").replace(/</g, "&lt;") + "</button>";
    });
    if (searchGroupBys.length) {
      html += '<select id="list-group-by" class="o-list-toolbar-select"><option value="">Group by</option>';
      searchGroupBys.forEach(function (g) {
        html += '<option value="' + (g.group_by || "").replace(/"/g, "&quot;") + '"' + (currentGroupBy === g.group_by ? " selected" : "") + ">" + (g.string || g.name || "").replace(/</g, "&lt;") + "</option>";
      });
      html += "</select>";
    }
    html += '<select id="list-saved-filter" class="o-list-toolbar-select"><option value="">Saved filters</option>';
    savedFiltersList.forEach(function (f) {
      html += '<option value="' + (f.id != null ? String(f.id) : "").replace(/"/g, "&quot;") + '"' + (currentListState.savedFilterId == f.id ? " selected" : "") + ">" + (f.name || "Filter").replace(/</g, "&lt;") + "</option>";
    });
    html += "</select>";
    html += '<button type="button" id="btn-save-filter" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Save</button>';
    if (model === "crm.lead") {
      html += '<select id="list-stage-filter" class="o-list-toolbar-select"><option value="">All stages</option></select>';
    }
    html += '<button type="button" id="btn-export" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Export CSV</button>';
    html += '<button type="button" id="btn-export-excel" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Export Excel</button>';
    html += '<button type="button" id="btn-import" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Import</button>';
    var reportName = getReportName(model);
    if (reportName) html += '<button type="button" id="btn-print" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Print</button>';
    html += '<button type="button" id="btn-add" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + addLabel + "</button></p>";
    var hasFacets = activeFilters.length > 0 || currentGroupBy;
    if (hasFacets) {
      html += '<p class="facet-chips o-list-facet-row">';
      activeFilters.forEach(function (fname) {
        var f = searchFilters.find(function (x) { return x.name === fname; });
        html += '<span class="facet-chip o-list-facet-chip" data-type="filter" data-name="' + (fname || "").replace(/"/g, "&quot;") + '">' + (f ? (f.string || fname) : fname).replace(/</g, "&lt;") + ' <button type="button" class="facet-remove o-list-facet-remove" aria-label="Remove">&times;</button></span>';
      });
      if (currentGroupBy) {
        var g = searchGroupBys.find(function (x) { return x.group_by === currentGroupBy; });
        html += '<span class="facet-chip o-list-facet-chip" data-type="groupby" data-name="' + (currentGroupBy || "").replace(/"/g, "&quot;") + '">Group: ' + (g ? (g.string || currentGroupBy) : currentGroupBy).replace(/</g, "&lt;") + ' <button type="button" class="facet-remove o-list-facet-remove" aria-label="Remove">&times;</button></span>';
      }
      html += "</p>";
    }
    if (!records || !records.length) {
      main.innerHTML = html + "<p>No records yet.</p>";
    } else {
      var m2oCols = cols.filter(function (c) {
        var f = typeof c === "object" ? c.name : c;
        return getMany2oneComodel(model, f);
      });
      var m2mCols = cols.filter(function (c) {
        var f = typeof c === "object" ? c.name : c;
        return getMany2manyInfo(model, f);
      });
      var numericCols = ["expected_revenue", "revenue", "amount", "quantity"];
      function renderTable(nameMap) {
        var tbl = '<div id="bulk-action-bar" class="o-bulk-action-bar"><span id="bulk-selected-count" class="o-bulk-selected-count"></span><button type="button" id="bulk-delete" class="o-btn o-bulk-delete-btn">Delete Selected</button><button type="button" id="bulk-clear" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Clear</button></div>';
        tbl += '<table role="grid" aria-label="Records" class="o-list-fallback-table"><thead><tr role="row">';
        tbl += '<th role="columnheader" class="o-list-th o-list-th--checkbox"><input type="checkbox" id="list-select-all" aria-label="Select all" title="Select all"></th>';
        cols.forEach(function (c) {
          var f = typeof c === "object" ? c.name : c;
          var label = typeof c === "object" ? c.name || c : c;
          var isSorted = order && (order.startsWith(f + " ") || order.startsWith(f + ","));
          var dir = isSorted && order.indexOf("desc") >= 0 ? "desc" : "asc";
          var arrow = isSorted ? (dir === "asc" ? " ▲" : " ▼") : "";
          tbl += '<th role="columnheader" class="sortable-col o-list-th o-list-th--sortable" data-field="' + (f || "").replace(/"/g, "&quot;") + '">' + (label || "").replace(/</g, "&lt;") + arrow + "</th>";
        });
        tbl += '<th role="columnheader" class="o-list-th o-list-th--actions"></th></tr></thead><tbody>';
        var groupByField = currentListState.groupBy;
        var groups = groupByField ? (function () {
          var grouped = {};
          (records || []).forEach(function (r) {
            var k = r[groupByField] != null ? r[groupByField] : "__false__";
            if (!grouped[k]) grouped[k] = [];
            grouped[k].push(r);
          });
          return Object.keys(grouped).map(function (k) { return { key: k === "__false__" ? false : k, rows: grouped[k] }; });
        })() : null;
        function renderRow(r, isGroupHeader, isSubtotal) {
          if (isGroupHeader) {
            var gval = r;
            var label = nameMap && nameMap[groupByField] && gval != null ? (nameMap[groupByField][gval] || gval) : (gval != null ? String(gval) : "(No value)");
            tbl += '<tr role="row" class="group-header o-list-group-header"><td role="gridcell" class="o-list-td o-list-group-cell" colspan="' + (cols.length + 2) + '">' + String(label).replace(/</g, "&lt;") + "</td></tr>";
            return;
          }
          if (isSubtotal) {
            tbl += '<tr role="row" class="group-subtotal o-list-subtotal-row"><td class="o-list-td o-list-td--checkbox"></td>';
            cols.forEach(function (c) {
              var f = typeof c === "object" ? c.name : c;
              var sum = r[f];
              var isNum = numericCols.indexOf(f) >= 0;
              tbl += '<td role="gridcell" class="o-list-td">' + (isNum && sum != null ? Number(sum).toLocaleString() : "").replace(/</g, "&lt;") + "</td>";
            });
            tbl += '<td role="gridcell" class="o-list-td o-list-td--actions"></td></tr>';
            return;
          }
          tbl += '<tr role="row" tabindex="0" data-id="' + (r.id || "") + '" class="list-data-row">';
          tbl += '<td role="gridcell" class="o-list-td o-list-td--checkbox"><input type="checkbox" class="list-row-select" data-id="' + (r.id || "") + '" aria-label="Select row"></td>';
          cols.forEach(function (c) {
            var f = typeof c === "object" ? c.name : c;
            var val = r[f];
            if (nameMap && nameMap[f] && val != null) {
              if (Array.isArray(val)) val = val.map(function (id) { return nameMap[f][id] || id; }).join(", ");
              else val = nameMap[f][val] || val;
            } else if (val != null) {
              if (typeof val === "boolean") val = val ? "Yes" : "No";
              else if (isMonetaryField(model, f)) {
                var n = Number(val);
                var formatted = !isNaN(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val;
                var currField = getMonetaryCurrencyField(model, f);
                if (currField && r[currField] && nameMap && nameMap[currField]) {
                  var sym = nameMap[currField][r[currField]];
                  if (sym) formatted = (sym + " " + formatted).trim();
                }
                val = formatted;
              } else {
                var selLabel = getSelectionLabel(model, f, val);
                if (selLabel !== val) val = selLabel;
              }
            }
            tbl += '<td role="gridcell" class="o-list-td">' + (val != null ? String(val) : "").replace(/</g, "&lt;") + "</td>";
          });
          tbl += '<td role="gridcell" class="o-list-td o-list-td--actions"><a href="#' + route + '/edit/' + (r.id || "") + '" class="o-list-action-link" data-edit-id="' + (r.id || "") + '">Edit</a>';
          tbl += '<a href="#" class="btn-delete o-list-delete-link" data-id="' + (r.id || "") + '">Delete</a></td></tr>';
        }
        if (groups) {
          groups.forEach(function (grp) {
            renderRow(grp.key, true);
            grp.rows.forEach(function (r) { renderRow(r, false); });
            var subtotal = {};
            numericCols.forEach(function (f) {
              if (cols.some(function (c) { return (typeof c === "object" ? c.name : c) === f; })) {
                subtotal[f] = grp.rows.reduce(function (s, r) { return s + (Number(r[f]) || 0); }, 0);
              }
            });
            if (Object.keys(subtotal).length) renderRow(subtotal, false, true);
          });
        } else {
          records.forEach(function (r) { renderRow(r, false); });
        }
        tbl += "</tbody></table>";
        var total = totalCount != null ? totalCount : (records ? records.length : 0);
        var off = offset != null ? offset : 0;
        var lim = limit != null ? limit : 80;
        var pager = "";
        if (total > 0 && records && records.length) {
          var from = off + 1;
          var to = Math.min(off + lim, total);
          pager = '<p class="list-pager o-list-pager">';
          pager += from + "-" + to + " of " + total + " ";
          pager += '<button type="button" class="btn-pager-prev o-list-pager-btn" ' + (off <= 0 ? "disabled" : "") + ">Prev</button>";
          pager += ' <button type="button" class="btn-pager-next o-list-pager-btn" ' + (off + lim >= total ? "disabled" : "") + ">Next</button>";
          pager += "</p>";
        }
        main.innerHTML = html + tbl + pager;
        (function setupBulkActions() {
          var bar = document.getElementById("bulk-action-bar");
          var countEl = document.getElementById("bulk-selected-count");
          var selectAll = document.getElementById("list-select-all");
          var bulkDelete = document.getElementById("bulk-delete");
          var bulkClear = document.getElementById("bulk-clear");
          function getSelectedIds() {
            return Array.prototype.map.call(main.querySelectorAll(".list-row-select:checked"), function (cb) { return parseInt(cb.dataset.id, 10); }).filter(function (x) { return !isNaN(x); });
          }
          function updateBar() {
            var ids = getSelectedIds();
            if (bar) {
              bar.style.display = ids.length ? "flex" : "none";
              bar.style.flexDirection = "row";
            }
            if (countEl) countEl.textContent = ids.length ? ids.length + " selected" : "";
            if (selectAll) selectAll.checked = ids.length && main.querySelectorAll(".list-row-select").length === ids.length;
          }
          if (selectAll) {
            selectAll.onclick = function () {
              main.querySelectorAll(".list-row-select").forEach(function (cb) { cb.checked = selectAll.checked; });
              updateBar();
            };
          }
          main.querySelectorAll(".list-row-select").forEach(function (cb) { cb.onclick = updateBar; });
          if (bulkDelete) {
            bulkDelete.onclick = function () {
              var ids = getSelectedIds();
              if (!ids.length) return;
              confirmModal({ title: "Delete records", message: "Delete " + ids.length + " record(s)?", confirmLabel: "Delete", cancelLabel: "Cancel" }).then(function (ok) {
                if (!ok || !rpc || !rpc.callKw) return;
                rpc.callKw(model, "unlink", [ids], {}).then(function () {
                  showToast("Deleted", "success");
                  loadRecords(model, route, currentListState.searchTerm, stageFilter, undefined, currentListState.savedFilterId, offset, limit, resolveListHashDomain());
                }).catch(function (err) { showToast(err.message || "Delete failed", "error"); });
              });
            };
          }
          if (bulkClear) bulkClear.onclick = function () {
            main.querySelectorAll(".list-row-select").forEach(function (cb) { cb.checked = false; });
            if (selectAll) selectAll.checked = false;
            updateBar();
          };
        })();
        (function setupListKeyboardNav() {
          var table = main.querySelector('table[role="grid"]');
          if (!table) return;
          table.addEventListener("keydown", function (e) {
            var row = e.target.closest && e.target.closest("tr.list-data-row");
            if (!row) return;
            var rows = Array.prototype.slice.call(table.querySelectorAll("tr.list-data-row"));
            var idx = rows.indexOf(row);
            if (idx < 0) return;
            if (e.key === "ArrowDown" && idx < rows.length - 1) {
              e.preventDefault();
              rows[idx + 1].focus();
            } else if (e.key === "ArrowUp" && idx > 0) {
              e.preventDefault();
              rows[idx - 1].focus();
            } else if (e.key === "Enter") {
              var id = row.getAttribute("data-id");
              if (id) {
                e.preventDefault();
                dispatchListActWindowThenFormHash(route, "edit/" + id, "listKeyboardEnterForm");
              }
            }
          });
        })();
        (function setupListTableEditLinkClicks() {
          var table = main.querySelector('table[role="grid"]');
          if (!table) return;
          table.addEventListener("click", function (e) {
            var a = e.target.closest && e.target.closest("a.o-list-action-link");
            if (!a || !a.getAttribute("data-edit-id")) return;
            var id = a.getAttribute("data-edit-id");
            if (!id) return;
            e.preventDefault();
            dispatchListActWindowThenFormHash(route, "edit/" + id, "listTableEditLink");
          });
        })();
      }

      var monetaryCurrCols = cols.filter(function (c) {
        var f = typeof c === "object" ? c.name : c;
        return isMonetaryField(model, f) && getMonetaryCurrencyField(model, f);
      }).map(function (c) { return getMonetaryCurrencyField(model, typeof c === "object" ? c.name : c); }).filter(Boolean);
      var currCols = monetaryCurrCols.filter(function (f, i, a) { return a.indexOf(f) === i; });
      var allCols = m2oCols.length || m2mCols.length || currCols.length;
      if (allCols) {
        var promises = m2oCols.map(function (c) {
          var f = typeof c === "object" ? c.name : c;
          return getDisplayNames(model, f, records).then(function (m) { return { f: f, m: m }; });
        }).concat(m2mCols.map(function (c) {
          var f = typeof c === "object" ? c.name : c;
          return getDisplayNamesForMany2many(model, f, records).then(function (m) { return { f: f, m: m }; });
        })).concat(currCols.map(function (f) {
          return getDisplayNames(model, f, records).then(function (m) { return { f: f, m: m }; });
        }));
        Promise.all(promises).then(function (maps) {
          var nameMap = {};
          maps.forEach(function (x) { nameMap[x.f] = x.m; });
          renderTable(nameMap);
        }).catch(function () { renderTable({}); });
      } else {
        renderTable(null);
      }
    }

    var btn = document.getElementById("btn-add");
    if (btn) btn.onclick = function () { dispatchListActWindowThenFormHash(route, "new", "listToolbarNew"); };
    var btnExportExcel = document.getElementById("btn-export-excel");
    if (btnExportExcel && records && records.length) {
      btnExportExcel.onclick = function () {
        var exportCols = getListColumns(model);
        var fields = ["id"].concat(exportCols.map(function (c) { return typeof c === "object" ? c.name : c; }));
        var domain = [];
        var action = getActionForRoute(route);
        if (action && action.domain) {
          var parsed = parseActionDomain(action.domain);
          if (parsed && parsed.length) domain = parsed;
        }
        var searchDom = buildSearchDomain(model, (document.getElementById("list-search") && document.getElementById("list-search").value) || "");
        if (searchDom && searchDom.length) domain = domain.concat(searchDom);
        var stageEl = document.getElementById("list-stage-filter");
        if ((model === "crm.lead" || model === "helpdesk.ticket") && stageEl && stageEl.value) {
          domain = domain.concat([["stage_id", "=", parseInt(stageEl.value, 10)]]);
        }
        (currentListState.activeSearchFilters || []).forEach(function (fname) {
          var currentSearchView = viewsSvc && viewsSvc.getView ? viewsSvc.getView(model, "search") : null;
          var filters = (currentSearchView && currentSearchView.filters) || [];
          var filterDef = filters.find(function (x) { return x.name === fname && x.domain; });
          if (filterDef && filterDef.domain) {
            var fd = parseFilterDomain(filterDef.domain);
            if (fd.length) domain = domain.concat(fd);
          }
        });
        fetch("/web/export/xlsx", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: model, fields: fields, domain: domain }),
        }).then(function (r) {
          if (!r.ok) return r.json().then(function (d) { throw new Error(d.error || "Export failed"); });
          return r.blob();
        }).then(function (blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = (route || "export") + ".xlsx";
          a.click();
          URL.revokeObjectURL(url);
        }).catch(function (err) { showToast(err.message || "Failed to export", "error"); });
      };
    }
    var btnExport = document.getElementById("btn-export");
    if (btnExport && records && records.length) {
      btnExport.onclick = function () {
        var tbl = main.querySelector("table");
        if (!tbl) return;
        var rows = tbl.querySelectorAll("tr");
        var lines = [];
        rows.forEach(function (tr) {
          var cells = tr.querySelectorAll("td, th");
          var vals = [];
          cells.forEach(function (cell) {
            var txt = (cell.textContent || "").trim().replace(/"/g, '""');
            vals.push(txt.indexOf(",") >= 0 || txt.indexOf('"') >= 0 || txt.indexOf("\n") >= 0 ? '"' + txt + '"' : txt);
          });
          if (vals.length) lines.push(vals.join(","));
        });
        var csv = lines.join("\n");
        var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = (route || "export") + ".csv";
        a.click();
        URL.revokeObjectURL(url);
      };
    }
    var btnImport = document.getElementById("btn-import");
    if (btnImport) btnImport.onclick = function () { showImportModal(model, route); };
    var btnPrint = document.getElementById("btn-print");
    if (btnPrint && reportName && records && records.length) {
      btnPrint.onclick = function () {
        var ids = records.map(function (r) { return r.id; }).filter(function (x) { return x; });
        if (!ids.length) return;
        var pdfUrl = "/report/pdf/" + reportName + "/" + ids.join(",");
        if (window.UIComponents && window.UIComponents.PdfViewer && typeof window.UIComponents.PdfViewer.open === "function") {
          window.UIComponents.PdfViewer.open(pdfUrl, "List print preview");
        } else {
          window.open("/report/html/" + reportName + "/" + ids.join(","), "_blank", "noopener");
        }
      };
    }
    var btnSearch = document.getElementById("btn-search");
    var searchInput = document.getElementById("list-search");
    if (btnSearch && searchInput) {
      var doSearch = function () {
        var sf = document.getElementById("list-saved-filter");
        var stageEl = document.getElementById("list-stage-filter");
        var nextStage = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
        loadRecords(model, route, searchInput.value.trim(), nextStage, null, sf && sf.value ? sf.value : null, 0, null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); doSearch(); } };
    }
    var btnAiSearch = document.getElementById("btn-ai-search");
    if (btnAiSearch && searchInput) {
      btnAiSearch.onclick = function () {
        var query = searchInput.value.trim();
        if (!query) {
          var sf = document.getElementById("list-saved-filter");
          var stageEl = document.getElementById("list-stage-filter");
          var nextStage = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
          loadRecords(model, route, "", nextStage, null, sf && sf.value ? sf.value : null, 0, null);
          return;
        }
        btnAiSearch.disabled = true;
        btnAiSearch.textContent = "...";
        fetch("/ai/nl_search", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: model, query: query, limit: 80 }),
        }).then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.error) { showToast(data.error || "AI search failed", "error"); return; }
            var action = getActionForRoute(route);
            var actionDomain = action ? parseActionDomain(action.domain || "") : [];
            var nlDomain = data.domain && data.domain.length ? data.domain : [];
            var domainOverride = actionDomain.concat(nlDomain);
            var sf = document.getElementById("list-saved-filter");
            var stageEl = document.getElementById("list-stage-filter");
            var nextStage = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
            loadRecords(model, route, query, nextStage, null, sf && sf.value ? sf.value : null, 0, null, domainOverride.length ? domainOverride : undefined);
          })
          .catch(function (err) { showToast(err.message || "AI search failed", "error"); })
          .finally(function () { btnAiSearch.disabled = false; btnAiSearch.textContent = "AI Search"; });
      };
    }
    main.querySelectorAll(".btn-delete").forEach(function (a) {
      a.onclick = function (e) {
        e.preventDefault();
        confirmModal({ title: "Delete record", message: "Delete this record?", confirmLabel: "Delete", cancelLabel: "Cancel" }).then(function (ok) {
          if (ok) deleteRecord(model, route, a.dataset.id);
        });
      };
    });
    main.querySelectorAll(".btn-view").forEach(function (btnEl) {
      btnEl.onclick = function () { var v = btnEl.dataset.view; if (v) setViewAndReload(route, v); };
    });
    main.querySelectorAll(".btn-search-filter").forEach(function (btnEl) {
      btnEl.onclick = function () {
        var fname = btnEl.dataset.filter;
        if (!fname) return;
        var cur = currentListState.activeSearchFilters || [];
        var idx = cur.indexOf(fname);
        var next = idx >= 0 ? cur.filter(function (_, i) { return i !== idx; }) : cur.concat(fname);
        currentListState.activeSearchFilters = next;
        var si = document.getElementById("list-search");
        loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, 0, null);
      };
    });
    var groupByEl = document.getElementById("list-group-by");
    if (groupByEl) {
      groupByEl.onchange = function () {
        currentListState.groupBy = groupByEl.value || null;
        var si = document.getElementById("list-search");
        loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, 0, null);
      };
    }
    main.querySelectorAll(".facet-chip .facet-remove").forEach(function (btnEl) {
      btnEl.onclick = function (e) {
        e.preventDefault();
        var chip = btnEl.closest(".facet-chip");
        if (!chip) return;
        var typ = chip.dataset.type;
        var name = chip.dataset.name;
        if (typ === "filter") currentListState.activeSearchFilters = (currentListState.activeSearchFilters || []).filter(function (f) { return f !== name; });
        else if (typ === "groupby") currentListState.groupBy = null;
        var si = document.getElementById("list-search");
        loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, 0, null);
      };
    });
    main.querySelectorAll(".sortable-col").forEach(function (th) {
      th.onclick = function () {
        var f = th.dataset.field;
        if (!f) return;
        var cur = currentListState.route === route && currentListState.order || "";
        var nextDir = cur.startsWith(f + " ") && cur.indexOf("desc") < 0 ? "desc" : "asc";
        loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, 0, f + " " + nextDir);
      };
    });
    main.querySelectorAll(".btn-pager-prev").forEach(function (btnEl) {
      btnEl.onclick = function () {
        if (btnEl.disabled) return;
        var off = (currentListState.offset || 0) - (currentListState.limit || 80);
        loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, Math.max(0, off), null);
      };
    });
    main.querySelectorAll(".btn-pager-next").forEach(function (btnEl) {
      btnEl.onclick = function () {
        if (btnEl.disabled) return;
        var off = (currentListState.offset || 0) + (currentListState.limit || 80);
        loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, off, null);
      };
    });
    if (model === "crm.lead") {
      var filterEl = document.getElementById("list-stage-filter");
      if (filterEl && rpc && rpc.callKw) {
        rpc.callKw("crm.stage", "search_read", [[]], { fields: ["id", "name"], order: "sequence" }).then(function (stages) {
          stages.forEach(function (s) {
            var opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.name || "";
            if (s.id === stageFilter) opt.selected = true;
            filterEl.appendChild(opt);
          });
          filterEl.onchange = function () {
            var val = filterEl.value ? parseInt(filterEl.value, 10) : null;
            loadRecords(model, route, document.getElementById("list-search").value.trim(), val, null, null, 0, null);
          };
        });
      }
    }
    var savedFilterEl = document.getElementById("list-saved-filter");
    if (savedFilterEl) {
      savedFilterEl.onchange = function () {
        var fid = savedFilterEl.value || null;
        var si = document.getElementById("list-search");
        loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, fid, 0, null);
      };
    }
    var btnSaveFilter = document.getElementById("btn-save-filter");
    if (btnSaveFilter) {
      btnSaveFilter.onclick = function () {
        var name = prompt("Filter name:");
        if (!name || !name.trim()) return;
        var si = document.getElementById("list-search");
        var st = si ? si.value.trim() : "";
        var action = getActionForRoute(route);
        var actionDomain = action ? parseActionDomain(action.domain || "") : [];
        var domain = actionDomain.slice();
        var searchDom = buildSearchDomain(model, st);
        if (searchDom.length) domain = domain.concat(searchDom);
        if (model === "crm.lead" && stageFilter) domain = domain.concat([["stage_id", "=", stageFilter]]);
        saveSavedFilter(model, name.trim(), domain).then(function () {
          loadRecords(model, route, st, stageFilter, null, null, 0, null);
        });
      };
    }
    return true;
  }

  // ── List view helper functions (Phase 1.250.17) ─────────────────────────
  // These are the canonical implementations; main.js delegates to them via
  // window.AppCore.ListViewModule.helpers after install().

  var _viewsSvc = null;
  var _rpc = null;

  function _configureHelpers(opts) {
    if (opts.viewsSvc) _viewsSvc = opts.viewsSvc;
    if (opts.rpc) _rpc = opts.rpc;
  }

  function getListColumns(model) {
    if (_viewsSvc && model) {
      var v = _viewsSvc.getView(model, "list");
      if (v && v.columns && v.columns.length) {
        return v.columns.map(function (c) { return (typeof c === "object" ? c.name : c) || c; });
      }
    }
    if (model === "crm.lead") return ["name", "type", "stage_id", "ai_score_label", "date_deadline", "expected_revenue", "tag_ids"];
    if (model === "sale.order") return ["name", "partner_id", "date_order", "state", "amount_total"];
    if (model === "product.product") return ["name", "list_price"];
    if (model === "res.users") return ["name", "login", "active"];
    return ["name", "is_company", "email", "phone", "city", "country_id", "state_id"];
  }

  function getSearchFields(model) {
    if (_viewsSvc && model) {
      var v = _viewsSvc.getView(model, "search");
      if (v && v.search_fields && v.search_fields.length) return v.search_fields;
    }
    return ["name"];
  }

  function buildSearchDomain(model, searchTerm) {
    var fields = getSearchFields(model);
    if (!searchTerm || !fields.length) return [];
    if (fields.length === 1) return [[fields[0], "ilike", searchTerm]];
    var terms = fields.map(function (f) { return [f, "ilike", searchTerm]; });
    var ops = [];
    for (var i = 0; i < terms.length - 1; i++) ops.push("|");
    return ops.concat(terms);
  }

  function getSavedFiltersFromStorage(model) {
    try {
      var raw = localStorage.getItem("erp_saved_filters_" + (model || "").replace(/\./g, "_"));
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function getSavedFilters(model) {
    var sessionSvc = window.Services && window.Services.session;
    if (!sessionSvc || !_rpc) return Promise.resolve(getSavedFiltersFromStorage(model));
    return sessionSvc.getSessionInfo().then(function (info) {
      if (!info || !info.uid) return getSavedFiltersFromStorage(model);
      var domain = [["model_id", "=", model || ""], "|", ["user_id", "=", false], ["user_id", "=", info.uid]];
      return _rpc.callKw("ir.filters", "search_read", [domain], { fields: ["id", "name", "domain"], limit: 100 })
        .then(function (rows) {
          return (rows || []).map(function (r) {
            var dom = [];
            try { dom = r.domain ? JSON.parse(r.domain) : []; } catch (e) {}
            return { id: r.id, name: r.name || "Filter", domain: dom };
          });
        })
        .catch(function () { return getSavedFiltersFromStorage(model); });
    }).catch(function () { return getSavedFiltersFromStorage(model); });
  }

  function saveSavedFilter(model, name, domain) {
    var sessionSvc = window.Services && window.Services.session;
    var key = "erp_saved_filters_" + (model || "").replace(/\./g, "_");
    if (!sessionSvc || !_rpc) {
      var filters = getSavedFiltersFromStorage(model);
      var id = "f" + Date.now();
      filters.push({ id: id, name: name || "Filter", domain: domain || [] });
      try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
      return Promise.resolve(id);
    }
    return sessionSvc.getSessionInfo().then(function (info) {
      if (!info || !info.uid) {
        var filters2 = getSavedFiltersFromStorage(model);
        var id2 = "f" + Date.now();
        filters2.push({ id: id2, name: name || "Filter", domain: domain || [] });
        try { localStorage.setItem(key, JSON.stringify(filters2)); } catch (e) {}
        return id2;
      }
      return _rpc.callKw("ir.filters", "create", [{ name: name || "Filter", model_id: model || "", domain: JSON.stringify(domain || []), user_id: info.uid }], {})
        .then(function (rec) {
          if (!rec) return null;
          if (Array.isArray(rec) && rec.length) return rec[0];
          return rec.ids ? rec.ids[0] : (rec.id != null ? rec.id : null);
        }).catch(function () {
          var filters3 = getSavedFiltersFromStorage(model);
          var id3 = "f" + Date.now();
          filters3.push({ id: id3, name: name || "Filter", domain: domain || [] });
          try { localStorage.setItem(key, JSON.stringify(filters3)); } catch (e) {}
          return id3;
        });
    });
  }

  function removeSavedFilter(model, id) {
    var key = "erp_saved_filters_" + (model || "").replace(/\./g, "_");
    if (typeof id === "string" && id.indexOf("f") === 0) {
      var filters = getSavedFiltersFromStorage(model).filter(function (f) { return f.id !== id; });
      try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
      return Promise.resolve();
    }
    if (!_rpc) return Promise.resolve();
    return _rpc.callKw("ir.filters", "unlink", [[parseInt(id, 10)]], {}).catch(function () {
      var filters = getSavedFiltersFromStorage(model).filter(function (f) { return f.id !== id; });
      try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
    });
  }

  var helpers = {
    getListColumns: getListColumns,
    getSearchFields: getSearchFields,
    buildSearchDomain: buildSearchDomain,
    getSavedFilters: getSavedFilters,
    getSavedFiltersFromStorage: getSavedFiltersFromStorage,
    saveSavedFilter: saveSavedFilter,
    removeSavedFilter: removeSavedFilter,
    configure: _configureHelpers,
  };

  window.AppCore = window.AppCore || {};
  window.AppCore.ListViewModule = {
    render: render,
    helpers: helpers,
  };
})();
