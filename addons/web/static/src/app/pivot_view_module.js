/**
 * Phase 756: Pivot matrix + toolbar extracted from main.js.
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
    var rerenderPivot = opts.rerenderPivot;
    if (
      typeof getTitle !== "function" ||
      typeof renderViewSwitcher !== "function" ||
      typeof loadRecords !== "function" ||
      typeof dispatchListActWindowThenFormHash !== "function" ||
      typeof setViewAndReload !== "function" ||
      typeof setListState !== "function" ||
      typeof setActionStack !== "function" ||
      !rpc ||
      typeof rerenderPivot !== "function"
    ) {
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
    (rows || []).forEach(function (r) {
      var rv = r[rowField];
      var cv = r[colField];
      var val = r[measureField] != null ? Number(r[measureField]) : 0;
      if (rv != null && rowVals.indexOf(rv) < 0) rowVals.push(rv);
      if (cv != null && colVals.indexOf(cv) < 0) colVals.push(cv);
      var key = String(rv) + "_" + String(cv);
      matrix[key] = val;
    });
    var rowLabels = rowVals.map(function (v) {
      return rowLabelMap[v] || (v != null ? String(v) : "");
    });
    var colLabels = colVals.map(function (v) {
      return colLabelMap[v] || (v != null ? String(v) : "");
    });
    var rowTotals = {};
    var colTotals = {};
    rowVals.forEach(function (rv) {
      rowTotals[rv] = 0;
    });
    colVals.forEach(function (cv) {
      colTotals[cv] = 0;
    });
    rowVals.forEach(function (rv) {
      colVals.forEach(function (cv) {
        var key = String(rv) + "_" + String(cv);
        var v = matrix[key] || 0;
        rowTotals[rv] += v;
        colTotals[cv] += v;
      });
    });
    var grandTotal = 0;
    Object.keys(matrix).forEach(function (k) {
      grandTotal += matrix[k];
    });
    setActionStack([{ label: title, hash: route }]);
    setListState({ model: model, route: route, searchTerm: searchTerm || "", stageFilter: stageFilter, viewType: "pivot" });
    var pivotAddLabel =
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
                : "Add";
    var html = "<h2>" + title + "</h2>";
    if (window.AppCore && window.AppCore.PivotViewChrome && typeof window.AppCore.PivotViewChrome.buildToolbarHtml === "function") {
      html += window.AppCore.PivotViewChrome.buildToolbarHtml({
        viewSwitcherHtml: renderViewSwitcher(route, "pivot"),
        searchTerm: searchTerm || "",
        model: model,
        addLabel: pivotAddLabel,
      });
    } else {
      html += '<p class="o-pivot-toolbar-fallback" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
      html += renderViewSwitcher(route, "pivot");
      html +=
        '<button type="button" id="btn-pivot-flip" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Flip axes</button>';
      html +=
        '<button type="button" id="btn-pivot-download" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Download CSV</button>';
      html +=
        '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);min-width:200px" value="' +
        (searchTerm || "").replace(/"/g, "&quot;") +
        '">';
      html +=
        '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
      if (model === "crm.lead") {
        html +=
          '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)"><option value="">All stages</option></select>';
      }
      html +=
        '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' +
        pivotAddLabel +
        "</button></p>";
    }
    html += '<div class="o-pivot-container o-card-gradient">';
    html += '<table class="o-pivot-table"><thead><tr><th class="o-pivot-th o-pivot-th--corner"></th>';
    colLabels.forEach(function (l) {
      html += '<th class="o-pivot-th o-pivot-th--measure">' + (l || "").replace(/</g, "&lt;") + "</th>";
    });
    html += '<th class="o-pivot-th o-pivot-th--total">Total</th></tr></thead><tbody>';
    rowVals.forEach(function (rv, ri) {
      html += '<tr><td class="o-pivot-td o-pivot-td--rowhead">' + (rowLabels[ri] || "").replace(/</g, "&lt;") + "</td>";
      colVals.forEach(function (cv) {
        var key = rv + "_" + cv;
        var val = matrix[key] || 0;
        html += '<td class="o-pivot-td o-pivot-td--num">' + (typeof val === "number" ? val.toLocaleString() : val) + "</td>";
      });
      html +=
        '<td class="o-pivot-td o-pivot-td--num o-pivot-td--rowtotal">' + (rowTotals[rv] || 0).toLocaleString() + "</td></tr>";
    });
    html += '<tr><td class="o-pivot-td o-pivot-td--coltotal">Total</td>';
    colVals.forEach(function (cv) {
      html +=
        '<td class="o-pivot-td o-pivot-td--num o-pivot-td--coltotal">' + (colTotals[cv] || 0).toLocaleString() + "</td>";
    });
    html +=
      '<td class="o-pivot-td o-pivot-td--num o-pivot-td--grandtotal">' + grandTotal.toLocaleString() + "</td></tr>";
    html += "</tbody></table></div>";
    main.innerHTML = html;
    main.querySelectorAll(".btn-view").forEach(function (btn) {
      btn.onclick = function () {
        var v = btn.dataset.view;
        if (v) setViewAndReload(route, v);
      };
    });
    var btnAdd = document.getElementById("btn-add");
    if (btnAdd)
      btnAdd.onclick = function () {
        dispatchListActWindowThenFormHash(route, "new", "viewChromeToolbarNew");
      };
    var btnFlip = document.getElementById("btn-pivot-flip");
    if (btnFlip) {
      btnFlip.onclick = function () {
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
      btnDownload.onclick = function () {
        var csv = "," + colLabels.map(function (l) { return '"' + (l || "").replace(/"/g, '""') + '"'; }).join(",") + ',"Total"\n';
        rowVals.forEach(function (rv, ri) {
          csv += '"' + (rowLabels[ri] || "").replace(/"/g, '""') + '"';
          colVals.forEach(function (cv) {
            var key = rv + "_" + cv;
            csv += "," + (matrix[key] || 0);
          });
          csv += "," + (rowTotals[rv] || 0) + "\n";
        });
        csv += '"Total"';
        colVals.forEach(function (cv) {
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
      var doSearch = function () {
        var filterEl = document.getElementById("list-stage-filter");
        var val = model === "crm.lead" && filterEl && filterEl.value ? parseInt(filterEl.value, 10) : null;
        loadRecords(model, route, searchInput.value.trim(), val, "pivot", null, 0, null);
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
      var filterEl2 = document.getElementById("list-stage-filter");
      if (filterEl2) {
        rpc.callKw("crm.stage", "search_read", [[]], { fields: ["id", "name"], order: "sequence" }).then(function (stages) {
          stages.forEach(function (s) {
            var opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.name || "";
            if (s.id === stageFilter) opt.selected = true;
            filterEl2.appendChild(opt);
          });
          filterEl2.onchange = function () {
            var val = filterEl2.value ? parseInt(filterEl2.value, 10) : null;
            loadRecords(model, route, searchInput ? searchInput.value.trim() : "", val, "pivot", null, 0, null);
          };
        });
      }
    }
    return true;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.PivotViewModule = { render: render };
})();
