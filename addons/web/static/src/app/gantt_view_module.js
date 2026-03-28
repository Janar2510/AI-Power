/**
 * Phase 753: Gantt view shell + timeline table extracted from main.js.
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
    var attachActWindowFormLinkDelegation = opts.attachActWindowFormLinkDelegation;
    if (
      typeof getTitle !== "function" ||
      typeof renderViewSwitcher !== "function" ||
      typeof loadRecords !== "function" ||
      typeof dispatchListActWindowThenFormHash !== "function" ||
      typeof setViewAndReload !== "function" ||
      typeof setListState !== "function" ||
      typeof setActionStack !== "function" ||
      typeof attachActWindowFormLinkDelegation !== "function"
    ) {
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
    html +=
      '<div role="search" class="o-gantt-fallback-search"><input type="text" id="list-search" placeholder="Search..." class="o-list-search-field" value="' +
      (searchTerm || "").replace(/"/g, "&quot;") +
      '">';
    html +=
      '<button type="button" id="btn-search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button></div>';
    html +=
      '<button type="button" id="btn-add" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + addLabel + "</button></p>";
    var now = new Date();
    var rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    var totalDays = Math.ceil((rangeEnd - rangeStart) / (24 * 60 * 60 * 1000));
    var dayWidth = 24;
    var timelineWidth = totalDays * dayWidth;
    html +=
      '<div class="gantt-view o-gantt-scroll"><table role="grid" class="o-gantt-table"><thead><tr><th class="o-gantt-th o-gantt-th--name">Name</th><th class="o-gantt-th o-gantt-th--timeline" style="min-width:' +
      timelineWidth +
      'px">' +
      rangeStart.toLocaleDateString(undefined, { month: "short", year: "numeric" }) +
      " – " +
      rangeEnd.toLocaleDateString(undefined, { month: "short", year: "numeric" }) +
      "</th></tr></thead><tbody>";
    (records || []).forEach(function (r) {
      var startVal = r[dateStart];
      var stopVal = r[dateStop];
      var startDate = startVal ? new Date(startVal) : rangeStart;
      var stopDate = stopVal ? new Date(stopVal) : startVal ? new Date(startVal) : rangeEnd;
      var left = Math.max(0, Math.floor((startDate - rangeStart) / (24 * 60 * 60 * 1000)) * dayWidth);
      var width = Math.max(dayWidth, Math.ceil((stopDate - startDate) / (24 * 60 * 60 * 1000)) * dayWidth);
      var name = (r.name || "—").replace(/</g, "&lt;");
      html +=
        '<tr><td class="o-gantt-td o-gantt-td--name"><a href="#' +
        route +
        "/edit/" +
        (r.id || "") +
        '" class="o-erp-actwindow-form-link" data-edit-id="' +
        (r.id || "") +
        '">' +
        name +
        '</a></td><td class="o-gantt-td o-gantt-td--timeline" style="min-width:' +
        timelineWidth +
        'px"><div class="o-gantt-bar" style="left:' +
        left +
        "px;width:" +
        width +
        'px" title="' +
        String(startVal || "").replace(/"/g, "&quot;") +
        " – " +
        String(stopVal || "").replace(/"/g, "&quot;") +
        '"></div></td></tr>';
    });
    html += "</tbody></table></div>";
    if (!records || !records.length) {
      html = html.replace("</div>", '<p class="o-gantt-empty">No records with dates.</p></div>');
    }
    main.innerHTML = html;
    setListState({ model: model, route: route, searchTerm: searchTerm || "", viewType: "gantt" });
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
    var btnSearch = document.getElementById("btn-search");
    var searchInput = document.getElementById("list-search");
    if (btnSearch && searchInput) {
      var doSearch = function () {
        loadRecords(model, route, searchInput.value.trim(), null, "gantt", null, 0, null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) {
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
  window.AppCore.GanttViewModule = { render: render };
})();
