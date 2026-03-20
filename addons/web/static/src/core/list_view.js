(function () {
  window.AppCore = window.AppCore || {};
  var UI = window.UIComponents || {};

  function escHtml(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderViewSwitcher(route, currentView, helpers) {
    var h = helpers || {};
    var modes = (h.getAvailableViewModes ? h.getAvailableViewModes(route) : []).filter(function (m) {
      return m === "list" || m === "kanban" || m === "graph" || m === "calendar" || m === "activity" || m === "pivot" || m === "gantt";
    });
    if (!modes.length || modes.length < 2) return "";
    if (UI.ViewSwitcher && typeof UI.ViewSwitcher.renderHTML === "function") {
      return UI.ViewSwitcher.renderHTML({ route: route, modes: modes, currentView: currentView });
    }
    return "";
  }

  function render(container, options) {
    var opts = options || {};
    var model = opts.model;
    var route = opts.route;
    var records = opts.records || [];
    var searchTerm = opts.searchTerm || "";
    var totalCount = opts.totalCount;
    var offset = opts.offset || 0;
    var limit = opts.limit || 80;
    var savedFiltersList = opts.savedFiltersList || [];
    var rpc = opts.rpc;
    var viewsSvc = opts.viewsSvc;
    var currentListState = opts.currentListState || {};
    var showToast = opts.showToast || function () {};
    var h = opts.helpers || {};

    if (typeof window !== "undefined") {
      window.chatContext = { model: model, active_id: null };
    }

    var cols = h.getListColumns ? h.getListColumns(model) : [];
    var title = h.getTitle ? h.getTitle(route) : route;
    var addLabel = route === "contacts" ? "Add contact" : route === "leads" ? "Add lead" : route === "orders" ? "Add order" : route === "products" ? "Add product" : route === "settings/users" ? "Add user" : "Add";
    var stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    var currentView = (currentListState.route === route && currentListState.viewType) || "list";
    var order = (currentListState.route === route && currentListState.order) || null;

    var searchView = viewsSvc && viewsSvc.getView ? viewsSvc.getView(model, "search") : null;
    var searchFilters = (searchView && searchView.filters) || [];
    var searchGroupBys = (searchView && searchView.group_bys) || [];
    var activeFilters = currentListState.activeSearchFilters || [];
    var currentGroupBy = currentListState.groupBy || null;

    var filtersHtml = "";
    searchFilters.forEach(function (f) {
      var active = activeFilters.indexOf(f.name) >= 0;
      filtersHtml += '<button type="button" class="btn-search-filter o-btn ' + (active ? "o-btn-primary active" : "o-btn-secondary") + '" data-filter="' + String(f.name || "").replace(/"/g, "&quot;") + '">' + escHtml(f.string || f.name || "") + "</button>";
    });
    if (searchGroupBys.length) {
      filtersHtml += '<select id="list-group-by" class="o-list-select"><option value="">Group by</option>';
      searchGroupBys.forEach(function (g) {
        filtersHtml += '<option value="' + String(g.group_by || "").replace(/"/g, "&quot;") + '"' + (currentGroupBy === g.group_by ? " selected" : "") + ">" + escHtml(g.string || g.name || "") + "</option>";
      });
      filtersHtml += "</select>";
    }
    filtersHtml += '<select id="list-saved-filter" class="o-list-select"><option value="">Saved filters</option>';
    savedFiltersList.forEach(function (f) {
      filtersHtml += '<option value="' + String(f.id != null ? f.id : "").replace(/"/g, "&quot;") + '"' + (currentListState.savedFilterId == f.id ? " selected" : "") + ">" + escHtml(f.name || "Filter") + "</option>";
    });
    filtersHtml += "</select>";
    if (model === "crm.lead") {
      filtersHtml += '<select id="list-stage-filter" class="o-list-select"><option value="">All stages</option></select>';
    }

    var reportName = h.getReportName ? h.getReportName(model) : null;
    var actionsHtml = "";
    actionsHtml += '<button type="button" id="btn-save-filter" class="o-btn o-btn-secondary">Save</button>';
    actionsHtml += '<button type="button" id="btn-export" class="o-btn o-btn-secondary">Export CSV</button>';
    actionsHtml += '<button type="button" id="btn-export-excel" class="o-btn o-btn-secondary">Export Excel</button>';
    actionsHtml += '<button type="button" id="btn-import" class="o-btn o-btn-secondary">Import</button>';
    if (reportName) actionsHtml += '<button type="button" id="btn-print" class="o-btn o-btn-secondary">Print</button>';
    actionsHtml += '<button type="button" id="btn-add" class="o-btn o-btn-primary">' + escHtml(addLabel) + "</button>";

    var html = '<div class="o-list-shell"><h2>' + escHtml(title) + "</h2>";
    html += (UI.ControlPanel && UI.ControlPanel.renderHTML ? UI.ControlPanel.renderHTML({
      viewSwitcherHtml: renderViewSwitcher(route, currentView, h),
      searchTerm: searchTerm,
      filtersHtml: filtersHtml,
      actionsHtml: actionsHtml,
    }) : "");

    var hasFacets = activeFilters.length > 0 || currentGroupBy;
    if (hasFacets) {
      html += '<p class="o-filter-chips">';
      activeFilters.forEach(function (fname) {
        var f = searchFilters.find(function (x) { return x.name === fname; });
        html += '<span class="o-filter-chip facet-chip" data-type="filter" data-name="' + String(fname || "").replace(/"/g, "&quot;") + '">' + escHtml(f ? (f.string || fname) : fname) + ' <button type="button" class="o-filter-chip-remove facet-remove" aria-label="Remove">&times;</button></span>';
      });
      if (currentGroupBy) {
        var g = searchGroupBys.find(function (x) { return x.group_by === currentGroupBy; });
        html += '<span class="o-filter-chip facet-chip" data-type="groupby" data-name="' + String(currentGroupBy || "").replace(/"/g, "&quot;") + '">Group: ' + escHtml(g ? (g.string || currentGroupBy) : currentGroupBy) + ' <button type="button" class="o-filter-chip-remove facet-remove" aria-label="Remove">&times;</button></span>';
      }
      html += "</p>";
    }

    function attachCommonHandlers() {
      var btn = container.querySelector("#btn-add");
      if (btn) btn.onclick = function () { window.location.hash = route + "/new"; };

      var btnImport = container.querySelector("#btn-import");
      if (btnImport && h.showImportModal) btnImport.onclick = function () { h.showImportModal(model, route); };

      var btnSearch = container.querySelector("#btn-search");
      var searchInput = container.querySelector("#list-search");
      if (btnSearch && searchInput) {
        var doSearch = function () {
          var sf = container.querySelector("#list-saved-filter");
          var stageEl = container.querySelector("#list-stage-filter");
          var stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
          h.loadRecords(model, route, searchInput.value.trim(), stageVal, null, sf && sf.value ? sf.value : null, 0, null);
        };
        btnSearch.onclick = doSearch;
        searchInput.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); doSearch(); } };
      }

      var btnAiSearch = container.querySelector("#btn-ai-search");
      if (btnAiSearch && searchInput) {
        btnAiSearch.onclick = function () {
          var query = searchInput.value.trim();
          if (!query) {
            var sf = container.querySelector("#list-saved-filter");
            var stageEl = container.querySelector("#list-stage-filter");
            var stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
            h.loadRecords(model, route, "", stageVal, null, sf && sf.value ? sf.value : null, 0, null);
            return;
          }
          btnAiSearch.disabled = true;
          btnAiSearch.textContent = "...";
          fetch("/ai/nl_search", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: model, query: query, limit: 80 }),
          })
            .then(function (r) { return r.json(); })
            .then(function (data) {
              if (data.error) { showToast(data.error || "AI search failed", "error"); return; }
              var action = h.getActionForRoute ? h.getActionForRoute(route) : null;
              var actionDomain = h.parseActionDomain ? h.parseActionDomain(action && action.domain ? action.domain : "") : [];
              var nlDomain = data.domain && data.domain.length ? data.domain : [];
              var domainOverride = actionDomain.concat(nlDomain);
              var sf = container.querySelector("#list-saved-filter");
              var stageEl = container.querySelector("#list-stage-filter");
              var stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
              h.loadRecords(model, route, query, stageVal, null, sf && sf.value ? sf.value : null, 0, null, domainOverride.length ? domainOverride : undefined);
            })
            .catch(function (err) { showToast(err.message || "AI search failed", "error"); })
            .finally(function () { btnAiSearch.disabled = false; btnAiSearch.textContent = "AI Search"; });
        };
      }

      container.querySelectorAll(".btn-view").forEach(function (btnView) {
        btnView.onclick = function () {
          var v = btnView.dataset.view;
          if (v) h.setViewAndReload(route, v);
        };
      });
      container.querySelectorAll(".btn-search-filter").forEach(function (btnFilter) {
        btnFilter.onclick = function () {
          var fname = btnFilter.dataset.filter;
          if (!fname) return;
          var cur = currentListState.activeSearchFilters || [];
          var idx = cur.indexOf(fname);
          var next = idx >= 0 ? cur.filter(function (_, i) { return i !== idx; }) : cur.concat(fname);
          currentListState.activeSearchFilters = next;
          var si = container.querySelector("#list-search");
          h.loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, 0, null);
        };
      });
      var groupByEl = container.querySelector("#list-group-by");
      if (groupByEl) {
        groupByEl.onchange = function () {
          currentListState.groupBy = groupByEl.value || null;
          var si = container.querySelector("#list-search");
          h.loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, 0, null);
        };
      }
      container.querySelectorAll(".facet-chip .facet-remove").forEach(function (btnRm) {
        btnRm.onclick = function (e) {
          e.preventDefault();
          var chip = btnRm.closest(".facet-chip");
          if (!chip) return;
          var typ = chip.dataset.type;
          var name = chip.dataset.name;
          if (typ === "filter") currentListState.activeSearchFilters = (currentListState.activeSearchFilters || []).filter(function (f) { return f !== name; });
          else if (typ === "groupby") currentListState.groupBy = null;
          var si = container.querySelector("#list-search");
          h.loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, 0, null);
        };
      });
    }

    if (!records || !records.length) {
      container.innerHTML = html + '<p class="o-list-empty">No records yet.</p></div>';
      attachCommonHandlers();
      return;
    }

    var m2oCols = cols.filter(function (c) {
      var f = typeof c === "object" ? c.name : c;
      return h.getMany2oneComodel(model, f);
    });
    var m2mCols = cols.filter(function (c) {
      var f = typeof c === "object" ? c.name : c;
      return h.getMany2manyInfo(model, f);
    });
    var numericCols = ["expected_revenue", "revenue", "amount", "quantity"];

    function renderTable(nameMap) {
      var tbl = "";
      tbl += (UI.BulkActionBar && UI.BulkActionBar.renderHTML ? UI.BulkActionBar.renderHTML() : "");
      tbl += '<div class="o-list-table-wrapper"><table role="grid" aria-label="Records" class="o-list-table"><thead><tr role="row">';
      tbl += '<th role="columnheader"><input type="checkbox" id="list-select-all" aria-label="Select all" title="Select all"></th>';
      cols.forEach(function (c) {
        var f = typeof c === "object" ? c.name : c;
        var label = typeof c === "object" ? c.name || c : c;
        var isSorted = order && (order.indexOf(f + " ") === 0 || order.indexOf(f + ",") === 0);
        var dir = isSorted && order.indexOf("desc") >= 0 ? "desc" : "asc";
        var arrow = isSorted ? (dir === "asc" ? " ▲" : " ▼") : "";
        tbl += '<th role="columnheader" class="sortable-col o-list-th-sortable" data-field="' + String(f || "").replace(/"/g, "&quot;") + '">' + escHtml(label || "") + arrow + "</th>";
      });
      tbl += '<th role="columnheader"></th></tr></thead><tbody>';

      var groupByField = currentListState.groupBy;
      var groups = groupByField ? (function () {
        var g = {};
        (records || []).forEach(function (r) {
          var k = r[groupByField] != null ? r[groupByField] : "__false__";
          if (!g[k]) g[k] = [];
          g[k].push(r);
        });
        return Object.keys(g).map(function (k) { return { key: k === "__false__" ? false : k, rows: g[k] }; });
      })() : null;

      function renderRow(r, isGroupHeader, isSubtotal) {
        if (isGroupHeader) {
          var gval = r;
          var label = (nameMap && nameMap[groupByField] && gval != null) ? (nameMap[groupByField][gval] || gval) : (gval != null ? String(gval) : "(No value)");
          tbl += '<tr role="row" class="o-list-group-header"><td role="gridcell" colspan="' + (cols.length + 1) + '">' + escHtml(label) + "</td></tr>";
          return;
        }
        if (isSubtotal) {
          tbl += '<tr role="row" class="o-list-group-subtotal"><td colspan="1"></td>';
          cols.forEach(function (c) {
            var f = typeof c === "object" ? c.name : c;
            var sum = r[f];
            var isNum = numericCols.indexOf(f) >= 0;
            tbl += '<td role="gridcell">' + escHtml(isNum && sum != null ? Number(sum).toLocaleString() : "") + "</td>";
          });
          tbl += "<td></td></tr>";
          return;
        }
        tbl += '<tr role="row" tabindex="0" data-id="' + (r.id || "") + '" class="o-list-data-row">';
        tbl += '<td role="gridcell"><input type="checkbox" class="list-row-select" data-id="' + (r.id || "") + '" aria-label="Select row"></td>';
        cols.forEach(function (c) {
          var f = typeof c === "object" ? c.name : c;
          var val = r[f];
          if (nameMap && nameMap[f] && val != null) {
            if (Array.isArray(val)) val = val.map(function (id) { return nameMap[f][id] || id; }).join(", ");
            else val = nameMap[f][val] || val;
          } else if (val != null) {
            if (typeof val === "boolean") val = val ? "Yes" : "No";
            else if (h.isMonetaryField(model, f)) {
              var n = Number(val);
              var formatted = !isNaN(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val;
              var currField = h.getMonetaryCurrencyField(model, f);
              if (currField && r[currField] && nameMap && nameMap[currField]) {
                var sym = nameMap[currField][r[currField]];
                if (sym) formatted = (sym + " " + formatted).trim();
              }
              val = formatted;
            } else {
              var selLabel = h.getSelectionLabel(model, f, val);
              if (selLabel !== val) val = selLabel;
            }
          }
          tbl += "<td role=\"gridcell\">" + escHtml(val != null ? String(val) : "") + "</td>";
        });
        tbl += '<td role="gridcell"><a href="#' + route + "/edit/" + (r.id || "") + '" class="o-list-edit-link">Edit</a>';
        tbl += '<a href="#" class="btn-delete o-list-delete-link" data-id="' + (r.id || "") + '">Delete</a></td></tr>';
      }

      if (groups) {
        groups.forEach(function (grp) {
          renderRow(grp.key, true);
          grp.rows.forEach(function (r) { renderRow(r, false); });
          var subtotal = {};
          numericCols.forEach(function (f) {
            if (cols.some(function (c) { return (typeof c === "object" ? c.name : c) === f; })) subtotal[f] = grp.rows.reduce(function (s, rr) { return s + (Number(rr[f]) || 0); }, 0);
          });
          if (Object.keys(subtotal).length) renderRow(subtotal, false, true);
        });
      } else {
        records.forEach(function (r) { renderRow(r, false); });
      }
      tbl += "</tbody></table></div>";

      var total = totalCount != null ? totalCount : (records ? records.length : 0);
      var pager = UI.Pager && UI.Pager.renderHTML ? UI.Pager.renderHTML({ total: total, offset: offset, limit: limit }) : "";
      container.innerHTML = html + tbl + pager + "</div>";

      (function setupBulkActions() {
        var bar = container.querySelector("#bulk-action-bar");
        var countEl = container.querySelector("#bulk-selected-count");
        var selectAll = container.querySelector("#list-select-all");
        var bulkDelete = container.querySelector("#bulk-delete");
        var bulkClear = container.querySelector("#bulk-clear");
        function getSelectedIds() {
          return Array.prototype.map.call(container.querySelectorAll(".list-row-select:checked"), function (cb) { return parseInt(cb.dataset.id, 10); }).filter(function (x) { return !isNaN(x); });
        }
        function updateBar() {
          var ids = getSelectedIds();
          if (bar) bar.style.display = ids.length ? "flex" : "none";
          if (countEl) countEl.textContent = ids.length ? ids.length + " selected" : "";
          if (selectAll) selectAll.checked = !!ids.length && container.querySelectorAll(".list-row-select").length === ids.length;
        }
        if (selectAll) {
          selectAll.onclick = function () {
            container.querySelectorAll(".list-row-select").forEach(function (cb) { cb.checked = selectAll.checked; });
            updateBar();
          };
        }
        container.querySelectorAll(".list-row-select").forEach(function (cb) { cb.onclick = updateBar; });
        if (bulkDelete) {
          bulkDelete.onclick = function () {
            var ids = getSelectedIds();
            if (!ids.length) return;
            if (!confirm("Delete " + ids.length + " record(s)?")) return;
            rpc.callKw(model, "unlink", [ids], {})
              .then(function () {
                showToast("Deleted", "success");
                h.loadRecords(model, route, currentListState.searchTerm, stageFilter, undefined, currentListState.savedFilterId, offset, limit, h.getHashDomainParam ? h.getHashDomainParam() : undefined);
              })
              .catch(function (err) { showToast(err.message || "Delete failed", "error"); });
          };
        }
        if (bulkClear) bulkClear.onclick = function () { container.querySelectorAll(".list-row-select").forEach(function (cb) { cb.checked = false; }); if (selectAll) selectAll.checked = false; updateBar(); };
      })();

      (function setupListKeyboardNav() {
        var table = container.querySelector("table[role='grid']");
        if (!table) return;
        table.addEventListener("keydown", function (e) {
          var row = e.target.closest && e.target.closest("tr.o-list-data-row");
          if (!row) return;
          var rows = Array.prototype.slice.call(table.querySelectorAll("tr.o-list-data-row"));
          var idx = rows.indexOf(row);
          if (idx < 0) return;
          if (e.key === "ArrowDown" && idx < rows.length - 1) { e.preventDefault(); rows[idx + 1].focus(); }
          else if (e.key === "ArrowUp" && idx > 0) { e.preventDefault(); rows[idx - 1].focus(); }
          else if (e.key === "Enter") { var id = row.getAttribute("data-id"); if (id) { e.preventDefault(); window.location.hash = route + "/edit/" + id; } }
        });
      })();

      var btnExportExcel = container.querySelector("#btn-export-excel");
      if (btnExportExcel && records && records.length) {
        btnExportExcel.onclick = function () {
          var fields = ["id"].concat(cols.map(function (c) { return typeof c === "object" ? c.name : c; }));
          var domain = [];
          var action = h.getActionForRoute ? h.getActionForRoute(route) : null;
          if (action && action.domain) {
            var parsed = h.parseActionDomain ? h.parseActionDomain(action.domain) : [];
            if (parsed && parsed.length) domain = parsed;
          }
          var searchDom = h.buildSearchDomain ? h.buildSearchDomain(model, (container.querySelector("#list-search") && container.querySelector("#list-search").value) || "") : [];
          if (searchDom && searchDom.length) domain = domain.concat(searchDom);
          var stageEl = container.querySelector("#list-stage-filter");
          if ((model === "crm.lead" || model === "helpdesk.ticket") && stageEl && stageEl.value) domain = domain.concat([["stage_id", "=", parseInt(stageEl.value, 10)]]);
          (currentListState.activeSearchFilters || []).forEach(function (fname) {
            var searchViewInner = viewsSvc && viewsSvc.getView ? viewsSvc.getView(model, "search") : null;
            var filters = (searchViewInner && searchViewInner.filters) || [];
            var f = filters.find(function (x) { return x.name === fname && x.domain; });
            if (f && f.domain) {
              var fd = h.parseFilterDomain ? h.parseFilterDomain(f.domain) : [];
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

      var btnExport = container.querySelector("#btn-export");
      if (btnExport && records && records.length) {
        btnExport.onclick = function () {
          var table = container.querySelector("table");
          if (!table) return;
          var rows = table.querySelectorAll("tr");
          var lines = [];
          rows.forEach(function (tr) {
            var cells = tr.querySelectorAll("td, th");
            var vals = [];
            cells.forEach(function (cell) {
              var txt = (cell.textContent || "").trim().replace(/"/g, "\"\"");
              vals.push(txt.indexOf(",") >= 0 || txt.indexOf("\"") >= 0 || txt.indexOf("\n") >= 0 ? "\"" + txt + "\"" : txt);
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

      var btnPrint = container.querySelector("#btn-print");
      if (btnPrint && reportName && records && records.length) {
        btnPrint.onclick = function () {
          var ids = records.map(function (r) { return r.id; }).filter(function (x) { return x; });
          if (ids.length) window.open("/report/html/" + reportName + "/" + ids.join(","), "_blank", "noopener");
        };
      }

      container.querySelectorAll(".btn-delete").forEach(function (a) {
        a.onclick = function (e) { e.preventDefault(); if (confirm("Delete this record?")) h.deleteRecord(model, route, a.dataset.id); };
      });
      container.querySelectorAll(".sortable-col").forEach(function (th) {
        th.onclick = function () {
          var f = th.dataset.field;
          if (!f) return;
          var cur = (currentListState.route === route && currentListState.order) || "";
          var nextDir = (cur.indexOf(f + " ") === 0 && cur.indexOf("desc") < 0) ? "desc" : "asc";
          h.loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, 0, f + " " + nextDir);
        };
      });
      container.querySelectorAll(".o-pager-prev").forEach(function (btnPrev) {
        btnPrev.onclick = function () {
          if (btnPrev.disabled) return;
          var off = (currentListState.offset || 0) - (currentListState.limit || 80);
          h.loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, Math.max(0, off), null);
        };
      });
      container.querySelectorAll(".o-pager-next").forEach(function (btnNext) {
        btnNext.onclick = function () {
          if (btnNext.disabled) return;
          var off = (currentListState.offset || 0) + (currentListState.limit || 80);
          h.loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, off, null);
        };
      });

      if (model === "crm.lead") {
        var filterEl = container.querySelector("#list-stage-filter");
        if (filterEl) {
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
              h.loadRecords(model, route, (container.querySelector("#list-search") || { value: "" }).value.trim(), val, null, null, 0, null);
            };
          });
        }
      }

      var savedFilterEl = container.querySelector("#list-saved-filter");
      if (savedFilterEl) {
        savedFilterEl.onchange = function () {
          var fid = savedFilterEl.value || null;
          var si = container.querySelector("#list-search");
          h.loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, fid, 0, null);
        };
      }
      var btnSaveFilter = container.querySelector("#btn-save-filter");
      if (btnSaveFilter && h.saveSavedFilter) {
        btnSaveFilter.onclick = function () {
          var name = prompt("Filter name:");
          if (!name || !name.trim()) return;
          var si = container.querySelector("#list-search");
          var st = si ? si.value.trim() : "";
          var action = h.getActionForRoute ? h.getActionForRoute(route) : null;
          var actionDomain = h.parseActionDomain ? h.parseActionDomain(action && action.domain ? action.domain : "") : [];
          var domain = actionDomain.slice();
          var searchDom = h.buildSearchDomain ? h.buildSearchDomain(model, st) : [];
          if (searchDom.length) domain = domain.concat(searchDom);
          if (model === "crm.lead" && stageFilter) domain = domain.concat([["stage_id", "=", stageFilter]]);
          h.saveSavedFilter(model, name.trim(), domain).then(function () { h.loadRecords(model, route, st, stageFilter, null, null, 0, null); });
        };
      }

      attachCommonHandlers();
    }

    var monetaryCurrCols = cols.filter(function (c) {
      var f = typeof c === "object" ? c.name : c;
      return h.isMonetaryField(model, f) && h.getMonetaryCurrencyField(model, f);
    }).map(function (c) { return h.getMonetaryCurrencyField(model, typeof c === "object" ? c.name : c); }).filter(Boolean);
    var currCols = monetaryCurrCols.filter(function (f, i, a) { return a.indexOf(f) === i; });
    var allCols = m2oCols.length || m2mCols.length || currCols.length;
    if (allCols) {
      var promises = m2oCols.map(function (c) {
        var f = typeof c === "object" ? c.name : c;
        return h.getDisplayNames(model, f, records).then(function (m) { return { f: f, m: m }; });
      }).concat(m2mCols.map(function (c) {
        var f = typeof c === "object" ? c.name : c;
        return h.getDisplayNamesForMany2many(model, f, records).then(function (m) { return { f: f, m: m }; });
      })).concat(currCols.map(function (f) {
        return h.getDisplayNames(model, f, records).then(function (m) { return { f: f, m: m }; });
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

  window.AppCore.ListView = {
    render: render,
    renderViewSwitcher: function (route, currentView, helpers) {
      return renderViewSwitcher(route, currentView, helpers);
    },
  };
})();
