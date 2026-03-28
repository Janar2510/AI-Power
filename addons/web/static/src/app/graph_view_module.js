/**
 * Phase 754: Graph view + Chart.js orchestration extracted from main.js.
 */
(function () {
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
    var getListState = opts.getListState || function () {
      return {};
    };
    var rpc = opts.rpc;
    var rerenderGraph = opts.rerenderGraph;
    if (
      typeof getTitle !== "function" ||
      typeof renderViewSwitcher !== "function" ||
      typeof loadRecords !== "function" ||
      typeof dispatchListActWindowThenFormHash !== "function" ||
      typeof setViewAndReload !== "function" ||
      typeof setListState !== "function" ||
      typeof setActionStack !== "function" ||
      !rpc ||
      typeof rerenderGraph !== "function"
    ) {
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
    var labels = (rows || []).map(function (r) {
      var v = r[groupbyField];
      return labelMap && v != null && labelMap[v] ? labelMap[v] : v != null ? String(v) : "";
    });
    var datasets = measureFields.map(function (m, idx) {
      var colors = ["rgba(26,26,46,0.8)", "rgba(70,130,180,0.8)", "rgba(34,139,34,0.8)", "rgba(218,165,32,0.8)"];
      return {
        label: m.replace(/_/g, " ").replace(/\b\w/g, function (c) {
          return c.toUpperCase();
        }),
        data: (rows || []).map(function (r) {
          return r[m] != null ? Number(r[m]) : 0;
        }),
        backgroundColor: colors[idx % colors.length],
        borderColor: colors[idx % colors.length].replace("0.8", "1"),
        borderWidth: 1,
      };
    });
    var html = "<h2>" + title + "</h2>";
    if (window.AppCore && window.AppCore.GraphViewChrome && typeof window.AppCore.GraphViewChrome.buildToolbarHtml === "function") {
      html += window.AppCore.GraphViewChrome.buildToolbarHtml({
        viewSwitcherHtml: renderViewSwitcher(route, currentView),
        graphType: graphType,
        searchTerm: searchTerm || "",
        model: model,
        addLabel:
          route === "contacts"
            ? "Add contact"
            : route === "leads"
              ? "Add lead"
              : route === "orders"
                ? "Add order"
                : route === "products"
                  ? "Add product"
                  : route === "settings/users"
                    ? "Add user"
                    : "Add",
      });
    } else {
      html += '<p class="o-graph-toolbar-fallback" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
      html += renderViewSwitcher(route, currentView);
      html += '<span class="graph-type-switcher" style="display:inline-flex;gap:2px;margin-right:0.5rem">';
      ["bar", "line", "pie"].forEach(function (t) {
        var active = t === graphType;
        html +=
          '<button type="button" class="btn-graph-type' +
          (active ? " active" : "") +
          '" data-type="' +
          t +
          '" style="padding:0.35rem 0.6rem;border:1px solid #ddd;background:' +
          (active ? "#1a1a2e;color:white;border-color:#1a1a2e" : "#fff;color:#333") +
          ';border-radius:4px;cursor:pointer;font-size:0.9rem">' +
          (t.charAt(0).toUpperCase() + t.slice(1)) +
          "</button>";
      });
      html += "</span>";
      html +=
        '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' +
        (searchTerm || "").replace(/"/g, "&quot;") +
        '">';
      html +=
        '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
      if (model === "crm.lead") {
        html +=
          '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">All stages</option></select>';
      }
      html +=
        '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Add lead</button></p>';
    }
    html += '<div class="o-graph-container">';
    html += '<canvas id="graph-canvas"></canvas>';
    html += "</div>";
    main.innerHTML = html;
    setListState({ model: model, route: route, searchTerm: searchTerm || "", stageFilter: stageFilter, viewType: "graph" });
    main.querySelectorAll(".btn-view").forEach(function (btn) {
      btn.onclick = function () {
        var v = btn.dataset.view;
        if (v) setViewAndReload(route, v);
      };
    });
    main.querySelectorAll(".btn-graph-type").forEach(function (btn) {
      btn.onclick = function () {
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
      btnAdd.onclick = function () {
        dispatchListActWindowThenFormHash(route, "new", "viewChromeToolbarNew");
      };
    var btnSearch = document.getElementById("btn-search");
    var searchInput = document.getElementById("list-search");
    if (btnSearch && searchInput) {
      var doSearch = function () {
        var filterEl = document.getElementById("list-stage-filter");
        var val = model === "crm.lead" && filterEl && filterEl.value ? parseInt(filterEl.value, 10) : null;
        loadRecords(model, route, searchInput.value.trim(), val, "graph", null, 0, null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          doSearch();
        }
      };
    }
    if (model === "crm.lead") {
      var filterEl = document.getElementById("list-stage-filter");
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
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: graphType !== "pie" ? { y: { beginAtZero: true } } : {},
      },
    };
    if (graphType === "pie" && datasets.length > 1) {
      chartConfig.data.datasets = [
        {
          label: measureFields[0],
          data: datasets[0].data,
          backgroundColor: datasets[0].backgroundColor,
          borderColor: datasets[0].borderColor,
          borderWidth: 1,
        },
      ];
    }
    new window.Chart(ctx, chartConfig);
    return true;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.GraphViewModule = { render: render };
})();
