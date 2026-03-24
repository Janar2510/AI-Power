(function () {
  window.AppCore = window.AppCore || {};
  var UI = window.UIComponents || {};
  var _impl = null;

  function setImpl(fn) {
    _impl = typeof fn === "function" ? fn : null;
  }

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
    if (_impl) return !!_impl(container, options || {});
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
    var searchModel = opts.searchModel || null;

    if (typeof window !== "undefined") {
      window.chatContext = { model: model, active_id: null };
    }

    var cols = h.getListColumns ? h.getListColumns(model) : [];
    var handleCol = cols.find(function (c) { return c && typeof c === "object" && c.widget === "handle"; }) || null;
    var sequenceField = handleCol ? handleCol.name : null;
    var title = h.getTitle ? h.getTitle(route) : route;
    var addLabel = route === "contacts" ? "Add contact" : route === "leads" ? "Add lead" : route === "orders" ? "Add order" : route === "products" ? "Add product" : route === "settings/users" ? "Add user" : "Add";
    var stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    var currentView = (currentListState.route === route && currentListState.viewType) || "list";
    var order = (currentListState.route === route && currentListState.order) || null;
    if (h.restoreListState && !currentListState._restoredForRoute) {
      var restored = h.restoreListState(route);
      if (restored && typeof restored === "object") {
        Object.keys(restored).forEach(function (k) { currentListState[k] = restored[k]; });
      }
      currentListState._restoredForRoute = route;
    }

    var searchView = viewsSvc && viewsSvc.getView ? viewsSvc.getView(model, "search") : null;
    var searchFilters = (searchView && searchView.filters) || [];
    var searchGroupBys = (searchView && searchView.group_bys) || [];
    var activeFilters = currentListState.activeSearchFilters || [];
    var currentGroupBy = currentListState.groupBy || null;
    var action = h.getActionForRoute ? h.getActionForRoute(route) : null;
    if (searchModel && !currentListState._facetsDefaultsApplied) {
      searchModel.applyDefaultsFromContext((action && action.context) || {});
      currentListState._facetsDefaultsApplied = true;
    }

    var listViewDef = viewsSvc && viewsSvc.getView ? viewsSvc.getView(model, "list") : null;
    var listEditable = !!(listViewDef && (listViewDef.editable === "bottom" || listViewDef.editable === "top"));

    var LCP = typeof window !== "undefined" && window.AppCore && window.AppCore.ListControlPanel;
    var dropdownsHtml;
    var filtersHtml;
    var actionsHtml;
    var reportName = h.getReportName ? h.getReportName(model) : null;
    if (LCP && typeof LCP.buildSearchDropdownsHtml === "function") {
      dropdownsHtml = LCP.buildSearchDropdownsHtml({
        searchFilters: searchFilters,
        activeFilters: activeFilters,
        searchGroupBys: searchGroupBys,
        currentGroupBy: currentGroupBy,
        savedFiltersList: savedFiltersList,
      });
      filtersHtml = LCP.buildQuickFiltersHtml({
        searchFilters: searchFilters,
        activeFilters: activeFilters,
        searchGroupBys: searchGroupBys,
        currentGroupBy: currentGroupBy,
        savedFiltersList: savedFiltersList,
        model: model,
        currentListState: currentListState,
      });
      actionsHtml = LCP.buildListActionsHtml({ addLabel: addLabel, reportName: reportName });
    } else {
      dropdownsHtml = "";
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

      filtersHtml = "";
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

      actionsHtml = "";
      actionsHtml += '<button type="button" id="btn-save-filter" class="o-btn o-btn-secondary">Save</button>';
      actionsHtml += '<button type="button" id="btn-export" class="o-btn o-btn-secondary">Export CSV</button>';
      actionsHtml += '<button type="button" id="btn-export-excel" class="o-btn o-btn-secondary">Export Excel</button>';
      actionsHtml += '<button type="button" id="btn-import" class="o-btn o-btn-secondary">Import</button>';
      if (reportName) actionsHtml += '<button type="button" id="btn-print" class="o-btn o-btn-secondary">Print</button>';
      if (reportName) actionsHtml += '<button type="button" id="btn-preview-pdf" class="o-btn o-btn-secondary">Preview</button>';
      actionsHtml += '<button type="button" id="btn-add" class="o-btn o-btn-primary">' + escHtml(addLabel) + "</button>";
    }

    var html = '<div class="o-list-shell"><h2>' + escHtml(title) + "</h2>";
    html += (UI.ControlPanel && UI.ControlPanel.renderHTML ? UI.ControlPanel.renderHTML({
      viewSwitcherHtml: renderViewSwitcher(route, currentView, h),
      searchTerm: searchTerm,
      dropdownsHtml: dropdownsHtml,
      filtersHtml: filtersHtml,
      actionsHtml: actionsHtml,
    }) : "");

    var dynamicFacetHtml = searchModel && searchModel.renderFacets ? searchModel.renderFacets() : "";
    var hasFacets = activeFilters.length > 0 || currentGroupBy || !!dynamicFacetHtml;
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
      if (dynamicFacetHtml) html += dynamicFacetHtml;
    }

    function attachCommonHandlers() {
      var btn = container.querySelector("#btn-add");
      if (btn) btn.onclick = function () { window.location.hash = route + "/new"; };
      function saveCurrentState() {
        if (typeof h.saveListState !== "function") return;
        var listEl = container.querySelector(".o-list-shell");
        h.saveListState(route, {
          route: route,
          searchTerm: (container.querySelector("#list-search") || { value: "" }).value || "",
          stageFilter: (container.querySelector("#list-stage-filter") || { value: "" }).value || null,
          savedFilterId: currentListState.savedFilterId || null,
          activeSearchFilters: (currentListState.activeSearchFilters || []).slice(),
          groupBy: currentListState.groupBy || null,
          offset: offset || 0,
          scrollTop: listEl ? listEl.scrollTop : 0,
        });
      }

      container.querySelectorAll(".o-list-edit-link").forEach(function (lnk) {
        lnk.addEventListener("click", saveCurrentState);
      });


      var btnImport = container.querySelector("#btn-import");
      if (btnImport && h.showImportModal) btnImport.onclick = function () { h.showImportModal(model, route); };

      var btnSearch = container.querySelector("#btn-search");
      var searchInput = container.querySelector("#list-search");
      function buildDomainOverride(term, stageVal) {
        if (!searchModel || !searchModel.buildDomain) return undefined;
        var base = h.parseActionDomain ? h.parseActionDomain(action && action.domain ? action.domain : "") : [];
        return searchModel.buildDomain({
          actionDomain: base,
          model: model,
          searchTerm: term,
          stageFilter: stageVal,
          buildSearchDomain: h.buildSearchDomain,
          parseFilterDomain: h.parseFilterDomain,
          uid: 1,
          skipSearchDomain: false,
        });
      }

      if (btnSearch && searchInput) {
        var doSearch = function () {
          var sf = container.querySelector("#list-saved-filter");
          var stageEl = container.querySelector("#list-stage-filter");
          var stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
          if (searchModel && searchModel.setSearchTerm) searchModel.setSearchTerm(searchInput.value.trim());
          h.loadRecords(model, route, searchInput.value.trim(), stageVal, null, sf && sf.value ? sf.value : null, 0, null, buildDomainOverride(searchInput.value.trim(), stageVal));
        };
        btnSearch.onclick = doSearch;
        searchInput.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); doSearch(); } };

        var acBox = document.createElement("div");
        acBox.className = "o-search-autocomplete";
        acBox.style.position = "absolute";
        acBox.style.zIndex = "15";
        acBox.style.display = "none";
        acBox.style.minWidth = "260px";
        acBox.style.background = "var(--color-surface-1)";
        acBox.style.border = "1px solid var(--border-color)";
        acBox.style.borderRadius = "var(--radius-sm)";
        acBox.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
        if (searchInput.parentElement) {
          searchInput.parentElement.style.position = "relative";
          searchInput.parentElement.appendChild(acBox);
        }

        function closeAutocomplete() {
          acBox.style.display = "none";
          acBox.innerHTML = "";
        }
        searchInput.addEventListener("input", function () {
          if (!searchModel || !searchModel.getAutocompleteSuggestions) return;
          var term = searchInput.value.trim();
          if (!term) return closeAutocomplete();
          var suggestions = searchModel.getAutocompleteSuggestions(term);
          if (!suggestions.length) return closeAutocomplete();
          var items = "";
          suggestions.forEach(function (s, idx) {
            items += '<button type="button" class="o-ac-item" data-ac-idx="' + idx + '" style="display:block;width:100%;text-align:left;border:0;background:transparent;padding:var(--space-xs) var(--space-sm);cursor:pointer">' + escHtml(s.label || "") + "</button>";
          });
          items += '<button type="button" class="o-ac-item o-ac-custom" data-ac-custom="1" style="display:block;width:100%;text-align:left;border:0;background:var(--color-surface-2);padding:var(--space-xs) var(--space-sm);cursor:pointer">Custom filter...</button>';
          acBox.innerHTML = items;
          acBox.style.display = "block";
          acBox.querySelectorAll("[data-ac-idx]").forEach(function (btnS) {
            btnS.onclick = function () {
              var idx = parseInt(btnS.getAttribute("data-ac-idx"), 10) || 0;
              var picked = suggestions[idx];
              if (picked && searchModel.addFacet) {
                searchModel.addFacet(picked);
                searchInput.value = "";
                closeAutocomplete();
                var stageEl = container.querySelector("#list-stage-filter");
                var stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
                h.loadRecords(model, route, "", stageVal, null, currentListState.savedFilterId, 0, null, buildDomainOverride("", stageVal));
              }
            };
          });
          var customBtn = acBox.querySelector("[data-ac-custom]");
          if (customBtn) {
            customBtn.onclick = function () {
              var field = window.prompt("Field name:");
              if (!field || !field.trim()) return;
              var op = window.prompt("Operator (=, !=, ilike, in):", "ilike") || "ilike";
              var val = window.prompt("Value:");
              if (val == null) return;
              if (searchModel.addFacet) {
                searchModel.addFacet({
                  type: "custom",
                  name: field.trim(),
                  operator: op.trim(),
                  value: val,
                  label: field.trim() + " " + op.trim() + " " + val,
                  domain: [[field.trim(), op.trim(), val]],
                });
              }
              closeAutocomplete();
              var stageEl = container.querySelector("#list-stage-filter");
              var stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
              h.loadRecords(model, route, "", stageVal, null, currentListState.savedFilterId, 0, null, buildDomainOverride("", stageVal));
            };
          }
        });
        searchInput.addEventListener("blur", function () { setTimeout(closeAutocomplete, 120); });
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
      container.querySelectorAll("[data-facet-remove]").forEach(function (btnRm) {
        btnRm.onclick = function (e) {
          e.preventDefault();
          var idx = parseInt(btnRm.getAttribute("data-facet-remove"), 10);
          if (searchModel && searchModel.removeFacet) searchModel.removeFacet(idx);
          var stageEl = container.querySelector("#list-stage-filter");
          var stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
          h.loadRecords(model, route, (container.querySelector("#list-search") || { value: "" }).value.trim(), stageVal, null, currentListState.savedFilterId, 0, null, buildDomainOverride((container.querySelector("#list-search") || { value: "" }).value.trim(), stageVal));
        };
      });

      function closeCpDropdowns() {
        container.querySelectorAll(".o-cp-dropdown-wrap.o-open").forEach(function (w) {
          w.classList.remove("o-open");
        });
      }
      if (!container._erpCpCloseBound) {
        container._erpCpCloseBound = true;
        container.addEventListener("click", function () {
          closeCpDropdowns();
        });
      }
      container.querySelectorAll(".o-cp-dropdown-wrap[data-cp-dd]").forEach(function (wrap) {
        var toggler = wrap.querySelector(".o-cp-dropdown-toggle");
        if (toggler) {
          toggler.onclick = function (e) {
            e.stopPropagation();
            var open = wrap.classList.contains("o-open");
            closeCpDropdowns();
            if (!open) wrap.classList.add("o-open");
          };
        }
      });
      container.querySelectorAll(".cp-filter-item").forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          var fname = btn.getAttribute("data-filter-toggle");
          if (!fname) return;
          var cur = currentListState.activeSearchFilters || [];
          var idx = cur.indexOf(fname);
          var next = idx >= 0 ? cur.filter(function (_, i) { return i !== idx; }) : cur.concat(fname);
          currentListState.activeSearchFilters = next;
          closeCpDropdowns();
          var si = container.querySelector("#list-search");
          h.loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, 0, null);
        };
      });
      container.querySelectorAll(".cp-groupby-item").forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          currentListState.groupBy = btn.getAttribute("data-group-by") || null;
          closeCpDropdowns();
          var si = container.querySelector("#list-search");
          h.loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, 0, null);
        };
      });
      container.querySelectorAll(".cp-fav-item").forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          var fid = btn.getAttribute("data-saved-filter-id");
          currentListState.savedFilterId = fid || null;
          var sel = container.querySelector("#list-saved-filter");
          if (sel) sel.value = fid || "";
          closeCpDropdowns();
          var si = container.querySelector("#list-search");
          h.loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, 0, null);
        };
      });
      var saveFavBtn = container.querySelector(".cp-save-fav");
      if (saveFavBtn && h.saveSavedFilter) {
        saveFavBtn.onclick = function (e) {
          e.stopPropagation();
          closeCpDropdowns();
          var name = window.prompt("Filter name:");
          if (!name || !name.trim()) return;
          var si = container.querySelector("#list-search");
          var st = si ? si.value.trim() : "";
          var action = h.getActionForRoute ? h.getActionForRoute(route) : null;
          var actionDomain = h.parseActionDomain ? h.parseActionDomain(action && action.domain ? action.domain : "") : [];
          var domain = actionDomain.slice();
          var searchDom = h.buildSearchDomain ? h.buildSearchDomain(model, st) : [];
          if (searchDom.length) domain = domain.concat(searchDom);
          if (model === "crm.lead" && stageFilter) domain = domain.concat([["stage_id", "=", stageFilter]]);
          h.saveSavedFilter(model, name.trim(), domain).then(function () {
            h.loadRecords(model, route, st, stageFilter, null, null, 0, null);
          });
        };
      }
    }

    if (!records || !records.length) {
      if (UI.EmptyState && typeof UI.EmptyState.renderHTML === "function") {
        container.innerHTML = html + UI.EmptyState.renderHTML({
          icon: "◌",
          title: "No records yet",
          subtitle: "Create your first record to start working.",
          actionLabel: addLabel,
        }) + "</div>";
      } else {
        container.innerHTML = html + '<p class="o-list-empty">No records yet.</p></div>';
      }
      attachCommonHandlers();
      if (UI.EmptyState && typeof UI.EmptyState.wire === "function") {
        UI.EmptyState.wire(container, {
          actionFn: function () { window.location.hash = route + "/new"; },
        });
      }
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
        tbl +=
          '<tr role="row" tabindex="0" data-id="' +
          (r.id || "") +
          '" class="o-list-data-row"' +
          (sequenceField ? ' draggable="true"' : "") +
          (listEditable && !groups ? ' data-inline-edit="1"' : "") +
          ">";
        tbl += '<td role="gridcell"><input type="checkbox" class="list-row-select" data-id="' + (r.id || "") + '" aria-label="Select row"></td>';
        cols.forEach(function (c) {
          var f = typeof c === "object" ? c.name : c;
          var val = r[f];
          var rawJson = "";
          try {
            rawJson = encodeURIComponent(JSON.stringify(val === undefined ? null : val));
          } catch (e2) {
            rawJson = encodeURIComponent("null");
          }
          var displayVal = val;
          if (nameMap && nameMap[f] && displayVal != null) {
            if (Array.isArray(displayVal)) displayVal = displayVal.map(function (id) { return nameMap[f][id] || id; }).join(", ");
            else displayVal = nameMap[f][displayVal] || displayVal;
          } else if (displayVal != null) {
            if (typeof displayVal === "boolean") displayVal = displayVal ? "Yes" : "No";
            else if (h.isMonetaryField(model, f)) {
              var n = Number(displayVal);
              var formatted = !isNaN(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : displayVal;
              var currField = h.getMonetaryCurrencyField(model, f);
              if (currField && r[currField] && nameMap && nameMap[currField]) {
                var sym = nameMap[currField][r[currField]];
                if (sym) formatted = (sym + " " + formatted).trim();
              }
              displayVal = formatted;
            } else {
              var selLabel = h.getSelectionLabel(model, f, displayVal);
              if (selLabel !== displayVal) displayVal = selLabel;
            }
          }
          var displayStr = displayVal != null ? String(displayVal) : "";
          var useInline = listEditable && !groups && h.getFieldMeta;
          var meta = useInline ? h.getFieldMeta(model, f) : null;
          var t = meta && meta.type;
          if (useInline && t && t !== "many2one" && t !== "many2many" && t !== "one2many" && t !== "binary" && t !== "image" && t !== "html") {
            if (typeof c === "object" && c.widget === "handle") {
              tbl += '<td role="gridcell" class="o-list-handle" title="Drag to reorder">::</td>';
              return;
            }
            tbl +=
              '<td role="gridcell" class="o-list-editable-cell" data-field="' +
              escHtml(f) +
              '" data-json="' +
              rawJson +
              '"><span class="o-cell-display">' +
              escHtml(displayStr) +
              "</span></td>";
          } else {
            tbl += "<td role=\"gridcell\">" + escHtml(displayStr) + "</td>";
          }
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
      if (listEditable && !groups) {
        tbl +=
          '<tr class="o-list-add-line"><td colspan="' +
          (cols.length + 2) +
          '"><button type="button" class="o-list-add-line-btn o-btn o-btn-secondary">Add a line</button></td></tr>';
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
          if (row.classList.contains("o-list-row-editing")) return;
          var rows = Array.prototype.slice.call(table.querySelectorAll("tr.o-list-data-row"));
          var idx = rows.indexOf(row);
          if (idx < 0) return;
          if (e.key === "ArrowDown" && idx < rows.length - 1) { e.preventDefault(); rows[idx + 1].focus(); }
          else if (e.key === "ArrowUp" && idx > 0) { e.preventDefault(); rows[idx - 1].focus(); }
          else if (e.key === "Enter") { var id = row.getAttribute("data-id"); if (id) { e.preventDefault(); saveCurrentState(); window.location.hash = route + "/edit/" + id; } }
        });
      })();

      (function setupListRowReorder() {
        if (!sequenceField || !listEditable || groups) return;
        var tbody = container.querySelector(".o-list-table tbody");
        if (!tbody) return;
        var dragging = null;
        tbody.querySelectorAll("tr.o-list-data-row").forEach(function (row) {
          row.addEventListener("dragstart", function () {
            dragging = row;
            row.classList.add("o-list-row--dragging");
          });
          row.addEventListener("dragend", function () {
            row.classList.remove("o-list-row--dragging");
            dragging = null;
            tbody.querySelectorAll(".o-list-row--drag-over").forEach(function (r) { r.classList.remove("o-list-row--drag-over"); });
          });
          row.addEventListener("dragover", function (e) {
            if (!dragging || dragging === row) return;
            e.preventDefault();
            row.classList.add("o-list-row--drag-over");
          });
          row.addEventListener("dragleave", function () {
            row.classList.remove("o-list-row--drag-over");
          });
          row.addEventListener("drop", function (e) {
            if (!dragging || dragging === row) return;
            e.preventDefault();
            row.classList.remove("o-list-row--drag-over");
            tbody.insertBefore(dragging, row.nextSibling);
            var ids = Array.prototype.map.call(tbody.querySelectorAll("tr.o-list-data-row[data-id]"), function (tr) {
              return parseInt(tr.getAttribute("data-id"), 10);
            }).filter(function (x) { return !isNaN(x); });
            var writes = ids.map(function (id, idx) {
              var vals = {};
              vals[sequenceField] = (idx + 1) * 10;
              return rpc.callKw(model, "write", [[id], vals], {});
            });
            Promise.all(writes).then(function () {
              showToast("Order updated", "success");
            }).catch(function (err) {
              showToast(err && err.message ? err.message : "Reorder failed", "error");
            });
          });
        });
      })();

      (function setupInlineListEdit() {
        if (!listEditable || groups) return;
        function pad2(n) {
          return n < 10 ? "0" + n : "" + n;
        }
        function rawFromCell(td) {
          try {
            var s = td.getAttribute("data-json");
            if (s) return JSON.parse(decodeURIComponent(s));
          } catch (e0) {}
          return null;
        }
        function cellToInput(td, field) {
          var meta = (h.getFieldMeta && h.getFieldMeta(model, field)) || {};
          var ty = meta.type || "char";
          var raw = rawFromCell(td);
          var v = raw;
          if (v === null || v === undefined) v = "";
          var inp = "";
          if (ty === "boolean") {
            inp = '<input type="checkbox" class="o-list-inline-input" data-field="' + escHtml(field) + '" ' + (v ? "checked" : "") + ">";
          } else if (ty === "selection") {
            var selOpts = typeof h.getSelectionOptions === "function" ? h.getSelectionOptions(model, field) : null;
            inp = '<select class="o-list-inline-input" data-field="' + escHtml(field) + '"><option value="">--</option>';
            (selOpts || []).forEach(function (pair) {
              inp +=
                '<option value="' +
                String(pair[0]).replace(/"/g, "&quot;") +
                '"' +
                (String(pair[0]) === String(v) ? " selected" : "") +
                ">" +
                escHtml(String(pair[1] != null ? pair[1] : pair[0])) +
                "</option>";
            });
            inp += "</select>";
          } else if (ty === "integer" || ty === "float" || ty === "monetary") {
            inp =
              '<input class="o-list-inline-input" data-field="' +
              escHtml(field) +
              '" type="number" step="' +
              (ty === "integer" ? "1" : "0.01") +
              '" value="' +
              escHtml(String(v !== "" && v != null ? v : "")) +
              '">';
          } else if (ty === "date") {
            var ds = "";
            if (v) {
              var s = String(v);
              if (/^\d{4}-\d{2}-\d{2}/.test(s)) ds = s.slice(0, 10);
              else {
                var d = new Date(s.replace(" ", "T"));
                if (!isNaN(d.getTime())) ds = d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
              }
            }
            inp = '<input class="o-list-inline-input" data-field="' + escHtml(field) + '" type="date" value="' + escHtml(ds) + '">';
          } else if (ty === "datetime") {
            var dl = "";
            if (v) {
              var d2 = new Date(String(v).replace(" ", "T"));
              if (!isNaN(d2.getTime())) {
                dl =
                  d2.getFullYear() +
                  "-" +
                  pad2(d2.getMonth() + 1) +
                  "-" +
                  pad2(d2.getDate()) +
                  "T" +
                  pad2(d2.getHours()) +
                  ":" +
                  pad2(d2.getMinutes());
              }
            }
            inp = '<input class="o-list-inline-input" data-field="' + escHtml(field) + '" type="datetime-local" value="' + escHtml(dl) + '">';
          } else {
            inp =
              '<input class="o-list-inline-input" data-field="' +
              escHtml(field) +
              '" type="text" value="' +
              escHtml(String(v != null ? v : "")) +
              '">';
          }
          td.innerHTML = inp;
        }
        function collectVals(tr) {
          var vals = {};
          tr.querySelectorAll(".o-list-inline-input").forEach(function (inp) {
            var field = inp.getAttribute("data-field");
            if (!field) return;
            var meta = (h.getFieldMeta && h.getFieldMeta(model, field)) || {};
            var ty = meta.type || "char";
            if (inp.type === "checkbox") vals[field] = !!inp.checked;
            else if (ty === "integer") vals[field] = inp.value ? parseInt(inp.value, 10) : 0;
            else if (ty === "float" || ty === "monetary") vals[field] = inp.value ? parseFloat(inp.value) : 0;
            else if (ty === "date") vals[field] = inp.value || false;
            else if (ty === "datetime") {
              if (!inp.value) vals[field] = false;
              else {
                var dx = new Date(inp.value);
                vals[field] = isNaN(dx.getTime()) ? false : dx.toISOString().replace(/\.\d{3}Z$/, "").replace("T", " ");
              }
            } else vals[field] = inp.value;
          });
          return vals;
        }
        var table = container.querySelector(".o-list-table");
        if (!table) return;
        table.addEventListener("click", function (e) {
          var tr = e.target.closest && e.target.closest("tr.o-list-data-row[data-inline-edit]");
          if (!tr || tr.getAttribute("data-unsaved-new") === "1") return;
          if (e.target.closest("a") || e.target.closest("input.list-row-select") || e.target.closest(".o-list-inline-input")) return;
          if (tr.classList.contains("o-list-row-editing")) return;
          table.querySelectorAll("tr.o-list-row-editing").forEach(function (o) {
            o.classList.remove("o-list-row-editing");
          });
          tr.classList.add("o-list-row-editing");
          tr.querySelectorAll(".o-list-editable-cell").forEach(function (td) {
            var field = td.getAttribute("data-field");
            if (field) cellToInput(td, field);
          });
          var first = tr.querySelector(".o-list-inline-input");
          if (first && first.focus) first.focus();
        });
        table.addEventListener("keydown", function (e) {
          var tr = e.target.closest && e.target.closest("tr.o-list-row-editing");
          if (!tr) return;
          if (e.key === "Escape") {
            e.preventDefault();
            var si = container.querySelector("#list-search");
            h.loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, offset, limit, h.getHashDomainParam ? h.getHashDomainParam() : undefined);
            return;
          }
          if (e.key === "Enter" && tr.getAttribute("data-unsaved-new") !== "1") {
            e.preventDefault();
            var id = parseInt(tr.getAttribute("data-id"), 10);
            if (!id) return;
            var vals = collectVals(tr);
            rpc
              .callKw(model, "write", [[id], vals], {})
              .then(function () {
                showToast("Saved", "success");
                var si = container.querySelector("#list-search");
                h.loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, offset, limit, h.getHashDomainParam ? h.getHashDomainParam() : undefined);
              })
              .catch(function (err) {
                showToast(err.message || "Save failed", "error");
              });
            return;
          }
          if (e.key === "Tab") {
            var inputs = Array.prototype.slice.call(tr.querySelectorAll(".o-list-inline-input"));
            var idx = inputs.indexOf(e.target);
            if (idx >= 0) {
              e.preventDefault();
              var next = e.shiftKey ? inputs[idx - 1] : inputs[idx + 1];
              if (next && next.focus) next.focus();
            }
          }
        });
        var addBtn = container.querySelector(".o-list-add-line-btn");
        if (addBtn) {
          addBtn.onclick = function () {
            var hasName = cols.some(function (c) {
              return (typeof c === "object" ? c.name : c) === "name";
            });
            if (!hasName) {
              window.location.hash = route + "/new";
              return;
            }
            var tbody = table.querySelector("tbody");
            var tr = document.createElement("tr");
            tr.className = "o-list-data-row o-list-row-editing";
            tr.setAttribute("data-id", "");
            tr.setAttribute("data-inline-edit", "1");
            tr.setAttribute("data-unsaved-new", "1");
            var htmlRow = '<td role="gridcell"><input type="checkbox" class="list-row-select" disabled aria-label="New row"></td>';
            cols.forEach(function (c) {
              var f = typeof c === "object" ? c.name : c;
              if (f === "name") {
                htmlRow +=
                  '<td role="gridcell"><input class="o-list-inline-input" data-field="name" type="text" placeholder="Name" style="width:100%;padding:var(--space-xs)"></td>';
              } else {
                htmlRow += "<td role=\"gridcell\"></td>";
              }
            });
            htmlRow +=
              '<td role="gridcell"><button type="button" class="o-inline-create-btn o-btn o-btn-primary">Create</button> <button type="button" class="o-inline-discard-btn o-btn o-btn-secondary">Discard</button></td>';
            tr.innerHTML = htmlRow;
            tbody.insertBefore(tr, tbody.querySelector(".o-list-add-line"));
            var nameInp = tr.querySelector('input[data-field="name"]');
            if (nameInp && nameInp.focus) nameInp.focus();
            tr.querySelector(".o-inline-discard-btn").onclick = function () {
              tr.remove();
            };
            tr.querySelector(".o-inline-create-btn").onclick = function () {
              var nm = tr.querySelector('input[data-field="name"]');
              var nv = nm && nm.value ? nm.value.trim() : "";
              if (!nv) {
                showToast("Name is required", "error");
                return;
              }
              rpc
                .callKw(model, "create", [[{ name: nv }]], {})
                .then(function () {
                  showToast("Created", "success");
                  var si = container.querySelector("#list-search");
                  h.loadRecords(model, route, si ? si.value.trim() : "", stageFilter, null, currentListState.savedFilterId, 0, limit, h.getHashDomainParam ? h.getHashDomainParam() : undefined);
                })
                .catch(function (err) {
                  showToast(err.message || "Create failed", "error");
                });
            };
          };
        }
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
      var btnPreviewPdf = container.querySelector("#btn-preview-pdf");
      if (btnPreviewPdf && reportName && records && records.length) {
        btnPreviewPdf.onclick = function () {
          var ids = records.map(function (r) { return r.id; }).filter(function (x) { return x; });
          if (!ids.length) return;
          var url = "/report/pdf/" + reportName + "/" + ids.join(",");
          if (UI.PdfViewer && typeof UI.PdfViewer.open === "function") UI.PdfViewer.open(url, "Report Preview");
          else window.open(url, "_blank", "noopener");
        };
      }

      container.querySelectorAll(".btn-delete").forEach(function (a) {
        a.onclick = function (e) {
          e.preventDefault();
          var cm = h.confirmModal || function (o) { return Promise.resolve(window.confirm((o && o.message) || "")); };
          cm({ title: "Delete record", message: "Delete this record?", confirmLabel: "Delete", cancelLabel: "Cancel" }).then(function (ok) {
            if (ok) h.deleteRecord(model, route, a.dataset.id);
          });
        };
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
    setImpl: setImpl,
    render: render,
    renderViewSwitcher: function (route, currentView, helpers) {
      return renderViewSwitcher(route, currentView, helpers);
    },
  };
})();
