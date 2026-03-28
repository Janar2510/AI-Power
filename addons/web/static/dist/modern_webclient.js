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
          var getHashDomainParam = helpers.getHashDomainParam || function() {
            return null;
          };
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
                        loadRecords(model, route, currentListState.searchTerm, stageFilter, void 0, currentListState.savedFilterId, offset, limit, getHashDomainParam());
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
    if (action.type !== "ir.actions.act_window") return null;
    const modelSlug = String(action.res_model || "").replace(/\./g, "_");
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
        return cache && cache.actions ? cache.actions[id] : null;
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
  function createModernServices(env) {
    const bootstrap = env.bootstrap;
    const legacy = window.Services || {};
    const views = legacy.views || createFallbackViews(bootstrap);
    const view = createViewService(views);
    const router = createRouterService();
    const services = {
      session: legacy.session || createFallbackSession(bootstrap),
      rpc: legacy.rpc || null,
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
      const owl3 = getOwl();
      return Promise.resolve(owl3.mount(ComponentClass, target, cfg)).catch(function(error) {
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
            ev.preventDefault();
            actionSvc.navigateFromMenu(menu).catch(function() {
            });
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

  // addons/web/static/src/app/webclient.js
  var WebClient = class {
    constructor(env, target) {
      this.env = env;
      this.target = target;
      this.navbarApp = null;
      this.sidebarApp = null;
    }
    mount() {
      if (!this.target) return;
      const navbar = document.getElementById("navbar");
      const sidebar = document.getElementById("app-sidebar");
      attachShellChrome(this.env);
      this.target.setAttribute("data-erp-runtime-version", this.env.bootstrap.version);
      this.target.classList.add("o-webclient-modern");
      this.env.services.router.start();
      this.env.services.shell.load().finally(() => {
        this.navbarApp = mountNavBar(this.env, navbar);
        this.sidebarApp = mountSidebar(this.env, sidebar);
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
  }
  function bootModernWebClient() {
    if (window.__ERPModernWebClientLoaded) {
      return window.__ERPModernWebClientRuntime || null;
    }
    window.__ERPModernWebClientLoaded = true;
    registerNavbarContract();
    registerNavbarFacade();
    registerHomeModule();
    registerModernViewFacades();
    const bootstrap = createBootstrap();
    const env = createEnv(bootstrap);
    startServices(env);
    registerTemplates(env);
    window.ERPFrontendRuntime = window.ERPFrontendRuntime || {};
    window.ERPFrontendRuntime.menuUtils = menu_utils_exports;
    if (env.services.menu && typeof env.services.menu.load === "function") {
      env.services.menu.load(false).catch(function() {
      });
    }
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
      view: env.services.view
    };
    window.__ERPModernWebClientRuntime = runtime;
    window.ERPFrontendRuntime = runtime;
    return runtime;
  }
  bootModernWebClient();
})();
//# sourceMappingURL=modern_webclient.js.map
