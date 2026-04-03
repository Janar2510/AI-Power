/**
 * Phase 747: extracted kanban shell + ViewRenderers wiring from main.js.
 */
(function () {
  function render(main, opts) {
    opts = opts || {};
    if (!main || !opts.model || !opts.route) return false;
    if (!window.ViewRenderers || typeof window.ViewRenderers.kanban !== "function") return false;
    var getTitle = opts.getTitle;
    var renderViewSwitcher = opts.renderViewSwitcher;
    var dispatchListActWindowThenFormHash = opts.dispatchListActWindowThenFormHash;
    var loadRecords = opts.loadRecords;
    var rpc = opts.rpc;
    var showToast = opts.showToast || function () {};
    var viewsSvc = opts.viewsSvc;
    var model = opts.model;
    var route = opts.route;
    var records = opts.records || [];
    var searchTerm = opts.searchTerm || "";
    if (typeof getTitle !== "function" || typeof renderViewSwitcher !== "function" || typeof loadRecords !== "function" || typeof dispatchListActWindowThenFormHash !== "function" || !rpc) {
      return false;
    }
    var getListState = opts.getListState || function () {
      return {};
    };
    var setListState = opts.setListState;
    var setActionStack = opts.setActionStack;
    if (typeof setListState !== "function" || typeof setActionStack !== "function") return false;

    var title = getTitle(route);
    setActionStack([{ label: title, hash: route }]);
    var addLabel =
      route === "leads"
        ? "Add lead"
        : route === "tickets"
          ? "Add ticket"
          : route === "orders"
            ? "Add order"
            : route === "products"
              ? "Add product"
              : route === "settings/users"
                ? "Add user"
                : "Add";
    var prevState = getListState();
    var stageFilter = prevState.route === route ? prevState.stageFilter : null;
    var currentView = (prevState.route === route && prevState.viewType) || "kanban";
    var kanbanView = viewsSvc && viewsSvc.getView(model, "kanban");
    var vs = renderViewSwitcher(route, currentView);
    var mid =
      model === "crm.lead" || model === "helpdesk.ticket"
        ? '<select id="list-stage-filter" class="o-list-toolbar-select"><option value="">All stages</option></select>'
        : "";
    var KS = window.AppCore && window.AppCore.KanbanControlStrip;
    var html =
      KS && typeof KS.buildKanbanChromeHtml === "function"
        ? KS.buildKanbanChromeHtml({
            title: title,
            viewSwitcherHtml: vs,
            searchTerm: searchTerm || "",
            addLabel: addLabel,
            middleSlotHtml: mid,
          })
        : "<h2>" +
          title +
          '</h2><p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">' +
          vs +
          '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);min-width:200px" value="' +
          (searchTerm || "").replace(/"/g, "&quot;") +
          '"><button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>' +
          mid +
          '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' +
          addLabel +
          "</button></p><div id=\"kanban-area\"></div>";
    main.innerHTML = html;
    setListState({
      model: model,
      route: route,
      searchTerm: searchTerm || "",
      stageFilter: stageFilter,
      viewType: currentView,
    });
    main.querySelectorAll(".btn-view").forEach(function (btn) {
      btn.onclick = function () {
        var v = btn.dataset.view;
        if (v) opts.setViewAndReload(route, v);
      };
    });
    var btn = document.getElementById("btn-add");
    if (btn)
      btn.onclick = function () {
        dispatchListActWindowThenFormHash(route, "new", "kanbanToolbarNew");
      };
    var btnSearch = document.getElementById("btn-search");
    var searchInput = document.getElementById("list-search");
    if (btnSearch && searchInput) {
      var doSearch = function () {
        var filterEl = document.getElementById("list-stage-filter");
        var val = filterEl && filterEl.value ? parseInt(filterEl.value, 10) : null;
        loadRecords(model, route, searchInput.value.trim(), val);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) {
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
        rpc.callKw(stageModel, "search_read", [[]], { fields: ["id", "name"], order: "sequence" }).then(function (stages) {
          stages.forEach(function (s) {
            var opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.name || "";
            if (s.id === stageFilter) opt.selected = true;
            filterEl.appendChild(opt);
          });
          filterEl.onchange = function () {
            var val = filterEl.value ? parseInt(filterEl.value, 10) : null;
            loadRecords(model, route, searchInput.value.trim(), val);
          };
        });
      }
    }
    var groupBy = (kanbanView && kanbanView.default_group_by) || "stage_id";
    var stageIds = [];
    (records || []).forEach(function (r) {
      var val = r[groupBy];
      var id = val && (Array.isArray(val) ? val[0] : val);
      id = id === 0 ? 0 : id;
      if (id != null) stageIds.push(id);
    });
    var uniq = stageIds.filter(function (x, i, a) {
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
      fields: (kanbanView && kanbanView.fields) || ["name", "expected_revenue", "date_deadline"],
      stageNames: nameMap,
      onCardClick: function (id) {
        dispatchListActWindowThenFormHash(route, "edit/" + id, "kanbanCardOpenForm");
      },
      onStageChange: function (recordId, newStageId) {
        var stageVal = newStageId || false;
        var writeVal = {};
        writeVal[groupBy] = stageVal;
        rpc
          .callKw(model, "write", [[parseInt(recordId, 10)], writeVal])
          .then(function () {
            return loadRecords(model, route, getListState().searchTerm);
          })
          .catch(function (err) {
            showToast(err.message || "Failed to update", "error");
          });
      },
      onQuickCreate: function (stageId, name, done) {
        var vals = { name: name };
        vals[groupBy] = stageId || false;
        rpc
          .callKw(model, "create", [[vals]], {})
          .then(function () {
            showToast("Created", "success");
            if (typeof done === "function") done();
            return loadRecords(model, route, getListState().searchTerm);
          })
          .catch(function (err) {
            showToast(err.message || "Failed to create", "error");
          });
      },
    };
    if (comodel && uniq.length) {
      rpc
        .callKw(comodel, "search_read", [[]], { fields: ["id", "name"], order: "sequence" })
        .then(function (stages) {
          stages.forEach(function (s) {
            nameMap[s.id] = s.name;
          });
          baseOpts.stageNames = nameMap;
          renderKanbanWithOptions(baseOpts);
        })
        .catch(function () {
          renderKanbanWithOptions(baseOpts);
        });
    } else if (uniq.length || groupBy) {
      uniq.forEach(function (id) {
        if (id && !nameMap[id]) nameMap[id] = "Stage " + id;
      });
      baseOpts.stageNames = nameMap;
      renderKanbanWithOptions(baseOpts);
    } else {
      renderKanbanWithOptions({
        default_group_by: groupBy,
        stageNames: {},
        onCardClick: baseOpts.onCardClick,
        onQuickCreate: baseOpts.onQuickCreate,
      });
    }
    return true;
  }

  // ── Kanban view helper functions (Phase 1.250.17) ────────────────────────
  // Canonical kanban grouping + drag-drop stub; main.js delegates via
  // window.AppCore.KanbanViewModule.helpers.

  var _kanbanViewsSvc = null;
  var _kanbanRpc = null;

  function _configureKanbanHelpers(opts) {
    if (opts.viewsSvc) _kanbanViewsSvc = opts.viewsSvc;
    if (opts.rpc) _kanbanRpc = opts.rpc;
  }

  /**
   * Return the groupBy field for kanban (from view registry or model fallback).
   * @param {string} model
   * @returns {string|null}
   */
  function getKanbanGroupBy(model) {
    if (_kanbanViewsSvc && model) {
      var v = _kanbanViewsSvc.getView(model, "kanban");
      if (v && v.group_by) return v.group_by;
    }
    if (model === "crm.lead") return "stage_id";
    if (model === "helpdesk.ticket") return "stage_id";
    if (model === "project.task") return "stage_id";
    return null;
  }

  /**
   * Group a flat array of records by a field value.
   * @param {Object[]} records
   * @param {string} field
   * @returns {{ key: string, label: string, records: Object[] }[]}
   */
  function groupRecordsByField(records, field) {
    var groups = {};
    var order = [];
    (records || []).forEach(function (rec) {
      var raw = rec[field];
      var key, label;
      if (Array.isArray(raw)) {
        key = String(raw[0] != null ? raw[0] : "__none__");
        label = raw[1] != null ? String(raw[1]) : "(none)";
      } else if (raw != null) {
        key = String(raw);
        label = key;
      } else {
        key = "__none__";
        label = "(none)";
      }
      if (!groups[key]) {
        groups[key] = { key: key, label: label, records: [] };
        order.push(key);
      }
      groups[key].records.push(rec);
    });
    return order.map(function (k) { return groups[k]; });
  }

  /**
   * Drag-drop stub: registers drag/drop handlers on kanban column cards.
   * Real DnD is deferred to Phase 1.250.18; this ensures the DOM is ready.
   * @param {HTMLElement} container
   * @param {Function} onDrop  callback(recordId, newGroupKey)
   */
  function wireKanbanDragDrop(container, onDrop) {
    if (!container || typeof onDrop !== "function") return;
    var cards = container.querySelectorAll("[data-kanban-record-id]");
    cards.forEach(function (card) {
      card.setAttribute("draggable", "true");
      card.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", card.getAttribute("data-kanban-record-id") || "");
        card.classList.add("o-kanban-dragging");
      });
      card.addEventListener("dragend", function () {
        card.classList.remove("o-kanban-dragging");
      });
    });
    var columns = container.querySelectorAll("[data-kanban-group-key]");
    columns.forEach(function (col) {
      col.addEventListener("dragover", function (e) { e.preventDefault(); col.classList.add("o-kanban-dragover"); });
      col.addEventListener("dragleave", function () { col.classList.remove("o-kanban-dragover"); });
      col.addEventListener("drop", function (e) {
        e.preventDefault();
        col.classList.remove("o-kanban-dragover");
        var id = e.dataTransfer.getData("text/plain");
        var groupKey = col.getAttribute("data-kanban-group-key");
        if (id && groupKey) onDrop(id, groupKey);
      });
    });
  }

  var kanbanHelpers = {
    getKanbanGroupBy: getKanbanGroupBy,
    groupRecordsByField: groupRecordsByField,
    wireKanbanDragDrop: wireKanbanDragDrop,
    configure: _configureKanbanHelpers,
  };

  window.AppCore = window.AppCore || {};
  window.AppCore.KanbanViewModule = {
    render: render,
    helpers: kanbanHelpers,
  };
})();
