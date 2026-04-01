(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // addons/web/static/src/app/list_view_module.js
  var require_list_view_module = __commonJS({
    "addons/web/static/src/app/list_view_module.js"() {
      (function() {
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
          var showToast = opts.showToast || function() {
          };
          var helpers = opts.helpers || {};
          var getListColumns = helpers.getListColumns || function() {
            return [];
          };
          var getTitle = helpers.getTitle || function() {
            return route;
          };
          var getReportName = helpers.getReportName || function() {
            return null;
          };
          var loadRecords = helpers.loadRecords || function() {
          };
          var setViewAndReload = helpers.setViewAndReload || function() {
          };
          var deleteRecord = helpers.deleteRecord || function() {
          };
          var getMany2oneComodel = helpers.getMany2oneComodel || function() {
            return null;
          };
          var getMany2manyInfo = helpers.getMany2manyInfo || function() {
            return null;
          };
          var isMonetaryField = helpers.isMonetaryField || function() {
            return false;
          };
          var getMonetaryCurrencyField = helpers.getMonetaryCurrencyField || function() {
            return null;
          };
          var getSelectionLabel = helpers.getSelectionLabel || function(_model, _field, value) {
            return value;
          };
          var getDisplayNames = helpers.getDisplayNames || function() {
            return Promise.resolve({});
          };
          var getDisplayNamesForMany2many = helpers.getDisplayNamesForMany2many || function() {
            return Promise.resolve({});
          };
          var getActionForRoute = helpers.getActionForRoute || function() {
            return null;
          };
          var parseActionDomain = helpers.parseActionDomain || function() {
            return [];
          };
          var buildSearchDomain = helpers.buildSearchDomain || function() {
            return [];
          };
          var parseFilterDomain = helpers.parseFilterDomain || function() {
            return [];
          };
          var saveSavedFilter = helpers.saveSavedFilter || function() {
            return Promise.resolve();
          };
          var showImportModal = helpers.showImportModal || function() {
          };
          function resolveListHashDomain() {
            var fn = helpers.getHashDomainParam;
            if (fn && typeof fn === "function") return fn();
            if (typeof window !== "undefined" && typeof window.__ERP_getHashDomainParam === "function") {
              return window.__ERP_getHashDomainParam();
            }
            return null;
          }
          var confirmModal = helpers.confirmModal || function() {
            return Promise.resolve(false);
          };
          var applyActionStackForList = helpers.applyActionStackForList || function() {
          };
          var renderViewSwitcher = helpers.renderViewSwitcher || function() {
            return "";
          };
          var dispatchListActWindowThenFormHash = helpers.dispatchListActWindowThenFormHash || function() {
          };
          if (typeof window !== "undefined") window.chatContext = { model, active_id: null };
          var cols = getListColumns(model);
          var title = getTitle(route);
          var addLabel = route === "contacts" ? "Add contact" : route === "leads" ? "Add lead" : route === "orders" ? "Add order" : route === "products" ? "Add product" : route === "settings/users" ? "Add user" : "Add";
          var stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
          var currentView = currentListState.route === route && currentListState.viewType || "list";
          var order = currentListState.route === route && currentListState.order || null;
          applyActionStackForList(route, title);
          var html = "<h2>" + title + "</h2>";
          html += '<p class="o-list-fallback-toolbar">';
          html += renderViewSwitcher(route, currentView);
          html += '<div role="search" class="o-list-fallback-search"><input type="text" id="list-search" placeholder="Search..." aria-label="Search records" class="o-list-search-field" value="' + searchTerm.replace(/"/g, "&quot;") + '">';
          html += '<button type="button" id="btn-search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button>';
          html += '<button type="button" id="btn-ai-search" title="Natural language search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--accent">AI Search</button></div>';
          var searchView = viewsSvc && viewsSvc.getView ? viewsSvc.getView(model, "search") : null;
          var searchFilters = searchView && searchView.filters || [];
          var searchGroupBys = searchView && searchView.group_bys || [];
          var activeFilters = currentListState.activeSearchFilters || [];
          var currentGroupBy = currentListState.groupBy || null;
          searchFilters.forEach(function(f) {
            var active = activeFilters.indexOf(f.name) >= 0;
            html += '<button type="button" class="btn-search-filter' + (active ? " active" : "") + '" data-filter="' + (f.name || "").replace(/"/g, "&quot;") + '">' + (f.string || f.name || "").replace(/</g, "&lt;") + "</button>";
          });
          if (searchGroupBys.length) {
            html += '<select id="list-group-by" class="o-list-toolbar-select"><option value="">Group by</option>';
            searchGroupBys.forEach(function(g2) {
              html += '<option value="' + (g2.group_by || "").replace(/"/g, "&quot;") + '"' + (currentGroupBy === g2.group_by ? " selected" : "") + ">" + (g2.string || g2.name || "").replace(/</g, "&lt;") + "</option>";
            });
            html += "</select>";
          }
          html += '<select id="list-saved-filter" class="o-list-toolbar-select"><option value="">Saved filters</option>';
          savedFiltersList.forEach(function(f) {
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
            activeFilters.forEach(function(fname) {
              var f = searchFilters.find(function(x) {
                return x.name === fname;
              });
              html += '<span class="facet-chip o-list-facet-chip" data-type="filter" data-name="' + (fname || "").replace(/"/g, "&quot;") + '">' + (f ? f.string || fname : fname).replace(/</g, "&lt;") + ' <button type="button" class="facet-remove o-list-facet-remove" aria-label="Remove">&times;</button></span>';
            });
            if (currentGroupBy) {
              var g = searchGroupBys.find(function(x) {
                return x.group_by === currentGroupBy;
              });
              html += '<span class="facet-chip o-list-facet-chip" data-type="groupby" data-name="' + (currentGroupBy || "").replace(/"/g, "&quot;") + '">Group: ' + (g ? g.string || currentGroupBy : currentGroupBy).replace(/</g, "&lt;") + ' <button type="button" class="facet-remove o-list-facet-remove" aria-label="Remove">&times;</button></span>';
            }
            html += "</p>";
          }
          if (!records || !records.length) {
            main.innerHTML = html + "<p>No records yet.</p>";
          } else {
            let renderTable2 = function(nameMap) {
              var tbl = '<div id="bulk-action-bar" class="o-bulk-action-bar"><span id="bulk-selected-count" class="o-bulk-selected-count"></span><button type="button" id="bulk-delete" class="o-btn o-bulk-delete-btn">Delete Selected</button><button type="button" id="bulk-clear" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Clear</button></div>';
              tbl += '<table role="grid" aria-label="Records" class="o-list-fallback-table"><thead><tr role="row">';
              tbl += '<th role="columnheader" class="o-list-th o-list-th--checkbox"><input type="checkbox" id="list-select-all" aria-label="Select all" title="Select all"></th>';
              cols.forEach(function(c) {
                var f = typeof c === "object" ? c.name : c;
                var label = typeof c === "object" ? c.name || c : c;
                var isSorted = order && (order.startsWith(f + " ") || order.startsWith(f + ","));
                var dir = isSorted && order.indexOf("desc") >= 0 ? "desc" : "asc";
                var arrow = isSorted ? dir === "asc" ? " \u25B2" : " \u25BC" : "";
                tbl += '<th role="columnheader" class="sortable-col o-list-th o-list-th--sortable" data-field="' + (f || "").replace(/"/g, "&quot;") + '">' + (label || "").replace(/</g, "&lt;") + arrow + "</th>";
              });
              tbl += '<th role="columnheader" class="o-list-th o-list-th--actions"></th></tr></thead><tbody>';
              var groupByField = currentListState.groupBy;
              var groups = groupByField ? (function() {
                var grouped = {};
                (records || []).forEach(function(r) {
                  var k = r[groupByField] != null ? r[groupByField] : "__false__";
                  if (!grouped[k]) grouped[k] = [];
                  grouped[k].push(r);
                });
                return Object.keys(grouped).map(function(k) {
                  return { key: k === "__false__" ? false : k, rows: grouped[k] };
                });
              })() : null;
              function renderRow(r, isGroupHeader, isSubtotal) {
                if (isGroupHeader) {
                  var gval = r;
                  var label = nameMap && nameMap[groupByField] && gval != null ? nameMap[groupByField][gval] || gval : gval != null ? String(gval) : "(No value)";
                  tbl += '<tr role="row" class="group-header o-list-group-header"><td role="gridcell" class="o-list-td o-list-group-cell" colspan="' + (cols.length + 2) + '">' + String(label).replace(/</g, "&lt;") + "</td></tr>";
                  return;
                }
                if (isSubtotal) {
                  tbl += '<tr role="row" class="group-subtotal o-list-subtotal-row"><td class="o-list-td o-list-td--checkbox"></td>';
                  cols.forEach(function(c) {
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
                cols.forEach(function(c) {
                  var f = typeof c === "object" ? c.name : c;
                  var val = r[f];
                  if (nameMap && nameMap[f] && val != null) {
                    if (Array.isArray(val)) val = val.map(function(id) {
                      return nameMap[f][id] || id;
                    }).join(", ");
                    else val = nameMap[f][val] || val;
                  } else if (val != null) {
                    if (typeof val === "boolean") val = val ? "Yes" : "No";
                    else if (isMonetaryField(model, f)) {
                      var n = Number(val);
                      var formatted = !isNaN(n) ? n.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val;
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
                tbl += '<td role="gridcell" class="o-list-td o-list-td--actions"><a href="#' + route + "/edit/" + (r.id || "") + '" class="o-list-action-link" data-edit-id="' + (r.id || "") + '">Edit</a>';
                tbl += '<a href="#" class="btn-delete o-list-delete-link" data-id="' + (r.id || "") + '">Delete</a></td></tr>';
              }
              if (groups) {
                groups.forEach(function(grp) {
                  renderRow(grp.key, true);
                  grp.rows.forEach(function(r) {
                    renderRow(r, false);
                  });
                  var subtotal = {};
                  numericCols.forEach(function(f) {
                    if (cols.some(function(c) {
                      return (typeof c === "object" ? c.name : c) === f;
                    })) {
                      subtotal[f] = grp.rows.reduce(function(s, r) {
                        return s + (Number(r[f]) || 0);
                      }, 0);
                    }
                  });
                  if (Object.keys(subtotal).length) renderRow(subtotal, false, true);
                });
              } else {
                records.forEach(function(r) {
                  renderRow(r, false);
                });
              }
              tbl += "</tbody></table>";
              var total = totalCount != null ? totalCount : records ? records.length : 0;
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
                  return Array.prototype.map.call(main.querySelectorAll(".list-row-select:checked"), function(cb) {
                    return parseInt(cb.dataset.id, 10);
                  }).filter(function(x) {
                    return !isNaN(x);
                  });
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
                  selectAll.onclick = function() {
                    main.querySelectorAll(".list-row-select").forEach(function(cb) {
                      cb.checked = selectAll.checked;
                    });
                    updateBar();
                  };
                }
                main.querySelectorAll(".list-row-select").forEach(function(cb) {
                  cb.onclick = updateBar;
                });
                if (bulkDelete) {
                  bulkDelete.onclick = function() {
                    var ids = getSelectedIds();
                    if (!ids.length) return;
                    confirmModal({ title: "Delete records", message: "Delete " + ids.length + " record(s)?", confirmLabel: "Delete", cancelLabel: "Cancel" }).then(function(ok) {
                      if (!ok || !rpc || !rpc.callKw) return;
                      rpc.callKw(model, "unlink", [ids], {}).then(function() {
                        showToast("Deleted", "success");
                        loadRecords(model, route, currentListState.searchTerm, stageFilter, void 0, currentListState.savedFilterId, offset, limit, resolveListHashDomain());
                      }).catch(function(err) {
                        showToast(err.message || "Delete failed", "error");
                      });
                    });
                  };
                }
                if (bulkClear) bulkClear.onclick = function() {
                  main.querySelectorAll(".list-row-select").forEach(function(cb) {
                    cb.checked = false;
                  });
                  if (selectAll) selectAll.checked = false;
                  updateBar();
                };
              })();
              (function setupListKeyboardNav() {
                var table = main.querySelector('table[role="grid"]');
                if (!table) return;
                table.addEventListener("keydown", function(e) {
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
                table.addEventListener("click", function(e) {
                  var a = e.target.closest && e.target.closest("a.o-list-action-link");
                  if (!a || !a.getAttribute("data-edit-id")) return;
                  var id = a.getAttribute("data-edit-id");
                  if (!id) return;
                  e.preventDefault();
                  dispatchListActWindowThenFormHash(route, "edit/" + id, "listTableEditLink");
                });
              })();
            };
            var renderTable = renderTable2;
            var m2oCols = cols.filter(function(c) {
              var f = typeof c === "object" ? c.name : c;
              return getMany2oneComodel(model, f);
            });
            var m2mCols = cols.filter(function(c) {
              var f = typeof c === "object" ? c.name : c;
              return getMany2manyInfo(model, f);
            });
            var numericCols = ["expected_revenue", "revenue", "amount", "quantity"];
            var monetaryCurrCols = cols.filter(function(c) {
              var f = typeof c === "object" ? c.name : c;
              return isMonetaryField(model, f) && getMonetaryCurrencyField(model, f);
            }).map(function(c) {
              return getMonetaryCurrencyField(model, typeof c === "object" ? c.name : c);
            }).filter(Boolean);
            var currCols = monetaryCurrCols.filter(function(f, i, a) {
              return a.indexOf(f) === i;
            });
            var allCols = m2oCols.length || m2mCols.length || currCols.length;
            if (allCols) {
              var promises = m2oCols.map(function(c) {
                var f = typeof c === "object" ? c.name : c;
                return getDisplayNames(model, f, records).then(function(m) {
                  return { f, m };
                });
              }).concat(m2mCols.map(function(c) {
                var f = typeof c === "object" ? c.name : c;
                return getDisplayNamesForMany2many(model, f, records).then(function(m) {
                  return { f, m };
                });
              })).concat(currCols.map(function(f) {
                return getDisplayNames(model, f, records).then(function(m) {
                  return { f, m };
                });
              }));
              Promise.all(promises).then(function(maps) {
                var nameMap = {};
                maps.forEach(function(x) {
                  nameMap[x.f] = x.m;
                });
                renderTable2(nameMap);
              }).catch(function() {
                renderTable2({});
              });
            } else {
              renderTable2(null);
            }
          }
          var btn = document.getElementById("btn-add");
          if (btn) btn.onclick = function() {
            dispatchListActWindowThenFormHash(route, "new", "listToolbarNew");
          };
          var btnExportExcel = document.getElementById("btn-export-excel");
          if (btnExportExcel && records && records.length) {
            btnExportExcel.onclick = function() {
              var exportCols = getListColumns(model);
              var fields = ["id"].concat(exportCols.map(function(c) {
                return typeof c === "object" ? c.name : c;
              }));
              var domain = [];
              var action = getActionForRoute(route);
              if (action && action.domain) {
                var parsed = parseActionDomain(action.domain);
                if (parsed && parsed.length) domain = parsed;
              }
              var searchDom = buildSearchDomain(model, document.getElementById("list-search") && document.getElementById("list-search").value || "");
              if (searchDom && searchDom.length) domain = domain.concat(searchDom);
              var stageEl = document.getElementById("list-stage-filter");
              if ((model === "crm.lead" || model === "helpdesk.ticket") && stageEl && stageEl.value) {
                domain = domain.concat([["stage_id", "=", parseInt(stageEl.value, 10)]]);
              }
              (currentListState.activeSearchFilters || []).forEach(function(fname) {
                var currentSearchView = viewsSvc && viewsSvc.getView ? viewsSvc.getView(model, "search") : null;
                var filters = currentSearchView && currentSearchView.filters || [];
                var filterDef = filters.find(function(x) {
                  return x.name === fname && x.domain;
                });
                if (filterDef && filterDef.domain) {
                  var fd = parseFilterDomain(filterDef.domain);
                  if (fd.length) domain = domain.concat(fd);
                }
              });
              fetch("/web/export/xlsx", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model, fields, domain })
              }).then(function(r) {
                if (!r.ok) return r.json().then(function(d) {
                  throw new Error(d.error || "Export failed");
                });
                return r.blob();
              }).then(function(blob) {
                var url = URL.createObjectURL(blob);
                var a = document.createElement("a");
                a.href = url;
                a.download = (route || "export") + ".xlsx";
                a.click();
                URL.revokeObjectURL(url);
              }).catch(function(err) {
                showToast(err.message || "Failed to export", "error");
              });
            };
          }
          var btnExport = document.getElementById("btn-export");
          if (btnExport && records && records.length) {
            btnExport.onclick = function() {
              var tbl = main.querySelector("table");
              if (!tbl) return;
              var rows = tbl.querySelectorAll("tr");
              var lines = [];
              rows.forEach(function(tr) {
                var cells = tr.querySelectorAll("td, th");
                var vals = [];
                cells.forEach(function(cell) {
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
          if (btnImport) btnImport.onclick = function() {
            showImportModal(model, route);
          };
          var btnPrint = document.getElementById("btn-print");
          if (btnPrint && reportName && records && records.length) {
            btnPrint.onclick = function() {
              var ids = records.map(function(r) {
                return r.id;
              }).filter(function(x) {
                return x;
              });
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
            var doSearch = function() {
              var sf = document.getElementById("list-saved-filter");
              var stageEl = document.getElementById("list-stage-filter");
              var nextStage = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
              loadRecords(model, route, searchInput.value.trim(), nextStage, null, sf && sf.value ? sf.value : null, 0, null);
            };
            btnSearch.onclick = doSearch;
            searchInput.onkeydown = function(e) {
              if (e.key === "Enter") {
                e.preventDefault();
                doSearch();
              }
            };
          }
          var btnAiSearch = document.getElementById("btn-ai-search");
          if (btnAiSearch && searchInput) {
            btnAiSearch.onclick = function() {
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
                body: JSON.stringify({ model, query, limit: 80 })
              }).then(function(r) {
                return r.json();
              }).then(function(data) {
                if (data.error) {
                  showToast(data.error || "AI search failed", "error");
                  return;
                }
                var action = getActionForRoute(route);
                var actionDomain = action ? parseActionDomain(action.domain || "") : [];
                var nlDomain = data.domain && data.domain.length ? data.domain : [];
                var domainOverride = actionDomain.concat(nlDomain);
                var sf2 = document.getElementById("list-saved-filter");
                var stageEl2 = document.getElementById("list-stage-filter");
                var nextStage2 = stageEl2 && stageEl2.value ? parseInt(stageEl2.value, 10) : null;
                loadRecords(model, route, query, nextStage2, null, sf2 && sf2.value ? sf2.value : null, 0, null, domainOverride.length ? domainOverride : void 0);
              }).catch(function(err) {
                showToast(err.message || "AI search failed", "error");
              }).finally(function() {
                btnAiSearch.disabled = false;
                btnAiSearch.textContent = "AI Search";
              });
            };
          }
          main.querySelectorAll(".btn-delete").forEach(function(a) {
            a.onclick = function(e) {
              e.preventDefault();
              confirmModal({ title: "Delete record", message: "Delete this record?", confirmLabel: "Delete", cancelLabel: "Cancel" }).then(function(ok) {
                if (ok) deleteRecord(model, route, a.dataset.id);
              });
            };
          });
          main.querySelectorAll(".btn-view").forEach(function(btnEl) {
            btnEl.onclick = function() {
              var v = btnEl.dataset.view;
              if (v) setViewAndReload(route, v);
            };
          });
          main.querySelectorAll(".btn-search-filter").forEach(function(btnEl) {
            btnEl.onclick = function() {
              var fname = btnEl.dataset.filter;
              if (!fname) return;
              var cur = currentListState.activeSearchFilters || [];
              var idx = cur.indexOf(fname);
              var next = idx >= 0 ? cur.filter(function(_, i) {
                return i !== idx;
              }) : cur.concat(fname);
              currentListState.activeSearchFilters = next;
              var si = document.getElementById("list-search");
              loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, 0, null);
            };
          });
          var groupByEl = document.getElementById("list-group-by");
          if (groupByEl) {
            groupByEl.onchange = function() {
              currentListState.groupBy = groupByEl.value || null;
              var si = document.getElementById("list-search");
              loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, 0, null);
            };
          }
          main.querySelectorAll(".facet-chip .facet-remove").forEach(function(btnEl) {
            btnEl.onclick = function(e) {
              e.preventDefault();
              var chip = btnEl.closest(".facet-chip");
              if (!chip) return;
              var typ = chip.dataset.type;
              var name = chip.dataset.name;
              if (typ === "filter") currentListState.activeSearchFilters = (currentListState.activeSearchFilters || []).filter(function(f) {
                return f !== name;
              });
              else if (typ === "groupby") currentListState.groupBy = null;
              var si = document.getElementById("list-search");
              loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, 0, null);
            };
          });
          main.querySelectorAll(".sortable-col").forEach(function(th) {
            th.onclick = function() {
              var f = th.dataset.field;
              if (!f) return;
              var cur = currentListState.route === route && currentListState.order || "";
              var nextDir = cur.startsWith(f + " ") && cur.indexOf("desc") < 0 ? "desc" : "asc";
              loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, 0, f + " " + nextDir);
            };
          });
          main.querySelectorAll(".btn-pager-prev").forEach(function(btnEl) {
            btnEl.onclick = function() {
              if (btnEl.disabled) return;
              var off = (currentListState.offset || 0) - (currentListState.limit || 80);
              loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, Math.max(0, off), null);
            };
          });
          main.querySelectorAll(".btn-pager-next").forEach(function(btnEl) {
            btnEl.onclick = function() {
              if (btnEl.disabled) return;
              var off = (currentListState.offset || 0) + (currentListState.limit || 80);
              loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, off, null);
            };
          });
          if (model === "crm.lead") {
            var filterEl = document.getElementById("list-stage-filter");
            if (filterEl && rpc && rpc.callKw) {
              rpc.callKw("crm.stage", "search_read", [[]], { fields: ["id", "name"], order: "sequence" }).then(function(stages) {
                stages.forEach(function(s) {
                  var opt = document.createElement("option");
                  opt.value = s.id;
                  opt.textContent = s.name || "";
                  if (s.id === stageFilter) opt.selected = true;
                  filterEl.appendChild(opt);
                });
                filterEl.onchange = function() {
                  var val = filterEl.value ? parseInt(filterEl.value, 10) : null;
                  loadRecords(model, route, document.getElementById("list-search").value.trim(), val, null, null, 0, null);
                };
              });
            }
          }
          var savedFilterEl = document.getElementById("list-saved-filter");
          if (savedFilterEl) {
            savedFilterEl.onchange = function() {
              var fid = savedFilterEl.value || null;
              var si = document.getElementById("list-search");
              loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, fid, 0, null);
            };
          }
          var btnSaveFilter = document.getElementById("btn-save-filter");
          if (btnSaveFilter) {
            btnSaveFilter.onclick = function() {
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
              saveSavedFilter(model, name.trim(), domain).then(function() {
                loadRecords(model, route, st, stageFilter, null, null, 0, null);
              });
            };
          }
          return true;
        }
        window.AppCore = window.AppCore || {};
        window.AppCore.ListViewModule = {
          render
        };
      })();
    }
  });

  // addons/web/static/src/search/search_model.js
  (function() {
    function SearchModel(model, viewsSvc, listStateRef) {
      this.model = model;
      this.viewsSvc = viewsSvc || null;
      this.state = listStateRef || {};
      if (!Array.isArray(this.state.facets)) this.state.facets = [];
    }
    SearchModel.prototype.getSearchView = function() {
      return this.viewsSvc && this.viewsSvc.getView ? this.viewsSvc.getView(this.model, "search") : null;
    };
    SearchModel.prototype.toggleFilter = function(name) {
      var cur = this.state.activeSearchFilters || [];
      var idx = cur.indexOf(name);
      if (idx >= 0) this.state.activeSearchFilters = cur.filter(function(_, i) {
        return i !== idx;
      });
      else this.state.activeSearchFilters = cur.concat(name);
      this._emit("change");
    };
    SearchModel.prototype.setGroupBy = function(groupBy) {
      this.state.groupBy = groupBy || null;
      this._emit("change");
    };
    SearchModel.prototype.setSearchTerm = function(term) {
      this.state.searchTerm = term || "";
      this._emit("change");
    };
    SearchModel.prototype._facetKey = function(facet) {
      if (!facet) return "";
      return [facet.type || "custom", facet.name || "", facet.value || "", facet.operator || "", facet.label || ""].join("::");
    };
    SearchModel.prototype.addFacet = function(facet) {
      if (!facet || !facet.label) return;
      var next = {
        type: facet.type || "custom",
        name: facet.name || "",
        operator: facet.operator || "ilike",
        value: facet.value,
        label: facet.label,
        removable: facet.removable !== false,
        domain: Array.isArray(facet.domain) ? facet.domain.slice() : null
      };
      var key = this._facetKey(next);
      var exists = (this.state.facets || []).some(function(f) {
        return this._facetKey(f) === key;
      }, this);
      if (!exists) this.state.facets = (this.state.facets || []).concat(next);
      this._emit("change");
    };
    SearchModel.prototype.removeFacet = function(facetOrIdx) {
      var arr = this.state.facets || [];
      if (!arr.length) return;
      if (typeof facetOrIdx === "number") {
        this.state.facets = arr.filter(function(_, i) {
          return i !== facetOrIdx;
        });
      } else {
        var key = this._facetKey(facetOrIdx);
        this.state.facets = arr.filter(function(f) {
          return this._facetKey(f) !== key;
        }, this);
      }
      this._emit("change");
    };
    SearchModel.prototype.getFacets = function() {
      return (this.state.facets || []).slice();
    };
    SearchModel.prototype.renderFacets = function() {
      var facets = this.getFacets();
      if (!facets.length) return "";
      var esc = function(s) {
        return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
      };
      var html = '<div class="o-facet-bar" role="list" aria-label="Active filters">';
      facets.forEach(function(f, idx) {
        html += '<span class="o-filter-chip facet-chip" role="listitem" data-facet-idx="' + idx + '">';
        html += esc(f.label);
        if (f.removable !== false) {
          html += ' <button type="button" class="o-filter-chip-remove facet-remove" data-facet-remove="' + idx + '" aria-label="Remove">&times;</button>';
        }
        html += "</span>";
      });
      html += "</div>";
      return html;
    };
    SearchModel.prototype.applyDefaultsFromContext = function(ctx) {
      var c = ctx || {};
      Object.keys(c).forEach(function(k) {
        if (k.indexOf("search_default_") !== 0) return;
        var field = k.slice("search_default_".length);
        var val = c[k];
        if (val == null || val === false || val === "") return;
        this.addFacet({
          type: "field",
          name: field,
          operator: typeof val === "number" ? "=" : "ilike",
          value: val,
          label: field + ": " + val,
          domain: [[field, typeof val === "number" ? "=" : "ilike", val]]
        });
      }, this);
    };
    SearchModel.prototype.getAutocompleteSuggestions = function(term) {
      var q = String(term || "").trim().toLowerCase();
      if (!q) return [];
      var sv = this.getSearchView();
      var fields = sv && sv.fields || [];
      var out = [];
      fields.forEach(function(f) {
        var name = f.name || "";
        var label = f.string || name;
        if (!name) return;
        if (label.toLowerCase().indexOf(q) >= 0 || name.toLowerCase().indexOf(q) >= 0 || q.length >= 2) {
          out.push({
            type: "field",
            name,
            operator: "ilike",
            value: term,
            label: label + ": " + term,
            domain: [[name, "ilike", term]]
          });
        }
      });
      return out.slice(0, 8);
    };
    SearchModel.prototype._listeners = null;
    SearchModel.prototype.subscribe = function(fn) {
      if (!this._listeners) this._listeners = [];
      this._listeners.push(fn);
    };
    SearchModel.prototype._emit = function(evt) {
      (this._listeners || []).forEach(function(fn) {
        try {
          fn(evt, this);
        } catch (e) {
        }
      }, this);
    };
    SearchModel.prototype.getSearchPanelSections = function() {
      var sv = this.getSearchView();
      var filters = sv && sv.filters || [];
      var byCat = {};
      filters.forEach(function(f) {
        var cat = f.category || f.panel || "Filters";
        if (!byCat[cat]) byCat[cat] = [];
        byCat[cat].push({ label: f.string || f.name || "", value: f.name || "" });
      });
      return Object.keys(byCat).map(function(title) {
        return { title, items: byCat[title] };
      });
    };
    SearchModel.prototype.buildDomain = function(ctx) {
      ctx = ctx || {};
      var domain = (ctx.actionDomain || []).slice();
      var model = ctx.model || this.model;
      var uid = ctx.uid != null ? ctx.uid : 1;
      if (ctx.savedFilterDomain && ctx.savedFilterDomain.length) {
        return domain.concat(ctx.savedFilterDomain);
      }
      if (!ctx.skipSearchDomain) {
        var bsd = ctx.buildSearchDomain;
        if (bsd && ctx.searchTerm && String(ctx.searchTerm).trim()) {
          var sd = bsd(model, String(ctx.searchTerm).trim());
          if (sd && sd.length) domain = domain.concat(sd);
        }
      }
      if (model === "crm.lead" && ctx.stageFilter) {
        domain = domain.concat([["stage_id", "=", ctx.stageFilter]]);
      }
      var sv = this.getSearchView();
      var filters = sv && sv.filters || [];
      (this.state.activeSearchFilters || []).forEach(function(fname) {
        var f = filters.find(function(x) {
          return x.name === fname && x.domain;
        });
        if (f && f.domain && ctx.parseFilterDomain) {
          var fd = ctx.parseFilterDomain(f.domain, uid);
          if (fd && fd.length) domain = domain.concat(fd);
        }
      });
      (this.state.facets || []).forEach(function(f) {
        if (f && Array.isArray(f.domain) && f.domain.length) {
          domain = domain.concat(f.domain);
        }
      });
      return domain;
    };
    window.__ERP_SearchLayer = window.__ERP_SearchLayer || {};
    window.__ERP_SearchLayer.SearchModel = SearchModel;
    window.AppCore = window.AppCore || {};
    window.AppCore.SearchModel = SearchModel;
  })();

  // addons/web/static/src/app/registry.js
  function createCategory() {
    const entries = /* @__PURE__ */ new Map();
    const listeners = /* @__PURE__ */ new Set();
    function notify(detail) {
      listeners.forEach(function(listener) {
        listener(detail);
      });
    }
    function orderedEntries() {
      return Array.from(entries.entries()).sort(function(left, right) {
        const leftSeq = left[1].sequence || 100;
        const rightSeq = right[1].sequence || 100;
        if (leftSeq !== rightSeq) {
          return leftSeq - rightSeq;
        }
        return String(left[0]).localeCompare(String(right[0]));
      });
    }
    return {
      add(key, value, options) {
        const entry = {
          key,
          value,
          sequence: options && options.sequence != null ? Number(options.sequence) : 100,
          options: options || {}
        };
        entries.set(key, entry);
        notify({ operation: "add", key, value, options: entry.options });
        return value;
      },
      delete(key) {
        const existing = entries.get(key);
        const deleted = entries.delete(key);
        if (deleted) {
          notify({ operation: "delete", key, value: existing && existing.value, options: existing && existing.options });
        }
        return deleted;
      },
      get(key) {
        const entry = entries.get(key);
        return entry ? entry.value : void 0;
      },
      getAll() {
        return orderedEntries().map(function(item) {
          return item[1].value;
        });
      },
      getEntries() {
        return orderedEntries().map(function(item) {
          return [item[0], item[1].value];
        });
      },
      getDetailedEntries() {
        return orderedEntries().map(function(item) {
          return {
            key: item[0],
            value: item[1].value,
            sequence: item[1].sequence,
            options: item[1].options
          };
        });
      },
      has(key) {
        return entries.has(key);
      },
      subscribe(listener) {
        if (typeof listener !== "function") {
          return function() {
          };
        }
        listeners.add(listener);
        return function() {
          listeners.delete(listener);
        };
      }
    };
  }
  function createRegistry() {
    const categories = /* @__PURE__ */ new Map();
    function ensureCategory(name) {
      if (!categories.has(name)) {
        categories.set(name, createCategory());
      }
      return categories.get(name);
    }
    return {
      category(name) {
        return ensureCategory(name);
      },
      snapshot() {
        const result = {};
        categories.forEach(function(category, key) {
          result[key] = category.getEntries();
        });
        return result;
      }
    };
  }

  // addons/web/static/src/app/menu_utils.js
  var menu_utils_exports = {};
  __export(menu_utils_exports, {
    actionToRoute: () => actionToRoute,
    buildMenuTree: () => buildMenuTree,
    getAppIdForRoute: () => getAppIdForRoute,
    getAppRoots: () => getAppRoots,
    getCurrentRoute: () => getCurrentRoute,
    getDefaultRouteForAppNode: () => getDefaultRouteForAppNode,
    menuToRoute: () => menuToRoute
  });
  function getCurrentRoute() {
    const hash = String(window.location.hash || "#home").replace(/^#/, "");
    return hash.split("?")[0] || "home";
  }
  function actionToRoute(action) {
    if (!action) return null;
    if (action.type === "ir.actions.act_url") {
      const rawUrl = String(action.url || "").trim();
      if (!rawUrl) return null;
      const hashIndex = rawUrl.indexOf("#");
      if (hashIndex >= 0) {
        const fragment = rawUrl.slice(hashIndex + 1).split("?")[0].trim();
        return fragment || null;
      }
      if (/^[a-z0-9_\-/]+$/i.test(rawUrl)) {
        return rawUrl;
      }
      return null;
    }
    const actType = action.type || "";
    const hasModel = !!(action.res_model || action.resModel);
    if (actType !== "ir.actions.act_window" && actType !== "window") {
      if (!hasModel || actType === "ir.actions.act_client" || actType === "ir.actions.report") {
        return null;
      }
    }
    const modelSlug = String(action.res_model || action.resModel || "").replace(/\./g, "_");
    if (!modelSlug) return null;
    const byModel = {
      res_partner: "contacts",
      crm_lead: (action.name || "").toLowerCase().indexOf("pipeline") >= 0 ? "pipeline" : (action.name || "").toLowerCase().indexOf("activit") >= 0 ? "crm/activities" : "leads",
      project_task: "tasks",
      knowledge_article: "articles",
      knowledge_category: "knowledge_categories",
      sale_order: "orders",
      sale_subscription: "subscriptions",
      product_product: "products",
      ir_attachment: "attachments",
      res_users: "settings/users",
      approval_rule: "settings/approval_rules",
      approval_request: "settings/approval_requests",
      hr_leave: "leaves",
      hr_leave_type: "leave_types",
      hr_leave_allocation: "allocations",
      ir_cron: "cron",
      ir_actions_server: "server_actions",
      ir_sequence: "sequences",
      mrp_production: "manufacturing",
      mrp_bom: "boms",
      mrp_workcenter: "workcenters",
      stock_picking: "transfers",
      stock_warehouse: "warehouses",
      stock_lot: "lots",
      purchase_order: "purchase_orders",
      account_move: "invoices",
      account_bank_statement: "bank_statements",
      account_reconcile_wizard: "account_reconcile_wizard",
      account_journal: "journals",
      account_account: "accounts",
      account_tax: "taxes",
      account_payment_term: "payment_terms",
      hr_employee: "employees",
      hr_department: "departments",
      hr_job: "jobs",
      hr_attendance: "attendances",
      hr_applicant: "applicants",
      hr_contract: "contracts",
      project_project: "projects",
      calendar_event: "meetings",
      helpdesk_ticket: "tickets",
      analytic_line: "timesheets",
      analytic_account: "analytic_accounts",
      analytic_plan: "analytic_plans",
      product_pricelist: "pricelists",
      stock_warehouse_orderpoint: "reordering_rules",
      hr_expense: "expenses",
      repair_order: "repair_orders",
      survey_survey: "surveys",
      lunch_order: "lunch_orders",
      im_livechat_channel: "livechat_channels",
      data_recycle_model: "recycle_models",
      hr_skill: "skills",
      slide_channel: "elearning",
      audit_log: "audit_log",
      mailing_list: "marketing/mailing_lists",
      mailing_mailing: "marketing/mailings",
      crm_stage: "crm_stages",
      crm_tag: "crm_tags",
      crm_lost_reason: "crm_lost_reasons",
      pos_order: "pos_orders",
      pos_session: "pos_sessions"
    };
    return byModel[modelSlug] || modelSlug || null;
  }
  function menuToRoute(menu) {
    if (!menu) return null;
    const name = String(menu.name || "").toLowerCase();
    const known = {
      home: "home",
      settings: "settings",
      "api keys": "settings/apikeys",
      contacts: "contacts",
      crm: "pipeline",
      leads: "leads",
      "my pipeline": "pipeline",
      "my activities": "crm/activities",
      discuss: "discuss",
      orders: "orders",
      products: "products",
      tasks: "tasks",
      invoicing: "invoices",
      inventory: "transfers",
      sales: "orders",
      hr: "employees",
      employees: "employees",
      departments: "departments",
      "job positions": "jobs",
      jobs: "jobs",
      expenses: "expenses",
      "my expenses": "expenses",
      attendances: "attendances",
      attendance: "attendances",
      recruitment: "recruitment",
      applicants: "applicants",
      "time off": "time_off",
      repairs: "repair_orders",
      surveys: "surveys",
      lunch: "lunch_orders",
      "live chat": "livechat_channels",
      "to-do": "project_todos",
      "data recycle": "recycle_models",
      skills: "skills",
      elearning: "elearning",
      "analytic plans": "analytic_plans",
      subscriptions: "subscriptions",
      meetings: "meetings",
      "recruitment stages": "recruitment_stages",
      valuation: "reports/stock-valuation",
      valuations: "reports/stock-valuation",
      "stock valuation report": "reports/stock-valuation",
      website: "website",
      ecommerce: "ecommerce",
      reports: "reports/trial-balance",
      stages: "crm_stages",
      tags: "crm_tags",
      "lost reasons": "crm_lost_reasons",
      "point of sale": "pos_orders",
      "point-of-sale": "pos_orders",
      pos: "pos_orders",
      "pos sessions": "pos_sessions"
    };
    if (known[name]) {
      return known[name];
    }
    const slug = name.trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const sectionOnly = { configuration: true, reporting: true, operations: true, sales: true, technical: true };
    if (slug && !sectionOnly[slug]) {
      return slug;
    }
    return null;
  }
  function buildMenuTree(menus) {
    const byId = {};
    const roots = [];
    (menus || []).forEach(function(menu) {
      byId[menu.id || menu.name] = { menu, children: [] };
    });
    (menus || []).forEach(function(menu) {
      const node = byId[menu.id || menu.name];
      if (!node) return;
      const parentRef = menu.parent || "";
      if (!parentRef || !byId[parentRef]) {
        roots.push(node);
      } else {
        byId[parentRef].children.push(node);
      }
    });
    function sortRecursive(nodes) {
      nodes.sort(function(left, right) {
        return (left.menu.sequence || 0) - (right.menu.sequence || 0);
      });
      nodes.forEach(function(node) {
        if (node.children.length) {
          sortRecursive(node.children);
        }
      });
    }
    sortRecursive(roots);
    return roots;
  }
  function getAppRoots(tree, menus) {
    const byId = {};
    (menus || []).forEach(function(menu) {
      if (menu && menu.id) {
        byId[menu.id] = menu;
      }
    });
    return (tree || []).filter(function(node) {
      const menu = node.menu || {};
      if (!menu.id) return false;
      if (menu.app_id) {
        return menu.id === menu.app_id;
      }
      return !menu.parent || !byId[menu.parent];
    });
  }
  function getAppIdForRoute(route, menus, viewsService) {
    let match = null;
    const norm = route && String(route).split("?")[0];
    (menus || []).some(function(menu) {
      const action = menu.action && viewsService ? viewsService.getAction(menu.action) : null;
      const resolvedRoute = action ? actionToRoute(action) : menuToRoute(menu);
      if (resolvedRoute && resolvedRoute === norm) {
        match = menu.app_id || menu.id || null;
        return true;
      }
      return false;
    });
    if (match != null) return match;
    const gmf = typeof window !== "undefined" && typeof window.__ERP_getModelForRoute === "function" ? window.__ERP_getModelForRoute : null;
    const model = gmf ? gmf(norm) : null;
    if (!model) return null;
    (menus || []).some(function(menu) {
      const action = menu.action && viewsService ? viewsService.getAction(menu.action) : null;
      if (!action) return false;
      const rawType = action.type || "";
      if (rawType !== "ir.actions.act_window" && rawType !== "window") return false;
      const rm = action.res_model || action.resModel;
      if (rm === model) {
        match = menu.app_id || menu.id || null;
        return true;
      }
      return false;
    });
    return match;
  }
  function getDefaultRouteForAppNode(node, viewsService) {
    if (!node) return null;
    const queue = [node];
    while (queue.length) {
      const current = queue.shift();
      const menu = current && current.menu ? current.menu : null;
      if (menu) {
        const action = menu.action && viewsService ? viewsService.getAction(menu.action) : null;
        const route = action ? actionToRoute(action) : menuToRoute(menu);
        if (route) return route;
      }
      const children = current && current.children ? current.children : [];
      for (let index = 0; index < children.length; index += 1) {
        queue.push(children[index]);
      }
    }
    return null;
  }

  // addons/web/static/src/app/services.js
  function createFallbackSession(bootstrap) {
    let cached = bootstrap.session || null;
    return {
      getSessionInfo(force) {
        if (!force && cached) return Promise.resolve(cached);
        return fetch(bootstrap.endpoints.sessionInfo, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: "{}"
        }).then(function(response) {
          if (response.status === 401) return null;
          return response.json();
        }).then(function(data) {
          cached = data;
          return data;
        });
      },
      clearCache() {
        cached = null;
      }
    };
  }
  function createFallbackViews(bootstrap) {
    let cache = null;
    return {
      load(force) {
        if (!force && cache) return Promise.resolve(cache);
        return fetch(bootstrap.endpoints.views, {
          method: "GET",
          credentials: "include"
        }).then(function(response) {
          if (!response.ok) return { views: {}, actions: {}, menus: [] };
          return response.json();
        }).then(function(data) {
          cache = data || { views: {}, actions: {}, menus: [] };
          return cache;
        });
      },
      getMenus() {
        return cache && cache.menus || [];
      },
      getAction(id) {
        const actions = cache && cache.actions;
        if (!actions || id == null || id === "") {
          return null;
        }
        if (Object.prototype.hasOwnProperty.call(actions, id)) {
          return actions[id];
        }
        const s = String(id);
        if (Object.prototype.hasOwnProperty.call(actions, s)) {
          return actions[s];
        }
        return null;
      },
      getView(model, type) {
        const list = cache && cache.views ? cache.views[model] || [] : [];
        return list.find(function(view) {
          return view.type === type;
        }) || null;
      },
      getFieldsMeta(model) {
        return cache && cache.fields_meta && cache.fields_meta[model] || null;
      }
    };
  }
  function createViewService(viewsService) {
    return {
      load(force) {
        return viewsService.load(force);
      },
      getMenus() {
        return viewsService.getMenus();
      },
      getAction(id) {
        return viewsService.getAction(id);
      },
      getView(model, type) {
        return viewsService.getView(model, type);
      },
      loadViews(resModel, requested) {
        return viewsService.load().then(function() {
          const modes = Array.isArray(requested) && requested.length ? requested.map(function(p) {
            return Array.isArray(p) ? p[0] : p;
          }) : ["list", "form"];
          const seen = {};
          const views = [];
          modes.forEach(function(mode) {
            const m = String(mode || "list");
            if (seen[m]) {
              return;
            }
            seen[m] = true;
            const v = viewsService.getView(resModel, m);
            if (v) {
              views.push([m, v]);
            }
          });
          const fieldsPayload = typeof viewsService.getFieldsMeta === "function" ? viewsService.getFieldsMeta(resModel) : null;
          return { views, fields: fieldsPayload || {} };
        });
      }
    };
  }
  function createMenuService(bootstrap, viewsService) {
    let cachedMenus = bootstrap.menus && Array.isArray(bootstrap.menus) && bootstrap.menus.length > 0 ? bootstrap.menus : null;
    let listeners = /* @__PURE__ */ new Set();
    function notify() {
      listeners.forEach(function(listener) {
        listener(cachedMenus || []);
      });
    }
    return {
      load(force) {
        if (!force && cachedMenus) {
          return Promise.resolve(cachedMenus);
        }
        return fetch(bootstrap.endpoints.menus, {
          method: "GET",
          credentials: "include"
        }).then(function(response) {
          if (!response.ok) {
            return viewsService.load().then(function(payload) {
              cachedMenus = payload && payload.menus ? payload.menus : [];
              notify();
              return cachedMenus;
            });
          }
          return response.json().then(function(menus) {
            cachedMenus = Array.isArray(menus) ? menus : [];
            notify();
            return cachedMenus;
          });
        });
      },
      getAll() {
        return cachedMenus || [];
      },
      getTree() {
        return buildMenuTree(cachedMenus || []);
      },
      getApps() {
        return getAppRoots(this.getTree(), cachedMenus || []);
      },
      getCurrentAppId(route) {
        const nextRoute = route || getCurrentRoute();
        const autoAppId = getAppIdForRoute(nextRoute, cachedMenus || [], viewsService);
        const storedAppId = typeof localStorage !== "undefined" ? localStorage.getItem("erp_sidebar_app") || "" : "";
        const apps = this.getApps();
        return autoAppId || storedAppId || apps[0] && apps[0].menu && apps[0].menu.id || "";
      },
      getCurrentApp(route) {
        const appId = String(this.getCurrentAppId(route) || "");
        return this.getApps().find(function(node) {
          return String(node.menu && node.menu.id || "") === appId;
        }) || null;
      },
      getCurrentSidebarTree(route) {
        const currentApp = this.getCurrentApp(route);
        if (!currentApp) {
          return this.getTree();
        }
        return currentApp.children && currentApp.children.length ? currentApp.children : [currentApp];
      },
      getCurrentAppName(route) {
        const currentApp = this.getCurrentApp(route);
        return currentApp && currentApp.menu ? currentApp.menu.name || "" : "";
      },
      selectApp(appId) {
        const apps = this.getApps();
        const selected = apps.find(function(node) {
          return String(node.menu && node.menu.id || "") === String(appId || "");
        });
        if (!selected) return null;
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("erp_sidebar_app", String(appId));
        }
        return getDefaultRouteForAppNode(selected, viewsService) || "home";
      },
      subscribe(listener) {
        if (typeof listener !== "function") {
          return function() {
          };
        }
        listeners.add(listener);
        return function() {
          listeners.delete(listener);
        };
      }
    };
  }
  function createThemeService(bootstrap) {
    let listeners = /* @__PURE__ */ new Set();
    function notify(theme) {
      listeners.forEach(function(listener) {
        listener(theme);
      });
    }
    return {
      getTheme() {
        if (typeof localStorage !== "undefined") {
          const saved = localStorage.getItem("erp_theme");
          if (saved) return saved;
        }
        return bootstrap.theme || "light";
      },
      apply(theme) {
        const next = theme || this.getTheme();
        document.documentElement.setAttribute("data-theme", next);
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("erp_theme", next);
        }
        notify(next);
        return next;
      },
      toggle() {
        const current = this.getTheme();
        return this.apply(current === "dark" ? "light" : "dark");
      },
      subscribe(listener) {
        if (typeof listener !== "function") {
          return function() {
          };
        }
        listeners.add(listener);
        return function() {
          listeners.delete(listener);
        };
      }
    };
  }
  function createTitleService(bootstrap) {
    return {
      setParts(parts) {
        const clean = (Array.isArray(parts) ? parts : [parts]).filter(Boolean);
        document.title = clean.length ? clean.join(" \xB7 ") : bootstrap.brandName || "ERP Platform";
      }
    };
  }
  function createNotificationService() {
    return {
      getUnread() {
        return fetch("/mail/notifications", { credentials: "include" }).then(function(response) {
          return response.json();
        }).catch(function() {
          return [];
        });
      },
      markAllRead() {
        const headers = { "Content-Type": "application/json" };
        if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) {
          Object.assign(headers, window.Services.session.getAuthHeaders());
        }
        return fetch("/mail/notifications/mark_read", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ all: true })
        });
      }
    };
  }
  function createRouterService() {
    let currentRoute = getCurrentRoute();
    let started = false;
    const listeners = /* @__PURE__ */ new Set();
    function notify() {
      currentRoute = getCurrentRoute();
      listeners.forEach(function(listener) {
        listener(currentRoute);
      });
    }
    function onHashChange() {
      notify();
    }
    return {
      start() {
        if (started) return;
        started = true;
        window.addEventListener("hashchange", onHashChange);
        notify();
      },
      stop() {
        if (!started) return;
        started = false;
        window.removeEventListener("hashchange", onHashChange);
      },
      getCurrentRoute() {
        return currentRoute;
      },
      navigate(route) {
        const next = String(route || "home").replace(/^#/, "");
        if ((window.location.hash || "#home") === "#" + next) {
          notify();
          if (window.ErpLegacyRouter && typeof window.ErpLegacyRouter.route === "function") {
            window.ErpLegacyRouter.route();
          }
          return next;
        }
        window.location.hash = "#" + next;
        return next;
      },
      subscribe(listener) {
        if (typeof listener !== "function") {
          return function() {
          };
        }
        listeners.add(listener);
        return function() {
          listeners.delete(listener);
        };
      }
    };
  }
  function createActionService(viewsService, menuService, routerService) {
    const legacyAction = window.Services && window.Services.action ? window.Services.action : null;
    function navigateForActWindow(actionDef) {
      const route = actionToRoute(actionDef || {});
      if (route) {
        routerService.navigate(route);
        return route;
      }
      return null;
    }
    return {
      /**
       * Odoo-style action dispatch: legacy classifier + hash navigation for act_window.
       * Phase 636: when legacy returns { type: 'window', action }, apply actionToRoute so the shell updates.
       */
      doAction(actionDef, options) {
        const opt = options || {};
        if (opt.fromMenu && typeof window !== "undefined") {
          window.__ERP_PENDING_LIST_NAV_SOURCE = "navigateFromMenu";
        }
        const rawType = actionDef && actionDef.type || "";
        const isWindowType = rawType === "ir.actions.act_window" || rawType === "window";
        if (legacyAction && typeof legacyAction.doAction === "function") {
          return Promise.resolve(legacyAction.doAction(actionDef, opt)).then(function(result) {
            const windowPayload = result && result.type === "window" ? result : null;
            if (isWindowType || windowPayload) {
              const act = windowPayload && windowPayload.action || actionDef;
              navigateForActWindow(act);
            }
            return result;
          });
        }
        const route = actionToRoute(actionDef || {});
        if (route) {
          routerService.navigate(route);
        }
        return Promise.resolve(route);
      },
      /**
       * Phase 649 bridge: open list/form route from act_window; delegates to AppCore.ViewManager when present.
       */
      openFromActWindow(actionDef, options) {
        const VM = window.AppCore && window.AppCore.ViewManager;
        if (VM && typeof VM.openFromActWindow === "function") {
          return VM.openFromActWindow(actionDef, options || {});
        }
        return this.doAction(actionDef, options || {});
      },
      /**
       * Phase 637: single entry for sidebar / app picker — act_window from menu metadata or menuToRoute fallback.
       */
      navigateFromMenu(menu) {
        if (!menu || typeof menu !== "object") {
          return Promise.resolve(null);
        }
        const actionRef = menu.action;
        const action = actionRef ? viewsService.getAction(actionRef) : null;
        if (action) {
          return this.doAction(action, { fromMenu: true, menu });
        }
        const fallbackRoute = menuToRoute(menu);
        if (fallbackRoute) {
          routerService.navigate(fallbackRoute);
          return Promise.resolve(fallbackRoute);
        }
        return Promise.resolve(null);
      },
      /** Phase 636: delegate form/list object buttons to legacy ActionManager. */
      doActionButton(opts) {
        if (window.ActionManager && typeof window.ActionManager.doActionButton === "function") {
          return window.ActionManager.doActionButton(opts || {});
        }
        return Promise.reject(new Error("ActionManager.doActionButton not available"));
      },
      getActionForRoute(route) {
        const menus = menuService.getAll();
        for (let index = 0; index < menus.length; index += 1) {
          const menu = menus[index];
          const action = menu && menu.action ? viewsService.getAction(menu.action) : null;
          if (action && actionToRoute(action) === route) {
            return action;
          }
        }
        return null;
      },
      loadState() {
        return Promise.resolve(false);
      }
    };
  }
  function createShellService(env, services) {
    const listeners = /* @__PURE__ */ new Set();
    const state = {
      brandName: env.bootstrap.brandName || "Foundry One",
      route: getCurrentRoute(),
      userCompanies: null,
      userLangs: [],
      currentLang: "en_US",
      currentAppName: "",
      currentAppId: "",
      sidebarTree: [],
      staleBannerHtml: "",
      theme: services.theme.getTheme()
    };
    function notify() {
      listeners.forEach(function(listener) {
        listener(state);
      });
      window.dispatchEvent(new CustomEvent("erp:shell-refresh", { detail: state }));
    }
    function refresh() {
      const route = services.router.getCurrentRoute();
      const menus = services.menu.getAll();
      const currentApp = services.menu.getCurrentApp(route);
      state.route = route;
      state.currentAppId = services.menu.getCurrentAppId(route);
      state.currentAppName = services.menu.getCurrentAppName(route);
      state.sidebarTree = services.menu.getCurrentSidebarTree(route);
      state.staleBannerHtml = menus.length ? "" : "Navigation menus missing. Run a module upgrade to rebuild the menu tree.";
      state.theme = services.theme.getTheme();
      if (state.userLangs.length) {
        services.title.setParts([state.brandName, state.currentAppName || route || "Home"]);
      }
      notify();
    }
    function getShellRoot() {
      return document.getElementById("webclient");
    }
    function applyStoredSidebarState() {
      const shell = getShellRoot();
      if (!shell) return;
      const collapsed = typeof localStorage !== "undefined" && localStorage.getItem("erp_sidebar_collapsed") === "1";
      shell.classList.toggle("o-app-shell--sidebar-collapsed", collapsed);
    }
    function closeMobileSidebar() {
      const shell = getShellRoot();
      if (!shell) return;
      shell.classList.remove("o-app-shell--sidebar-mobile-open");
      const backdrop = document.getElementById("o-sidebar-backdrop");
      if (backdrop) {
        backdrop.hidden = true;
        backdrop.setAttribute("aria-hidden", "true");
      }
    }
    function setMobileSidebar(open) {
      const shell = getShellRoot();
      if (!shell) return;
      shell.classList.toggle("o-app-shell--sidebar-mobile-open", !!open);
      const backdrop = document.getElementById("o-sidebar-backdrop");
      if (backdrop) {
        backdrop.hidden = !open;
        backdrop.setAttribute("aria-hidden", open ? "false" : "true");
      }
    }
    function toggleSidebarCollapse() {
      const shell = getShellRoot();
      if (!shell) return false;
      const collapsed = !shell.classList.contains("o-app-shell--sidebar-collapsed");
      shell.classList.toggle("o-app-shell--sidebar-collapsed", collapsed);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("erp_sidebar_collapsed", collapsed ? "1" : "0");
      }
      return collapsed;
    }
    function toggleMobileSidebar() {
      const shell = getShellRoot();
      if (!shell) return false;
      const open = !shell.classList.contains("o-app-shell--sidebar-mobile-open");
      setMobileSidebar(open);
      return open;
    }
    function applyNavContext(detail) {
      if (!detail || typeof detail !== "object") return;
      if (Object.prototype.hasOwnProperty.call(detail, "userCompanies")) {
        state.userCompanies = detail.userCompanies || null;
      }
      if (Object.prototype.hasOwnProperty.call(detail, "userLangs")) {
        state.userLangs = Array.isArray(detail.userLangs) ? detail.userLangs : [];
      }
      if (Object.prototype.hasOwnProperty.call(detail, "currentLang")) {
        state.currentLang = detail.currentLang || "en_US";
      }
      refresh();
    }
    return {
      state,
      load() {
        return Promise.all([
          services.session.getSessionInfo().catch(function() {
            return null;
          }),
          services.views.load().catch(function() {
            return { menus: [] };
          }),
          services.menu.load().catch(function() {
            return [];
          })
        ]).then(function(results) {
          const sessionInfo = results[0] || {};
          state.userCompanies = sessionInfo.user_companies || state.userCompanies;
          state.userLangs = sessionInfo.user_langs || state.userLangs;
          state.currentLang = sessionInfo.lang || state.currentLang;
          applyStoredSidebarState();
          refresh();
          return state;
        });
      },
      refresh,
      subscribe(listener) {
        if (typeof listener !== "function") {
          return function() {
          };
        }
        listeners.add(listener);
        return function() {
          listeners.delete(listener);
        };
      },
      applyStoredSidebarState,
      closeMobileSidebar,
      setMobileSidebar,
      toggleMobileSidebar,
      toggleSidebarCollapse,
      applyNavContext
    };
  }
  function createRelationalModelFacade() {
    return window.__ERP_RELATIONAL_MODEL || null;
  }
  function createModernServices(env) {
    const bootstrap = env.bootstrap;
    const legacy = window.Services || {};
    const views = legacy.views || createFallbackViews(bootstrap);
    const view = createViewService(views);
    const router = createRouterService();
    const orm = legacy.orm || null;
    const relationalModel = createRelationalModelFacade();
    const services = {
      session: legacy.session || createFallbackSession(bootstrap),
      rpc: legacy.rpc || null,
      orm,
      relationalModel,
      i18n: legacy.i18n || null,
      hotkey: legacy.hotkey || null,
      commandPalette: legacy.commandPalette || null,
      views,
      view,
      menu: createMenuService(bootstrap, views),
      title: createTitleService(bootstrap),
      theme: createThemeService(bootstrap),
      notification: createNotificationService(),
      router
    };
    services.action = createActionService(views, services.menu, router);
    services.shell = createShellService(env, services);
    services.router.subscribe(function() {
      services.shell.refresh();
    });
    services.menu.subscribe(function() {
      services.shell.refresh();
    });
    services.theme.subscribe(function() {
      services.shell.refresh();
    });
    if (!env.registries.category("services").has("session")) {
      env.registries.category("services").add("session", services.session, { sequence: 10 });
      env.registries.category("services").add("rpc", services.rpc, { sequence: 20 });
      env.registries.category("services").add("orm", services.orm, { sequence: 25 });
      env.registries.category("services").add("relationalModel", services.relationalModel, { sequence: 26 });
      env.registries.category("services").add("views", services.views, { sequence: 30 });
      env.registries.category("services").add("view", services.view, { sequence: 31 });
      env.registries.category("services").add("menu", services.menu, { sequence: 40 });
      env.registries.category("services").add("router", services.router, { sequence: 50 });
      env.registries.category("services").add("action", services.action, { sequence: 60 });
      env.registries.category("services").add("title", services.title, { sequence: 70 });
      env.registries.category("services").add("notification", services.notification, { sequence: 80 });
      env.registries.category("services").add("theme", services.theme, { sequence: 90 });
      env.registries.category("services").add("i18n", services.i18n, { sequence: 100 });
      env.registries.category("services").add("commandPalette", services.commandPalette, { sequence: 110 });
      env.registries.category("services").add("shell", services.shell, { sequence: 120 });
    }
    return services;
  }

  // addons/web/static/src/app/env.js
  function createEventBus() {
    const listeners = /* @__PURE__ */ new Map();
    return {
      on(name, handler) {
        if (!listeners.has(name)) {
          listeners.set(name, /* @__PURE__ */ new Set());
        }
        listeners.get(name).add(handler);
        return function() {
          listeners.get(name).delete(handler);
        };
      },
      trigger(name, detail) {
        const bucket = listeners.get(name);
        if (!bucket) return;
        bucket.forEach(function(handler) {
          handler({ detail });
        });
      }
    };
  }
  function createBootstrap() {
    const bootstrap = window.__erpFrontendBootstrap || {};
    return {
      runtime: bootstrap.runtime || "modern",
      brandName: bootstrap.brandName || "Foundry One",
      version: bootstrap.version || "phase-2-shell-cutover",
      theme: bootstrap.theme || "light",
      debugAssets: !!bootstrap.debugAssets,
      session: bootstrap.session || null,
      // Omitting `menus` in __erpFrontendBootstrap must mean "load from API", not a cached empty list.
      menus: Array.isArray(bootstrap.menus) && bootstrap.menus.length > 0 ? bootstrap.menus : null,
      shellOwner: bootstrap.shellOwner || "modern",
      endpoints: Object.assign({
        sessionInfo: "/web/session/get_session_info",
        views: "/web/load_views",
        menus: "/web/webclient/load_menus"
      }, bootstrap.endpoints || {}),
      legacyAdapterEnabled: bootstrap.legacyAdapterEnabled !== false
    };
  }
  function createEnv(bootstrap) {
    return {
      bootstrap,
      debug: bootstrap.debugAssets ? "assets" : "",
      bus: createEventBus(),
      registries: createRegistry(),
      services: {},
      templates: /* @__PURE__ */ new Map(),
      state: {
        runtime: bootstrap.runtime,
        legacyBooted: false
      }
    };
  }
  function registerTemplates(env) {
    env.templates.set("web.WebClient", '<div class="o-webclient-modern-root"></div>');
    env.templates.set("web.NavBar", '<header class="o-navbar-shell"></header>');
    env.templates.set("web.Sidebar", '<aside class="o-sidebar-shell"></aside>');
  }
  function startServices(env) {
    env.services = createModernServices(env);
    window.ERPFrontendRegistries = env.registries;
    window.ERPFrontendServices = env.services;
    return env.services;
  }

  // addons/web/static/src/app/owl_bridge.js
  function getOwl() {
    if (!window.owl) {
      throw new Error("OWL runtime missing. Expected /web/static/lib/owl/owl.js before the modern webclient bundle.");
    }
    return window.owl;
  }
  function cspScriptEvalBlocked() {
    const b = typeof window !== "undefined" && window.__erpFrontendBootstrap;
    if (b && b.cspScriptEvalBlocked === false) {
      return false;
    }
    return true;
  }
  function fallbackMount(ComponentClass, target, config, error) {
    if (!ComponentClass || typeof ComponentClass.fallbackMount !== "function") {
      throw error;
    }
    if (typeof console !== "undefined" && console.warn) {
      console.warn(
        "[modern-webclient] Falling back to CSP-safe shell mount for",
        ComponentClass && ComponentClass.name ? ComponentClass.name : "anonymous-component",
        error
      );
    }
    if (target) {
      target.innerHTML = "";
    }
    return ComponentClass.fallbackMount(config && config.env || null, target, error);
  }
  function mountComponent(ComponentClass, target, config) {
    const cfg = config || {};
    if (ComponentClass && typeof ComponentClass.fallbackMount === "function" && cspScriptEvalBlocked()) {
      return Promise.resolve(ComponentClass.fallbackMount(cfg.env || null, target));
    }
    try {
      const owl26 = getOwl();
      return Promise.resolve(owl26.mount(ComponentClass, target, cfg)).catch(function(error) {
        return fallbackMount(ComponentClass, target, cfg, error);
      });
    } catch (error) {
      return Promise.resolve(fallbackMount(ComponentClass, target, cfg, error));
    }
  }

  // addons/web/static/src/app/navbar.js
  var owl = window.owl;
  var { Component, onMounted, onPatched, onWillUnmount, xml, useRef } = owl;
  function cleanupHost(host) {
    if (!host || !host.__modernNavbarCleanup) return;
    host.__modernNavbarCleanup.forEach(function(cleanup) {
      if (typeof cleanup === "function") cleanup();
    });
    host.__modernNavbarCleanup = [];
  }
  function renderNavbarIntoHost(env, host) {
    const shell = env.services.shell.state;
    if (!host || !window.AppCore || !window.AppCore.Navbar) return;
    cleanupHost(host);
    window.AppCore.Navbar.render({
      navbar: host,
      appSidebar: document.getElementById("app-sidebar"),
      brandName: shell.brandName,
      navItems: [],
      selectedAppName: shell.currentAppName,
      staleBannerHtml: shell.staleBannerHtml,
      userCompanies: shell.userCompanies,
      userLangs: shell.userLangs,
      currentLang: shell.currentLang,
      theme: shell.theme
    });
    if (window.__erpNavbarContract && typeof window.__erpNavbarContract.markDelegated === "function") {
      window.__erpNavbarContract.markDelegated(host);
    }
    const cleanups = [];
    const hamburger = host.querySelector(".nav-hamburger");
    if (hamburger && window.__erpModernShellController) {
      const onHamburgerClick = function() {
        window.__erpModernShellController.toggleMobileSidebar();
      };
      hamburger.addEventListener("click", onHamburgerClick);
      cleanups.push(function() {
        hamburger.removeEventListener("click", onHamburgerClick);
      });
    }
    const sidebarToggle = host.querySelector(".nav-sidebar-toggle");
    if (sidebarToggle && window.__erpModernShellController) {
      const onSidebarToggle = function() {
        const collapsed = window.__erpModernShellController.toggleSidebarCollapse();
        sidebarToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      };
      sidebarToggle.addEventListener("click", onSidebarToggle);
      cleanups.push(function() {
        sidebarToggle.removeEventListener("click", onSidebarToggle);
      });
    }
    host.__modernNavbarCleanup = cleanups;
  }
  var NavBar = class extends Component {
    static template = xml`<div t-ref="host" class="o-modern-navbar-slot"></div>`;
    setup() {
      this.hostRef = useRef("host");
      this.unsubscribe = this.env.services.shell.subscribe(this.renderShell.bind(this));
      onMounted(this.renderShell.bind(this));
      onPatched(this.renderShell.bind(this));
      onWillUnmount(() => {
        cleanupHost(this.hostRef.el);
        if (typeof this.unsubscribe === "function") {
          this.unsubscribe();
        }
      });
    }
    renderShell() {
      const host = this.hostRef.el;
      renderNavbarIntoHost(this.env, host);
    }
  };
  NavBar.fallbackMount = function fallbackMount2(env, target) {
    const render = function() {
      renderNavbarIntoHost(env, target);
    };
    render();
    const unsubscribe = env.services.shell.subscribe(render);
    return {
      destroy() {
        cleanupHost(target);
        if (typeof unsubscribe === "function") unsubscribe();
      },
      mode: "fallback"
    };
  };
  function mountNavBar(env, target) {
    if (!target) return null;
    return mountComponent(NavBar, target, { env });
  }

  // addons/web/static/src/app/sidebar.js
  var owl2 = window.owl;
  var { Component: Component2, onMounted: onMounted2, onPatched: onPatched2, onWillUnmount: onWillUnmount2, xml: xml2, useRef: useRef2 } = owl2;
  function escHtml(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function sidebarAbbrev(name) {
    const normalized = String(name || "").trim();
    if (!normalized) return "?";
    const parts = normalized.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return normalized.slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  function sidebarIconHtml(menu) {
    if (menu && menu.web_icon_data) {
      return '<img class="o-sidebar-icon" src="' + escHtml(menu.web_icon_data) + '" alt="" />';
    }
    if (menu && menu.web_icon) {
      const parts = String(menu.web_icon).split(",");
      if (parts[0]) {
        return '<i class="o-sidebar-icon ' + escHtml(parts[0].trim()) + '" aria-hidden="true"></i>';
      }
    }
    return '<span class="o-sidebar-abbrev">' + escHtml(sidebarAbbrev(menu && menu.name)) + "</span>";
  }
  function getFoldState() {
    try {
      return JSON.parse(localStorage.getItem("erp_sidebar_folds") || "{}");
    } catch (_error) {
      return {};
    }
  }
  function saveFoldState(next) {
    try {
      localStorage.setItem("erp_sidebar_folds", JSON.stringify(next || {}));
    } catch (_error) {
    }
  }
  function resolveRoute(menu, viewsService) {
    const action = menu && menu.action && viewsService ? viewsService.getAction(menu.action) : null;
    if (action && window.ERPFrontendRuntime && window.ERPFrontendRuntime.menuUtils) {
      return window.ERPFrontendRuntime.menuUtils.actionToRoute(action);
    }
    if (window.ERPFrontendRuntime && window.ERPFrontendRuntime.menuUtils) {
      return window.ERPFrontendRuntime.menuUtils.menuToRoute(menu);
    }
    return null;
  }
  function buildSidebarBranch(nodes, depth, activeRoute, viewsService) {
    let html = "";
    const folds = getFoldState();
    (nodes || []).forEach(function(node) {
      const menu = node.menu || {};
      const route = resolveRoute(menu, viewsService);
      const isActive = !!route && activeRoute === route;
      const hasChildren = !!(node.children && node.children.length);
      if (hasChildren) {
        const folded = !!folds["menu:" + String(menu.id || menu.name || "")];
        html += '<section class="o-sidebar-category' + (folded ? " o-sidebar-category--folded" : "") + '" data-menu-id="' + escHtml(menu.id || menu.name || "") + '">';
        html += '<button type="button" class="o-sidebar-category-head" aria-expanded="' + (folded ? "false" : "true") + '">';
        html += '<span class="o-sidebar-chevron" aria-hidden="true">&#9662;</span>';
        html += sidebarIconHtml(menu);
        html += '<span class="o-sidebar-category-name">' + escHtml(menu.name || "") + "</span>";
        html += "</button>";
        html += '<div class="o-sidebar-category-body">';
        html += buildSidebarBranch(node.children, depth + 1, activeRoute, viewsService);
        html += "</div></section>";
        return;
      }
      html += '<a class="o-sidebar-link' + (isActive ? " o-sidebar-link--active" : "") + (depth > 0 ? " o-sidebar-link--nested" : "") + (route ? "" : " o-sidebar-link-disabled") + '" href="' + (route ? "#" + route : "#") + '" data-menu-id="' + escHtml(String(menu.id || "")) + '">';
      if (depth === 0) {
        html += sidebarIconHtml(menu);
      }
      html += '<span class="o-sidebar-link-text">' + escHtml(menu.name || "") + "</span>";
      html += "</a>";
    });
    return html;
  }
  function wireSidebar(host, env, onAfterWire) {
    const cleanups = [];
    const folds = getFoldState();
    host.querySelectorAll(".o-sidebar-category-head").forEach(function(button) {
      const onClick = function() {
        const section = button.closest(".o-sidebar-category");
        if (!section) return;
        section.classList.toggle("o-sidebar-category--folded");
        const folded = section.classList.contains("o-sidebar-category--folded");
        button.setAttribute("aria-expanded", folded ? "false" : "true");
        const menuId = section.getAttribute("data-menu-id");
        folds["menu:" + menuId] = folded;
        saveFoldState(folds);
      };
      button.addEventListener("click", onClick);
      cleanups.push(function() {
        button.removeEventListener("click", onClick);
      });
    });
    host.querySelectorAll("a.o-sidebar-link").forEach(function(link) {
      const onClick = function(ev) {
        if (ev.defaultPrevented) return;
        if (ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
        const menuId = link.getAttribute("data-menu-id") || "";
        const actionSvc = env && env.services && env.services.action;
        if (menuId && actionSvc && typeof actionSvc.navigateFromMenu === "function") {
          const menus = env.services.menu.getAll();
          const menu = menus.find(function(m) {
            return m && String(m.id || "") === menuId;
          });
          if (menu) {
            const views = env.services.views;
            const actionRef = menu.action;
            const action = actionRef && views && typeof views.getAction === "function" ? views.getAction(actionRef) : null;
            const mu = window.ERPFrontendRuntime && window.ERPFrontendRuntime.menuUtils;
            const fromAction = action && mu && typeof mu.actionToRoute === "function" ? mu.actionToRoute(action) : null;
            const fromMenu = !fromAction && mu && typeof mu.menuToRoute === "function" ? mu.menuToRoute(menu) : null;
            const canProgrammaticNav = !!(fromAction || fromMenu);
            if (canProgrammaticNav) {
              ev.preventDefault();
              const fallbackHash = "#" + String(fromAction || fromMenu).replace(/^#/, "");
              actionSvc.navigateFromMenu(menu).catch(function() {
                window.location.hash = fallbackHash;
              });
            }
          }
        }
        if (window.innerWidth <= 1023 && window.__erpModernShellController) {
          window.__erpModernShellController.closeMobileSidebar();
        }
      };
      link.addEventListener("click", onClick);
      cleanups.push(function() {
        link.removeEventListener("click", onClick);
      });
    });
    if (typeof onAfterWire === "function") {
      onAfterWire();
    }
    host.__modernSidebarCleanup = cleanups;
  }
  function cleanupHost2(host) {
    if (!host || !host.__modernSidebarCleanup) return;
    host.__modernSidebarCleanup.forEach(function(cleanup) {
      if (typeof cleanup === "function") cleanup();
    });
    host.__modernSidebarCleanup = [];
  }
  function renderSidebarIntoHost(env, host) {
    if (!host) return;
    const shell = env.services.shell.state;
    const tree = shell.sidebarTree || [];
    const route = shell.route || "home";
    cleanupHost2(host);
    host.innerHTML = '<div class="o-sidebar-inner"><div class="o-sidebar-scroll">' + (shell.staleBannerHtml ? '<div class="o-sidebar-stale">' + shell.staleBannerHtml + "</div>" : "") + '<nav class="o-sidebar-nav" role="navigation">' + (tree.length ? buildSidebarBranch(tree, 0, route, env.services.views) : '<p class="o-sidebar-empty">No menu items.</p>') + "</nav></div></div>";
    wireSidebar(host, env);
  }
  var Sidebar = class extends Component2 {
    static template = xml2`<div t-ref="host" class="o-modern-sidebar-slot"></div>`;
    setup() {
      this.hostRef = useRef2("host");
      this.unsubscribe = this.env.services.shell.subscribe(this.renderShell.bind(this));
      onMounted2(this.renderShell.bind(this));
      onPatched2(this.renderShell.bind(this));
      onWillUnmount2(() => {
        cleanupHost2(this.hostRef.el);
        if (typeof this.unsubscribe === "function") {
          this.unsubscribe();
        }
      });
    }
    renderShell() {
      const host = this.hostRef.el;
      renderSidebarIntoHost(this.env, host);
    }
  };
  Sidebar.fallbackMount = function fallbackMount3(env, target) {
    const render = function() {
      renderSidebarIntoHost(env, target);
    };
    render();
    const unsubscribe = env.services.shell.subscribe(render);
    return {
      destroy() {
        cleanupHost2(target);
        if (typeof unsubscribe === "function") unsubscribe();
      },
      mode: "fallback"
    };
  };
  function mountSidebar(env, target) {
    if (!target) return null;
    return mountComponent(Sidebar, target, { env });
  }

  // addons/web/static/src/app/shell_chrome.js
  function attachShellChrome(env) {
    const root = document.documentElement;
    const shell = document.getElementById("webclient");
    if (root) {
      root.setAttribute("data-erp-shell-owner", "modern");
    }
    if (shell) {
      shell.setAttribute("data-erp-runtime", "modern");
      shell.setAttribute("data-erp-shell-owner", "modern");
    }
    document.body.setAttribute("data-erp-runtime", "modern");
    env.services.shell.applyStoredSidebarState();
    env.services.theme.apply(env.bootstrap.theme);
    function syncViewport() {
      if (window.innerWidth > 1023) {
        env.services.shell.closeMobileSidebar();
      }
    }
    window.addEventListener("resize", syncViewport);
    const controller = {
      env,
      phase: "phase-2-shell-cutover",
      toggleSidebarCollapse() {
        return env.services.shell.toggleSidebarCollapse();
      },
      toggleMobileSidebar() {
        return env.services.shell.toggleMobileSidebar();
      },
      closeMobileSidebar() {
        return env.services.shell.closeMobileSidebar();
      },
      applyNavContext(detail) {
        env.services.shell.applyNavContext(detail);
      },
      refresh() {
        env.services.shell.refresh();
      }
    };
    window.__erpModernShellController = controller;
    return controller;
  }

  // addons/web/static/src/app/views/view_registry.js
  function validateDescriptor(type, descriptor) {
    if (!descriptor || typeof descriptor !== "object") {
      throw new Error(`[view_registry] Descriptor for "${type}" must be an object.`);
    }
    if (descriptor.type && descriptor.type !== type) {
      throw new Error(
        `[view_registry] Descriptor.type "${descriptor.type}" does not match registry key "${type}".`
      );
    }
    if (descriptor.Controller && typeof descriptor.Controller !== "function") {
      throw new Error(`[view_registry] Descriptor.Controller for "${type}" must be a class/function.`);
    }
    if (descriptor.Renderer && typeof descriptor.Renderer !== "function") {
      throw new Error(`[view_registry] Descriptor.Renderer for "${type}" must be a class/function.`);
    }
  }
  function createViewRegistry() {
    const _entries = /* @__PURE__ */ new Map();
    const _listeners2 = /* @__PURE__ */ new Set();
    function notify() {
      _listeners2.forEach((fn) => fn(_entries));
    }
    const registry = {
      /**
       * Register a view descriptor.
       * @param {string} type — view type key, e.g. "list", "form"
       * @param {object} descriptor — { type?, Controller, Renderer?, Model?, ArchParser?, searchMenuTypes?, ... }
       * @returns {object} the descriptor
       */
      add(type, descriptor) {
        validateDescriptor(type, descriptor);
        const entry = Object.assign({ type }, descriptor);
        _entries.set(type, entry);
        notify();
        return entry;
      },
      /**
       * Retrieve a registered view descriptor.
       * @param {string} type
       * @returns {object|undefined}
       */
      get(type) {
        return _entries.get(String(type || ""));
      },
      has(type) {
        return _entries.has(String(type || ""));
      },
      getAll() {
        return Array.from(_entries.values());
      },
      getEntries() {
        return Array.from(_entries.entries());
      },
      subscribe(fn) {
        _listeners2.add(fn);
        return () => _listeners2.delete(fn);
      }
    };
    return registry;
  }
  var viewRegistry = createViewRegistry();
  if (typeof window !== "undefined") {
    window.Services = window.Services || {};
    if (!window.Services.viewRegistry || !window.Services.viewRegistry.add) {
      window.Services.viewRegistry = viewRegistry;
    }
  }
  function registerView(env, type, descriptor) {
    validateDescriptor(type, descriptor);
    const entry = Object.assign({ type }, descriptor);
    if (env && env.registries) {
      env.registries.category("views").add(type, entry);
    }
    viewRegistry.add(type, entry);
    return entry;
  }
  function resolveViewDescriptor(type, env) {
    const key = String(type || "list");
    if (env && env.registries) {
      const entry2 = env.registries.category("views").get(key);
      if (entry2) return entry2;
    }
    const entry = viewRegistry.get(key);
    if (entry) return entry;
    if (window.__ERP_ViewResolver && typeof window.__ERP_ViewResolver.resolve === "function") {
      const resolved = window.__ERP_ViewResolver.resolve({ view_mode: key });
      if (resolved && resolved.module) {
        return { type: key, module: resolved.module, entry: resolved.entry };
      }
    }
    return null;
  }
  window.AppCore = window.AppCore || {};
  window.AppCore.viewRegistry = viewRegistry;
  window.AppCore.resolveViewDescriptor = resolveViewDescriptor;
  window.AppCore.registerView = registerView;

  // addons/web/static/src/app/core/hooks.js
  var owl3 = window.owl;
  var { useEnv, useRef: useRef3, useState, useEffect, onWillUnmount: onWillUnmount3, onMounted: onMounted3 } = owl3;
  function useDebounce(fn, delay) {
    let timer = null;
    onWillUnmount3(() => {
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
    });
    return function(...args) {
      if (timer != null) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fn(...args);
      }, delay);
    };
  }
  function useExternalListener(target, event, handler, options) {
    onMounted3(() => {
      target.addEventListener(event, handler, options);
    });
    onWillUnmount3(() => {
      target.removeEventListener(event, handler, options);
    });
  }

  // addons/web/static/src/app/views/list/list_renderer.js
  var owl4 = window.owl;
  var { Component: Component3, useState: useState2, xml: xml3, useRef: useRef4 } = owl4;
  function formatCell(record, col, fieldRegistry2) {
    const field = col.name || col;
    const value = record[field];
    if (fieldRegistry2 && typeof fieldRegistry2.format === "function") {
      try {
        return fieldRegistry2.format(field, value, record, col);
      } catch (_e) {
      }
    }
    if (value == null) return "";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.map((v) => Array.isArray(v) ? v[1] || v[0] : String(v)).join(", ");
    return String(value);
  }
  var ListRenderer = class extends Component3 {
    static template = xml3`
    <div class="o-list-renderer">
      <table class="o-list-table" role="grid">
        <thead>
          <tr>
            <th t-if="props.selectable" class="o-list-th-checkbox">
              <input type="checkbox"
                     t-att-checked="allSelected ? '' : null"
                     t-att-indeterminate="someSelected and !allSelected ? '' : null"
                     aria-label="Select all"
                     t-on-change="onToggleAll"/>
            </th>
            <t t-foreach="columns" t-as="col" t-key="col.name || col_index">
              <th class="o-list-th"
                  t-att-class="{ 'o-list-th--sortable': col.sortable !== false, 'o-list-th--sorted': isSorted(col) }"
                  t-att-aria-sort="getSortDir(col)"
                  t-on-click="() => onSort(col)">
                <span class="o-list-th-label"><t t-esc="col.label || col.name || col"/></span>
                <t t-if="isSorted(col)">
                  <span class="o-list-sort-icon" aria-hidden="true">
                    <t t-if="props.order and props.order.startsWith(col.name) and props.order.endsWith('desc')">&#9660;</t>
                    <t t-else="">&#9650;</t>
                  </span>
                </t>
              </th>
            </t>
            <th class="o-list-th-actions"/>
          </tr>
        </thead>
        <tbody>
          <t t-foreach="props.records" t-as="record" t-key="record.id || record_index">
            <tr class="o-list-row"
                t-att-class="{ 'o-list-row--selected': isSelected(record), 'o-list-row--new': record._isNew }"
                t-att-data-id="record.id"
                t-on-click="(ev) => onRowClick(ev, record)">
              <td t-if="props.selectable" class="o-list-td-checkbox" t-on-click.stop="">
                <input type="checkbox"
                       t-att-checked="isSelected(record) ? '' : null"
                       t-att-aria-label="'Select record ' + record.id"
                       t-on-change="(ev) => onToggleRecord(ev, record)"/>
              </td>
              <t t-foreach="columns" t-as="col" t-key="col.name || col_index">
                <td class="o-list-td"
                    t-att-class="'o-list-td--' + (col.type || 'char')"
                    t-att-data-field="col.name || col">
                  <span class="o-list-cell-value"><t t-esc="renderCell(record, col)"/></span>
                </td>
              </t>
              <td class="o-list-td-actions">
                <button type="button" class="o-list-row-action o-btn-icon"
                        aria-label="Delete row"
                        t-on-click.stop="() => onDeleteRow(record)">&#x2715;</button>
              </td>
            </tr>
          </t>
          <t t-if="!props.records.length">
            <tr class="o-list-row-empty">
              <td t-att-colspan="colSpan" class="o-list-empty-cell">
                <t t-esc="props.emptyMessage || 'No records found'"/>
              </td>
            </tr>
          </t>
        </tbody>
        <t t-if="hasAggregates">
          <tfoot class="o-list-aggregates">
            <tr>
              <td t-if="props.selectable"/>
              <t t-foreach="columns" t-as="col" t-key="col.name || col_index">
                <td class="o-list-td-aggregate">
                  <t t-esc="getAggregate(col)"/>
                </td>
              </t>
              <td/>
            </tr>
          </tfoot>
        </t>
      </table>
    </div>`;
    static props = {
      records: Array,
      columns: Array,
      selectable: { type: Boolean, optional: true },
      selectedIds: { type: Array, optional: true },
      order: { type: String, optional: true },
      aggregates: { type: Object, optional: true },
      emptyMessage: { type: String, optional: true },
      onSort: { type: Function, optional: true },
      onRowClick: { type: Function, optional: true },
      onToggleRecord: { type: Function, optional: true },
      onToggleAll: { type: Function, optional: true },
      onDeleteRow: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    get columns() {
      return (this.props.columns || []).map(
        (c) => typeof c === "string" ? { name: c, label: c } : c
      );
    }
    get colSpan() {
      return this.columns.length + (this.props.selectable ? 2 : 1);
    }
    get allSelected() {
      const ids = this.props.selectedIds || [];
      return ids.length > 0 && ids.length >= (this.props.records || []).length;
    }
    get someSelected() {
      return (this.props.selectedIds || []).length > 0;
    }
    get hasAggregates() {
      const agg = this.props.aggregates;
      return agg && Object.keys(agg).length > 0;
    }
    isSelected(record) {
      const ids = this.props.selectedIds || [];
      return ids.includes(record.id);
    }
    isSorted(col) {
      const order = this.props.order || "";
      return order.startsWith(col.name || "");
    }
    getSortDir(col) {
      if (!this.isSorted(col)) return "none";
      const order = this.props.order || "";
      return order.endsWith("desc") ? "descending" : "ascending";
    }
    renderCell(record, col) {
      const fieldReg = window.Services && window.Services.fieldRegistry;
      return formatCell(record, col, fieldReg);
    }
    getAggregate(col) {
      const agg = this.props.aggregates;
      if (!agg) return "";
      const name = col.name || col;
      return agg[name] != null ? String(agg[name]) : "";
    }
    onSort(col) {
      if (col.sortable === false) return;
      if (typeof this.props.onSort === "function") {
        this.props.onSort(col);
      }
    }
    onRowClick(ev, record) {
      if (typeof this.props.onRowClick === "function") {
        this.props.onRowClick(record, ev);
      }
    }
    onToggleRecord(ev, record) {
      if (typeof this.props.onToggleRecord === "function") {
        this.props.onToggleRecord(record, ev.target.checked);
      }
    }
    onToggleAll(ev) {
      if (typeof this.props.onToggleAll === "function") {
        this.props.onToggleAll(ev.target.checked);
      }
    }
    onDeleteRow(record) {
      if (typeof this.props.onDeleteRow === "function") {
        this.props.onDeleteRow(record);
      }
    }
  };
  window.AppCore = window.AppCore || {};
  window.AppCore.ListRenderer = ListRenderer;

  // addons/web/static/src/app/core/pager.js
  var owl5 = window.owl;
  var { Component: Component4, useState: useState3, xml: xml4, onWillUpdateProps } = owl5;
  var Pager = class extends Component4 {
    static template = xml4`
    <div class="o-pager" role="navigation" aria-label="Pagination" t-att-class="{ 'o-pager--loading': props.isLoading }">
      <button type="button"
              class="o-pager-btn o-pager-btn-prev"
              aria-label="Previous page"
              t-att-disabled="atFirstPage ? '' : null"
              t-on-click="goPrev">&#8249;</button>
      <span class="o-pager-value">
        <t t-if="props.total > 0">
          <t t-esc="from"/>–<t t-esc="to"/> / <t t-esc="props.total"/>
        </t>
        <t t-else="">0</t>
      </span>
      <button type="button"
              class="o-pager-btn o-pager-btn-next"
              aria-label="Next page"
              t-att-disabled="atLastPage ? '' : null"
              t-on-click="goNext">&#8250;</button>
    </div>`;
    static props = {
      offset: Number,
      limit: Number,
      total: Number,
      onUpdate: Function,
      isLoading: { type: Boolean, optional: true }
    };
    get from() {
      return Math.min(this.props.offset + 1, this.props.total);
    }
    get to() {
      return Math.min(this.props.offset + this.props.limit, this.props.total);
    }
    get atFirstPage() {
      return this.props.offset <= 0;
    }
    get atLastPage() {
      return this.props.offset + this.props.limit >= this.props.total;
    }
    goPrev() {
      if (this.atFirstPage) return;
      const newOffset = Math.max(0, this.props.offset - this.props.limit);
      this.props.onUpdate({ offset: newOffset, limit: this.props.limit });
    }
    goNext() {
      if (this.atLastPage) return;
      const newOffset = this.props.offset + this.props.limit;
      this.props.onUpdate({ offset: newOffset, limit: this.props.limit });
    }
  };
  window.AppCore = window.AppCore || {};
  window.AppCore.Pager = Pager;

  // addons/web/static/src/app/views/list/list_controller.js
  var owl6 = window.owl;
  var { Component: Component5, useState: useState4, xml: xml5, onMounted: onMounted4, useEnv: useEnv2 } = owl6;
  var DEFAULT_LIMIT = 80;
  var ListController = class extends Component5 {
    static template = xml5`
    <div class="o-list-controller o-list-view">
      <div class="o-list-header">
        <h2 class="o-list-title"><t t-esc="state.title"/></h2>
        <div class="o-list-actions-bar">
          <button t-if="!state.selectedIds.length"
                  type="button" class="o-btn o-btn-primary"
                  t-on-click="onNew">
            New
          </button>
          <button t-if="state.selectedIds.length"
                  type="button" class="o-btn o-btn-danger"
                  t-on-click="onDeleteSelected">
            Delete (<t t-esc="state.selectedIds.length"/>)
          </button>
        </div>
        <Pager offset="state.offset"
               limit="state.limit"
               total="state.totalCount"
               isLoading="state.loading"
               onUpdate="onPagerUpdate"/>
      </div>
      <ListRenderer
        records="state.records"
        columns="columns"
        selectable="true"
        selectedIds="state.selectedIds"
        order="state.order"
        aggregates="state.aggregates"
        onSort="onSort"
        onRowClick="onRowClick"
        onToggleRecord="onToggleRecord"
        onToggleAll="onToggleAll"
        onDeleteRow="onDeleteRow"/>
    </div>`;
    static components = { ListRenderer, Pager };
    static props = {
      resModel: String,
      columns: { type: Array, optional: true },
      domain: { type: Array, optional: true },
      context: { type: Object, optional: true },
      limit: { type: Number, optional: true },
      onOpenRecord: { type: Function, optional: true },
      /** SearchModel instance provided by WithSearch HOC (Track O1). */
      searchModel: { optional: true },
      slots: { type: Object, optional: true }
    };
    setup() {
      this.env = useEnv2();
      this._orm = window.Services && window.Services.orm || null;
      this._searchModel = this.props.searchModel || null;
      this.state = useState4({
        title: this._titleFor(this.props.resModel),
        records: [],
        loading: false,
        offset: 0,
        limit: this.props.limit || DEFAULT_LIMIT,
        totalCount: 0,
        selectedIds: [],
        order: null,
        aggregates: {}
      });
      if (this._searchModel && typeof this._searchModel.subscribe === "function") {
        this._searchModel.subscribe(() => {
          this.state.offset = 0;
          this.loadRecords();
        });
      }
      onMounted4(() => {
        this.loadRecords();
      });
    }
    get columns() {
      if (this.props.columns && this.props.columns.length) return this.props.columns;
      if (this.state.records.length) {
        return Object.keys(this.state.records[0]).filter((k) => k !== "__id" && !k.startsWith("_")).slice(0, 8).map((k) => ({ name: k, label: k }));
      }
      return [{ name: "name", label: "Name" }, { name: "id", label: "ID" }];
    }
    _titleFor(model) {
      if (!model) return "List";
      const parts = String(model).split(".");
      return parts[parts.length - 1].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    async loadRecords() {
      const orm = this._orm;
      if (!orm) {
        this._loadFallback();
        return;
      }
      this.state.loading = true;
      try {
        const domain = this._searchModel && typeof this._searchModel.getDomain === "function" ? this._searchModel.getDomain(this.props.domain || []) : this.props.domain || [];
        const fields = this.columns.map((c) => c.name || c).filter(Boolean);
        const result = await orm.searchRead(
          this.props.resModel,
          domain,
          fields,
          { offset: this.state.offset, limit: this.state.limit, order: this.state.order || "" }
        );
        this.state.records = Array.isArray(result) ? result : result.records || [];
        if (result.length !== void 0) {
          this.state.totalCount = this.state.records.length < this.state.limit ? this.state.offset + this.state.records.length : this.state.offset + this.state.limit + 1;
        } else {
          this.state.totalCount = result.length || 0;
        }
      } catch (err) {
        console.error("[ListController] loadRecords error:", err);
      } finally {
        this.state.loading = false;
      }
    }
    /** Fallback: delegate to legacy AppCore.ListViewModule */
    _loadFallback() {
      const LVM = window.AppCore && window.AppCore.ListViewModule;
      if (LVM && typeof LVM.render === "function") {
      }
    }
    onPagerUpdate({ offset, limit }) {
      this.state.offset = offset;
      this.state.limit = limit;
      this.loadRecords();
    }
    onSort(col) {
      const name = col.name;
      if (!name) return;
      if (this.state.order === name) {
        this.state.order = name + " desc";
      } else if (this.state.order === name + " desc") {
        this.state.order = null;
      } else {
        this.state.order = name;
      }
      this.state.offset = 0;
      this.loadRecords();
    }
    onRowClick(record) {
      if (typeof this.props.onOpenRecord === "function") {
        this.props.onOpenRecord(record);
      } else {
        const model = this.props.resModel;
        if (model && record.id) {
          const route = model.replace(/\./g, "_");
          window.location.hash = "#" + route + "/form/" + record.id;
        }
      }
    }
    onToggleRecord(record, checked) {
      if (checked) {
        this.state.selectedIds = [...this.state.selectedIds, record.id];
      } else {
        this.state.selectedIds = this.state.selectedIds.filter((id) => id !== record.id);
      }
    }
    onToggleAll(checked) {
      this.state.selectedIds = checked ? this.state.records.map((r) => r.id) : [];
    }
    async onDeleteRow(record) {
      const confirmed = await this._confirm("Delete this record?");
      if (!confirmed) return;
      const orm = this._orm;
      if (orm && typeof orm.unlink === "function") {
        await orm.unlink(this.props.resModel, [record.id]);
        await this.loadRecords();
      }
    }
    async onDeleteSelected() {
      if (!this.state.selectedIds.length) return;
      const confirmed = await this._confirm(
        `Delete ${this.state.selectedIds.length} record(s)?`
      );
      if (!confirmed) return;
      const orm = this._orm;
      if (orm && typeof orm.unlink === "function") {
        await orm.unlink(this.props.resModel, this.state.selectedIds);
        this.state.selectedIds = [];
        await this.loadRecords();
      }
    }
    onNew() {
      const model = this.props.resModel;
      if (model) {
        const route = model.replace(/\./g, "_");
        window.location.hash = "#" + route + "/new";
      }
    }
    _confirm(message) {
      const DS = window.AppCore && window.AppCore.DialogService;
      if (DS && typeof DS.confirm === "function") {
        return DS.confirm({ title: "Confirm", body: message });
      }
      return Promise.resolve(window.confirm(message));
    }
  };
  viewRegistry.add("list", {
    type: "list",
    Controller: ListController,
    Renderer: ListRenderer,
    searchMenuTypes: ["filter", "groupBy", "favorite"]
  });
  window.AppCore = window.AppCore || {};
  window.AppCore.ListController = ListController;

  // addons/web/static/src/app/views/form/form_renderer.js
  var owl7 = window.owl;
  var { Component: Component6, xml: xml6 } = owl7;
  function formatValue(field, value, record) {
    const fieldReg = window.Services && window.Services.fieldRegistry;
    if (fieldReg && typeof fieldReg.format === "function") {
      try {
        return fieldReg.format(field.name || field, value, record, field);
      } catch (_e) {
      }
    }
    if (value == null) return "";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) {
      return value.map((v) => Array.isArray(v) ? v[1] || v[0] : String(v)).join(", ");
    }
    return String(value);
  }
  function isTextField(type) {
    return ["text", "html"].includes(type);
  }
  function isDateField(type) {
    return ["date", "datetime"].includes(type);
  }
  function isNumericField(type) {
    return ["integer", "float", "monetary"].includes(type);
  }
  var FormRenderer = class extends Component6 {
    static template = xml6`
    <div class="o-form-renderer o-form-sheet">
      <t t-foreach="fieldGroups" t-as="group" t-key="group_index">
        <div class="o-form-group">
          <t t-foreach="group" t-as="field" t-key="field.name">
            <div class="o-form-row"
                 t-att-class="{ 'o-form-row--readonly': !props.editMode }">
              <label class="o-form-label"
                     t-att-for="'field-' + field.name">
                <t t-esc="field.label || field.name"/>
                <t t-if="field.required and props.editMode">
                  <span class="o-field-required" aria-hidden="true"> *</span>
                </t>
              </label>
              <div class="o-form-field"
                   t-att-class="'o-form-field--' + (field.type || 'char')">
                <t t-if="!props.editMode">
                  <span class="o-field-value"
                        t-att-class="{ 'o-field-empty': !getDisplayValue(field) }">
                    <t t-esc="getDisplayValue(field) || '-'"/>
                  </span>
                </t>
                <t t-elif="field.type === 'boolean'">
                  <input type="checkbox"
                         t-att-id="'field-' + field.name"
                         t-att-checked="props.record[field.name] ? '' : null"
                         t-on-change="(ev) => onFieldChange(field, ev.target.checked)"/>
                </t>
                <t t-elif="isTextField(field.type)">
                  <textarea class="o-field-textarea o-field-input"
                            t-att-id="'field-' + field.name"
                            t-att-name="field.name"
                            t-on-change="(ev) => onFieldChange(field, ev.target.value)">
                    <t t-esc="props.record[field.name] || ''"/>
                  </textarea>
                </t>
                <t t-elif="isNumericField(field.type)">
                  <input type="number"
                         class="o-field-input o-field-numeric"
                         t-att-id="'field-' + field.name"
                         t-att-name="field.name"
                         t-att-value="props.record[field.name] ?? ''"
                         t-on-change="(ev) => onFieldChange(field, ev.target.valueAsNumber)"/>
                </t>
                <t t-elif="field.type === 'selection' and field.selection">
                  <select class="o-field-input o-field-select"
                          t-att-id="'field-' + field.name"
                          t-att-name="field.name"
                          t-on-change="(ev) => onFieldChange(field, ev.target.value)">
                    <option value="">-</option>
                    <t t-foreach="field.selection" t-as="opt" t-key="opt[0]">
                      <option t-att-value="opt[0]"
                              t-att-selected="props.record[field.name] === opt[0] ? '' : null">
                        <t t-esc="opt[1]"/>
                      </option>
                    </t>
                  </select>
                </t>
                <t t-else="">
                  <input type="text"
                         class="o-field-input"
                         t-att-id="'field-' + field.name"
                         t-att-name="field.name"
                         t-att-value="props.record[field.name] ?? ''"
                         t-att-type="isDateField(field.type) ? (field.type === 'datetime' ? 'datetime-local' : 'date') : 'text'"
                         t-on-change="(ev) => onFieldChange(field, ev.target.value)"/>
                </t>
              </div>
            </div>
          </t>
        </div>
      </t>
    </div>`;
    static props = {
      record: Object,
      fields: Array,
      editMode: Boolean,
      onFieldChange: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    isTextField = isTextField;
    isNumericField = isNumericField;
    isDateField = isDateField;
    get fieldGroups() {
      const fields = this.props.fields || [];
      const groups = [];
      for (let i = 0; i < fields.length; i += 2) {
        groups.push(fields.slice(i, i + 2));
      }
      return groups.length ? groups : [fields];
    }
    getDisplayValue(field) {
      const value = this.props.record[field.name];
      return formatValue(field, value, this.props.record);
    }
    onFieldChange(field, value) {
      if (typeof this.props.onFieldChange === "function") {
        this.props.onFieldChange(field.name, value);
      }
    }
  };
  window.AppCore = window.AppCore || {};
  window.AppCore.FormRenderer = FormRenderer;

  // addons/web/static/src/app/views/form/form_controller.js
  var owl8 = window.owl;
  var { Component: Component7, useState: useState5, xml: xml7, onMounted: onMounted5, useEnv: useEnv3 } = owl8;
  var FormController = class extends Component7 {
    static template = xml7`
    <div class="o-form-controller o-form-view">
      <div class="o-form-header">
        <div class="o-form-breadcrumb-slot">
          <span class="o-form-model-label"><t t-esc="state.title"/></span>
          <t t-if="state.record.id">
            <span class="o-form-record-name"><t t-esc="state.record.display_name || state.record.name || ('#' + state.record.id)"/></span>
          </t>
        </div>
        <div class="o-form-button-box">
          <t t-if="!state.editMode">
            <button type="button" class="o-btn o-btn-primary" t-on-click="startEdit">Edit</button>
            <button type="button" class="o-btn o-btn-secondary" t-on-click="onBack">&#8592; Back</button>
          </t>
          <t t-else="">
            <button type="button" class="o-btn o-btn-primary" t-on-click="onSave"
                    t-att-disabled="state.saving ? '' : null">
              <t t-if="state.saving">Saving…</t>
              <t t-else="">Save</t>
            </button>
            <button type="button" class="o-btn o-btn-secondary" t-on-click="onDiscard">Discard</button>
          </t>
        </div>
      </div>
      <t t-if="state.loading">
        <div class="o-form-loading o-skeleton-msg">Loading…</div>
      </t>
      <t t-elif="state.error">
        <div class="o-error-panel__muted"><t t-esc="state.error"/></div>
      </t>
      <t t-else="">
        <FormRenderer
          record="state.record"
          fields="state.fields"
          editMode="state.editMode"
          onFieldChange="onFieldChange"/>
      </t>
    </div>`;
    static components = { FormRenderer };
    static props = {
      resModel: String,
      resId: { type: [Number, String], optional: true },
      domain: { type: Array, optional: true },
      context: { type: Object, optional: true },
      onSaved: { type: Function, optional: true },
      onBack: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    setup() {
      this.env = useEnv3();
      this._orm = window.Services && window.Services.orm || null;
      this.state = useState5({
        title: this._titleFor(this.props.resModel),
        record: {},
        fields: [],
        editMode: !this.props.resId,
        // New records start in edit
        loading: !!this.props.resId,
        saving: false,
        error: null
      });
      this._pendingChanges = {};
      onMounted5(() => {
        if (this.props.resId) {
          this._loadRecord(this.props.resId);
        } else {
          this._loadDefaultFields();
        }
      });
    }
    _titleFor(model) {
      if (!model) return "Form";
      const parts = String(model).split(".");
      return parts[parts.length - 1].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    async _loadRecord(id) {
      const orm = this._orm;
      if (!orm) {
        this.state.loading = false;
        return;
      }
      this.state.loading = true;
      this.state.error = null;
      try {
        const fields = await this._getFields();
        const fieldNames = fields.map((f) => f.name).filter(Boolean);
        const records = await orm.read(this.props.resModel, [Number(id)], fieldNames);
        const record = (Array.isArray(records) ? records : [])[0] || {};
        this.state.record = record;
        this.state.fields = fields;
        this._pendingChanges = {};
      } catch (err) {
        this.state.error = "Failed to load record: " + (err && err.message ? err.message : String(err));
      } finally {
        this.state.loading = false;
      }
    }
    async _loadDefaultFields() {
      const fields = await this._getFields();
      this.state.fields = fields;
      this.state.record = {};
    }
    async _getFields() {
      const views = window.Services && window.Services.views;
      if (views && typeof views.getView === "function") {
        const formView = views.getView(this.props.resModel, "form");
        if (formView && formView.fields) {
          return Object.entries(formView.fields).map(
            ([name, meta]) => Object.assign({ name }, typeof meta === "object" ? meta : { type: meta })
          );
        }
      }
      if (views && typeof views.getFieldsMeta === "function") {
        const meta = views.getFieldsMeta(this.props.resModel);
        if (meta && typeof meta === "object") {
          return Object.entries(meta).map(
            ([name, info]) => Object.assign({ name }, typeof info === "object" ? info : {})
          );
        }
      }
      return [{ name: "name", label: "Name", type: "char" }];
    }
    startEdit() {
      this._pendingChanges = {};
      this.state.editMode = true;
    }
    onFieldChange(fieldName, value) {
      this._pendingChanges[fieldName] = value;
      this.state.record = Object.assign({}, this.state.record, { [fieldName]: value });
    }
    async onSave() {
      const orm = this._orm;
      if (!orm) return;
      this.state.saving = true;
      this.state.error = null;
      try {
        const changes = this._pendingChanges;
        const id = this.state.record.id;
        if (id) {
          await orm.write(this.props.resModel, [id], changes);
        } else {
          const newId = await orm.create(this.props.resModel, [changes]);
          await this._loadRecord(newId);
        }
        this._pendingChanges = {};
        this.state.editMode = false;
        if (typeof this.props.onSaved === "function") {
          this.props.onSaved(this.state.record);
        }
      } catch (err) {
        this.state.error = "Save failed: " + (err && err.message ? err.message : String(err));
      } finally {
        this.state.saving = false;
      }
    }
    onDiscard() {
      this._pendingChanges = {};
      if (this.state.record.id) {
        this._loadRecord(this.state.record.id);
      } else {
        this.state.record = {};
      }
      this.state.editMode = false;
      this.state.error = null;
    }
    onBack() {
      if (typeof this.props.onBack === "function") {
        this.props.onBack();
      } else {
        window.history.back();
      }
    }
  };
  viewRegistry.add("form", {
    type: "form",
    Controller: FormController,
    Renderer: FormRenderer,
    searchMenuTypes: ["filter", "favorite"]
  });
  window.AppCore = window.AppCore || {};
  window.AppCore.FormController = FormController;

  // addons/web/static/src/app/views/kanban/kanban_controller.js
  var owl9 = window.owl;
  var { Component: Component8, useState: useState6, xml: xml8, onMounted: onMounted6, onPatched: onPatched3, useRef: useRef5, useEnv: useEnv4 } = owl9;
  var KanbanController = class extends Component8 {
    static template = xml8`
    <div class="o-kanban-controller o-kanban-view" t-ref="root">
      <div class="o-kanban-header">
        <h2 class="o-kanban-title"><t t-esc="title"/></h2>
        <button type="button" class="o-btn o-btn-primary" t-on-click="onNew">New</button>
      </div>
      <div class="o-kanban-content" t-ref="kanbanContent"/>
    </div>`;
    static props = {
      resModel: String,
      domain: { type: Array, optional: true },
      context: { type: Object, optional: true },
      groupBy: { type: String, optional: true },
      onOpenRecord: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    setup() {
      this.env = useEnv4();
      this.rootRef = useRef5("root");
      this.contentRef = useRef5("kanbanContent");
      this.state = useState6({ loading: false });
      this._lastDomainJson = "";
      onMounted6(() => {
        this._renderLegacy();
      });
      onPatched3(() => {
        var d = JSON.stringify(this.props.domain || []);
        if (d !== this._lastDomainJson) {
          this._lastDomainJson = d;
          this._renderLegacy();
        }
      });
    }
    get title() {
      const parts = String(this.props.resModel || "").split(".");
      return parts[parts.length - 1].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    _renderLegacy() {
      const KVM = window.AppCore && window.AppCore.KanbanViewModule;
      const el = this.contentRef.el;
      if (!el) return;
      if (KVM && typeof KVM.render === "function") {
        KVM.render(el, {
          model: this.props.resModel,
          domain: this.props.domain || [],
          context: this.props.context || {},
          groupBy: this.props.groupBy || null,
          rpc: window.Services && window.Services.rpc,
          viewsSvc: window.Services && window.Services.views
        });
      } else {
        el.innerHTML = '<p class="o-skeleton-msg">Kanban view loading\u2026</p>';
      }
    }
    onNew() {
      const model = this.props.resModel;
      if (model) {
        window.location.hash = "#" + model.replace(/\./g, "_") + "/new";
      }
    }
  };
  viewRegistry.add("kanban", {
    type: "kanban",
    Controller: KanbanController,
    searchMenuTypes: ["filter", "groupBy", "favorite"]
  });
  window.AppCore = window.AppCore || {};
  window.AppCore.KanbanController = KanbanController;

  // addons/web/static/src/app/search/search_bar.js
  var owl10 = window.owl;
  var { Component: Component9, useState: useState7, xml: xml9, useRef: useRef6, useEnv: useEnv5, onWillUnmount: onWillUnmount4 } = owl10;
  var SearchBar = class extends Component9 {
    static template = xml9`
    <div class="o-search-bar-owl" role="search">
      <div class="o-search-bar-facets">
        <t t-foreach="facets" t-as="facet" t-key="facet_index">
          <span class="o-facet-chip">
            <t t-if="facet.type and facet.type !== 'custom'">
              <span class="o-facet-type-label"><t t-esc="facet.type"/>&nbsp;&#x2192;&nbsp;</span>
            </t>
            <span class="o-facet-chip-label" t-att-title="facet.label"><t t-esc="facet.label"/></span>
            <t t-if="facet.value != null">
              <span class="o-facet-chip-value">: <t t-esc="facet.value"/></span>
            </t>
            <t t-if="facet.removable !== false">
              <button type="button"
                      class="o-facet-chip-remove"
                      t-att-aria-label="'Remove filter: ' + facet.label"
                      t-on-click="() => removeFacet(facet_index)">&#x2715;</button>
            </t>
          </span>
        </t>
        <input t-ref="input"
               type="text"
               class="o-search-bar-input"
               t-att-value="state.term"
               placeholder="Search…"
               aria-label="Search"
               autocomplete="off"
               t-att-aria-expanded="state.suggestionsOpen ? 'true' : 'false'"
               aria-haspopup="listbox"
               t-on-input="onInput"
               t-on-keydown="onKeyDown"
               t-on-focus="onFocus"
               t-on-blur="onBlur"/>
      </div>
      <button type="button"
              class="o-btn o-btn-primary o-search-bar-submit"
              aria-label="Search"
              t-on-click="onSearch">
        &#128269;
      </button>
      <t t-if="props.searchPanelToggle">
        <button type="button"
                class="o-btn o-btn-secondary o-search-panel-toggle"
                t-att-class="{ 'active': props.searchPanelOpen }"
                aria-label="Toggle search panel"
                t-on-click="props.onToggleSearchPanel">
          &#9776;
        </button>
      </t>
      <t t-if="state.suggestionsOpen and state.suggestions.length">
        <ul class="o-search-suggestions" role="listbox" aria-label="Search suggestions">
          <t t-foreach="state.suggestions" t-as="suggestion" t-key="suggestion_index">
            <li class="o-search-suggestion"
                t-att-class="{ 'o-search-suggestion--active': state.activeSuggestion === suggestion_index }"
                role="option"
                t-att-aria-selected="state.activeSuggestion === suggestion_index ? 'true' : 'false'"
                t-on-mousedown.prevent="() => applySuggestion(suggestion)">
              <span class="o-suggestion-type"><t t-esc="suggestion.type || 'Search'"/></span>
              <span class="o-suggestion-label"><t t-esc="suggestion.label"/></span>
            </li>
          </t>
        </ul>
      </t>
    </div>`;
    static props = {
      searchModel: { type: Object, optional: true },
      onSearch: { type: Function, optional: true },
      searchFields: { type: Array, optional: true },
      searchPanelToggle: { type: Boolean, optional: true },
      searchPanelOpen: { type: Boolean, optional: true },
      onToggleSearchPanel: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    setup() {
      this.inputRef = useRef6("input");
      this.state = useState7({
        term: "",
        suggestions: [],
        suggestionsOpen: false,
        activeSuggestion: -1
      });
      this._debouncedSuggest = useDebounce(this._buildSuggestions.bind(this), 200);
      useExternalListener(document, "click", this.onDocumentClick.bind(this));
    }
    get facets() {
      const sm = this.props.searchModel;
      if (sm && typeof sm.getFacets === "function") {
        return sm.getFacets();
      }
      return [];
    }
    onInput(ev) {
      this.state.term = ev.target.value;
      if (this.state.term.length >= 1) {
        this._debouncedSuggest(this.state.term);
      } else {
        this.state.suggestions = [];
        this.state.suggestionsOpen = false;
      }
    }
    onFocus() {
      if (this.state.term.length >= 1) {
        this._debouncedSuggest(this.state.term);
      }
    }
    onBlur() {
    }
    _buildSuggestions(term) {
      const suggestions = [];
      suggestions.push({ type: "Search", label: term, facet: { type: "search", label: term, value: term } });
      const fields = this.props.searchFields || [];
      fields.forEach((field) => {
        if (!field || !field.label) return;
        suggestions.push({
          type: field.label,
          label: term,
          facet: {
            type: "field",
            name: field.name,
            operator: field.operator || "ilike",
            value: term,
            label: `${field.label}: ${term}`,
            removable: true
          }
        });
      });
      this.state.suggestions = suggestions;
      this.state.suggestionsOpen = true;
      this.state.activeSuggestion = suggestions.length > 0 ? 0 : -1;
    }
    onKeyDown(ev) {
      const { suggestions, activeSuggestion, suggestionsOpen } = this.state;
      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        this.state.activeSuggestion = Math.min(activeSuggestion + 1, suggestions.length - 1);
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        this.state.activeSuggestion = Math.max(activeSuggestion - 1, 0);
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        if (suggestionsOpen && suggestions[activeSuggestion]) {
          this.applySuggestion(suggestions[activeSuggestion]);
        } else {
          this.onSearch();
        }
      } else if (ev.key === "Escape") {
        this.closeList();
      } else if (ev.key === "Backspace" && !this.state.term) {
        const facets = this.facets;
        if (facets.length) this.removeFacet(facets.length - 1);
      }
    }
    applySuggestion(suggestion) {
      const sm = this.props.searchModel;
      if (sm && suggestion.facet && typeof sm.addFacet === "function") {
        sm.addFacet(suggestion.facet);
      }
      this.state.term = "";
      this.closeList();
      if (this.inputRef.el) this.inputRef.el.value = "";
      this._triggerSearch();
    }
    removeFacet(idx) {
      const sm = this.props.searchModel;
      if (sm && typeof sm.removeFacet === "function") {
        sm.removeFacet(idx);
        this._triggerSearch();
      }
    }
    onSearch() {
      const term = this.state.term;
      if (term) {
        const sm = this.props.searchModel;
        if (sm && typeof sm.setSearchTerm === "function") {
          sm.setSearchTerm(term);
        }
      }
      this.state.term = "";
      if (this.inputRef.el) this.inputRef.el.value = "";
      this.closeList();
      this._triggerSearch();
    }
    _triggerSearch() {
      if (typeof this.props.onSearch === "function") {
        const sm = this.props.searchModel;
        const domain = sm && typeof sm.getDomain === "function" ? sm.getDomain() : [];
        this.props.onSearch({ domain, term: this.state.term });
      }
    }
    closeList() {
      this.state.suggestionsOpen = false;
    }
    onDocumentClick(ev) {
      if (!this.state.suggestionsOpen) return;
      const input = this.inputRef.el;
      const root = input && input.closest(".o-search-bar-owl");
      if (root && !root.contains(ev.target)) this.closeList();
    }
  };
  window.AppCore = window.AppCore || {};
  window.AppCore.SearchBarOWL = SearchBar;

  // addons/web/static/src/app/core/dropdown.js
  var owl11 = window.owl;
  var { Component: Component10, useState: useState8, xml: xml10, useRef: useRef7, onMounted: onMounted7, onWillUnmount: onWillUnmount5, useEnv: useEnv6 } = owl11;
  var DropdownItem = class extends Component10 {
    static template = xml10`
    <li class="o-dropdown-item"
        t-att-class="{ 'o-dropdown-item--disabled': props.disabled }"
        role="menuitem"
        t-att-tabindex="props.disabled ? '-1' : '0'"
        t-on-click="onClick"
        t-on-keydown="onKeyDown">
      <t t-slot="default"/>
    </li>`;
    static props = {
      disabled: { type: Boolean, optional: true },
      onSelected: { type: Function, optional: true },
      payload: { optional: true },
      slots: { type: Object, optional: true }
    };
    onClick(ev) {
      if (this.props.disabled) return;
      if (typeof this.props.onSelected === "function") {
        this.props.onSelected(this.props.payload);
      }
    }
    onKeyDown(ev) {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        this.onClick(ev);
      }
    }
  };
  var Dropdown = class extends Component10 {
    static template = xml10`
    <div class="o-dropdown" t-att-class="{ 'o-dropdown--open': state.open }">
      <div class="o-dropdown-toggle"
           t-att-aria-expanded="state.open ? 'true' : 'false'"
           t-att-aria-haspopup="'listbox'"
           t-on-click="toggleOpen"
           t-on-keydown="onToggleKeyDown">
        <t t-slot="default"/>
      </div>
      <t t-if="state.open">
        <div class="o-dropdown-menu" role="menu" t-ref="menu">
          <ul class="o-dropdown-list">
            <t t-slot="menu"/>
          </ul>
        </div>
      </t>
    </div>`;
    static components = { DropdownItem };
    static props = {
      toggleClass: { type: String, optional: true },
      menuClass: { type: String, optional: true },
      position: { type: String, optional: true },
      // bottom-start | bottom-end | top-start | top-end
      slots: { type: Object, optional: true }
    };
    setup() {
      this.state = useState8({ open: false });
      this.menuRef = useRef7("menu");
      useExternalListener(document, "click", this.onDocumentClick.bind(this));
      useExternalListener(document, "keydown", this.onDocumentKeyDown.bind(this));
    }
    toggleOpen() {
      this.state.open = !this.state.open;
      if (this.state.open) {
        Promise.resolve().then(() => {
          const menu = this.menuRef.el;
          if (menu) {
            const first = menu.querySelector('[role="menuitem"]');
            if (first) first.focus();
          }
        });
      }
    }
    close() {
      this.state.open = false;
    }
    onDocumentClick(ev) {
      if (!this.state.open) return;
      const root = this.__owl__.bdom && this.__owl__.bdom.el;
      if (root && !root.contains(ev.target)) {
        this.close();
      }
    }
    onDocumentKeyDown(ev) {
      if (!this.state.open) return;
      if (ev.key === "Escape") {
        ev.preventDefault();
        this.close();
      }
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        ev.preventDefault();
        const menu = this.menuRef.el;
        if (!menu) return;
        const items = Array.from(menu.querySelectorAll('[role="menuitem"]:not([tabindex="-1"])'));
        const active = document.activeElement;
        const idx = items.indexOf(active);
        const next = ev.key === "ArrowDown" ? items[idx + 1] || items[0] : items[idx - 1] || items[items.length - 1];
        if (next) next.focus();
      }
    }
    onToggleKeyDown(ev) {
      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        if (!this.state.open) this.toggleOpen();
      }
    }
  };
  window.AppCore = window.AppCore || {};
  window.AppCore.Dropdown = Dropdown;
  window.AppCore.DropdownItem = DropdownItem;

  // addons/web/static/src/app/search/control_panel.js
  var owl12 = window.owl;
  var { Component: Component11, useState: useState9, xml: xml11, useEnv: useEnv7 } = owl12;
  var Breadcrumbs = class extends Component11 {
    static template = xml11`
    <nav class="o-control-panel-breadcrumbs" aria-label="Breadcrumb">
      <t t-foreach="props.breadcrumbs" t-as="crumb" t-key="crumb_index">
        <t t-if="crumb_index > 0">
          <span class="o-breadcrumb-sep" aria-hidden="true">/</span>
        </t>
        <t t-if="crumb_index < props.breadcrumbs.length - 1">
          <a class="o-breadcrumb-item"
             href="#"
             t-att-title="crumb.name"
             t-on-click.prevent="() => onCrumbClick(crumb, crumb_index)">
            <t t-esc="crumb.name"/>
          </a>
        </t>
        <t t-else="">
          <span class="o-breadcrumb-item o-breadcrumb-current" aria-current="page">
            <t t-esc="crumb.name"/>
          </span>
        </t>
      </t>
    </nav>`;
    static props = {
      breadcrumbs: Array,
      onBreadcrumbClick: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    onCrumbClick(crumb, idx) {
      if (typeof this.props.onBreadcrumbClick === "function") {
        this.props.onBreadcrumbClick(crumb, idx);
      }
    }
  };
  var ViewSwitcher = class extends Component11 {
    static template = xml11`
    <div class="o-view-switcher" role="toolbar" aria-label="View type">
      <t t-foreach="props.views" t-as="view" t-key="view.type">
        <button type="button"
                class="o-view-switcher-btn"
                t-att-class="{ 'o-view-switcher-btn--active': props.activeView === view.type }"
                t-att-aria-pressed="props.activeView === view.type ? 'true' : 'false'"
                t-att-aria-label="view.label || view.type"
                t-att-title="view.label || view.type"
                t-on-click="() => onSwitch(view.type)">
          <t t-esc="view.icon || viewIcon(view.type)"/>
        </button>
      </t>
    </div>`;
    static props = {
      views: Array,
      activeView: String,
      onViewSwitch: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    viewIcon(type) {
      const icons = { list: "\u2261", form: "\u229E", kanban: "\u2B1B", graph: "\u25A6", pivot: "\u229F", calendar: "\u{1F4C5}", gantt: "\u2550" };
      return icons[type] || type.charAt(0).toUpperCase();
    }
    onSwitch(type) {
      if (typeof this.props.onViewSwitch === "function") {
        this.props.onViewSwitch(type);
      }
    }
  };
  var ActionMenu = class extends Component11 {
    static template = xml11`
    <Dropdown>
      <button type="button" class="o-btn o-btn-secondary o-action-menu-btn">
        Actions &#9660;
      </button>
      <t t-set-slot="menu">
        <t t-foreach="props.items" t-as="item" t-key="item.label">
          <DropdownItem onSelected="() => item.action()">
            <t t-esc="item.label"/>
          </DropdownItem>
        </t>
      </t>
    </Dropdown>`;
    static components = { Dropdown, DropdownItem };
    static props = {
      items: Array,
      slots: { type: Object, optional: true }
    };
  };
  var ControlPanel = class extends Component11 {
    static template = xml11`
    <div class="o-control-panel">
      <div class="o-control-panel-main">
        <Breadcrumbs
          breadcrumbs="props.breadcrumbs || []"
          onBreadcrumbClick="props.onBreadcrumbClick"/>
        <div class="o-control-panel-center">
          <t t-if="props.views and props.views.length > 1">
            <ViewSwitcher
              views="props.views"
              activeView="props.activeView || ''"
              onViewSwitch="props.onViewSwitch"/>
          </t>
          <SearchBar
            searchModel="props.searchModel"
            searchFields="props.searchFields"
            onSearch="props.onSearch"
            searchPanelToggle="props.searchPanelToggle"
            searchPanelOpen="props.searchPanelOpen"
            onToggleSearchPanel="props.onToggleSearchPanel"/>
        </div>
        <div class="o-control-panel-actions">
          <t t-if="props.actionMenuItems and props.actionMenuItems.length">
            <ActionMenu items="props.actionMenuItems"/>
          </t>
          <t t-slot="actionButtons"/>
        </div>
      </div>
      <t t-if="hasPager">
        <div class="o-control-panel-pager">
          <Pager
            offset="props.pager.offset"
            limit="props.pager.limit"
            total="props.pager.total"
            onUpdate="props.pager.onUpdate"
            isLoading="props.pager.loading"/>
        </div>
      </t>
    </div>`;
    static components = { Breadcrumbs, ViewSwitcher, SearchBar, ActionMenu, Pager };
    static props = {
      /** Breadcrumb items: [{ name, action? }] */
      breadcrumbs: { type: Array, optional: true },
      onBreadcrumbClick: { type: Function, optional: true },
      /** Available view types: [{ type, label, icon }] */
      views: { type: Array, optional: true },
      activeView: { type: String, optional: true },
      onViewSwitch: { type: Function, optional: true },
      /** SearchBar */
      searchModel: { type: Object, optional: true },
      searchFields: { type: Array, optional: true },
      onSearch: { type: Function, optional: true },
      /** Search panel toggle button */
      searchPanelToggle: { type: Boolean, optional: true },
      searchPanelOpen: { type: Boolean, optional: true },
      onToggleSearchPanel: { type: Function, optional: true },
      /** Action menu items: [{ label, action }] */
      actionMenuItems: { type: Array, optional: true },
      /** Pager: { offset, limit, total, onUpdate, loading } */
      pager: { type: Object, optional: true },
      slots: { type: Object, optional: true }
    };
    get hasPager() {
      const p = this.props.pager;
      return p && p.total > 0;
    }
  };
  window.AppCore = window.AppCore || {};
  Object.assign(window.AppCore, {
    ControlPanel,
    Breadcrumbs,
    ViewSwitcher,
    ActionMenu
  });

  // addons/web/static/src/app/search/with_search.js
  var owl13 = window.owl;
  var { Component: Component12, useState: useState10, xml: xml12, onMounted: onMounted8, onWillUnmount: onWillUnmount6 } = owl13;
  function createSearchModel(resModel, opts) {
    opts = opts || {};
    const SM = window.AppCore && window.AppCore.SearchModel || window.__ERP_SearchLayer && window.__ERP_SearchLayer.SearchModel;
    if (!SM) {
      return {
        model: resModel,
        getFacets: () => [],
        getDomain: () => [],
        getGroupBy: () => null,
        getOrderBy: () => null,
        addFacet: () => {
        },
        removeFacet: () => {
        },
        setSearchTerm: () => {
        },
        setGroupBy: () => {
        },
        subscribe: () => {
        },
        _stubs: true
      };
    }
    const viewsSvc = opts.viewsSvc || window.Services && window.Services.views || null;
    const sm = new SM(resModel, viewsSvc, opts.state || {});
    if (opts.context) sm.applyDefaultsFromContext(opts.context);
    sm.getDomain = function(actionDomain) {
      return sm.buildDomain({ actionDomain: actionDomain || [] });
    };
    sm.getGroupBy = function() {
      return sm.state.groupBy || null;
    };
    sm.getOrderBy = function() {
      return sm.state.orderBy || null;
    };
    return sm;
  }
  function WithSearch(Controller, options) {
    options = options || {};
    const formMode = !!options.formMode;
    class WithSearchWrapper extends Component12 {
      static template = xml12`
      <div class="o-with-search">
        <ControlPanel t-props="controlPanelProps"/>
        <t t-component="InnerController"
           t-props="innerProps"
           t-ref="innerRef"/>
      </div>`;
      static components = { ControlPanel, InnerController: Controller };
      static props = {
        resModel: String,
        resId: { type: [Number, String], optional: true },
        domain: { type: Array, optional: true },
        context: { type: Object, optional: true },
        viewType: { type: String, optional: true },
        columns: { type: Array, optional: true },
        limit: { type: Number, optional: true },
        onOpenRecord: { type: Function, optional: true },
        onSaved: { type: Function, optional: true },
        onBack: { type: Function, optional: true },
        slots: { type: Object, optional: true }
      };
      setup() {
        const resModel = this.props.resModel;
        this._sm = createSearchModel(resModel, {
          context: this.props.context,
          state: {}
        });
        var viewsChrome = [];
        if (formMode) {
          viewsChrome = [{ type: "form", label: "Form" }];
        } else if (options.searchMenuTypes) {
          viewsChrome = [{ type: "list", label: "List" }, { type: "kanban", label: "Kanban" }];
        }
        this.state = useState10({
          domain: this._computeDomain(),
          breadcrumbs: [{ name: this._titleFor(resModel) }],
          availableViews: viewsChrome,
          pagerProps: null
        });
        this._unsubscribe = null;
        if (typeof this._sm.subscribe === "function") {
          this._sm.subscribe(() => {
            this.state.domain = this._computeDomain();
          });
        }
        onWillUnmount6(() => {
          if (typeof this._unsubscribe === "function") this._unsubscribe();
        });
      }
      _computeDomain() {
        const base = this.props.domain || [];
        if (typeof this._sm.getDomain === "function") {
          return this._sm.getDomain(base);
        }
        return base;
      }
      _titleFor(model) {
        if (!model) return formMode ? "Form" : "List";
        const parts = String(model).split(".");
        return parts[parts.length - 1].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }
      get activeViewKey() {
        return this.props.viewType || (formMode ? "form" : "list");
      }
      get controlPanelProps() {
        return {
          breadcrumbs: this.state.breadcrumbs,
          views: this.state.availableViews,
          activeView: this.activeViewKey,
          searchModel: this._sm,
          onSearch: this.onSearch.bind(this),
          onViewSwitch: this.onViewSwitch.bind(this),
          pager: this.state.pagerProps || void 0
        };
      }
      get innerProps() {
        return {
          resModel: this.props.resModel,
          resId: this.props.resId,
          domain: this.state.domain,
          context: this.props.context,
          columns: this.props.columns,
          limit: this.props.limit,
          onOpenRecord: this.props.onOpenRecord,
          onSaved: this.props.onSaved,
          onBack: this.props.onBack,
          searchModel: this._sm
        };
      }
      onSearch({ term, facets }) {
        if (term !== void 0 && typeof this._sm.setSearchTerm === "function") {
          this._sm.setSearchTerm(term);
        }
        if (Array.isArray(facets)) {
          facets.forEach((f) => this._sm.addFacet && this._sm.addFacet(f));
        }
        this.state.domain = this._computeDomain();
      }
      onViewSwitch(viewType) {
        const AB = window.AppCore && window.AppCore.ActionBus;
        if (AB) {
          AB.trigger("ACTION_MANAGER:UPDATE", {
            viewType,
            resModel: this.props.resModel,
            props: { domain: this.state.domain, context: this.props.context }
          });
        }
      }
    }
    WithSearchWrapper.displayName = `WithSearch(${Controller.name || "Controller"})`;
    return WithSearchWrapper;
  }
  window.AppCore = window.AppCore || {};
  window.AppCore.WithSearch = WithSearch;
  window.AppCore.createSearchModel = createSearchModel;

  // addons/web/static/src/app/action_container.js
  var owl14 = window.owl;
  var { Component: Component13, useState: useState11, xml: xml13, onMounted: onMounted9, onWillUnmount: onWillUnmount7, useRef: useRef8 } = owl14;
  var ListWithSearch = WithSearch(ListController, { searchMenuTypes: ["filter", "groupBy", "favorite"] });
  var KanbanWithSearch = WithSearch(KanbanController, { searchMenuTypes: ["filter", "groupBy", "favorite"] });
  var FormWithSearch = WithSearch(FormController, {
    formMode: true,
    searchMenuTypes: ["filter", "favorite"]
  });
  var _listeners = /* @__PURE__ */ new Map();
  var ActionBus = {
    on(event, handler) {
      if (!_listeners.has(event)) _listeners.set(event, /* @__PURE__ */ new Set());
      _listeners.get(event).add(handler);
      return () => _listeners.get(event).delete(handler);
    },
    trigger(event, detail) {
      const bucket = _listeners.get(event);
      if (bucket) bucket.forEach((fn) => {
        try {
          fn(detail);
        } catch (_e) {
        }
      });
      window.dispatchEvent(new CustomEvent("erp:action-update", { detail }));
    }
  };
  window.AppCore = window.AppCore || {};
  window.AppCore.ActionBus = ActionBus;
  var CONTROLLER_MAP = {
    list: ListWithSearch,
    form: FormWithSearch,
    kanban: KanbanWithSearch
  };
  var ActionContainer = class extends Component13 {
    static template = xml13`
    <div class="o-action-container" t-ref="root">
      <t t-if="state.componentInfo">
        <t t-component="state.componentInfo.Controller"
           t-props="state.componentInfo.props"
           t-key="state.componentInfo.key"/>
      </t>
      <t t-elif="state.loading">
        <div class="o-action-loading o-skeleton-msg">Loading…</div>
      </t>
      <t t-else="">
        <div class="o-action-placeholder"/>
      </t>
    </div>`;
    setup() {
      this.state = useState11({
        componentInfo: null,
        loading: false
      });
      this._unsubscribeBus = ActionBus.on("ACTION_MANAGER:UPDATE", this._onUpdate.bind(this));
      const onDomUpdate = (ev) => this._onUpdate(ev.detail);
      onMounted9(() => {
        window.__ERP_OWL_ACTION_CONTAINER_MOUNTED = true;
        window.addEventListener("erp:action-update", onDomUpdate);
      });
      onWillUnmount7(() => {
        window.__ERP_OWL_ACTION_CONTAINER_MOUNTED = false;
        this._unsubscribeBus();
        window.removeEventListener("erp:action-update", onDomUpdate);
      });
    }
    _onUpdate(detail) {
      if (!detail) return;
      const { type, viewType, resModel, resId, props } = detail;
      if (type === "clear") {
        this.state.componentInfo = null;
        return;
      }
      if (type === "loading") {
        this.state.loading = true;
        return;
      }
      this.state.loading = false;
      const vt = viewType || "list";
      let Controller = null;
      const descriptor = resolveViewDescriptor(vt, this.env);
      if (descriptor && descriptor.Controller) {
        Controller = descriptor.Controller;
        if (vt === "list" && Controller === ListController) {
          Controller = ListWithSearch;
        }
        if (vt === "kanban" && Controller === KanbanController) {
          Controller = KanbanWithSearch;
        }
        if (vt === "form" && Controller === FormController) {
          Controller = FormWithSearch;
        }
      } else {
        Controller = CONTROLLER_MAP[vt] || ListController;
      }
      const controllerProps = Object.assign(
        { resModel: resModel || "res.partner", viewType: vt },
        resId ? { resId } : {},
        props || {}
      );
      this.state.componentInfo = {
        Controller,
        props: controllerProps,
        key: viewType + "-" + resModel + "-" + (resId || "list") + "-" + Date.now()
      };
    }
  };
  ActionContainer.fallbackMount = function actionContainerFallbackMount(env, target) {
    window.__ERP_OWL_ACTION_CONTAINER_MOUNTED = false;
    if (target) {
      target.setAttribute("data-erp-owl-fallback", "1");
      target.classList.add("o-action-container--csp-fallback");
    }
    return {
      destroy() {
        if (target) {
          target.removeAttribute("data-erp-owl-fallback");
          target.classList.remove("o-action-container--csp-fallback");
        }
      },
      mode: "fallback"
    };
  };
  window.AppCore.ActionContainer = ActionContainer;

  // addons/web/static/src/app/debug_boot.js
  function erpDebugBootLog(event, detail) {
    try {
      if (typeof localStorage === "undefined" || localStorage.getItem("erp_debug_mode") !== "1") {
        return;
      }
      const payload = { ts: Date.now(), event: String(event || "unknown") };
      if (detail && typeof detail === "object") {
        Object.keys(detail).forEach(function(k) {
          payload[k] = detail[k];
        });
      }
      if (typeof console !== "undefined" && console.info) {
        console.info("[erp-debug-boot]", JSON.stringify(payload));
      }
    } catch (_e) {
    }
  }

  // addons/web/static/src/app/webclient.js
  var WebClient = class {
    constructor(env, target) {
      this.env = env;
      this.target = target;
      this.navbarApp = null;
      this.sidebarApp = null;
      this.actionContainerApp = null;
    }
    mount() {
      if (!this.target) return;
      const navbar = document.getElementById("navbar");
      const sidebar = document.getElementById("app-sidebar");
      const actionMgr = document.getElementById("action-manager");
      attachShellChrome(this.env);
      this.target.setAttribute("data-erp-runtime-version", this.env.bootstrap.version);
      this.target.classList.add("o-webclient-modern");
      this.env.services.router.start();
      const shellLoadDeadlineMs = 2e4;
      const shellLoadedOrTimeout = Promise.race([
        this.env.services.shell.load().then(function(r) {
          return { ok: true, result: r };
        }).catch(function(err) {
          erpDebugBootLog("shell_load_rejected", {
            message: err && err.message,
            stack: err && err.stack
          });
          return { ok: false, rejected: true };
        }),
        new Promise(function(resolve) {
          setTimeout(function() {
            resolve({ ok: false, timedOut: true });
          }, shellLoadDeadlineMs);
        })
      ]);
      shellLoadedOrTimeout.then(function(race) {
        if (race && race.timedOut) {
          erpDebugBootLog("shell_load_timeout", { deadlineMs: shellLoadDeadlineMs });
        }
      });
      shellLoadedOrTimeout.finally(() => {
        this.navbarApp = mountNavBar(this.env, navbar);
        this.sidebarApp = mountSidebar(this.env, sidebar);
        if (actionMgr) {
          mountComponent(ActionContainer, actionMgr, { env: this.env }).then((app) => {
            this.actionContainerApp = app;
          });
        }
        this._bootLegacyRuntime();
      });
    }
    _bootLegacyRuntime() {
      if (!this.env.bootstrap.legacyAdapterEnabled) return;
      if (!window.__erpLegacyRuntime || typeof window.__erpLegacyRuntime.start !== "function") return;
      if (window.__erpLegacyRuntime.booted) {
        this.env.state.legacyBooted = true;
        return;
      }
      window.__erpLegacyRuntime.start();
      this.env.state.legacyBooted = true;
    }
  };

  // addons/web/static/src/app/list_control_panel.js
  var list_control_panel_exports = {};
  __export(list_control_panel_exports, {
    buildListActionsHtml: () => buildListActionsHtml,
    buildQuickFiltersHtml: () => buildQuickFiltersHtml,
    buildSearchDropdownsHtml: () => buildSearchDropdownsHtml,
    buildSearchPanelAsideHtml: () => buildSearchPanelAsideHtml
  });
  function escHtml2(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function buildSearchDropdownsHtml(options) {
    var searchFilters = options.searchFilters || [];
    var activeFilters = options.activeFilters || [];
    var searchGroupBys = options.searchGroupBys || [];
    var currentGroupBy = options.currentGroupBy;
    var savedFiltersList = options.savedFiltersList || [];
    var dropdownsHtml = "";
    if (searchFilters.length) {
      dropdownsHtml += '<div class="o-cp-dropdown-wrap" data-cp-dd="1"><button type="button" class="o-cp-dropdown-toggle">Filters</button><div class="o-cp-dropdown-menu">';
      searchFilters.forEach(function(f) {
        var active = activeFilters.indexOf(f.name) >= 0;
        dropdownsHtml += '<button type="button" class="o-cp-dropdown-item cp-filter-item' + (active ? " active" : "") + '" data-filter-toggle="' + String(f.name || "").replace(/"/g, "&quot;") + '">' + escHtml2(f.string || f.name || "") + "</button>";
      });
      dropdownsHtml += "</div></div>";
    }
    if (searchGroupBys.length) {
      dropdownsHtml += '<div class="o-cp-dropdown-wrap" data-cp-dd="1"><button type="button" class="o-cp-dropdown-toggle">Group by</button><div class="o-cp-dropdown-menu">';
      dropdownsHtml += '<button type="button" class="o-cp-dropdown-item cp-groupby-item" data-group-by="">(None)</button>';
      searchGroupBys.forEach(function(g) {
        dropdownsHtml += '<button type="button" class="o-cp-dropdown-item cp-groupby-item' + (currentGroupBy === g.group_by ? " active" : "") + '" data-group-by="' + String(g.group_by || "").replace(/"/g, "&quot;") + '">' + escHtml2(g.string || g.name || "") + "</button>";
      });
      dropdownsHtml += "</div></div>";
    }
    dropdownsHtml += '<div class="o-cp-dropdown-wrap" data-cp-dd="1"><button type="button" class="o-cp-dropdown-toggle">Favorites</button><div class="o-cp-dropdown-menu">';
    savedFiltersList.forEach(function(sf) {
      dropdownsHtml += '<button type="button" class="o-cp-dropdown-item cp-fav-item" data-saved-filter-id="' + String(sf.id != null ? sf.id : "").replace(/"/g, "&quot;") + '">' + escHtml2(sf.name || "Filter") + "</button>";
    });
    dropdownsHtml += '<button type="button" class="o-cp-dropdown-item cp-save-fav" data-save-favorite="1">Save current search\u2026</button></div></div>';
    return dropdownsHtml;
  }
  function buildQuickFiltersHtml(options) {
    var searchFilters = options.searchFilters || [];
    var activeFilters = options.activeFilters || [];
    var searchGroupBys = options.searchGroupBys || [];
    var currentGroupBy = options.currentGroupBy;
    var savedFiltersList = options.savedFiltersList || [];
    var model = options.model || "";
    var currentListState = options.currentListState || {};
    var filtersHtml = "";
    searchFilters.forEach(function(f) {
      var active = activeFilters.indexOf(f.name) >= 0;
      filtersHtml += '<button type="button" class="btn-search-filter o-btn ' + (active ? "o-btn-primary active" : "o-btn-secondary") + '" data-filter="' + String(f.name || "").replace(/"/g, "&quot;") + '">' + escHtml2(f.string || f.name || "") + "</button>";
    });
    if (searchGroupBys.length) {
      filtersHtml += '<select id="list-group-by" class="o-list-select"><option value="">Group by</option>';
      searchGroupBys.forEach(function(g) {
        filtersHtml += '<option value="' + String(g.group_by || "").replace(/"/g, "&quot;") + '"' + (currentGroupBy === g.group_by ? " selected" : "") + ">" + escHtml2(g.string || g.name || "") + "</option>";
      });
      filtersHtml += "</select>";
    }
    filtersHtml += '<select id="list-saved-filter" class="o-list-select"><option value="">Saved filters</option>';
    savedFiltersList.forEach(function(f) {
      filtersHtml += '<option value="' + String(f.id != null ? f.id : "").replace(/"/g, "&quot;") + '"' + (currentListState.savedFilterId == f.id ? " selected" : "") + ">" + escHtml2(f.name || "Filter") + "</option>";
    });
    filtersHtml += "</select>";
    if (model === "crm.lead") {
      filtersHtml += '<select id="list-stage-filter" class="o-list-select"><option value="">All stages</option></select>';
    }
    return filtersHtml;
  }
  function buildSearchPanelAsideHtml(options) {
    var sections = options && options.sections || [];
    if (!sections.length) return "";
    var SP = typeof window !== "undefined" && window.UIComponents && window.UIComponents.SearchPanel;
    if (!SP || typeof SP.renderHTML !== "function") return "";
    return SP.renderHTML(sections);
  }
  function buildListActionsHtml(options) {
    var addLabel = options.addLabel || "Add";
    var reportName = options.reportName;
    var actionsHtml = "";
    actionsHtml += '<button type="button" id="btn-save-filter" class="o-btn o-btn-secondary">Save</button>';
    actionsHtml += '<button type="button" id="btn-export" class="o-btn o-btn-secondary">Export CSV</button>';
    actionsHtml += '<button type="button" id="btn-export-excel" class="o-btn o-btn-secondary">Export Excel</button>';
    actionsHtml += '<button type="button" id="btn-import" class="o-btn o-btn-secondary">Import</button>';
    if (reportName) actionsHtml += '<button type="button" id="btn-print" class="o-btn o-btn-secondary">Print</button>';
    if (reportName) actionsHtml += '<button type="button" id="btn-preview-pdf" class="o-btn o-btn-secondary">Preview</button>';
    actionsHtml += '<button type="button" id="btn-add" class="o-btn o-btn-primary">' + escHtml2(addLabel) + "</button>";
    return actionsHtml;
  }

  // addons/web/static/src/app/main.js
  var ListViewModule = __toESM(require_list_view_module());

  // addons/web/static/src/app/form_view_module.js
  (function() {
    function buildFormFooterHtml(opts) {
      var route = opts.route;
      var isNew = opts.isNew != null ? !!opts.isNew : !opts.id;
      var model = opts.model;
      var id = opts.id;
      var getReportName = opts.getReportName || function() {
        return null;
      };
      var FFA = window.AppCore && window.AppCore.FormFooterActions;
      if (FFA && typeof FFA.buildFormFooterActionsHtml === "function") {
        return FFA.buildFormFooterActionsHtml({
          route,
          isNew,
          model,
          reportName: !isNew ? getReportName(model) : null,
          recordId: id
        });
      }
      var html = '<p><button type="submit" id="btn-save" class="o-btn o-btn-primary o-shortcut-target" data-shortcut="Alt+S">Save</button> ';
      html += '<a href="#' + route + '" id="form-cancel" style="margin-left:0.5rem">Cancel</a>';
      if (isNew && (model === "crm.lead" || model === "res.partner")) {
        html += ' <button type="button" id="btn-ai-fill" title="Extract fields from pasted text" style="margin-left:0.5rem;padding:0.5rem 1rem;background:var(--color-accent,#6366f1);color:white;border:none;border-radius:4px;cursor:pointer">AI Fill</button>';
      }
      if (!isNew) {
        html += ' <button type="button" id="btn-duplicate" class="o-btn o-btn-secondary" style="margin-left:0.5rem">Duplicate</button>';
        var reportName = getReportName(model);
        if (reportName) {
          html += ' <a href="/report/html/' + reportName + "/" + id + '" target="_blank" rel="noopener" id="btn-print-form" class="o-btn o-btn-secondary o-shortcut-target" data-shortcut="Alt+P" style="margin-left:0.5rem;text-decoration:none">Print</a>';
          html += ' <button type="button" id="btn-preview-form" class="o-btn o-btn-secondary" style="margin-left:0.5rem">Preview</button>';
        }
        html += ' <a href="#" id="btn-delete-form" style="margin-left:0.5rem;font-size:0.9rem;color:#c00">Delete</a>';
      }
      html += "</p>";
      return html;
    }
    function buildAiSidebarHtml(opts) {
      var isNew = opts.isNew != null ? !!opts.isNew : !opts.id;
      var model = opts.model;
      if (!isNew && (model === "crm.lead" || model === "project.task" || model === "helpdesk.ticket")) {
        var html = '<aside id="form-ai-sidebar" class="form-ai-sidebar" style="min-width:240px;max-width:280px;padding:var(--space-lg);background:var(--color-bg);border:1px solid var(--border-color);border-radius:var(--radius-md)">';
        html += '<h3 style="margin:0 0 var(--space-md);font-size:1rem">AI Suggestions</h3>';
        html += '<div id="ai-suggestions-list" style="font-size:0.9rem;color:var(--text-muted)">';
        if (typeof opts.skeletonHtml === "function") {
          html += opts.skeletonHtml(3, true);
        } else {
          html += "<span>\u2026</span>";
        }
        html += "</div></aside>";
        return html;
      }
      return "";
    }
    function render(main, opts) {
      opts = opts || {};
      if (!main || !opts.model || !opts.route) return false;
      if (typeof opts.renderBreadcrumbs !== "function" || typeof opts.buildInnerHtml !== "function" || typeof opts.wireForm !== "function") {
        return false;
      }
      var route = opts.route;
      var id = opts.id;
      var isNew = opts.isNew != null ? !!opts.isNew : !id;
      var getTitle = opts.getTitle || function() {
        return "";
      };
      var title = getTitle(route);
      var formTitle = isNew ? "New " + title.slice(0, -1) : "Edit " + title.slice(0, -1);
      var html = opts.renderBreadcrumbs();
      html += "<h2>" + formTitle + "</h2>";
      html += '<div id="form-dirty-banner" class="form-dirty-banner" style="display:none">You have unsaved changes</div>';
      html += '<div class="form-with-sidebar" style="display:flex;gap:var(--space-xl);align-items:flex-start;flex-wrap:wrap">';
      html += '<form id="record-form" style="max-width:600px;flex:1;min-width:280px">';
      html += opts.buildInnerHtml();
      html += buildFormFooterHtml(opts);
      html += "</form>";
      html += buildAiSidebarHtml(opts);
      html += "</div>";
      main.innerHTML = html;
      opts.wireForm(main);
      return true;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.FormViewModule = {
      render
    };
  })();

  // addons/web/static/src/app/kanban_view_module.js
  (function() {
    function render(main, opts) {
      opts = opts || {};
      if (!main || !opts.model || !opts.route) return false;
      if (!window.ViewRenderers || typeof window.ViewRenderers.kanban !== "function") return false;
      var getTitle = opts.getTitle;
      var renderViewSwitcher = opts.renderViewSwitcher;
      var dispatchListActWindowThenFormHash = opts.dispatchListActWindowThenFormHash;
      var loadRecords = opts.loadRecords;
      var rpc = opts.rpc;
      var showToast = opts.showToast || function() {
      };
      var viewsSvc = opts.viewsSvc;
      var model = opts.model;
      var route = opts.route;
      var records = opts.records || [];
      var searchTerm = opts.searchTerm || "";
      if (typeof getTitle !== "function" || typeof renderViewSwitcher !== "function" || typeof loadRecords !== "function" || typeof dispatchListActWindowThenFormHash !== "function" || !rpc) {
        return false;
      }
      var getListState = opts.getListState || function() {
        return {};
      };
      var setListState = opts.setListState;
      var setActionStack = opts.setActionStack;
      if (typeof setListState !== "function" || typeof setActionStack !== "function") return false;
      var title = getTitle(route);
      setActionStack([{ label: title, hash: route }]);
      var addLabel = route === "leads" ? "Add lead" : route === "tickets" ? "Add ticket" : route === "orders" ? "Add order" : route === "products" ? "Add product" : route === "settings/users" ? "Add user" : "Add";
      var prevState = getListState();
      var stageFilter = prevState.route === route ? prevState.stageFilter : null;
      var currentView = prevState.route === route && prevState.viewType || "kanban";
      var kanbanView = viewsSvc && viewsSvc.getView(model, "kanban");
      var vs = renderViewSwitcher(route, currentView);
      var mid = model === "crm.lead" || model === "helpdesk.ticket" ? '<select id="list-stage-filter" class="o-list-toolbar-select"><option value="">All stages</option></select>' : "";
      var KS = window.AppCore && window.AppCore.KanbanControlStrip;
      var html = KS && typeof KS.buildKanbanChromeHtml === "function" ? KS.buildKanbanChromeHtml({
        title,
        viewSwitcherHtml: vs,
        searchTerm: searchTerm || "",
        addLabel,
        middleSlotHtml: mid
      }) : "<h2>" + title + '</h2><p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">' + vs + '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || "").replace(/"/g, "&quot;") + '"><button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>' + mid + '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + addLabel + '</button></p><div id="kanban-area"></div>';
      main.innerHTML = html;
      setListState({
        model,
        route,
        searchTerm: searchTerm || "",
        stageFilter,
        viewType: currentView
      });
      main.querySelectorAll(".btn-view").forEach(function(btn2) {
        btn2.onclick = function() {
          var v = btn2.dataset.view;
          if (v) opts.setViewAndReload(route, v);
        };
      });
      var btn = document.getElementById("btn-add");
      if (btn)
        btn.onclick = function() {
          dispatchListActWindowThenFormHash(route, "new", "kanbanToolbarNew");
        };
      var btnSearch = document.getElementById("btn-search");
      var searchInput = document.getElementById("list-search");
      if (btnSearch && searchInput) {
        var doSearch = function() {
          var filterEl2 = document.getElementById("list-stage-filter");
          var val = filterEl2 && filterEl2.value ? parseInt(filterEl2.value, 10) : null;
          loadRecords(model, route, searchInput.value.trim(), val);
        };
        btnSearch.onclick = doSearch;
        searchInput.onkeydown = function(e) {
          if (e.key === "Enter") {
            e.preventDefault();
            doSearch();
          }
        };
      }
      if (model === "crm.lead" || model === "helpdesk.ticket") {
        var filterEl = document.getElementById("list-stage-filter");
        var stageModel = model === "helpdesk.ticket" ? "helpdesk.stage" : "crm.stage";
        if (filterEl) {
          rpc.callKw(stageModel, "search_read", [[]], { fields: ["id", "name"], order: "sequence" }).then(function(stages) {
            stages.forEach(function(s) {
              var opt = document.createElement("option");
              opt.value = s.id;
              opt.textContent = s.name || "";
              if (s.id === stageFilter) opt.selected = true;
              filterEl.appendChild(opt);
            });
            filterEl.onchange = function() {
              var val = filterEl.value ? parseInt(filterEl.value, 10) : null;
              loadRecords(model, route, searchInput.value.trim(), val);
            };
          });
        }
      }
      var groupBy = kanbanView && kanbanView.default_group_by || "stage_id";
      var stageIds = [];
      (records || []).forEach(function(r) {
        var val = r[groupBy];
        var id = val && (Array.isArray(val) ? val[0] : val);
        id = id === 0 ? 0 : id;
        if (id != null) stageIds.push(id);
      });
      var uniq = stageIds.filter(function(x, i, a) {
        return a.indexOf(x) === i;
      });
      var comodelMap = { "crm.lead": "crm.stage", "project.task": "project.task.type", "helpdesk.ticket": "helpdesk.stage" };
      var comodel = comodelMap[model] || (groupBy === "stage_id" ? "crm.stage" : null);
      var nameMap = {};
      function renderKanbanWithOptions(kopts) {
        window.ViewRenderers.kanban(document.getElementById("kanban-area"), model, records, kopts);
      }
      var baseOpts = {
        default_group_by: groupBy,
        fields: kanbanView && kanbanView.fields || ["name", "expected_revenue", "date_deadline"],
        stageNames: nameMap,
        onCardClick: function(id) {
          dispatchListActWindowThenFormHash(route, "edit/" + id, "kanbanCardOpenForm");
        },
        onStageChange: function(recordId, newStageId) {
          var stageVal = newStageId || false;
          var writeVal = {};
          writeVal[groupBy] = stageVal;
          rpc.callKw(model, "write", [[parseInt(recordId, 10)], writeVal]).then(function() {
            return loadRecords(model, route, getListState().searchTerm);
          }).catch(function(err) {
            showToast(err.message || "Failed to update", "error");
          });
        },
        onQuickCreate: function(stageId, name, done) {
          var vals = { name };
          vals[groupBy] = stageId || false;
          rpc.callKw(model, "create", [[vals]], {}).then(function() {
            showToast("Created", "success");
            if (typeof done === "function") done();
            return loadRecords(model, route, getListState().searchTerm);
          }).catch(function(err) {
            showToast(err.message || "Failed to create", "error");
          });
        }
      };
      if (comodel && uniq.length) {
        rpc.callKw(comodel, "search_read", [[]], { fields: ["id", "name"], order: "sequence" }).then(function(stages) {
          stages.forEach(function(s) {
            nameMap[s.id] = s.name;
          });
          baseOpts.stageNames = nameMap;
          renderKanbanWithOptions(baseOpts);
        }).catch(function() {
          renderKanbanWithOptions(baseOpts);
        });
      } else if (uniq.length || groupBy) {
        uniq.forEach(function(id) {
          if (id && !nameMap[id]) nameMap[id] = "Stage " + id;
        });
        baseOpts.stageNames = nameMap;
        renderKanbanWithOptions(baseOpts);
      } else {
        renderKanbanWithOptions({
          default_group_by: groupBy,
          stageNames: {},
          onCardClick: baseOpts.onCardClick,
          onQuickCreate: baseOpts.onQuickCreate
        });
      }
      return true;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.KanbanViewModule = {
      render
    };
  })();

  // addons/web/static/src/app/gantt_view_module.js
  (function() {
    function render(main, opts) {
      opts = opts || {};
      if (!main || !opts.model || !opts.route) return false;
      var getTitle = opts.getTitle;
      var renderViewSwitcher = opts.renderViewSwitcher;
      var loadRecords = opts.loadRecords;
      var dispatchListActWindowThenFormHash = opts.dispatchListActWindowThenFormHash;
      var setViewAndReload = opts.setViewAndReload;
      var setListState = opts.setListState;
      var setActionStack = opts.setActionStack;
      var attachActWindowFormLinkDelegation = opts.attachActWindowFormLinkDelegation;
      if (typeof getTitle !== "function" || typeof renderViewSwitcher !== "function" || typeof loadRecords !== "function" || typeof dispatchListActWindowThenFormHash !== "function" || typeof setViewAndReload !== "function" || typeof setListState !== "function" || typeof setActionStack !== "function" || typeof attachActWindowFormLinkDelegation !== "function") {
        return false;
      }
      var model = opts.model;
      var route = opts.route;
      var records = opts.records || [];
      var searchTerm = opts.searchTerm || "";
      var dateStart = opts.dateStart || "date_start";
      var dateStop = opts.dateStop || "date_deadline";
      var title = getTitle(route);
      var currentView = "gantt";
      var addLabel = route === "tasks" ? "Add task" : route === "manufacturing" ? "Add MO" : "Add";
      setActionStack([{ label: title, hash: route }]);
      var html = "<h2>" + title + "</h2>";
      html += '<p class="o-gantt-fallback-toolbar">';
      html += renderViewSwitcher(route, currentView);
      html += '<div role="search" class="o-gantt-fallback-search"><input type="text" id="list-search" placeholder="Search..." class="o-list-search-field" value="' + (searchTerm || "").replace(/"/g, "&quot;") + '">';
      html += '<button type="button" id="btn-search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button></div>';
      html += '<button type="button" id="btn-add" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + addLabel + "</button></p>";
      var now = /* @__PURE__ */ new Date();
      var rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
      var rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      var totalDays = Math.ceil((rangeEnd - rangeStart) / (24 * 60 * 60 * 1e3));
      var dayWidth = 24;
      var timelineWidth = totalDays * dayWidth;
      html += '<div class="gantt-view o-gantt-scroll"><table role="grid" class="o-gantt-table"><thead><tr><th class="o-gantt-th o-gantt-th--name">Name</th><th class="o-gantt-th o-gantt-th--timeline" style="min-width:' + timelineWidth + 'px">' + rangeStart.toLocaleDateString(void 0, { month: "short", year: "numeric" }) + " \u2013 " + rangeEnd.toLocaleDateString(void 0, { month: "short", year: "numeric" }) + "</th></tr></thead><tbody>";
      (records || []).forEach(function(r) {
        var startVal = r[dateStart];
        var stopVal = r[dateStop];
        var startDate = startVal ? new Date(startVal) : rangeStart;
        var stopDate = stopVal ? new Date(stopVal) : startVal ? new Date(startVal) : rangeEnd;
        var left = Math.max(0, Math.floor((startDate - rangeStart) / (24 * 60 * 60 * 1e3)) * dayWidth);
        var width = Math.max(dayWidth, Math.ceil((stopDate - startDate) / (24 * 60 * 60 * 1e3)) * dayWidth);
        var name = (r.name || "\u2014").replace(/</g, "&lt;");
        html += '<tr><td class="o-gantt-td o-gantt-td--name"><a href="#' + route + "/edit/" + (r.id || "") + '" class="o-erp-actwindow-form-link" data-edit-id="' + (r.id || "") + '">' + name + '</a></td><td class="o-gantt-td o-gantt-td--timeline" style="min-width:' + timelineWidth + 'px"><div class="o-gantt-bar" style="left:' + left + "px;width:" + width + 'px" title="' + String(startVal || "").replace(/"/g, "&quot;") + " \u2013 " + String(stopVal || "").replace(/"/g, "&quot;") + '"></div></td></tr>';
      });
      html += "</tbody></table></div>";
      if (!records || !records.length) {
        html = html.replace("</div>", '<p class="o-gantt-empty">No records with dates.</p></div>');
      }
      main.innerHTML = html;
      setListState({ model, route, searchTerm: searchTerm || "", viewType: "gantt" });
      main.querySelectorAll(".btn-view").forEach(function(btn) {
        btn.onclick = function() {
          var v = btn.dataset.view;
          if (v) setViewAndReload(route, v);
        };
      });
      var btnAdd = document.getElementById("btn-add");
      if (btnAdd)
        btnAdd.onclick = function() {
          dispatchListActWindowThenFormHash(route, "new", "viewChromeToolbarNew");
        };
      var btnSearch = document.getElementById("btn-search");
      var searchInput = document.getElementById("list-search");
      if (btnSearch && searchInput) {
        var doSearch = function() {
          loadRecords(model, route, searchInput.value.trim(), null, "gantt", null, 0, null);
        };
        btnSearch.onclick = doSearch;
        searchInput.onkeydown = function(e) {
          if (e.key === "Enter") {
            e.preventDefault();
            doSearch();
          }
        };
      }
      attachActWindowFormLinkDelegation(".o-gantt-scroll", route, "ganttNameEditLink");
      return true;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.GanttViewModule = { render };
  })();

  // addons/web/static/src/app/graph_view_module.js
  (function() {
    function render(main, opts) {
      opts = opts || {};
      if (!main || !opts.model || !opts.route) return false;
      var getTitle = opts.getTitle;
      var renderViewSwitcher = opts.renderViewSwitcher;
      var loadRecords = opts.loadRecords;
      var dispatchListActWindowThenFormHash = opts.dispatchListActWindowThenFormHash;
      var setViewAndReload = opts.setViewAndReload;
      var setListState = opts.setListState;
      var setActionStack = opts.setActionStack;
      var getListState = opts.getListState || function() {
        return {};
      };
      var rpc = opts.rpc;
      var rerenderGraph = opts.rerenderGraph;
      if (typeof getTitle !== "function" || typeof renderViewSwitcher !== "function" || typeof loadRecords !== "function" || typeof dispatchListActWindowThenFormHash !== "function" || typeof setViewAndReload !== "function" || typeof setListState !== "function" || typeof setActionStack !== "function" || !rpc || typeof rerenderGraph !== "function") {
        return false;
      }
      var model = opts.model;
      var route = opts.route;
      var graphView = opts.graphView || {};
      var rows = opts.rows || [];
      var groupbyField = opts.groupbyField;
      var measureFields = opts.measureFields || [];
      var labelMap = opts.labelMap || {};
      var searchTerm = opts.searchTerm || "";
      var savedFiltersList = opts.savedFiltersList || [];
      var title = getTitle(route);
      var st = getListState();
      var stageFilter = st.route === route ? st.stageFilter : null;
      var currentView = "graph";
      setActionStack([{ label: title, hash: route }]);
      var graphType = graphView.graph_type || "bar";
      var labels = (rows || []).map(function(r) {
        var v = r[groupbyField];
        return labelMap && v != null && labelMap[v] ? labelMap[v] : v != null ? String(v) : "";
      });
      var datasets = measureFields.map(function(m, idx) {
        var colors = ["rgba(26,26,46,0.8)", "rgba(70,130,180,0.8)", "rgba(34,139,34,0.8)", "rgba(218,165,32,0.8)"];
        return {
          label: m.replace(/_/g, " ").replace(/\b\w/g, function(c) {
            return c.toUpperCase();
          }),
          data: (rows || []).map(function(r) {
            return r[m] != null ? Number(r[m]) : 0;
          }),
          backgroundColor: colors[idx % colors.length],
          borderColor: colors[idx % colors.length].replace("0.8", "1"),
          borderWidth: 1
        };
      });
      var html = "<h2>" + title + "</h2>";
      if (window.AppCore && window.AppCore.GraphViewChrome && typeof window.AppCore.GraphViewChrome.buildToolbarHtml === "function") {
        html += window.AppCore.GraphViewChrome.buildToolbarHtml({
          viewSwitcherHtml: renderViewSwitcher(route, currentView),
          graphType,
          searchTerm: searchTerm || "",
          model,
          addLabel: route === "contacts" ? "Add contact" : route === "leads" ? "Add lead" : route === "orders" ? "Add order" : route === "products" ? "Add product" : route === "settings/users" ? "Add user" : "Add"
        });
      } else {
        html += '<p class="o-graph-toolbar-fallback" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
        html += renderViewSwitcher(route, currentView);
        html += '<span class="graph-type-switcher" style="display:inline-flex;gap:2px;margin-right:0.5rem">';
        ["bar", "line", "pie"].forEach(function(t) {
          var active = t === graphType;
          html += '<button type="button" class="btn-graph-type' + (active ? " active" : "") + '" data-type="' + t + '" style="padding:0.35rem 0.6rem;border:1px solid #ddd;background:' + (active ? "#1a1a2e;color:white;border-color:#1a1a2e" : "#fff;color:#333") + ';border-radius:4px;cursor:pointer;font-size:0.9rem">' + (t.charAt(0).toUpperCase() + t.slice(1)) + "</button>";
        });
        html += "</span>";
        html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || "").replace(/"/g, "&quot;") + '">';
        html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
        if (model === "crm.lead") {
          html += '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">All stages</option></select>';
        }
        html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Add lead</button></p>';
      }
      html += '<div class="o-graph-container">';
      html += '<canvas id="graph-canvas"></canvas>';
      html += "</div>";
      main.innerHTML = html;
      setListState({ model, route, searchTerm: searchTerm || "", stageFilter, viewType: "graph" });
      main.querySelectorAll(".btn-view").forEach(function(btn) {
        btn.onclick = function() {
          var v = btn.dataset.view;
          if (v) setViewAndReload(route, v);
        };
      });
      main.querySelectorAll(".btn-graph-type").forEach(function(btn) {
        btn.onclick = function() {
          var nextType = btn.dataset.type;
          rerenderGraph(
            model,
            route,
            Object.assign({}, graphView, { graph_type: nextType }),
            rows,
            groupbyField,
            measureFields,
            labelMap,
            searchTerm,
            savedFiltersList
          );
        };
      });
      var btnAdd = document.getElementById("btn-add");
      if (btnAdd)
        btnAdd.onclick = function() {
          dispatchListActWindowThenFormHash(route, "new", "viewChromeToolbarNew");
        };
      var btnSearch = document.getElementById("btn-search");
      var searchInput = document.getElementById("list-search");
      if (btnSearch && searchInput) {
        var doSearch = function() {
          var filterEl2 = document.getElementById("list-stage-filter");
          var val = model === "crm.lead" && filterEl2 && filterEl2.value ? parseInt(filterEl2.value, 10) : null;
          loadRecords(model, route, searchInput.value.trim(), val, "graph", null, 0, null);
        };
        btnSearch.onclick = doSearch;
        searchInput.onkeydown = function(e) {
          if (e.key === "Enter") {
            e.preventDefault();
            doSearch();
          }
        };
      }
      if (model === "crm.lead") {
        var filterEl = document.getElementById("list-stage-filter");
        if (filterEl) {
          rpc.callKw("crm.stage", "search_read", [[]], { fields: ["id", "name"], order: "sequence" }).then(function(stages) {
            stages.forEach(function(s) {
              var opt = document.createElement("option");
              opt.value = s.id;
              opt.textContent = s.name || "";
              if (s.id === stageFilter) opt.selected = true;
              filterEl.appendChild(opt);
            });
            filterEl.onchange = function() {
              var val = filterEl.value ? parseInt(filterEl.value, 10) : null;
              loadRecords(model, route, searchInput.value.trim(), val, "graph", null, 0, null);
            };
          });
        }
      }
      var ctx = document.getElementById("graph-canvas");
      var container = main.querySelector(".o-graph-container");
      if (!ctx || !window.Chart) {
        if (container) container.innerHTML = "<p>Chart.js not loaded. Refresh the page.</p>";
        return true;
      }
      var chartConfig = {
        type: graphType,
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "top" } },
          scales: graphType !== "pie" ? { y: { beginAtZero: true } } : {}
        }
      };
      if (graphType === "pie" && datasets.length > 1) {
        chartConfig.data.datasets = [
          {
            label: measureFields[0],
            data: datasets[0].data,
            backgroundColor: datasets[0].backgroundColor,
            borderColor: datasets[0].borderColor,
            borderWidth: 1
          }
        ];
      }
      new window.Chart(ctx, chartConfig);
      return true;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.GraphViewModule = { render };
  })();

  // addons/web/static/src/app/pivot_view_module.js
  (function() {
    function render(main, opts) {
      opts = opts || {};
      if (!main || !opts.model || !opts.route) return false;
      var getTitle = opts.getTitle;
      var renderViewSwitcher = opts.renderViewSwitcher;
      var loadRecords = opts.loadRecords;
      var dispatchListActWindowThenFormHash = opts.dispatchListActWindowThenFormHash;
      var setViewAndReload = opts.setViewAndReload;
      var setListState = opts.setListState;
      var setActionStack = opts.setActionStack;
      var getListState = opts.getListState || function() {
        return {};
      };
      var rpc = opts.rpc;
      var rerenderPivot = opts.rerenderPivot;
      if (typeof getTitle !== "function" || typeof renderViewSwitcher !== "function" || typeof loadRecords !== "function" || typeof dispatchListActWindowThenFormHash !== "function" || typeof setViewAndReload !== "function" || typeof setListState !== "function" || typeof setActionStack !== "function" || !rpc || typeof rerenderPivot !== "function") {
        return false;
      }
      var model = opts.model;
      var route = opts.route;
      var pivotView = opts.pivotView || {};
      var rows = opts.rows || [];
      var rowNames = opts.rowNames || [];
      var colNames = opts.colNames || [];
      var measures = opts.measures || [];
      var rowLabelMap = opts.rowLabelMap || {};
      var colLabelMap = opts.colLabelMap || {};
      var searchTerm = opts.searchTerm || "";
      var savedFiltersList = opts.savedFiltersList || [];
      var title = getTitle(route);
      var st = getListState();
      var stageFilter = st.route === route ? st.stageFilter : null;
      var rowField = rowNames[0];
      var colField = colNames[0];
      var measureField = measures[0];
      var rowVals = [];
      var colVals = [];
      var matrix = {};
      (rows || []).forEach(function(r) {
        var rv = r[rowField];
        var cv = r[colField];
        var val = r[measureField] != null ? Number(r[measureField]) : 0;
        if (rv != null && rowVals.indexOf(rv) < 0) rowVals.push(rv);
        if (cv != null && colVals.indexOf(cv) < 0) colVals.push(cv);
        var key = String(rv) + "_" + String(cv);
        matrix[key] = val;
      });
      var rowLabels = rowVals.map(function(v) {
        return rowLabelMap[v] || (v != null ? String(v) : "");
      });
      var colLabels = colVals.map(function(v) {
        return colLabelMap[v] || (v != null ? String(v) : "");
      });
      var rowTotals = {};
      var colTotals = {};
      rowVals.forEach(function(rv) {
        rowTotals[rv] = 0;
      });
      colVals.forEach(function(cv) {
        colTotals[cv] = 0;
      });
      rowVals.forEach(function(rv) {
        colVals.forEach(function(cv) {
          var key = String(rv) + "_" + String(cv);
          var v = matrix[key] || 0;
          rowTotals[rv] += v;
          colTotals[cv] += v;
        });
      });
      var grandTotal = 0;
      Object.keys(matrix).forEach(function(k) {
        grandTotal += matrix[k];
      });
      setActionStack([{ label: title, hash: route }]);
      setListState({ model, route, searchTerm: searchTerm || "", stageFilter, viewType: "pivot" });
      var pivotAddLabel = route === "contacts" ? "Add contact" : route === "leads" ? "Add lead" : route === "orders" ? "Add order" : route === "products" ? "Add product" : route === "settings/users" ? "Add user" : "Add";
      var html = "<h2>" + title + "</h2>";
      if (window.AppCore && window.AppCore.PivotViewChrome && typeof window.AppCore.PivotViewChrome.buildToolbarHtml === "function") {
        html += window.AppCore.PivotViewChrome.buildToolbarHtml({
          viewSwitcherHtml: renderViewSwitcher(route, "pivot"),
          searchTerm: searchTerm || "",
          model,
          addLabel: pivotAddLabel
        });
      } else {
        html += '<p class="o-pivot-toolbar-fallback" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
        html += renderViewSwitcher(route, "pivot");
        html += '<button type="button" id="btn-pivot-flip" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Flip axes</button>';
        html += '<button type="button" id="btn-pivot-download" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Download CSV</button>';
        html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || "").replace(/"/g, "&quot;") + '">';
        html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
        if (model === "crm.lead") {
          html += '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">All stages</option></select>';
        }
        html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + pivotAddLabel + "</button></p>";
      }
      html += '<div class="o-pivot-container o-card-gradient">';
      html += '<table class="o-pivot-table"><thead><tr><th class="o-pivot-th o-pivot-th--corner"></th>';
      colLabels.forEach(function(l) {
        html += '<th class="o-pivot-th o-pivot-th--measure">' + (l || "").replace(/</g, "&lt;") + "</th>";
      });
      html += '<th class="o-pivot-th o-pivot-th--total">Total</th></tr></thead><tbody>';
      rowVals.forEach(function(rv, ri) {
        html += '<tr><td class="o-pivot-td o-pivot-td--rowhead">' + (rowLabels[ri] || "").replace(/</g, "&lt;") + "</td>";
        colVals.forEach(function(cv) {
          var key = rv + "_" + cv;
          var val = matrix[key] || 0;
          html += '<td class="o-pivot-td o-pivot-td--num">' + (typeof val === "number" ? val.toLocaleString() : val) + "</td>";
        });
        html += '<td class="o-pivot-td o-pivot-td--num o-pivot-td--rowtotal">' + (rowTotals[rv] || 0).toLocaleString() + "</td></tr>";
      });
      html += '<tr><td class="o-pivot-td o-pivot-td--coltotal">Total</td>';
      colVals.forEach(function(cv) {
        html += '<td class="o-pivot-td o-pivot-td--num o-pivot-td--coltotal">' + (colTotals[cv] || 0).toLocaleString() + "</td>";
      });
      html += '<td class="o-pivot-td o-pivot-td--num o-pivot-td--grandtotal">' + grandTotal.toLocaleString() + "</td></tr>";
      html += "</tbody></table></div>";
      main.innerHTML = html;
      main.querySelectorAll(".btn-view").forEach(function(btn) {
        btn.onclick = function() {
          var v = btn.dataset.view;
          if (v) setViewAndReload(route, v);
        };
      });
      var btnAdd = document.getElementById("btn-add");
      if (btnAdd)
        btnAdd.onclick = function() {
          dispatchListActWindowThenFormHash(route, "new", "viewChromeToolbarNew");
        };
      var btnFlip = document.getElementById("btn-pivot-flip");
      if (btnFlip) {
        btnFlip.onclick = function() {
          rerenderPivot(
            model,
            route,
            pivotView,
            rows,
            colNames,
            rowNames,
            measures,
            colLabelMap,
            rowLabelMap,
            searchTerm,
            savedFiltersList
          );
        };
      }
      var btnDownload = document.getElementById("btn-pivot-download");
      if (btnDownload) {
        btnDownload.onclick = function() {
          var csv = "," + colLabels.map(function(l) {
            return '"' + (l || "").replace(/"/g, '""') + '"';
          }).join(",") + ',"Total"\n';
          rowVals.forEach(function(rv, ri) {
            csv += '"' + (rowLabels[ri] || "").replace(/"/g, '""') + '"';
            colVals.forEach(function(cv) {
              var key = rv + "_" + cv;
              csv += "," + (matrix[key] || 0);
            });
            csv += "," + (rowTotals[rv] || 0) + "\n";
          });
          csv += '"Total"';
          colVals.forEach(function(cv) {
            csv += "," + (colTotals[cv] || 0);
          });
          csv += "," + grandTotal + "\n";
          var blob = new Blob([csv], { type: "text/csv" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "pivot_" + (route || "data") + ".csv";
          a.click();
          URL.revokeObjectURL(a.href);
        };
      }
      var btnSearch = document.getElementById("btn-search");
      var searchInput = document.getElementById("list-search");
      if (btnSearch && searchInput) {
        var doSearch = function() {
          var filterEl = document.getElementById("list-stage-filter");
          var val = model === "crm.lead" && filterEl && filterEl.value ? parseInt(filterEl.value, 10) : null;
          loadRecords(model, route, searchInput.value.trim(), val, "pivot", null, 0, null);
        };
        btnSearch.onclick = doSearch;
        searchInput.onkeydown = function(e) {
          if (e.key === "Enter") {
            e.preventDefault();
            doSearch();
          }
        };
      }
      if (model === "crm.lead") {
        var filterEl2 = document.getElementById("list-stage-filter");
        if (filterEl2) {
          rpc.callKw("crm.stage", "search_read", [[]], { fields: ["id", "name"], order: "sequence" }).then(function(stages) {
            stages.forEach(function(s) {
              var opt = document.createElement("option");
              opt.value = s.id;
              opt.textContent = s.name || "";
              if (s.id === stageFilter) opt.selected = true;
              filterEl2.appendChild(opt);
            });
            filterEl2.onchange = function() {
              var val = filterEl2.value ? parseInt(filterEl2.value, 10) : null;
              loadRecords(model, route, searchInput ? searchInput.value.trim() : "", val, "pivot", null, 0, null);
            };
          });
        }
      }
      return true;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.PivotViewModule = { render };
  })();

  // addons/web/static/src/app/calendar_view_module.js
  (function() {
    function render(main, opts) {
      opts = opts || {};
      if (!main || !opts.model || !opts.route) return false;
      var getTitle = opts.getTitle;
      var renderViewSwitcher = opts.renderViewSwitcher;
      var loadRecords = opts.loadRecords;
      var dispatchListActWindowThenFormHash = opts.dispatchListActWindowThenFormHash;
      var setViewAndReload = opts.setViewAndReload;
      var setListState = opts.setListState;
      var setActionStack = opts.setActionStack;
      var getListState = opts.getListState || function() {
        return {};
      };
      var viewsSvc = opts.viewsSvc;
      var attachActWindowFormLinkDelegation = opts.attachActWindowFormLinkDelegation;
      if (typeof getTitle !== "function" || typeof renderViewSwitcher !== "function" || typeof loadRecords !== "function" || typeof dispatchListActWindowThenFormHash !== "function" || typeof setViewAndReload !== "function" || typeof setListState !== "function" || typeof setActionStack !== "function" || typeof attachActWindowFormLinkDelegation !== "function") {
        return false;
      }
      var model = opts.model;
      var route = opts.route;
      var records = opts.records || [];
      var searchTerm = opts.searchTerm || "";
      var calendarView = viewsSvc && viewsSvc.getView(model, "calendar");
      var dateField = calendarView && calendarView.date_start || "date_deadline";
      var stringField = calendarView && calendarView.string || "name";
      var title = getTitle(route);
      setActionStack([{ label: title, hash: route }]);
      var st0 = getListState();
      var calYear = st0.route === route && st0.calendarYear || (/* @__PURE__ */ new Date()).getFullYear();
      var calMonth = st0.route === route && st0.calendarMonth || (/* @__PURE__ */ new Date()).getMonth() + 1;
      setListState({
        model,
        route,
        searchTerm: searchTerm || "",
        viewType: "calendar",
        calendarYear: calYear,
        calendarMonth: calMonth
      });
      var firstDay = new Date(calYear, calMonth - 1, 1);
      var lastDay = new Date(calYear, calMonth, 0);
      var startPad = firstDay.getDay();
      var daysInMonth = lastDay.getDate();
      var recordsByDate = {};
      (records || []).forEach(function(r) {
        var d = r[dateField];
        if (!d) return;
        var dateStr2 = typeof d === "string" ? d.slice(0, 10) : d && d.toISOString ? d.toISOString().slice(0, 10) : "";
        if (!dateStr2) return;
        if (!recordsByDate[dateStr2]) recordsByDate[dateStr2] = [];
        recordsByDate[dateStr2].push(r);
      });
      var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      var calAddLabelCommon = route === "contacts" ? "Add contact" : route === "leads" ? "Add lead" : route === "orders" ? "Add order" : route === "products" ? "Add product" : route === "settings/users" ? "Add user" : "Add";
      var calAddLabel = model === "calendar.event" ? "Add meeting" : calAddLabelCommon;
      var monthTitleStr = firstDay.toLocaleString("default", { month: "long", year: "numeric" });
      var html = "<h2>" + title + "</h2>";
      if (window.AppCore && window.AppCore.CalendarViewChrome && typeof window.AppCore.CalendarViewChrome.buildToolbarHtml === "function") {
        html += window.AppCore.CalendarViewChrome.buildToolbarHtml({
          viewSwitcherHtml: renderViewSwitcher(route, "calendar"),
          monthTitle: monthTitleStr,
          searchTerm: searchTerm || "",
          addLabel: calAddLabel
        });
      } else {
        html += '<p class="o-calendar-toolbar-fallback" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
        html += renderViewSwitcher(route, "calendar");
        html += '<button type="button" id="cal-prev" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Prev</button>';
        html += '<span id="cal-title" style="min-width:140px;font-weight:600">' + monthTitleStr + "</span>";
        html += '<button type="button" id="cal-next" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Next</button>';
        html += '<button type="button" id="cal-today" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Today</button>';
        html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || "").replace(/"/g, "&quot;") + '">';
        html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
        html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + calAddLabel + "</button></p>";
      }
      html += '<div class="o-calendar o-calendar-grid">';
      dayNames.forEach(function(dn) {
        html += '<div class="o-calendar-weekday">' + dn + "</div>";
      });
      var totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
      for (var i = 0; i < totalCells; i++) {
        var dayNum = i - startPad + 1;
        var isEmpty = dayNum < 1 || dayNum > daysInMonth;
        var dateStr = isEmpty ? "" : calYear + "-" + String(calMonth).padStart(2, "0") + "-" + String(dayNum).padStart(2, "0");
        var dayRecs = dateStr ? recordsByDate[dateStr] || [] : [];
        var cellContent = isEmpty ? "" : '<span class="o-calendar-daynum">' + dayNum + "</span>";
        dayRecs.forEach(function(rec) {
          var label = (rec[stringField] || "Untitled").replace(/</g, "&lt;").slice(0, 30);
          cellContent += '<div class="o-calendar-event-wrap"><a href="#' + route + "/edit/" + (rec.id || "") + '" class="o-calendar-event-link o-erp-actwindow-form-link" data-edit-id="' + (rec.id || "") + '">' + label + "</a></div>";
        });
        html += '<div class="o-calendar-cell' + (isEmpty ? " o-calendar-cell--empty" : "") + '">' + cellContent + "</div>";
      }
      html += "</div>";
      main.innerHTML = html;
      main.querySelectorAll(".btn-view").forEach(function(btn) {
        btn.onclick = function() {
          var v = btn.dataset.view;
          if (v) setViewAndReload(route, v);
        };
      });
      var btnAdd = document.getElementById("btn-add");
      if (btnAdd)
        btnAdd.onclick = function() {
          dispatchListActWindowThenFormHash(route, "new", "viewChromeToolbarNew");
        };
      var doReload = function() {
        var si = document.getElementById("list-search");
        loadRecords(model, route, si ? si.value.trim() : "", null, "calendar", null, 0, null);
      };
      var prevBtn = document.getElementById("cal-prev");
      var nextBtn = document.getElementById("cal-next");
      var todayBtn = document.getElementById("cal-today");
      if (prevBtn)
        prevBtn.onclick = function() {
          var live = getListState();
          var cy = live.calendarYear;
          var cm = live.calendarMonth;
          cm--;
          if (cm < 1) {
            cm = 12;
            cy--;
          }
          live.calendarYear = cy;
          live.calendarMonth = cm;
          doReload();
        };
      if (nextBtn)
        nextBtn.onclick = function() {
          var live = getListState();
          var cy = live.calendarYear;
          var cm = live.calendarMonth;
          cm++;
          if (cm > 12) {
            cm = 1;
            cy++;
          }
          live.calendarYear = cy;
          live.calendarMonth = cm;
          doReload();
        };
      if (todayBtn)
        todayBtn.onclick = function() {
          var now = /* @__PURE__ */ new Date();
          var live = getListState();
          live.calendarYear = now.getFullYear();
          live.calendarMonth = now.getMonth() + 1;
          doReload();
        };
      var btnSearch = document.getElementById("btn-search");
      var searchInput = document.getElementById("list-search");
      if (btnSearch && searchInput) {
        var doSearch = function() {
          loadRecords(model, route, searchInput.value.trim(), null, "calendar", null, 0, null);
        };
        btnSearch.onclick = doSearch;
        searchInput.onkeydown = function(e) {
          if (e.key === "Enter") {
            e.preventDefault();
            doSearch();
          }
        };
      }
      attachActWindowFormLinkDelegation(".o-calendar-grid", route, "calendarEventEditLink");
      return true;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.CalendarViewModule = { render };
  })();

  // addons/web/static/src/app/activity_view_module.js
  (function() {
    function render(main, opts) {
      opts = opts || {};
      if (!main || !opts.model || !opts.route) return false;
      var getTitle = opts.getTitle;
      var renderViewSwitcher = opts.renderViewSwitcher;
      var loadRecords = opts.loadRecords;
      var dispatchListActWindowThenFormHash = opts.dispatchListActWindowThenFormHash;
      var setViewAndReload = opts.setViewAndReload;
      var setListState = opts.setListState;
      var setActionStack = opts.setActionStack;
      var getListState = opts.getListState || function() {
        return {};
      };
      var rpc = opts.rpc;
      var showToast = opts.showToast || function() {
      };
      var attachActWindowFormLinkDelegation = opts.attachActWindowFormLinkDelegation;
      var userId = opts.userId;
      if (typeof getTitle !== "function" || typeof renderViewSwitcher !== "function" || typeof loadRecords !== "function" || typeof dispatchListActWindowThenFormHash !== "function" || typeof setViewAndReload !== "function" || typeof setListState !== "function" || typeof setActionStack !== "function" || !rpc || typeof attachActWindowFormLinkDelegation !== "function" || userId == null) {
        return false;
      }
      var model = opts.model;
      var route = opts.route;
      var records = opts.records || [];
      var activityTypes = opts.activityTypes || [];
      var activities = opts.activities || [];
      var searchTerm = opts.searchTerm || "";
      var title = getTitle(route);
      var st = getListState();
      var stageFilter = st.route === route ? st.stageFilter : null;
      var currentView = "activity";
      var addLabel = route === "leads" ? "Add lead" : route === "tasks" ? "Add task" : "Add";
      setActionStack([{ label: title, hash: route }]);
      var html = "<h2>" + title + "</h2>";
      html += '<p class="o-activity-matrix-toolbar">';
      html += renderViewSwitcher(route, currentView);
      html += '<div role="search" class="o-activity-matrix-search"><input type="text" id="list-search" placeholder="Search..." aria-label="Search" class="o-list-search-field" value="' + (searchTerm || "").replace(/"/g, "&quot;") + '">';
      html += '<button type="button" id="btn-search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button></div>';
      html += '<button type="button" id="btn-add" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + addLabel + "</button></p>";
      var byRecordType = {};
      (activities || []).forEach(function(a) {
        var key = a.res_id + "_" + (a.activity_type_id || 0);
        if (!byRecordType[key]) byRecordType[key] = [];
        byRecordType[key].push(a);
      });
      html += '<div class="activity-matrix o-activity-matrix-scroll"><table role="grid" class="o-activity-matrix-table"><thead><tr role="row"><th role="columnheader" class="o-activity-matrix-th o-activity-matrix-th--record">Record</th>';
      (activityTypes || []).forEach(function(t) {
        html += '<th role="columnheader" class="o-activity-matrix-th">' + (t.name || "").replace(/</g, "&lt;") + "</th>";
      });
      html += "</tr></thead><tbody>";
      (records || []).forEach(function(r) {
        html += '<tr role="row"><td role="gridcell" class="o-activity-matrix-td o-activity-matrix-td--record"><a href="#' + route + "/edit/" + (r.id || "") + '" class="o-erp-actwindow-form-link" data-edit-id="' + (r.id || "") + '">' + (r.name || "\u2014").replace(/</g, "&lt;") + "</a></td>";
        (activityTypes || []).forEach(function(t) {
          var key = (r.id || "") + "_" + (t.id || 0);
          var cellActs = byRecordType[key] || [];
          var cellHtml = "";
          cellActs.forEach(function(a) {
            var d = a.date_deadline || "";
            var summary = (a.summary || "Activity").replace(/</g, "&lt;");
            cellHtml += '<div class="o-activity-matrix-cell-line"><a href="#' + route + "/edit/" + (r.id || "") + '" class="o-erp-actwindow-form-link" data-edit-id="' + (r.id || "") + '">' + summary + (d ? ' <span class="o-activity-matrix-cell-meta">' + String(d).replace(/</g, "&lt;") + "</span>" : "") + "</a></div>";
          });
          cellHtml += '<button type="button" class="btn-schedule-activity o-activity-schedule-btn" data-record-id="' + (r.id || "") + '" data-type-id="' + (t.id || "") + '" data-type-name="' + (t.name || "").replace(/"/g, "&quot;") + '">+ Schedule</button>';
          html += '<td role="gridcell" class="o-activity-matrix-td">' + cellHtml + "</td>";
        });
        html += "</tr>";
      });
      html += "</tbody></table></div>";
      if (!records || !records.length) {
        html = html.replace("</div>", '<p class="o-activity-matrix-empty">No records.</p></div>');
      }
      main.innerHTML = html;
      setListState({
        model,
        route,
        searchTerm: searchTerm || "",
        stageFilter,
        viewType: "activity"
      });
      main.querySelectorAll(".btn-view").forEach(function(btn) {
        btn.onclick = function() {
          var v = btn.dataset.view;
          if (v) setViewAndReload(route, v);
        };
      });
      var btnAdd = document.getElementById("btn-add");
      if (btnAdd)
        btnAdd.onclick = function() {
          dispatchListActWindowThenFormHash(route, "new", "viewChromeToolbarNew");
        };
      var btnSearch = document.getElementById("btn-search");
      var searchInput = document.getElementById("list-search");
      if (btnSearch && searchInput) {
        var doSearch = function() {
          loadRecords(model, route, searchInput.value.trim(), null, "activity", null, 0, null);
        };
        btnSearch.onclick = doSearch;
        searchInput.onkeydown = function(e) {
          if (e.key === "Enter") {
            e.preventDefault();
            doSearch();
          }
        };
      }
      attachActWindowFormLinkDelegation(".o-activity-matrix-scroll", route, "activityMatrixEditLink");
      main.querySelectorAll(".btn-schedule-activity").forEach(function(btn) {
        btn.onclick = function() {
          var recordId = parseInt(btn.getAttribute("data-record-id"), 10);
          var typeId = parseInt(btn.getAttribute("data-type-id"), 10);
          var typeName = btn.getAttribute("data-type-name") || "Activity";
          var summary = window.prompt("Summary for " + typeName + ":", typeName);
          if (summary == null) return;
          var dateStr = window.prompt("Due date (YYYY-MM-DD):", (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
          if (dateStr == null) return;
          rpc.callKw(
            "mail.activity",
            "create",
            [
              [
                {
                  res_model: model,
                  res_id: recordId,
                  summary: summary.trim() || typeName,
                  date_deadline: dateStr || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
                  activity_type_id: typeId || false,
                  user_id: userId
                }
              ]
            ],
            {}
          ).then(function() {
            showToast("Activity scheduled", "success");
            loadRecords(model, route, searchTerm, null, "activity", null, 0, null);
          }).catch(function(err) {
            showToast(err && err.message || "Failed to schedule", "error");
          });
        };
      });
      return true;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.ActivityViewModule = { render };
  })();

  // addons/web/static/src/app/discuss_view_module.js
  (function() {
    function esc(s) {
      return String(s || "").replace(/</g, "&lt;");
    }
    function render(main, opts) {
      opts = opts || {};
      if (!main) return false;
      var rpc = opts.rpc;
      if (!rpc || typeof rpc.callKw !== "function") return false;
      var showToast = opts.showToast || function() {
      };
      var channelIdOpt = opts.channelId;
      var bus = opts.bus;
      var session = opts.session;
      main.innerHTML = "";
      var wrap = document.createElement("div");
      wrap.className = "discuss-app o-discuss-app";
      wrap.innerHTML = '<div class="o-discuss-layout" style="display:grid;grid-template-columns:14rem 1fr;gap:var(--card-gap);min-height:20rem;align-items:stretch"><aside class="o-discuss-sidebar o-card-gradient" style="padding:var(--space-md);border-radius:var(--radius-md)"><h3>Channels</h3><button type="button" id="o-discuss-new-channel" class="o-btn o-btn-primary" style="width:100%;margin-bottom:var(--space-sm)">New Channel</button><ul id="o-discuss-channel-list" class="o-discuss-channel-list" style="list-style:none;margin:0;padding:0"></ul></aside><section class="o-discuss-thread o-card-gradient" style="padding:var(--space-md);border-radius:var(--radius-md);display:flex;flex-direction:column;min-height:16rem"><div id="o-discuss-messages" class="o-discuss-messages" style="flex:1;overflow-y:auto;min-height:12rem"></div><div class="o-discuss-compose" style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid var(--border-color)"><textarea id="o-discuss-body" rows="2" class="o-list-search-field" style="width:100%;box-sizing:border-box" placeholder="Message\u2026"></textarea><button type="button" id="o-discuss-send" class="o-btn o-btn-primary" style="margin-top:var(--space-sm)">Send</button></div></section></div>';
      main.appendChild(wrap);
      var listEl = main.querySelector("#o-discuss-channel-list");
      var msgEl = main.querySelector("#o-discuss-messages");
      var inputEl = main.querySelector("#o-discuss-body");
      var sendBtn = main.querySelector("#o-discuss-send");
      var activeId = null;
      function loadMessages(cid) {
        if (!cid) {
          msgEl.innerHTML = '<p style="color:var(--text-muted)">Select a channel</p>';
          return;
        }
        rpc.callKw(
          "mail.message",
          "search_read",
          [[["res_model", "=", "mail.channel"], ["res_id", "=", cid]]],
          { fields: ["id", "body", "date", "author_id"], order: "id asc", limit: 80 }
        ).then(function(rows) {
          msgEl.innerHTML = (rows || []).map(function(m) {
            return '<div class="o-discuss-msg" style="margin-bottom:var(--space-sm);padding:var(--space-sm);background:var(--color-surface-2);border-radius:var(--radius-sm)">' + esc(m.body || "") + "</div>";
          }).join("");
          msgEl.scrollTop = msgEl.scrollHeight;
        }).catch(function() {
          msgEl.innerHTML = '<p class="error o-list-load-error">Could not load messages</p>';
        });
      }
      function selectChannel(cid) {
        activeId = cid;
        if (typeof window !== "undefined" && window.location) {
          window.location.hash = cid ? "discuss/" + cid : "discuss";
        }
        main.querySelectorAll(".o-discuss-channel-list li").forEach(function(li) {
          li.style.fontWeight = li.dataset.id === String(cid) ? "bold" : "normal";
        });
        loadMessages(cid);
      }
      rpc.callKw("mail.channel", "search_read", [[]], { fields: ["id", "name", "channel_type"], limit: 50 }).then(function(channels) {
        listEl.innerHTML = "";
        var want = channelIdOpt ? parseInt(channelIdOpt, 10) : null;
        var picked = false;
        (channels || []).forEach(function(ch) {
          var li = document.createElement("li");
          li.style.cssText = "padding:var(--space-xs);cursor:pointer;border-radius:var(--radius-sm)";
          li.dataset.id = ch.id;
          li.textContent = ch.name || "Channel " + ch.id;
          li.onclick = function() {
            selectChannel(ch.id);
          };
          listEl.appendChild(li);
          if (want && ch.id === want) {
            picked = true;
            selectChannel(ch.id);
          }
        });
        if (!picked && channels && channels[0]) selectChannel(channels[0].id);
        else if (!channels || !channels.length) {
          msgEl.innerHTML = '<p style="color:var(--text-muted)">No channels. Create one.</p>';
        }
      }).catch(function() {
        listEl.innerHTML = '<li style="color:var(--text-muted)">No channels</li>';
      });
      main.querySelector("#o-discuss-new-channel").onclick = function() {
        var n = window.prompt("Channel name");
        if (!n) return;
        rpc.callKw("mail.channel", "create", [[{ name: n, channel_type: "channel" }]], {}).then(function() {
          return rpc.callKw("mail.channel", "search_read", [[]], { fields: ["id", "name"], limit: 50 });
        }).then(function(channels) {
          listEl.innerHTML = "";
          (channels || []).forEach(function(ch) {
            var li = document.createElement("li");
            li.style.cssText = "padding:var(--space-xs);cursor:pointer";
            li.dataset.id = ch.id;
            li.textContent = ch.name || String(ch.id);
            li.onclick = function() {
              selectChannel(ch.id);
            };
            listEl.appendChild(li);
          });
          if (channels && channels.length) selectChannel(channels[channels.length - 1].id);
        }).catch(function(err) {
          showToast(err && err.message || "Failed to create channel", "error");
        });
      };
      sendBtn.onclick = function() {
        var body = (inputEl.value || "").trim();
        if (!body || !activeId) return;
        rpc.callKw("mail.channel", "message_post", [[activeId], body], { message_type: "comment" }).then(function() {
          inputEl.value = "";
          loadMessages(activeId);
        }).catch(function(err) {
          showToast(err && err.message || "Send failed", "error");
        });
      };
      if (bus && session && session.getSessionInfo) {
        session.getSessionInfo().then(function(info) {
          var chs = ["res.partner_" + (info && info.uid || 1)];
          if (activeId) chs.push("mail.channel_" + activeId);
          try {
            bus.setChannels(chs);
            bus.start(chs);
          } catch (e) {
          }
        });
      }
      if (window._discussModuleBusListener) window.removeEventListener("bus:message", window._discussModuleBusListener);
      window._discussModuleBusListener = function(e) {
        var d = e.detail || {};
        var msg = d.message || {};
        if (msg.type === "message" && msg.res_model === "mail.channel" && activeId && msg.res_id == activeId) {
          var div = document.createElement("div");
          div.className = "o-discuss-msg";
          div.style.cssText = "margin-bottom:var(--space-sm);padding:var(--space-sm)";
          div.innerHTML = esc(msg.body || "");
          msgEl.appendChild(div);
          msgEl.scrollTop = msgEl.scrollHeight;
        }
      };
      window.addEventListener("bus:message", window._discussModuleBusListener);
      return true;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.DiscussViewModule = { render };
  })();

  // addons/web/static/src/app/settings_view_module.js
  (function() {
    function esc(s) {
      return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }
    function render(main, opts) {
      opts = opts || {};
      if (!main) return false;
      var title = esc(opts.title || "Settings");
      var sections = opts.sections || [
        { id: "general", label: "General", items: ["Company name", "Timezone", "Language"] },
        { id: "users", label: "Users & companies", items: ["Default access rights", "Email templates"] },
        { id: "technical", label: "Technical", items: ["Developer mode", "Log level"] }
      ];
      var html = '<section class="o-settings-view-module o-card-gradient" style="padding:var(--space-lg);max-width:56rem"><h2>' + title + '</h2><p style="color:var(--text-muted);margin-bottom:var(--space-md)">Filter settings below; saving calls the host when <code>rpc</code> + <code>execute</code> are provided.</p><label class="o-settings-search-label" style="display:block;margin-bottom:var(--space-lg)">Search<br><input type="search" id="o-settings-search" class="o-settings-search-input" placeholder="Search settings\u2026" autocomplete="off" style="width:100%;max-width:24rem;padding:var(--space-sm) var(--space-md);border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--color-surface-1);color:var(--color-text)"></label><div id="o-settings-sections">';
      sections.forEach(function(sec) {
        html += '<div class="o-settings-block" data-settings-block="' + esc(sec.id) + '" style="margin-bottom:var(--space-xl)"><h3 class="o-settings-block-title" style="margin:0 0 var(--space-md);font-size:1.05rem">' + esc(sec.label) + '</h3><ul class="o-settings-item-list" style="list-style:none;padding:0;margin:0;display:grid;gap:var(--space-sm)">';
        (sec.items || []).forEach(function(it) {
          html += '<li class="o-settings-item" data-settings-label="' + esc(it) + '" style="padding:var(--space-sm) var(--space-md);border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--color-surface-1)">' + esc(it) + "</li>";
        });
        html += "</ul></div>";
      });
      html += '</div><p style="margin-top:var(--space-xl)"><button type="button" id="o-settings-save" class="o-btn o-btn-primary">Save</button></p></section>';
      main.innerHTML = html;
      var input = main.querySelector("#o-settings-search");
      var blocks = main.querySelectorAll(".o-settings-block");
      function applyFilter(q) {
        var needle = String(q || "").toLowerCase().trim();
        blocks.forEach(function(blk) {
          var items = blk.querySelectorAll(".o-settings-item");
          var any = false;
          items.forEach(function(li) {
            var lab = (li.getAttribute("data-settings-label") || "").toLowerCase();
            var show = !needle || lab.indexOf(needle) >= 0;
            li.style.display = show ? "" : "none";
            if (show) any = true;
          });
          blk.style.display = any || !needle ? "" : "none";
        });
      }
      if (input) {
        input.addEventListener("input", function() {
          applyFilter(input.value);
        });
      }
      var saveBtn = main.querySelector("#o-settings-save");
      if (saveBtn && opts.rpc && typeof opts.rpc.callKw === "function" && typeof opts.executeMethod === "string") {
        saveBtn.onclick = function() {
          saveBtn.disabled = true;
          opts.rpc.callKw(opts.executeModel || "res.config.settings", opts.executeMethod || "execute", opts.executeArgs || [[]], opts.executeKwargs || {}).then(function() {
            if (opts.onSaved) opts.onSaved();
          }).catch(function() {
          }).finally(function() {
            saveBtn.disabled = false;
          });
        };
      } else if (saveBtn) {
        saveBtn.onclick = function() {
          if (opts.onSaved) opts.onSaved();
        };
      }
      return true;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.SettingsViewModule = { render };
  })();

  // addons/web/static/src/app/import_view_module.js
  (function() {
    function esc(s) {
      return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }
    function render(main, opts) {
      opts = opts || {};
      if (!main) return false;
      var model = opts.model || opts.resModel || "";
      var rpc = opts.rpc;
      var Imp = window.AppCore && window.AppCore.Import;
      main.innerHTML = '<section class="o-import-view-module o-card-gradient" style="padding:var(--space-lg);max-width:56rem"><h2>Import data</h2><p style="color:var(--text-muted)">Model: <strong>' + esc(model || "(from route)") + '</strong></p><div id="o-import-drop" class="o-import-dropzone" style="margin:var(--space-lg) 0;padding:var(--space-xl);border:2px dashed var(--border-color);border-radius:var(--radius-md);text-align:center;background:var(--color-surface-1);color:var(--text-muted)">Drop a CSV file here or <label style="color:var(--color-primary);cursor:pointer"><input type="file" id="o-import-file" accept=".csv,text/csv" style="display:none">choose file</label></div><div id="o-import-preview" style="margin-top:var(--space-lg)"></div><p id="o-import-status" style="margin-top:var(--space-md);color:var(--text-muted)"></p><button type="button" id="o-import-run" class="o-btn o-btn-primary" disabled>Import rows</button></section>';
      var drop = main.querySelector("#o-import-drop");
      var fileIn = main.querySelector("#o-import-file");
      var preview = main.querySelector("#o-import-preview");
      var statusEl = main.querySelector("#o-import-status");
      var runBtn = main.querySelector("#o-import-run");
      var state = { headers: [], rows: [], fieldByCol: {} };
      function parseAndPreview(text) {
        if (!Imp || typeof Imp.parseCsv !== "function" || typeof Imp.renderPreview !== "function") {
          if (statusEl) statusEl.textContent = "Import helpers unavailable.";
          return;
        }
        var rows = Imp.parseCsv(text || "");
        if (!rows.length) {
          if (statusEl) statusEl.textContent = "Empty file.";
          return;
        }
        state.headers = rows[0];
        state.rows = rows.slice(1);
        var modelFields = (opts.modelFields || []).length ? opts.modelFields : state.headers.map(function(h) {
          return String(h || "").trim().toLowerCase().replace(/\s+/g, "_");
        });
        var prev = Imp.renderPreview(state.headers, state.rows, modelFields);
        preview.innerHTML = (prev && prev.table ? prev.table : "") + (prev && prev.mapping ? prev.mapping : "");
        state.fieldByCol = {};
        preview.querySelectorAll(".import-map-select").forEach(function(sel) {
          var idx = parseInt(sel.getAttribute("data-csv-idx"), 10);
          sel.onchange = function() {
            state.fieldByCol[idx] = sel.value || null;
          };
        });
        if (statusEl) statusEl.textContent = state.rows.length + " row(s) ready.";
        if (runBtn) runBtn.disabled = !model || !rpc;
      }
      function handleFile(f) {
        if (!f) return;
        var r = new FileReader();
        r.onload = function() {
          parseAndPreview(r.result);
        };
        r.readAsText(f);
      }
      if (fileIn) {
        fileIn.addEventListener("change", function() {
          handleFile(fileIn.files && fileIn.files[0]);
        });
      }
      if (drop) {
        drop.addEventListener("dragover", function(e) {
          e.preventDefault();
          drop.style.borderColor = "var(--color-primary)";
        });
        drop.addEventListener("dragleave", function() {
          drop.style.borderColor = "var(--border-color)";
        });
        drop.addEventListener("drop", function(e) {
          e.preventDefault();
          drop.style.borderColor = "var(--border-color)";
          var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
          handleFile(f);
        });
      }
      if (runBtn) {
        runBtn.onclick = function() {
          if (!Imp || typeof Imp.runBatchImport !== "function" || !rpc || !model) return;
          runBtn.disabled = true;
          var map = state.fieldByCol;
          Imp.runBatchImport(rpc, model, state.headers, state.rows, map).then(function(res) {
            if (statusEl) statusEl.textContent = "Created " + (res && res.created) + " record(s).";
          }).catch(function() {
          }).finally(function() {
            runBtn.disabled = false;
          });
        };
      }
      return true;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.ImportViewModule = { render };
  })();

  // addons/web/static/src/app/report_view_module.js
  (function() {
    function esc(s) {
      return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }
    function render(main, opts) {
      opts = opts || {};
      if (!main) return false;
      var report = esc(opts.reportName || opts.name || "Report");
      var ids = opts.ids || opts.resIds || [];
      var idStr = Array.isArray(ids) && ids.length ? ids.join(",") : opts.resId != null ? String(opts.resId) : "";
      var htmlUrl = opts.reportUrl || (opts.reportName && idStr ? "/report/html/" + encodeURIComponent(String(opts.reportName)) + "/" + idStr : "");
      var pdfUrl = opts.pdfUrl || (opts.reportName && idStr ? "/report/pdf/" + encodeURIComponent(String(opts.reportName)) + "/" + idStr : "");
      var body = '<section class="o-report-view-module o-card-gradient" style="padding:var(--space-lg);display:flex;flex-direction:column;gap:var(--space-md);min-height:60vh"><h2>' + report + '</h2><p class="o-report-actions" style="display:flex;gap:var(--card-gap);flex-wrap:wrap">';
      if (htmlUrl) {
        body += '<a class="o-btn o-btn-secondary" href="' + esc(htmlUrl) + '" target="_blank" rel="noopener">Open HTML</a>';
      }
      if (pdfUrl) {
        body += '<a class="o-btn o-btn-secondary" href="' + esc(pdfUrl) + '" target="_blank" rel="noopener">Download PDF</a><button type="button" class="o-btn o-btn-primary" id="o-report-preview-pdf">Preview PDF</button>';
      }
      body += "</p>";
      if (htmlUrl) {
        body += '<iframe class="o-report-iframe" title="' + report + '" src="' + esc(htmlUrl) + '" style="flex:1;min-height:24rem;width:100%;border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--color-surface-1)"></iframe>';
      } else {
        body += '<p style="color:var(--text-muted)">Provide <code>reportName</code> and <code>ids</code> / <code>resId</code> or a full <code>reportUrl</code>.</p>';
      }
      body += "</section>";
      main.innerHTML = body;
      var prevBtn = main.querySelector("#o-report-preview-pdf");
      if (prevBtn && pdfUrl && window.UIComponents && window.UIComponents.PdfViewer && typeof window.UIComponents.PdfViewer.open === "function") {
        prevBtn.onclick = function() {
          window.UIComponents.PdfViewer.open(pdfUrl, report);
        };
      }
      return true;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.ReportViewModule = { render };
  })();

  // addons/web/static/src/app/form_footer_actions.js
  var form_footer_actions_exports = {};
  __export(form_footer_actions_exports, {
    buildFormFooterActionsHtml: () => buildFormFooterActionsHtml
  });
  function escHashRoute(route) {
    return String(route == null ? "" : route).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }
  function buildFormFooterActionsHtml(options) {
    var route = options.route || "";
    var isNew = !!options.isNew;
    var model = options.model || "";
    var reportName = options.reportName || null;
    var id = options.recordId;
    var html = '<p class="o-form-footer-actions">';
    html += '<button type="submit" id="btn-save" class="o-btn o-btn-primary o-shortcut-target" data-shortcut="Alt+S">Save</button> ';
    html += '<a href="#' + escHashRoute(route) + '" id="form-cancel" style="margin-left:0.5rem">Cancel</a>';
    if (isNew && (model === "crm.lead" || model === "res.partner")) {
      html += ' <button type="button" id="btn-ai-fill" title="Extract fields from pasted text" style="margin-left:0.5rem;padding:0.5rem 1rem;background:var(--color-accent,#6366f1);color:white;border:none;border-radius:4px;cursor:pointer">AI Fill</button>';
    }
    if (!isNew) {
      html += ' <button type="button" id="btn-duplicate" class="o-btn o-btn-secondary" style="margin-left:0.5rem">Duplicate</button>';
      if (reportName) {
        html += ' <a href="/report/html/' + encodeURIComponent(String(reportName)) + "/" + encodeURIComponent(String(id)) + '" target="_blank" rel="noopener" id="btn-print-form" class="o-btn o-btn-secondary o-shortcut-target" data-shortcut="Alt+P" style="margin-left:0.5rem;text-decoration:none">Print</a>';
        html += ' <button type="button" id="btn-preview-form" class="o-btn o-btn-secondary" style="margin-left:0.5rem">Preview</button>';
      }
      html += ' <a href="#" id="btn-delete-form" style="margin-left:0.5rem;font-size:0.9rem;color:#c00">Delete</a>';
    }
    html += "</p>";
    return html;
  }

  // addons/web/static/src/app/navbar_contract.js
  function registerNavbarContract() {
    window.__erpNavbarContract = {
      phase: "566",
      /** Legacy/AppCore.Navbar should call after writing chrome into the host slot. */
      markDelegated(host) {
        if (!host || !host.setAttribute) return;
        host.setAttribute("data-erp-navbar-contract", "566");
        host.setAttribute("data-erp-navbar-owner", "modern-delegated");
      }
    };
  }

  // addons/web/static/src/app/navbar_facade.js
  function registerNavbarFacade() {
    window.__erpNavbarFacade = {
      phase: "575",
      /** Call after systray HTML is injected into .o-systray-registry. */
      markSystrayRendered(host) {
        if (!host || !host.setAttribute) return;
        host.setAttribute("data-erp-systray-contract", "575");
      }
    };
  }

  // addons/web/static/src/app/router.js
  function getDataRouteSlugs() {
    if (typeof window !== "undefined" && window.__ERP_ROUTE_LEGACY && window.__ERP_ROUTE_LEGACY.DATA_ROUTES_SLUGS) {
      return window.__ERP_ROUTE_LEGACY.DATA_ROUTES_SLUGS;
    }
    return "";
  }
  function getRouteLegacy() {
    return typeof window !== "undefined" ? window.__ERP_ROUTE_LEGACY || null : null;
  }

  // addons/web/static/src/app/home_module.js
  function registerHomeModule() {
    window.AppCore = window.AppCore || {};
    window.AppCore.HomeModule = {
      getDataRouteSlugs,
      getRouteLegacy,
      describe: "App launcher + dashboard: legacy main.js + AppCore.Dashboard / DashboardKpiStrip"
    };
  }

  // addons/web/static/src/app/breadcrumb_strip.js
  var breadcrumb_strip_exports = {};
  __export(breadcrumb_strip_exports, {
    buildBreadcrumbsHtml: () => buildBreadcrumbsHtml
  });
  function escLabel(s) {
    return String(s == null ? "" : s).replace(/</g, "&lt;");
  }
  function buildBreadcrumbsHtml(actionStack) {
    const stack = Array.isArray(actionStack) ? actionStack : [];
    if (window.UIComponents && window.UIComponents.Breadcrumbs && typeof window.UIComponents.Breadcrumbs.renderHTML === "function") {
      return window.UIComponents.Breadcrumbs.renderHTML(stack);
    }
    if (stack.length <= 1) return "";
    let html = '<nav class="breadcrumbs" aria-label="Breadcrumb">';
    stack.forEach(function(entry, i) {
      if (i === stack.length - 1) {
        html += '<span class="breadcrumb-item active">' + escLabel(entry.label) + "</span>";
      } else {
        html += '<a class="breadcrumb-item" href="javascript:void(0)" data-bc-idx="' + i + '">' + escLabel(entry.label) + "</a>";
        html += '<span class="breadcrumb-sep">/</span>';
      }
    });
    html += "</nav>";
    return html;
  }

  // addons/web/static/src/app/kanban_control_strip.js
  var kanban_control_strip_exports = {};
  __export(kanban_control_strip_exports, {
    buildKanbanChromeHtml: () => buildKanbanChromeHtml
  });
  function escAttr(v) {
    return String(v == null ? "" : v).replace(/"/g, "&quot;");
  }
  function escHtml3(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }
  function buildKanbanChromeHtml(opts) {
    const title = opts.title || "";
    const vs = opts.viewSwitcherHtml || "";
    const st = opts.searchTerm || "";
    const addLabel = opts.addLabel || "Add";
    const mid = opts.middleSlotHtml || "";
    let html = "<h2>" + escHtml3(title) + "</h2>";
    html += '<p class="o-kanban-control-strip" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">';
    html += vs;
    html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + escAttr(st) + '">';
    html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
    html += mid;
    html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + escHtml3(addLabel) + "</button></p>";
    html += '<div id="kanban-area"></div>';
    return html;
  }

  // addons/web/static/src/app/chatter_strip.js
  var chatter_strip_exports = {};
  __export(chatter_strip_exports, {
    appendChatterRows: () => appendChatterRows,
    buildChatterChromeHtml: () => buildChatterChromeHtml,
    setChatterError: () => setChatterError
  });
  function escAttr2(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }
  function buildChatterChromeHtml(options) {
    var model = options && options.model || "";
    var label = options && options.label || "Messages";
    return "<p><label>" + escAttr2(label) + '</label><div id="chatter-messages" class="o-chatter o-chatter-chrome o-card-gradient" data-model="' + escAttr2(model) + '"><header class="o-chatter-chrome-head" aria-label="Discussion"><span class="o-chatter-chrome-title">Activity</span></header><div class="chatter-messages-list o-chatter-messages-scroll"></div><div class="chatter-compose o-chatter-compose"><textarea id="chatter-input" class="o-chatter-textarea" placeholder="Add a comment..." rows="3"></textarea><div class="o-chatter-compose-row"><input type="file" id="chatter-file" class="o-chatter-file" multiple /><span id="chatter-attachments" class="o-chatter-attachments-hint"></span></div><label class="o-chatter-send-email-label"><input type="checkbox" id="chatter-send-email" /> Send as email</label><button type="button" id="chatter-send" class="o-btn o-btn-primary o-chatter-send">Send</button></div></div></p>';
  }
  function escapeBodyText(body) {
    return String(body || "").replace(/</g, "&lt;").replace(/\n/g, "<br>");
  }
  function appendChatterRows(container, rows, nameMap) {
    if (!container) return;
    container.innerHTML = "";
    nameMap = nameMap || {};
    if (!rows || !rows.length) {
      container.innerHTML = '<p class="o-chatter-empty">No messages yet.</p>';
      return;
    }
    rows.forEach(function(r) {
      var authorName = r.author_id ? nameMap[r.author_id] || "User #" + (Array.isArray(r.author_id) ? r.author_id[0] : r.author_id) : "Unknown";
      var dateStr = r.date ? String(r.date).replace("T", " ").slice(0, 16) : "";
      var body = escapeBodyText(r.body || "");
      var attHtml = "";
      var aids = r.attachment_ids || [];
      if (aids.length) {
        var ids = aids.map(function(x) {
          return Array.isArray(x) ? x[0] : x;
        });
        attHtml = '<div class="o-chatter-attachments">' + ids.map(function(aid) {
          return '<a href="/web/attachment/download/' + encodeURIComponent(String(aid)) + '" target="_blank" rel="noopener" class="o-chatter-attachment-link">Attachment</a>';
        }).join("") + "</div>";
      }
      var div = document.createElement("div");
      div.className = "chatter-msg o-chatter-msg";
      div.innerHTML = '<div class="o-chatter-msg-meta">' + escAttr2(authorName) + " \xB7 " + escAttr2(dateStr) + '</div><div class="o-chatter-msg-body">' + body + "</div>" + attHtml;
      container.appendChild(div);
    });
  }
  function setChatterError(container, message) {
    if (!container) return;
    container.innerHTML = '<p class="o-chatter-error">' + escAttr2(message || "Could not load messages.") + "</p>";
  }

  // addons/web/static/src/app/kanban_card_chrome.js
  var kanban_card_chrome_exports = {};
  __export(kanban_card_chrome_exports, {
    buildKanbanCardHtml: () => buildKanbanCardHtml
  });
  function escAttr3(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }
  function escHtml4(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }
  function buildKanbanCardHtml(record, options) {
    const opts = options || {};
    const fields = Array.isArray(opts.fields) ? opts.fields : ["name", "expected_revenue", "date_deadline"];
    const draggable = opts.onStageChange ? ' draggable="true"' : "";
    const rid = record && record.id != null ? String(record.id) : "";
    const name = (record && record.name != null ? record.name : "\u2014").replace(/</g, "&lt;");
    let html = '<div class="kanban-card o-kanban-card o-card-gradient" data-id="' + escAttr3(rid) + '"' + draggable + ">";
    html += '<div class="o-kanban-card-head"><label class="o-kanban-card-select-row"><input type="checkbox" class="kanban-select" data-id="' + escAttr3(rid) + '"><strong class="o-kanban-card-title">' + name + "</strong></label></div>";
    html += '<div class="o-kanban-card-body">';
    if (typeof opts.cardTemplate === "function") {
      html += '<div class="kanban-template">' + String(opts.cardTemplate(record) || "") + "</div>";
    }
    fields.forEach(function(fname) {
      if (fname === "name") return;
      const v = record[fname];
      if (v == null || v === "") return;
      let disp = v;
      if (Array.isArray(disp) && disp.length) disp = disp[1] != null ? disp[1] : disp[0];
      html += '<div class="o-kanban-card-field" data-field="' + escAttr3(fname) + '"><span class="o-kanban-card-field-value">' + escHtml4(disp) + "</span></div>";
    });
    html += "</div></div>";
    return html;
  }

  // addons/web/static/src/app/graph_view_chrome.js
  (function() {
    function escAttr4(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }
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
      types.forEach(function(t) {
        var active = t === graphType;
        html += '<button type="button" class="o-graph-type-btn btn-graph-type' + (active ? " active" : "") + '" data-type="' + escAttr4(t) + '">' + (t.charAt(0).toUpperCase() + t.slice(1)) + "</button>";
      });
      html += "</span>";
      html += '<div role="search" class="o-graph-search-wrap o-list-fallback-search">';
      html += '<input type="text" id="list-search" class="o-graph-search-field o-list-search-field" placeholder="Search..." aria-label="Search records" value="' + escAttr4(searchTerm) + '">';
      html += '<button type="button" id="btn-search" class="o-btn o-graph-search-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button>';
      if (model === "crm.lead") {
        html += '<select id="list-stage-filter" class="o-graph-stage-select o-list-toolbar-select" aria-label="Stage"><option value="">All stages</option></select>';
      }
      html += '<button type="button" id="btn-add" class="o-btn o-graph-add-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + escAttr4(addLabel) + "</button>";
      html += "</div></div>";
      return html;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.GraphViewChrome = { buildToolbarHtml };
  })();

  // addons/web/static/src/app/pivot_view_chrome.js
  (function() {
    function escAttr4(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }
    function buildToolbarHtml(options) {
      var o = options || {};
      var viewSwitcherHtml = o.viewSwitcherHtml || "";
      var searchTerm = o.searchTerm || "";
      var model = o.model || "";
      var addLabel = o.addLabel || "Add";
      var html = '<div class="o-pivot-toolbar o-pivot-toolbar-chrome">';
      html += viewSwitcherHtml;
      html += '<button type="button" id="btn-pivot-flip" class="o-pivot-toolbar-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Flip axes</button>';
      html += '<button type="button" id="btn-pivot-download" class="o-pivot-toolbar-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Download CSV</button>';
      html += '<div role="search" class="o-pivot-search-wrap o-list-fallback-search">';
      html += '<input type="text" id="list-search" class="o-pivot-search-field o-list-search-field" placeholder="Search..." aria-label="Search records" value="' + escAttr4(searchTerm) + '">';
      html += '<button type="button" id="btn-search" class="o-btn o-pivot-search-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button>';
      if (model === "crm.lead") {
        html += '<select id="list-stage-filter" class="o-pivot-stage-select o-list-toolbar-select" aria-label="Stage"><option value="">All stages</option></select>';
      }
      html += '<button type="button" id="btn-add" class="o-btn o-pivot-add-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + escAttr4(addLabel) + "</button>";
      html += "</div></div>";
      return html;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.PivotViewChrome = { buildToolbarHtml };
  })();

  // addons/web/static/src/app/calendar_view_chrome.js
  (function() {
    function escAttr4(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }
    function buildToolbarHtml(options) {
      var o = options || {};
      var viewSwitcherHtml = o.viewSwitcherHtml || "";
      var monthTitle = o.monthTitle || "";
      var searchTerm = o.searchTerm || "";
      var addLabel = o.addLabel || "Add";
      var html = '<div class="o-calendar-toolbar o-calendar-toolbar-chrome">';
      html += viewSwitcherHtml;
      html += '<button type="button" id="cal-prev" class="o-calendar-nav-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted" aria-label="Previous month">Prev</button>';
      html += '<span id="cal-title" class="o-calendar-month-title">' + escAttr4(monthTitle) + "</span>";
      html += '<button type="button" id="cal-next" class="o-calendar-nav-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted" aria-label="Next month">Next</button>';
      html += '<button type="button" id="cal-today" class="o-calendar-nav-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Today</button>';
      html += '<div role="search" class="o-calendar-search-wrap o-list-fallback-search">';
      html += '<input type="text" id="list-search" class="o-calendar-search-field o-list-search-field" placeholder="Search..." aria-label="Search records" value="' + escAttr4(searchTerm) + '">';
      html += '<button type="button" id="btn-search" class="o-btn o-calendar-search-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button>';
      html += '<button type="button" id="btn-add" class="o-btn o-calendar-add-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + escAttr4(addLabel) + "</button>";
      html += "</div></div>";
      return html;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.CalendarViewChrome = { buildToolbarHtml };
  })();

  // addons/web/static/src/app/core/dialog.js
  var owl15 = window.owl;
  var { Component: Component14, useState: useState12, xml: xml14, useRef: useRef9, onMounted: onMounted10, onWillUnmount: onWillUnmount8, useEnv: useEnv8 } = owl15;
  var _overlayStack = [];
  function pushOverlay(entry) {
    _overlayStack.push(entry);
    document.body.classList.add("o-modal-open");
  }
  function removeOverlay(id) {
    const idx = _overlayStack.findIndex((e) => e.id === id);
    if (idx >= 0) _overlayStack.splice(idx, 1);
    if (_overlayStack.length === 0) {
      document.body.classList.remove("o-modal-open");
    }
  }
  var _nextId = 1;
  function nextOverlayId() {
    return "dialog-" + _nextId++;
  }
  var Dialog = class extends Component14 {
    static template = xml14`
    <div class="o-dialog-overlay"
         role="dialog"
         aria-modal="true"
         t-att-aria-labelledby="props.titleId || 'o-dialog-title'"
         t-on-click.self="onOverlayClick">
      <div class="o-dialog-panel" t-att-style="props.size ? ('max-width:' + sizeMap[props.size]) : ''">
        <div class="o-dialog-header">
          <h3 t-att-id="props.titleId || 'o-dialog-title'" class="o-dialog-title">
            <t t-esc="props.title || 'Dialog'"/>
          </h3>
          <button t-if="props.closeable !== false"
                  type="button"
                  class="o-dialog-close-btn"
                  aria-label="Close"
                  t-on-click="onClose">&#x2715;</button>
        </div>
        <div class="o-dialog-body">
          <t t-slot="default"/>
        </div>
        <div t-if="__slots__.footer" class="o-dialog-footer">
          <t t-slot="footer"/>
        </div>
      </div>
    </div>`;
    static props = {
      title: { type: String, optional: true },
      titleId: { type: String, optional: true },
      size: { type: String, optional: true },
      // sm | md | lg | xl | full
      closeable: { type: Boolean, optional: true },
      onClose: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    setup() {
      this.sizeMap = {
        sm: "480px",
        md: "640px",
        lg: "800px",
        xl: "960px",
        full: "100vw"
      };
      this._overlayId = nextOverlayId();
      pushOverlay({ id: this._overlayId, component: this });
      useExternalListener(document, "keydown", this.onKeyDown.bind(this));
      onWillUnmount8(() => {
        removeOverlay(this._overlayId);
      });
      const focusRef = useRef9("firstFocus");
      onMounted10(() => {
        const panel = document.querySelector('.o-dialog-overlay[role="dialog"]');
        if (panel) {
          const focusable = panel.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable) focusable.focus();
        }
      });
    }
    onKeyDown(ev) {
      if (ev.key === "Escape") {
        const top = _overlayStack[_overlayStack.length - 1];
        if (top && top.id === this._overlayId) {
          ev.preventDefault();
          this.onClose();
        }
      }
    }
    onOverlayClick() {
      if (this.props.closeable !== false) this.onClose();
    }
    onClose() {
      if (typeof this.props.onClose === "function") {
        this.props.onClose();
      }
    }
  };
  var ConfirmationDialog = class extends Component14 {
    static template = xml14`
    <Dialog title="props.title" t-on-dialog-close="onCancel">
      <p class="o-dialog-body-text"><t t-esc="props.body || props.message"/></p>
      <t t-set-slot="footer">
        <div class="o-dialog-actions">
          <button type="button" class="o-btn o-btn-secondary" t-on-click="onCancel">
            <t t-esc="props.cancelLabel || 'Cancel'"/>
          </button>
          <button type="button" class="o-btn o-btn-primary" t-on-click="onConfirm">
            <t t-esc="props.confirmLabel || 'OK'"/>
          </button>
        </div>
      </t>
    </Dialog>`;
    static components = { Dialog };
    static props = {
      title: { type: String, optional: true },
      body: { type: String, optional: true },
      message: { type: String, optional: true },
      confirmLabel: { type: String, optional: true },
      cancelLabel: { type: String, optional: true },
      onConfirm: Function,
      onCancel: Function
    };
    onConfirm() {
      this.props.onConfirm();
    }
    onCancel() {
      this.props.onCancel();
    }
  };
  function mountTransientDialog(ComponentClass, props) {
    const container = document.createElement("div");
    container.className = "o-dialog-mount-point";
    document.body.appendChild(container);
    let app = null;
    function cleanup() {
      if (app) {
        try {
          app.destroy();
        } catch (_e) {
        }
        app = null;
      }
      if (container.parentNode) container.parentNode.removeChild(container);
    }
    const fullProps = Object.assign({}, props, {
      onClose: function() {
        if (typeof props.onClose === "function") props.onClose();
        cleanup();
      },
      onCancel: function(result) {
        if (typeof props.onCancel === "function") props.onCancel(result);
        cleanup();
      },
      onConfirm: function(result) {
        if (typeof props.onConfirm === "function") props.onConfirm(result);
        cleanup();
      }
    });
    try {
      const owlLib = window.owl;
      if (owlLib && owlLib.mount) {
        app = owlLib.mount(ComponentClass, container, { props: fullProps });
      }
    } catch (_e) {
      cleanup();
    }
    return { close: cleanup };
  }
  var DialogService = {
    /**
     * Open a confirmation dialog.
     * @returns {Promise<boolean>}
     */
    confirm(opts) {
      return new Promise((resolve) => {
        mountTransientDialog(ConfirmationDialog, {
          title: opts.title,
          body: opts.body || opts.message,
          confirmLabel: opts.confirmLabel,
          cancelLabel: opts.cancelLabel,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
          onClose: () => resolve(false)
        });
      });
    },
    /**
     * Open any Dialog with arbitrary content.
     * @param {typeof Component} ComponentClass — the component to render inside a Dialog wrapper
     * @param {object} props
     * @returns {{ close: Function }}
     */
    open(ComponentClass, props) {
      return mountTransientDialog(ComponentClass, props || {});
    }
  };
  window.AppCore = window.AppCore || {};
  window.AppCore.DialogService = DialogService;
  window.AppCore.Dialog = Dialog;
  window.AppCore.ConfirmationDialog = ConfirmationDialog;

  // addons/web/static/src/app/core/notebook.js
  var owl16 = window.owl;
  var { Component: Component15, useState: useState13, xml: xml15, onMounted: onMounted11 } = owl16;
  var NotebookPage = class extends Component15 {
    static template = xml15`
    <div class="o-notebook-page"
         t-att-class="{ 'o-notebook-page--active': props.isActive }"
         role="tabpanel"
         t-att-aria-labelledby="'o-nb-tab-' + props.pageId"
         t-att-id="'o-nb-panel-' + props.pageId"
         t-att-hidden="!props.isActive">
      <t t-slot="default"/>
    </div>`;
    static props = {
      pageId: String,
      isActive: Boolean,
      slots: { type: Object, optional: true }
    };
  };
  var Notebook = class extends Component15 {
    static template = xml15`
    <div class="o-notebook">
      <div class="o-notebook-tabs" role="tablist">
        <t t-foreach="computedPages" t-as="page" t-key="page.id">
          <button class="o-notebook-tab"
                  t-att-class="{ 'o-notebook-tab--active': state.activePage === page.id }"
                  role="tab"
                  t-att-id="'o-nb-tab-' + page.id"
                  t-att-aria-controls="'o-nb-panel-' + page.id"
                  t-att-aria-selected="state.activePage === page.id ? 'true' : 'false'"
                  t-on-click="() => activatePage(page.id)"
                  t-on-keydown="(ev) => onTabKeyDown(ev, page.id)">
            <t t-esc="page.title"/>
          </button>
        </t>
      </div>
      <div class="o-notebook-content">
        <t t-if="props.pages">
          <t t-foreach="props.pages" t-as="page" t-key="page.id">
            <NotebookPage pageId="page.id" isActive="state.activePage === page.id">
              <t t-component="page.Component" t-props="page.props"/>
            </NotebookPage>
          </t>
        </t>
        <t t-else="">
          <t t-slot="default"/>
        </t>
      </div>
    </div>`;
    static components = { NotebookPage };
    static props = {
      /** Explicit pages: [{ id, title, Component, props }] */
      pages: { type: Array, optional: true },
      defaultPage: { type: String, optional: true },
      onPageUpdate: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    setup() {
      const firstId = this._getFirstPageId();
      this.state = useState13({ activePage: this.props.defaultPage || firstId || "" });
      onMounted11(() => {
        if (!this.state.activePage && this.computedPages.length) {
          this.state.activePage = this.computedPages[0].id;
        }
      });
    }
    _getFirstPageId() {
      if (this.props.pages && this.props.pages.length) {
        return this.props.pages[0].id;
      }
      return "";
    }
    get computedPages() {
      return this.props.pages || [];
    }
    activatePage(id) {
      if (this.state.activePage === id) return;
      this.state.activePage = id;
      if (typeof this.props.onPageUpdate === "function") {
        this.props.onPageUpdate(id);
      }
    }
    onTabKeyDown(ev, id) {
      const pages = this.computedPages;
      const idx = pages.findIndex((p) => p.id === id);
      if (ev.key === "ArrowRight") {
        ev.preventDefault();
        const next = pages[(idx + 1) % pages.length];
        if (next) this.activatePage(next.id);
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        const prev = pages[(idx - 1 + pages.length) % pages.length];
        if (prev) this.activatePage(prev.id);
      }
    }
  };
  window.AppCore = window.AppCore || {};
  window.AppCore.Notebook = Notebook;
  window.AppCore.NotebookPage = NotebookPage;

  // addons/web/static/src/app/core/autocomplete.js
  var owl17 = window.owl;
  var { Component: Component16, useState: useState14, xml: xml16, useRef: useRef10, onWillUnmount: onWillUnmount9 } = owl17;
  var AutoComplete = class extends Component16 {
    static template = xml16`
    <div class="o-autocomplete" t-att-class="{ 'o-autocomplete--open': state.open }">
      <input
        t-ref="input"
        type="text"
        class="o-autocomplete-input o-field-input"
        t-att-placeholder="props.placeholder || ''"
        t-att-value="state.inputValue"
        t-att-disabled="props.disabled ? '' : null"
        autocomplete="off"
        t-on-input="onInput"
        t-on-keydown="onKeyDown"
        t-on-focus="onFocus"
        t-on-blur="onBlur"
        t-att-aria-expanded="state.open ? 'true' : 'false'"
        aria-autocomplete="list"
        t-att-aria-activedescendant="state.activeIdx >= 0 ? 'o-ac-option-' + state.activeIdx : ''"
      />
      <t t-if="state.open and state.options.length">
        <ul class="o-autocomplete-list" role="listbox">
          <t t-foreach="state.options" t-as="option" t-key="option_index">
            <li
              t-att-id="'o-ac-option-' + option_index"
              class="o-autocomplete-option"
              t-att-class="{ 'o-autocomplete-option--active': state.activeIdx === option_index }"
              role="option"
              t-att-aria-selected="state.activeIdx === option_index ? 'true' : 'false'"
              t-on-mousedown.prevent="() => selectOption(option)">
              <t t-esc="option.label"/>
            </li>
          </t>
        </ul>
      </t>
      <t t-if="state.open and !state.options.length and !state.loading">
        <div class="o-autocomplete-empty">No results</div>
      </t>
    </div>`;
    static props = {
      /** source(term) → Promise<{value, label}[]> or [{value,label}] */
      source: Function,
      value: { optional: true },
      onSelect: { type: Function, optional: true },
      onChange: { type: Function, optional: true },
      placeholder: { type: String, optional: true },
      disabled: { type: Boolean, optional: true },
      debounce: { type: Number, optional: true },
      slots: { type: Object, optional: true }
    };
    setup() {
      this.state = useState14({
        inputValue: this._labelFor(this.props.value) || "",
        open: false,
        options: [],
        loading: false,
        activeIdx: -1
      });
      this.inputRef = useRef10("input");
      this._search = useDebounce(this._doSearch.bind(this), this.props.debounce ?? 250);
      useExternalListener(document, "click", this.onDocumentClick.bind(this));
    }
    _labelFor(value) {
      if (!value) return "";
      if (typeof value === "object") return value.label || value.name || String(value.id || "");
      return String(value);
    }
    onInput(ev) {
      const term = ev.target.value;
      this.state.inputValue = term;
      if (typeof this.props.onChange === "function") this.props.onChange(term);
      this._search(term);
    }
    onFocus() {
      if (!this.state.open) {
        this._doSearch(this.state.inputValue);
      }
    }
    onBlur() {
    }
    async _doSearch(term) {
      this.state.loading = true;
      this.state.open = true;
      try {
        const result = await Promise.resolve(this.props.source(term));
        const options = Array.isArray(result) ? result : [];
        this.state.options = options;
        this.state.activeIdx = options.length > 0 ? 0 : -1;
      } catch (_e) {
        this.state.options = [];
      } finally {
        this.state.loading = false;
      }
    }
    onKeyDown(ev) {
      const { open, options, activeIdx } = this.state;
      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        if (!open) {
          this._doSearch(this.state.inputValue);
          return;
        }
        this.state.activeIdx = Math.min(activeIdx + 1, options.length - 1);
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        this.state.activeIdx = Math.max(activeIdx - 1, 0);
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        if (open && options[activeIdx]) {
          this.selectOption(options[activeIdx]);
        }
      } else if (ev.key === "Escape") {
        this.closeList();
      } else if (ev.key === "Tab") {
        if (open && options[activeIdx]) {
          this.selectOption(options[activeIdx]);
        } else {
          this.closeList();
        }
      }
    }
    selectOption(option) {
      this.state.inputValue = option.label || "";
      this.closeList();
      if (typeof this.props.onSelect === "function") {
        this.props.onSelect(option);
      }
    }
    closeList() {
      this.state.open = false;
      this.state.options = [];
      this.state.activeIdx = -1;
    }
    onDocumentClick(ev) {
      if (!this.state.open) return;
      const input = this.inputRef.el;
      const root = input && input.closest(".o-autocomplete");
      if (root && !root.contains(ev.target)) {
        this.closeList();
      }
    }
  };
  window.AppCore = window.AppCore || {};
  window.AppCore.AutoComplete = AutoComplete;

  // addons/web/static/src/app/core/colorlist.js
  var owl18 = window.owl;
  var { Component: Component17, useState: useState15, xml: xml17 } = owl18;
  var COLORS = [
    { idx: 0, name: "No color", css: "transparent" },
    { idx: 1, name: "Red", css: "#e06c75" },
    { idx: 2, name: "Orange", css: "#e5a44a" },
    { idx: 3, name: "Yellow", css: "#e5d04a" },
    { idx: 4, name: "Lime", css: "#98c379" },
    { idx: 5, name: "Green", css: "#2e7d32" },
    { idx: 6, name: "Teal", css: "#21867a" },
    { idx: 7, name: "Cyan", css: "#56b6c2" },
    { idx: 8, name: "Blue", css: "#61afef" },
    { idx: 9, name: "Indigo", css: "#5e81f4" },
    { idx: 10, name: "Purple", css: "#c678dd" },
    { idx: 11, name: "Pink", css: "#d44e8e" }
  ];
  var ColorList = class extends Component17 {
    static template = xml17`
    <div class="o-colorlist">
      <button type="button"
              class="o-colorlist-toggle"
              t-att-style="'background:' + currentColor.css"
              t-att-aria-label="'Color: ' + currentColor.name"
              t-on-click="toggleExpanded">
        <t t-if="!state.expanded">&#9660;</t>
        <t t-else="">&#9650;</t>
      </button>
      <t t-if="state.expanded">
        <div class="o-colorlist-swatches" role="listbox" aria-label="Color picker">
          <t t-foreach="colors" t-as="color" t-key="color.idx">
            <button type="button"
                    class="o-colorlist-swatch"
                    t-att-class="{ 'o-colorlist-swatch--selected': props.value === color.idx }"
                    role="option"
                    t-att-aria-selected="props.value === color.idx ? 'true' : 'false'"
                    t-att-aria-label="color.name"
                    t-att-style="'background:' + color.css"
                    t-on-click="() => selectColor(color.idx)"/>
          </t>
        </div>
      </t>
    </div>`;
    static props = {
      value: { type: Number, optional: true },
      onColorSelect: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    static colors = COLORS;
    setup() {
      this.state = useState15({ expanded: false });
      this.colors = COLORS;
      useExternalListener(window, "click", this.onWindowClick.bind(this));
    }
    get currentColor() {
      return COLORS.find((c) => c.idx === (this.props.value ?? 0)) || COLORS[0];
    }
    toggleExpanded() {
      this.state.expanded = !this.state.expanded;
    }
    selectColor(idx) {
      this.state.expanded = false;
      if (typeof this.props.onColorSelect === "function") {
        this.props.onColorSelect(idx);
      }
    }
    onWindowClick(ev) {
      if (!this.state.expanded) return;
      const root = ev.target.closest(".o-colorlist");
      if (!root) this.state.expanded = false;
    }
  };
  window.AppCore = window.AppCore || {};
  window.AppCore.ColorList = ColorList;
  window.AppCore.COLOR_PALETTE = COLORS;

  // addons/web/static/src/app/views/graph/graph_controller.js
  var owl19 = window.owl;
  var { Component: Component18, useState: useState16, xml: xml18, onMounted: onMounted12, useRef: useRef11, useEnv: useEnv9 } = owl19;
  var GraphController = class extends Component18 {
    static template = xml18`
    <div class="o-graph-controller o-graph-view">
      <div class="o-graph-toolbar" t-ref="toolbar"/>
      <div class="o-graph-content" t-ref="content"/>
    </div>`;
    static props = {
      resModel: String,
      domain: { type: Array, optional: true },
      context: { type: Object, optional: true },
      measure: { type: String, optional: true },
      groupBy: { type: Array, optional: true },
      mode: { type: String, optional: true },
      // bar | line | pie
      slots: { type: Object, optional: true }
    };
    setup() {
      this.env = useEnv9();
      this.toolbarRef = useRef11("toolbar");
      this.contentRef = useRef11("content");
      onMounted12(() => this._renderLegacy());
    }
    _renderLegacy() {
      const GVM = window.AppCore && window.AppCore.GraphViewModule;
      const el = this.contentRef.el;
      if (!el) return;
      if (GVM && typeof GVM.render === "function") {
        GVM.render(el, {
          model: this.props.resModel,
          domain: this.props.domain || [],
          mode: this.props.mode || "bar",
          groupBy: this.props.groupBy || [],
          rpc: window.Services && window.Services.rpc
        });
      } else {
        el.innerHTML = '<p class="o-skeleton-msg">Graph view loading\u2026</p>';
      }
    }
  };
  viewRegistry.add("graph", {
    type: "graph",
    Controller: GraphController,
    searchMenuTypes: ["filter", "groupBy", "favorite"]
  });
  window.AppCore = window.AppCore || {};
  window.AppCore.GraphController = GraphController;

  // addons/web/static/src/app/views/pivot/pivot_controller.js
  var owl20 = window.owl;
  var { Component: Component19, xml: xml19, onMounted: onMounted13, useRef: useRef12, useEnv: useEnv10 } = owl20;
  var PivotController = class extends Component19 {
    static template = xml19`
    <div class="o-pivot-controller o-pivot-view">
      <div class="o-pivot-toolbar" t-ref="toolbar"/>
      <div class="o-pivot-content" t-ref="content"/>
    </div>`;
    static props = {
      resModel: String,
      domain: { type: Array, optional: true },
      context: { type: Object, optional: true },
      rowGroupBy: { type: Array, optional: true },
      colGroupBy: { type: Array, optional: true },
      measures: { type: Array, optional: true },
      slots: { type: Object, optional: true }
    };
    setup() {
      this.env = useEnv10();
      this.contentRef = useRef12("content");
      onMounted13(() => this._renderLegacy());
    }
    _renderLegacy() {
      const PVM = window.AppCore && window.AppCore.PivotViewModule;
      const el = this.contentRef.el;
      if (!el) return;
      if (PVM && typeof PVM.render === "function") {
        PVM.render(el, {
          model: this.props.resModel,
          domain: this.props.domain || [],
          rpc: window.Services && window.Services.rpc
        });
      } else {
        el.innerHTML = '<p class="o-skeleton-msg">Pivot view loading\u2026</p>';
      }
    }
  };
  viewRegistry.add("pivot", {
    type: "pivot",
    Controller: PivotController,
    searchMenuTypes: ["filter", "groupBy", "favorite"]
  });
  window.AppCore = window.AppCore || {};
  window.AppCore.PivotController = PivotController;

  // addons/web/static/src/app/views/calendar/calendar_controller.js
  var owl21 = window.owl;
  var { Component: Component20, xml: xml20, onMounted: onMounted14, useRef: useRef13, useEnv: useEnv11 } = owl21;
  var CalendarController = class extends Component20 {
    static template = xml20`
    <div class="o-calendar-controller o-calendar-view">
      <div class="o-calendar-toolbar" t-ref="toolbar"/>
      <div class="o-calendar-content" t-ref="content"/>
    </div>`;
    static props = {
      resModel: String,
      domain: { type: Array, optional: true },
      context: { type: Object, optional: true },
      mode: { type: String, optional: true },
      // month | week | day
      slots: { type: Object, optional: true }
    };
    setup() {
      this.env = useEnv11();
      this.contentRef = useRef13("content");
      onMounted14(() => this._renderLegacy());
    }
    _renderLegacy() {
      const CVM = window.AppCore && window.AppCore.CalendarViewModule;
      const el = this.contentRef.el;
      if (!el) return;
      if (CVM && typeof CVM.render === "function") {
        CVM.render(el, {
          model: this.props.resModel,
          domain: this.props.domain || [],
          mode: this.props.mode || "month",
          rpc: window.Services && window.Services.rpc
        });
      } else {
        el.innerHTML = '<p class="o-skeleton-msg">Calendar view loading\u2026</p>';
      }
    }
  };
  viewRegistry.add("calendar", {
    type: "calendar",
    Controller: CalendarController,
    searchMenuTypes: ["filter", "favorite"]
  });
  window.AppCore = window.AppCore || {};
  window.AppCore.CalendarController = CalendarController;

  // addons/web/static/src/app/client_actions.js
  function hashAction(hash) {
    return function navAction(_def, _options) {
      window.location.hash = hash.startsWith("#") ? hash : "#" + hash;
      return { type: "client", tag: hash, handled: true };
    };
  }
  var BUILTIN_CLIENT_ACTIONS = {
    // Navigation
    "home": hashAction("home"),
    "web.home": hashAction("home"),
    "reload": function() {
      window.location.reload();
      return { handled: true };
    },
    "web.reload": function() {
      window.location.reload();
      return { handled: true };
    },
    // Shell destinations
    "settings": hashAction("settings"),
    "base_setup.action_general_configuration": hashAction("settings"),
    "discuss": hashAction("discuss"),
    "mail.action_discuss": hashAction("discuss"),
    "dashboard": hashAction("home"),
    "web.action_base_dashboard": hashAction("home"),
    // Import
    "import": function(def) {
      const model = def && (def.context && def.context.model) || def && def.params && def.params.model || null;
      const hash = model ? "import/" + String(model).replace(/\./g, "_") : "import";
      window.location.hash = "#" + hash;
      return { type: "client", tag: "import", handled: true };
    },
    "base_import.action_base_import": function(def) {
      const model = def && def.params && def.params.model;
      const hash = model ? "import/" + String(model).replace(/\./g, "_") : "import";
      window.location.hash = "#" + hash;
      return { type: "client", tag: "import", handled: true };
    },
    // Debug
    "web.action_base_debug_log": function() {
      window.location.hash = "#debug";
      return { handled: true };
    }
  };
  function registerBuiltinClientActions(env) {
    const registries = env && env.registries;
    const legacyAction = window.Services && window.Services.action;
    Object.entries(BUILTIN_CLIENT_ACTIONS).forEach(([tag, fn]) => {
      if (registries) {
        try {
          registries.category("actions").add(tag, fn);
        } catch (_e) {
        }
      }
      if (legacyAction && typeof legacyAction.registerClientAction === "function") {
        legacyAction.registerClientAction(tag, fn);
      }
    });
  }
  function registerClientAction(tag, fn, env) {
    if (!tag || typeof fn !== "function") return;
    BUILTIN_CLIENT_ACTIONS[tag] = fn;
    const registries = env && env.registries;
    if (registries) {
      registries.category("actions").add(tag, fn);
    }
    const legacyAction = window.Services && window.Services.action;
    if (legacyAction && typeof legacyAction.registerClientAction === "function") {
      legacyAction.registerClientAction(tag, fn);
    }
  }
  window.AppCore = window.AppCore || {};
  window.AppCore.registerClientAction = registerClientAction;
  window.AppCore.BUILTIN_CLIENT_ACTIONS = BUILTIN_CLIENT_ACTIONS;

  // addons/web/static/src/app/views/fields/field.js
  var owl22 = window.owl;
  var { Component: Component21, useState: useState17, xml: xml21, useEnv: useEnv12 } = owl22;
  var _fieldDescriptors = /* @__PURE__ */ new Map();
  var fieldRegistry = {
    add(type, descriptor) {
      const entry = Object.assign({ type }, descriptor);
      _fieldDescriptors.set(type, entry);
      return entry;
    },
    get(type) {
      return _fieldDescriptors.get(String(type || "char"));
    },
    getAll() {
      return Array.from(_fieldDescriptors.values());
    },
    has(type) {
      return _fieldDescriptors.has(String(type || ""));
    },
    /**
     * List/form readonly cell formatting (Post-1.248 P3).
     * Uses descriptor.format(value, record, col) when present; else char fallback.
     */
    format(fieldName, value, record, col) {
      const widget = col && col.widget || col && col.type || "char";
      const desc = _fieldDescriptors.get(String(widget || "char"));
      if (desc && typeof desc.format === "function") {
        try {
          const out = desc.format(value, record, col);
          if (out != null) return String(out);
        } catch (_e) {
        }
      }
      if (value == null) return "";
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (Array.isArray(value)) {
        return value.map((v) => Array.isArray(v) ? v[1] || v[0] : String(v)).join(", ");
      }
      return String(value);
    }
  };
  window.AppCore = window.AppCore || {};
  window.AppCore.fieldRegistry = fieldRegistry;
  window.Services = window.Services || {};
  window.Services.fieldRegistry = fieldRegistry;
  function getFieldVisualFeedback(fieldInfo, value, editMode) {
    const info = fieldInfo || {};
    const required = !!info.required;
    const readonly = !editMode || !!info.readonly;
    const invalid = required && editMode && (value === null || value === void 0 || value === "");
    return { required, readonly, invalid };
  }
  var Field = class extends Component21 {
    static template = xml21`
    <div class="o-field"
         t-att-class="{
           'o-field--readonly': feedback.readonly,
           'o-field--required': feedback.required,
           'o-field--invalid': feedback.invalid,
           'o-field--loading': state.loading,
         }"
         t-att-data-field-name="props.name"
         t-att-data-field-type="fieldType">
      <t t-if="FieldComponent">
        <t t-component="FieldComponent" t-props="fieldProps"/>
      </t>
      <t t-else="">
        <t t-if="feedback.readonly">
          <span class="o-field-value"><t t-esc="displayValue"/></span>
        </t>
        <t t-else="">
          <input type="text"
                 class="o-field-input"
                 t-att-value="displayValue"
                 t-att-name="props.name"
                 t-att-required="feedback.required ? '' : null"
                 t-att-readonly="feedback.readonly ? '' : null"
                 t-on-change="onInputChange"/>
        </t>
      </t>
      <t t-if="feedback.invalid">
        <div class="o-field-invalid-msg">This field is required</div>
      </t>
    </div>`;
    static props = {
      name: String,
      record: Object,
      fieldInfo: { type: Object, optional: true },
      editMode: { type: Boolean, optional: true },
      onChange: { type: Function, optional: true },
      widget: { type: String, optional: true },
      slots: { type: Object, optional: true }
    };
    setup() {
      this.state = useState17({ loading: false });
    }
    get fieldInfo() {
      return this.props.fieldInfo || {};
    }
    get fieldType() {
      return this.props.widget || this.fieldInfo.type || "char";
    }
    get feedback() {
      return getFieldVisualFeedback(
        this.fieldInfo,
        this.props.record[this.props.name],
        this.props.editMode !== false
      );
    }
    get value() {
      return this.props.record[this.props.name];
    }
    get displayValue() {
      const v = this.value;
      if (v == null) return "";
      if (typeof v === "boolean") return v ? "Yes" : "No";
      if (Array.isArray(v)) {
        if (Array.isArray(v[0])) return v.map((pair) => Array.isArray(pair) ? pair[1] || pair[0] : String(pair)).join(", ");
        return Array.isArray(v) ? v.map((i) => Array.isArray(i) ? i[1] || i[0] : String(i)).join(", ") : String(v);
      }
      return String(v);
    }
    get FieldComponent() {
      const descriptor = fieldRegistry.get(this.fieldType);
      return descriptor ? descriptor.component : null;
    }
    get fieldProps() {
      return {
        name: this.props.name,
        value: this.value,
        record: this.props.record,
        fieldInfo: this.fieldInfo,
        editMode: this.props.editMode !== false && !this.feedback.readonly,
        onChange: this.props.onChange
      };
    }
    onInputChange(ev) {
      if (typeof this.props.onChange === "function") {
        this.props.onChange(this.props.name, ev.target.value);
      }
    }
  };
  window.AppCore.Field = Field;

  // addons/web/static/src/app/views/fields/core_fields.js
  var owl23 = window.owl;
  var { Component: Component22, xml: xml22 } = owl23;
  var BASE_FIELD_PROPS = {
    name: String,
    value: { optional: true },
    record: Object,
    fieldInfo: { type: Object, optional: true },
    editMode: { type: Boolean, optional: true },
    onChange: { type: Function, optional: true },
    slots: { type: Object, optional: true }
  };
  function emitChange(component, value) {
    if (typeof component.props.onChange === "function") {
      component.props.onChange(component.props.name, value);
    }
  }
  var CharField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <span class="o-field-value"><t t-esc="props.value || ''"/></span>
    </t>
    <t t-else="">
      <input type="text" class="o-field-input"
             t-att-value="props.value || ''"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
    static props = BASE_FIELD_PROPS;
    onChange(v) {
      emitChange(this, v);
    }
  };
  var IntegerField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-numeric"><t t-esc="props.value ?? ''"/></span>
    </t>
    <t t-else="">
      <input type="number" step="1" class="o-field-input o-field-numeric"
             t-att-value="props.value ?? ''"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(parseInt(ev.target.value, 10))"/>
    </t>`;
    static props = BASE_FIELD_PROPS;
    onChange(v) {
      emitChange(this, isNaN(v) ? 0 : v);
    }
  };
  var FloatField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-numeric">
        <t t-esc="props.value != null ? Number(props.value).toFixed(props.fieldInfo and props.fieldInfo.digits or 2) : ''"/>
      </span>
    </t>
    <t t-else="">
      <input type="number" step="any" class="o-field-input o-field-numeric"
             t-att-value="props.value ?? ''"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(parseFloat(ev.target.value))"/>
    </t>`;
    static props = BASE_FIELD_PROPS;
    onChange(v) {
      emitChange(this, isNaN(v) ? 0 : v);
    }
  };
  var BooleanField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-boolean"
            t-att-class="{ 'o-field-boolean--true': props.value, 'o-field-boolean--false': !props.value }">
        <t t-if="props.value">&#10003;</t>
        <t t-else="">&#8211;</t>
      </span>
    </t>
    <t t-else="">
      <input type="checkbox" class="o-field-checkbox"
             t-att-checked="props.value ? '' : null"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.checked)"/>
    </t>`;
    static props = BASE_FIELD_PROPS;
    onChange(v) {
      emitChange(this, !!v);
    }
  };
  var DateField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-date"><t t-esc="formatDate(props.value)"/></span>
    </t>
    <t t-else="">
      <input type="date" class="o-field-input o-field-date"
             t-att-value="isoDate(props.value)"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
    static props = BASE_FIELD_PROPS;
    formatDate(v) {
      if (!v) return "";
      try {
        return new Date(v).toLocaleDateString();
      } catch (_e) {
        return String(v);
      }
    }
    isoDate(v) {
      if (!v) return "";
      try {
        return v.slice ? v.slice(0, 10) : "";
      } catch (_e) {
        return "";
      }
    }
    onChange(v) {
      emitChange(this, v);
    }
  };
  var DatetimeField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-datetime"><t t-esc="formatDatetime(props.value)"/></span>
    </t>
    <t t-else="">
      <input type="datetime-local" class="o-field-input o-field-datetime"
             t-att-value="isoDatetime(props.value)"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
    static props = BASE_FIELD_PROPS;
    formatDatetime(v) {
      if (!v) return "";
      try {
        return new Date(v).toLocaleString();
      } catch (_e) {
        return String(v);
      }
    }
    isoDatetime(v) {
      if (!v) return "";
      try {
        return v.replace ? v.replace(" ", "T").slice(0, 16) : "";
      } catch (_e) {
        return "";
      }
    }
    onChange(v) {
      emitChange(this, v ? v.replace("T", " ") : v);
    }
  };
  var TextField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-text"><t t-esc="props.value || ''"/></span>
    </t>
    <t t-else="">
      <textarea class="o-field-input o-field-textarea"
                t-att-name="props.name"
                t-on-change="(ev) => onChange(ev.target.value)">
        <t t-esc="props.value || ''"/>
      </textarea>
    </t>`;
    static props = BASE_FIELD_PROPS;
    onChange(v) {
      emitChange(this, v);
    }
  };
  var SelectionField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-selection"><t t-esc="selectedLabel"/></span>
    </t>
    <t t-else="">
      <select class="o-field-input o-field-select"
              t-att-name="props.name"
              t-on-change="(ev) => onChange(ev.target.value)">
        <option value="">-</option>
        <t t-foreach="selection" t-as="opt" t-key="opt[0]">
          <option t-att-value="opt[0]" t-att-selected="props.value === opt[0] ? '' : null">
            <t t-esc="opt[1]"/>
          </option>
        </t>
      </select>
    </t>`;
    static props = BASE_FIELD_PROPS;
    get selection() {
      return this.props.fieldInfo && this.props.fieldInfo.selection || [];
    }
    get selectedLabel() {
      const opt = this.selection.find((o) => o[0] === this.props.value);
      return opt ? opt[1] : this.props.value || "-";
    }
    onChange(v) {
      emitChange(this, v === "" ? false : v);
    }
  };
  var MonetaryField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-monetary">
        <t t-if="currencySymbol"><t t-esc="currencySymbol"/>&nbsp;</t>
        <t t-esc="formattedValue"/>
      </span>
    </t>
    <t t-else="">
      <div class="o-field-monetary-input">
        <t t-if="currencySymbol">
          <span class="o-field-monetary-symbol"><t t-esc="currencySymbol"/></span>
        </t>
        <input type="number" step="0.01" class="o-field-input o-field-numeric"
               t-att-value="props.value ?? ''"
               t-att-name="props.name"
               t-on-change="(ev) => onChange(parseFloat(ev.target.value))"/>
      </div>
    </t>`;
    static props = BASE_FIELD_PROPS;
    get currencySymbol() {
      const currencyId = this.props.record.currency_id;
      if (Array.isArray(currencyId) && currencyId[1]) {
        const symbols = { USD: "$", EUR: "\u20AC", GBP: "\xA3", JPY: "\xA5" };
        return symbols[String(currencyId[1]).toUpperCase()] || String(currencyId[1]);
      }
      return "";
    }
    get formattedValue() {
      const v = this.props.value;
      if (v == null) return "";
      return Number(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    onChange(v) {
      emitChange(this, isNaN(v) ? 0 : v);
    }
  };
  var BadgeField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <span class="o-field-badge"><t t-esc="displayText"/></span>
    </t>
    <t t-else="">
      <input type="text" class="o-field-input"
             t-att-value="props.value || ''"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
    static props = BASE_FIELD_PROPS;
    get displayText() {
      const v = this.props.value;
      if (v == null || v === "") return "\u2014";
      return String(v);
    }
    onChange(v) {
      emitChange(this, v);
    }
  };
  var StatusbarField = class extends Component22 {
    static template = xml22`
    <div class="o-field-statusbar" role="list">
      <t t-foreach="steps" t-as="step" t-key="step[0]">
        <span class="o-field-statusbar-step"
              t-att-class="{ 'o-field-statusbar-step--active': step[0] === props.value }">
          <t t-esc="step[1]"/>
        </span>
      </t>
    </div>`;
    static props = BASE_FIELD_PROPS;
    get steps() {
      const fi = this.props.fieldInfo || {};
      return fi.selection || [];
    }
  };
  var PriorityField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <span class="o-field-priority" t-att-aria-label="'Priority ' + level">
        <t t-foreach="starIndices" t-as="n" t-key="n">
          <span t-att-class="{ 'o-field-priority-star--on': n &lt;= level }" class="o-field-priority-star">&#9733;</span>
        </t>
      </span>
    </t>
    <t t-else="">
      <select class="o-field-input o-field-select" t-att-name="props.name"
              t-on-change="(ev) => onChange(parseInt(ev.target.value, 10))">
        <t t-foreach="starIndices" t-as="n" t-key="n">
          <option t-att-value="n" t-att-selected="n === level ? '' : null"><t t-esc="n"/></option>
        </t>
      </select>
    </t>`;
    static props = BASE_FIELD_PROPS;
    get starIndices() {
      return [1, 2, 3, 4, 5];
    }
    get level() {
      const v = parseInt(this.props.value, 10);
      if (isNaN(v) || v < 0) return 0;
      return Math.min(5, v);
    }
    onChange(v) {
      emitChange(this, v);
    }
  };
  var UrlField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <a t-if="href" class="o-field-link o-field-url" t-att-href="href" rel="noopener noreferrer" target="_blank">
        <t t-esc="href"/>
      </a>
      <span t-else="" class="o-field-value">—</span>
    </t>
    <t t-else="">
      <input type="url" class="o-field-input" t-att-value="props.value || ''" t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
    static props = BASE_FIELD_PROPS;
    get href() {
      const v = this.props.value;
      if (!v) return "";
      const s = String(v);
      if (/^https?:\/\//i.test(s)) return s;
      return "https://" + s;
    }
    onChange(v) {
      emitChange(this, v);
    }
  };
  var EmailField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <a t-if="props.value" class="o-field-link o-field-email" t-att-href="'mailto:' + props.value">
        <t t-esc="props.value"/>
      </a>
      <span t-else="" class="o-field-value">—</span>
    </t>
    <t t-else="">
      <input type="email" class="o-field-input" t-att-value="props.value || ''" t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
    static props = BASE_FIELD_PROPS;
    onChange(v) {
      emitChange(this, v);
    }
  };
  var PhoneField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <a t-if="props.value" class="o-field-link o-field-phone" t-att-href="'tel:' + telHref">
        <t t-esc="props.value"/>
      </a>
      <span t-else="" class="o-field-value">—</span>
    </t>
    <t t-else="">
      <input type="tel" class="o-field-input" t-att-value="props.value || ''" t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
    static props = BASE_FIELD_PROPS;
    get telHref() {
      return String(this.props.value || "").replace(/\s+/g, "");
    }
    onChange(v) {
      emitChange(this, v);
    }
  };
  var ImageField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <span class="o-field-image-wrap">
        <img t-if="imgSrc" class="o-field-image-thumb" t-att-src="imgSrc" alt=""/>
        <span t-else="" class="o-field-image-placeholder">—</span>
      </span>
    </t>
    <t t-else="">
      <input type="text" class="o-field-input" placeholder="Image URL"
             t-att-value="props.value || ''" t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
    static props = BASE_FIELD_PROPS;
    get imgSrc() {
      const v = this.props.value;
      if (!v) return "";
      if (typeof v === "string") return v;
      return "";
    }
    onChange(v) {
      emitChange(this, v);
    }
  };
  var ColorPickerField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <span class="o-field-color-swatch" t-att-style="swatchStyle" role="img" t-att-aria-label="colorLabel"/>
    </t>
    <t t-else="">
      <input type="color" class="o-field-color-input" t-att-value="hexValue" t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
    static props = BASE_FIELD_PROPS;
    get hexValue() {
      const v = this.props.value;
      if (!v) return "#000000";
      const s = String(v);
      return s.startsWith("#") ? s : "#" + s;
    }
    get swatchStyle() {
      return "background-color:" + this.hexValue + ";box-shadow:inset 0 0 0 1px var(--color-border);";
    }
    get colorLabel() {
      return "Color " + (this.props.value || this.hexValue);
    }
    onChange(v) {
      emitChange(this, v);
    }
  };
  var HtmlField = class extends Component22 {
    static template = xml22`
    <t t-if="!props.editMode">
      <div class="o-field-value o-field-html" t-out="props.value || ''"/>
    </t>
    <t t-else="">
      <div class="o-field-html-editor"
           contenteditable="true"
           t-out="props.value || ''"
           t-on-blur="onBlur"
           t-att-data-field="props.name"/>
    </t>`;
    static props = BASE_FIELD_PROPS;
    onBlur(ev) {
      emitChange(this, ev.target.innerHTML);
    }
  };
  function reg(type, component, format) {
    const desc = { type, component };
    if (typeof format === "function") desc.format = format;
    fieldRegistry.add(type, desc);
  }
  var CORE_FIELD_COMPONENTS = [
    ["char", CharField],
    ["integer", IntegerField],
    ["float", FloatField],
    ["boolean", BooleanField],
    ["date", DateField],
    ["datetime", DatetimeField],
    ["text", TextField],
    ["selection", SelectionField],
    ["monetary", MonetaryField],
    ["html", HtmlField]
  ];
  CORE_FIELD_COMPONENTS.forEach(([type, component]) => {
    reg(type, component);
  });
  reg("badge", BadgeField, (v) => v == null || v === "" ? "" : String(v));
  reg("statusbar", StatusbarField, (v, _r, col) => {
    const sel = col && col.selection || [];
    const opt = sel.find((o) => o[0] === v);
    return opt ? opt[1] : v != null ? String(v) : "";
  });
  reg("priority", PriorityField, (v) => v == null ? "" : String(v));
  reg("url", UrlField, (v) => v == null ? "" : String(v));
  reg("email", EmailField, (v) => v == null ? "" : String(v));
  reg("phone", PhoneField, (v) => v == null ? "" : String(v));
  reg("image", ImageField, (v) => v ? "[image]" : "");
  reg("color_picker", ColorPickerField, (v) => v == null ? "" : String(v));
  window.AppCore = window.AppCore || {};
  window.AppCore.CoreFields = Object.fromEntries(
    CORE_FIELD_COMPONENTS.map(([t, c]) => [t, c])
  );

  // addons/web/static/src/app/views/fields/relational_fields.js
  var owl24 = window.owl;
  var { Component: Component23, useState: useState18, xml: xml23, useEnv: useEnv13, onMounted: onMounted15 } = owl24;
  function emitChange2(component, value) {
    if (typeof component.props.onChange === "function") {
      component.props.onChange(component.props.name, value);
    }
  }
  var Many2oneField = class extends Component23 {
    static template = xml23`
    <div class="o-field-many2one">
      <t t-if="!props.editMode">
        <span class="o-field-value">
          <t t-if="props.value">
            <t t-esc="displayName"/>
          </t>
          <t t-else="">-</t>
        </span>
      </t>
      <t t-else="">
        <AutoComplete
          source="searchRecords"
          value="currentValue"
          onSelect="onSelect"
          placeholder="Search..."
          debounce="300"/>
      </t>
    </div>`;
    static components = { AutoComplete };
    static props = {
      name: String,
      value: { optional: true },
      record: Object,
      fieldInfo: { type: Object, optional: true },
      editMode: { type: Boolean, optional: true },
      onChange: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    get comodel() {
      return this.props.fieldInfo && this.props.fieldInfo.comodel_name || "";
    }
    get displayName() {
      const v = this.props.value;
      if (!v) return "";
      if (Array.isArray(v)) return v[1] || String(v[0] || "");
      if (typeof v === "object") return v.display_name || v.name || String(v.id || "");
      return String(v);
    }
    get currentValue() {
      return { label: this.displayName, value: Array.isArray(this.props.value) ? this.props.value[0] : this.props.value };
    }
    async searchRecords(term) {
      const orm = window.Services && window.Services.orm;
      const comodel = this.comodel;
      if (!orm || !comodel) return [];
      try {
        const domain = term ? [["display_name", "ilike", term]] : [];
        const results = await orm.nameSearch(comodel, term, domain, { limit: 20 });
        return (Array.isArray(results) ? results : []).map(([id, name]) => ({ value: id, label: name }));
      } catch (_e) {
        return [];
      }
    }
    onSelect(option) {
      emitChange2(this, [option.value, option.label]);
    }
  };
  var Many2manyTagsField = class extends Component23 {
    static template = xml23`
    <div class="o-field-many2many-tags">
      <div class="o-m2m-tags-container">
        <t t-foreach="tags" t-as="tag" t-key="tag.id">
          <span class="o-m2m-tag"
                t-att-class="'o-m2m-tag--color-' + (tag.color || 0)">
            <t t-esc="tag.name"/>
            <button t-if="props.editMode"
                    type="button"
                    class="o-m2m-tag-remove"
                    t-att-aria-label="'Remove ' + tag.name"
                    t-on-click="() => removeTag(tag.id)">&#x2715;</button>
          </span>
        </t>
        <t t-if="props.editMode">
          <AutoComplete
            source="searchTags"
            value="null"
            onSelect="addTag"
            placeholder="Add tag..."
            debounce="200"/>
        </t>
      </div>
    </div>`;
    static components = { AutoComplete };
    static props = {
      name: String,
      value: { optional: true },
      // Array of [id, name] pairs or ids
      record: Object,
      fieldInfo: { type: Object, optional: true },
      editMode: { type: Boolean, optional: true },
      onChange: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    get comodel() {
      return this.props.fieldInfo && this.props.fieldInfo.comodel_name || "";
    }
    get tags() {
      const v = this.props.value;
      if (!Array.isArray(v)) return [];
      return v.map((item) => {
        if (Array.isArray(item)) return { id: item[0], name: item[1] || String(item[0]), color: item[2] || 0 };
        if (typeof item === "object") return item;
        return { id: item, name: String(item), color: 0 };
      });
    }
    get currentIds() {
      return this.tags.map((t) => t.id);
    }
    async searchTags(term) {
      const orm = window.Services && window.Services.orm;
      const comodel = this.comodel;
      if (!orm || !comodel) return [];
      try {
        const existing = this.currentIds;
        const domain = [
          ["id", "not in", existing],
          ...term ? [["display_name", "ilike", term]] : []
        ];
        const results = await orm.nameSearch(comodel, term, domain, { limit: 20 });
        return (Array.isArray(results) ? results : []).map(([id, name]) => ({ value: id, label: name }));
      } catch (_e) {
        return [];
      }
    }
    addTag(option) {
      const next = [...this.tags, { id: option.value, name: option.label, color: 0 }];
      emitChange2(this, next.map((t) => [t.id, t.name]));
    }
    removeTag(id) {
      const next = this.tags.filter((t) => t.id !== id);
      emitChange2(this, next.map((t) => [t.id, t.name]));
    }
  };
  var X2ManyField = class extends Component23 {
    static template = xml23`
    <div class="o-field-x2many">
      <div class="o-x2many-list">
        <t t-if="!rows.length">
          <span class="o-x2many-empty">No records</span>
        </t>
        <t t-foreach="rows" t-as="row" t-key="row.id || row_index">
          <div class="o-x2many-row" t-on-click="() => openRow(row)">
            <t t-esc="rowLabel(row)"/>
            <button t-if="props.editMode"
                    type="button"
                    class="o-x2many-row-remove"
                    aria-label="Remove"
                    t-on-click.stop="() => removeRow(row)">&#x2715;</button>
          </div>
        </t>
      </div>
      <button t-if="props.editMode"
              type="button"
              class="o-btn o-btn-link o-x2many-add"
              t-on-click="addRow">
        Add a line
      </button>
    </div>`;
    static props = {
      name: String,
      value: { optional: true },
      record: Object,
      fieldInfo: { type: Object, optional: true },
      editMode: { type: Boolean, optional: true },
      onChange: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    get rows() {
      const v = this.props.value;
      if (!Array.isArray(v)) return [];
      return v;
    }
    rowLabel(row) {
      if (!row) return "";
      if (Array.isArray(row)) return row[1] || String(row[0] || "");
      return row.display_name || row.name || String(row.id || "");
    }
    openRow(row) {
      const comodel = this.props.fieldInfo && this.props.fieldInfo.comodel_name || "";
      if (comodel && row.id) {
        window.location.hash = "#" + comodel.replace(/\./g, "_") + "/form/" + row.id;
      }
    }
    removeRow(row) {
      const next = this.rows.filter((r) => {
        const rId = Array.isArray(r) ? r[0] : r && r.id;
        const rowId = Array.isArray(row) ? row[0] : row && row.id;
        return rId !== rowId;
      });
      emitChange2(this, next);
    }
    addRow() {
      const comodel = this.props.fieldInfo && this.props.fieldInfo.comodel_name || "";
      if (comodel) {
        window.location.hash = "#" + comodel.replace(/\./g, "_") + "/new";
      }
    }
  };
  var One2manyField = class extends X2ManyField {
    // One2many is X2Many with write semantics (no many2many link table)
  };
  fieldRegistry.add("many2one", { type: "many2one", component: Many2oneField });
  fieldRegistry.add("many2many", { type: "many2many", component: Many2manyTagsField });
  fieldRegistry.add("many2many_tags", { type: "many2many_tags", component: Many2manyTagsField });
  fieldRegistry.add("one2many", { type: "one2many", component: One2manyField });
  fieldRegistry.add("x2many", { type: "x2many", component: X2ManyField });
  window.AppCore = window.AppCore || {};
  Object.assign(window.AppCore, {
    Many2oneField,
    Many2manyTagsField,
    One2manyField,
    X2ManyField
  });

  // addons/web/static/src/app/search/search_panel.js
  var owl25 = window.owl;
  var { Component: Component24, useState: useState19, xml: xml24, onMounted: onMounted16, useEnv: useEnv14 } = owl25;
  var SearchPanelSection = class extends Component24 {
    static template = xml24`
    <div class="o-search-panel-section">
      <button type="button"
              class="o-search-panel-section-header"
              t-att-aria-expanded="!state.collapsed ? 'true' : 'false'"
              t-on-click="toggleCollapse">
        <span class="o-search-panel-section-title"><t t-esc="props.title"/></span>
        <span class="o-search-panel-chevron" aria-hidden="true">
          <t t-if="state.collapsed">&#9654;</t>
          <t t-else="">&#9660;</t>
        </span>
      </button>
      <t t-if="!state.collapsed">
        <div class="o-search-panel-section-items" role="list">
          <t t-foreach="props.items" t-as="item" t-key="item.id || item_index">
            <div class="o-search-panel-item"
                 t-att-class="{ 'o-search-panel-item--active': isActive(item) }"
                 role="listitem"
                 tabindex="0"
                 t-on-click="() => onItemClick(item)"
                 t-on-keydown="(ev) => onItemKeyDown(ev, item)">
              <t t-if="props.type === 'filter'">
                <input type="checkbox"
                       class="o-search-panel-checkbox"
                       t-att-checked="isActive(item) ? '' : null"
                       t-att-aria-label="item.name"
                       t-on-click.stop="() => onItemClick(item)"/>
              </t>
              <span class="o-search-panel-item-icon"
                    t-if="item.color != null"
                    t-att-style="'background:var(--color-' + item.color + ', #ccc)'"/>
              <span class="o-search-panel-item-label"><t t-esc="item.name || item.display_name"/></span>
              <t t-if="item.count != null">
                <span class="o-search-panel-item-count">(<t t-esc="item.count"/>)</span>
              </t>
            </div>
          </t>
        </div>
      </t>
    </div>`;
    static props = {
      title: String,
      items: Array,
      type: { type: String, optional: true },
      // "category" | "filter"
      activeIds: { type: Array, optional: true },
      onToggle: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    setup() {
      this.state = useState19({ collapsed: false });
    }
    isActive(item) {
      const ids = this.props.activeIds || [];
      return ids.includes(item.id);
    }
    toggleCollapse() {
      this.state.collapsed = !this.state.collapsed;
    }
    onItemClick(item) {
      if (typeof this.props.onToggle === "function") {
        this.props.onToggle(item);
      }
    }
    onItemKeyDown(ev, item) {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        this.onItemClick(item);
      }
    }
  };
  var SearchPanel = class extends Component24 {
    static template = xml24`
    <aside class="o-search-panel"
           role="complementary"
           aria-label="Search filters"
           t-att-class="{ 'o-search-panel--collapsed': state.collapsed }">
      <div class="o-search-panel-toggle-bar">
        <button type="button"
                class="o-search-panel-collapse-btn"
                t-att-aria-label="state.collapsed ? 'Expand search filters' : 'Collapse search filters'"
                t-on-click="toggleCollapsed">
          <t t-if="state.collapsed">&#9658;</t>
          <t t-else="">&#9664;</t>
        </button>
      </div>
      <t t-if="!state.collapsed">
        <t t-foreach="sections" t-as="section" t-key="section.id || section_index">
          <SearchPanelSection
            title="section.title"
            items="section.items || []"
            type="section.type || 'category'"
            activeIds="getActiveIds(section)"
            onToggle="(item) => onToggle(section, item)"/>
        </t>
        <t t-if="!sections.length">
          <div class="o-search-panel-empty">No filters available</div>
        </t>
      </t>
    </aside>`;
    static components = { SearchPanelSection };
    static props = {
      sections: { type: Array, optional: true },
      searchModel: { type: Object, optional: true },
      onFiltersChange: { type: Function, optional: true },
      slots: { type: Object, optional: true }
    };
    setup() {
      this.state = useState19({
        collapsed: false,
        activeBySection: {}
      });
      onMounted16(() => {
        this._loadSectionsFromModel();
      });
    }
    get sections() {
      if (this.props.sections) return this.props.sections;
      return this.state.modelSections || [];
    }
    _loadSectionsFromModel() {
      const sm = this.props.searchModel;
      if (!sm) return;
      const searchView = typeof sm.getSearchView === "function" ? sm.getSearchView() : null;
      if (!searchView) return;
      this.state.modelSections = [];
    }
    getActiveIds(section) {
      return this.state.activeBySection[section.id] || [];
    }
    onToggle(section, item) {
      const current = this.state.activeBySection[section.id] || [];
      const isActive = current.includes(item.id);
      let next;
      if (section.type === "filter") {
        next = isActive ? current.filter((id) => id !== item.id) : [...current, item.id];
      } else {
        next = isActive ? [] : [item.id];
      }
      this.state.activeBySection = Object.assign({}, this.state.activeBySection, { [section.id]: next });
      const sm = this.props.searchModel;
      if (sm && typeof sm.addFacet === "function") {
        if (next.length) {
          sm.addFacet({
            type: section.type || "filter",
            name: section.fieldName || section.id,
            label: `${section.title}: ${item.name || item.id}`,
            value: next,
            removable: true
          });
        }
      }
      if (typeof this.props.onFiltersChange === "function") {
        this.props.onFiltersChange({ section, activeIds: next });
      }
    }
    toggleCollapsed() {
      this.state.collapsed = !this.state.collapsed;
    }
  };
  window.AppCore = window.AppCore || {};
  window.AppCore.SearchPanel = SearchPanel;
  window.AppCore.SearchPanelSection = SearchPanelSection;

  // addons/web/static/src/app/services/view_service.js
  var _cache = /* @__PURE__ */ new Map();
  var _fieldCache = /* @__PURE__ */ new Map();
  function _cacheKey(model, viewTypes) {
    return model + ":" + [...viewTypes].sort().join(",");
  }
  async function _jsonRpc(path, params) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ jsonrpc: "2.0", method: "call", params })
    });
    if (!res.ok) throw new Error(`ViewService RPC ${path} \u2192 HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || "RPC error");
    return json.result;
  }
  async function loadViews(model, viewTypes, context) {
    const key = _cacheKey(model, viewTypes);
    if (_cache.has(key)) return _cache.get(key);
    const promise = _jsonRpc("/web/dataset/call_kw", {
      model,
      method: "get_views",
      args: [viewTypes.map((t) => [false, t])],
      kwargs: { context: context || {} }
    }).then((result) => {
      if (result && result.views) return result;
      return { views: result || {}, fields: {} };
    }).catch((_err) => {
      const stub = {};
      viewTypes.forEach((t) => {
        stub[t] = { arch: null, fields: {} };
      });
      return { views: stub, fields: {} };
    });
    _cache.set(key, promise);
    return promise;
  }
  async function loadView(model, viewType, context) {
    const result = await loadViews(model, [viewType], context);
    return result.views && result.views[viewType] || { arch: null, fields: {} };
  }
  async function getFields(model, context) {
    if (_fieldCache.has(model)) return _fieldCache.get(model);
    const promise = _jsonRpc("/web/dataset/call_kw", {
      model,
      method: "fields_get",
      args: [],
      kwargs: { attributes: ["string", "type", "required", "readonly", "selection"], context: context || {} }
    }).catch(() => ({}));
    _fieldCache.set(model, promise);
    return promise;
  }
  function clearViewCache(model) {
    for (const key of _cache.keys()) {
      if (key.startsWith(model + ":")) _cache.delete(key);
    }
    _fieldCache.delete(model);
  }
  function createViewService2() {
    return {
      loadViews,
      loadView,
      getFields,
      clearViewCache,
      /**
       * Sync helper: returns cached view arch if already resolved, else null.
       * Useful for synchronous code that wants to check if data is available.
       */
      getCachedView(model, viewType) {
        const key = _cacheKey(model, [viewType]);
        const p = _cache.get(key);
        if (!p) return null;
        let resolved = null;
        p.then((v) => {
          resolved = v;
        });
        return resolved;
      }
    };
  }
  window.Services = window.Services || {};
  if (!window.Services.viewService) {
    window.Services.viewService = createViewService2();
  }
  window.AppCore = window.AppCore || {};
  window.AppCore.ViewService = window.Services.viewService;

  // addons/web/static/src/app/main.js
  function registerModernViewFacades() {
    window.AppCore = window.AppCore || {};
    window.AppCore.ListControlPanel = list_control_panel_exports;
    window.AppCore.ListViewModule = ListViewModule;
    window.AppCore.FormFooterActions = form_footer_actions_exports;
    window.AppCore.BreadcrumbStrip = breadcrumb_strip_exports;
    window.AppCore.KanbanControlStrip = kanban_control_strip_exports;
    window.AppCore.ChatterStrip = chatter_strip_exports;
    window.AppCore.KanbanCardChrome = kanban_card_chrome_exports;
    window.AppCore.ActionBus = ActionBus;
    window.AppCore.ActionContainer = ActionContainer;
    window.AppCore.SearchBarOWL = SearchBar;
    window.AppCore.SearchPanel = SearchPanel;
    window.AppCore.ControlPanel = ControlPanel;
    window.AppCore.WithSearch = WithSearch;
    window.AppCore.createSearchModel = createSearchModel;
    window.AppCore.ViewService = createViewService2();
  }
  function bootModernWebClient() {
    if (window.__ERPModernWebClientLoaded) {
      return window.__ERPModernWebClientRuntime || null;
    }
    try {
      registerNavbarContract();
      registerNavbarFacade();
      registerHomeModule();
      registerModernViewFacades();
      const bootstrap = createBootstrap();
      const env = createEnv(bootstrap);
      startServices(env);
      registerTemplates(env);
      const cp = env.services.commandPalette;
      if (cp && typeof cp.initHotkey === "function") {
        cp.initHotkey();
      }
      const hk = window.Services && window.Services.hotkey;
      if (hk && typeof hk.register === "function") {
        hk.register("alt+h", function(evt) {
          if (!evt || evt.defaultPrevented) return;
          var t = evt.target;
          if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
          evt.preventDefault();
          window.location.hash = "#home";
        });
      }
      window.ERPFrontendRuntime = window.ERPFrontendRuntime || {};
      window.ERPFrontendRuntime.menuUtils = menu_utils_exports;
      if (env.services.menu && typeof env.services.menu.load === "function") {
        env.services.menu.load(false).catch(function() {
        });
      }
      registerBuiltinClientActions(env);
      const app = new WebClient(env, document.getElementById("webclient"));
      app.mount();
      const runtime = {
        env,
        app,
        version: bootstrap.version,
        boot: bootModernWebClient,
        menuUtils: menu_utils_exports,
        /** Phase 636: modular action entry (doAction, navigateFromMenu, doActionButton). */
        action: env.services.action,
        /** Phase 691: Odoo-shaped view service (loadViews, getView). */
        view: env.services.view,
        /** Track K2+K3: ActionBus + BUILTIN_CLIENT_ACTIONS */
        ActionBus,
        clientActions: BUILTIN_CLIENT_ACTIONS
      };
      window.__ERPModernWebClientRuntime = runtime;
      window.ERPFrontendRuntime = runtime;
      window.__ERPModernWebClientLoaded = true;
      return runtime;
    } catch (err) {
      if (typeof console !== "undefined" && console.error) {
        console.error("[modern-webclient] boot failed", err);
      }
      erpDebugBootLog("modern_boot_exception", {
        message: err && err.message,
        stack: err && err.stack
      });
      return null;
    }
  }
  bootModernWebClient();
})();
//# sourceMappingURL=modern_webclient.js.map
